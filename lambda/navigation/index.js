const AWS = require('aws-sdk');
AWS.config.update({region: 'eu-central-1'});
const AmazonDaxClient = require('amazon-dax-client');
const dax = new AmazonDaxClient({ region: 'eu-central-1',endpoint: 'daxs://DAX_ENDPOINT' });
const dynamo = new AWS.DynamoDB.DocumentClient({ service: DAX_ENABLED? dax: null });


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

function performMergedProfileUpdate(records) {

}

exports.handler = async (event, context) => {
    
    let body = {};

    console.log('Event:', JSON.stringify(event));
    if(Object.keys(event).includes('Records')) {
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

        body = {result: 'OK', result: result };
        
        console.log('Trigger succeeded with: ', JSON.stringify(result));

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