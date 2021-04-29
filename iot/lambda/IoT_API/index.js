exports.handler = async (event, context) => {

    const queryParams = event.queryStringParameters;
    const path = event.rawPath;
    
    console.log(queryParams, path);

    let response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    
    if (path.slice(0, 7) === '/plants') {
        response.body = JSON.stringify({plants: [{id: 1, name: 'Casa Capovilla'}]});
    } else if (path.slice(0, 7) === '/plant/') {
        let elements = path.split('/');
        let plant_id = elements[1];
        if (plant_id === 1 && elements[2] === 'devices') {   // just one plant by now, get hard coded device list 
            response.body = JSON.stringify({devices: [{id: 1, value: 'co2'}, {id: 2, value: 'power'}]});
        } else if (plant_id === 1 && elements[2] === 'device') {
            let device_id = elements[3];
            var params = {
                KeyConditionExpression: 'device_id = :did',
                ExpressionAttributeValues: {
                    ':did': {'S': ' '}
                },
                TableName: 'IoT_data'
            };
            params.ExpressionAttributeValues[':did'].S = device_id === 1 ? 'co2' : 'power';
            let result = await dynamodb.query(params).promise();
            response.body = JSON.stringify(result);
        }
    }
    return response;
};