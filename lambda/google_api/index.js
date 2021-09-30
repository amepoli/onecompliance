const helperFuncts = require('./helperFuncts');

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