const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-central-1' });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
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

var crypto = require('crypto');


function getDateFormat() {
    var d = new Date();
    var month = d.getMonth() + 1;
    return d.getFullYear() + '-' + month.toString() + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
}


exports.handler = async (event, context) => {

    const shasum = crypto.createHash('sha1');

    const queryParams = event.queryStringParameters;

    console.log(queryParams);

    // const queryParams = event; / test

    let keys = JSON.parse(queryParams['keys']);
    const entryName = queryParams['entry_name'];
    const checksum = queryParams['checksum'];
    const company = queryParams['company'];
    var filename = queryParams['filename'];
    var requestType = '';

    if (filename == null) {
        if (event.httpMethod === 'GET') {
            requestType = 'getFileList';
        } else if (event.httpMethod === 'POST') { // POST and no file provided, create a new file
            filename = context.awsRequestId(); // generate a 'unique' UUID as filename
            requestType = 'createNewFile';
        } else {  // DELETE and no filename, return an error
            requestType = 'badRequest';
        }
    } else { // filename not null
        if (event.httpMethod === 'GET') {
            requestType = 'getFileURL';
        } else if (event.httpMethod === 'POST') {
            requestType = (checksum == null) ? 'updateFile' : 'fileCheck';
        } else if (event.httpMethod === 'DELETE') {
            requestType = 'deleteFile';
        } else {
            requestType = 'badRequest';
        }
    }

    if (entryName == null || company == null) {
        requestType = 'badRequest';
    }


    console.log('Lets start ' + requestType);

    if (requestType === 'badRequest') {
        return {
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "statusCode": 500,
            "error": "Bad URL"
        };
    }

    const DynamoParams = {
        TableName: 'views',
        Key: {
            entryKey: entryName
        }
    };

    const s3ParamsInsert = {
        Bucket: 'gorico2.db',
        Key: 'import/' + filename
    };

    const s3ParamsGetList = {
        Bucket: 'gorico2.db',
        Key: 'import/' + filename
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

        // keys = Object.assign({ 'codice_azienda': company }, keys);

        // for (var key in keys) {
        //     chiave = chiave + separator + keys[key];
        //     separator = '^';
        // }

        client = await pool.connect();
        //console.log(names);
        let query, response;

        if (requestType === 'getFileList') {
            query = `select * from entrasp.cdms_risorse_oggetti where codice_azienda='${company}' AND nome_business_object='${bus_object}' AND chiave='${chiave}';`;
            response = await client.query(query);
            console.log(query, response);
            let ids = response['rows'].map(f => f['id_risorsa']);
            for (let i = 0; i < ids.length; i++) {
                query = `select * from entrasp.cdms_risorse as a 
                inner join entrasp.cdms_risorse_revisioni as b on a.codice_azienda = b.codice_azienda AND a.id_risorsa = b.id_risorsa 
                where a.codice_azienda='${company}' AND a.id_risorsa=${ids[i]};`;
                response = await client.query(query);
                console.log(query, response);
                decnames.push(response['rows'][0]);
            }
            body = { result: 'OK', list: decnames };
        } else if (requestType === 'getFileURL') {
            var url = s3.getSignedUrl('getObject', s3ParamsGetList);
            if (url == null) {
                body = { result: 'KO', reason: 'Something wrong with cloud storage' };
            } else {
                body = { result: 'OK', url: url };
            }
        } else if (requestType === 'updateFile') {
            // fill postgresql tables
            const requestBody = JSON.parse(event.body);
            query = `update entrasp.cdms_risorse set 
                   nickname='${requestBody.nickname}', descrizione='${requestBody.descrizione}', 
                   data_ultima_revisione='${date}', url='${requestBody.url}', descrizione_breve='${requestBody.descrizione_breve}', ts_ultima_modifica=${date}
                   where codice_azienda='${company}' and id_risorsa=${requestBody.id_risorsa}`;
            response = await client.query(query);

            body = { result: 'OK' };

        } else if (requestType === 'createNewFile') {
            console.log("Creating new import file");
            // create a temporary signed URL for the object 
            const signedUrl = s3.getSignedUrl('putObject', s3ParamsInsert);
            body = { result: 'OK', url: signedUrl, filename: filename };

        } else if (requestType === 'fileCheck') {
            const object = await s3.getObject(s3ParamsGetList).promise();
            const actualChecksum = shasum.update(object.Body).digest('hex');
            const requestBody = JSON.parse(event.body);
            console.log(checksum, actualChecksum);
            if (checksum === actualChecksum) { // file correctly uploaded
                query = `SELECT (MAX(id_risorsa)+1) as id_risorsa from entrasp.cdms_risorse WHERE codice_azienda='${company}';`;
                response = await client.query(query);
                const nextId = response['rows'][0]['id_risorsa'];

                query = `insert into entrasp.cdms_risorse (codice_azienda, id_risorsa, nickname, revisione_corrente, descrizione, autore, data_creazione, data_ultima_revisione, url, descrizione_breve, ts_ultima_modifica, content_type, flag_indexed, id_tipo_allegato)
                    values ('${company}', ${nextId}, '${requestBody.nickname}',1, '${requestBody.descrizione}', '${requestBody.autore}', 
                    '${date}', '${date}', '${requestBody.url}','${requestBody.descrizione_breve}', '${date}', '${requestBody.content_type}', 1, ${requestBody.id_tipo_allegato}) returning id_risorsa;`;
                response = await client.query(query);
                console.log(query);

                query = `insert into entrasp.cdms_risorse_oggetti (codice_azienda, id_risorsa, nome_business_object, chiave) values ('${company}', ${nextId}, '${bus_object}','${chiave}');`;
                response = await client.query(query);
                console.log(query);

                query = `insert into entrasp.cdms_risorse_revisioni (codice_azienda, id_risorsa, prog_revisione, data_creazione, file_id, revisore, client_file_name, content_type, dimensione, checksum_sha1) 
                  values ('${company}', ${nextId}, 1,'${date}', '${filename}', 
                          '${requestBody.autore}', '${requestBody.nickname}', '${requestBody.content_type}', ${requestBody.dimensione}, '${checksum}');`;
                response = await client.query(query);
                console.log(query);
                body = { result: 'OK' };
            } else { // wrong checksum 
                body = { result: 'KO', reason: 'Error with file checksum' };
            }

        } else if (requestType === 'deleteFile') {
            // create a temporary signed URL for the object 
            const signedUrl = s3.getSignedUrl('deleteObject', s3ParamsInsert);

            const requestBody = JSON.parse(event.body);
            query = `delete entrasp.cdms_risorse where codice_azienda='${company}' and id_risorsa=${requestBody.id_risorsa};`;
            response = await client.query(query);
            query = `delete entrasp.cdms_risorse_oggetti where codice_azienda='${company}' and id_risorsa=${requestBody.id_risorsa};`;
            response = await client.query(query);
            query = `delete entrasp.cdms_risorse_revisioni where codice_azienda='${company}' and id_risorsa=${requestBody.id_risorsa};`;
            response = await client.query(query);

            body = { result: 'OK', url: signedUrl };
        }
    } catch (e) {
        console.log(e);
        body = { result: 'KO', reason: 'Server error' };
    }


    await client.release();

    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify(body)
    };
};