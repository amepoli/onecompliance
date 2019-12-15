const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
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
const request = require('sync-request');

function tableName2BusinessObject (table_name) {
    
    if (table_name == null) {
        return null;
    }
    
    let lut = {};
    
    let charArray = ['a','b','c','d','e','f','g','h','i','k','j','l','m','n','o','p','q','r','s','t','u','v','x','y','w','z','1','2','3','4','5','6','7','8','9','0'];
    
    charArray.forEach(ch => {
        lut['_' + ch] =  ch.toUpperCase();
    });
    
    let business_object = '';
    
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

function getURLFromServer(mainQuery, subQueries) {

    let jsonParams = {
        mainReport: { 
            name: mainQuery.name,
            query: mainQuery.query
        },
        subReports: [],
        params: [  // to modify
            {
                key: "LOGO",
                value: "2pay.png"
            }
        ]
    };
    

    subQueries.forEach(subQuery => {
        jsonParams.subReports.push({
            name: subQuery.name,
            query: subQuery.query
        });
    });
    
    console.log(jsonParams);

    var res = request('POST', 'http://172.31.47.204:8080/json', {
        json: jsonParams
    });
    
    return res.getBody('utf8');

}

async function getQuery(entry_name, queryString, keys, search_keys, isForm) {
    let query = queryString;

    if (query == null || query === '') {
        return null;
    }

    const DynamoParams = {
        TableName: 'views',
        Key: {
            entryKey: entry_name
        }
    };

    let entry_params = await dynamo.get(DynamoParams).promise();

    let entry_keys = isForm ? entry_params.form_keys : entry_params.table_keys;

    let keyTypes = entry_keys.map(k => {
        let dataType = k.subKeys ? k.subKeys : (k.format.dataType ? k.format.dataType : '');
        return { key: k.key, dataType: dataType, isPrimary: k.isPrimary };
    });

    let comma = ' WHERE ';

    if (keys != null) {
        for (const key in keys) {
            if (keys.hasOwnProperty(key)) {
                let keyType = keyTypes.find(e => (e.key === key));
                let delimiter = (keyType.dataType === 'text') ? '\'' : '';
                let element = keys[key];
                let fieldString = comma + key + '=' + delimiter + element + delimiter;
                query = query + fieldString;
                comma = ' AND '; // needed only the first time 
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
                    query = query + comma + fieldString;
                    comma = ' AND '; // needed only the first time if no table_keys
                }
            }
        }
    }
}


exports.handler = async (event, context) => {
    
    const queryParams = event.queryStringParameters;
    
    console.log(queryParams);
    
    // const queryParams = event; / test
   
    let keys = queryParams['keys'];

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
    
    
    if (entryName == null || (keys == null && list == null)) {
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

    var DynamoParams = {
    TableName: 'reports',
    Key: {
        name: entryName
      }
    };

    let client, body;
    client = await pool.connect();

    try {
       
       const business_object = tableName2BusinessObject(entryName);
       
       console.log(business_object);
       
       if (requestType === 'getList') {
           const query = `select * from entrasp.object_reports where context_object='${business_object}';`;
           const response = await client.query(query);
           body = {result: 'OK', list: response.rows.map(row => row.descrizione)};
       } else if (requestType === 'getReport') { 
            const query = `select * from entrasp.object_reports where context_object='${business_object}' and descrizione='${reportName}';`;
            console.log(query);
            const response = await client.query(query);
            const reports = response.rows[0].report_names;
            if (reports != null) {
                const reportsArray = reports.split(',');
                DynamoParams.Key.name = reportsArray.shift();
                var data = await dynamo.get(DynamoParams).promise();
                const queryString = await getQuery(entryName, data.Item.queryString, keys, search_keys, isFormRecord);
                const mainQuery = { name: DynamoParams.Key.name, query: queryString };
                var subQueries = [];
                for (let i = 0; i < reportsArray.length; i++) {
                    let report = reportsArray[i];
                    subQueries.push({name: report, query: '' });
                }
                const url = await getURLFromServer(mainQuery, subQueries); 
                if (url != null && url !== '') {
                    body = {result: 'OK', url: url }; 
                } else {
                    body = {result: 'KO', reason:'Something wrong with the server'};
                }
            } else {
                body = {result: 'KO', reason:'Bad Request'};
            }
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