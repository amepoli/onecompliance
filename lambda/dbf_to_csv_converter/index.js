const AWS = require('aws-sdk');
const parseDBF = require('parsedbf');
AWS.config.update({ region: 'eu-central-1' });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const separator = '~';

async function readDBFFile(company, file) {
    const s3ParamsGetList = {
        Bucket: 'BUCKET_NAME',
        Key: `batch/${company}/${file}`
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

exports.handler = async (event, context) => {

    const queryParams = event.queryStringParameters ? event.queryStringParameters : event;
    console.log(queryParams);

    let body = { result: 'KO', data: null };

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
