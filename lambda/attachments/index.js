const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-central-1' });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
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

var crypto = require('crypto');

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

function getDateFormat() {
    var d = new Date();
    var month = d.getMonth() + 1;
    return d.getFullYear() + '-' + month.toString() + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
}

async function overrideTable(son) {

    if (son.inheritsFrom == null) {
        return son;
    }

    const DynamoParams = {
        TableName: 'VIEWS_NAME',
        Key: {
            entryKey: son.inheritsFrom
        }
    };

    var father = await dynamo.get(DynamoParams).promise();

    father = father.Item;
    if (father == null) {
        return son;
    }

    if (father.inheritsFrom != null) {
        father = await overrideTable(father);
    }

    for (const field in son) {
        if (son.hasOwnProperty(field) && field != "inheritsFrom" && field != "$schema") {
            father[field] = son[field];
        }
    }
    return father;
}

async function tableName2BusinessObject(table_name) {

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

    // complete table if inherited
    entry_params = await overrideTable(entry_params.Item);

    console.log('entry_params: ', entry_params);
    let business_object = entry_params.businessObjectName;

    if (business_object != null) {
        return business_object;
    }

    let lut = {};

    let charArray = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'k', 'j', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'y', 'w', 'z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

    charArray.forEach(ch => {
        lut['_' + ch] = ch.toUpperCase();
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

exports.handler = async (event, context) => {

    const shasum = crypto.createHash('sha1');

    const queryParams = event.queryStringParameters;

    console.log(queryParams);

    // const queryParams = event; / test

    let keys = queryParams['keys'] ? JSON.parse(queryParams['keys']) : null;
    const entryName = queryParams['entry_name'];
    const businessObjectName = queryParams['businessObjectName'];
    const checksum = queryParams['checksum'];
    const md5Checksum = (queryParams['md5_checksum'] == undefined) ? null : queryParams['md5_checksum'];
    const request_type = queryParams['request_type'];
    const contentsPrefix = queryParams['contents_prefix'];
    const company = queryParams['company'];
    //file_id, s3path, googledivepath

    var filename = queryParams['filename'];
    var id_risorsa = queryParams['id_risorsa'];
    var prog_revisione = queryParams['prog_revisione'];
    var requestType = '';

    if (request_type) {
        requestType = request_type;
    }
    else if (filename == null) {
        if (event.httpMethod === 'GET') {
            requestType = 'getFileList';
        } else if (event.httpMethod === 'POST') { // POST and no file provided, create a new file
            filename = context.awsRequestId; // generate a 'unique' UUID as filename
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

    if (requestType !== 'getGoogleDriveFileCopyParams' && requestType !== 'getS3GoogleSyncFilesList' && requestType !== 'getGoogleDriveFolderNameByAnagrafica' && requestType !== 'setProperFileFolder' && requestType !== 'anagraficheToBeUpdated' && requestType !== 'associateEmails') {
        if (entryName == null || keys == null || company == null) {
            requestType = 'badRequest';
        }
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

    const s3ParamsInsert = {
        Bucket: 'BUCKET_NAME',
        Key: company + '/' + filename
    };

    const s3ParamsGetList = {
        Bucket: 'BUCKET_NAME',
        Key: company + '/' + filename
    };

    let client, body;
    let decnames = [];
    let countFile;

    const date = getDateFormat();

    try {

        if (requestType === 'getGoogleDriveFileCopyParams') {
            client = await pool.connect();

            let query = `select * from entrasp.getGoogleDriveFileCopyParams('${company}', '${checksum}');`;
            console.log('running query: ', query);
            let response = await client.query(query);
            //Always delete from entrasp.cdms_risorse_revisioni because for the selected flow_info i can have only one document with this sha1
            /* query = `select count(*) from entrasp.cdms_risorse_revisioni where codice_azienda='${company}' and id_risorsa=${id_risorsa} and prog_revisione='${prog_revisione}';`;
            response = await client.query(query); */

            /* let objectCount = (response.rows && response.rows[0] && response.rows[0].count) ? parseInt('' + response.rows[0].count) : 0;
            console.log('response of file exists by checksum_sha1:', response);
            console.log('row: ' + response.rows[0]);
            console.log('count: ' + response.rows[0].count);
            if (objectCount = 0) { */

            //query = `delete from entrasp.cdms_risorse where codice_azienda='${company}' and id_risorsa=${id_risorsa};`;
            //response = await client.query(query);
            //}
            body = { result: 'OK', response: response };
        }
        else if (requestType === 'getS3GoogleSyncFilesList') {
            client = await pool.connect();
            //let query = `select file_id, entrasp.getgoogledrivefilecopyparams(codice_azienda, checksum_sha1) from entrasp.cdms_risorse_revisioni where codice_azienda='${company}' AND client_file_name != 'tbd';`;
            let query = `select file_id, hash_md5 as s3Md5, '/'||codice_azienda||'/'||file_id as s3Path, entrasp.getgoogledrivepath(codice_azienda, checksum_sha1) as googleDrivePath from entrasp.cdms_risorse_revisioni where codice_azienda='${company}' AND client_file_name != 'tbd';`;
            console.log('running query: ', query);
            let response = await client.query(query);
            body = { result: 'OK', response: response };
        }
        else if (requestType === 'getGoogleDriveFolderNameByAnagrafica') {
            const id_anagrafica = queryParams['id_anagrafica'];
            const id_risorsa = queryParams['id_risorsa'];
            const id_sondaggio = queryParams['id_sondaggio'];
            const codice_part = queryParams['codice_part'];

            const username = queryParams['username'];
            client = await pool.connect();
            //let query = `select file_id, entrasp.getgoogledrivefilecopyparams(codice_azienda, checksum_sha1) from entrasp.cdms_risorse_revisioni where codice_azienda='${company}' AND client_file_name != 'tbd';`;
            let query = '';
            if (id_sondaggio) {
                query = `select entrasp.anagrafica_folder_name_and_sub_folders(cg.codice_azienda_erogante, an.id_anagrafica, '${username}', idsondaggio=>snd.id_sondaggio)
                from entrasp.sondaggi snd
                inner join entrasp.centri_gestionali cg on snd.id_centro_gest=cg.id_centro_gest and snd.codice_part=cg.codice_part
                inner join entrasp.aziende az on cg.codice_azienda_erogante=az.codice_azienda
                inner join entrasp.anagrafiche_id an on snd.codice_azienda=an.codice_azienda_corrispondente
                and snd.id_sondaggio=${id_sondaggio} and snd.codice_azienda='${company}' and an.codice_part!='${codice_part}' and az.codice_part=an.codice_part
                and cg.codice_azienda_erogante is not null;`;
            }
            else {
                query = `select * from entrasp.anagrafica_folder_name_and_sub_folders('${company}', '${id_anagrafica}', '${username}', ${id_risorsa ? "'" + id_risorsa + "'" : "null"});`;
            }
            console.log('running query: ', query);
            let response = await client.query(query);
            let folderNames = null;
            console.log('response', response.rows);
            if (response && response.rows) {
                folderNames = response.rows;
            }
            body = { result: 'OK', response: folderNames };
        }
        else if (requestType === 'setProperFileFolder') {
            let jsonBody = event.body;
            client = await pool.connect();
            //let query = `select file_id, entrasp.getgoogledrivefilecopyparams(codice_azienda, checksum_sha1) from entrasp.cdms_risorse_revisioni where codice_azienda='${company}' AND client_file_name != 'tbd';`;
            let query = `select * from entrasp.set_proper_file_folder(('${jsonBody}')::json);`;
            console.log('running query: ', query);
            let response = await client.query(query);
            let folderNames = null;
            console.log('response', response.rows);

            body = { result: 'OK', response: response };
        }
        else if (requestType === "anagraficheToBeUpdated") {
            let jsonBody = event.body;
            client = await pool.connect();
            //let query = `select file_id, entrasp.getgoogledrivefilecopyparams(codice_azienda, checksum_sha1) from entrasp.cdms_risorse_revisioni where codice_azienda='${company}' AND client_file_name != 'tbd';`;
            let query = `select * from entrasp.anagrafiche_to_be_updated(('${jsonBody}')::json);`;
            console.log('running query: ', query);
            let response = await client.query(query);
            let folderNames = null;
            console.log('response', response.rows);

            body = { result: 'OK', response: response };

        }
        else if (requestType === "associateEmails") {
            let jsonBody = event.body ? JSON.parse(event.body) : {};
            let input = jsonBody['input'];
            let codiceAzienda = jsonBody['codiceAzienda'];
            client = await pool.connect();
            //let query = `select file_id, entrasp.getgoogledrivefilecopyparams(codice_azienda, checksum_sha1) from entrasp.cdms_risorse_revisioni where codice_azienda='${company}' AND client_file_name != 'tbd';`;
            let query = `select * from entrasp.associate_emails_simple(($$ ${JSON.stringify(input)} $$)::json, ('${codiceAzienda.join(',')}')::text);`;
            console.log('running query: ', query);
            let response = await client.query(query);
            console.log('response', response.rows);
            body = { result: 'OK', response: response };
        }
        else if (requestType === 'getFileURL') {
            //console.log('IN: getFileURL');
            var url = s3.getSignedUrl('getObject', s3ParamsGetList);
            if (url == null) {
                body = { result: 'KO', reason: 'Something wrong with cloud storage' };
            } else {
                body = { result: 'OK', url: url };
            }
        }
        else {
            //console.log('IN: else of getFileURL');    //often here
            let bus_object=businessObjectName;

            console.log ('*** bus_object *** --> ',bus_object);

            if (!bus_object) {
                bus_object = await tableName2BusinessObject(entryName);
            }

            client = await pool.connect();

            let query, response;

            let chiave = '';

            let idrisorsa;

            keys = Object.assign({ 'codice_azienda': company }, keys);

            //HACK: getting specific ID from specific view attachments_tbd.
            if (bus_object != 'uploadFile') {
                // Let's run query to get keys arrangement
                query = `select * from entrasp.grc_listacampiditabella_pk('${bus_object}')`;
                response = await client.query(query);
                console.log('Query keys: ', query, ' response ', response, ' keys ', keys);
                if (response.rows && response.rows.length && response.rows[0].grc_listacampiditabella_pk) {
                    // Create query keys 
                    let queryKeys = response.rows[0].grc_listacampiditabella_pk.split(' ').join('').split(',');
                    if (queryKeys != null) {
                        chiave = keys[queryKeys[0]];
                        //HACK: getting specific ID from specific view (cdms_risorse). 
                        //To attach a file to specific "idrisorsa"(the one below) of that view 
                        idrisorsa = (bus_object == 'cdms_risorse') ? keys[queryKeys[1]] : -1;
                        for (let i = 1; i < queryKeys.length; i++) {
                            chiave = chiave + '^' + keys[queryKeys[i]];
                        }
                    }
                }
            }

            if (requestType === 'getFileList') {
                //console.log('requestType: getFileList');      //When load some page with attach icon OR "click" on attach icon
                idris = (keys['id_risorsa'] == undefined) ? null : keys['id_risorsa'];
                provr = (keys['prog_revisione'] == undefined) ? null : keys['prog_revisione'];
                if (bus_object == 'cdms_risorse_revisioni') {
                    query = `select * from entrasp.cdms_risorse_revisioni where codice_azienda='${company}' and id_risorsa=${idris} and prog_revisione=${provr} and id_argomento_stato=4035;`;
                    response = await client.query(query);
                    console.log(query, response);
                    let ids = response['rows'].map(f => f['prog_revisione']);
                    for (let i = 0; i < ids.length; i++) {      //PER OGNI REVISIONE ALLEGATA A QUEST'OGGETTO
                        query = `select * from entrasp.cdms_risorse_revisioni where codice_azienda='${company}' and id_risorsa=${idris} and prog_revisione=${ids[i]} and id_argomento_stato=4035;`;
                        response = await client.query(query);
                        console.log(query, response);
                        decnames.push(response['rows'][0]);
                    }
                } else if (bus_object == 'uploadFile') {
                    query = `select * from entrasp.cdms_risorse_revisioni where codice_azienda='${company}' and id_risorsa=${idris} and id_argomento_stato=4035;`;
                    response = await client.query(query);
                    console.log(query, response);
                    let ids = response['rows'].map(f => f['prog_revisione']);
                    for (let i = 0; i < ids.length; i++) {      //PER OGNI REVISIONE ALLEGATA A QUEST'OGGETTO
                        query = `select * from entrasp.cdms_risorse_revisioni where codice_azienda='${company}' and id_risorsa=${idris} and prog_revisione=${ids[i]} and id_argomento_stato=4035;`;
                        response = await client.query(query);
                        console.log(query, response);
                        decnames.push(response['rows'][0]);
                    }
                } else if (bus_object == 'cdms_risorse') {
                    query = `select * from entrasp.cdms_risorse_revisioni where codice_azienda='${company}' and id_risorsa=${idris} and id_argomento_stato=4035;`;
                    response = await client.query(query);
                    console.log(query, response);
                    let ids = response['rows'].map(f => f['prog_revisione']);
                    for (let i = 0; i < ids.length; i++) {      //PER OGNI REVISIONE ALLEGATA A QUEST'OGGETTO
                        query = `select * from entrasp.cdms_risorse_revisioni where codice_azienda='${company}' and id_risorsa=${idris} and prog_revisione=${ids[i]} and id_argomento_stato=4035;`;
                        response = await client.query(query);
                        console.log(query, response);
                        decnames.push(response['rows'][0]);
                    }
                } else {
                    query = `select * from entrasp.cdms_risorse_oggetti a inner join entrasp.cdms_risorse_revisioni b on a.codice_azienda=b.codice_azienda
                    and a.id_risorsa=b.id_risorsa and a.prog_revisione=b.prog_revisione where a.codice_azienda='${company}' AND a.nome_business_object='${bus_object}'
                    AND a.chiave='${chiave}' and b.id_argomento_stato=4035;`;
                    response = await client.query(query);
                    console.log(query, response);
                    let rows = response['rows'];
                    for (let i = 0; i < rows.length; i++) {
                        decnames.push(response['rows'][i]);
                    }
                }
                body = { result: 'OK', list: decnames };
            } else if (requestType === 'getCountAttachList') {

                idris = (keys['id_risorsa'] == undefined) ? null : keys['id_risorsa'];
                provr = (keys['prog_revisione'] == undefined) ? null : keys['prog_revisione'];
                if (bus_object == 'cdms_risorse_revisioni') {
                    query = `select count(*) from entrasp.cdms_risorse_revisioni where codice_azienda='${company}' and id_risorsa=${idris} and prog_revisione=${provr} and id_argomento_stato=4035;`;
                    response = await client.query(query);
                    console.log(query, response);
                    countFile = response['rows'][0];
                } else if (bus_object == 'cdms_risorse') {
                    query = `select count(*) from entrasp.cdms_risorse_revisioni where codice_azienda='${company}' and id_risorsa=${idris} and id_argomento_stato=4035;`;
                    response = await client.query(query);
                    console.log(query, response);
                    countFile = response['rows'][0];
                } else {
                    query = `select count(*) from entrasp.cdms_risorse_oggetti a inner join entrasp.cdms_risorse_revisioni b on a.codice_azienda=b.codice_azienda
                        and a.id_risorsa=b.id_risorsa and a.prog_revisione=b.prog_revisione where a.codice_azienda='${company}' AND a.nome_business_object='${bus_object}'
                        AND a.chiave='${chiave}' and b.id_argomento_stato=4035;`;
                    response = await client.query(query);
                    console.log(query, response);
                    countFile = response['rows'][0];
                }
                body = { result: 'OK', countFile: countFile };
            } else if (requestType === 'updateFile') {
                //console.log('requestType: updateFile');       //NO more in this requestType from OneCompliance
                // fill postgresql tables
                const requestBody = JSON.parse(event.body);
                query = `update entrasp.cdms_risorse set 
                   nickname='${replaceAll(requestBody.nickname, "'", "''")}', descrizione='${requestBody.descrizione}', 
                   data_ultima_revisione='${date}', url='${requestBody.url}', descrizione_breve='${requestBody.descrizione_breve}', ts_ultima_modifica='${date}'',
                   id_argomento_tipo_allegato=${requestBody.id_argomento_tipo_allegato}, id_centro_gest=${requestBody.id_centro_gest}, data_scadenza=nullif('${requestBody.data_scadenza}','null')::timestamp without time zone, 
                   data_scadenza=nullif('${requestBody.data_rif}', 'null')::timestamp without time zone, id_riunione=${requestBody.id_riunione}, id_odg=${requestBody.id_odg}
                   where codice_azienda='${company}' and id_risorsa=${requestBody.id_risorsa}`;
                response = await client.query(query);
                body = { result: 'OK' };

            } else if (requestType === 'createNewFile') {
                //console.log('requestType: createNewFile');        //onSave(), *** BUG: Also on update existing file, remove putObject ***
                // create a temporary signed URL for the object 
                const signedUrl = s3.getSignedUrl('putObject', s3ParamsInsert);
                body = { result: 'OK', url: signedUrl, filename: filename };

            } else if (requestType === 'loadFileDataIfExists') {
                //console.log('requestType: loadFileDataIfExist');      //When open a file from "Choose File"
                query = `select count(id_risorsa) from entrasp.cdms_risorse_revisioni where checksum_sha1='${checksum}' AND codice_azienda='${company}';`;
                response = await client.query(query);

                let filesCount = (response.rows && response.rows[0] && response.rows[0].count) ? parseInt('' + response.rows[0].count) : 0;
                console.log('response of file exists by checksum_sha1:', response);
                console.log('row: ' + response.rows[0]);
                console.log('count: ' + response.rows[0].count);
                if (filesCount > 0) {
                    body = { result: 'OK', data: {} };
                    try {
                        query = `select codice_azienda, id_risorsa from entrasp.cdms_risorse_revisioni where checksum_sha1='${checksum}' AND codice_azienda='${company};'`
                        response = await client.query(query);
                        let existingRows = response.rows;
                        if (existingRows && existingRows.length) {
                            const codiceAziendaExisting = existingRows[0]['codice_azienda'];
                            const idRisorsaExisting = existingRows[0]['id_risorsa'];

                            query = `select a.id_argomento_tipo_allegato, a.id_centro_gest, a.codice_azienda, /*fileName,*/ b.dimensione, a.url, a.descrizione_breve, a.descrizione, a.codice_part, a.data_scadenza /*,data_rif*/ ,b.id_riunione, b.id_odg from entrasp.cdms_risorse a 
                            inner join entrasp.cdms_risorse_revisioni b on a.id_risorsa=b.id_risorsa and a.codice_azienda=b.codice_azienda
                            where a.codice_azienda='${codiceAziendaExisting}' and a.id_risorsa=${idRisorsaExisting} and b.checksum_sha1='${checksum};'`;

                            // query = `insert into entrasp.cdms_risorse_oggetti (codice_azienda, id_risorsa, nome_business_object, chiave) 
                            //     values ('${codiceAziendaExisting}', ${idRisorsaExisting}, '${bus_object}','${chiave}');`;
                            console.log(query);
                            response = await client.query(query);
                            body = { result: 'OK', data: response.rows[0] };
                            console.log(JSON.stringify(response));
                        }
                    }
                    catch (e) {
                        console.log(e);
                    }

                    // body = { result: 'KO', reason: 'File does not exist!' };
                }
            } else if (requestType === 'fileCheck') {
                const requestBody = JSON.parse(event.body);
                if (bus_object == 'cdms_risorse_revisioni') {
                    //ESISTE FLUSSO, ESISTE REVISIONE, SONO SU DOCUMENTS QUINDI UPDATE REVISIONE ESISTENTE
                    idris = (keys['id_risorsa'] == undefined) ? null : keys['id_risorsa'];
                    provr = (keys['prog_revisione'] == undefined) ? null : keys['prog_revisione'];
                    datarif = (requestBody.data_rif == undefined) ? new Date().toISOString() : requestBody.data_rif;
                    query = `update entrasp.cdms_risorse_revisioni set data_creazione='${date}',  file_id='${filename}', revisore='${requestBody.autore}',
                    client_file_name='d'||substr(replace('${datarif}','-',''),0,9)||'_'||'${replaceAll(requestBody.nickname, "'", "''")}', content_type='${requestBody.content_type}', dimensione=${requestBody.dimensione},
                    checksum_sha1='${checksum}', id_argomento_stato=4035, descrizione=coalesce('${requestBody.descrizione}',descrizione), data_ultima_revisione=current_date, 
                    ts_ultima_modifica=coalesce('${date}',ts_ultima_modifica), id_riunione=coalesce(${requestBody.id_riunione},id_riunione), id_odg=coalesce(${requestBody.id_odg}, id_odg)
                    where codice_azienda='${company}' and id_risorsa=${idris} and prog_revisione=${provr};`;
                    console.log(query);
                    response = await client.query(query);

                    /* //HACK: exception in case of bus_object="cdms_risorse"
                    idrisorsa = (idrisorsa == -1) ? idris : idrisorsa; */
                    query = `select entrasp.after_lambda_attachments('${company}',  ${idris/*orsa*/});`; //, ${requestBody.prog_revisione});`;
                    console.log(query);
                    //??? tolgo await
                    response = await client.query(query);
                    console.log(JSON.stringify(response));

                    body = { result: 'OK' };
                } else if (bus_object == 'uploadFile') {
                    idris = (keys['id_risorsa'] == undefined) ? null : keys['id_risorsa'];
                    provr = (keys['prog_revisione'] == undefined) ? null : keys['prog_revisione'];
                    datarif = (requestBody.data_rif == undefined) ? new Date().toISOString() : requestBody.data_rif;
                    
                    query = `select id_argomento_stato from entrasp.cdms_risorse_revisioni where codice_azienda='${company}' and id_risorsa=${idris} and prog_revisione=${provr};`;
                    console.log(query);
                    response = await client.query(query);
                    let stato = response.rows[0].id_argomento_stato;
                    console.log(stato, 'stato');

                    if (stato && stato != '4035') {

                        query = `update entrasp.cdms_risorse_revisioni set data_creazione='${date}',  file_id='${filename}', revisore='${requestBody.autore}',
                        client_file_name='d'||substr(replace('${datarif}','-',''),0,9)||'_'||'${replaceAll(requestBody.nickname, "'", "''")}', content_type='${requestBody.content_type}', dimensione=${requestBody.dimensione},
                        checksum_sha1='${checksum}', id_argomento_stato=4035, descrizione=coalesce(${requestBody.descrizione}::varchar,descrizione), data_ultima_revisione=current_date, 
                        ts_ultima_modifica=coalesce('${date}',ts_ultima_modifica), id_riunione=coalesce(${requestBody.id_riunione},id_riunione), id_odg=coalesce(${requestBody.id_odg}, id_odg)
                        where codice_azienda='${company}' and id_risorsa=${idris} and prog_revisione=${provr} and id_argomento_stato != 4035;`;
                        console.log(query);
                        response = await client.query(query);

                    } else {

                        const object = await s3.getObject(s3ParamsGetList).promise();
                        const actualChecksum = shasum.update(object.Body).digest('hex');
                        console.log(checksum, actualChecksum);
                        if (checksum === actualChecksum) { // file correctly uploaded
                            dimensione = (requestBody.dimensione == undefined) ? null : requestBody.dimensione;
                            descrizione = (requestBody.descrizione == undefined) ? null : requestBody.descrizione;
                            idodg = (requestBody.id_odg == undefined) ? null : requestBody.id_odg;
                            idriu = (requestBody.id_riunione == undefined) ? null : requestBody.id_riunione;
                            datarif = (requestBody.data_rif == undefined) ? new Date().toISOString() : requestBody.data_rif;
                            //Prendo il massimo prog_revisione
                            query = `select max(prog_revisione) as prog_revisione from entrasp.cdms_risorse_revisioni where id_risorsa=${idris} and codice_azienda='${company}';`;
                            console.log(query);
                            response = await client.query(query);
                            const nextProgRevisione = (response.rows && response.rows[0]) ? response['rows'][0]['prog_revisione'] : 0;
                            query = `insert into entrasp.cdms_risorse_revisioni (codice_azienda, id_risorsa, prog_revisione, data_creazione, file_id, 
                                    revisore, client_file_name, content_type, dimensione, checksum_sha1, id_riunione, id_odg, id_argomento_stato, descrizione, data_rif, data_ultima_revisione, ts_ultima_modifica, hash_md5) 
                                    values ('${company}', ${idris}, coalesce(${nextProgRevisione},0) + 1,'${date}', '${filename}', 
                                    '${requestBody.autore}', 'd'||substr(replace('${datarif}','-',''),0,9)||'_'||'${replaceAll(requestBody.nickname, "'", "''")}', '${requestBody.content_type}', ${dimensione}, 
                                    '${checksum}', ${idriu}, ${idodg}, 4035, '${descrizione}', '${datarif}', '${date}', '${date}', '${md5Checksum}');`;
                            console.log(query);
                            response = await client.query(query);
                            console.log(JSON.stringify(response));

                            query = `insert into entrasp.cdms_risorse_oggetti (codice_azienda, id_risorsa, prog_revisione, nome_business_object, chiave) 
                                    SELECT '${company}', ${idris}, coalesce(${nextProgRevisione},0) + 1, nome_business_object, chiave
                                    FROM entrasp.cdms_risorse_oggetti WHERE codice_azienda='${company}' and id_risorsa=${idris} and prog_revisione=${provr};`;
                            console.log(query);
                            response = await client.query(query);
                            console.log(JSON.stringify(response));


                            //HACK: exception in case of bus_object="cdms_risorse"
                            /*idrisorsa = (idrisorsa == -1) ? idFlowInfo1 : idrisorsa;*/
                            query = `select entrasp.after_lambda_attachments('${company}',  ${idris/* orsa */});`;
                            console.log(query);
                            //??? tolgo await
                            response = await client.query(query);
                            console.log(JSON.stringify(response));


                            body = { result: 'OK' };
                        } else { // wrong checksum 
                            body = { result: 'KO', reason: 'Error with file checksum' };
                        }

                    }

                    /* //HACK: exception in case of bus_object="cdms_risorse"
                    idrisorsa = (idrisorsa == -1) ? idris : idrisorsa; */

                    query = `select entrasp.after_lambda_attachments('${company}',  ${idris/*orsa*/});`; //, ${requestBody.prog_revisione});`;
                    console.log(query);
                    //??? tolgo await
                    response = await client.query(query);
                    console.log(JSON.stringify(response));

                    body = { result: 'OK' };

                } else if (bus_object == 'cdms_risorse') {
                    idris = (keys['id_risorsa'] == undefined) ? null : keys['id_risorsa'];
                    idana = (keys['id_anagrafica'] == undefined) ? null : keys['id_anagrafica'];
                    idceg = (keys['id_centro_gest'] == undefined) ? null : keys['id_centro_gest'];
                    idarg = (keys['id_argomento_tipo_allegato'] == undefined) ? null : keys['id_argomento_tipo_allegato'];
                    console.log('BUS_OBJ = cdms_risorse');
                    //CONTROLLO SE ESISTE REVISIONE
                    query = `select count(*) from entrasp.cdms_risorse_revisioni where checksum_sha1='${checksum}' and codice_azienda='${company}'
                    and id_risorsa = ${idris};`;
                    response = await client.query(query);

                    let filesCount = (response.rows && response.rows[0] && response.rows[0].count) ? parseInt('' + response.rows[0].count) : 0;
                    console.log('response of file exists by checksum_sha1:', response);
                    console.log('row: ' + response.rows[0]);
                    console.log('count: ' + response.rows[0].count);

                    if (filesCount > 0) {
                        //ESISTE FLUSSO ED ESISTE REVISIONE, UPDATE
                        body = { result: 'OK', reason: 'File already loaded!' };
                    }
                    else {
                        const object = await s3.getObject(s3ParamsGetList).promise();
                        const actualChecksum = shasum.update(object.Body).digest('hex');
                        console.log(checksum, actualChecksum);
                        if (checksum === actualChecksum) { // file correctly uploaded
                            dimensione = (requestBody.dimensione == undefined) ? null : requestBody.dimensione;
                            descrizione = (requestBody.descrizione == undefined) ? null : requestBody.descrizione;
                            idodg = (requestBody.id_odg == undefined) ? null : requestBody.id_odg;
                            idriu = (requestBody.id_riunione == undefined) ? null : requestBody.id_riunione;
                            datarif = (requestBody.data_rif == undefined) ? new Date().toISOString() : requestBody.data_rif;
                            //Prendo il massimo prog_revisione
                            query = `select max(prog_revisione) as prog_revisione from entrasp.cdms_risorse_revisioni where id_risorsa=${idris} and codice_azienda='${company}';`;
                            console.log(query);
                            response = await client.query(query);
                            const nextProgRevisione = (response.rows && response.rows[0]) ? response['rows'][0]['prog_revisione'] : 0;
                            query = `insert into entrasp.cdms_risorse_revisioni (codice_azienda, id_risorsa, prog_revisione, data_creazione, file_id, 
                                    revisore, client_file_name, content_type, dimensione, checksum_sha1, id_riunione, id_odg, id_argomento_stato, descrizione, data_rif, data_ultima_revisione, ts_ultima_modifica, hash_md5) 
                                    values ('${company}', ${idris}, coalesce(${nextProgRevisione},0) + 1,'${date}', '${filename}', 
                                    '${requestBody.autore}', 'd'||substr(replace('${datarif}','-',''),0,9)||'_'||'${replaceAll(requestBody.nickname, "'", "''")}', '${requestBody.content_type}', ${dimensione}, 
                                    '${checksum}', ${idriu}, ${idodg}, 4035, '${descrizione}', '${datarif}', '${date}', '${date}', '${md5Checksum}');`;
                            console.log(query);
                            response = await client.query(query);
                            console.log(JSON.stringify(response));

                            query = `insert into entrasp.cdms_risorse_oggetti (codice_azienda, id_risorsa, prog_revisione, nome_business_object, chiave) 
                                    values ('${company}', ${idris}, coalesce(${nextProgRevisione},0) + 1, '${bus_object}','${chiave}');`;
                            console.log(query);
                            response = await client.query(query);
                            console.log(JSON.stringify(response));


                            //HACK: exception in case of bus_object="cdms_risorse"
                            /*idrisorsa = (idrisorsa == -1) ? idFlowInfo1 : idrisorsa;*/
                            query = `select entrasp.after_lambda_attachments('${company}',  ${idris/* orsa */});`;
                            console.log(query);
                            //??? tolgo await
                            response = await client.query(query);
                            console.log(JSON.stringify(response));


                            body = { result: 'OK' };
                        } else { // wrong checksum 
                            body = { result: 'KO', reason: 'Error with file checksum' };
                        }
                    }
                } else {
                    //console.log('requestType: fileCheck');        //OnSave, so on INSERT a new file  AND  also on UPDATE an existing file
                    //CONTROLLO SE ESISTE FLUSSO INFORMATIVO
                    idpro = (keys['id_progetto'] == undefined) ? null : keys['id_progetto'];
                    idsnd = (keys['id_sondaggio'] == undefined) ? null : keys['id_sondaggio'];
                    idsom = (keys['id_somministrazione'] == undefined) ? null : keys['id_somministrazione'];
                    idana = (keys['id_anagrafica'] == undefined) ? null : keys['id_anagrafica'];
                    idceg = (keys['id_centro_gest'] == undefined) ? null : keys['id_centro_gest'];
                    iddom = (keys['id_domanda'] == undefined) ? null : keys['id_domanda'];
                    idmte = (keys['id_modello_test'] == undefined) ? null : keys['id_modello_test'];
                    idmtv = (keys['id_modello_test_vr'] == undefined) ? null : keys['id_modello_test_vr'];
                    codcmp = (keys['codice_compito'] == undefined) ? null : keys['codice_compito'];
                    console.log('codcmp: ', codcmp);
                    idata = (requestBody.id_argomento_tipo_allegato == undefined) ? null : requestBody.id_argomento_tipo_allegato;

                    query = `select entrasp.id_anagrafica_flow('${company}',${idpro},${idsom},${idsnd},${idana},'${codcmp}'), entrasp.id_centro_gest_flow('${company}',${idpro},${idsom},${idsnd},${idceg},'${codcmp}'), entrasp.id_tipo_doc_flow('${company}',${iddom},${idmte},${idmtv},${idsnd},${idata},'${codcmp}');`;
                    response = await client.query(query);
                    const idAnagrafica = (response['rows'][0]['id_anagrafica_flow'] == undefined) ? null : response['rows'][0]['id_anagrafica_flow'];
                    const idCentroGest = (response['rows'][0]['id_centro_gest_flow'] == undefined) ? null : response['rows'][0]['id_centro_gest_flow'];
                    const idArgAll = (response['rows'][0]['id_tipo_doc_flow'] == undefined) ? null : response['rows'][0]['id_tipo_doc_flow'];
                    console.log('Query keys: ', query, ' response ', response, ' keys ', keys);//console.log('response of functions flow:', response);

                    query = `select id_risorsa from entrasp.cdms_risorse where id_argomento_tipo_allegato=${idArgAll} and codice_azienda='${company}' 
                    and id_anagrafica=${idAnagrafica}  limit 1;`; //AA: togliere limit 1, tolto --> and id_centro_gest=${idCentroGest}
                    response = await client.query(query);
                    console.log('response of query for idFlowInfo:', response);

                    const idFlowInfo = response.rows[0];

                    if (idFlowInfo != null) {
                        //CONTROLLO SE ESISTE REVISIONE
                        console.log('Prima del controllo risorsa: checksum, idrisorsa:' + checksum + ' ' + idFlowInfo);
                        query = `select count(id_risorsa) from entrasp.cdms_risorse_revisioni where checksum_sha1='${checksum}' and codice_azienda='${company}'
                    and id_risorsa in(select id_risorsa from entrasp.cdms_risorse where id_argomento_tipo_allegato=${idArgAll} 
                    and codice_azienda='${company}' and id_anagrafica=${idAnagrafica}  limit 1);`; //tolto --> and id_centro_gest=${idCentroGest}
                        response = await client.query(query);

                        let filesCount = (response.rows && response.rows[0] && response.rows[0].count) ? parseInt('' + response.rows[0].count) : 0;
                        console.log('response of file exists by checksum_sha1:', response);
                        console.log('row: ' + response.rows[0]);
                        console.log('count: ' + response.rows[0].count);

                        if (filesCount > 0) {
                            //ESISTE FLUSSO ED ESISTE REVISIONE, UPDATE
                            try {
                                console.log('Esiste flusso ed esiste revisione');
                                query = `select prog_revisione,id_risorsa from entrasp.cdms_risorse_revisioni where id_risorsa in(select id_risorsa from entrasp.cdms_risorse
                            where id_argomento_tipo_allegato=${idArgAll} and codice_azienda='${company}' and id_anagrafica=${idAnagrafica} limit 1)
                            and codice_azienda='${company}' and checksum_sha1='${checksum}';`;  //tolto --> and id_centro_gest=${idCentroGest}
                                console.log(query);
                                response = await client.query(query);
                                const progRevisione = response['rows'][0]['prog_revisione'];
                                const idFlowInfo2 = response['rows'][0]['id_risorsa'];
                                console.log(JSON.stringify(response));

                                query = `insert into entrasp.cdms_risorse_oggetti (codice_azienda, id_risorsa, prog_revisione, nome_business_object, chiave) 
                            values ('${company}', ${idFlowInfo2}, ${progRevisione}, '${bus_object}','${chiave}') ON CONFLICT DO NOTHING;`;
                                console.log(query);
                                response = await client.query(query);
                                console.log(JSON.stringify(response));

                                query = `update entrasp.cdms_risorse_revisioni set id_riunione=coalesce(${requestBody.id_riunione},id_riunione), id_odg=coalesce(${requestBody.id_odg}, id_odg),
                            descrizione=coalesce('${requestBody.descrizione}',descrizione), data_ultima_revisione=current_date, ts_ultima_modifica=coalesce('${date}',ts_ultima_modifica)
                            where codice_azienda='${company}' and id_risorsa=${idFlowInfo2} and prog_revisione=${progRevisione};`;
                                console.log(query);
                                response = await client.query(query);

                                //HACK: exception in case of bus_object="cdms_risorse"
                                /* idrisorsa = (idrisorsa == -1) ? idFlowInfo2 : idrisorsa; */
                                query = `select entrasp.after_lambda_attachments('${company}',  ${idFlowInfo2/* idrisorsa */});`;
                                console.log(query);
                                response = await client.query(query);
                                console.log(JSON.stringify(response));

                                body = { result: 'OK' };
                            }
                            catch (e) {
                                console.log(e);
                            }
                        }
                        else {
                            //ESISTE FLUSSO, NON ESISTE REVISIONE, INSERT
                            console.log('Esiste flusso e non esiste revisione');
                            const object = await s3.getObject(s3ParamsGetList).promise();
                            const actualChecksum = shasum.update(object.Body).digest('hex');
                            console.log(checksum, actualChecksum);
                            if (checksum === actualChecksum) { // file correctly uploaded
                                dimensione = (requestBody.dimensione == undefined) ? null : requestBody.dimensione;
                                descrizione = (requestBody.descrizione == undefined) ? null : requestBody.descrizione;
                                idodg = (requestBody.id_odg == undefined) ? null : requestBody.id_odg;
                                idriu = (requestBody.id_riunione == undefined) ? null : requestBody.id_riunione;
                                datarif = (requestBody.data_rif == undefined) ? new Date().toISOString() : requestBody.data_rif;
                                //Prendo il massimo prog_revisione
                                query = `select max(prog_revisione) as prog_revisione, id_risorsa from entrasp.cdms_risorse_revisioni where id_risorsa in(select id_risorsa from entrasp.cdms_risorse 
                                where id_argomento_tipo_allegato=${idArgAll} AND codice_azienda='${company}' and id_anagrafica=${idAnagrafica} limit 1) 
                                and codice_azienda='${company}' group by id_risorsa;`;  //tolto --> and id_centro_gest=${idCentroGest}
                                console.log(query);
                                response = await client.query(query);
                                response1 = await client.query(`select id_risorsa from entrasp.cdms_risorse where id_argomento_tipo_allegato=${idArgAll} 
                                                                AND codice_azienda='${company}' and id_anagrafica=${idAnagrafica} limit 1`);  //tolto --> and id_centro_gest=${idCentroGest}
                                const nextProgRevisione = (response.rows && response.rows[0]) ? response['rows'][0]['prog_revisione'] : 0;
                                //HOW CAN I DO IT? ASK TO ZEE/NICOLA:
                                //const idFlowInfo1 = (response.rows && response.rows[0] && response.rows[0].count) ? response['rows'][0]['id_risorsa'] : await getRisorsa(requestBody.id_argomento_tipo_allegato, company, idAnagrafica, idCentroGest);
                                const idFlowInfo1 = (response.rows && response.rows[0] && response.rows[0].count) ? response['rows'][0]['id_risorsa'] : response1['rows'][0]['id_risorsa'];
                                console.log(JSON.stringify(response));

                                query = `insert into entrasp.cdms_risorse_revisioni (codice_azienda, id_risorsa, prog_revisione, data_creazione, file_id, 
                                revisore, client_file_name, content_type, dimensione, checksum_sha1, id_riunione, id_odg, id_argomento_stato, descrizione, data_rif, data_ultima_revisione, ts_ultima_modifica, hash_md5) 
                                values ('${company}', ${idFlowInfo1}, coalesce(${nextProgRevisione},0) + 1,'${date}', '${filename}', 
                                '${requestBody.autore}', 'd'||substr(replace('${datarif}','-',''),0,9)||'_'||'${replaceAll(requestBody.nickname, "'", "''")}', '${requestBody.content_type}', ${dimensione}, 
                                '${checksum}', ${idriu}, ${idodg}, 4035, '${descrizione}', '${datarif}', '${date}', '${date}', '${md5Checksum}');`;
                                console.log(query);
                                response = await client.query(query);
                                console.log(JSON.stringify(response));

                                //INSERISCO ASSOCIAZIONE RISORSA/CEGE
                                query = `insert into entrasp.cdms_risorse_destinatari (codice_azienda, id_risorsa, codice_part, id_centro_gest)
                                select '${company}', ${idFlowInfo1}, (SELECT codice_part FROM entrasp.aziende WHERE codice_azienda='${company}'), ${idCentroGest} ON CONFLICT DO NOTHING;`;
                                console.log(query);
                                response = await client.query(query);
                                console.log(JSON.stringify(response));

                                query = `insert into entrasp.cdms_risorse_oggetti (codice_azienda, id_risorsa, prog_revisione, nome_business_object, chiave) 
                                values ('${company}', ${idFlowInfo1}, coalesce(${nextProgRevisione},0) + 1, '${bus_object}','${chiave}');`;
                                console.log(query);
                                response = await client.query(query);
                                console.log(JSON.stringify(response));


                                //HACK: exception in case of bus_object="cdms_risorse"
                                /* idrisorsa = (idrisorsa == -1) ? idFlowInfo1 : idrisorsa; */
                                query = `select entrasp.after_lambda_attachments('${company}',  ${idFlowInfo1/* idrisorsa */});`;
                                console.log(query);
                                //??? tolgo await
                                response = await client.query(query);
                                console.log(JSON.stringify(response));


                                body = { result: 'OK' };
                            } else { // wrong checksum 
                                body = { result: 'KO', reason: 'Error with file checksum' };
                            }
                        }
                    }
                    else {
                        //NON ESISTE FLUSSO INFORMATIVO, CREO FLUSSO INFORMATIVO E REVISIONE
                        console.log('Non esiste flusso, creo flusso e revisione');
                        query = `SELECT coalesce(max(id_risorsa),0) + 1 as id_risorsa from entrasp.cdms_risorse WHERE codice_azienda='${company}';`;
                        console.log(query);
                        response = await client.query(query);
                        const nextId = response['rows'][0]['id_risorsa'];
                        console.log(JSON.stringify(response));

                        query = `insert into entrasp.cdms_risorse (codice_azienda, id_risorsa, id_argomento_tipo_allegato, id_anagrafica, descrizione, descrizione_breve)
                        select '${company}', ${nextId}, ${idArgAll}, ${idAnagrafica}, 
                        entrasp.argomenti_descr( ${idArgAll}), entrasp.argomenti_descr_breve( ${idArgAll});`; // tolto --> id_centro_gest,    +    ${idCentroGest}, 
                        console.log(query);
                        response = await client.query(query);
                        console.log(JSON.stringify(response));

                        //INSERISCO ASSOCIAZIONE RISORSA/CEGE
                        query = `insert into entrasp.cdms_risorse_destinatari (codice_azienda, id_risorsa, codice_part, id_centro_gest)
                        select '${company}', ${nextId}, (SELECT codice_part FROM entrasp.aziende WHERE codice_azienda='${company}'), ${idCentroGest};`;
                        console.log(query);
                        response = await client.query(query);
                        console.log(JSON.stringify(response));

                        //INSERT revisione
                        const object = await s3.getObject(s3ParamsGetList).promise();
                        const actualChecksum = shasum.update(object.Body).digest('hex');
                        console.log(checksum, actualChecksum);
                        if (checksum === actualChecksum) { // file correctly uploaded
                            dimensione = (requestBody.dimensione == undefined) ? null : requestBody.dimensione;
                            descrizione = (requestBody.descrizione == undefined) ? null : requestBody.descrizione;
                            idodg = (requestBody.id_odg == undefined) ? null : requestBody.id_odg;
                            idriu = (requestBody.id_riunione == undefined) ? null : requestBody.id_riunione;
                            datarif = (requestBody.data_rif == undefined) ? new Date().toISOString() : requestBody.data_rif;

                            query = `insert into entrasp.cdms_risorse_revisioni (codice_azienda, id_risorsa, prog_revisione, data_creazione, file_id, 
                        revisore, client_file_name, content_type, dimensione, checksum_sha1, id_riunione, id_odg, id_argomento_stato, descrizione, data_rif, data_ultima_revisione, ts_ultima_modifica, hash_md5) 
                        values ('${company}', ${nextId}, 1,'${date}', '${filename}', 
                        '${requestBody.autore}', 'd'||substr(replace('${datarif}','-',''),0,9)||'_'||'${replaceAll(requestBody.nickname, "'", "''")}', '${requestBody.content_type}', ${dimensione}, 
                        '${checksum}', ${idriu}, ${idodg}, 4035, '${descrizione}' , '${datarif}', '${date}', '${date}','${md5Checksum}');`;
                            console.log(query);
                            response = await client.query(query);
                            console.log(JSON.stringify(response));

                            query = `insert into entrasp.cdms_risorse_oggetti (codice_azienda, id_risorsa, prog_revisione, nome_business_object, chiave) 
                            values ('${company}', ${nextId}, 1, '${bus_object}','${chiave}');`;
                            console.log(query);
                            response = await client.query(query);
                            console.log(JSON.stringify(response));

                            //HACK: exception in case of bus_object="cdms_risorse"
                            /* idrisorsa = (idrisorsa == -1) ? nextId : idrisorsa; */
                            query = `select entrasp.after_lambda_attachments('${company}',  ${nextId/* idrisorsa */});`;    //Da mandare in background...
                            console.log(query);
                            //??? tolgo await
                            response = await client.query(query);
                            console.log(JSON.stringify(response));

                            body = { result: 'OK' };
                        } else { // wrong checksum 
                            body = { result: 'KO', reason: 'Error with file checksum' };
                        }
                    }
                }
            } else if (requestType === 'deleteFile') {
                //console.log('requestType: deleteFile');       //OnDelete existing file
                // create a temporary signed URL for the object 
                const signedUrl = s3.getSignedUrl('deleteObject', s3ParamsInsert);

                const requestBody = JSON.parse(event.body);

                console.log('prog_revisione: ' + prog_revisione);

                query = `delete from entrasp.cdms_risorse_oggetti where codice_azienda='${company}' and id_risorsa=${id_risorsa} 
                         and nome_business_object='${bus_object}' and chiave='${chiave}' and prog_revisione='${prog_revisione}';`;
                response = await client.query(query);

                //Always delete from entrasp.cdms_risorse_revisioni because for the selected flow_info i can have only one document with this sha1
                /* query = `select count(*) from entrasp.cdms_risorse_revisioni where codice_azienda='${company}' and id_risorsa=${id_risorsa} and prog_revisione='${prog_revisione}';`;
                response = await client.query(query); */

                /* let objectCount = (response.rows && response.rows[0] && response.rows[0].count) ? parseInt('' + response.rows[0].count) : 0;
                console.log('response of file exists by checksum_sha1:', response);
                console.log('row: ' + response.rows[0]);
                console.log('count: ' + response.rows[0].count);
                if (objectCount = 0) { */
                query = `delete from entrasp.cdms_risorse_revisioni where codice_azienda='${company}' and id_risorsa=${id_risorsa} and prog_revisione='${prog_revisione}';`;
                response = await client.query(query);

                //query = `delete from entrasp.cdms_risorse where codice_azienda='${company}' and id_risorsa=${id_risorsa};`;
                //response = await client.query(query);
                //}
                body = { result: 'OK', url: signedUrl };
            } else if (requestType === 'getContents') {
                // const s3ParamsGetFilesList = {
                //     Bucket: bucket,
                //     Prefix: folder
                // };

                const s3ParamsGetFilesList = {
                    Bucket: 'BUCKET_NAME',
                    Prefix: contentsPrefix,
                    Delimiter: '/',
                };

                let contents = await s3.listObjects(s3ParamsGetFilesList).promise();

                body = { result: 'OK', contents: contents };
            }
        }


    } catch (e) {
        console.log(e);
        body = { result: 'KO', reason: 'Server error' };
    }

    if (requestType !== 'getFileURL') {
        await client.release();
    }

    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify(body)
    };
};