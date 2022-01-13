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

    /*
    console.log('busobject ' +business_object); 
    
    if(business_object == 'sondaggiSomministrati'){

        let codAz = entry_params.form_keys.filter(x => x.key == 'codice_azienda')[0];
        codAz.key

        keys['codice_azienda'] = torna il valore del cod azienda

        let objectName=entry_params.form_keys.object_name;
        let idAnagrafica = await client.query(`select entrasp.field_value_from_key(${objectKey}, ${objectName}, 'id_anagrafica','|')::numeric`);

    }else if(business_object == 'riepilogoRisposte'){

        let idSnd=entry_params.form_keys.id_sondaggio;
        let idSom=entry_params.form_keys.id_somministrazione;
        let id_anagrafica = await client.query(`select entrasp.field_value_from_key(object_key, object_name, 'id_anagrafica','|')::numeric from entrasp.sondaggi_somministrati 
        where codice_azienda=${company} and id_somministrazione=${idSom} and id_sondaggio=${idSnd}`);

    }else if(business_object == 'modelliTest'){
        //
    }else if(business_object == 'progetti'){
        //
    }else if(business_object == 'anagraficheId'){
        //
    }else if(business_object == 'centriGestionali'){
        //
    }else if(business_object == 'compiti'){
        //
    }    //... e tutti gli altri

    function getIdAnagrafica ()
    //POSSO?
    /* let id_centro_gest_form = entry_params.form_keys('id_centro_gest');
    console.log('cege ' +id_centro_gest_form);
    let id_anagrafica_form = entry_params.form_keys.id_anagrafica;
    console.log('anag ' +id_anagrafica_form); 
    */

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

    console.log('QUERY PARAMS:'+queryParams);

    // const queryParams = event; / test

    let keys = JSON.parse(queryParams['keys']);
    const entryName = queryParams['entry_name'];
    const checksum = queryParams['checksum'];
    const request_type = queryParams['request_type'];
    const company = queryParams['company'];
    var filename = queryParams['filename'];
    var id_risorsa = queryParams['id_risorsa'];
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

    if (entryName == null || keys == null || company == null) {
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

    const date = getDateFormat();

    try {

        if (requestType === 'getFileURL') {
            //console.log('IN: getFileURL');
            var url = s3.getSignedUrl('getObject', s3ParamsGetList);
            if (url == null) {
                body = { result: 'KO', reason: 'Something wrong with cloud storage' };
            } else {
                body = { result: 'OK', url: url };
            }
        } else {
            //console.log('IN: else of getFileURL');    //often here
            const bus_object = await tableName2BusinessObject(entryName);

            client = await pool.connect();

            let query, response;

            let chiave = '';

            let idrisorsa;

            keys = Object.assign({ 'codice_azienda': company }, keys);

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

            if (requestType === 'getFileList') {
                //console.log('requestType: getFileList');      //When load some page with attach icon OR "click" on attach icon
                query = `select * from entrasp.cdms_risorse_oggetti where codice_azienda='${company}' AND nome_business_object='${bus_object}'
                 AND chiave='${chiave}';`;
                response = await client.query(query);
                console.log(query, response);
                let ids = response['rows'].map(f => f['id_risorsa']);
                for (let i = 0; i < ids.length; i++) {      //PER OGNI FILE ALLEGATO A QUEST'OGGETTO
                    query = `select * from entrasp.cdms_risorse as a 
                inner join entrasp.cdms_risorse_revisioni as b on a.codice_azienda = b.codice_azienda AND a.id_risorsa = b.id_risorsa 
                where a.codice_azienda='${company}' AND a.id_risorsa=${ids[i]};`;
                    response = await client.query(query);
                    console.log(query, response);
                    decnames.push(response['rows'][0]);
                }
                body = { result: 'OK', list: decnames };
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
                //console.log('requestType: fileCheck');        //OnSave, so on INSERT a new file  AND  also on UPDATE an existing file
                //CONTROLLO SE ESISTE FLUSSO INFORMATIVO
                //vedere come prendere id_anagrafica e id_centro_gest, vedi righe sopra, 84 e 85
                const requestBody = JSON.parse(event.body);
                console.log('ID_ANAGRAFICA: '+requestBody.id_anagrafica+ 'ID_RIUNIONE: '+requestBody.id_riunione+', ID_ARG_ALLEGATO: '+requestBody.id_argomento_tipo_allegato);
                query = `select id_risorsa from entrasp.cdms_risorse where id_argomento_tipo_allegato=${requestBody.id_argomento_tipo_allegato} AND codice_azienda='${company}' and id_anagrafica=${requestBody.id_anagrafica};`; //and id_centro_gest=${requestBody.id_centro_gest};`;
                response = await client.query(query);

                const idFlowInfo = response['rows'][0]['id_risorsa'];
                console.log('response of flow exists:', response);
                console.log('row: ' + response.rows[0]);
                console.log('count: ' + response.rows[0].count);

                if (idFlowInfo) {
                    //CONTROLLO SE ESISTE REVISIONE
                    query = `select count(id_risorsa) from entrasp.cdms_risorse_revisioni where checksum_sha1='${checksum}' AND codice_azienda='${company};'`;
                    response = await client.query(query);

                    let filesCount = (response.rows && response.rows[0] && response.rows[0].count) ? parseInt('' + response.rows[0].count) : 0;
                    console.log('response of file exists by checksum_sha1:', response);
                    console.log('row: ' + response.rows[0]);
                    console.log('count: ' + response.rows[0].count);

                    if (filesCount > 0) {
                        //ESISTE FLUSSO ED ESISTE REVISIONE, UPDATE
                        try {
                            console.log('Esiste flusso ed esiste revisione');
                            query = `select prog_revisione from entrasp.cdms_risorse_revisioni where id_risorsa = ${idFlowInfo} and codice_azienda='${company}' and checksum_sha1=${checksum};`;
                            console.log(query);
                            response = await client.query(query);
                            const progRevisione = response['rows'][0]['prog_revisione'];
                            console.log(JSON.stringify(response));
                            //const requestBody = JSON.parse(event.body);
                            idarg = (requestBody.id_argomento_tipo_allegato == undefined) ? null : requestBody.id_argomento_tipo_allegato;
                            idcg = (requestBody.id_centro_gest == undefined) ? null : requestBody.id_centro_gest;
                            dataRif = (requestBody.data_rif == undefined) ? null : requestBody.data_rif;
                            dataScad = (requestBody.data_scadenza == undefined) ? null : requestBody.data_scadenza;

                            //CHE SENSO HA? ESISTE FLUSSO INFORMATIVO ED ANCHE DOCUMENTO, QUINDI NON SONO SU UN ALTRO OGGETTO 

                            //------IMPOSSIBILE CHE PER UN FLUSSO INFORMATIVO ESISTANO 2 DOCUMENTI IDENTICI(STESSO CHECKSUM)------

                            query = `insert into entrasp.cdms_risorse_oggetti (codice_azienda, id_risorsa, prog_revisione, nome_business_object, chiave) 
                            values ('${company}', ${idFlowInfo}, ${progRevisione}, '${bus_object}','${chiave}');`;
                            console.log(query);
                            response = await client.query(query);
                            console.log(JSON.stringify(response));

                            /*PER RIFERIMENTO, CAMPI DA AGGIUNGERE A REVISIONI.
            
                                INSERT ON REVISIONI: data_ultima_revisione ts_ultima_modifica e quali altri?
                            
                            */

                            query = `update entrasp.cdms_risorse_revisioni set id_riunione=coalesce(${requestBody.id_riunione},id_riunione), id_odg=coalesce(${requestBody.id_odg}, id_odg),
                            descrizione=coalesce('${requestBody.descrizione}',descrizione), data_ultima_revisione=current_date, ts_ultima_modifica=coalesce('${date}',ts_ultima_modifica),
                            where codice_azienda='${company}' and id_risorsa=${idRisorsaExisting} and prog_revisione=${progRevisioneExisting};`;
                            console.log(query);
                            response = await client.query(query);

                            //HACK: exception in case of bus_object="cdms_risorse"
                            idrisorsa = (idrisorsa == -1) ? idRisorsaExisting : idrisorsa;
                            query = `select entrasp.after_lambda_attachments('${company}',  ${idrisorsa});`;
                            console.log(query);
                            response = await client.query(query);
                            console.log(JSON.stringify(response));


                        }
                        catch (e) {
                            console.log(e);
                        }
                    }
                    else {
                        //ESISTE FLUSSO, NON ESISTE DOCUMENTO, INSERT
                        console.log('Esiste flusso e non esiste revisione');
                        //Here Insert new file
                        const object = await s3.getObject(s3ParamsGetList).promise();
                        const actualChecksum = shasum.update(object.Body).digest('hex');
                        //const requestBody = JSON.parse(event.body);
                        console.log(checksum, actualChecksum);
                        if (checksum === actualChecksum) { // file correctly uploaded
                            //Prendo il massimo prog_revisione
                            query = `select max(prog_revisione) as prog_revisione from entrasp.cdms_risorse_revisioni where id_risorsa = ${idFlowInfo} and codice_azienda='${company}';`;
                            console.log(query);
                            response = await client.query(query);
                            const nextProgRevisione = response['rows'][0]['prog_revisione'];
                            console.log(JSON.stringify(response));

                            //current_date o ${date} ????? vedi ultimi 2 values..
                            query = `insert into entrasp.cdms_risorse_revisioni (codice_azienda, id_risorsa, prog_revisione, data_creazione, file_id, 
                            revisore, client_file_name, content_type, dimensione, checksum_sha1, id_riunione, id_odg, id_argomento_stato, data_ultima_revisione, ts_ultima_modifica) 
                            values ('${company}', ${idFlowInfo}, coalesce(${nextProgRevisione},0) + 1,'${date}', '${filename}', 
                            '${requestBody.autore}', '${replaceAll(requestBody.nickname, "'", "''")}', '${requestBody.content_type}', ${requestBody.dimensione}, 
                            '${checksum}', ${requestBody.id_riunione}, ${requestBody.id_odg}, 4035, current_date, current_date);`;
                            console.log(query);
                            response = await client.query(query);
                            console.log(JSON.stringify(response));

                            query = `insert into entrasp.cdms_risorse_oggetti (codice_azienda, id_risorsa, prog_revisione, nome_business_object, chiave) 
                             values ('${company}', ${idFlowInfo}, coalesce(${nextProgRevisione},0) + 1, '${bus_object}','${chiave}');`;
                            console.log(query);
                            response = await client.query(query);
                            console.log(JSON.stringify(response));

                            //HACK: exception in case of bus_object="cdms_risorse"
                            idrisorsa = (idrisorsa == -1) ? idFlowInfo : idrisorsa;
                            query = `select entrasp.after_lambda_attachments('${company}',  ${idrisorsa});`;    //Da mandare in background... pesante
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
                    //NON ESISTE FLUSSO INFORMATIVO, CREO FLUSSO INFORMATIVO
                    console.log('Non esiste flusso, creo flusso e revisione');
                    query = `SELECT coalesce(max(id_risorsa),0) + 1 as id_risorsa from entrasp.cdms_risorse WHERE codice_azienda='${company}';`;
                    console.log(query);
                    response = await client.query(query);
                    const nextId = response['rows'][0]['id_risorsa'];
                    console.log(JSON.stringify(response));
                    query = `insert into entrasp.cdms_risorse (codice_azienda, id_risorsa, id_argomento_tipo_allegato, id_centro_gest, id_anagrafica)
                    values ('${company}', ${nextId}, ${requestBody.id_argomento_tipo_allegato}, 1, ${requestBody.id_anagrafica});`;  //metti centro gest ****************************************************************************************************************************
                    console.log(query);
                    response = await client.query(query);
                    console.log(JSON.stringify(response));

                    //INSERT revisione
                    const object = await s3.getObject(s3ParamsGetList).promise();
                    const actualChecksum = shasum.update(object.Body).digest('hex');
                    //const requestBody = JSON.parse(event.body);
                    console.log(checksum, actualChecksum);
                    if (checksum === actualChecksum) { // file correctly uploaded
                        //current_date o ${date} ????? vedi ultimi 2 values..
                        query = `insert into entrasp.cdms_risorse_revisioni (codice_azienda, id_risorsa, prog_revisione, data_creazione, file_id, 
                        revisore, client_file_name, content_type, dimensione, checksum_sha1, id_riunione, id_odg, id_argomento_stato, data_ultima_revisione, ts_ultima_modifica) 
                        values ('${company}', ${nextId}, 1,'${date}', '${filename}', 
                        '${requestBody.autore}', '${replaceAll(requestBody.nickname, "'", "''")}', '${requestBody.content_type}', ${requestBody.dimensione}, 
                        '${checksum}', ${requestBody.id_riunione}, ${requestBody.id_odg}, 4035, current_date, current_date);`;
                        console.log(query);
                        response = await client.query(query);
                        console.log(JSON.stringify(response));

                        query = `insert into entrasp.cdms_risorse_oggetti (codice_azienda, id_risorsa, prog_revisione, nome_business_object, chiave) 
                         values ('${company}', ${nextId}, 1, '${bus_object}','${chiave}');`;
                        console.log(query);
                        response = await client.query(query);
                        console.log(JSON.stringify(response));

                        //HACK: exception in case of bus_object="cdms_risorse"
                        idrisorsa = (idrisorsa == -1) ? nextId : idrisorsa;
                        query = `select entrasp.after_lambda_attachments('${company}',  ${idrisorsa});`;    //Da mandare in background...
                        console.log(query);
                        //??? tolgo await
                        response = await client.query(query);
                        console.log(JSON.stringify(response));

                        body = { result: 'OK' };
                    } else { // wrong checksum 
                        body = { result: 'KO', reason: 'Error with file checksum' };
                    }
                }

            } else if (requestType === 'deleteFile') {
                //console.log('requestType: deleteFile');       //OnDelete existing file
                // create a temporary signed URL for the object 
                const signedUrl = s3.getSignedUrl('deleteObject', s3ParamsInsert);

                const requestBody = JSON.parse(event.body);

                query = `delete from entrasp.cdms_risorse_oggetti where codice_azienda='${company}' and id_risorsa=${id_risorsa} and nome_business_object='${bus_object}' and chiave='${chiave}';`;
                response = await client.query(query);

                query = `select count(id_risorsa) from entrasp.cdms_risorse_oggetti where codice_azienda='${company}' and id_risorsa=${id_risorsa};`;
                response = await client.query(query);

                let objectCount = (response.rows && response.rows[0] && response.rows[0].count) ? parseInt('' + response.rows[0].count) : 0;
                console.log('response of file exists by checksum_sha1:', response);
                console.log('row: ' + response.rows[0]);
                console.log('count: ' + response.rows[0].count);
                if (objectCount = 0) {
                    query = `delete from entrasp.cdms_risorse_revisioni where codice_azienda='${company}' and id_risorsa=${id_risorsa};`;
                    response = await client.query(query);

                    query = `delete from entrasp.cdms_risorse where codice_azienda='${company}' and id_risorsa=${id_risorsa};`;
                    response = await client.query(query);
                }
                body = { result: 'OK', url: signedUrl };
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