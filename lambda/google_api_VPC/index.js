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
