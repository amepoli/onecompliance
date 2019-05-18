const AWS = require('aws-sdk');
AWS.config.update({region: 'eu-central-1'});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const dynamo = new AWS.DynamoDB.DocumentClient();
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


exports.handler = async (event, context) => {

    context.callbackWaitsForEmptyEventLoop = false;
    
    const codice_azienda = event['codice_azienda'];
    const numItems = event['numItems'];
    const keys = event['keys'];
    const table = event['table'];
    
    const s3Params = { 
        Bucket: 'gorico2.core',
        Prefix: codice_azienda,
        MaxKeys: numItems
    };
    
    const DynamoParams = {
    TableName: 'GoricoTables',
    Key: {
        TableName: table
      }
    };

    let s3Objects, client;
    let allitems = [];
    let decnames = [];
    

    try {
       s3Objects = await s3.listObjectsV2(s3Params).promise();
       //console.log(s3Objects);

       s3Objects['Contents'].forEach(function(item) {
           let encodedName = item.Key.split(codice_azienda + '/')[1];
           allitems.push(encodedName);
       });
       
       const data = await dynamo.get(DynamoParams).promise();
       
       const attachData = data.Item['attachments'];
       
       let bus_object = attachData['business_object'];
       
       let attachKeys = attachData['keys'];

       let chiave = keys[attachKeys[0]];
       
       for (let i=1; i<attachKeys.length; i++) {
           chiave = chiave + '^' + keys[attachKeys[i]];
       }
       
       client = await pool.connect();
       //console.log(names);
       let query, response; 
       query = `select * from entrasp.cdms_risorse_oggetti where codice_azienda='${codice_azienda}' AND nome_business_object='${bus_object}' AND chiave='${chiave}';`;

       response = await client.query(query);
       let ids = response['rows'].map(f => f['id_risorsa']);
       for (let i= 0; i< ids.length; i++) {
           query = `select * from entrasp.cdms_risorse_revisioni where codice_azienda='${codice_azienda}' AND id_risorsa=${ids[i]};`;
           response = await client.query(query);
           decnames.push(response['rows']);
       }
       
      await client.release();
    } catch (e) {
       console.log(e);
    }
    
    
    return {
        statusCode: 200,
        body: JSON.stringify(decnames || {message: 'No objects found in s3 bucket'})
    };
};