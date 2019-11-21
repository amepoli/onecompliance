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

    var requestType = '';
    
    
    if (entryName == null || (keys == null && list == null)) {
        requestType = 'badRequest';
    } else if (list != null) {
        requestType = 'getList';
    } else {
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
       
       //var data = await dynamo.get(DynamoParams).promise();
       
       //data = data.Item;
       
       //console.log(data);
       const business_object = tableName2BusinessObject(entryName);
       
       console.log(business_object);
       
       if (requestType === 'getList') {
           const query = `select * from entrasp.object_reports where context_object='${business_object}';`;
           const response = await client.query(query);
           body = {result: 'OK', list: response.rows.map(row => row.descrizione)};
       } else {
           body = {result: 'OK'}
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