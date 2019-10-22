const Pool = require('pg-pool');
const pool = new Pool({
    host: 'goricotest-new.caxbbckt9xen.eu-central-1.rds.amazonaws.com',
    database: 'Gorico',
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

function replaceLocalKeys(queryString, keys){
    let delimiter = '£';
    for (var key in keys) {
        let toReplace = delimiter + key + delimiter;
        let replacement = keys[key];
        let newString = queryString.replace(toReplace, replacement);
        while (newString !== queryString) { // handle multiple occurences
            queryString = newString;
            newString = queryString.replace(toReplace, replacement);
        }
    }
    return queryString;
}

function replaceKeys(queryString, keys, keyTypes) {

    console.log(keys);
    var delimiters = ['$', '€'];
    if (queryString) {
        for (var key in keys) {
            delimiters.forEach(delimiter => {
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
            });
        }
    }
    return queryString;
}

function getKeyTypes(entry_keys) {
    let keyTypes = entry_keys.map(k => {
        let dataType = k.subKeys ? k.subKeys : (k.format.dataType ? k.format.dataType : '');
        return {key: k.key, dataType: dataType, isPrimary: k.isPrimary}; 
    });
    return keyTypes;
}

// build the Postgresql query from parameters
function getTableQuery(entry_params, table_keys, isForm, search_keys) {

    let comboQueries = [];
    
    let preProcessQueries = [];
    
    let postProcessQueries = [];

    let entry_keys;
    if (isForm) {
        entry_keys = entry_params.form_keys;
    } else {
        entry_keys = entry_params.table_keys;
    }
        
    if (!entry_keys) return '';
    
    let keyTypes = getKeyTypes(entry_keys);
    
    // process pre-defined queries for table/form view, if any

    if (entry_params.predefinedQueries) {  
        let mainQuery;
        entry_params.predefinedQueries.forEach(query => {
            if ((isForm && query.operation === "selectForm") || (!isForm && query.operation === "selectTable")) {
                if (query.type === "main" && search_keys == null) { 
                    mainQuery = replaceKeys(query.queryString, table_keys, keyTypes); // only one main query allowed
                } else if (query.type === "search" && search_keys != null) { 
                    mainQuery = replaceKeys(query.queryString, table_keys, keyTypes); // only one main query allowed
                } else if (query.type === "preProcessing") { 
                    preProcessQueries.push(replaceKeys(query.queryString, table_keys, keyTypes));
                } else if (query.type === "postProcessing") { 
                    postProcessQueries.push(replaceKeys(query.queryString, table_keys, keyTypes));
                }
            }
        });
        if (mainQuery) { // no need to further build main query, stop here
            return { mainQuery: mainQuery , comboQueries: [], preProcessQueries: preProcessQueries, postProcessQueries: postProcessQueries};
        
        }
    }

    // automatic build of main query
    
    let queryString = 'SELECT ';
    let comma = ''; // first entry has no comma 


    entry_keys.forEach(element => {
        
        if (!element.key) {
            return;
        }
        let fieldString = comma + element.key;
        if (!isForm && element.hasOwnProperty('queryFunct')) { // overridden by funct
            fieldString = comma + replaceKeys(element.queryFunct, table_keys, keyTypes) + ' AS ' + element.key;
        }
        if (isForm) { // check if combobox, then save query fields for later processing
            if (element.format.viewType === 'combobox') {
                let comboQuery = element.format.comboQuery;
                if (comboQuery) {
                    comboQuery = replaceKeys(comboQuery, table_keys, keyTypes);
                    comboQueries.push({ key: element.key, comboQuery: comboQuery });
                }
            }
        } 
        queryString = queryString + fieldString;
        comma = ','; // needed only the first time
    });

    if (entry_params.origin) {
        queryString = queryString + ' FROM ' + entry_params.origin;
    } else {  // no underlying table, skip building of main query, still there might be some combos
        return { mainQuery: null, comboQueries: comboQueries, preProcessQueries: preProcessQueries, postProcessQueries: postProcessQueries}; 
    }

    comma = ' WHERE ';

    for (const key in table_keys) {
        if (table_keys.hasOwnProperty(key)) {
            let keyType = keyTypes.find(e => (e.key === key));
            let delimiter = (keyType.dataType === 'text') ? '\'' : '';
            let element = table_keys[key];
            let fieldString = comma + key + '=' + delimiter + element + delimiter;
            queryString = queryString + fieldString;
            comma = ' AND '; // needed only the first time
        }
    }
    
    if (search_keys) {
        
        let search_params = entry_params.search_keys;
        let search_types = search_params.map(k => {
                let dataType = k.format.dataType ? k.format.dataType : '';
                return {key: k.fieldName, dataType: dataType}; 
            });
    
        for (const key in search_keys) {
            if (search_keys.hasOwnProperty(key)) {
                let search_param = search_params.find(s => (s.fieldName === key));
                if (search_param != null && search_param.queryCond != null) {
                    let fieldString = replaceKeys(search_param.queryCond, search_keys, search_types);
                    queryString = queryString + comma + fieldString;
                    comma = ' AND '; // needed only the first time if no table_
                }
            }
        }
    }
    
    queryString = queryString + ';';
    
    if (!isForm && entry_params.search_keys) { // in case of full table -> fill comboboxes of search form, if any
        let search_params = entry_params.search_keys;
        search_params.forEach(element => {
            // check if the search key is part of the table keys set
            let found = entry_keys.find(e => e.key === element.key);
            if (found == null) return;
            // check if is combobox
            let comboQuery = element.format.comboQuery;
            if (comboQuery) {
                comboQuery = replaceKeys(comboQuery, table_keys, keyTypes);
                comboQueries.push({ key: element.fieldName, comboQuery: comboQuery });
            }
        });
    }

    return { mainQuery: queryString, comboQueries: comboQueries, preProcessQueries: preProcessQueries, postProcessQueries: postProcessQueries };

}

function getNewQuery(entry_params, table_keys) {
    
   let entry_keys = entry_params.form_keys;
   
   let mqString = '';
   
   let defaultValues = {};
   
   let comboQueries = [];
   
   let keyTypes = getKeyTypes(entry_keys);
   
   entry_keys.forEach(element => {
        if (element.autoGenerate && element.autoGenerate === true && element.format.dataType === 'number') {  // there should be only one entry, otherwise last one dominates 
            mqString = 'SELECT (MAX(' + element.key + ')+1) AS ' + element.key + ' FROM ' + entry_params.origin;
            let  comma = ' WHERE ';
            for (const key in table_keys) {
                if (table_keys.hasOwnProperty(key)) {
                    let keyType = keyTypes.find(e => (e.key === key));
                    if (!keyType.isPrimary) continue; // avoid to add subtables foreing keys to the WHERE condition
                    let delimiter = (keyType.dataType === 'text') ? '\'' : '';
                    let element = table_keys[key];
                    let fieldString = comma + key + '=' + delimiter + element + delimiter;
                    mqString = mqString + fieldString;
                    comma = ' AND '; // needed only the first time
                }   
            }
        }  else { // set other keys' values and check for combobox queries
            let obj = new Object;
            if (table_keys[element.key]) {
                obj[element.key] = table_keys[element.key];
            } else if (element.format.hasOwnProperty('value')) {
                obj[element.key] = element.format.value;
            } else {
                obj[element.key] = '';
            }
            Object.assign(defaultValues, obj);
            let comboQuery = element.format.comboQuery;
            if (comboQuery) {
                comboQuery = replaceKeys(comboQuery, table_keys, keyTypes);
                comboQueries.push({ key: element.key, comboQuery: comboQuery });
            }
        }
        
   });
 
    return { mainQuery: mqString, comboQueries: comboQueries, preProcessQueries: [], postProcessQueries: [], defaultValues: defaultValues };
}

function getInsertUpdateQuery(entry_params, table_keys, body, newRecord) {
    
    let entry_keys = entry_params.form_keys;
    
    if (!entry_keys) return '';
    
    let preProcessQueries = [];
    
    let postProcessQueries = [];

    let keyTypes = getKeyTypes(entry_keys);
    
    // process pre-defined queries for table/form view, if any

    if (entry_params.predefinedQueries) {  
        let mainQuery;
        entry_params.predefinedQueries.forEach(query => {
            if ((newRecord && query.operation === "insert") || (!newRecord && query.operation === "update")) {
                if (query.type === "main") { 
                    mainQuery = replaceKeys(query.queryString, body, keyTypes); // only one main query allowed, last one wins
                } else if (query.type === "preProcessing") { 
                    preProcessQueries.push(replaceKeys(query.queryString, body, keyTypes));
                } else if (query.type === "postProcessing") { 
                    postProcessQueries.push(replaceKeys(query.queryString, body, keyTypes));
                }
            }
        });
        if (mainQuery) { // no need to further build main query, stop here
            return { mainQuery: mainQuery , comboQueries: [], preProcessQueries: preProcessQueries, postProcessQueries: postProcessQueries};
        }
    }

    // automatic build of main query
    
    let queryString = newRecord ? 'INSERT INTO ' + entry_params.origin + ' (' : 'UPDATE ' + entry_params.origin + ' SET ';
    
    let comma = ''; // first entry has no comma 
    
    let values = {};
    
    entry_keys.forEach(element => {
        
        if (!element.key) {
            return;
        } 
        
        let value;
        
        if (!body[element.key]) {  // no value passed for the key
            if (element.format.value) {
                value = element.format.value; // use default value 
            } else {
                return;   // no value passed and no default, skip the key
            }
        } else {
            value = body[element.key];
        }
        
        queryString = queryString + comma + element.key;
        values[element.key] = value;
        if (!newRecord) { // values set immediately for UPDATE, later in the query for INSERT
            let keyType = keyTypes.find(e => (e.key === element.key));
            let delimiter = (keyType.dataType === 'text') ? '\'' : '';
            if (value.id) { // combobox 
                value = value.id;
            }
            queryString = queryString + '=' + delimiter + value + delimiter;
        }
        comma = ', ';
    });
    
    if (newRecord) { // complete the INSERT query
        comma = ') VALUES (';
        for (const key in values) {
            let keyType = keyTypes.find(e => (e.key === key));
            let delimiter = (keyType.dataType === 'text') ? '\'' : '';
            let value = values[key];
            if (value.id) { // combobox 
                value = value.id;
            }
            let fieldString = comma + delimiter + value + delimiter;
            queryString = queryString + fieldString;
            comma = ', '; // needed only the first time
        }
    } else { // add WHERE conditions to UPDATE query
         comma = ' WHERE ';
         for (const key in table_keys) {
            if (table_keys.hasOwnProperty(key)) {
                let keyType = keyTypes.find(e => (e.key === key));
                let delimiter = (keyType.dataType === 'text') ? '\'' : '';
                let element = table_keys[key];
                let fieldString = comma + key + '=' + delimiter + element + delimiter;
                queryString = queryString + fieldString;
                comma = ' AND '; // needed only the first time
            }
        }
    }

    
    queryString = newRecord ? queryString + ');' : queryString + ';';
    
   return { mainQuery: queryString, comboQueries: [], preProcessQueries: preProcessQueries, postProcessQueries: postProcessQueries};
    
}

function getDeleteQuery(entry_params, table_keys) {
    
    let preProcessQueries = [];
    
    let postProcessQueries = [];
        
    let entry_keys = entry_params.form_keys;
    
    let keyTypes = getKeyTypes(entry_keys);
    
    
    // process pre-defined queries for table/form view, if any

    if (entry_params.predefinedQueries) {  
        let mainQuery;
        entry_params.predefinedQueries.forEach(query => {
            if (query.operation === "delete") {
                if (query.type === "main") { 
                    mainQuery = replaceKeys(query.queryString, table_keys, keyTypes); // only one main query allowed
                } else if (query.type === "preProcessing") { 
                    preProcessQueries.push(replaceKeys(query.queryString, table_keys, keyTypes));
                } else if (query.type === "postProcessing") { 
                    postProcessQueries.push(replaceKeys(query.queryString, table_keys, keyTypes));
                }
            }
        });
        if (mainQuery) { // no need to further build main query, stop here
            return { mainQuery: mainQuery , preProcessQueries: preProcessQueries, postProcessQueries: postProcessQueries};
        }
    }

    // automatic build of main query
    
    let queryString = 'DELETE FROM ' + entry_params.origin;

    let comma = ' WHERE ';

    for (const key in table_keys) {
        if (table_keys.hasOwnProperty(key)) {
            let keyType = keyTypes.find(e => (e.key === key));
            let delimiter = (keyType.dataType === 'text') ? '\'' : '';
            let element = table_keys[key];
            let fieldString = comma + key + '=' + delimiter + element + delimiter;
            queryString = queryString + fieldString;
            comma = ' AND '; // needed only the first time
        }
    }
    
    return { mainQuery: queryString, comboQueries: [], preProcessQueries: preProcessQueries, postProcessQueries: postProcessQueries };
    
}

async function processPreMainPost(queryString, client, notFullTable) {
    
        let local_keys = {}; // additional keys generated with pre-main-post processing  
        let queryData = {};
        
        console.log('queryString : ', queryString);
        
        // pre-processing
        if (queryString.preProcessQueries.length) { 
            for (let index = 0; index < queryString.preProcessQueries.length; index++) {
                let query = queryString.preProcessQueries[index];
                query = replaceLocalKeys(query, local_keys);
                let result = await client.query(query);
                result = notFullTable ? result.rows[0] : result.rows;
                if (result !== null) { // add resulting keys to the list of local keys if any
                    local_keys = Object.assign(local_keys, result);
                }
                console.log('Pre query : ', query, ' result : ', result);
            }
        } 
        
        // main query
        if (queryString.mainQuery != null && queryString.mainQuery !== '') {
            let query = replaceLocalKeys(queryString.mainQuery, local_keys);
            queryData = await client.query(query);
            queryData = notFullTable ? queryData.rows[0] : queryData.rows;
        }
        
        console.log('Main Query Data : ', queryData);
        
        // post-processing
        if (queryString.postProcessQueries.length) { // post-processing 
            for (let index = 0; index < queryString.postProcessQueries.length; index++) {
                let query = queryString.postProcessQueries[index];
                query = replaceLocalKeys(query, local_keys);
                let result = await client.query(query);
                result = notFullTable ? result.rows[0] : result.rows;
                if (result !== null) { // add resulting keys to the list of local keys if any
                    local_keys = Object.assign(local_keys, result);
                }
                console.log('Post query : ', query, ' result : ', result);
            }
        }
        
        
        return queryData;
}

exports.handler = async (event, context) => {

    const queryParams = event.queryStringParameters;
    
    const method = event.httpMethod;
    
    console.log('queryParams : ', queryParams);

    const DynamoParams = {
        TableName: 'views',
        Key: {
            entryKey: queryParams['entry_name']
        }
    };
    
    var search_keys = queryParams['search_keys'];  
    if (search_keys) {
        search_keys = JSON.parse(search_keys); // production scenario only
    }
    
    var isSearchRequest = search_keys ? true : false;

    var isNewRecord = (queryParams['new'] === '1');

    var isFormRecord = (queryParams['form'] === '1');

    //var table_keys = queryParams['keys']; // test scenario
    var table_keys = JSON.parse(queryParams['keys']); // production scenario

    var queryData = {};
    
    var queryString = {};

    try {
        // read the entry params from DynamoDB
        let entry_params = await dynamo.get(DynamoParams).promise();
        
        entry_params = entry_params.Item;

        if (method === 'GET') {
            if (isSearchRequest) {
                queryString = getTableQuery(entry_params, table_keys, false, search_keys);
            } else if (isNewRecord) {
                queryString = getNewQuery(entry_params, table_keys);
            } else if (isFormRecord) {
                queryString = getTableQuery(entry_params, table_keys, true, null);
            } else { // table query
                queryString = getTableQuery(entry_params, table_keys, false, null);
            }
        } else if (method === 'POST') {
            // have to check if the record exists (update) or is new (insert), so try to recover it
            queryString = getTableQuery(entry_params, table_keys, true, null);
        } else if (method === 'DELETE') {
            queryString = getDeleteQuery(entry_params, table_keys);
        }

        var client = await pool.connect();
        
        // process query string(s) - just check if new insertion in case of POST
        queryData = await processPreMainPost(queryString, client, (isFormRecord || isNewRecord || method === 'DELETE')); 
        
        // process comboboxes
        if (method === 'GET') {
            
            if (isNewRecord && queryString.defaultValues) { // only for new records, merge default values
                Object.assign(queryData, queryString.defaultValues);
            }

            let searchOptions = []; 
            if (queryData && queryString.comboQueries) {
                for (let index = 0; index < queryString.comboQueries.length; index++) {
                    let element = queryString.comboQueries[index];
                    let query = element.comboQuery;
                    let comboData = await client.query(query);
                    if (isFormRecord || isNewRecord) { // form/new record, add combobox options to relevant field
                        let comboEntry = new Object;
                        comboEntry[element.key] = new Object;
                        comboEntry[element.key]['value'] = queryData[element.key];
                        comboEntry[element.key]['options'] = comboData.rows;
                        Object.assign(queryData, comboEntry);
                    }
                    else { // table view, add search combobox to search_combos field's array
                        searchOptions.push({ fieldName: element.key, options: comboData.rows });
                    }
                }
            }

            if (!isFormRecord && searchOptions.length) { // at least one search combobox, return it as search_combos key
                queryData = { table_data: queryData, search_options: searchOptions };
            }
        }
        
        
        if (method === 'POST') { 
            // perform insert or update depending on previous query
            let newRecord = queryData.length ? false : true;
            let body = JSON.parse(event.body); // production scenario 
            //let body = event.body; // test scenario
            queryString = getInsertUpdateQuery(entry_params, table_keys, body, newRecord);
            // process query string(s)
            queryData = await processPreMainPost(queryString, client, true);
        }
        
        // disconnect from DB
        await client.release();

    } catch (e) {
        console.log(e);
        await client.release();
        return {
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "statusCode": 500,
            "error": e,
            "query": queryString
        };
    }
    
    console.log(queryData);

    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify(queryData)

    };
};
