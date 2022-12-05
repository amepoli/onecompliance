const AWS = require('aws-sdk');
AWS.config.update({region: 'eu-central-1'});
const AmazonDaxClient = require('amazon-dax-client');
const dax = DAX_ENABLED? new AmazonDaxClient({ region: 'eu-central-1',endpoint: 'daxs://DAX_ENDPOINT' }): null;
const dynamo = new AWS.DynamoDB.DocumentClient({ service: DAX_ENABLED? dax: null });

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const helperFuncts = require('./helperFuncts');

function getMenuWithPermissions(menu, permissions) {
    let filteredMenu;
    let id = menu.id; 
    let allowed = false;
    // console.log('Menu: ', menu, ' Permissions: ', permissions);
    if (permissions.allow.indexOf(id) !== -1) { // allowed 
        allowed = true;
    } else if (permissions.allow[0] === '*') { // check denied 
        allowed = (permissions.deny.indexOf(id) === -1 && permissions.deny[0] !== '*');
    } else {
        allowed = false;
    }
    if (allowed) {
        filteredMenu = {id: id};
        // process children if any
        if (menu.children != null) {
            filteredMenu['children'] = [];
            menu.children.forEach(child => { // add them recursively
                let submenu = getMenuWithPermissions(child, permissions);
                 if (submenu != null) {
                    filteredMenu.children.push(submenu);
                 }
            });
        }
         // add remaining menu items 
        if (menu.icon != null) {
            filteredMenu['icon'] = menu.icon;
        }
        if (menu.title != null) {
            filteredMenu['title'] = menu.title;
        }
        if (menu.translate != null) {
            filteredMenu['translate'] = menu.translate;
        }
        if (menu.type != null) {
            filteredMenu['type'] = menu.type;
        }
        if (menu.url != null) {
            filteredMenu['url'] = menu.url;
        }
    }
    return filteredMenu;
}

async function performDynamoDBMergedProfileUpdate(event) {
    let result = [];

    for(const record of event['Records']) {
        const profile = record['dynamodb']['Keys']['name']['S'];
        console.log('Checking for profile: ', profile);
        const profileData = await helperFuncts.refreshMergedProfileData(dynamo, 'PROFILES_NAME', 'MERGED_PROFILESNAME', profile);
        if(profileData) {
            result.push('Refresh profile succeded for : ' + profile);
        }
        else {
            result.push('Refresh profile failure for : ' + profile);
        }
    }
    
    console.log('Trigger succeeded with: ', JSON.stringify(result));
    return {result: 'OK', result: result };
}

async function performS3UploadToDynamo(event) {
    
    let s3Record = event['S3Record'];
    let key = s3Record['Key'];
    let table = s3Record['Table'];
    let keyParts = key.split('/');
    let fileName = keyParts[keyParts.length-1].split('.json')[0];
    const s3ParamsGetList = {
        Bucket: 'gorico2.dynamodb',
        Key: key
    };

    const object = await s3.getObject(s3ParamsGetList).promise();
    console.log('Body: ', object.Body.toString());
                        
    //Save new merged_profile
    const DynamoParams = {
        TableName: table,
        Item: JSON.parse(object.Body.toString())
    };

    console.log('Saving to dynamo db with these params: ', DynamoParams);
    const result = await dynamo.put(DynamoParams).promise();

    return {result: 'OK', result: result };
}

exports.handler = async (event, context) => {
    
    let body = {};

    console.log('Event:', JSON.stringify(event));
    if(Object.keys(event).includes('Records')) {
        body = await performDynamoDBMergedProfileUpdate(event);
    }
    else if(Object.keys(event).includes('S3Record')) {
        body = await performS3UploadToDynamo(event);
    }
    else {
        const queryParams = event.queryStringParameters;

        const codice_azienda = JSON.parse(queryParams['keys']).codice_azienda;

        const method = event.httpMethod;
        
        // quite a tricky method to retrieve the Cognito sub ID , would be maybe better to map it in API GW template
        // see https://forums.aws.amazon.com/thread.jspa?threadID=236366 
        const userid = event.requestContext.identity.cognitoAuthenticationProvider.split(':')[2];
        // const userid = '4e7e947c-7810-4e30-b6ca-a1579f9ccfd6';  // test only 
        
        console.log('queryParams: ', queryParams, ' userid: ', userid, ' codice_azienda: ', codice_azienda);

        const profile = await helperFuncts.getProfile(dynamo, 'USERS_NAME', userid, codice_azienda);
        
        if (profile != null) {
            const profileData = await helperFuncts.getProfileData(dynamo, 'PROFILES_NAME', 'MERGED_PROFILESNAME', profile);
            if (profileData != null) {
                var menuParams = {
                    TableName: 'NAVIGATION_NAME',
                    Key: {
                        name: 'gorico'
                    }
                };
                let menu = await dynamo.get(menuParams).promise();
                menu = getMenuWithPermissions(menu.Item.menu, profileData.menu);
                body = {result: 'OK', menu: menu };
            } else {
                body = {result: 'KO', reason:'Cannot find user\'s profile'};
            }
        } else {
            body = {result: 'KO', reason:'Cannot find the user'};
        }
    }
    
    
    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify(body)
    };
};