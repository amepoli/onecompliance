const AWS = require('aws-sdk');
AWS.config.update({region: 'eu-central-1'});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
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

const uuidv4 = require('uuid/v4');

var crypto = require('crypto')
  , shasum = crypto.createHash('sha1');


function getDateFormat() {
    var d = new Date();
    var month = d.getMonth() + 1; 
    return d.getFullYear() + '-' + month.toString() + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
}

exports.handler = async (event, context) => {
    
    const queryParams = event.queryStringParameters;
    
    console.log(queryParams);
    
    // const queryParams = event; / test
   
    const keys = JSON.parse(queryParams['keys']);
    const entryName = queryParams['entry_name'];
    const checksum = queryParams['checksum'];
    var filename = queryParams['filename'];
    var requestType = '';
    var codice = '';
    
    
    
    if (filename == null) {
        if (event.httpMethod === 'GET') {
          requestType = 'getFileList';
        } else if (event.httpMethod === 'POST') { // POST and no file provided, create a new file
          filename = uuidv4(); // generate a 'unique' UUID as filename
          requestType = 'createNewFile'
        } else {  // DELETE and no filename, return an error
          requestType = 'badRequest';
        }
    } else { // filename not null
        if (event.httpMethod === 'GET') {
          requestType = (checksum == null) ? 'getFileURL' : 'fileCheck';
        } else if (event.httpMethod === 'POST') {
            requestType = 'updateFile';
        } else if (event.httpMethod === 'DELETE') {
            requestType = 'deleteFile';
        } else {
            requestType = 'badRequest';
        }
    }
    
    if (entryName == null || keys == null) {
        requestType = 'badRequest';
    } else {
        if (keys.codice_part != null) {
            codice = keys.codice_part;
        } else if (keys.codice_azienda != null) {
            codice = keys.codice_azienda;
        } else {
            requestType = 'badRequest';
        }
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
    
    const s3ParamsInsert = { 
        Bucket: 'gorico2.core',
        Key: codice + '/' + filename
    };
    
    const s3ParamsGetList = { 
        Bucket: 'gorico2.core',
        Key: codice + '/' + filename
    };
    
    const DynamoParams = {
    TableName: 'views',
    Key: {
        entryKey: entryName
      }
    };

    let client, body;
    let decnames = [];
    
    const date = getDateFormat();

    try {
       
       var data = await dynamo.get(DynamoParams).promise();
       
       data = data.Item;
       
       console.log(data);
       
       let bus_object = data['businessObjectName'];
       
       if (bus_object == null) {
            return {
                "isBase64Encoded": false,
                "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                "statusCode": 500,
                "error": "Cannot find an associated business object"
            };       
       }

       let separator = '';
       
       let chiave = '';
       
       for (var key in keys) {
           chiave = chiave + separator + keys[key];
           separator = '^';
       }
       
       client = await pool.connect();
       //console.log(names);
       let query, response; 
       
       if (requestType === 'getFileList') {
           query = `select * from entrasp.cdms_risorse_oggetti where codice_azienda='${codice}' AND nome_business_object='${bus_object}' AND chiave='${chiave}';`;
           response = await client.query(query);
           let ids = response['rows'].map(f => f['id_risorsa']);
           for (let i= 0; i< ids.length; i++) {
                query = `select * from entrasp.cdms_risorse as a 
                inner join entrasp.cdms_risorse_revisioni as b on a.codice_azienda = b.codice_azienda AND a.id_risorsa = b.id_risorsa 
                where a.codice_azienda='${codice}' AND a.id_risorsa=${ids[i]};`;
                response = await client.query(query);
                decnames.push(response['rows'][0]);
            }
            body = {result: 'OK', list: decnames};
       } else if (requestType === 'getFileURL') {
            var url = s3.getSignedUrl('getObject', s3ParamsGetList);    
            if (url == null) {
                body = {result: 'KO'};
            } else {
                body = {result: 'OK', url: url}
            }
       } else if (requestType === 'updateFile') {
           // create a temporary signed URL for the object 
           const signedUrl = s3.getSignedUrl('putObject', s3ParamsInsert);
           // fill postgresql tables
           query = `SELECT (MAX(id_risorsa)+1) as id_risorsa from entrasp.cdms_risorse WHERE codice_azienda='${codice}';`;
           response = await client.query(query);
           const nextId = response['rows'][0]['id_risorsa'];
           query = `insert into entrasp.cdms_risorse (codice_azienda, id_risorsa, nickname, revisione_corrente, descrizione, autore, data_creazione, data_ultima_revisione, url, descrizione_breve, ts_ultima_modifica, content_type, flag_indexed, id_tipo_allegato)
                    values ('${codice}', ${nextId}, '${keys.nickname}',${keys.revisione_corrente}, '${keys.descrizione}', '${keys.autore}', '${date}', '${date}', '${url}','${descrizione_breve}', '${date}', '${fileType}', 1, ${id_tipo_allegato}) returning id_risorsa;`;
           response = await client.query(query);
           query = `insert into entrasp.cdms_risorse_oggetti (codice_azienda, id_risorsa, nome_business_object, chiave) values ('${codice_azienda}', ${nextId}, '${bus_object}','${chiave}');`;
           response = await client.query(query);
           body = { result: 'OK', signed_url: signedUrl };
           
       }  else if (requestType === 'createNewFile') {
           // create a temporary signed URL for the object 
           const signedUrl = s3.getSignedUrl('putObject', s3ParamsInsert);
           body = { result: 'OK', url: signedUrl, filename: filename };
       }  else if (requestType === 'confirm') {
           const object = await s3.getObject(s3ParamsGetList).promise();
           const actual_checksum = shasum.update(object.Body).digest('hex');
           if (checksum === actual_checksum) { // file correctly uploaded
               query = `insert into entrasp.cdms_risorse_revisioni (codice_azienda, id_risorsa, prog_revisione, data_creazione, file_id, revisore, client_file_name, Content_type, dimensione, checksum_sha1) 
                  values ('${codice_azienda}', ${id_risorsa}, '${revisione_corrente}','${date}', '${filename}', '${autore}', '${nickname}, '${fileType}', ${size}, '${checksum}');`;
               response = await client.query(query);
               body = { result: 'OK'};
           } else { // error with file upload
               query = `delete entrasp.cdms_risorse where codice_azienda='${codice_azienda}' and id_risorsa=${id_risorsa};`;
               response = await client.query(query);
               query = `delete entrasp.cdms_risorse_oggetti where codice_azienda='${codice_azienda}' and id_risorsa=${id_risorsa};`;
               response = await client.query(query);
           }
       }
    } catch (e) {
       console.log(e);
    }
    
           
    await client.release();
    
    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify(body || {result: 'KO'})
    };
};