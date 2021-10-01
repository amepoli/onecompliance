const https = require('https');
const helperFuncts = require('./helperFuncts');
const googleAPI = 'GOOGLE_API_KEY';

exports.handler = async (event, context) => {

    console.log(event);

    const queryParams = event.queryStringParameters ? event.queryStringParameters : event;

    const method = event.httpMethod;

    // quite a tricky method to retrieve the Cognito sub ID , would be maybe better to map it in API GW template
    // see https://forums.aws.amazon.com/thread.jspa?threadID=236366 
    const userid = event.requestContext ? event.requestContext.identity.cognitoAuthenticationProvider.split(':')[2] : null;

    console.log('userid: ', userid);

    console.log('queryParams: ', queryParams);

    // const DynamoParams = {
    //     TableName: 'VIEWS_NAME',
    //     Key: {
    //         entryKey: queryParams['entry_name']
    //     }
    // };

    const company = queryParams['company'] ? queryParams['company'] : null;

    let body = null;

    console.log('queryParams', queryParams);

    const requestType = queryParams['request_type'];
    const directionsParams = queryParams['directions'];

    // If no Request type provided, exit with an error
    if (!requestType) {
        return {
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "statusCode": 500,
            "error": "Bad URL"
        };
    }
    else {
        console.log('Lets start ' + requestType);

        try {
            if (requestType === 'GetDirections') {
                // Get directions
                const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${directionsParams['origin']}&destination=${directionsParams['destination']}?key=${googleAPI}`;
                console.log('url: ', url);
                const req = await https.get(url);
                console.log(req);

                body = { result: 'OK', result: { name: 'Unknown Path' } };
            }
            else {
                body = { result: 'KO', reason: 'Unknown request type: ' + requestType };
            }

        } catch (e) {
            console.log(e);
            body = { result: 'KO', reason: 'Server error' };
        }

        return {
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "statusCode": 200,
            "body": JSON.stringify(body)
        };
    }
};