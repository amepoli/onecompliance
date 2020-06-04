const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-central-1' });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const bucket = 'gorico2.import';
const region = 'eu-central-1';
const accessKey = 'AKIAVH7FFOJ5BBH3AY4R';
const secret = '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';

const schema = 'entrasp';

// const dynamo = new AWS.DynamoDB.DocumentClient();
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

function getDateFormat() {
    var d = new Date();
    var month = d.getMonth() + 1;
    return d.getFullYear() + '-' + month.toString() + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
}


exports.handler = async (event, context) => {

    const queryParams = event.queryStringParameters;
    let body = null;

    console.log(queryParams);

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

        try {
            // const date = getDateFormat();
            let client = await pool.connect();

            if (requestType === 'createNewFile') {
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