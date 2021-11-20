var functions = {
    setGlobalVariables: _setGlobalVariables,
    getCodicePart: _getCodicePart,
    overrideTable: _overrideTable,
    includeTable: _includeTable
};

module.exports = functions;

var mergeWith = require('lodash.mergewith');

async function _setGlobalVariables (company, client, userid, dynamo) {

    var global_variables = {};

    global_variables.global_codice_azienda = company;

    global_variables.global_codice_part = await _getCodicePart(company, client);

    var userParams = {
        TableName: 'USERS_NAME',
        Key: {
            userid: userid
        }
    };

    var data = await dynamo.get(userParams).promise();
    data = data.Item;

    if (data != null) {
        global_variables.global_username = data.username;
        let companies = data.companies;
        if (company != null) {
            var global_user_companies = '';
            var global_id_anagrafiche = '';
            for (let i = 0; i < companies.length; i++) {
                let c = companies[i];
                if (global_user_companies !== '') {
                    global_user_companies += ',';
                    global_id_anagrafiche += ',';
                }
                global_user_companies += '\'' + c.name + '\'';
                var codice_part = await _getCodicePart(c.name, client);
                global_id_anagrafiche += '\'' + codice_part + '-' + c.id_anagrafica + '\'';
                if (c.name === company) { // found user's profile
                    global_variables.global_userid = c.id_anagrafica;
                    global_variables.global_profile = c.profile;
                }
            }
            global_variables.global_user_companies = global_user_companies;
            global_variables.global_id_anagrafiche = global_id_anagrafiche;
        }
    }

    console.log("Global vars: ", global_variables);

    return global_variables;

}

async function _getCodicePart (company, client) {

    if (company == null) {
        return null;
    }
    const queryString = "SELECT codice_part FROM entrasp.aziende WHERE codice_azienda='" + company + "';";
    const response = await client.query(queryString);
    if (response != null && response.rows != null && response.rows[0] != null) {
        return response.rows[0].codice_part;
    } else {
        return null;
    }
}

async function _overrideTable(dynamoTable,son,dynamo) {

    if (son.inheritsFrom == null) {
        return son;
    }

    const DynamoParams = {
        TableName: dynamoTable,
        Key: {
            entryKey: son.inheritsFrom
        }
    };

    var father = await dynamo.get(DynamoParams).promise();

    father = father.Item;
    if (father == null) {
        return son;
    }

    if (father.inheritsFrom != null) {
        father = await overrideTable(father);
    }

    for (const field in son) {
        if (son.hasOwnProperty(field) && field != "inheritsFrom" && field != "$schema") {
            father[field] = son[field];
        }
    }
    return father;
}

function customizer(objValue, srcValue) {
    if (Array.isArray(objValue)) {
      return objValue.concat(srcValue);
    }
  }

async function _includeTable(dynamoTable,jsonEntry,dynamo) {
    
    if (jsonEntry.include == null || !Array.isArray(jsonEntry.include)) {
        return jsonEntry;
    }

    var includes = jsonEntry.include;

    for (let index = 0; index < includes.length; index++) {
        const include = includes[index];
        const DynamoParams = {
            TableName: dynamoTable,
            Key: {
                entryKey: include
            }
        };
        var included = await dynamo.get(DynamoParams).promise();
        included = included.Item;
        if (included == null) {
            continue;
        }
        var merging = await _includeTable(dynamoTable,included);

        for (const field in merging) {
            if (Object.hasOwnProperty.call(merging, field)) {
                if (jsonEntry[field] == null) {
                    jsonEntry[field] = merging[field];
                } 
                else if (Array.isArray(jsonEntry[field]) && Array.isArray(merging[field])) {
                    jsonEntry[field] = jsonEntry[field].concat(merging[field]);
                } 
                else if (Object.isObject(jsonEntry[field]) && Object.isObject(merging[field])) {
                    mergeWith(jsonEntry[field], merging[field],customizer);
                } 
                else {
                    
                }
            }
        }
    }    

    return jsonEntry;

}