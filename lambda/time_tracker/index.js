const AWS = require('aws-sdk');
AWS.config.update({ region: 'REGION' });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const helperFuncts = require('./helperFuncts');

const bucket = 'BUCKET_NAME';
const region = 'REGION';
// const accessKey = 'ACCESS_KEY';
// const secret = 'SECRET_KEY';

const schema = 'SCHEMA';

const dynamo = new AWS.DynamoDB.DocumentClient();

const Pool = require('pg-pool');
const pool = new Pool({
    host: 'HOST_NAME',
    database: 'DB_NAME',
    user: 'USER_NAME',
    password: 'PASSWORD',
    port: 5432,
    max: 1,
    min: 0,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 1000
});

const scripts = {
    // checkStatus: "select codice_compito, codice_azienda from entrasp.consuntivazioni csn where date_time_end is null and id_risorsa=entrasp.user_current_azienda(('€global_id_anagrafiche€'):: text, csn.codice_azienda) limit 1",
    checkStatus: `select csn.id_cons, csn.codice_compito, csn.date_time_begin, csn.codice_azienda, entrasp.compito_titolo(csn.codice_azienda, csn.codice_compito) as description,
    coalesce(date_time_end- date_time_begin, (now() - date_time_begin)) as elapsed_time, case when date_time_end is null then 'running' else 'paused' end as status 
    from entrasp.consuntivazioni csn
    inner join entrasp.anagrafiche_id an on csn.id_risorsa=an.id_anagrafica and csn.codice_part=an.codice_part
    inner join (select max(csn2.date_time_begin) as dt_max from entrasp.consuntivazioni csn2 
                                inner join entrasp.anagrafiche_id an2 on csn2.id_risorsa=an2.id_anagrafica and csn2.codice_part=an2.codice_part
                                 where csn2.date_time_begin<now() and an2.dynamo_user='€global_username€' ) maxcons on csn.date_time_begin=maxcons.dt_max
    where an.dynamo_user='€global_username€'`,
    startTime: "select entrasp.time_report_play((€global_id_anagrafiche€)::text, '£codice_compito£', '£codice_azienda£')",
    stopTime: "select entrasp.time_report_stop((€global_id_anagrafiche€)::text)",
    isTrDayComplete: `select entrasp.is_tr_day_complete('£user_name£', replace('£date_time£', 'null', '')::date)` 
};

var global_variables = {};

function replaceLocalKeys(queryString, keys) {
    let delimiters = ['£', 'Â£'];
    for (var key in keys) {
        delimiters.forEach(delimiter => {
            let toReplace = delimiter + key + delimiter;
            let replacement = keys[key];
            replacement = (typeof replacement === 'string') ? '\'' + replacement.replace(/'/g, "''") + '\'' : replacement;
            //console.log('toReplace: ', toReplace, ', replacement: ', replacement);
            let newString = queryString.replace(toReplace, replacement);
            //console.log('queryString: ', queryString, ' newString: ', newString);
            while (newString !== queryString) { // handle multiple occurences
                queryString = newString;
                newString = queryString.replace(toReplace, replacement);
            }
        });
    }
    return queryString;
}

function replaceKeys(queryString, keys, keyTypes) {

    console.log(keys);
    var delimiters = ['$', '€'];
    if (queryString) {
        // first replace the global variables, must be €-contoured
        for (var key in global_variables) {
            let toReplace = '€' + key + '€';
            let replacement = global_variables[key];
            let newString = queryString.replace(toReplace, replacement);
            while (newString !== queryString) { // handle multiple occurrences
                queryString = newString;
                newString = queryString.replace(toReplace, replacement);
            }
        }

        for (var key in keys) {
            let toReplace = '£' + key + '£';
            let replacement = keys[key];
            let newString = queryString.replace(toReplace, replacement);
            while (newString !== queryString) { // handle multiple occurrences
                queryString = newString;
                newString = queryString.replace(toReplace, replacement);
            }
        }

        if (keyTypes) {
            for (var key in keys) {
                // console.table(key);
                delimiters.forEach(delimiter => {
                    let keyType = keyTypes.find(e => (e.key === key));

                    if (typeof keys[key] === 'object' && keyType && keyType.dataType && Array.isArray(keyType.dataType) && keys[key] != null) { // key with multiple subkeys
                        console.log(keys[key], keyType);
                        // tslint:disable-next-line:forin
                        for (var subkey in keys[key]) {
                            // console.log(subKey);
                            let subKeyType = keyType.dataType.find(e => (e.key === subkey));
                            let bracket = (delimiter === '$' && subKeyType && subKeyType.dataType === 'text') ? '\'' : '';
                            let toReplace = delimiter + key + '.' + subkey + delimiter;
                            // replace single quotes with double quotes within strings to avoid errors with queries
                            let valueWithFixedQuotes = (subKeyType && subKeyType.dataType === 'text') ? keys[key][subkey].replace(/'/g, "''") : keys[key][subkey];
                            let replacement = bracket + valueWithFixedQuotes + bracket;
                            let newString = queryString.replace(toReplace, replacement);
                            while (newString !== queryString) { // handle multiple occurences
                                queryString = newString;
                                newString = queryString.replace(toReplace, replacement);
                            }
                            console.log(`newString Object: ${newString}`);
                        }
                    } else if (typeof keys[key] !== 'object') {  // avoid spourious values like arrays form events
                        let bracket = (delimiter === '$' && keyType && keyType.dataType === 'text') ? '\'' : '';
                        let toReplace = delimiter + key + delimiter;
                        // TO BE CHECKED
                        //let replacement = keys[key].value ? keys[key].value : keys[key]; // handle subtables
                        // replace single quotes with double quotes within strings to avoid errors with queries

                        let valueWithFixedQuotes = (keys[key] != null && keyType && keyType.dataType === 'text') ? keys[key].replace(/'/g, "''") : keys[key];
                        let replacement = keys[key] == null ? 'null' : bracket + valueWithFixedQuotes + bracket;
                        //console.log ('toReplace: ', toReplace, ' replacement: ', replacement);
                        let newString = queryString.replace(toReplace, replacement);
                        while (newString !== queryString) { // handle multiple occurences
                            queryString = newString;
                            newString = queryString.replace(toReplace, replacement);
                        }
                        //console.table({ newString: newString, toReplace: toReplace, replacement: replacement });
                    }
                });
            }
        }
    }

    return queryString;
}

async function runQuery(queryString, client) {

    let local_keys = {}; // additional keys generated with pre-main-post processing  
    let queryData = [{}];

    console.log('queryString : ', queryString);

    if (queryString == null) {
        return queryData;
    }

    if (queryString != null && queryString !== '') {
        let query = replaceLocalKeys(queryString, local_keys);
        try {
            queryData = await client.query(query);
            queryData = queryData.rows;
            console.log('Main query : ', query, ' result : ', queryData);
        }
        catch (e) {
            queryData = e;
            console.log('Main query : ', query, ' error : ', e);
        }
    }

    return queryData;
}

exports.handler = async (event, context) => {

    const queryParams = event.queryStringParameters;

    const method = event.httpMethod;

    // quite a tricky method to retrieve the Cognito sub ID , would be maybe better to map it in API GW template
    // see https://forums.aws.amazon.com/thread.jspa?threadID=236366 
    const userid = event.requestContext.identity.cognitoAuthenticationProvider.split(':')[2];

    console.log('userid: ', userid);

    console.log('queryParams: ', queryParams);

    // const DynamoParams = {
    //     TableName: 'VIEWS_NAME',
    //     Key: {
    //         entryKey: queryParams['entry_name']
    //     }
    // };

    const company = queryParams['company'] ? queryParams['company'] : null;
    const codice_compito = queryParams['codice_compito'] ? queryParams['codice_compito'] : null;
    const user_name = queryParams['user_name'] ? queryParams['user_name'] : null;
    const date_time = queryParams['date_time'] ? queryParams['date_time'] : null;

    var queryData = null;

    var queryString = {};

    var tableProperties;

    var attributes = {};

    var additionalQueryCond = [];


    let body = null;

    console.log('queryParams', queryParams);

    const requestType = queryParams['request_type'];

    // If no Request type provided, exit with an error
    if (!requestType) {
        return {
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "statusCode": 500,
            "error": "Bad URL"
        };
    }
    else {
        console.log('Lets start ' + requestType);

        try {
            // const date = getDateFormat();
            // body = { result: 'OK', queryString: scripts[requestType], afterReplace: replaceKeys(scripts[requestType], keys, {}) };

            console.log("Connecting to pool...");
            let client = null;
            try {
                client = await pool.connect();
            }
            catch (e) {
                console.log(e);
            }

            console.log("Connected to pool success!");

            queryString = scripts[requestType];
            console.log('queryString: ', queryString);

            let keyTypes = {}; //getKeyTypes(entry_keys);
            console.log('keyTypes: ', keyTypes);

            let keys = {}; //getKeyTypes(entry_keys);
            keys['codice_azienda'] = company;
            keys['codice_compito'] = codice_compito;
            keys['user_name'] = user_name;
            keys['date_time'] = date_time;

            console.log('keys: ', keys);

            global_variables = await helperFuncts.setGlobalVariables(company, client, userid, dynamo);
            console.log('global_variables: ', global_variables);


            queryString = replaceKeys(scripts[requestType], keys, null);
            console.log('queryString: ', queryString);

            let result = await runQuery(queryString, client);
            await client.release();

            body = { result: 'OK', data: result };


        } catch (e) {
            console.log(e);
            body = { result: 'KO', reason: 'Server error' };
        }

        return {
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "statusCode": 200,
            "body": JSON.stringify(body)
        };
    }
};