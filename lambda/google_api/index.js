const https = require('https');
const helperFuncts = require('./helperFuncts');
const googleAPI = 'GOOGLE_API_KEY';
const { Client } = require("@googlemaps/google-maps-services-js");
const client = new Client({});

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
    const response = await client.directions(params);
    console.log(JSON.stringify(response.data));
    if (response.data.status == 'OK') {
        return { result: 'OK', result: response.data };
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
    const response = await client.distancematrix(params);
    console.log(JSON.stringify(response.data));
    if (response.data.status == 'OK') {
        return { result: 'OK', result: response.data };
    }
    else {
        return { result: 'KO', reason: response.data };
    }
}

// Get Email Threads
async function getEmailThreads(queryParams) {
    // // Get directions
    // const url = `https://gmail.googleapis.com/gmail/v1/users/${queryParams['email']}/threads`;
    // console.log('url: ', url);
    // // const req = await requestPromise({ url, method: 'GET' })
    // const response = await axios.get(url);
    // console.log(response.data);

    return { result: 'KO', reason: 'GetEmailThreads request not implemented yet!' };
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