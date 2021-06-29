const AWS = require('aws-sdk');
const parseDBF = require('parsedbf');
AWS.config.update({ region: 'eu-central-1' });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const separator = '~';
const folders = ['batch/finafarm'];

async function getFilesList(folder) {
    const s3ParamsGetFilesList = {
        Bucket: 'BUCKET_NAME',
        Prefix: folder
    };

    let files = await s3.listObjects(s3ParamsGetFilesList).promise();
    if (files && files.Contents && files.Contents.length) {
        return files.Contents.filter(x => x.Size > 0).map(x => x.Key);
    }
    return null;
}

async function readDBFFile(file) {
    const s3ParamsGetList = {
        Bucket: 'BUCKET_NAME',
        Key: file
    };

    const dbfFile = await s3.getObject(s3ParamsGetList).promise();
    if (dbfFile && dbfFile.Body) {
        var dbfData = parseDBF(dbfFile.Body);
        if (dbfData && dbfData.length) {
            return dbfData;
        }
    }
    return null;
}

function createCSV(dbfData) {
    const rows = dbfData != null ? dbfData.length : 0;
    if (rows > 0) {
        const keys = Object.keys(dbfData[0]);
        let csvData = '';
        csvData += `${keys.join(separator)}\n`;
        csvData += dbfData.map(row => keys.map(key => row[key]).join(separator)).join('\n');
        return csvData;
    }
    else {
        console.error('DBF file does not exist or invalid!');
        return null;
    }
}


async function processFiles(files) {
    await files.reduce(async (promise, srcFile) => {
        // This line will wait for the last async function to finish.
        // The first iteration uses an already resolved Promise
        // so, it will immediately continue.
        await promise;

        console.log(srcFile);
        let dbfData = await readDBFFile(srcFile);
        if (dbfData) {
            let csvData = createCSV(dbfData);
            // console.log(csvData);
        }

    }, Promise.resolve());
}


async function process() {
    await folders.reduce(async (promise, folder) => {
        // This line will wait for the last async function to finish.
        // The first iteration uses an already resolved Promise
        // so, it will immediately continue.
        await promise;

        let files = await getFilesList(folder);
        if (files && files.length) {
            await processFiles(files);
        }
        console.log(files);
    }, Promise.resolve());
}

exports.handler = async (event, context) => {

    const queryParams = event.queryStringParameters ? event.queryStringParameters : event;
    console.log(queryParams);

    let body = { result: 'KO', data: null };

    await process();

    let dbfData = await readDBFFile(queryParams['company'], queryParams['file']);
    if (dbfData) {
        let csvData = createCSV(dbfData);
        if (csvData) {
            body = { result: 'OK', data: csvData }
        }
        else {
            body = { result: 'KO', reason: 'DBF File not found or invalid!', data: null }
        }
    }
    else {
        body = { result: 'KO', reason: 'DBF File not found or invalid!', data: null }
    }

    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify(body)
    };
};
