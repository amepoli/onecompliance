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

function replaceKeys(queryString, keys) {

    console.log(keys);
    var delimiter = '€';
    if (queryString) {
        for (var key in keys) {
                if (typeof keys[key] === 'object') { // key with multiple subkeys
                    // tslint:disable-next-line:forin
                    for (var subkey in keys[key]) {
                        let toReplace = delimiter + key + '.' + subkey + delimiter;
                        let replacement = keys[key][subkey];
                        let newString = queryString.replace(toReplace, replacement);
                        while (newString !== queryString) { // handle multiple occurences
                            queryString = newString;
                            newString = queryString.replace(toReplace, replacement);
                        }
                    }
                } else {
                    let toReplace = delimiter + key + delimiter;
                    let replacement = keys[key] + bracket;
                    let newString = queryString.replace(toReplace, replacement);
                    while (newString !== queryString) { // handle multiple occurences
                        queryString = newString;
                        newString = queryString.replace(toReplace, replacement);
                    }
                }
        }
    }
    return queryString;
}

function getURLFromServer(mainQuery, subQueries, keys) {

    let jsonParams = {
        mainReport: { 
            name: mainQuery.name,
            query: replaceKeys(mainQuery.query, keys)
        },
        subReports: [],
        params: [  // to modify
            {
                key: "LOGO",
                value: "2pay.png"
              },
              {
                key: "username",
                value: "DEMO"
              }
        ]
    }

    subQueries.forEach(subQuery => {
        jsonParams.subReports.push({
            name: subQuery.name,
            query: replaceKeys(subQuery.query, keys)
        });
    });

    

}


exports.handler = async (event, context) => {
    
    const queryParams = event.queryStringParameters;
    
    console.log(queryParams);
    
    // const queryParams = event; / test
   
    let keys = queryParams['keys'];

    if (keys != null) {
        keys = JSON.parse(keys);
    }

    const entryName = queryParams['entry_name'];
    const list = queryParams['list'];
    const reportName = queryParams['report'];

    var requestType = '';
    
    
    if (entryName == null || (keys == null && list == null)) {
        requestType = 'badRequest';
    } else if (list != null) {
        requestType = 'getList';
    } else if (report != null) {
        requestType = 'getReport';
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

    const DynamoParams = {
    TableName: 'reports',
    Key: {
        entryKey: entryName
      }
    };

    let client, body;
    client = await pool.connect();

    try {
       
       //
       
       //data = data.Item;
       
       //console.log(data);
       const business_object = tableName2BusinessObject(entryName);
       
       console.log(business_object);
       
       if (requestType === 'getList') {
           const query = `select * from entrasp.object_reports where context_object='${business_object}';`;
           const response = await client.query(query);
           body = {result: 'OK', list: response.rows.map(row => row.descrizione)};
       } else if (requestType === 'getReport') { 
            const query = `select * from entrasp.object_reports where context_object='${business_object}' and descrizione='${report}';`;
            const response = await client.query(query);
            const reports = response.rows[0].report_names;
            if (reports != null) {
                const reportsArray = reports.split(',');
                var DynamoParams = {
                    TableName: 'reports',
                    Key: {
                        entryKey: reportsArray.shift()
                      }
                    };
                var data = await dynamo.get(DynamoParams).promise();
                const mainQuery = { name: DynamoParams.entryKey, query: data.Item.queryString };
                var subQueries = [];
                reportsArray.forEach(
                    report => {
                        DynamoParams.Key.entryKey = report;
                        data = await dynamo.get(DynamoParams).promise();
                        subQueries.push({name: report, query: data.Item.queryString});
                });
                const url = getURLFromServer(mainQuery, subQueries , keys); // also replaces parametric keys
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