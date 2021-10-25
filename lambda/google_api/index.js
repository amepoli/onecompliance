const https = require('https');
const helperFuncts = require('./helperFuncts');
const googleAPI = 'GOOGLE_API_KEY';
const CLIENT_ID = '380240687769-t5gsbc7upsc82fdsihll6svpk16sujkg.apps.googleusercontent.com';
const CLIENT_SECRET = 'F56L14ZUTbykHAdTTSiAPBUb';
const { Client } = require("@googlemaps/google-maps-services-js");
const googleMapsClient = new Client({});
const { OAuth2Client } = require('google-auth-library');
const oAuth2Client = new OAuth2Client(
    CLIENT_ID,
    CLIENT_SECRET
);
// var promisify = require('promisify');
// const { promisify } = require('bluebird');
const { google } = require('googleapis');


const token =
{
    "id": "107619544484794949926",
    "name": "Syed Zeeshan Akhtar",
    "email": "akhtar.syedzeeshan@gmail.com",
    "photoUrl": "https://lh3.googleusercontent.com/a-/AOh14GiZynR3rZ-yg2XKGK_i--uxV3Bch2TPyYdRSooo=s96-c",
    "firstName": "Syed Zeeshan",
    "lastName": "Akhtar",
    "authToken": "ya29.a0ARrdaM-C2bAfXqVHqROuazYsnBF_IqMA7hpfTNwKJ1mdhUimqyhrtplXqqG0Me8X3s-ssLT8PvwGeLqhlXUQYo6sxqAfXOVN_Ymwwem7wnrfoqEGHYl5FFMKJHAFzu-Lr6TEdvwkAdVuiKUC-y3AOmkA2qRC",
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImFkZDhjMGVlNjIzOTU0NGFmNTNmOTM3MTJhNTdiMmUyNmY5NDMzNTIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMzgwMjQwNjg3NzY5LXQ1Z3NiYzd1cHNjODJmZHNpaGxsNnN2cGsxNnN1amtnLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMzgwMjQwNjg3NzY5LXQ1Z3NiYzd1cHNjODJmZHNpaGxsNnN2cGsxNnN1amtnLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTA3NjE5NTQ0NDg0Nzk0OTQ5OTI2IiwiZW1haWwiOiJha2h0YXIuc3llZHplZXNoYW5AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJtMmpJSnFVazhneFFPZG1fanFtWmVBIiwibmFtZSI6IlN5ZWQgWmVlc2hhbiBBa2h0YXIiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EtL0FPaDE0R2laeW5SM3JaLXlnMlhLR0tfaS0tdXhWM0JjaDJUUHlZZFJTb29vPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlN5ZWQgWmVlc2hhbiIsImZhbWlseV9uYW1lIjoiQWtodGFyIiwibG9jYWxlIjoiZW4iLCJpYXQiOjE2MzQ2NDM1MDEsImV4cCI6MTYzNDY0NzEwMSwianRpIjoiY2QzNmM1MDJjMTY0Y2QxZWQ1ZjFmZTVjNjNhYmI3ODYxZTc5N2UzNCJ9.IWGnAwRF4_35PUZpWUVEQ0i2qGBv_j-k7p_OwR67qOwAVJiN7fDYLSO-4zj38850_8pSEz9sV7kpvrWAfe7DqdgFLkvERNRmqD5ztEjURSiUHu5xfIJvVeI8N_F16Zz4soCoVOmlojaEJFKA0QHznybdfOddGxySoQpXb-UjpMtIJp7b8Yj3OJm5NCezO-cYPHOHeYJj0bwKvcPdhGaqs0BcZXecv9fKPqFA1PpzUmjScBCFplrjf0poUvKAn8VcuWGGnkJfIpB7_S4ZeaRpy6ABdFfW8Ipppzvx2WzOm2-RJBaP1P-23Z2090HipGVOdMahiMejs0RgwAt3EIdxAA",
    "response": {
        "token_type": "Bearer",
        "access_token": "ya29.a0ARrdaM_ymPu-HIZ2kPIwQvDFd2fILh0wlthv52W9ptm611LdWkARR8H3E9Nq5qpyyX67r_KwYsPpJT5mJyVwFVhAdJuCJ0txiyJT9HuUnXLUEa5JK_OfxIHbDijzMhiYvRmlRtJt1mtPqL-M7fl85YLQkPNK",
        "scope": "email profile https://mail.google.com/ https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid",
        "login_hint": "AJDLj6J9nXGC8nvyinFBHbJdEwBh5kZMnzvlvBUhjas9Mf1IzgBa5B9d6wEaWR4_vDbvrL_tKkZzX_EZOuE-o6YX8u5Z4TTSeg",
        "expires_in": 3599,
        "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImJiZDJhYzdjNGM1ZWI4YWRjOGVlZmZiYzhmNWEyZGQ2Y2Y3NTQ1ZTQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMzgwMjQwNjg3NzY5LXQ1Z3NiYzd1cHNjODJmZHNpaGxsNnN2cGsxNnN1amtnLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMzgwMjQwNjg3NzY5LXQ1Z3NiYzd1cHNjODJmZHNpaGxsNnN2cGsxNnN1amtnLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTA3NjE5NTQ0NDg0Nzk0OTQ5OTI2IiwiZW1haWwiOiJha2h0YXIuc3llZHplZXNoYW5AZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJQSDlLdG1aT1BrYkNqc0lrNTQwdUNnIiwibmFtZSI6IlN5ZWQgWmVlc2hhbiBBa2h0YXIiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EtL0FPaDE0R2laeW5SM3JaLXlnMlhLR0tfaS0tdXhWM0JjaDJUUHlZZFJTb29vPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IlN5ZWQgWmVlc2hhbiIsImZhbWlseV9uYW1lIjoiQWtodGFyIiwibG9jYWxlIjoiZW4iLCJpYXQiOjE2MzQ4OTYwODYsImV4cCI6MTYzNDg5OTY4NiwianRpIjoiZGU5NDNkODNkOTk3OTg4MGM5ZDEyNTk0MzY5NTg4ZmQwYjVkZDViYyJ9.k87QpwEb_-ThOKmeC_WIe5mZS6XyyGunMpM4R3_c6UJA-Lk6oeUYH_F5wugwcrdOqTEbmoLjCcWLroKx0kkqxcni3AeqsRFeP-EKHWeo_5HpFWFL3g29BXYcCcA13_IIgJGhDinJI9L-Z5IR5yiOlvWpmNeKtxiIhJrKeUBI4lM-TChjLrwSyBiJeKYnOYNq2jniMyMDt8TJNPVGWGo695aCwtUYi2y742YxLw9w9ldivRG4zsQ-yo_e3MxY1Pl-KhdVypup4wUgNLfWCdZtcZg9kBUjpmnfTJ8lQZCKVYc7yPuzDsdGgG_fTflEWd0msvzrqi-ZKQwr-ZAG4x33RA",
        "session_state": {
            "extraQueryParams": {
                "authuser": "0"
            }
        },
        "first_issued_at": 1634896086564,
        "expires_at": 1634899685564,
        "idpId": "google",


        "refresh_token": 'ya29.a0ARrdaM_ymPu-HIZ2kPIwQvDFd2fILh0wlthv52W9ptm611LdWkARR8H3E9Nq5qpyyX67r_KwYsPpJT5mJyVwFVhAdJuCJ0txiyJT9HuUnXLUEa5JK_OfxIHbDijzMhiYvRmlRtJt1mtPqL-M7fl85YLQkPNK',
        "code": "4/0AX4XfWiIpDqZDo_3UgFm6sTL5AuWRRxNd0jcxMc8p9rZOhxQuNZUijREH5HrI4yxLF7G3Q",
        "client_secret": 'F56L14ZUTbykHAdTTSiAPBUb',
        "grant_type": "authorization_code"
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
        idToken: token.response.id_token,
        audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    console.log('ticket: ', ticket);

    oAuth2Client.setCredentials(token.response);
    // oAuth2Client.setCredentials({
    //     access_token: token.response.access_token,
    //     refresh_token: '4/0AX4XfWgrxymEqB8qeeD6m8LTuoAqpYf6K7J-kHH7XPNH9l8uYjBqpSz2EGrHzsOkg1ouoA',
    //     client_secret: 'F56L14ZUTbykHAdTTSiAPBUb',
    //     expiry_date: true
    // });

    // after acquiring an oAuth2Client...
    const tokenInfo = await oAuth2Client.getTokenInfo(token.response.access_token);
    // take a look at the scopes originally provisioned for the access token
    console.log('tokenInfo: ', tokenInfo);

    try {
        let refreshResult = await oAuth2Client.refreshAccessToken();
        console.log(refreshResult);
    }
    catch (e) {
        console.log(e);
    }

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
