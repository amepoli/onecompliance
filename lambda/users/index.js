const AWS = require('aws-sdk');
AWS.config.update({region: 'eu-central-1'});
const dynamo = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

async function getCompanies(data) {
    var companies = [];

    data.companies.forEach(company => {
        companies = companies.concat(company.name);
        companies = [...new Set(companies)]; // remove duplicates

    });
    return companies;
}

exports.handler = async (event, context) => {
    
    const queryParams = event.queryStringParameters;

    const method = event.httpMethod;
    
    // quite a tricky method to retrieve the Cognito sub ID , would be maybe better to map it in API GW template
    // see https://forums.aws.amazon.com/thread.jspa?threadID=236366 
    const userid = event.requestContext.identity.cognitoAuthenticationProvider.split(':')[2];

    console.log(userid);

    var DynamoParams = {
    TableName: 'USERS_NAME',
    Key: {
        userid: userid
      }
    };

    let body;

    try {
        var data = await dynamo.get(DynamoParams).promise();
        if (data != null) {
            data = data.Item;
            const companies = await getCompanies(data); 
            const s3ParamsGetList = { 
                Bucket: 'BUCKET_NAME',
                Key: data.picture
            };
            var url = s3.getSignedUrl('getObject', s3ParamsGetList);
            data = {username: data.username, name: data.name, lastname: data.lastname, picture: url, language: data.language, sync: data.sync || null, companies: companies };
            body = {result: 'OK', userdata: data}; 
        } else {
            body = {result: 'KO', reason:'Cannot find the user'};
        }
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