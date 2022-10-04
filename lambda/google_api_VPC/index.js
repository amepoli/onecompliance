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

// Get Bad URL Response
function getBadUrlResponse() {
    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 500,
        "error": "Bad URL"
    };
}

exports.handler = async (event, context) => {

    const shasum = crypto.createHash('sha1');

    const queryParams = event.queryStringParameters;

    console.log(queryParams);

    // const queryParams = event; / test

    //let keys = queryParams['keys'] ? JSON.parse(queryParams['keys']) : null;
    //const entryName = queryParams['entry_name'];
    const checksum = queryParams['checksum'];
    //const md5Checksum =  (queryParams['md5_checksum'] == undefined) ? null : queryParams['md5_checksum'];
    const request_type = queryParams['request_type'];
    //const contentsPrefix = queryParams['contents_prefix'];
    const company = queryParams['company'];
    //file_id, s3path, googledivepath

    //var filename = queryParams['filename'];
    //var id_risorsa = queryParams['id_risorsa'];
    //var prog_revisione = queryParams['prog_revisione'];
    var requestType = '';

    if (request_type) {
        requestType = request_type;
    }

    /*
    if (requestType !== 'getGoogleDriveFileCopyParams' && requestType !== 'getS3GoogleSyncFilesList' && requestType !== 'getGoogleDriveFolderNameByAnagrafica' && requestType !== 'setProperFileFolder' && requestType !== 'anagraficheToBeUpdated' && requestType !== 'associateEmails') {
        if (entryName == null || keys == null || company == null) {
            requestType = 'badRequest';
        }
    }
    */

    console.log('Lets start ' + requestType);

    if (requestType === 'badRequest') {
        return getBadUrlResponse();
    }

    /*
    const s3ParamsInsert = {
        Bucket: 'BUCKET_NAME',
        Key: company + '/' + filename
    };

    const s3ParamsGetList = {
        Bucket: 'BUCKET_NAME',
        Key: company + '/' + filename
    };
    */

    let client, body;
    //let decnames = [];

    //const date = getDateFormat();

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
            if(id_sondaggio) {
                query = `select entrasp.anagrafica_folder_name_and_sub_folders(cg.codice_azienda_erogante, an.id_anagrafica, '${username}', idsondaggio=>snd.id_sondaggio)
                from entrasp.sondaggi snd
                inner join entrasp.centri_gestionali cg on snd.id_centro_gest=cg.id_centro_gest and snd.codice_part=cg.codice_part
                inner join entrasp.aziende az on cg.codice_azienda_erogante=az.codice_azienda
                inner join entrasp.anagrafiche_id an on snd.codice_azienda=an.codice_azienda_corrispondente
                and snd.id_sondaggio=${id_sondaggio} and snd.codice_azienda='${company}' and an.codice_part!='${codice_part}' and az.codice_part=an.codice_part
                and cg.codice_azienda_erogante is not null;`;
            }
            else {
                query = `select * from entrasp.anagrafica_folder_name_and_sub_folders('${company}', '${id_anagrafica}', '${username}', ${id_risorsa ? "'" + id_risorsa + "'":  "null"});`;
            }
            console.log('running query: ', query);
            let response = await client.query(query);
            let folderNames = null;
            console.log('response', response.rows);
            if(response && response.rows) {
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
        else {
            console.log('else block');
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

/*
exports.handler = async (event) => {

    //Declare queryParams
    const queryParams = event.queryStringParameters ? event.queryStringParameters : event;
    console.log('queryParams: ', queryParams);

    const requestType = queryParams['request_type'];

    if (!requestType) {
        return getBadUrlResponse();
    }
    else {

        console.log('Lets start ', requestType);

        if (requestType === 'getConnectedRegistries') {

            //1. Auth in Google
            authToken = await lambda.invoke({
                FunctionName: 'FUNCTION_NAME',
                Payload: JSON.stringify({ request_type: 'loadAuthToken', token_type: 'gdrive' })
            }).promise();

            if (response.result === 'KO') {
                return {
                    "isBase64Encoded": false,
                    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    "statusCode": 500,
                    "error": "Impossible to authenticate in GDrive"
                };
            }

            //2. Second step, get changes from google drive
            changes = await lambda.invoke({
                FunctionName: 'FUNCTION_NAME',
                Payload: JSON.stringify({ request_type: 'getChanges' }, authToken)
                //body: authToken                                             //TO CHECK
            }).promise();


            //3. Third step, get anagrafiche/risorse to be updated
            try {

                //Create new pool to connect the DB
                client = await pool.connect();

                let query = "";
                let anagraficheToBeUpdated;

                query = `select entrasp.anagrafiche_to_be_updated(${changes});`;

                //console.log('running query: ', query);
                anagraficheToBeUpdated = await client.query(query);

                //release the client
                await client.release();

            } catch (e) {
                return {
                    "statusCode": 200,
                    "isBase64Encoded": false,
                    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    "body": JSON.stringify({ "response": "KO", "reason": "Something wrong with accessing the DB" })
                };
            }


            //4.Sync GDrive
            for (let i = 0; i < anagraficheToBeUpdated.length; i++) {

                const codice_azienda = anagraficheToBeUpdated.response.rows[i]['codice_azienda'];
                const id_anagrafica = anagraficheToBeUpdated.response.rows[i]['anagrafica_id'];
                const id_risorsa = anagraficheToBeUpdated.response.rows[i]['id_risorsa'];
                const username = anagraficheToBeUpdated.response.rows[i]['username'];

                //Create new pool to connect the DB
                client = await pool.connect();

                let query = "";
                let anagraficaFolderNameAndSubFolders;

                query = `select * from entrasp.anagrafica_folder_name_and_sub_folders('${codice_azienda}', '${id_anagrafica}', '${username}', ${id_risorsa ? "'" + id_risorsa + "'" : "null"});`;

                console.log('running query: ', query);

                anagraficaFolderNameAndSubFolders = await client.query(query);

                let folderNames = null;

                console.log('response', anagraficaFolderNameAndSubFolders.rows);

                if (anagraficaFolderNameAndSubFolders && anagraficaFolderNameAndSubFolders.rows) {

                    folderNames = anagraficaFolderNameAndSubFolders.rows;

                    let anagraficaFolders = anagraficaFolderNameAndSubFolders.response[0]['anagrafica_folder_name_and_sub_folders'];
                    //anagraficaFolders['root_folder'] = '0020-Amedeo Poli';
                    let sub_folders = anagraficaFolders['sub_folders'];
                    if (sub_folders && sub_folders.length > 0) {
                        for (let i = 0; i < sub_folders.length; i++) {
                            if (sub_folders[i]['folder'].endsWith('/')) {
                                sub_folders[i]['folder'] = sub_folders[i]['folder'].slice(0, -1);
                            }
                            if (!sub_folders[i]['folder'].includes('/')) {
                                sub_folders[i]['fileid'] = sub_folders[i]['s3Folder'] + '/' + sub_folders[i]['fileid'];
                            }
                        }
                        //sub_folders = sub_folders.filter(x => !x.md5 || !x.md5.includes('null::varchar'))

                        anagraficaFolders['sub_folders'] = sub_folders;

                        console.log('anagraficaFolders: ', anagraficaFolders);

                        const driveFolder = anagraficaFolders['root_folder'];
                        const subFolders = anagraficaFolders['sub_folders'] || [];

                        let foldersToCheck = [driveFolder];
                        if (subFolders && subFolders.length > 0) {
                            for await (let subFolder of subFolders) {
                                if (!foldersToCheck.includes(subFolder.folder)) {
                                    foldersToCheck.push(subFolder.folder);
                                }
                            }
                        }

                        console.log('foldersToCheck: ', JSON.stringify(foldersToCheck));

                        anagraficaFolders['folder_ids'] = {};
                        for await (let folderToCheck of foldersToCheck) {
                            let fixDriveFolderPathByIdentifierResponse = await lambda.invoke({
                                FunctionName: 'FUNCTION_NAME',
                                Payload: JSON.stringify({ request_type: 'fixDriveFolderPathByIdentifier' }, folderToCheck, authToken)
                                //body: authToken   //TO CHECK
                            }).promise();


                            await _this.backendService.fixDriveFolderPathByIdentifier(folderToCheck, googleAuth).toPromise();
                            anagraficaFolders['folder_ids'][fixDriveFolderPathByIdentifierResponse['folder']] = fixDriveFolderPathByIdentifierResponse['folderId'];

                        }

                        anagraficaFolders['codice_azienda'] = codiceAzienda;
                        console.log('anagraficaFolders: ', anagraficaFolders);

                        let getDriveFolderDeepContentsResponse = await lambda.invoke({
                            FunctionName: 'FUNCTION_NAME',
                            Payload: JSON.stringify({ request_type: 'getDriveFolderDeepContentsResponse' }, anagraficaFolders, authToken),
                            //body: authToken   //TO CHECK
                        }).promise();
                        console.log('getDriveFolderDeepContentsResponse: ', getDriveFolderDeepContentsResponse);

                        let syncDataResponse = [];
                        for (const x of getDriveFolderDeepContentsResponse.syncData) {
                            let syncDriveS3FileResponse = await lambda.invoke({
                                FunctionName: 'FUNCTION_NAME',
                                Payload: JSON.stringify({ request_type: 'syncDriveS3File' }, JSON.stringify([x]), syncMode, authToken)
                                //body: authToken   //TO CHECK
                            }).promise();
                            syncDataResponse.push(syncDriveS3FileResponse);
                            console.log(syncDriveS3FileResponse);
                        };
                        console.log('syncDataResponse', syncDataResponse);

                        anagraficaFolders['root_drive_contents'] = getDriveFolderDeepContentsResponse.rootDriveContents;
                        let processDriveFolderDeepContentsResponse = await lambda.invoke({
                            FunctionName: 'FUNCTION_NAME',
                            Payload: JSON.stringify({ request_type: 'processDriveFolderDeepContents' }, anagraficaFolders, authToken)
                            //body: authToken   //TO CHECK
                        }).promise();
                        console.log('processDriveFolderDeepContentsResponse ', processDriveFolderDeepContentsResponse);

                        let filteredFilesForSetProperFileFolder = [];
                        for (let file of processDriveFolderDeepContentsResponse.files) {
                            if (file.fileid.includes('/')) {
                                file.fileid = file.fileid.split('/')[1];
                            }
                            if (filteredFilesForSetProperFileFolder.filter(x => x.fileid == file.fileid && x.filename == file.filename && x.folder == file.folder).length == 0) {
                                filteredFilesForSetProperFileFolder.push(file);
                            }
                        }

                        let contentsJson = {
                            codice_azienda: codice_azienda,
                            id_progetto: null,
                            id_anagrafica: id_anagrafica,
                            files: filteredFilesForSetProperFileFolder
                        }
                        console.log(contentsJson);

                        //Create new pool to connect the DB
                        client = await pool.connect();
                        let query = `select * from entrasp.set_proper_file_folder(('${contentsJson}')::json);`;
                        console.log('running query: ', query);
                        let response = await client.query(query);
                        console.log('response', response.rows);

                        let performDriveOperationsResponse = [];
                        if (setProperFileFolderResponse.response && setProperFileFolderResponse.response.rows && setProperFileFolderResponse.response.rows.length > 0) {
                            for await (let operation of setProperFileFolderResponse.response.rows) {
                                let performDriveOperationResponse = await lambda.invoke({
                                    FunctionName: 'FUNCTION_NAME',
                                    Payload: JSON.stringify({ request_type: 'performDriveOperations' }, [operation], authToken),
                                    //body: authToken   //TO CHECK
                                }).promise();
                                performDriveOperationsResponse.push(performDriveOperationResponse);
                            }
                        }
                        console.log('performDriveOperations Response: ', performDriveOperationsResponse);
                    }

                }
            }
        }
        else {
            console.log('Cry a lot :(');
        }
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};
*/
