const https = require('https');
const helperFuncts = require('./helperFuncts');
const googleAPI = 'GOOGLE_API_KEY';
const CLIENT_ID = '380240687769-t5gsbc7upsc82fdsihll6svpk16sujkg.apps.googleusercontent.com';

const { Client } = require("@googlemaps/google-maps-services-js");
const googleMapsClient = new Client({});
const { OAuth2Client } = require('google-auth-library');
const oAuth2Client = new OAuth2Client(CLIENT_ID);
// var promisify = require('promisify');
// const { promisify } = require('bluebird');
const { google } = require('googleapis');


const token = {
    "id": "107619544484794949926",
    "name": "Syed Zeeshan Akhtar",
    "email": "akhtar.syedzeeshan@gmail.com",
    "photoUrl": "https://lh3.googleusercontent.com/a-/AOh14GiZynR3rZ-yg2XKGK_i--uxV3Bch2TPyYdRSooo=s96-c",
    "firstName": "Syed Zeeshan",
    "lastName": "Akhtar",
    "authToken": "ya29.a0ARrdaM8NElYvLx3DOkp1Rp41ALaZi0u71dnrwOD-8sWxXh4-syaAgD03PdfKnnZ9R-3RYBOu2IYua6zfq8LKjn8wSikIZQNebdOpqGN4j2vl70_V1z821dls_MyUZJhISw4RoQMrPUSODgLktobjtdPGtu2-eQ",
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImFkZDhjMGVlNjIzOTU0NGFmNTNmOTM3MTJhNTdiMmUyNmY5NDMzNTIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMzgwMjQwNjg3NzY5LXQ1Z3NiYzd1cHNjODJmZHNpaGxsNnN2cGsxNnN1amtnLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMzgwMjQwNjg3NzY5LXQ1Z3NiYzd1cHNjODJmZHNpaGxsNnN2cGsxNnN1amtnLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTA3NjE5NTQ0NDg0Nzk0OTQ5OTI2IiwiZW1haWwiOiJha2h0YXIuc3llZHplZXNoYW5AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJmZVRZQ3Y0YWFDcEZIcGp1MTlHZTFRIiwibmFtZSI6IlN5ZWQgWmVlc2hhbiBBa2h0YXIiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EtL0FPaDE0R2laeW5SM3JaLXlnMlhLR0tfaS0tdXhWM0JjaDJUUHlZZFJTb29vPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlN5ZWQgWmVlc2hhbiIsImZhbWlseV9uYW1lIjoiQWtodGFyIiwibG9jYWxlIjoiZW4iLCJpYXQiOjE2MzQyMTMxMjQsImV4cCI6MTYzNDIxNjcyNCwianRpIjoiODUyZWFjYTc1YmM0Njc0MWRhNDJjMGNjYThiOWE4YWFlODg5NTA3NSJ9.Ukxz6OPQ4WfxswFusLIsTFre7eHz51IoU2hSg5OJ8jP8sZXHX-OE1RqFv39zoSRBgKGe-EZKyflxQ70dWihZRAW2QUgSzdZAYXh1kEeXM-eY5-nKsqn6ZULD3ioO6_-tFAybAZZ6g7juodF8pXtqa2yaqnlX-4A9FKExmNkjMKr6IvNMqazgO2B2Y3GCnZfa9DZq531y4m2JE7sHQnwX_wbaUK2dleleZw-MRJScqNxZi0LSJwfEmgWVzEf11kLyu4CgHlIW7wZbQjhPiJJmEivMVwrh1tRNcIouy8pFFjSJqY0RXCCV6Nn_VaDZSwYN3c_EEWT2yJoU_G82UPcVxg",
    "response": {
        "token_type": "Bearer",
        "access_token": "ya29.a0ARrdaM8NElYvLx3DOkp1Rp41ALaZi0u71dnrwOD-8sWxXh4-syaAgD03PdfKnnZ9R-3RYBOu2IYua6zfq8LKjn8wSikIZQNebdOpqGN4j2vl70_V1z821dls_MyUZJhISw4RoQMrPUSODgLktobjtdPGtu2-eQ",
        "scope": "email profile openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
        "login_hint": "AJDLj6J9nXGC8nvyinFBHbJdEwBh5kZMnzvlvBUhjas9Mf1IzgBa5B9d6wEaWR4_vDbvrL_tKkZzX_EZOuE-o6YX8u5Z4TTSeg",
        "expires_in": 3598,
        "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImFkZDhjMGVlNjIzOTU0NGFmNTNmOTM3MTJhNTdiMmUyNmY5NDMzNTIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMzgwMjQwNjg3NzY5LXQ1Z3NiYzd1cHNjODJmZHNpaGxsNnN2cGsxNnN1amtnLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMzgwMjQwNjg3NzY5LXQ1Z3NiYzd1cHNjODJmZHNpaGxsNnN2cGsxNnN1amtnLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTA3NjE5NTQ0NDg0Nzk0OTQ5OTI2IiwiZW1haWwiOiJha2h0YXIuc3llZHplZXNoYW5AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJmZVRZQ3Y0YWFDcEZIcGp1MTlHZTFRIiwibmFtZSI6IlN5ZWQgWmVlc2hhbiBBa2h0YXIiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EtL0FPaDE0R2laeW5SM3JaLXlnMlhLR0tfaS0tdXhWM0JjaDJUUHlZZFJTb29vPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlN5ZWQgWmVlc2hhbiIsImZhbWlseV9uYW1lIjoiQWtodGFyIiwibG9jYWxlIjoiZW4iLCJpYXQiOjE2MzQyMTMxMjQsImV4cCI6MTYzNDIxNjcyNCwianRpIjoiODUyZWFjYTc1YmM0Njc0MWRhNDJjMGNjYThiOWE4YWFlODg5NTA3NSJ9.Ukxz6OPQ4WfxswFusLIsTFre7eHz51IoU2hSg5OJ8jP8sZXHX-OE1RqFv39zoSRBgKGe-EZKyflxQ70dWihZRAW2QUgSzdZAYXh1kEeXM-eY5-nKsqn6ZULD3ioO6_-tFAybAZZ6g7juodF8pXtqa2yaqnlX-4A9FKExmNkjMKr6IvNMqazgO2B2Y3GCnZfa9DZq531y4m2JE7sHQnwX_wbaUK2dleleZw-MRJScqNxZi0LSJwfEmgWVzEf11kLyu4CgHlIW7wZbQjhPiJJmEivMVwrh1tRNcIouy8pFFjSJqY0RXCCV6Nn_VaDZSwYN3c_EEWT2yJoU_G82UPcVxg",
        "session_state": {
            "extraQueryParams": {
                "authuser": "0"
            }
        },
        "first_issued_at": 1634213124271,
        "expires_at": 1634216722271,
        "idpId": "google"
    },
    "provider": "GOOGLE"
};

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

// Get Directions
async function getDirections(queryParams) {
    const params = {
        params: {
            origin: queryParams['origin'],
            destination: queryParams['destination'],
            travel_mode: 'DRIVING',
            key: googleAPI
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
            key: googleAPI
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
async function getEmailThreads(queryParams) {
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
        idToken: token.idToken,
        audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });

    // oAuth2Client.setCredentials({
    //     access_token: token.response.access_token,
    //     // refresh_token: user[0].refresh_token,
    //     expiry_date: true
    // });

    // after acquiring an oAuth2Client...
    const tokenInfo = await oAuth2Client.getTokenInfo(token.response.access_token);

    // take a look at the scopes originally provisioned for the access token
    console.log('scopes: ', tokenInfo.scopes);

    // let refreshResult = await oAuth2Client.refreshAccessToken();
    // console.log(refreshResult);

    // (function (err, tokens) {
    //     // your access_token is now refreshed and stored in oauth2Client
    //     // store these new tokens in a safe place (e.g. database)
    // });


    // const payload = ticket.getPayload();
    // const userid = payload['sub'];
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
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

    let response = await gmail.users.labels.list({
        userId: 'me',
    });
    console.log(response);


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
                body = await getEmailThreads(queryParams);
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
