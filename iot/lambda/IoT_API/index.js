const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-central-1' });
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {

    const queryParams = event.queryStringParameters;
    const path = event.path;
    
    console.log(queryParams, path);

    let response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambdas!'),
    };
    
    if (path.slice(4, 11) === '/plants') {
        response.body = JSON.stringify({plants: [{id: 1, name: 'Casa Capovilla'}]});
    } else if (path.slice(4, 11) === '/plant/') {
        let elements = path.split('/');
        let plant_id = elements[3];
        console.log(plant_id);
        if (plant_id === '1' && elements[4] === 'devices') {   // just one plant by now, get hard coded device list 
            response.body = JSON.stringify({devices: [{id: 1, value: 'co2'}, {id: 2, value: 'power'}]});
        } else if (plant_id === '1' && elements[4] === 'device') {
            let device_id = elements[5];
            var params = {
                KeyConditionExpression: '#device_id = :did',
                ExpressionAttributeNames: {
                    '#device_id': 'device_id'
                },
                ExpressionAttributeValues: {
                    ':did': device_id
                },
                TableName: 'IoT_data'
            };
            params.ExpressionAttributeValues[':did'] = device_id === '1' ? 'co2' : 'power';
            let result = await dynamo.query(params).promise();
            response.body = JSON.stringify(result);
        }
    }
    return response;
};