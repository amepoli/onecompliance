const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-central-1' });
const dynamo = new AWS.DynamoDB.DocumentClient();

const helperFuncts = require('./helperFuncts');

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

        profile = await helperFuncts.overrideTable('PROFILES_NAME', permissions.Item, dynamo);

        profile = await helperFuncts.includeTable('PROFILES_NAME', profile, dynamo);
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

function getProfileHideActions(entry_name, profileData) {
    let profileHideActions = [];
    if (profileData != null && profileData.tables.form_actions != null) {
        let formActions = profileData.tables.form_actions;
        let entryFormActions = formActions.filter(x => x.entry == entry_name);
        if (entryFormActions != null && entryFormActions.length > 0) {
            entryFormActions = entryFormActions[0];
            if (entryFormActions.hide) {
                profileHideActions = entryFormActions.hide;
            }
        }
    }
    return profileHideActions;
}

function getExternalSource(entry_name, profileData) {
    let externalSource;
    if (profileData != null && profileData.tables.externalSources != null) {
        let externalSources = profileData.tables.externalSources;
        externalSource = externalSources.find(x => x.entry == entry_name);
        if (externalSource != null) {
            externalSource = externalSource.source;
        }
    }
    return externalSource;
}

function replaceJSONParams(JSONString, paramsObject) {
    if (paramsObject == null) {
        return JSONString
    } 

    JSONString = JSON.stringify(JSONString);

    for (const param in paramsObject) {
        if (Object.hasOwnProperty.call(paramsObject, param)) {
            const value = paramsObject[param];
            let toReplace = new RegExp("\\\$P\\\{" + param + "\\\}", "g");
            JSONString = JSONString.replace(toReplace, value);
            toReplace = new RegExp("\\\"\\\$Q\\\{" + param + "\\\}\\\"", "g");
            JSONString = JSONString.replace(toReplace, value);
        }
    }

    JSONString = JSON.parse(JSONString);

    return JSONString;
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

    var externalUpdate;

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

        data = await helperFuncts.overrideTable('VIEWS_NAME', data.Item, dynamo);

        data = replaceJSONParams(data,data.define)

        data = processPermissions(data, profile, entry_name);
        data['profileHideActions'] = getProfileHideActions(entry_name, profile);
        externalUpdate = getExternalSource(entry_name, profile);

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
        "body": JSON.stringify({ result: 'OK', data: data, externalUpdate: externalUpdate })
    };
};