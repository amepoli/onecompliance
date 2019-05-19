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


function getDateFormat() {
    var d = new Date();
    var month = d.getMonth() + 1; 
    return d.getFullYear() + '-' + month.toString() + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
}

function getMimeType() {
    // to be overridden using mimetype ( https://github.com/jshttp/mime-types ) on actual content
    return 'application/pdf';
}

exports.handler = async (event, context) => {
    
    const codice_azienda = event['codice_azienda'];
    const numItems = event['numItems'];
    const keys = event['keys'];
    const table = event['table'];
    const nickname = event['nickname'];
    const revisione_corrente = event['revisione_corrente'];
    const autore = event['autore'];
    const descrizione = event['descrizione'];
    const descrizione_breve = event['descrizione_breve'];
    const url = event['url'];
    const id_tipo_allegato = event['id_tipo_allegato'];
    
    const action = 'insert';
    
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

    let client, body;
    let decnames = [];
    

    try {
       
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
       if (action === 'get') {
           query = `select * from entrasp.cdms_risorse_oggetti where codice_azienda='${codice_azienda}' AND nome_business_object='${bus_object}' AND chiave='${chiave}';`;
           response = await client.query(query);
           let ids = response['rows'].map(f => f['id_risorsa']);
            for (let i= 0; i< ids.length; i++) {
                query = `select * from entrasp.cdms_risorse where codice_azienda='${codice_azienda}' AND id_risorsa=${ids[i]};`;
                response = await client.query(query);
                decnames.push(response['rows']);
            }
            body = decnames;
       } else if (action === 'insert') {
           query = `SELECT (MAX(id_risorsa)+1) as id_risorsa from entrasp.cdms_risorse WHERE codice_azienda='${codice_azienda}';`;
           response = await client.query(query);
           const nextId = response['rows'][0]['id_risorsa'];
           const date = getDateFormat();
           const mimeType = getMimeType();
           query = `insert into entrasp.cdms_risorse (codice_azienda, id_risorsa, nickname, revisione_corrente, descrizione, autore, data_creazione, data_ultima_revisione, url, descrizione_breve, ts_ultima_modifica, content_type, flag_indexed, id_tipo_allegato)
                    values ('${codice_azienda}', ${nextId}, '${nickname}',${revisione_corrente}, '${descrizione}', '${autore}', '${date}', '${date}', '${url}','${descrizione_breve}', '${date}', '${mimeType}', 1, ${id_tipo_allegato}) returning id_risorsa;`;
           response = await client.query(query);
           query = `insert into entrasp.cdms_risorse_oggetti (codice_azienda, id_risorsa, nome_business_object, chiave) values ('${codice_azienda}', ${nextId}, '${bus_object}','${chiave}');`;
           response = await client.query(query);
           body = { id_risorsa: nextId };
       }
    } catch (e) {
       console.log(e);
    }
    
           
    await client.release();
    
    return {
        statusCode: 200,
        body: JSON.stringify(body || {message: 'No objects found in s3 bucket'})
    };
};