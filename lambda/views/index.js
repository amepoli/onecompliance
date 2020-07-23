const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-central-1' });
const dynamo = new AWS.DynamoDB.DocumentClient();

async function getProfile(userid, company) {

    var userParams = {
        TableName: 'USERS_NAME',
        Key: {
            userid: userid
        }
    };

    var profile;

    var data = await dynamo.get(userParams).promise();
    data = data.Item;
    if (data != null) {
        let companies = data.companies;
        if (company != null) {
            companies.forEach(c => {
                if (c.name === company) { // found user's profile
                    profile = c.profile;
                }
            });
        }
    }

    if (profile != null) {
        var profileParams = {
            TableName: 'PROFILES_NAME',
            Key: {
                name: profile
            }
        };
        let permissions = await dynamo.get(profileParams).promise();
        profile = permissions.Item;
    }

    return profile;
}

function processPermissions(data, profile, entry_name) {

    if (profile.tables != null && profile.tables.table_keys != null) {
        const permissions = profile.tables.table_keys.find(key => key.entry === entry_name);
        if (permissions != null && permissions.hide != null) {
            permissions.hide.forEach(hiddenKey => {
                const key = data.table_keys.find(key => key.key === hiddenKey);
                if (key != null) {
                    key.isHidden = true;  // hide it!
                }
            })
        }
    }
    if (profile.tables != null && profile.tables.form_keys != null) {
        const permissions = profile.tables.form_keys.find(key => key.entry === entry_name);
        if (permissions != null && permissions.hide != null) {
            permissions.hide.forEach(hiddenKey => {
                const key = data.form_keys.find(key => key.key === hiddenKey);
                if (key != null) {
                    key.isHidden = true;  // hide it!
                }
            });
        }
        if (permissions != null && permissions.readOnly != null) {
            permissions.readOnly.forEach(roKey => {
                const key = data.form_keys.find(key => key.key === roKey);
                if (key != null) {
                    key.readOnly = true;  // make it read only!
                }
            });
        }
    }

    return data;
}

exports.handler = async (event, context) => {

    const queryParams = event.queryStringParameters;

    const keys = JSON.parse(queryParams['keys']);

    const entry_name = queryParams['entry_name'];

    const company = queryParams['company'];

    // quite a tricky method to retrieve the Cognito sub ID , would be maybe better to map it in API GW template
    // see https://forums.aws.amazon.com/thread.jspa?threadID=236366 
    const userid = event.requestContext.identity.cognitoAuthenticationProvider.split(':')[2];

    const DynamoParams = {
        TableName: 'VIEWS_NAME',
        Key: {
            entryKey: entry_name
        }
    };

    var data;

    try {

        const profile = await getProfile(userid, company);

        if (profile == null) {
            return {
                "isBase64Encoded": false,
                "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                "statusCode": 200,
                "body": JSON.stringify({ result: 'KO', reason: 'Error, is user authorized?' })
            };
        }

        data = await dynamo.get(DynamoParams).promise();

        data = processPermissions(data.Item, profile, entry_name);

    } catch (e) {
        console.log(e);
        return {
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "statusCode": 200,
            "body": JSON.stringify({ result: 'KO', reason: 'Error with the DB', error: e })
        };
    }


    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify({ result: 'OK', data: data })
    };
};