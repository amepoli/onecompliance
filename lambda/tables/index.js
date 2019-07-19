var pg = require("pg");

const Pool = require('pg-pool');
const pool = new Pool({
    host: 'goricotest.caxbbckt9xen.eu-central-1.rds.amazonaws.com',
    database: 'GoRiCo',
    user: 'postgres',
    password: 'et2themax',
    port: 5432,
    max: 1,
    min: 0,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 1000
});

const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-central-1' });
const dynamo = new AWS.DynamoDB.DocumentClient();

function replaceKeys(queryString, keys, keyTypes) {

    var delimiters = ['$', '€'];
    if (queryString) {
        for (var key in keys) {
            for (var delimiter in delimiters) {
                let keyType = keyTypes.find(e => (e.key === key));
                if (typeof keys[key] === 'object') { // key with multiple subkeys
                    // tslint:disable-next-line:forin
                    for (var subkey in keys[key]) {
                        let subKeyType = keyType.dataType.find(e => (e.key === subkey));
                        let bracket = (delimiter === '$' && subKeyType && subKeyType.dataType === 'text') ? '\'' : '';
                        let toReplace = delimiter + key + '.' + subkey + delimiter;
                        let replacement = bracket + keys[key][subkey] + bracket;
                        let newString = queryString.replace(toReplace, replacement);
                        while (newString !== queryString) { // handle multiple occurences
                            queryString = newString;
                            newString = queryString.replace(toReplace, replacement);
                        }
                    }
                } else {
                    let bracket = (delimiter === '$' && keyType && keyType.dataType === 'text') ? '\'' : '';
                    let toReplace = delimiter + key + delimiter;
                    // TO BE CHECKED
                    //let replacement = keys[key].value ? keys[key].value : keys[key]; // handle subtables
                    let replacement = bracket + keys[key] + bracket;
                    let newString = queryString.replace(toReplace, replacement);
                    while (newString !== queryString) { // handle multiple occurences
                        queryString = newString;
                        newString = queryString.replace(toReplace, replacement);
                    }
                }
            }
        }
    }
    return queryString;
}

// build the Postgresql query from parameters
function getTableQuery(entry_params, table_keys, isForm) {

    if (entry_params.query) {  // pre-defined query
        return { mainQuery: entry_params.query, comboQueries: [] };
    }

    var comboQueries = [];

    var entry_keys;
    if (isForm) {
        entry_keys = entry_params.form_keys;
    } else {
        entry_keys = entry_params.table_keys;
    }
    if (!entry_keys) return '';

    var queryString = 'SELECT ';
    var comma = ''; // first entry has no comma 

    entry_keys.forEach(element => {

        if (!element.key) continue;
        var fieldString = comma + element.key;
        if (!isForm && element.hasOwnProperty('queryFunct')) { // overridden by funct
            keyTypes = entry_keys.map(k => {
                let dataType = k.subKeys ? k.subKeys : k.dataType;
                return {key: k.key, dataType: dataType}; 
            });
            fieldString = comma + replaceKeys(element.queryFunct, table_keys, keyTypes);
        }
        if (isForm) { // check if combobox, then save query fields for later processing
            if (element.format.viewType === 'combobox') {
                const comboQuery = element.format.comboQuery;
                if (comboQuery) {
                    comboQueries.push({ key: key, comboQuery: comboQuery });
                }
                continue; // this key does not concurr to the main query
            }
        }
        queryString = queryString + fieldString;
        comma = ','; // needed only the first time
    });

    if (entry_keys.origin) {
        queryString = queryString + ' FROM ' + entry_keys.origin;
    } else {
        return { mainQuery: '', comboQueries: [] }; // Huston, we have a problem
    }

    comma = ' WHERE ';

    for (const key in table_keys) {
        if (table_keys.hasOwnProperty(key)) {
            const element = table_keys[key];
            var fieldString = comma + key + '=' + element;
            queryString = queryString + fieldString;
            comma = ','; // needed only the first time
        }
    }

    return { mainQuery: queryString, comboQueries: comboQueries };

};

exports.handler = async (event, context) => {

    const queryParams = event.queryStringParameters;

    const DynamoParams = {
        TableName: 'views',
        Key: {
            entryKey: queryParams['entry_name']
        }
    };

    var searchKeys = queryParams['search_keys'];
    var isSearchRequest = searchKeys ? true : false;

    var isNewRecord = (queryParams['new'] === '1');

    var isFormRecord = (queryParams['form'] === '1');

    var table_keys = queryParams['key'];

    var queryData;

    try {
        // read the entry params from DynamoDB
        let entry_params = await dynamo.get(DynamoParams).promise();

        let queryString;

        if (isSearchRequest) {
            queryString = getSearchQuery(entry_params, table_keys, search_keys);
        } else if (isNewRecord) {
            queryString = getNewQuery(entry_params, table_keys);
        } else if (isFormRecord) {
            queryString = getTableQuery(entry_params, table_keys, true);
        } else { // table query
            queryString = getTableQuery(entry_params, table_keys, false);
        }

        let client = await pool.connect();
        if (queryString.mainQuery && queryString.mainQuery !== '') {
            queryData = await client.query(queryString.mainQuery);
        }

        queryString.comboQueries.forEach(element => {
            let query = element.comboQuery;
            let comboData = await client.query(query);
            let comboEntry = new Object;
            comboEntry[element.key] = comboData;
            Object.assign(queryData, comboEntry);
        });

    } catch (e) {
        console.log(e);
        return {
            statusCode: 500
        }
    }


    return {
        statusCode: 200,
        body: JSON.stringify(queryData)
    };
};
