const excel = require('node-excel-export');

const AWS = require('aws-sdk');
AWS.config.update({ region: 'REGION' });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const bucket = 'BUCKET_NAME';
const region = 'REGION';
const accessKey = 'ACCESS_KEY';
const secret = 'j+PM/Zgnu/sXU6dhHd0wXraJn3a9NtCRgQbI0S6P';

const schema = 'SCHEMA';

const dynamo = new AWS.DynamoDB.DocumentClient();

const Pool = require('pg-pool');
const pool = new Pool({
    host: 'HOST_NAME',
    database: 'DB_NAME',
    user: 'postgres',
    password: 'et2themax',
    port: 5432,
    max: 1,
    min: 0,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 1000
});

const global_variables = {
    global_codice_azienda: '',
    global_codice_part: '',
    global_userid: 0
};

function getDateFormat() {
    var d = new Date();
    var month = d.getMonth() + 1;
    return d.getFullYear() + '-' + month.toString() + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
}

/*
async function addCodiceAzienda(keys, company, view_keys, client, isForm) {

    const entry_keys = isForm ? view_keys.form_keys : view_keys.table_keys;

    const entry_azienda = entry_keys.find(entry => entry.key === 'codice_azienda');
    const entry_part = entry_keys.find(entry => entry.key === 'codice_part');

    if (entry_azienda != null) {
        keys['codice_azienda'] = company;
    }

    if (entry_part != null) {

        const queryString = "SELECT codice_part FROM entrasp.aziende WHERE codice_azienda='" + company + "';";

        const response = await client.query(queryString);


        if (response != null) {
            keys['codice_part'] = response.rows[0].codice_part;
        }
    }

    console.log('Keys: ', keys);

}

async function setGlobalVariables(company, client, userid) {

    global_variables.global_codice_azienda = company;

    const queryString = "SELECT codice_part FROM entrasp.aziende WHERE codice_azienda='" + company + "';";
    const response = await client.query(queryString);
    if (response != null) {
        global_variables.global_codice_part = response.rows[0].codice_part;
    }

    var userParams = {
        TableName: 'USERS_NAME',
        Key: {
            userid: userid
        }
    };

    var data = await dynamo.get(userParams).promise();
    data = data.Item;

    if (data != null) {
        let companies = data.companies;
        if (company != null) {
            companies.forEach(c => {
                if (c.name === company) { // found user's profile
                    global_variables.global_userid = c.id_anagrafica;
                }
            });
        }
    }

    console.log('global_variables', global_variables);

}


async function importCSV(table, fileName, client) {
    // Load file from S3
    const s3ParamsGetList = {
        Bucket: bucket,
        Key: fileName
    };

    const csvFile = await s3.getObject(s3ParamsGetList).promise();
    csvData = csvFile.Body.toString(); //.replace(/;/g, '||');
    // Try to load columns from query params
    let columns = csvData.split('\n')[0].replace(/'/g, '').replace(/\r/g, '').replace(/CSV_DELIMITER/g, ',');


    // Added schema if table does not contain
    if (!table.includes('.')) {
        table = `${schema}.${table}`;
    }

    // Data prepared:
    console.table({ "fileName": fileName, "table": table, "columns": columns });

    // Create extensions
    // query = `CREATE EXTENSION aws_s3 CASCADE;`
    // query = `CREATE EXTENSION aws_commons CASCADE;`

    // Import CSV from S3 to Postgres
    let query = `   SET session_replication_role = 'replica';
                    SELECT aws_s3.table_import_from_s3(
                            '${table}',
                            '${columns}',
                            '(FORMAT CSV, DELIMITER E''CSV_DELIMITER'', HEADER true)',
                            aws_commons.create_s3_uri('${bucket}', '${fileName}','${region}'),
                            aws_commons.create_aws_credentials('${accessKey}', '${secret}', '')
                        );
                    SET session_replication_role = 'origin';`;

    // Try to run query 5 times on failure
    let queryResponse = null;
    let tries = 0;
    while (!queryResponse && tries < 5) {
        console.log(`Trying to run query [${tries}]`);
        try {
            queryResponse = await client.query(query);
        }
        catch (e) {
            console.log(e);
            queryResponse = null;
            tries++;
        }
    }

    // Check if success or failure
    if (queryResponse) {
        console.table(queryResponse);
        body = { result: 'OK', response: queryResponse };
    }
    else {
        body = { result: 'KO', reason: 'CSV file is not valid for this table!' };
    }
}

*/


function getTableNameFromKey(key) {
    return key.replace(/\.csv/g, '');
}

async function createTableImportQuery(fileName) {
    let table = getTableNameFromKey(fileName);

    // Load file from S3
    const s3ParamsGetList = {
        Bucket: bucket,
        Key: fileName
    };

    const csvFile = await s3.getObject(s3ParamsGetList).promise();
    csvData = csvFile.Body.toString(); //.replace(/;/g, '||');
    // Try to load columns from query params
    let columns = csvData.split('\n')[0].replace(/'/g, '').replace(/\r/g, '').replace(/CSV_DELIMITER/g, ',');


    // Added schema if table does not contain
    if (!table.includes('.')) {
        table = `${schema}.${table}`;
    }

    // Data prepared:
    console.table({ "fileName": fileName, "table": table, "columns": columns });

    // Create extensions
    // query = `CREATE EXTENSION aws_s3 CASCADE;`
    // query = `CREATE EXTENSION aws_commons CASCADE;`

    // Import CSV from S3 to Postgres
    let query = `
            SELECT aws_s3.table_import_from_s3(
                    '${table}',
                    '${columns}', 
                    '(FORMAT CSV, DELIMITER E''CSV_DELIMITER'', HEADER true)',
                    aws_commons.create_s3_uri('${bucket}', '${fileName}','${region}'), 
                    aws_commons.create_aws_credentials('${accessKey}', '${secret}', '')
                );
            `;
    console.log(query);
    return query;
}

async function runQuery(queryString, client) {

    // Try to run query 5 times on failure
    let queryResponse = null;
    let tries = 0;
    while (!queryResponse && tries < 5) {
        console.log(`Trying to run query [${tries}]`);
        try {
            queryResponse = await client.query(queryString);
        }
        catch (e) {
            console.log(e);
            queryResponse = null;
            tries++;
        }
    }

    // Check if success or failure
    if (queryResponse) {
        console.table(queryResponse);
        return { result: 'OK', response: queryResponse };
    }
    else {
        return { result: 'KO', reason: 'CSV file is not valid for this table!' };
    }
}

exports.handler = async (event, context) => {

    const queryParams = event.queryStringParameters;
    let body = null;

    console.log('queryParams', queryParams);

    const requestType = queryParams['request_type'];

    // If no Request type provided, exit with an error
    if (!requestType) {
        return {
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "statusCode": 500,
            "error": "Bad URL"
        };
    }
    else {
        console.log('Lets start ' + requestType);
        let client = null;
        try {
            try {
                const date = getDateFormat();
                client = await pool.connect();
            }
            catch (e) {
                console.log("Could not init client");
                console.log(e);

            }

            if (requestType === 'importS3ToRDS') {

                var params = {
                    Bucket: bucket,
                    // Prefix: 'csv',
                    MaxKeys: 16
                };
                let s3Objects = await s3.listObjectsV2(params).promise();
                if (s3Objects.Contents && s3Objects.Contents.length) {
                    let files = s3Objects.Contents
                        .map(obj => obj.Key)
                        .filter(file => !file.includes('/'));
                    console.log(files);
                    let queryString = '';
                    // files.forEach(fileName => {
                    //     await importCSV(table, fileName, client);
                    // });

                    queryString += "SET session_replication_role = 'replica';";

                    await files.reduce(async (promise, fileName) => {
                        // This line will wait for the last async function to finish.
                        // The first iteration uses an already resolved Promise
                        // so, it will immediately continue.
                        await promise;
                        queryString += await createTableImportQuery(fileName);
                    }, Promise.resolve());


                    queryString += "SET session_replication_role = 'origin';";

                    console.log(queryString);

                    body = await runQuery(queryString, client);
                }
                else {
                    body = { result: 'OK', files: null };
                }
            }
            else if (requestType === 'createNewFile') {
                const fileName = context.awsRequestId + ".csv"; // generate a 'unique' UUID as fileName

                const s3ParamsInsert = {
                    Bucket: bucket,
                    Key: fileName
                };

                // create a temporary signed URL for the object 
                const signedUrl = s3.getSignedUrl('putObject', s3ParamsInsert);
                console.log(`Creating new import file: ${fileName} Url: ${signedUrl}`);

                // Response Body
                body = { result: 'OK', url: signedUrl, fileName: fileName };
            }
            else if (requestType === 'importFile') {
                // Load mandatory query params
                let fileName = queryParams['filename'];
                let table = queryParams['table'];

                // Check if mandatory query params provided
                if (!fileName || !table) {
                    // Error Response Body
                    body = { result: 'KO', reason: 'File and/or table not provided!' };
                }
                else {
                    // Load file from S3
                    const s3ParamsGetList = {
                        Bucket: bucket,
                        Key: fileName
                    };

                    const csvFile = await s3.getObject(s3ParamsGetList).promise();

                    // Check if file exists
                    if (!csvFile.ContentLength) {
                        console.log("File does not exist!");
                        body = { result: 'KO', reason: 'File does not exist!' };
                    }
                    else {
                        console.log(`S3 File length: ${csvFile.ContentLength}`);

                        // Try to load columns from query params
                        let columns = queryParams['columns'];

                        // Check if columns were not provided in the query params
                        if (!columns) {
                            // Let's search CSV header for columns
                            // First line contains headers, replace all extra characters
                            columns = csvFile.Body.toString().split('\n')[0].replace(/'/g, '');
                        }

                        // Added schema if table does not contain
                        if (!table.includes('.')) {
                            table = `${schema}.${table}`;
                        }

                        // Data prepared:
                        console.table({ "fileName": fileName, "table": table, "columns": columns });

                        // Create extensions
                        // query = `CREATE EXTENSION aws_s3 CASCADE;`
                        // query = `CREATE EXTENSION aws_commons CASCADE;`

                        // Import CSV from S3 to Postgres
                        query = `SELECT aws_s3.table_import_from_s3(
                            '${table}',
                            '${columns}', 
                            '(FORMAT CSV, DELIMITER E'','', HEADER true)',
                            aws_commons.create_s3_uri('${bucket}', '${fileName}','${region}'), 
                            aws_commons.create_aws_credentials('${accessKey}', '${secret}', '')
                        );`;

                        // Try to run query 5 times on failure
                        let queryResponse = null;
                        let tries = 0;
                        while (!queryResponse && tries < 5) {
                            console.log(`Trying to run query [${tries}]`);
                            try {
                                queryResponse = await client.query(query);
                            }
                            catch (e) {
                                console.log(e);
                                queryResponse = null;
                                tries++;
                            }
                        }

                        // Check if success or failure
                        if (queryResponse) {
                            console.table(queryResponse);
                            body = { result: 'OK', response: queryResponse };
                        }
                        else {
                            body = { result: 'KO', reason: 'CSV file is not valid for this table!' };
                        }
                    }
                }
            }
            else if (requestType === 'deleteFile') {
                const fileName = queryParams['filename'];

                const s3ParamsDelete = {
                    Bucket: bucket,
                    Key: fileName
                };

                const signedUrl = s3.getSignedUrl('deleteObject', s3ParamsDelete);

                body = { result: 'OK', url: signedUrl };
            }
            else if (requestType === 'downloadTemplate') {
                // Load mandatory query params
                let table = queryParams['table'];

                console.log("Table: " + table);
                // Check if mandatory query params provided
                if (!table) {
                    // Error Response Body
                    body = { result: 'KO', reason: 'Table not provided!' };
                }
                else {
                    // Get columns for the table
                    query = `select entrasp.grc_listacampiditabella(
                        '${table}'
                    )  as columns;`;

                    // Run query
                    let queryResponse = null;
                    try {
                        queryResponse = await client.query(query);
                        console.table(queryResponse);
                        if (queryResponse.rows && queryResponse.rows.length) {
                            body = { result: 'OK', response: queryResponse.rows[0]["columns"] };
                        }
                        else {
                            body = { result: 'OK', response: queryResponse };
                        }
                    }
                    catch (e) {
                        console.log(e);
                        queryResponse = null;
                        body = { result: 'KO', reason: 'CSV file is not valid for this table!' };
                    }
                }
            }

            await client.release();
        } catch (e) {
            console.log(e);
            body = { result: 'KO', reason: 'Server error' };
        }

        return {
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "statusCode": 200,
            "body": JSON.stringify(body)
        };
    }
};