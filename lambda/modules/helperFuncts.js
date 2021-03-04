var functions = {
    setGlobalVariables: _setGlobalVariables,
    getCodicePart: _getCodicePart
};

module.exports = functions;

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
            };
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
