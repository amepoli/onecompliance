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
       
       if (requestType === 'getList') {
           const query = `select * from entrasp.object_reports where context_object='${entryName}';`;
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