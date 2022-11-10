const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-central-1' });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

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

var dataToWrite;
var fs = require('fs');

const separator_out = ';';

const bucket_name = 'BUCKET_NAME';
const default_bucket = 'gorico2-migration';
const default_company = 'DEMO';
const default_folder = 'batch/test';
const default_file_out = 'test_csv_creator.csv';
const default_query = 'SELECT 1';


async function getFilesList(folder = default_folders[0], bucket = default_bucket) {
    const s3ParamsGetFilesList = {
        Bucket: bucket,
        Prefix: folder
    };

    let files = await s3.listObjects(s3ParamsGetFilesList).promise();
    if (files && files.Contents && files.Contents.length) {
        return files.Contents.filter(x => x.Size > 0).map(x => x.Key);
    }
    return null;
}

// Read input file
async function readFile(file = default_file, bucket = default_bucket) {
    console.log('Reading File...');
    const s3ParamsGetList = {
        Bucket: bucket,
        Key: file
    };

    const s3File = await s3.getObject(s3ParamsGetList).promise();
    if (s3File && s3File.Body) {
        return s3File.Body;

    }

    console.log('File invalid!');
    return null;
}

// Process CSV buffer
function processCSV(csvData) {
    // Using Buffer to UTF-8 string function
    // let utf8String = csvData.toString('utf-8');

    // Another technique
    let stringData = unescape(encodeURIComponent(csvData.toString()));

    // Remove the header
    stringData = stringData.split(' ').filter(x => x != null && x.length).join(' ');
    stringData = stringData.split('\n');
    stringData.splice(0, 1);
    stringData = stringData.map(line => {
        if (line && line.length > 2) {
            let columns = [];
            let columnStarted = false;
            let columnContainsQuote = false;
            let curColumn = "";
            for (let i = 0; i < line.length; i++) {
                // let's go through each character one by one.
                let curChar = line[i];
                if (i < 20) {console.log(i+' curchar: ',curChar);}
                if (!columnStarted) {
                    if (curChar === '"') {
                        curColumn = "";
                        columnStarted = true;
                        columnContainsQuote = true;
                    }
                    else if (curChar === ';' || curChar === '~') {
                        // curColumn = "";
                        // columnStarted = true;
                        // columnContainsQuote = false;
                        if (line[i + 1] === ';' || i  == line.length - 1 ) {
                            columns.push('');
                        }
                    }
                    else {
                        curColumn = curChar !== ' ' ? curChar : '';
                        columnStarted = true;
                        columnContainsQuote = false;
                    }
                }
                else {
                    if (columnContainsQuote) {
                        if (curChar === '"') {
                            columns.push(curColumn);
                            curColumn = "";
                            columnStarted = false;
                            columnContainsQuote = false;
                        }
                        else {
                            curColumn += '' + (curColumn || curChar !== ' ' ? curChar : '');
                        }
                    }
                    else {
                        if (curChar === ';' || i == line.length - 1) {
                            columns.push(curColumn);
                            curColumn = "";
                            columnStarted = false;
                            columnContainsQuote = false;
                        }
                        else {
                            curColumn += '' + (curColumn || curChar !== ' ' ? curChar : '');
                        }
                    }
                }
            }
            return columns.join(separator_out);

        }
        else {
            return null;
        }
        // return line.split('"').filter(x => x != null && x.length && x != ';').join(separator_out)
    });
    stringData = stringData.filter(x => x != null).join('\n');

    // To add header
    // let header = stringData.splice(0, 1);
    // header.replace(/ /g, '');
    // stringData = header + '\n' + stringData.join(';\n') + ';';


    // remove unwanted stuff
    // stuff_to_replace.forEach(item => {
    //     var find = item.in;
    //     var re = new RegExp(find, 'g');
    //     stringData = stringData.replace(re, item.out);
    // });

    // Replace any space with the separator
    var find = ' ' + stuff_to_replace[0].out;
    var re = new RegExp(find, 'g');
    stringData = stringData.replace(re, stuff_to_replace[0].out);
    return stringData;
}

function createCSV(dbfData) {
    const rows = dbfData && dbfData.rows ? dbfData.rows.length : 0;
    if (rows > 0) {
        console.log('Creating CSV...');
        const keys = dbfData.columns.map(x => x.name); //Object.keys(dbfData.columns);
        let csvData = '';
        csvData += `${keys.join(separator)}\n`;
        csvData += dbfData.rows.map(row => keys.map(key => row[key]).join(separator)).join('\n');
        return csvData;
    }
    else {
        console.error('Creating CSV... DBF file does not exist or invalid!');
        return null;
    }

}

async function writeFileToS3(key, data, bucket = default_bucket) {
    console.log('Writing File...');
    var params = {
        Bucket: bucket,
        Key: key,
        Body: data
    }
    console.log(params.Key);
    await s3.putObject(params).promise();
}

async function deleteFiles(files, bucket = default_bucket) {
    if (files && files.length) {
        var params = {
            Bucket: bucket,
            Delete: {
                Objects: files.map(file => {
                    return { Key: file }
                })
            }
        };
        await s3.deleteObjects(params, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            // else console.log(data);           // successful response
        });
    }
    else {
        console.log('No files to cleanup...');
    }
}

async function processFiles(filesIn, filesOut, bucket = default_bucket) {
    await filesIn.reduce(async (promise, srcFile, i) => {
        // This line will wait for the last async function to finish.
        // The first iteration uses an already resolved Promise
        // so, it will immediately continue.
        await promise;

        let outFile = filesOut[i];
        console.log(`Processing file: ${srcFile}`);
        let csvBuffer = await readFile(srcFile, bucket);

        if (csvBuffer) {
            let processedCSV = processCSV(csvBuffer);
            if (processedCSV) {
                await writeFileToS3(outFile, processedCSV, bucket);
                // console.log(csvData);
            }
        }
        console.log(`Processing complete!`);

    }, Promise.resolve());
}

async function encodeText(fileIn, fileOut, bucket = default_bucket) {
    let dataBuffer = await readFile(fileIn, bucket);
    if (dataBuffer) {
        let processedData = dataBuffer.toString().replace(/[^\x01-\xFF]/g, " ");
        if (processedData) {
            await writeFileToS3(fileOut, processedData, bucket);
            // console.log(csvData);
        }
    }
}

async function start(bucket = default_bucket, company = default_company, folder = default_folder, file_out = default_file_out, queryToRun = default_query) {
    
    let s3ParamsGetList;

    await pool
        .query(queryToRun)
        .then(res =>

            s3ParamsGetList = {
                Bucket: bucket,
                Key: folder + file_out
            }

            /* fs.writeFile('form-tracking/formList.csv', dataToWrite, 'utf8', function (err) {
                if (err) {
                    console.log('Some error occured - file either not saved or corrupted file saved.');
                } else {
                    console.log('It\'s saved!');
                }
            }) */
        )
        .catch(err => console.error('Error executing query', err.stack));
}

async function processQueryParams(queryParams) {

    let bucket = bucket_name ? bucket_name : default_bucket; //queryParams.bucket ? queryParams.bucket : default_bucket;
    let company = queryParams.company ? queryParams.company : default_company;
    let folder = queryParams.folder ? queryParams.folder : default_folder;
    let file_out = queryParams.file_out ? queryParams.file_out : default_file_out;
    let queryToRun = queryParams.query ? queryParams.query : default_query;
    
    await start(bucket, company, folder, file_out, queryToRun);
}

exports.handler = async (event, context) => {

    const queryParams = event.queryStringParameters ? event.queryStringParameters : event;
    
    console.log(queryParams);

    let body = { result: 'OK' };

    if (queryParams && Object.keys(queryParams).length > 0) {
        await processQueryParams(queryParams);
    }
    else {
        await start();
    }

    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify(body)
    };
};
