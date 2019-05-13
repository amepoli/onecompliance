const AWS = require('aws-sdk');
AWS.config.update({region: 'eu-central-1'});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
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
    
    let codice_part = event['codice_part'];
    let numItems = event['numItems'];
    
    var params = { 
        Bucket: 'gorico2.core',
        Prefix: codice_part,
        MaxKeys: numItems
    };

    let s3Objects, client;
    let names = [];
    let decnames = [];
    

    try {
       s3Objects = await s3.listObjectsV2(params).promise();
       //console.log(s3Objects);

       s3Objects['Contents'].forEach(function(item) {
           let encodedName = item.Key.split(codice_part + '/')[1];
           names.push(encodedName);
       });
       client = await pool.connect();
       //console.log(names);
       for (let i= 0; i< names.length; i++) {
           let query = "select * from entrasp.cdms_risorse_revisioni where file_id=" + "'" + names[i] + "';";
           let response = await client.query(query);
           //console.log(response['rows']);
           decnames.push(response['rows']);
       }
       
      await client.release();
    } catch (e) {
       console.log(e);
    }
    
    
    return {
        statusCode: 200,
        body: JSON.stringify(decnames || {message: 'No objects found in db'})
    };
};