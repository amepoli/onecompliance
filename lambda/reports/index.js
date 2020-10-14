const AWS = require('aws-sdk');
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
const request = require('sync-request');

async function tableName2BusinessObject (table_name) {
    
    if (table_name == null) {
        return null;
    }

    const DynamoParams = {
        TableName: 'VIEWS_NAME',
        Key: {
            entryKey: table_name
        }
    };

    let entry_params = await dynamo.get(DynamoParams).promise();

    let business_object = entry_params.Item.businessObjectName;

    if (business_object != null) {
        return business_object;
    }
    
    let lut = {};
    
    let charArray = ['a','b','c','d','e','f','g','h','i','k','j','l','m','n','o','p','q','r','s','t','u','v','x','y','w','z','1','2','3','4','5','6','7','8','9','0'];
    
    charArray.forEach(ch => {
        lut['_' + ch] =  ch.toUpperCase();
    });
    
    business_object = '';
    
    while (business_object !== table_name) {
        business_object = table_name;
        for (var toReplace in lut) {
            table_name = table_name.replace(toReplace, lut[toReplace]);
        }
    }
    
    return business_object;
    
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

function getURLFromServer(mainQuery, company) {

    let jsonParams = {
        mainReport: { 
            name: mainQuery.name,
            query: mainQuery.query,
        },
        subReports: [],
        params: [{"key": "codice_azienda", "value": company}]
    };
   
    console.log(jsonParams);

    var res = request('POST', 'http://172.31.47.204:8080/json', {
        json: jsonParams
    });
    
    return res.getBody('utf8');

}

async function getQuery(entry_name, queryString, keyPrefix, keys, search_keys, isForm) {
    let query = queryString;

    if (query == null || query === '') {
        return null;
    }

    const DynamoParams = {
        TableName: 'VIEWS_NAME',
        Key: {
            entryKey: entry_name
        }
    };

    let entry_params = await dynamo.get(DynamoParams).promise();

    let entry_keys = isForm ? entry_params.Item.form_keys : entry_params.Item.table_keys;

    let keyTypes = entry_keys.map(k => {
        let dataType = k.subKeys ? k.subKeys : (k.format.dataType ? k.format.dataType : '');
        return { key: k.key, dataType: dataType, isPrimary: k.isPrimary };
    });

    let comma = ((query.indexOf('WHERE') === -1) && (query.indexOf('where') === -1))? ' WHERE ' :  ' AND '; // check if there is already a where condition

    // remove last semicolon if any
    if (queryString[queryString.length - 1] === ';') {
        queryString = queryString.slice(0,queryString.length - 1);
    }

    if (keys != null) {
        for (const key in keys) {
            if (keys.hasOwnProperty(key)) {
                let keyType = keyTypes.find(e => (e.key === key));
                let delimiter = (keyType.dataType === 'text') ? '\'' : '';
                let element = keys[key];
                let fieldString = comma + keyPrefix + key + '=' + delimiter + element + delimiter;
                query = query + fieldString;
                comma = ' AND '; // needed only the first time if where statement was added
            }
        }
    }

    if (search_keys != null) {
        let search_params = entry_params.search_keys;
        let search_types = search_params.map(k => {
            let dataType = k.format.dataType ? k.format.dataType : '';
            return { key: k.fieldName, dataType: dataType };
        });

        for (const key in search_keys) {
            if (search_keys.hasOwnProperty(key)) {
                let search_param = search_params.find(s => (s.fieldName === key));
                if (search_param != null && search_param.queryCond != null) {
                    let fieldString = replaceKeys(search_param.queryCond, search_keys, search_types);
                    query = query + comma + keyPrefix + fieldString;
                    comma = ' AND '; // needed only the first time if no table_keys
                }
            }
        }
    }

    query = query + ';';
    return query;
}

async function addCodiceAzienda (keys, company, view_keys, client, isForm) {
    
    const entry_keys = isForm ? view_keys.form_keys : view_keys.table_keys;

    const entry_azienda = entry_keys.find(entry => entry.key === 'codice_azienda');
    const entry_part = entry_keys.find(entry => entry.key === 'codice_part');
    
    if (entry_azienda != null) {
        keys['codice_azienda'] = company;
    }

    if (entry_part != null) {

        const queryString = "SELECT codice_part FROM entrasp.aziende WHERE codice_azienda='" + company + "';";

        const response = await client.query(queryString);


        if (response != null ) {
            keys['codice_part'] = response.rows[0].codice_part;
        }
    }

    console.log('Keys: ', keys);
    
}


exports.handler = async (event, context) => {
    
    const queryParams = event.queryStringParameters;
    
    console.log(queryParams);
    
    // const queryParams = event; / test
   
    let keys = queryParams['keys'];

    const company = queryParams['company'];

    if (keys != null) {
       keys = JSON.parse(keys);  // comment out in case of test
    }

    let search_keys = queryParams['search_keys'];

    if (search_keys != null) {
        search_keys = JSON.parse(search_keys);  // comment out in case of test
     }

    const entryName = queryParams['entry_name'];
    const list = queryParams['list'];

    var isFormRecord = (queryParams['form'] === '1');
    
    const method = event.httpMethod;

    var reportName, requestType;
    
    
    if (entryName == null || (keys == null && list == null) || company == null) {
        requestType = 'badRequest';
    } else if (method === 'GET') {
        requestType = 'getList';
    } else if (method === 'POST') {
        requestType = 'getReport';
        reportName = JSON.parse(event.body);
    }
            
    console.log('Lets start '+ requestType);
    
    if (requestType === 'badRequest') {
        return {
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "statusCode": 500,
            "error": "Bad URL"
        };
    }

    const reportDynamoParams = {
    TableName: 'REPORTS_NAME',
    Key: {
        name: ''
      }
    };

    const viewDynamoParams =    {
        TableName: 'VIEWS_NAME',
        Key: {
            entryKey: entryName
        }
    };

    let client, body;
    client = await pool.connect();

    try {

       // read the entry params from DynamoDB view table
       let entry_params = await dynamo.get(viewDynamoParams).promise();

       entry_params = entry_params.Item;

       // retrieve codice_azienda and codice_part from company if needed

       await addCodiceAzienda(keys, company, entry_params, client, isFormRecord);
       
       const business_object = await tableName2BusinessObject(entryName);
       
       if (requestType === 'getList') {
           const query = `select * from entrasp.object_reports where context_object='${business_object}';`;
           const response = await client.query(query);
           body = {result: 'OK', list: response.rows.map(row => ({"alias": row.alias, "descrizione": row.descrizione}))};
       } else if (requestType === 'getReport') {
           reportDynamoParams.Key.name = reportName;
           var data = await dynamo.get(reportDynamoParams).promise();
           const keyPrefix = data.Item.tableNickname != null ? data.Item.tableNickname + '.' : '';     // table.key=value or just key=value 
           const queryString = await getQuery(entryName, data.Item.queryString, keyPrefix, keys, search_keys, isFormRecord);
           const mainQuery = { name: reportName, query: queryString };
           const url = await getURLFromServer(mainQuery, company);
           if (url != null && url !== '') {
               body = { result: 'OK', url: url };
           } else {
               body = { result: 'KO', reason: 'Something wrong with the server' };
           }
       } else {
           body = { result: 'KO', reason: 'Bad Request' };
       }
    } catch (e) {
       console.log(e);
       body = { result: 'KO', reason: 'Server error'};
    }
    
    await client.release();

    
    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify(body)
    };
};