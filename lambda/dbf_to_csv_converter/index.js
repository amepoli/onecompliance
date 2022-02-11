const AWS = require('aws-sdk');
// const parseDBF = require('parsedbf');
AWS.config.update({ region: 'eu-central-1' });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
var dbfReader = require('./dbf-reader');

const separator = '~'; //',';
const folders = ['batch/finafarm/upload']; //['batch/finafarm'];
const columnsList = {
    "analeas.dbf": ['IDANACLI', 'NUMCONTR', 'DATA_CON', 'DT_SOSP', 'DESCRIZ', 'DTSTIPULA'],
    "anacont.dbf": ['IDANACLI', 'PKTBTIPCON', 'DESCRI', 'NUMCONT',  'DATA_INI', 'DT_SOSP'], //tolto 'DESCOGE',
    "anacli.dbf": ['IDBASE','CODCLI', 'RAGSOC', 'COGNOME', 'NAME', 'IND_SL', 'CAP_SL', 'STATO_SL', 'CODFISC', 'PIVA', 'DAT_NASC', 'SESSO', 'CLIFOR'] //tolto 'TELEF', 'FAX', 'EMAIL'
};

async function getFilesList(folder, bucket) {
    if (!bucket) {
        bucket = 'BUCKET_NAME'
    }
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

async function readDBFFile(file, bucket) {
    if (!bucket) {
        bucket = 'BUCKET_NAME'
    }

    console.log('Reading DBF...');
    const s3ParamsGetList = {
        Bucket: bucket,
        Key: file
    };

    const dbfFile = await s3.getObject(s3ParamsGetList).promise();
    if (dbfFile && dbfFile.Body) {
        console.log('File length: ', dbfFile.Body.length);
        return dbfFile.Body;
        // var dbfData = parseDBF(dbfFile.Body);
        // if (dbfData && dbfData.length) {
        //     return dbfData;
        // }
    }

    console.log('DBF invalid!');
    return null;
}

function parseFile(dbfBuffer) {
    console.log('Parsing DBF...');
    var dbfData = dbfReader.DbfReader.read(dbfBuffer);
    return dbfData;
}

function createCSV(dbfData, columns) {
    const rows = dbfData && dbfData.rows ? dbfData.rows.length : 0;
    if (rows > 0) {
        console.log('Creating CSV...');
        const keys = columns && columns.length? columns: dbfData.columns.map(x => x.name); //Object.keys(dbfData.columns);
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

async function writeCSVToS3(key, data, bucket) {
    if (!bucket) {
        bucket = 'BUCKET_NAME'
    }

    var params = {
        Bucket: bucket,
        Key: key,
        Body: data
    }
    await s3.putObject(params).promise();
    // , function (err, data) {
    //     if (err) console.log(err, err.stack); // an error occurred
    //     else console.log('writeCSV Success: ', key, data);           // successful response
    // });
}

async function deleteFiles(files, bucket) {
    if (!bucket) {
        bucket = 'BUCKET_NAME'
    }

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

    // await files.reduce(async (promise, srcFile) => {
    //     // This line will wait for the last async function to finish.
    //     // The first iteration uses an already resolved Promise
    //     // so, it will immediately continue.
    //     await promise;

    //     console.log(`Deleting file: ${srcFile}`);
    //     var params = {
    //         Bucket: 'BUCKET_NAME',
    //         Delete: files
    //     };
    //     console.log(params);



    // }, Promise.resolve());
}


async function processFiles(files, bucket) {
    if (!bucket) {
        bucket = 'BUCKET_NAME'
    }

    console.log('columnsList: ', columnsList);

    await files.reduce(async (promise, srcFile) => {
        // This line will wait for the last async function to finish.
        // The first iteration uses an already resolved Promise
        // so, it will immediately continue.
        await promise;

        console.log(`Processing file: ${srcFile}`);
        let dbfBuffer = await readDBFFile(srcFile, bucket);

        if (dbfBuffer) {
            let dbfData = parseFile(dbfBuffer);
            if (dbfData) {
                console.log('DBF rows count: ', dbfData.rows.length);
                let srcFileName = srcFile.split('/');
                srcFileName = srcFileName[srcFileName.length - 1];
                
                console.log('srcFileName: ', srcFileName.toLowerCase());
                
                // Get columns for the current file
                let columns = columnsList[srcFileName.toLowerCase()]? columnsList[srcFileName.toLowerCase()]: null;
                console.log('columns: ', columns);
                
                let csvData = createCSV(dbfData, columns);
                await writeCSVToS3(srcFile.replace('.dbf', '.csv').replace('.DBF', '.csv'), csvData, bucket);
                // console.log(csvData);
            }
        }
        console.log(`Processing complete!`);

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
            await deleteFiles(files.filter(x => x.includes('.csv')));
            await processFiles(files.filter(x => x.toLowerCase().includes('.dbf')), 'BUCKET_NAME');
        }
    }, Promise.resolve());
}

async function processEvent(event) {
    console.log('Running custom event.');
    let bucket = event.bucket;
    let folders = event.folder? [event.folder]: folders;
    if(event.columns) {
        columnsList = event.columns;
    }

    if(event.separator) {
        separator = event.separator;
    }

    await folders.reduce(async (promise, folder) => {
        // This line will wait for the last async function to finish.
        // The first iteration uses an already resolved Promise
        // so, it will immediately continue.
        await promise;

        let files = await getFilesList(folder);
        if (files && files.length) {
            await deleteFiles(files.filter(x => x.includes('.csv')), bucket);
            await processFiles(files.filter(x => x.toLowerCase().includes('.dbf')), bucket);
        }
    }, Promise.resolve());
}

exports.handler = async (event, context) => {

    const queryParams = event.queryStringParameters ? event.queryStringParameters : event;
    console.log(queryParams);

    let body = { result: 'OK' };

    if (queryParams && Object.keys(queryParams).length > 0) {
        await processEvent(queryParams);
    }
    else {
        await process();
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
