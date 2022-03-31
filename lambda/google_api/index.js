const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-central-1' });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const dynamo = new AWS.DynamoDB.DocumentClient();

//const { Readable } = require('stream');
let stream = require('stream');

const https = require('https');
const { Client } = require("@googlemaps/google-maps-services-js");
const googleMapsClient = new Client({});
const { OAuth2Client } = require('google-auth-library');
const oAuth2Client = new OAuth2Client(
    'CLIENT_ID',
    'CLIENT_SECRET'
);
// var promisify = require('promisify');
// const { promisify } = require('bluebird');
const { google } = require('googleapis');

// Get Bad URL Response
function getBadUrlResponse() {
    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 500,
        "error": "Bad URL"
    };
}

// Get Server Error Response
function getServerErrorResponse(error) {
    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify({ result: 'KO', reason: 'Server error', reasonDetail: error })
    };
}

// Get Server response
function getServerResponse(body) {
    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify(body)
    };
}

async function downloadS3Object(path, file) {
    var params = { 
        Bucket: 'BUCKET_NAME',
        Key: `${path}/${file}`
    };

    const data = await s3.getObject(params).promise();

    return data;
}

async function uploadS3Object(path, file, data) {
    var params = { 
        Bucket: 'BUCKET_NAME',
        Key: `${path}/${file}`,
        Body: data
    };

    const result = await s3.upload(params).promise();
    return result;
}

async function downloadDriveObject(drivePath, file) {
    const drive = google.drive({version: 'v3', auth: oAuth2Client});
    
    let driveFileId = null;
    let driveFolderId = 'root';

    let response = null;
    if(drivePath.length > 0) {        
        response = await drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and name='${drivePath}'`,
            pageSize: 5,
            fields: 'nextPageToken, files(id, name, mimeType)',
        });
        try {
            response = JSON.parse(response);    
        }
        catch(e) {}
        if(response.data && response.data.files && response.data.files.length > 0) {
            driveFolderId = response.data.files[0].id;
        }
        console.log('find folder result: ', JSON.stringify(response));
    }


    response = await drive.files.list({
        q: `'${driveFolderId}' in parents and name='${file}'`,
        pageSize: 250,
        fields: 'nextPageToken, files(id, name, mimeType)',
    });
    try {
        response = JSON.parse(response);    
    }
    catch(e) {}
    if(response.data && response.data.files && response.data.files.length > 0) {
        driveFileId = response.data.files[0].id;
    }
    console.log('find file result: ', JSON.stringify(response));

    if(driveFileId) {
        response = await drive.files.get({
            fileId: driveFileId,
            alt: 'media'
        });
    }
    
    console.log('download file result: ', JSON.stringify(response));

    const data = response.data;
    return data;
}

// Perform Google Auth
async function performGoogleAuth(authParams) {
    authParams["refresh_token"] = authParams["access_token"];
    //authParams["code"] = "4/0AX4XfWiIpDqZDo_3UgFm6sTL5AuWRRxNd0jcxMc8p9rZOhxQuNZUijREH5HrI4yxLF7G3Q",
    authParams["client_secret"] = 'CLIENT_SECRET';
    console.log('authParams: ', authParams);

    // authParams["grant_type"] = "authorization_code"

    // const auth = new google.auth.fromJSON(token);

    // .auth.GoogleAuth({
    //     // Scopes can be specified either as an array or as a single, space-delimited string.
    //     scopes: [
    //         'https://mail.google.com/',
    //         'https://www.googleapis.com/auth/gmail.labels',
    //         'https://www.googleapis.com/auth/gmail.modify',
    //     ],
    // });

    // Acquire an auth client, and bind it to all future calls
    // const oAuth2Client = await auth.getClient();
    google.options({ auth: oAuth2Client });


    const ticket = await oAuth2Client.verifyIdToken({
        idToken: authParams.id_token,
        audience: 'CLIENT_ID',  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    console.log('ticket: ', ticket);

    oAuth2Client.setCredentials(authParams);
    // oAuth2Client.setCredentials({
    //     access_token: token.response.access_token,
    //     refresh_token: '4/0AX4XfWgrxymEqB8qeeD6m8LTuoAqpYf6K7J-kHH7XPNH9l8uYjBqpSz2EGrHzsOkg1ouoA',
    //     client_secret: 'F56L14ZUTbykHAdTTSiAPBUb',
    //     expiry_date: true
    // });

    // after acquiring an oAuth2Client...
    const tokenInfo = await oAuth2Client.getTokenInfo(authParams.access_token);
    // take a look at the scopes originally provisioned for the access token
    console.log('tokenInfo: ', tokenInfo);

    try {
        let refreshResult = await oAuth2Client.refreshAccessToken();
        console.log(refreshResult);
    }
    catch (e) {
        console.log(e);
    }

}

// Get Directions
async function getDirections(queryParams) {
    const params = {
        params: {
            origin: queryParams['origin'],
            destination: queryParams['destination'],
            travel_mode: 'DRIVING',
            key: 'GOOGLE_API_KEY'
        }
    };
    const response = await googleMapsClient.directions(params);
    console.log(JSON.stringify(response.data));
    if (response.data.status == 'OK') {
        return { result: 'OK', data: response.data };
    }
    else {
        return { result: 'KO', reason: response.data };
    }
}

// Get Distance
async function getDistance(queryParams) {
    const params = {
        params: {
            origins: [queryParams['origin']],
            destinations: [queryParams['destination']],
            travel_mode: 'DRIVING',
            key: 'GOOGLE_API_KEY'
        }
    };
    const response = await googleMapsClient.distancematrix(params);
    console.log(JSON.stringify(response.data));
    if (response.data.status == 'OK') {
        return { result: 'OK', data: response.data };
    }
    else {
        return { result: 'KO', reason: response.data };
    }
}

// Get Email Threads
async function getEmailThreads(queryParams, authParams) {
    const search = queryParams['search'];
    
    await performGoogleAuth(authParams);

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    let response;

    try {
        // response = oAuth2Client.request({ url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages' })
        let response = await gmail.users.labels.list({
            userId: 'me',
        });
        console.log(JSON.stringify(response));
    }
    catch (e) {
        console.log(e);
    }


    // (function (err, tokens) {
    //     // your access_token is now refreshed and stored in oauth2Client
    //     // store these new tokens in a safe place (e.g. database)
    // });


    // const payload = ticket.getPayload();
    // const userid = payload['sub'];
    // let response = '';

    // let response = await gmail.users.labels.list({
    //     userId: 'me',
    // });
    // console.log(response);

    // const response = await promisify(gmail.users.labels.list({
    //     userId: 'me',
    // }), { context: gmail.users.labels} );
    // console.log(response);

    // const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

    // const labelsPromise = new Promise(function (resolve, reject) {
    //     gmail.users.labels.list({
    //         userId: 'me',
    //     }, (err, res) => {
    //         if (err) reject(Error(err));
    //         resolve(res.data.labels);
    //     })

    // });

    // let response = await labelsPromise;

    try {
        response = await gmail.users.labels.list({
            userId: 'me',
        });
        console.log(response);
    }
    catch (e) {
        console.log(e);
    }



    // gmail.users.labels.list({
    //     userId: 'me',
    // }, (err, res) => {
    //     if (err) return console.log('The API returned an error: ' + err);
    //     const labels = res.data.labels;
    //     if (labels.length) {
    //         console.log('Labels:');
    //         labels.forEach((label) => {
    //             console.log(`- ${label.name}`);
    //         });
    //     } else {
    //         console.log('No labels found.');
    //     }
    // });
    // snooze(5000);

    // If request specified a G Suite domain:
    // const domain = payload['hd'];

    // // Get directions
    // const url = `https://gmail.googleapis.com/gmail/v1/users/${queryParams['email']}/threads`;
    // console.log('url: ', url);
    // // const req = await requestPromise({ url, method: 'GET' })
    // const response = await axios.get(url);
    // console.log(response.data);

    return { result: 'OK', result: response };
}

// Get getDriveContents
async function getDriveContents(queryParams, authParams) {
    const folder = queryParams['folder'];
    
    await performGoogleAuth(authParams);

    const drive = google.drive({version: 'v3', auth: oAuth2Client});

    let response;
    let pageToken = null;

    try {
        // response = oAuth2Client.request({ url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages' })
        response = await drive.files.list({
            q: `'${folder?folder : "root"}' in parents`,
            pageSize: 250,
            fields: 'nextPageToken, files(id, name, mimeType)',
          });
        try {
            response = JSON.parse(response);    
        }
        catch(e) {}
        console.log(JSON.stringify(response));
    }
    catch (e) {
        console.log(e);
    }


    // (function (err, tokens) {
    //     // your access_token is now refreshed and stored in oauth2Client
    //     // store these new tokens in a safe place (e.g. database)
    // });


    // const payload = ticket.getPayload();
    // const userid = payload['sub'];
    // let response = '';

    // let response = await gmail.users.labels.list({
    //     userId: 'me',
    // });
    // console.log(response);

    // const response = await promisify(gmail.users.labels.list({
    //     userId: 'me',
    // }), { context: gmail.users.labels} );
    // console.log(response);

    // const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

    // const labelsPromise = new Promise(function (resolve, reject) {
    //     gmail.users.labels.list({
    //         userId: 'me',
    //     }, (err, res) => {
    //         if (err) reject(Error(err));
    //         resolve(res.data.labels);
    //     })

    // });

    // let response = await labelsPromise;

    // try {
    //     response = await gmail.users.labels.list({
    //         userId: 'me',
    //     });
    //     console.log(response);
    // }
    // catch (e) {
    //     console.log(e);
    // }



    // gmail.users.labels.list({
    //     userId: 'me',
    // }, (err, res) => {
    //     if (err) return console.log('The API returned an error: ' + err);
    //     const labels = res.data.labels;
    //     if (labels.length) {
    //         console.log('Labels:');
    //         labels.forEach((label) => {
    //             console.log(`- ${label.name}`);
    //         });
    //     } else {
    //         console.log('No labels found.');
    //     }
    // });
    // snooze(5000);

    // If request specified a G Suite domain:
    // const domain = payload['hd'];

    // // Get directions
    // const url = `https://gmail.googleapis.com/gmail/v1/users/${queryParams['email']}/threads`;
    // console.log('url: ', url);
    // // const req = await requestPromise({ url, method: 'GET' })
    // const response = await axios.get(url);
    // console.log(response.data);

    return { result: 'OK', data: response.data.files };
}

// Create Drive Folder
async function createDriveFolder(queryParams, authParams) {
    const folder = queryParams['folder'];
    
    await performGoogleAuth(authParams);

    const drive = google.drive({version: 'v3', auth: oAuth2Client});

    var fileMetadata = {
        'name': folder,
        'mimeType': 'application/vnd.google-apps.folder'
    };

    let response;
    let pageToken = null;

    try {
        // response = oAuth2Client.request({ url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages' })
        response = await drive.files.create({
            resource: fileMetadata,
            fields: 'id'
        });
        try {
            response = JSON.parse(response);    
        }
        catch(e) {}
        console.log(JSON.stringify(response));
    }
    catch (e) {
        console.log(e);
    }


    // (function (err, tokens) {
    //     // your access_token is now refreshed and stored in oauth2Client
    //     // store these new tokens in a safe place (e.g. database)
    // });


    // const payload = ticket.getPayload();
    // const userid = payload['sub'];
    // let response = '';

    // let response = await gmail.users.labels.list({
    //     userId: 'me',
    // });
    // console.log(response);

    // const response = await promisify(gmail.users.labels.list({
    //     userId: 'me',
    // }), { context: gmail.users.labels} );
    // console.log(response);

    // const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

    // const labelsPromise = new Promise(function (resolve, reject) {
    //     gmail.users.labels.list({
    //         userId: 'me',
    //     }, (err, res) => {
    //         if (err) reject(Error(err));
    //         resolve(res.data.labels);
    //     })

    // });

    // let response = await labelsPromise;

    // try {
    //     response = await gmail.users.labels.list({
    //         userId: 'me',
    //     });
    //     console.log(response);
    // }
    // catch (e) {
    //     console.log(e);
    // }



    // gmail.users.labels.list({
    //     userId: 'me',
    // }, (err, res) => {
    //     if (err) return console.log('The API returned an error: ' + err);
    //     const labels = res.data.labels;
    //     if (labels.length) {
    //         console.log('Labels:');
    //         labels.forEach((label) => {
    //             console.log(`- ${label.name}`);
    //         });
    //     } else {
    //         console.log('No labels found.');
    //     }
    // });
    // snooze(5000);

    // If request specified a G Suite domain:
    // const domain = payload['hd'];

    // // Get directions
    // const url = `https://gmail.googleapis.com/gmail/v1/users/${queryParams['email']}/threads`;
    // console.log('url: ', url);
    // // const req = await requestPromise({ url, method: 'GET' })
    // const response = await axios.get(url);
    // console.log(response.data);

    return { result: 'OK', data: response };
}

// Create Drive Folder
async function copyFromS3ToDrive(queryParams, authParams) {
    let s3FilePath = queryParams['s3FilePath'];
    if(s3FilePath.startsWith('/')) {
        s3FilePath = s3FilePath.substring(1);
    }
    let s3Path = '';
    let s3File = s3FilePath;
    if(s3FilePath.includes('/')) {
        let s3FilePathParts = s3FilePath.split('/');
        s3File = s3FilePathParts.pop();
        s3Path = s3FilePathParts.join('/');
    }
    console.log('s3File: ', s3File);
    console.log('s3Path: ', s3Path);
    
    
    let driveFilePath = queryParams['driveFilePath'];
    if(driveFilePath.startsWith('/')) {
        driveFilePath = driveFilePath.substring(1);
    }
    let drivePath = '';
    let driveFile = driveFilePath;
    if(driveFilePath.includes('/')) {
        let driveFilePathParts = driveFilePath.split('/');
        driveFile = driveFilePathParts.pop();
        drivePath = driveFilePathParts.join('/');
    }
    console.log('driveFile: ', driveFile);
    console.log('drivePath: ', drivePath);
    
    
    const s3FileData = await downloadS3Object(s3Path, s3File);
    const s3Data = s3FileData.Body.toString('utf-8');
    
    var bufferStream = new stream.PassThrough();
    bufferStream.end(Uint8Array.from(Buffer.from(s3Data, "binary")));

    // let bufferStream = new stream.PassThrough();
    // bufferStream.end(s3FileData.Body);

    // const stream = Readable.from(s3FileData);
    console.log('data: ' + s3Data);
    // console.log('data: ' + JSON.stringify(bufferStream));

    await performGoogleAuth(authParams);

    const drive = google.drive({version: 'v3', auth: oAuth2Client});
    
    let driveFolderId = 'root';

    let response;

    if(drivePath.length > 0) {        
        response = await drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and name='${drivePath}'`,
            pageSize: 5,
            fields: 'nextPageToken, files(id, name, mimeType)',
        });
        try {
            response = JSON.parse(response);    
        }
        catch(e) {}
        if(response.data && response.data.files && response.data.files.length > 0) {
            driveFolderId = response.data.files[0].id;
        }
        console.log('find folder result: ', JSON.stringify(response));
    }
    
    const fileMetadata = {
        'name': driveFile,
        parents: [driveFolderId]
    };
    const media = {
        mimeType: 'text/plain',
        body: bufferStream
    };

    try {
        // response = oAuth2Client.request({ url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages' })
        response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
        });
        try {
            response = JSON.parse(response);    
        }
        catch(e) {}
        console.log(JSON.stringify(response));
    }
    catch (e) {
        console.log(e);
    }

    return { result: 'OK', data: response };
}

async function copyFromDriveToS3(queryParams, authParams) {
    let s3FilePath = queryParams['s3FilePath'];
    if(s3FilePath.startsWith('/')) {
        s3FilePath = s3FilePath.substring(1);
    }
    let s3Path = '';
    let s3File = s3FilePath;
    if(s3FilePath.includes('/')) {
        let s3FilePathParts = s3FilePath.split('/');
        s3File = s3FilePathParts.pop();
        s3Path = s3FilePathParts.join('/');
    }
    console.log('s3File: ', s3File);
    console.log('s3Path: ', s3Path);
    
    
    let driveFilePath = queryParams['driveFilePath'];
    if(driveFilePath.startsWith('/')) {
        driveFilePath = driveFilePath.substring(1);
    }
    let drivePath = '';
    let driveFile = driveFilePath;
    if(driveFilePath.includes('/')) {
        let driveFilePathParts = driveFilePath.split('/');
        driveFile = driveFilePathParts.pop();
        drivePath = driveFilePathParts.join('/');
    }
    console.log('driveFile: ', driveFile);
    console.log('drivePath: ', drivePath);
    
    await performGoogleAuth(authParams);
    
    let response;
    
    const driveFileData = await downloadDriveObject(drivePath, driveFile);
    console.log('data: ' + driveFileData);
    response = await uploadS3Object(s3Path, s3File, driveFileData);

    // console.log('data: ' + JSON.stringify(bufferStream));

    
    // const drive = google.drive({version: 'v3', auth: oAuth2Client});
    
    // let driveFolderId = 'root';

    // if(drivePath.length > 0) {        
    //     response = await drive.files.list({
    //         q: `mimeType='application/vnd.google-apps.folder' and name='${drivePath}'`,
    //         pageSize: 5,
    //         fields: 'nextPageToken, files(id, name, mimeType)',
    //     });
    //     try {
    //         response = JSON.parse(response);    
    //     }
    //     catch(e) {}
    //     if(response.data && response.data.files && response.data.files.length > 0) {
    //         driveFolderId = response.data.files[0].id;
    //     }
    //     console.log('find folder result: ', JSON.stringify(response));
    // }
    
    // const fileMetadata = {
    //     'name': driveFile,
    //     parents: [driveFolderId]
    // };
    // const media = {
    //     mimeType: 'text/plain',
    //     body: bufferStream
    // };

    // try {
    //     // response = oAuth2Client.request({ url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages' })
    //     response = await drive.files.create({
    //         resource: fileMetadata,
    //         media: media,
    //         fields: 'id'
    //     });
    //     try {
    //         response = JSON.parse(response);    
    //     }
    //     catch(e) {}
    //     console.log(JSON.stringify(response));
    // }
    // catch (e) {
    //     console.log(e);
    // }

    return { result: 'OK', data: response };
}

exports.handler = async (event, context) => {

    // console.log(event);
    // const method = event.httpMethod;
    // const userid = event.requestContext ? event.requestContext.identity.cognitoAuthenticationProvider.split(':')[2] : null;
    // console.log('userid: ', userid);

    const queryParams = event.queryStringParameters ? event.queryStringParameters : event;
    console.log('queryParams: ', queryParams);

    const requestType = queryParams['request_type'];
    
    // If no Request type provided, exit with an error
    if (!requestType) {
        return getBadUrlResponse();
    }
    else {
        console.log('Lets start ' + requestType);

        try {
            let body = null;

            if (requestType === 'GetDirections') {
                body = await getDirections(queryParams);
            }
            else if (requestType === 'GetDistance') {
                body = await getDistance(queryParams);
            }
            else if (requestType === 'GetEmailThreads') {
                body = await getEmailThreads(queryParams, event.body? JSON.parse(event.body): {});
            }
            else if (requestType === 'getDriveContents') {
                body = await getDriveContents(queryParams, event.body? JSON.parse(event.body): {});
            }
            else if (requestType === 'createDriveFolder') {
                body = await createDriveFolder(queryParams, event.body? JSON.parse(event.body): {});
            }
            else if (requestType === 'copyFromS3ToDrive') {
                body = await copyFromS3ToDrive(queryParams, event.body? JSON.parse(event.body): {});
            }            
            else if (requestType === 'copyFromDriveToS3') {
                body = await copyFromDriveToS3(queryParams, event.body? JSON.parse(event.body): {});
            }            
            else {
                return getBadUrlResponse();
            }

            return getServerResponse(body);
        }
        catch (e) {
            console.log(e);
            return getServerErrorResponse(e);
        }
    }
};
