const AWS = require('aws-sdk');
AWS.config.update({region: 'eu-central-1'});
const dynamo = new AWS.DynamoDB.DocumentClient();
const Pool = require('pg-pool');
const pool = new Pool({
    host: 'goricotest-new.caxbbckt9xen.eu-central-1.rds.amazonaws.com',
    database: 'Gorico',
    user: 'postgres',
    password: 'et2themax',
    port: 5432,
    max: 1,
    min: 0,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 1000
});

function getMenuWithPermissions(menu, permissions) {
    let filteredMenu;
    let id = menu.id; 
    let allowed = false;
    // console.log('Menu: ', menu, ' Permissions: ', permissions);
    if (permissions.allow.indexOf(id) !== -1) { // allowed 
        allowed = true;
    } else if (permissions.allow[0] === '*') { // check denied 
        allowed = (permissions.deny.indexOf(id) === -1);
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
                 if (submenu !== null) {
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

exports.handler = async (event, context) => {
    
    const queryParams = event.queryStringParameters;

    const codice_azienda = queryParams.keys.codice_azienda;

    const method = event.httpMethod;
    
    // quite a tricky method to retrieve the Cognito sub ID , would be maybe better to map it in API GW template
    // see https://forums.aws.amazon.com/thread.jspa?threadID=236366 
    const userid = event.requestContext.identity.cognitoAuthenticationProvider.split(':')[2];
    // const userid = '4e7e947c-7810-4e30-b6ca-a1579f9ccfd6';  // test only 
    
    console.log(userid);

    var userParams = {
        TableName: 'users',
        Key: {
            userid: userid
        }
    };

    var menuParams = {
        TableName: 'navigation',
        Key: {
            name: 'gorico'
        }
    };

    var profileParams = {
        TableName: 'profiles',
        Key: {
            name: 'dummy'
        }
    };

    let body = {};

    let profile;

    try {
        var data = await dynamo.get(userParams).promise();
        data = data.Item;
        if (data != null) {
            data = data.Item;
            let profiles = data.profiles;
            if (codice_azienda != null) {
                profiles.forEach(p => {
                    if (p.companies.indexOf(codice_azienda) !== -1) { // found user's profile
                        profile = p.entry;
                    }
                });
            }
        } else {
            body = {result: 'KO', reason:'Cannot find the user'};
        }
        if (profile != null) {
            profileParams.Key.name = profile;
            let permissions = await dynamo.get(profileParams).promise();
            permissions = permissions.Item;
            if (permissions != null) {
                let menu = await dynamo.get(menuParams).promise();
                menu = getMenuWithPermissions(menu.Item.menu, permissions.menu);
                body = {result: 'OK', menu: menu };
            }
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