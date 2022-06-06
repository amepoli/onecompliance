const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-central-1' });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const dynamo = new AWS.DynamoDB.DocumentClient();
const crypto = require('crypto');
const uuid = require('uuid');

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
const { file } = require('googleapis/build/src/apis/file');

const folderMime = 'application/vnd.google-apps.folder';

const _console = {
    log: (...args) => {
        console.log(args);
    },
    error: (...args) => {
        console.error(args);
    }
}

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

async function fixDriveFolderPathByIdentifier(drivePath, authParams) {
    
    await performGoogleAuth(authParams);

    const drive = google.drive({version: 'v3', auth: oAuth2Client});
    
    let driveFolderId = 'root';

    let response;

    if(drivePath.length > 0) {
        if(drivePath.startsWith('/')) {
            drivePath = drivePath.substring(1);
        }
        let drivePathFolders = drivePath.split('/');
        for await (drivePathFolder of drivePathFolders) {
            let folderQuery = `name = '${drivePathFolder}'`;
            if(drivePathFolder.includes('~')) {
                let folderIdentifierPart = '~' + drivePathFolder.split('~')[1];
                folderQuery = `name contains '${folderIdentifierPart}'`;
            }
            _console.log(`Searching for ${folderQuery} in ${driveFolderId}`);    
            response = await drive.files.list({
                q: `'${driveFolderId}' in parents and mimeType='${folderMime}' and ${folderQuery}`,
                pageSize: 5,
                fields: 'nextPageToken, files(id, name, mimeType)',
            });
            try {
                response = JSON.parse(response);    
            }
            catch(e) {}
            _console.log('response', response);
            if(response.data && response.data.files && response.data.files.length > 0) {
                // Folder exists
                driveFolderId = response.data.files[0].id;

                if(response.data.files.filter(x => x.name === drivePathFolder).length == 0) {
                    _console.log('folder exists but has a different name: ' + response.data.files[0].name + ' and will be renamed to: ' + drivePathFolder);
                    response = await drive.files.update({
                        fileId: driveFolderId,
                        requestBody: {
                            name: drivePathFolder
                        }
                    });
                    try {
                        response = JSON.parse(response);    
                    }
                    catch(e) {}
                }
                else {
                    _console.log('Folder already exists with name: ' + drivePathFolder);
                }

            }
            else {
                // Create folder
                var folderCreateMetadata = {
                    'parents': [driveFolderId],
                    'name': drivePathFolder,
                    'mimeType': folderMime
                };
            
                let response;
                let pageToken = null;
            
                try {
                    // response = oAuth2Client.request({ url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages' })
                    response = await drive.files.create({
                        resource: folderCreateMetadata,
                        fields: 'id'
                    });
                    try {
                        response = JSON.parse(response);    
                    }
                    catch(e) {}
                    _console.log('create folder result: ', JSON.stringify(response));
                    if(response && response.data && response.data.id) {
                        driveFolderId = response.data.id;
                        _console.log('Folder created with new id: ', driveFolderId);
                    }
                }
                catch (e) {
                    _console.log(e);
                }
            }
        }
        _console.log('find folder result: ', JSON.stringify(response));
    }
    return driveFolderId;
}

async function getDriveFileId(drivePath, authParams) {
    
    await performGoogleAuth(authParams);

    const drive = google.drive({version: 'v3', auth: oAuth2Client});
    
    let driveFolderId = 'root';

    let response;

    if(drivePath.length > 0) {
        if(drivePath.startsWith('/')) {
            drivePath = drivePath.substring(1);
        }
        let drivePathFolders = drivePath.split('/');
        for await (drivePathFolder of drivePathFolders) {
            _console.log(`Searching for ${drivePathFolder} in ${driveFolderId}`);    
            response = await drive.files.list({
                q: `'${driveFolderId}' in parents and mimeType='${folderMime}' and name='${drivePathFolder}'`,
                pageSize: 5,
                fields: 'nextPageToken, files(id, name, mimeType)',
            });
            try {
                response = JSON.parse(response);    
            }
            catch(e) {}
            _console.log('response', response);
            if(response.data && response.data.files && response.data.files.length > 0) {
                // Folder exists
                driveFolderId = response.data.files[0].id;
            }
            else {
                // Create folder
                var folderCreateMetadata = {
                    'parents': [driveFolderId],
                    'name': drivePathFolder,
                    'mimeType': folderMime
                };
            
                let response;
                let pageToken = null;
            
                try {
                    // response = oAuth2Client.request({ url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages' })
                    response = await drive.files.create({
                        resource: folderCreateMetadata,
                        fields: 'id'
                    });
                    try {
                        response = JSON.parse(response);    
                    }
                    catch(e) {}
                    _console.log('create folder result: ', JSON.stringify(response));
                    if(response && response.data && response.data.id) {
                        driveFolderId = response.data.id;
                        _console.log('Folder created with new id: ', driveFolderId);
                    }
                }
                catch (e) {
                    _console.log(e);
                }
            }
        }
        _console.log('find folder result: ', JSON.stringify(response));
    }
    return driveFolderId;
}

async function downloadS3Object(s3FilePath, file) {
    var params = { 
        Bucket: 'BUCKET_NAME',
        Key: s3FilePath
    };

    const data = await s3.getObject(params).promise();
    return data;
}

async function uploadS3Object(s3FilePath, data) {
    var params = { 
        Bucket: 'BUCKET_NAME',
        Key: s3FilePath,
        Body: data
    };

    const result = await s3.upload(params).promise();
    return result;
}

async function downloadDriveObject(driveFolderId, driveFile) {
    const drive = google.drive({version: 'v3', auth: oAuth2Client});
    
    let response = null;

    response = await drive.files.list({
        q: `'${driveFolderId}' in parents and name='${driveFile}'`,
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
    _console.log('find file result: ', JSON.stringify(response));

    if(driveFileId) {
        response = await drive.files.get({
            fileId: driveFileId,
            alt: 'media'
        },
        { responseType: "arraybuffer" });
    }
    
    const data = Buffer.from(response.data);    
    _console.log('google file data: ', data);
    return data;
}

async function getDriveFileInfo(driveFolderId, driveFile) {    
    const drive = google.drive({version: 'v3', auth: oAuth2Client});
    let response;

    try {
        _console.log('Trying to find file with folder id: ', driveFolderId, ' and file name: ', driveFile);
        
        // response = oAuth2Client.request({ url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages' })
        response = await drive.files.list({
            q: `'${driveFolderId}' in parents and name='${driveFile}'`,
            pageSize: 250,
            fields: 'nextPageToken, files(id, name, mimeType, trashed, md5Checksum, createdTime, modifiedTime)',
        });
        try {
            response = JSON.parse(response);    
        }
        catch(e) {}
        
        _console.log(JSON.stringify(response));
        if(response.data && response.data.files && response.data.files.length > 0) {
            return { result: 'OK', data: response.data.files[0] };
        }
    }
    catch (e) {
        _console.log(e);
    }

    return { result: 'KO', data: 'File not found!' };
}

async function renameDriveFile(driveFolderId, OldName, newName) {    
    const drive = google.drive({version: 'v3', auth: oAuth2Client});
    let response;

    try {
        _console.log('Trying to find file with folder id: ', driveFolderId, ' and file name: ', OldName);
        
        // response = oAuth2Client.request({ url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages' })
        response = await drive.files.list({
            q: `'${driveFolderId}' in parents and name='${OldName}'`,
            pageSize: 250,
            fields: 'nextPageToken, files(id, name, mimeType, trashed, md5Checksum, createdTime, modifiedTime)',
        });
        try {
            response = JSON.parse(response);    
        }
        catch(e) {}
                
        _console.log(JSON.stringify(response));
        if(response.data && response.data.files && response.data.files.length > 0) {
            let file = response.data.files[0];

            response = await drive.files.update({
                fileId: file.id,
                requestBody: {
                    name: newName
                }
            });
            try {
                response = JSON.parse(response);    
            }
            catch(e) {}

            return { result: 'OK', data: response };
        }
    }
    catch (e) {
        _console.log(e);
    }

    return { result: 'KO', data: 'File not found!' };
}

async function getS3FileInfo(s3FilePath) {
    var params = { 
        Bucket: 'BUCKET_NAME',
        Key: s3FilePath.startsWith('/')? s3FilePath.substring(1): s3FilePath
    };
    _console.log('params', params);
    const data = await s3.headObject(params).promise();   
    return { result: 'OK', data: data };
}

async function deleteDriveFile(driveFileId) {
    const drive = google.drive({version: 'v3', auth: oAuth2Client});
    
    let response;
    
    try {
        // response = oAuth2Client.request({ url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages' })
        response = await drive.files.delete({ 'fileId': driveFileId });
        try {
            response = JSON.parse(response);    
        }
        catch(e) {
            return {result: 'KO', data: e};
        }
        return { result: 'OK', data: response };        
    }
    catch (e) {
        _console.log(e);
        return {result: 'KO', data: e};
    }

    return { result: 'KO', data: 'File not found!' };
}

async function deleteS3File(s3FilePath) {
    var params = { 
        Bucket: 'BUCKET_NAME',
        Key: s3FilePath
    };

    const data = await s3.deleteObject(params).promise();   
    return { result: 'OK', data: data };
}

// Perform Google Auth
async function performGoogleAuth(authParams) {
    authParams["refresh_token"] = authParams["access_token"];
    //authParams["code"] = "4/0AX4XfWiIpDqZDo_3UgFm6sTL5AuWRRxNd0jcxMc8p9rZOhxQuNZUijREH5HrI4yxLF7G3Q",
    authParams["client_secret"] = 'CLIENT_SECRET';
    _console.log('authParams: ', authParams);

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
    _console.log('ticket: ', ticket);

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
    _console.log('tokenInfo: ', tokenInfo);

    try {
        let refreshResult = await oAuth2Client.refreshAccessToken();
        _console.log(refreshResult);
    }
    catch (e) {
        _console.log(e);
    }

}

// Get Directions
async function getDirections(origin, destination) {
    const params = {
        params: {
            origin: origin,
            destination: destination,
            travel_mode: 'DRIVING',
            key: 'GOOGLE_API_KEY'
        }
    };
    const response = await googleMapsClient.directions(params);
    _console.log(JSON.stringify(response.data));
    if (response.data.status == 'OK') {
        return { result: 'OK', data: response.data };
    }
    else {
        return { result: 'KO', reason: response.data };
    }
}

// Get Distance
async function getDistance(origin, destination) {
    const params = {
        params: {
            origins: [origin],
            destinations: [destination],
            travel_mode: 'DRIVING',
            key: 'GOOGLE_API_KEY'
        }
    };
    const response = await googleMapsClient.distancematrix(params);
    _console.log(JSON.stringify(response.data));
    if (response.data.status == 'OK') {
        return { result: 'OK', data: response.data };
    }
    else {
        return { result: 'KO', reason: response.data };
    }
}

// Get Email Threads
async function getEmailThreads(search, authParams) {
    
    await performGoogleAuth(authParams);

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    let response;

    try {
        // response = oAuth2Client.request({ url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages' })
        let response = await gmail.users.labels.list({
            userId: 'me',
        });
        _console.log(JSON.stringify(response));
    }
    catch (e) {
        _console.log(e);
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
    // _console.log(response);

    // const response = await promisify(gmail.users.labels.list({
    //     userId: 'me',
    // }), { context: gmail.users.labels} );
    // _console.log(response);

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
        _console.log(response);
    }
    catch (e) {
        _console.log(e);
    }



    // gmail.users.labels.list({
    //     userId: 'me',
    // }, (err, res) => {
    //     if (err) return _console.log('The API returned an error: ' + err);
    //     const labels = res.data.labels;
    //     if (labels.length) {
    //         _console.log('Labels:');
    //         labels.forEach((label) => {
    //             _console.log(`- ${label.name}`);
    //         });
    //     } else {
    //         _console.log('No labels found.');
    //     }
    // });
    // snooze(5000);

    // If request specified a G Suite domain:
    // const domain = payload['hd'];

    // // Get directions
    // const url = `https://gmail.googleapis.com/gmail/v1/users/${queryParams['email']}/threads`;
    // _console.log('url: ', url);
    // // const req = await requestPromise({ url, method: 'GET' })
    // const response = await axios.get(url);
    // _console.log(response.data);

    return { result: 'OK', result: response };
}

// Get getDriveContents
async function getDriveContents(folder, authParams) {
    
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
        _console.log(JSON.stringify(response));
    }
    catch (e) {
        _console.log(e);
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
    // _console.log(response);

    // const response = await promisify(gmail.users.labels.list({
    //     userId: 'me',
    // }), { context: gmail.users.labels} );
    // _console.log(response);

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
    //     _console.log(response);
    // }
    // catch (e) {
    //     _console.log(e);
    // }



    // gmail.users.labels.list({
    //     userId: 'me',
    // }, (err, res) => {
    //     if (err) return _console.log('The API returned an error: ' + err);
    //     const labels = res.data.labels;
    //     if (labels.length) {
    //         _console.log('Labels:');
    //         labels.forEach((label) => {
    //             _console.log(`- ${label.name}`);
    //         });
    //     } else {
    //         _console.log('No labels found.');
    //     }
    // });
    // snooze(5000);

    // If request specified a G Suite domain:
    // const domain = payload['hd'];

    // // Get directions
    // const url = `https://gmail.googleapis.com/gmail/v1/users/${queryParams['email']}/threads`;
    // _console.log('url: ', url);
    // // const req = await requestPromise({ url, method: 'GET' })
    // const response = await axios.get(url);
    // _console.log(response.data);

    return { result: 'OK', data: response.data.files };
}

// Create Drive Folder
async function createDriveFolder(folder, authParams) {
    
    await performGoogleAuth(authParams);

    const drive = google.drive({version: 'v3', auth: oAuth2Client});

    var fileMetadata = {
        'name': folder,
        'mimeType': folderMime
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
        _console.log(JSON.stringify(response));
    }
    catch (e) {
        _console.log(e);
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
    // _console.log(response);

    // const response = await promisify(gmail.users.labels.list({
    //     userId: 'me',
    // }), { context: gmail.users.labels} );
    // _console.log(response);

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
    //     _console.log(response);
    // }
    // catch (e) {
    //     _console.log(e);
    // }



    // gmail.users.labels.list({
    //     userId: 'me',
    // }, (err, res) => {
    //     if (err) return _console.log('The API returned an error: ' + err);
    //     const labels = res.data.labels;
    //     if (labels.length) {
    //         _console.log('Labels:');
    //         labels.forEach((label) => {
    //             _console.log(`- ${label.name}`);
    //         });
    //     } else {
    //         _console.log('No labels found.');
    //     }
    // });
    // snooze(5000);

    // If request specified a G Suite domain:
    // const domain = payload['hd'];

    // // Get directions
    // const url = `https://gmail.googleapis.com/gmail/v1/users/${queryParams['email']}/threads`;
    // _console.log('url: ', url);
    // // const req = await requestPromise({ url, method: 'GET' })
    // const response = await axios.get(url);
    // _console.log(response.data);

    return { result: 'OK', data: response };
}

// Create Drive Folder
async function copyFromS3ToDrive(s3FilePath, driveFilePath, authParams) {
    
    await performGoogleAuth(authParams);

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
    _console.log('s3File: ', s3File);
    _console.log('s3Path: ', s3Path);
    
    
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
    _console.log('driveFile: ', driveFile);
    _console.log('drivePath: ', drivePath);
    
    
    const s3FileData = await downloadS3Object(s3FilePath, s3File);
    _console.log('s3FileData: ', s3FileData);
    
    const s3Data = s3FileData.Body;
    const s3DataStr = s3Data.toString('hex');
    _console.log('data: ', s3DataStr);
    
    // var bufferStream = new stream.PassThrough();
    // bufferStream.end(Uint8Array.from(s3Data));
    
    var bufferStream = new stream.PassThrough();
    // bufferStream.end(Uint8Array.from(Buffer.from(s3DataStr, "hex")));
    bufferStream.end(s3Data);
    
    //var bufferStream = Buffer.from(s3DataStr, 'hex');

    // let bufferStream = new stream.PassThrough();
    // bufferStream.end(s3FileData.Body);

    // const stream = Readable.from(s3FileData);
    // _console.log('data: ' + JSON.stringify(bufferStream));

    const drive = google.drive({version: 'v3', auth: oAuth2Client});
    
    let driveFolderId = 'root';

    let response;

    if(drivePath.length > 0) {        
        let drivePathFolders = drivePath.split('/');
        for await (drivePathFolder of drivePathFolders) {
            _console.log(`Searching for ${drivePathFolder} in ${driveFolderId}`);    
            response = await drive.files.list({
                q: `'${driveFolderId}' in parents and mimeType='${folderMime}' and name='${drivePathFolder}'`,
                pageSize: 5,
                fields: 'nextPageToken, files(id, name, mimeType)',
            });
            try {
                response = JSON.parse(response);    
            }
            catch(e) {}
            _console.log('response', response);
            if(response.data && response.data.files && response.data.files.length > 0) {
                // Folder exists
                driveFolderId = response.data.files[0].id;
            }
            else {
                // Create folder
                var folderCreateMetadata = {
                    'parents': [driveFolderId],
                    'name': drivePathFolder,
                    'mimeType': folderMime
                };
            
                let response;
                let pageToken = null;
            
                try {
                    // response = oAuth2Client.request({ url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages' })
                    response = await drive.files.create({
                        resource: folderCreateMetadata,
                        fields: 'id'
                    });
                    try {
                        response = JSON.parse(response);    
                    }
                    catch(e) {}
                    _console.log('create folder result: ', JSON.stringify(response));
                    if(response && response.data && response.data.id) {
                        driveFolderId = response.data.id;
                        _console.log('Folder created with new id: ', driveFolderId);
                    }
                }
                catch (e) {
                    _console.log(e);
                }
            }
        }
        _console.log('find folder result: ', JSON.stringify(response));
    }
    
    const fileMetadata = {
        'name': driveFile,
        parents: [driveFolderId]
    };
    const media = {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
        _console.log(JSON.stringify(response));
    }
    catch (e) {
        _console.log(e);
    }
    
    if (global.gc) {
        _console.log('Requesting gc to free-up unsed memory');
        global.gc(); // Synchronous call, may take longer time and further execution get blocked till it finishes the execution
    }
    
    if (bufferStream.destroy) {
        _console.log('Destroying buffer stream');
        bufferStream.destroy();
    }
    

    return { result: 'OK', data: response };
}

async function copyFromDriveToS3(s3FilePath, driveFolderId, driveFile, authParams) {

    await performGoogleAuth(authParams);

    let response;
    
    const driveFileData = await downloadDriveObject(driveFolderId, driveFile);
    response = await uploadS3Object(s3FilePath, driveFileData);

    // _console.log('data: ' + JSON.stringify(bufferStream));

    
    // const drive = google.drive({version: 'v3', auth: oAuth2Client});
    
    // let driveFolderId = 'root';

    // if(drivePath.length > 0) {        
    //     response = await drive.files.list({
    //         q: `mimeType='${folderMime}' and name='${drivePath}'`,
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
    //     _console.log('find folder result: ', JSON.stringify(response));
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
    //     _console.log(JSON.stringify(response));
    // }
    // catch (e) {
    //     _console.log(e);
    // }

    return { result: 'OK', data: response };
}

async function syncDriveS3File(syncData, authParams) {
    
    await performGoogleAuth(authParams);
    
    let result = [];
    
    _console.log('syncData: ', syncData);
    
    for await (syncRow of syncData) {
        let driveFilePath = syncRow['driveFilePath'];    
        let s3FilePath = syncRow['s3FilePath'];
        const s3md5 = syncRow['s3md5'];
        
        _console.log('driveFile: ', driveFilePath);
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
        _console.log('driveFile: ', driveFile);
        _console.log('drivePath: ', drivePath);

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
        _console.log('s3File: ', s3File);
        _console.log('s3Path: ', s3Path);
        
        let response;
        let driveFileInfo = null;
        let driveFolderId = null;
        let s3FileInfo = null;

        try {
            if(syncRow['driveFolderId']) {
                _console.log('Using syncRow driveFolderId', syncRow['driveFolderId']);
                driveFolderId = syncRow['driveFolderId'];
            }
            else {
                driveFolderId = await getDriveFileId(drivePath, authParams);
            }
        }
        catch(e) {
            _console.error(e);
        }
        
        try {
            response = await getDriveFileInfo(driveFolderId, driveFile);
            driveFileInfo = response.data;
            _console.log('getDriveFileInfo: ', JSON.stringify(response));
            if(driveFileInfo.result === 'KO') {
                driveFileInfo = null;
            }
        }
        catch(e) {
            _console.error(e);
        }
        
        try{
            response = await getS3FileInfo(s3FilePath);
            s3FileInfo = response.data;
            if(s3FileInfo && s3FileInfo.ETag) {
                _console.log('getS3FileInfo: ', JSON.stringify(s3FileInfo));
                s3FileInfo.ETag = s3FileInfo.ETag.replace('\\', "");
                s3FileInfo.ETag = s3FileInfo.ETag.replace('\\', "");
                s3FileInfo.ETag = s3FileInfo.ETag.replace('"', "");
                s3FileInfo.ETag = s3FileInfo.ETag.replace('"', "");
                _console.log('getS3FileInfo md5: ', s3FileInfo.ETag);
            }
        }
        catch(e) {
            _console.error(e);
        }
        
        if(driveFileInfo && driveFileInfo.modifiedTime != null && s3FileInfo && s3FileInfo.LastModified != null) {
            if(driveFileInfo.md5Checksum == s3FileInfo.ETag) {
                syncRow['s3md5'] = driveFileInfo.md5Checksum;
                response = { result: 'OK', message: 'Did not copy. Both files are same.' };
            }
            else {
                const driveFileModifiedDateTime = new Date(driveFileInfo.modifiedTime);
                const s3FileModifiedDateTime = new Date(s3FileInfo.LastModified);
                _console.log('driveFileModifiedDateTime', driveFileModifiedDateTime);
                _console.log('s3FileModifiedDateTime', s3FileModifiedDateTime);
                
                if(driveFileModifiedDateTime > s3FileModifiedDateTime) {
                    _console.log('deleteS3File...');
                    await deleteS3File(s3FilePath);
                    _console.log('copyFromDriveToS3...');
                    await copyFromDriveToS3(s3FilePath, driveFolderId, driveFile, authParams);
                    syncRow['s3md5'] = driveFileInfo.md5Checksum;
                    response = { result: 'OK', message: 'Copied from Drive to S3' };
                }
                else if(driveFileModifiedDateTime < s3FileModifiedDateTime) {
                    _console.log('deleteDriveFile...');
                    await deleteDriveFile(driveFileInfo.id);
                    _console.log('copyFromS3ToDrive...');
                    await copyFromS3ToDrive(s3FilePath, driveFilePath, authParams);
                    syncRow['s3md5'] = s3FileInfo.ETag;
                    response = { result: 'OK', message: 'Copied from S3 to Drive' };
                }
            }
        }
        else if(driveFileInfo && driveFileInfo.modifiedTime != null) {
            _console.log('copyFromDriveToS3...');
            await copyFromDriveToS3(s3FilePath, driveFolderId, driveFile, authParams);
            syncRow['s3md5'] = driveFileInfo.md5Checksum;
            response = { result: 'OK', message: 'Copied from Drive to S3' };
        }
        else if(s3FileInfo && s3FileInfo.LastModified != null) {        
            _console.log('copyFromS3ToDrive...');
            await copyFromS3ToDrive(s3FilePath, driveFilePath, authParams);
            syncRow['s3md5'] = s3FileInfo.ETag;
            response = { result: 'OK', message: 'Copied from S3 to Drive' };
        }
        else {
            if(!syncRow['fileid']) {
                syncRow['fileid'] = uuid.v4();
            }
            if(!syncRow['md5']) {
                syncRow['md5'] = null;
            }
                        
            response = { result: 'OK', message: 'Both files do not exist!' };
        }
        //response = await uploadS3Object(s3Path, s3File, driveFileData);

        result.push(response);
    }

    _console.log('Sync result: ', result);
    
    return { result: 'OK', result: result, syncData };
}

async function getDriveFolderCompletePath(drive, driveFolder) {
    let response;
    let completePath = '';
    try {
        let query = `name='${driveFolder}' and mimeType='${folderMime}'`;
        
        let parentId = null;
        let parentName = null;

        while (parentId != 'root') {
            try {
                response = await drive.files.list({
                    q: query,
                    pageSize: 250,
                    fields: 'nextPageToken, files(id, name, mimeType, trashed, md5Checksum, parents)',
                });
                
            }
            catch(e) {
                _console.log('error', e);
            }

            try {
                response = JSON.parse(response);    
            }
            catch(e) { }

            _console.log('list drive files: ', JSON.stringify(response));

            if(response.data && response.data.files && response.data.files.length > 0) {
                completePath = '/' + response.data.files[0].name + '';
                parentId = response.data.files[0].parents[0];
            }
            _console.log('parentId: ', parentId);
            //parentId = 'root';
            query = `driveId='${parentId}'`;
            _console.log('query: ', query);
        }
    }
    catch (e) {
        _console.log(e);
    }
    
    return completePath;
}

// Get getDriveRecursiveContents
async function getDriveRecursiveContents(drive, driveFolder, driveFileId, path, results) {
    let response;
    try {
        let query = '';
        if(driveFileId) {
            query = `'${driveFileId}' in parents`;
        }
        else {
            query = `name='${driveFolder}' and mimeType='${folderMime}'`;
        }
        _console.log('query: ', query);
        
        // response = oAuth2Client.request({ url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages' })
        try {
            response = await drive.files.list({
                q: query,
                pageSize: 250,
                fields: 'nextPageToken, files(id, name, mimeType, trashed, md5Checksum, parents)',
              });
            
        }
        catch(e) {
            _console.log('error', e);
        }

        try {
            response = JSON.parse(response);    
        }
        catch(e) { }


        _console.log('list drive files: ', JSON.stringify(response));

        if(response.data && response.data.files && response.data.files.length > 0) {
            for await (let curFile of response.data.files) {
                if(curFile.mimeType == folderMime) {
                    results = await getDriveRecursiveContents(drive, null, curFile.id, path && path.length? path + '/' + curFile.name: curFile.name, results);
                }
                else if(!curFile.trashed) {
                    results.push({fileid: curFile.id, filename: curFile.name, md5: curFile.md5Checksum, folder: path});
                }
            }
        }

    }
    catch (e) {
        _console.log(e);
    }

    return results;
}

async function fixAnagraficaFolderByIdentifier(anagraficaFolders, authParams) {
    await performGoogleAuth(authParams);
    const drive = google.drive({version: 'v3', auth: oAuth2Client});
    _console.log('anagraficaFolders', anagraficaFolders);
    
    // let completePath = await getDriveFolderCompletePath(drive, driveFolder); 
    // _console.log('completePath: ', completePath);
    
    const driveFolder = anagraficaFolders['root_folder'];
    const subFolders = anagraficaFolders['sub_folders'] || [];

    let foldersToCheck = [driveFolder];
    if(subFolders && subFolders.length > 0) {
        for await (subFolder of subFolders) {
            if(!foldersToCheck.includes(subFolder.folder)) {
                foldersToCheck.push(subFolder.folder);
            }
        }
    }
    
    _console.log('foldersToCheck: ', JSON.stringify(foldersToCheck));
    

    let folderIds = {};

    for await (let folder of foldersToCheck) {
        _console.log('Checking and fixing: ' + folder);
        let folderId = await fixDriveFolderPathByIdentifier(folder, authParams);
        folderIds[folder] = folderId;
    }
    
    _console.log('fix Result: '+ JSON.stringify({ result: 'OK', folderIds: folderIds }));
    return { result: 'OK', folderIds: folderIds };

}

async function getDriveFolderDeepContents(anagraficaFolders, authParams) {
    await performGoogleAuth(authParams);
    const drive = google.drive({version: 'v3', auth: oAuth2Client});
    _console.log('anagraficaFolders', JSON.stringify(anagraficaFolders));
    
    // let completePath = await getDriveFolderCompletePath(drive, driveFolder); 
    // _console.log('completePath: ', completePath);
    
    const driveFolder = anagraficaFolders['root_folder'];
    let subFolders = [];
    const folderIds = anagraficaFolders['folder_ids'] || [];

    if(anagraficaFolders['sub_folders'] && anagraficaFolders['sub_folders'].length > 0) {
        for(let subFolder of anagraficaFolders['sub_folders']) {
            if(subFolder.file && subFolder.file.length > 0 && subFolders.filter(x => x.file === subFolder.file && x.folder === x.folder).length == 0) {
                subFolders.push(subFolder);
            }
        }
    }

    _console.log('subFolders', JSON.stringify(subFolders));
    
    // _console.log()
    // while( i < subFolders.length) {        
    //     let getDriveFileIdResponse = await getDriveFileId(subFolders[i], authParams);
    //     _console.log('getDriveFileIdResponse', getDriveFileIdResponse);
    //     i++;
    // }

    let rootFolderId = null;

    try {
        rootFolderId = folderIds[driveFolder]; // await getDriveFileId(driveFolder, authParams);
        _console.log('rootFolderId: ', rootFolderId);
    }
    catch(e) {
        _console.error(e);
    }

    let results = await getDriveRecursiveContents(drive, null, rootFolderId, driveFolder, []);
    _console.log('Root getDriveRecursiveContents results: ', JSON.stringify(results));    
    
    let syncData = [];
    
    if(subFolders && subFolders.length > 0) {
        for await (subFolder of subFolders) {
            _console.log('Checking if subfolder is already added: ' + (subFolder.folder + '/' + subFolder.file));
            if(syncData.filter( x => x.driveFilePath == (subFolder.folder + '/' + subFolder.file)).length == 0) {
                syncData.push({
                    s3FilePath: subFolder.fileid, s3md5: subFolder.md5, driveFilePath: subFolder.folder + '/' + subFolder.file, driveFolderId: folderIds[subFolder.folder]
                });
            }
        }

        let syncResponse = [];
        
        let syncBatches = Array(Math.ceil(syncData.length/10)).map((x, i) => i * 10);
        _console.log('syncBatches: ', syncBatches);

        syncResponse = await syncDriveS3File(syncData, authParams);
        _console.log('syncResponse: ', syncResponse);
        syncData = syncResponse['syncData'];

        for await (subFolder of subFolders) {
            if(subFolder.file && subFolder.file.length > 0) {
                if(!subFolder.md5 || !subFolder.fileid) {
                    let getDriveFileIndoResponse;
                    let driveFileInfo = null;
                    let driveFolderId = null;
                    
                    try {
                        driveFolderId = folderIds[subFolder['folder']]; // await getDriveFileId(subFolder['folder'], authParams);
                        _console.log('Using driveFolderId: ', driveFolderId, ' for: ', subFolder['folder']);
                    }
                    catch(e) {
                        _console.error(e);
                    }
                    
                    try {
                        getDriveFileIndoResponse = await getDriveFileInfo(driveFolderId, subFolder['file']);
                        _console.log('subfolder getDriveFileInfo: ', JSON.stringify(getDriveFileIndoResponse));
                        driveFileInfo = getDriveFileIndoResponse.data;
                        if(driveFileInfo && driveFileInfo['md5Checksum']) {
                            _console.log('driveFileInfo: ', JSON.stringify(driveFileInfo));
                            subFolder['md5'] = driveFileInfo['md5Checksum'];
        
                            if(!subFolders.fileid) {
                                subFolder['fileid'] = driveFileInfo['id'];
                            }
                        }
                        
                        _console.log('subfolder: ', JSON.stringify(subFolder));
                    }
                    catch(e) {
                        _console.error(e);
                    }
                }

                _console.log('Pushing to results: ' + JSON.stringify({fileid: subFolder.fileid, filename: subFolder.file, md5: subFolder.md5, folder: subFolder.folder}));
                results.push({fileid: subFolder.fileid, filename: subFolder.file, md5: subFolder.md5, folder: subFolder.folder});
            }
            // Not needed anymore by fixAnagraficaFolderByIdentifier takes care of creating missing folders
            // else {
            //     await getDriveFileId(subFolder['folder'], authParams);
            // }
        }
    }
    
    let finalResponse = { result: 'OK', files: results};

    _console.log('getDriveFolderDeepContents result', JSON.stringify(finalResponse), 'length: ', JSON.stringify(finalResponse).length);
    return finalResponse;

}

async function performDriveOperations(operations, authParams) {
    await performGoogleAuth(authParams);
    const drive = google.drive({version: 'v3', auth: oAuth2Client});
    _console.log('operations', operations);
    
    let result = [];

    if(operations && operations.length > 0) {
        for await (let operation of operations) {
            if(operation.todo === '1- rename' || operation.todo === '3- upload and rename') {
                let drivePath = operation.googledrivepath;
                let driveFile = operation.oldfilename;
                // if(operation.googledrivepath.includes('/')) {
                //     let driveFilePathParts = operation.googledrivepath.split('/');
                //     driveFile = driveFilePathParts.pop();
                //     drivePath = driveFilePathParts.join('/');
                // }
                _console.log('driveFile: ', driveFile);
                _console.log('drivePath: ', drivePath);
            

                let getDriveFileIndoResponse;
                let driveFileInfo = null;
                let driveFolderId = null;
                
                try {
                    driveFolderId = await getDriveFileId(drivePath, authParams);
                }
                catch(e) {
                    _console.error(e);
                }
                
                try {
                    let renameDriveFileResponse = await renameDriveFile(driveFolderId, driveFile, operation.newfilename);
                    _console.log('renameDriveFile response: ', JSON.stringify(renameDriveFileResponse));
                    result.push(renameDriveFileResponse);
                }
                catch(e) {
                    _console.error(e);
                }

            }
            //result.push(getDriveFileIndoResponse);
        }
        
        // syncData = subFolders.map( x => {
        //     return {
        //         s3FilePath: x.fileid, s3md5: x.md5, driveFilePath: x.folder + '/' + x.file
        //     }
        // });
    }


    return { result: 'OK', response: result };

}

exports.handler = async (event, context) => {

    // _console.log(event);
    // const method = event.httpMethod;
    // const userid = event.requestContext ? event.requestContext.identity.cognitoAuthenticationProvider.split(':')[2] : null;
    // _console.log('userid: ', userid);

    const queryParams = event.queryStringParameters ? event.queryStringParameters : event;
    _console.log('queryParams: ', queryParams);

    const requestType = queryParams['request_type'];
    
    // If no Request type provided, exit with an error
    if (!requestType) {
        return getBadUrlResponse();
    }
    else {
        _console.log('Lets start ', requestType);

        try {
            let body = null;

            if (requestType === 'GetDirections') {
                const origin = queryParams['origin'];
                const destination = queryParams['destination'];
                body = await getDirections(origin, destination);
            }
            else if (requestType === 'GetDistance') {
                const origin = queryParams['origin'];
                const destination = queryParams['destination'];
                body = await getDistance(origin, destination);
            }
            else if (requestType === 'GetEmailThreads') {
                const search = queryParams['search'];
                body = await getEmailThreads(search, event.body? JSON.parse(event.body): {});
            }
            else if (requestType === 'getDriveContents') {
                const folder = queryParams['folder'];
                body = await getDriveContents(folder, event.body? JSON.parse(event.body): {});
            }
            else if (requestType === 'createDriveFolder') {
                const folder = queryParams['folder'];
                body = await createDriveFolder(folder, event.body? JSON.parse(event.body): {});
            }
            else if (requestType === 'copyFromS3ToDrive') {
                const s3FilePath = queryParams['s3FilePath'];
                const driveFilePath = queryParams['driveFilePath'];
                body = await copyFromS3ToDrive(s3FilePath, driveFilePath, event.body? JSON.parse(event.body): {});
            }            
            else if (requestType === 'copyFromDriveToS3') {
                let driveFilePath = queryParams['driveFilePath'];    
                let s3FilePath = queryParams['s3FilePath'];
                    
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
                _console.log('driveFile: ', driveFile);
                _console.log('drivePath: ', drivePath);
            
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
                _console.log('s3File: ', s3File);
                _console.log('s3Path: ', s3Path);
                    
                let driveFolderId = null;
                
                try {
                    driveFolderId = await getDriveFileId(drivePath, event.body? JSON.parse(event.body): {});
                }
                catch(e) {
                    _console.error(e);
                }

                body = await copyFromDriveToS3(s3FilePath, driveFolderId, driveFile, event.body? JSON.parse(event.body): {});
            }
            else if (requestType === 'syncDriveS3File') {
                const syncData = JSON.parse(queryParams['syncData']);
                body = await syncDriveS3File(syncData, event.body? JSON.parse(event.body): {});
            }
            else if (requestType === 'fixAnagraficaFolderByIdentifier')  {
                let eventBody = event.body? JSON.parse(event.body): {};
                const anagraficaFolders = eventBody['anagraficaFolders'];
                const authParams = eventBody['authToken'];
                body = await fixAnagraficaFolderByIdentifier(anagraficaFolders, authParams);
            }
            else if (requestType === 'getDriveFolderDeepContents') {
                let eventBody = event.body? JSON.parse(event.body): {};
                const anagraficaFolders = eventBody['anagraficaFolders'];
                const authParams = eventBody['authToken'];
                body = await getDriveFolderDeepContents(anagraficaFolders, authParams);
            }
            else if(requestType === 'performDriveOperations') {
                let eventBody = event.body? JSON.parse(event.body): {};
                const operations = eventBody['operations'];
                const authParams = eventBody['authToken'];
                body = await performDriveOperations(operations, authParams);
            }
            else {
                return getBadUrlResponse();
            }
            _console.log('sending body: ', getServerResponse(body));
            return getServerResponse(body);
        }
        catch (e) {
            _console.log(e);
            return getServerErrorResponse(e);
        }
    }
};
