const AWS = require('aws-sdk');
// const parseDBF = require('parsedbf');
AWS.config.update({ region: 'eu-central-1' });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const separator_in = ';';
const separator_out = '~';

const stuff_to_replace = [
    {
        in: separator_in,
        out: separator_out
    },
    {
        in: '"',
        out: ''
    },
];

const default_file_in = 'Rapporti_zee.CSV';
const default_file_out = 'Rapporti_zee_out.CSV';
const default_folders = ['batch/finint/zee/upload'];
const default_bucket = 'BUCKET_NAME';

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

// Read input CSV file
async function readCSVFile(file = default_file, bucket = default_bucket) {
    console.log('Reading CSV...');
    const s3ParamsGetList = {
        Bucket: bucket,
        Key: file
    };

    const csvFile = await s3.getObject(s3ParamsGetList).promise();
    if (csvFile && csvFile.Body) {
        return csvFile.Body;

    }

    console.log('CSV File invalid!');
    return null;
}

// Process CSV buffer
function processCSV(csvData) {
    // Using Buffer to UTF-8 string function
    // let utf8String = csvData.toString('utf-8');

    // Another technique
    let stringData = unescape(encodeURIComponent(csvData.toString()));

    console.log('CSV contains \n: ', stringData.includes('\n'));
    // Remove the header
    console.log((stringData.match(/\r/) ? 'CR' : '')
        + ' ' + (stringData.match(/\n/) ? 'LF' : ''));

    stringData = stringData.split(' ').filter(x => x != null && x.length).join(' ');
    stringData = stringData.split('\n');
    stringData.splice(0, 1);
    stringData = stringData.map(line => {
        let columns = [];
        let columnStarted = false;
        let columnContainsQuote = false;
        let curColumn = "";
        for (let i = 0; i < line.length; i++) {
            // let's go through each character one by one.
            let curChar = line[i];
            if (!columnStarted) {
                if (curChar === '"') {
                    curColumn = "";
                    columnStarted = true;
                    columnContainsQuote = true;
                }
                else if (curChar === ';') {
                    // curColumn = "";
                    // columnStarted = true;
                    // columnContainsQuote = false;
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
        // return line.split('"').filter(x => x != null && x.length && x != ';').join(separator_out)
    });
    stringData = stringData.join('\n');

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

async function writeCSVToS3(key, data, bucket = default_bucket) {
    console.log('Writing CSV...');
    var params = {
        Bucket: bucket,
        Key: key,
        Body: data
    }
    console.log(params.Key);
    await s3.putObject(params).promise();
    // , function (err, data) {
    //     if (err) console.log(err, err.stack); // an error occurred
    //     else console.log('writeCSV Success: ', key, data);           // successful response
    // });
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
        console.log('deleteFiles: ', JSON.stringify(params));
        await s3.deleteObjects(params, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            // else console.log(data);           // successful response
        });
    }
    else {
        console.log('No files to cleanup...');
    }
}


async function processFiles(files, bucket = default_bucket) {
    await files.reduce(async (promise, srcFile) => {
        // This line will wait for the last async function to finish.
        // The first iteration uses an already resolved Promise
        // so, it will immediately continue.
        await promise;

        console.log(`Processing file: ${srcFile}`);
        let csvBuffer = await readCSVFile(srcFile, bucket);

        if (csvBuffer) {
            let processedCSV = processCSV(csvBuffer);
            if (processedCSV) {
                await writeCSVToS3(srcFile.replace('.CSV', '_out.CSV').replace('.csv', '_out.csv'), processedCSV, bucket);
                // console.log(csvData);
            }
        }
        console.log(`Processing complete!`);

    }, Promise.resolve());
}

async function start(folders = default_folders, inFileName = default_file_in, outFileName = default_file_out, bucket = default_bucket) {
    await folders.reduce(async (promise, folder) => {
        // This line will wait for the last async function to finish.
        // The first iteration uses an already resolved Promise
        // so, it will immediately continue.
        await promise;

        let files = await getFilesList(folder);
        if (files && files.length) {
            await deleteFiles(files.filter(x => x.toLowerCase().includes(outFileName.toLowerCase())), bucket);
            await processFiles(files.filter(x => x.toLowerCase().includes(inFileName.toLowerCase())), bucket);
        }
    }, Promise.resolve());
}

async function processQueryParams(queryParams) {
    console.log('Running custom event.');
    let bucket = queryParams.bucket;
    let file_in = [queryParams.file_in];
    let file_out = [queryParams.file_out];
    let folders = [queryParams.folder];
    await start(folders, file_in, file_out);

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

    // let dbfData = await readDBFFile(queryParams['company'], queryParams['file']);
    // if (dbfData) {
    //     let csvData = createCSV(dbfData);
    //     if (csvData) {
    //         body = { result: 'OK', data: csvData }
    //     }
    //     else {
    //         body = { result: 'KO', reason: 'DBF File not found or invalid!', data: null }
    //     }
    // }
    // else {
    //     body = { result: 'KO', reason: 'DBF File not found or invalid!', data: null }
    // }

    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify(body)
    };
};
