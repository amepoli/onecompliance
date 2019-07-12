const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-central-1' });
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {

    const queryParams = event.queryStringParameters;

    const DynamoParams = {
        TableName: 'views',
        Key: {
            entryKey: queryParams['entry_name']
        }
    };

    var data;

    try {

        data = await dynamo.get(DynamoParams).promise();

    } catch (e) {
        console.log(e);
        return {
            statusCode: 400
        }
    }


    return {
        statusCode: 200,
        body: JSON.stringify(data)
    };
};