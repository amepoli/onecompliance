const AWS = require('aws-sdk');
AWS.config.update({region: 'eu-central-1'});
const dynamo = new AWS.DynamoDB.DocumentClient();


exports.handler = async (event, context) => {
    
    const queryParams = event.queryStringParameters;

    const lang = queryParams['lang'];

    const method = event.httpMethod;
    
    // quite a tricky method to retrieve the Cognito sub ID , would be maybe better to map it in API GW template
    // see https://forums.aws.amazon.com/thread.jspa?threadID=236366 
    const userid = event.requestContext.identity.cognitoAuthenticationProvider.split(':')[2];
    //const userid = '4e7e947c-7810-4e30-b6ca-a1579f9ccfd6';  // test only 
    
    console.log('userid: ', userid, ' language: ', lang);

    var langParams = {
        TableName: 'translation',
        Key: {
            lang: lang
        }
    };

    let body = {};

    try {
        var data = await dynamo.get(langParams).promise();
        body = data.Item;
    } catch (e) {
       console.log(e);
       body = { result: 'KO', reason: 'Database error'};
    }
    
    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify(body)
    };
};