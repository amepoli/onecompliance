const excel = require('node-excel-export');

const AWS = require('aws-sdk');
AWS.config.update({ region: 'REGION' });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
const helperFuncts = require('./helperFuncts');

const bucket = 'BUCKET_NAME';
const region = 'REGION';
// const accessKey = 'ACCESS_KEY';
// const secret = 'SECRET_KEY';

const schema = 'SCHEMA';

const dynamo = new AWS.DynamoDB.DocumentClient();

const Pool = require('pg-pool');
const pool = new Pool({
    host: 'HOST_NAME',
    database: 'DB_NAME',
    user: 'USER_NAME',
    password: 'PASSWORD',
    port: 5432,
    max: 1,
    min: 0,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 1000
});

var global_variables = {};

function getDateFormat() {
    var d = new Date();
    var month = d.getMonth() + 1;
    return d.getFullYear() + '-' + month.toString() + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
}

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
    return profile;
}

async function getProfileData(profile) {

    var profileParams = {
        TableName: 'PROFILES_NAME',
        Key: {
            name: profile
        }
    };
    let data = await dynamo.get(profileParams).promise();
    return data.Item;
}


function isAuthorized(entry_name, profileData) {

    if (profileData != null && profileData.tables != null) {
        let permissions = profileData.tables;
        if (permissions.allow.indexOf(entry_name) !== -1) { // allowed 
            allowed = true;
        } else if (permissions.allow[0] === '*') { // check denied 
            allowed = (permissions.deny.indexOf(entry_name) === -1 && permissions.deny[0] !== '*');
        } else {
            allowed = false;
        }
    }
    return allowed;
}

function isReadOnly(entry_name, profileData) {

    let readonly = false;
    if (profileData != null && profileData.tables != null && profileData.tables.readOnly != null) {
        let permissions = profileData.tables.readOnly;
        if (permissions.indexOf(entry_name) !== -1) { // readOnly 
            readonly = true;
        }
    }
    return readonly;
}


function getComboFuncts(comboQueries, entry_keys, table_keys, keyTypes) {
    for (let index = 0; index < entry_keys.length; index++) {
        let element = entry_keys[index];
        if (element.format.viewType === 'combobox' || element.format.viewType === 'radiobutton' || element.format.viewType === 'checkboxgroup') {
            let comboQuery = element.format.comboQuery;
            if (comboQuery != null) {
                comboQuery = replaceKeys(comboQuery, table_keys, keyTypes);
                comboQueries.push({ key: element.key, comboQuery: comboQuery });
            }
        } else if (element.format.viewType === 'subform') {
            getComboFuncts(comboQueries, element.format.subform_keys, table_keys, keyTypes);
        }
    }
}

function addQueryCond(queryString, queryCond) {
    let result = queryString;

    if (result == null) {
        return null;
    }

    if (queryCond != null) {
        // remove ';'
        result = result.split(';')[0];
        result = result + queryCond + ';';
    }

    return result;
}

function getAdditionalQueryCond(entry_name, profileData) {

    var queryConds = [];

    if (profileData != null && profileData.tables != null && profileData.tables.queryCond != null) {
        let queryCond = profileData.tables.queryCond;
        queryConds = queryCond.filter(cond => cond.entry === entry_name);
    }

    return queryConds;
}

// build the Postgresql query from parameters
function getTableQuery(entry_params, table_keys, full_keys_set, isForm, search_keys, additionalQueryConds) {

    let comboQueries = [];

    let preProcessQueries = [];

    let postProcessQueries = [];

    let orderBy;

    let additionalQueryCond;

    let entry_keys;

    //console.log("Additional QUERY conds: ", additionalQueryConds);
    if (additionalQueryConds != null) {
        if (isForm && additionalQueryConds != null) {
            entry_keys = entry_params.form_keys;
            additionalQueryCond = additionalQueryConds.find(cond => cond.viewType === 'form');
        } else {
            entry_keys = entry_params.table_keys;
            additionalQueryCond = additionalQueryConds.find(cond => cond.viewType === 'table');
        }

        if (additionalQueryCond != null) {
            additionalQueryCond = " AND " + additionalQueryCond.queryString + ";";
        }
    }

    orderBy = entry_params.orderBy;

    if (!entry_keys) return '';

    let keyTypes = getKeyTypes(entry_keys);

    if (isForm) { // check if we have comboboxes, then save query fields for later processing
        getComboFuncts(comboQueries, entry_keys, full_keys_set, keyTypes);
    }

    // process pre-defined queries for table/form view, if any

    let searchQuery;
    if (entry_params.predefinedQueries) {
        let mainQuery;
        entry_params.predefinedQueries.forEach(query => {
            if ((isForm && query.operation === "selectForm") || (!isForm && query.operation === "selectTable")) {
                if (query.type === "main" && search_keys == null) {
                    mainQuery = replaceKeys(addQueryCond(query.queryString, additionalQueryCond), full_keys_set, keyTypes); // only one main query allowed
                } else if (query.type === "main" && search_keys != null) {
                    searchQuery = replaceKeys(query.queryString, table_keys, keyTypes); // only one main query allowed
                } else if (query.type === "preProcessing") {
                    preProcessQueries.push(replaceKeys(addQueryCond(query.queryString, additionalQueryCond), full_keys_set, keyTypes));
                } else if (query.type === "postProcessing") {
                    postProcessQueries.push(replaceKeys(addQueryCond(query.queryString, additionalQueryCond), full_keys_set, keyTypes));
                }
            }
        });
        if (mainQuery) { // no need to further build main query, stop here
            return { mainQuery: mainQuery, comboQueries: comboQueries, preProcessQueries: preProcessQueries, postProcessQueries: postProcessQueries };

        }
    }

    let queryString, comma;
    let calculatedWhereCond = [];

    // automatic build of main query
    if (searchQuery == null) {
        queryString = 'SELECT ';
        comma = ''; // first entry has no comma 
        // keep track of calculated where conditions, query becomes subqueries. 
        // See https://stackoverflow.com/questions/47455962/using-function-result-in-where-clause-in-postgresql

        for (index = 0; index < entry_keys.length; index++) {
            let element = entry_keys[index];
            if (isForm && element.format.viewType === 'subform') {
                // append the keys at the end of the array (avoiding recursion, they will be processed later in the loop)
                element.format.subform_keys.forEach(subkey => {
                    if (element.sameOrigin != null) {
                        subkey['sameOrigin'] = element.sameOrigin;
                    }
                    entry_keys.push(subkey);
                });
            }
            if (!element.key || (element.sameOrigin != null && !element.sameOrigin && element.queryFunct == null) || element.format.viewType === 'subform') {  // no table key or the key is from another table
                continue;
            }

            let fieldString = comma + element.key;
            if (element.hasOwnProperty('queryFunct')) { // overridden by funct
                fieldString = comma + '(' + replaceKeys(element.queryFunct, full_keys_set, keyTypes) + ') AS ' + element.key;
            }
            comma = ','; // needed only the first time
            queryString = queryString + fieldString;

        };

        if (entry_params.origin) {
            queryString = queryString + ' FROM ' + entry_params.origin;
        } else {  // no underlying table, skip building of main query, still there might be some combos
            return { mainQuery: null, comboQueries: comboQueries, preProcessQueries: preProcessQueries, postProcessQueries: postProcessQueries };
        }

        comma = ' WHERE ';

        for (const key in table_keys) {
            if (table_keys.hasOwnProperty(key)) {
                let keyType = keyTypes.find(e => (e.key === key));
                // it might happen with subtables that a key linked with parent table has not the same origin
                if (keyType.sameOrigin != null && !keyType.sameOrigin) {
                    continue;
                }
                let delimiter = isDataTypeString(keyType) ? '\'' : '';
                let element = table_keys[key];
                // replace single quotes with double quotes in strings
                element = ((keyType.dataType === 'text' || keyType.viewType === 'textarea')) ? element.replace(/'/g, "''") : element;
                if (keyType.isCalculated) { // delay and make it part of the query above
                    calculatedWhereCond.push({ key: key, value: element, delimiter: delimiter })
                } else {
                    let fieldString = comma + key + '=' + delimiter + element + delimiter;
                    queryString = queryString + fieldString;
                    comma = ' AND '; // needed only the first time
                }
            }
        }
    } else {  //searchQuery
        if (searchQuery.slice(-1) === ';') {
            queryString = searchQuery.slice(0, -1);  // remove the final ';'
        } else {
            queryString = searchQuery;
        }
        comma = queryString.includes('where') || queryString.includes('WHERE') ? ' AND ' : ' WHERE ';
    }

    if (search_keys != null) {

        let search_params = entry_params.search_keys;
        let search_types = search_params.map(k => {
            let dataType = k.format.dataType ? k.format.dataType : '';
            return { key: k.fieldName, dataType: dataType };
        });

        console.log("Query so far: ", queryString);

        for (const key in search_keys) {
            if (search_keys.hasOwnProperty(key)) {
                let search_param = search_params.find(s => (s.fieldName === key));
                if (search_param != null && search_param.queryCond != null) {
                    let fieldString = replaceKeys(search_param.queryCond, search_keys, search_types);
                    queryString = queryString + comma + fieldString;
                    comma = ' AND '; // needed only the first time if no table_
                }
            }
        }
    }

    if (calculatedWhereCond.length) { // make query above
        queryString = 'SELECT * FROM (' + queryString + ') AS sub_query ';
        let comma = ' WHERE ';
        calculatedWhereCond.forEach(
            element => {
                queryString += comma + element.key + '=' + element.delimiter + element.value + element.delimiter;
                comma = ' AND ';
            });
    }

    // add order by if present (for table view only
    if (orderBy != null && orderBy.key != null) {
        let order = orderBy.order === 'descending' ? ' DESC' : ' ASC';
        queryString = queryString + ' ORDER BY ' + orderBy.key + order;
    }

    queryString = queryString + ';';

    queryString = replaceKeys(addQueryCond(queryString, additionalQueryCond), full_keys_set, keyTypes);

    return { mainQuery: queryString, comboQueries: comboQueries, preProcessQueries: preProcessQueries, postProcessQueries: postProcessQueries };

}

function getSearchCombos(entry_params, table_keys, isForm, comboQueries) {

    let entry_keys;

    if (isForm) {
        entry_keys = entry_params.form_keys;
    } else {
        entry_keys = entry_params.table_keys;
    }

    let keyTypes = getKeyTypes(entry_keys);

    let search_params = entry_params.search_keys;

    if (search_params == null) {
        return;
    }

    search_params.forEach(element => {
        // check if is combobox
        let comboQuery = element.format.comboQuery;
        if (comboQuery != null) {
            comboQuery = replaceKeys(comboQuery, table_keys, keyTypes);
            comboQueries.push({ key: element.fieldName, comboQuery: comboQuery });
        }
    });
}


function getAttributeFuncts(keys) {

    let attributeFuncts = [];
    keys.forEach(key => {
        if (key.key != null && key.attributeFuncts != null && key.attributeFuncts.length > 0) {
            key.attributeFuncts.forEach(attributeFunct => {
                attributeFuncts.push({ key: key.key, attributeFunct: attributeFunct });
            });
        } else if (key.format != null && key.format.viewType === 'subform' && key.format.subform_keys != null) {
            attributeFuncts = attributeFuncts.concat(getAttributeFuncts(key.format.subform_keys));
        }
    });
    return attributeFuncts;
}

async function processAttributeQueries(entry_params, keys, client) {

    let entry_keys = entry_params.form_keys;

    let keyTypes = getKeyTypes(entry_keys);

    let attributes = {};

    let attributeFunctArray = getAttributeFuncts(entry_keys);

    console.log('Attribute Array:  ', attributeFunctArray);

    for (let i = 0; i < attributeFunctArray.length; i++) {
        const attributeFunctEl = attributeFunctArray[i];
        const attributeFunct = attributeFunctEl.attributeFunct;
        const entry_key = attributeFunctEl.key;
        if (attributeFunct.queryString == null || attributeFunct.attributeType == null || (attributeFunct.attributeType === 'style' && attributeFunct.styleAttribute == null)) {
            continue;
        }
        for (let j = 0; j < keys.length; j++) {
            console.log('Attribute: ', attributeFunct.queryString, keys[j], keyTypes);
            const query = replaceKeys(attributeFunct.queryString, keys[j], keyTypes);
            console.log('Query attributes: ', query);
            let result = await client.query(query);
            result = result.rows[0];
            console.log('Query attributes result: ', result);
            if (result == null) {
                continue;
            }
            if (attributes[entry_key] == null) {
                attributes[entry_key] = {};
            }
            if (attributeFunct.attributeType === 'style') {
                if (attributes[entry_key]['style'] == null) {
                    attributes[entry_key]['style'] = {};
                }
                if (attributes[entry_key]['style'][attributeFunct.styleAttribute] == null) {
                    attributes[entry_key]['style'][attributeFunct.styleAttribute] = []; // push en empty array
                }
                attributes[entry_key]['style'][attributeFunct.styleAttribute].push(result.label); // query must return {label: value} 
            } else {
                if (attributes[entry_key][attributeFunct.attributeType] == null) {
                    attributes[entry_key][attributeFunct.attributeType] = [];
                }
                attributes[entry_key][attributeFunct.attributeType].push(result.label);
            }
        }
    }
    return attributes;
}

async function processPreMainPost(queryString, client, notFullTable, isGet) {

    let local_keys_pre = {}; // additional keys generated with pre-processing  
    let local_keys_post = {}; // additional keys generated with post-processing

    let queryData = [{}];

    console.log('queryString : ', queryString);

    if (queryString == null) {
        return queryData;
    }

    // pre-processing
    if (queryString.preProcessQueries != null && queryString.preProcessQueries.length) {
        for (let index = 0; index < queryString.preProcessQueries.length; index++) {
            let query = queryString.preProcessQueries[index];
            query = replaceLocalKeys(query, local_keys_pre);
            let result = await client.query(query);
            let rawResult = result;
            result = notFullTable ? result.rows[0] : result.rows;
            if (result != null) { // add resulting keys to the list of local keys if any
                local_keys_pre = Object.assign(local_keys_pre, result);
            }
            else {
                rawResult.fields.forEach(field => {
                    local_keys_pre[field.name] = null;
                });
            }
            console.log('Pre query : ', query, ' result : ', result, ' raw result: ', rawResult);
        }
    }

    // main query
    if (queryString.mainQuery != null && queryString.mainQuery !== '') {
        let query = replaceLocalKeys(queryString.mainQuery, local_keys_pre);
        queryData = await client.query(query);
        queryData = queryData.rows;
        console.log('Main query : ', query, ' result : ', queryData);
    }


    // post-processing, exclude table view
    if (queryString.postProcessQueries != null && queryString.postProcessQueries.length) { // post-processing 
        let haveMainData = queryData.length > 0;
        // let maxindex = haveMainData ? queryData.length : 1; 
        let maxindex = isGet ? queryData.length : 1; // run the queries once if is insert/update/delete, one per row if get
        for (let row_index = 0; row_index < maxindex; row_index++) {
            local_keys_post = haveMainData ? Object.assign(local_keys_pre, queryData[row_index]) : local_keys_post;
            for (let index = 0; index < queryString.postProcessQueries.length; index++) {
                let query = queryString.postProcessQueries[index];
                query = replaceLocalKeys(query, local_keys_post);
                let result = await client.query(query);
                let rawResult = result;
                result = notFullTable ? result.rows[0] : result.rows;
                if (result != null) { // add resulting keys to the list of local keys if any
                    local_keys_post = Object.assign(local_keys_post, result);
                    if (haveMainData) {
                        queryData[row_index] = Object.assign(queryData[row_index], result);
                    }
                } else {
                    rawResult.fields.forEach(field => {
                        local_keys_post[field.name] = null;
                        if (haveMainData) {
                            queryData[row_index][field.name] = null;
                        }
                    });
                }
                console.log('Post query : ', query, ' result : ', result, ' raw result: ', rawResult);
            }
        }
    }


    return queryData;
}

function getCalculatedParams(entry_params, keys, isForm) {

    let entry_keys;

    if (isForm) {
        entry_keys = entry_params.form_keys;
    } else {
        entry_keys = entry_params.table_keys;
    }

    if (!entry_keys) return keys;

    entry_keys.forEach(entry => {
        if (entry.hasOwnProperty('evalFunct')) {
            keys.forEach(keys_row => {
                const evalString = replaceLocalKeys(entry.evalFunct, keys_row);
                const evalValue = eval(evalString);
                keys_row[entry.key] = evalValue;
            });
        }
    });

    return keys;
}

async function process_properties(entry_params, table_keys, isFormRecord, client) {

    var tableProperties = {};

    if (entry_params.formRowProperties == null || !isFormRecord) {
        return tableProperties;
    }

    var properties = entry_params.formRowProperties;

    var entry_keys = entry_params.form_keys;

    var keyTypes = getKeyTypes(entry_keys);

    for (let index = 0; index < properties.length; index++) {
        let property = properties[index];
        if (property.queryString != null) {
            var values = await client.query(replaceKeys(property.queryString, table_keys, keyTypes));
            if (values != null) {
                if (property.propertyType === 'isHidden') {
                    tableProperties['hidden'] = values.rows;
                } else if (property.propertyType === 'readOnly') {
                    tableProperties['readOnly'] = values.rows;
                }
            }
        }
    };

    return tableProperties;
}

async function addCodiceAzienda(keys, company, view_keys, client, isForm) {

    const entry_keys = isForm ? view_keys.form_keys : view_keys.table_keys;

    const entry_azienda = entry_keys.find(entry => entry.key === 'codice_azienda');
    const entry_part = entry_keys.find(entry => entry.key === 'codice_part');

    if (entry_azienda != null) {
        keys['codice_azienda'] = company;
    }

    if (entry_part != null) {

        const queryString = "SELECT codice_part FROM entrasp.aziende WHERE codice_azienda='" + company + "';";

        const response = await client.query(queryString);


        if (response != null) {
            keys['codice_part'] = response.rows[0].codice_part;
        }
    }

    console.log('Keys: ', keys);

}

function isDataTypeString(type) {
    return (type.dataType === 'text' || type.dataType === 'date' || type.viewType === 'textarea')
}

function replaceLocalKeys(queryString, keys) {
    let delimiters = ['£', 'Â£'];
    for (var key in keys) {
        delimiters.forEach(delimiter => {
            let toReplace = delimiter + key + delimiter;
            let replacement = keys[key];
            replacement = (typeof replacement === 'string') ? '\'' + replacement.replace(/'/g, "''") + '\'' : replacement;
            //console.log('toReplace: ', toReplace, ', replacement: ', replacement);
            let newString = queryString.replace(toReplace, replacement);
            //console.log('queryString: ', queryString, ' newString: ', newString);
            while (newString !== queryString) { // handle multiple occurences
                queryString = newString;
                newString = queryString.replace(toReplace, replacement);
            }
        });
    }
    return queryString;
}

function replaceKeys(queryString, keys, keyTypes) {

    console.log(keys);
    var delimiters = ['$', '€'];
    if (queryString) {
        // first replace the global variables, must be €-contoured
        for (var key in global_variables) {
            let toReplace = '€' + key + '€';
            let replacement = global_variables[key];
            let newString = queryString.replace(toReplace, replacement);
            while (newString !== queryString) { // handle multiple occurrences
                queryString = newString;
                newString = queryString.replace(toReplace, replacement);
            }
        }

        for (var key in keys) {
            // console.table(key);
            delimiters.forEach(delimiter => {
                let keyType = keyTypes.find(e => (e.key === key));

                if (typeof keys[key] === 'object' && keyType && keyType.dataType && Array.isArray(keyType.dataType) && keys[key] != null) { // key with multiple subkeys
                    console.log(keys[key], keyType);
                    // tslint:disable-next-line:forin
                    for (var subkey in keys[key]) {
                        // console.log(subKey);
                        let subKeyType = keyType.dataType.find(e => (e.key === subkey));
                        let bracket = (delimiter === '$' && subKeyType && subKeyType.dataType === 'text') ? '\'' : '';
                        let toReplace = delimiter + key + '.' + subkey + delimiter;
                        // replace single quotes with double quotes within strings to avoid errors with queries
                        let valueWithFixedQuotes = (subKeyType && subKeyType.dataType === 'text') ? keys[key][subkey].replace(/'/g, "''") : keys[key][subkey];
                        let replacement = bracket + valueWithFixedQuotes + bracket;
                        let newString = queryString.replace(toReplace, replacement);
                        while (newString !== queryString) { // handle multiple occurences
                            queryString = newString;
                            newString = queryString.replace(toReplace, replacement);
                        }
                        console.log(`newString Object: ${newString}`);
                    }
                } else if (typeof keys[key] !== 'object') {  // avoid spourious values like arrays form events
                    let bracket = (delimiter === '$' && keyType && keyType.dataType === 'text') ? '\'' : '';
                    let toReplace = delimiter + key + delimiter;
                    // TO BE CHECKED
                    //let replacement = keys[key].value ? keys[key].value : keys[key]; // handle subtables
                    // replace single quotes with double quotes within strings to avoid errors with queries

                    let valueWithFixedQuotes = (keys[key] != null && keyType && keyType.dataType === 'text') ? keys[key].replace(/'/g, "''") : keys[key];
                    let replacement = keys[key] == null ? 'null' : bracket + valueWithFixedQuotes + bracket;
                    //console.log ('toReplace: ', toReplace, ' replacement: ', replacement);
                    let newString = queryString.replace(toReplace, replacement);
                    while (newString !== queryString) { // handle multiple occurences
                        queryString = newString;
                        newString = queryString.replace(toReplace, replacement);
                    }
                    //console.table({ newString: newString, toReplace: toReplace, replacement: replacement });
                }
            });
        }
    }
    return queryString;
}

function replaceKeysArray(queryString, keysArray, keyTypes) {
    if (keysArray == null || !keysArray.length) {
        return [];
    } else {
        let returnArray = [];
        keysArray.forEach(keys => {
            returnArray.push(replaceKeys(queryString, keys, keyTypes));
        });
        return returnArray;
    }
}

function getKeyTypes(entry_keys) {
    let keyTypes = entry_keys.map(k => {
        let dataType = k.subKeys ? k.subKeys : (k.format.dataType ? k.format.dataType : '');
        return { key: k.key, dataType: dataType, isPrimary: k.isPrimary, isCalculated: k.queryFunct != null };
    });
    return keyTypes;
}

function data2csv(data, keys = null) {
    let result = "";

    let columns = null;
    if (keys !== null) {
        columns = keys.map(x => x.key);
        result += columns.join('CSV_DELIMITER') + '\n';
    }

    data.forEach(row => {
        if (columns === null) {
            columns = Object.keys(row);
            result += columns.join('CSV_DELIMITER') + '\n';
        }
        result += columns.map(c => (row[c] && typeof row[c] === 'object' && row[c]["value"]) ? row[c]["value"] : row[c]).join('CSV_DELIMITER') + '\n';
    });
    return result;
}

function data2xls(data, title, keys = null) {
    const styles = {
        headerDark: {
            fill: {
                fgColor: {
                    rgb: 'FF008000'
                }
            },
            font: {
                color: {
                    rgb: 'FFFFFFFF'
                },
                sz: 18,
                bold: true
            }
        },
        title: {
            fill: {
                fgColor: {
                    rgb: 'FFE0E0E0'
                },
            },
            font: {
                color: {
                    rgb: 'FF0080C4'
                },
                sz: 34
            }
        },
        data: {
            font: {
                sz: 16
            }
        }
    };

    //Array of objects representing heading rows (very top)
    const heading = [
        [{ value: title, style: styles.title }] // <-- It can be only values
    ];

    const specification = {};
    let columns = null;

    if (keys != null) {
        columns = keys.map(x => x.key);
        keys.forEach(key => {
            specification[key.key] = { displayName: key.label, headerStyle: styles.data, width: 120 }
        });

        console.log('columns', columns);
    }

    const dataset = [];

    data.forEach(row => {
        if (columns === null) {
            columns = Object.keys(row);
            columns.forEach(c => {
                specification[c] = { displayName: c, headerStyle: styles.data, width: 120 }
            });
            console.log('columns', columns);

        }

        var value = {};
        columns.forEach(c => {
            value[c] = (row[c] && typeof row[c] === 'object' && row[c]["value"]) ? row[c]["value"] : row[c];
        });
        dataset.push(value);
    });

    console.log('dataset length: ', dataset.length);

    const merges = [
        { start: { row: 1, column: 1 }, end: { row: 1, column: columns !== null ? columns.length : 1 } }
    ];

    const report = excel.buildExport(
        [ // <- Notice that this is an array. Pass multiple sheets to create multi sheet report
            {
                name: 'Report', // <- Specify sheet name (optional)
                heading: heading, // <- Raw heading array (optional)
                merges: merges, // <- Merge cell ranges
                specification: specification, // <- Report specification
                data: dataset //consts.dataset // <-- Report data
            }
        ]
    );

    return report;
}

async function runQuery(queryString, client) {

    let local_keys = {}; // additional keys generated with pre-main-post processing  
    let queryData = [{}];

    console.log('queryString : ', queryString);

    if (queryString == null) {
        return queryData;
    }

    if (queryString != null && queryString !== '') {
        let query = replaceLocalKeys(queryString, local_keys);
        queryData = await client.query(query);
        queryData = queryData.rows;
        console.log('Main query : ', query, ' result : ', queryData);
    }

    return queryData;
}

async function overrideTable(son) {

    if (son.inheritsFrom == null) {
        return son;
    }

    const DynamoParams = {
        TableName: 'VIEWS_NAME',
        Key: {
            entryKey: son.inheritsFrom
        }
    };

    var father = await dynamo.get(DynamoParams).promise();

    father = father.Item;
    if (father == null) {
        return son;
    }

    for (const field in son) {
        if (son.hasOwnProperty(field) && field != "inheritsFrom" && field != "$schema") {
            father[field] = son[field];
        }
    }
    return father;
}

exports.handler = async (event, context) => {

    const queryParams = event.queryStringParameters;

    const method = event.httpMethod;

    // quite a tricky method to retrieve the Cognito sub ID , would be maybe better to map it in API GW template
    // see https://forums.aws.amazon.com/thread.jspa?threadID=236366 
    const userid = event.requestContext.identity.cognitoAuthenticationProvider.split(':')[2];

    console.log('userid: ', userid);

    console.log('queryParams: ', queryParams);

    // const DynamoParams = {
    //     TableName: 'VIEWS_NAME',
    //     Key: {
    //         entryKey: queryParams['entry_name']
    //     }
    // };

    var isFormRecord = (queryParams['is_form'] === '1');


    const company = queryParams['company'] ? queryParams['company'] : null;

    const profile = company ? await getProfile(userid, company) : null;

    const profileData = profile ? await getProfileData(profile) : null;

    if (queryParams['entry_name'] && profileData) {
        let authorized = isAuthorized(queryParams['entry_name'], profileData);

        if (!authorized) {
            console.log(method, ' request for ', queryParams['entry_name'], ' not authorized!');
            return {
                "isBase64Encoded": false,
                "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                "statusCode": 403,
                "error": "Not Authorized"
            };
        } else {
            console.log(method, ' request for ', queryParams['entry_name'], ' authorized!');
        }

        var readOnly = isReadOnly(queryParams.entry_name, profileData);

        // avoid update, insert or delete if read only
        if (readOnly && (method === 'DELETE')) {
            console.log(queryParams.entry_name, ' Not Authorized!');
            return {
                "isBase64Encoded": false,
                "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                "statusCode": 403,
                "error": "Not Authorized"
            };
        }
    }



    var flags = { readOnly: readOnly }; // if this is a get signal to frontend this is a readonly table

    var queryData = null;

    var queryString = {};

    var tableProperties;

    var attributes = {};

    var additionalQueryCond = [];


    let body = null;

    console.log('queryParams', queryParams);

    const requestType = queryParams['request_type'];

    // If no Request type provided, exit with an error
    if (!requestType) {
        return {
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "statusCode": 500,
            "error": "Bad URL"
        };
    }
    else {
        console.log('Lets start ' + requestType);

        try {
            // const date = getDateFormat();
            let client = await pool.connect();

            if (requestType === 'createNewFile') {
                const fileName = context.awsRequestId + ".csv"; // generate a 'unique' UUID as fileName
                console.log(fileName);

                const s3ParamsInsert = {
                    Bucket: bucket,
                    Key: "CSV/" + fileName
                };

                console.log(s3ParamsInsert);

                // create a temporary signed URL for the object 
                const signedUrl = s3.getSignedUrl('putObject', s3ParamsInsert);
                console.log(`Creating new import file: ${fileName} Url: ${signedUrl}`);

                // Response Body
                body = { result: 'OK', url: signedUrl, fileName: fileName };
            }
            else if (requestType === 'importFile') {
                // Load mandatory query params
                let fileName = queryParams['filename'];
                let table = queryParams['entry_name'];

                // Check if mandatory query params provided
                if (!fileName || !table) {
                    // Error Response Body
                    body = { result: 'KO', reason: 'File and/or table not provided!' };
                }
                else {
                    // Load file from S3
                    const s3ParamsGetList = {
                        Bucket: bucket,
                        Key: "CSV/" + fileName
                    };

                    const csvFile = await s3.getObject(s3ParamsGetList).promise();

                    // Check if file exists
                    if (!csvFile.ContentLength) {
                        console.log("File does not exist!");
                        body = { result: 'KO', reason: 'File does not exist!' };
                    }
                    else {
                        console.log(`S3 File length: ${csvFile.ContentLength}`);

                        // Try to load columns from query params
                        let columns = queryParams['columns'];

                        // Check if columns were not provided in the query params
                        if (!columns) {
                            // Let's search CSV header for columns
                            // First line contains headers, replace all extra characters
                            columns = csvFile.Body.toString().split('\n')[0].replace(/'/g, '').replace(/\r/g, '').replace(/﻿/g, '').replace(/CSV_DELIMITER/g, ',');
                        }

                        // Added schema if table does not contain
                        if (!table.includes('.')) {
                            table = `${schema}.${table}`;
                        }

                        // Data prepared:
                        console.table({ "fileName": fileName, "table": table, "columns": columns });

                        // Create extensions
                        // query = `CREATE EXTENSION aws_s3 CASCADE;`
                        // query = `CREATE EXTENSION aws_commons CASCADE;`

                        // Import CSV from S3 to Postgres
                        query = `SELECT aws_s3.table_import_from_s3(
                            '${table}',
                            '${columns}', 
                            '(FORMAT CSV, DELIMITER E''CSV_DELIMITER'', HEADER true)',
                            aws_commons.create_s3_uri('${bucket}', 'CSV/${fileName}','${region}')
                        );`;
                        // ,aws_commons.create_aws_credentials('${accessKey}', '${secret}', '')

                        // Try to run query 5 times on failure
                        let queryResponse = null;
                        let tries = 0;
                        while (!queryResponse && tries < 5) {
                            console.log(`Trying to run query [${tries}]`);
                            try {
                                queryResponse = await client.query(query);
                            }
                            catch (e) {
                                console.log(e);
                                queryResponse = null;
                                tries++;
                            }
                        }

                        // Check if success or failure
                        if (queryResponse) {
                            console.table(queryResponse);
                            body = { result: 'OK', response: queryResponse };
                        }
                        else {
                            body = { result: 'KO', reason: 'CSV file is not valid for this table!' };
                        }
                    }
                }
            }
            else if (requestType === 'importAdvancedFile') {
                const company = queryParams['company'];
                const table_keys = queryParams['keys'] != null ? JSON.parse(queryParams['keys']) : null;
                const isForm = queryParams['is_form'] != null ? parseInt(queryParams['is_form']) : 0;
                const advancedQueryLabel = queryParams['advanced_query_label'];
                const fileName = queryParams['filename'];
                const table = queryParams['entry_name'];

                console.log("Importing advanced file...");
                console.log(queryParams);
                console.log(table_keys);
                body = { result: 'OK', reason: 'Done!' };

                // Load mandatory query params

                const userid = event.requestContext.identity.cognitoAuthenticationProvider.split(':')[2];

                const DynamoParams = {
                    TableName: 'VIEWS_NAME',
                    Key: {
                        entryKey: table
                    }
                };

                let entry_params = await dynamo.get(DynamoParams).promise();

                // complete table if inherited
                entry_params = await overrideTable(entry_params.Item);

                await addCodiceAzienda(table_keys, company, entry_params, client, isForm);
                global_variables = await helperFuncts.setGlobalVariables(company, client, userid, dynamo);

                let comboQueries = [];
                let preProcessQueries = [];
                let postProcessQueries = [];

                let orderBy;

                let entry_keys;
                console.log('entry_params', entry_params);

                if (isForm) {
                    entry_keys = entry_params.form_keys;
                } else {
                    entry_keys = entry_params.table_keys;
                }
                console.log('entry_keys', entry_keys);


                orderBy = entry_params.orderBy;

                // if (!entry_keys) return '';

                queryString = null;

                // queryString = 'SELECT * FROM entrasp.grc_riepilogo_risposte';
                let keyTypes = getKeyTypes(entry_keys);
                let calculatedWhereCond = [];

                let comma = ''; // first entry has no comma 

                if (entry_params.importQueries) {
                    console.log('entry_params.importQueries', JSON.stringify(entry_params.importQueries));

                    let importQueries = null;
                    if (isForm) {
                        importQueries = entry_params.importQueries.formQueries;
                        console.log('entry_params.importQueries.formQueries', entry_params.importQueries.formQueries);
                    }
                    else {
                        importQueries = entry_params.importQueries.tableQueries;
                        console.log('entry_params.importQueries.tableQueries', entry_params.importQueries.tableQueries);

                    }
                    console.log('importQueries', importQueries);

                    if (importQueries) {
                        advancedQuery = importQueries.filter(x => x.label === advancedQueryLabel);
                        if (advancedQuery.length > 0) {
                            queryString = advancedQuery[0].queryString;
                        }
                    }
                }

                console.log('queryString1', queryString);

                // Check if mandatory query params provided
                if (!fileName || !table || !queryString) {
                    // Error Response Body
                    body = { result: 'KO', reason: 'Check File, table and queryString are correct!' };
                }
                else {
                    // Import CSV from S3 to Postgres
                    queryString = queryString.replace('$nome_file$', `'${fileName}'`);

                    comma = ' WHERE ';
                    if (queryString.includes('$')) {
                        comma = ' AND ';
                        queryString = replaceKeys(queryString, table_keys, keyTypes);
                    }

                    console.log('queryString2', queryString);

                    console.log('queryString3', queryString);

                    console.log('queryString4', queryString);

                    // add order by if present (for table view only
                    if (orderBy != null && orderBy.key != null) {
                        let order = orderBy.order === 'descending' ? ' DESC' : ' ASC';
                        queryString = queryString + ' ORDER BY ' + orderBy.key + order;
                    }

                    queryString = queryString + ';';

                    console.log('queryString5', queryString);

                    // Data prepared:
                    console.table({ "fileName": fileName, "query": queryString, "table": table });

                    // Try to run query 5 times on failure
                    let queryResponse = null;
                    let tries = 0;
                    while (!queryResponse && tries < 5) {
                        console.log(`Trying to run query [${tries}]`);
                        try {
                            queryResponse = await client.query(queryString);
                        }
                        catch (e) {
                            console.log(e);
                            queryResponse = null;
                            tries++;
                        }
                    }

                    // Check if success or failure
                    if (queryResponse) {
                        console.table(queryResponse);
                        body = { result: 'OK', response: queryResponse };
                    }
                    else {
                        body = { result: 'KO', reason: 'Advanced import failed!' };
                    }
                }
            }
            else if (requestType === 'deleteFile') {
                const fileName = queryParams['filename'];

                const s3ParamsDelete = {
                    Bucket: bucket,
                    Key: "CSV/" + fileName
                };

                const signedUrl = s3.getSignedUrl('deleteObject', s3ParamsDelete);

                body = { result: 'OK', url: signedUrl };
            }
            else if (requestType === 'downloadTemplate') {
                // Load mandatory query params
                let table = queryParams['entry_name'];

                console.log("Table: " + table);
                // Check if mandatory query params provided
                if (!table) {
                    // Error Response Body
                    body = { result: 'KO', reason: 'Table not provided!' };
                }
                else {

                    const DynamoParams = {
                        TableName: 'VIEWS_NAME',
                        Key: {
                            entryKey: queryParams['entry_name']
                        }
                    };

                    // read the entry params from DynamoDB view table
                    let entry_params = await dynamo.get(DynamoParams).promise();

                    // complete table if inherited
                    entry_params = await overrideTable(entry_params.Item);
                    if (entry_params.origin) {
                        if (entry_params.origin.includes(".")) {
                            table = entry_params.origin.split(".")[1];
                        }
                        else {
                            table = entry_params.origin;
                        }
                    }

                    console.log("entry_params", entry_params);
                    console.log("table", table);

                    // Get columns for the table
                    query = `select entrasp.grc_listacampiditabella(
                        '${table}'
                    )  as columns;`;

                    // Run query
                    let queryResponse = null;
                    try {
                        queryResponse = await client.query(query);
                        console.table(queryResponse);
                        if (queryResponse.rows && queryResponse.rows.length) {
                            body = {
                                result: 'OK',
                                response: queryResponse.rows[0]["columns"] ?
                                    queryResponse.rows[0]["columns"].replace(/,/g, 'CSV_DELIMITER').replace(/ /g, '') :
                                    ''
                            };
                        }
                        else {
                            body = { result: 'OK', response: queryResponse };
                        }
                    }
                    catch (e) {
                        console.log(e);
                        queryResponse = null;
                        body = { result: 'KO', reason: 'CSV file is not valid for this table!' };
                    }
                }
            }
            else if (requestType === 'getCSV') {
                const company = queryParams['company'];
                const table_keys = queryParams['keys'] != null ? JSON.parse(queryParams['keys']) : null;
                const search_keys = queryParams['search_keys'] != null ? JSON.parse(queryParams['search_keys']) : null;
                const isForm = queryParams['is_form'] != null ? parseInt(queryParams['is_form']) : 0;
                const isAdvanced = queryParams['is_advanced'] != null ? parseInt(queryParams['is_advanced']) : 0;
                const isCSV = queryParams['is_csv'] != null ? parseInt(queryParams['is_csv']) : 0;
                const advancedQueryLabel = queryParams['advanced_query_label'];
                const entry_name = queryParams['entry_name'];

                const fullValueSet = JSON.parse(event.body);

                console.log('Full value set: ', fullValueSet);

                const DynamoParams = {
                    TableName: 'VIEWS_NAME',
                    Key: {
                        entryKey: entry_name
                    }
                };

                let entry_params = await dynamo.get(DynamoParams).promise();

                // complete table if inherited
                entry_params = await overrideTable(entry_params.Item);

                await addCodiceAzienda(table_keys, company, entry_params, client, isForm);
                global_variables = await helperFuncts.setGlobalVariables(company, client, userid, dynamo);

                additionalQueryCond = getAdditionalQueryCond(entry_name, profileData);

                let queryString = null;

                let comboQueries = [];
                let preProcessQueries = [];
                let postProcessQueries = [];

                let orderBy;

                let entry_keys;
                console.log('entry_params', entry_params);

                if (isForm) {
                    entry_keys = entry_params.form_keys;
                } else {
                    entry_keys = entry_params.table_keys;
                }
                console.log('entry_keys', entry_keys);


                orderBy = entry_params.orderBy;

                // if (!entry_keys) return '';

                queryString = null;

                // queryString = 'SELECT * FROM entrasp.grc_riepilogo_risposte';
                let keyTypes = getKeyTypes(entry_keys);
                let calculatedWhereCond = [];

                let comma = ''; // first entry has no comma 

                if (isAdvanced) {
                    if (entry_params.exportQueries) {
                        console.log('entry_params.exportQueries', JSON.stringify(entry_params.exportQueries));

                        let exportQueries = null;
                        if (isForm) {
                            exportQueries = entry_params.exportQueries.formQueries;
                            console.log('entry_params.exportQueries.formQueries', entry_params.exportQueries.formQueries);
                        }
                        else {
                            exportQueries = entry_params.exportQueries.tableQueries;
                            console.log('entry_params.exportQueries.tableQueries', entry_params.exportQueries.tableQueries);

                        }
                        console.log('exportQueries', exportQueries);

                        if (exportQueries) {
                            advancedQuery = exportQueries.filter(x => x.label === advancedQueryLabel);
                            if (advancedQuery.length > 0) {
                                queryString = advancedQuery[0].queryString;
                            }
                        }
                    }
                    console.log('queryString1', queryString);

                    comma = ' WHERE ';
                    if (queryString.includes('$')) {
                        comma = ' AND ';
                        queryString = replaceKeys(queryString, fullValueSet, keyTypes);
                    }

                    console.log('queryString2', queryString);

                    queryData = await runQuery(queryString, client);
                    // console.log('queryData', queryData);

                }
                else {
                    queryString = getTableQuery(entry_params, table_keys, fullValueSet, isForm, search_keys, additionalQueryCond);

                    if (!isForm) {
                        // add the search combos if any
                        getSearchCombos(entry_params, fullValueSet, false, queryString.comboQueries);
                    }

                    // process query string(s) 
                    queryData = await processPreMainPost(queryString, client, isFormRecord, true);

                    let searchOptions = [];
                    if (queryData != null && queryString.comboQueries != null && queryString.comboQueries.length) {
                        for (let qd_index = 0; qd_index < queryData.length; qd_index++) {
                            for (let index = 0; index < queryString.comboQueries.length; index++) {
                                let element = queryString.comboQueries[index];
                                let query = element.comboQuery;
                                // search for local keys
                                query = replaceLocalKeys(query, queryData[qd_index]);
                                let comboData = await client.query(query);
                                console.log('Combo query: ', query, ' Result: ', comboData.rows);
                                if (isFormRecord) { // form/new record, add combobox options to relevant field
                                    let comboEntry = new Object;
                                    comboEntry[element.key] = new Object;
                                    comboEntry[element.key]['value'] = queryData[qd_index][element.key];
                                    comboEntry[element.key]['options'] = comboData.rows;
                                    Object.assign(queryData[qd_index], comboEntry);
                                }
                                else { // table view, add search combobox to search_combos field's array
                                    qd_index = queryData.length;  // bad trick, make it exit from loop on rows
                                    searchOptions.push({ fieldName: element.key, options: comboData.rows });
                                }
                            }
                        }
                    }

                    if (!isFormRecord && searchOptions.length) { // at least one search combobox, return it as search_combos key
                        queryData = { table_data: queryData, search_options: searchOptions };
                    }

                    // process properties query

                    tableProperties = await process_properties(entry_params, table_keys, isFormRecord, client);

                    queryData = getCalculatedParams(entry_params, queryData, isFormRecord);
                    // process attributeFuncts
                    if (isFormRecord) {
                        attributes = await processAttributeQueries(entry_params, queryData, client);
                    }

                    if (!isForm) {
                        queryData = queryData["table_data"];
                    }

                    //queryData["anonymous"]["calcolo_risultato_log"] = null;
                    console.log('queryData', queryData);
                    console.log('tableProperties', tableProperties);
                    console.log('attributes', attributes);
                    console.log('queryString', queryString);


                }

                if (queryData) {
                    let fileBody = null;
                    let fileName = null;

                    var uuid = context.awsRequestId; // generate a 'unique' UUID as fileName

                    if (isCSV) {
                        fileName = 'CSV/' + uuid + '.csv';
                        if (isAdvanced) {
                            fileBody = data2csv(queryData);
                        }
                        else {
                            var viewKeys = isForm ? entry_params.form_keys : entry_params.table_keys;
                            console.log('viewKeys', viewKeys);

                            const validKeys = viewKeys.filter(key => !key.isHidden);
                            console.log('validKeys', validKeys);
                            fileBody = data2csv(queryData, validKeys);
                        }
                    }
                    else {
                        fileName = 'Excel/' + uuid + '.xlsx';
                        if (isAdvanced) {
                            fileBody = data2xls(queryData, queryParams.entry_name);
                        }
                        else {
                            var viewKeys = isForm ? entry_params.form_keys : entry_params.table_keys;
                            console.log('viewKeys', viewKeys);

                            const validKeys = viewKeys.filter(key => !key.isHidden);
                            console.log('validKeys', validKeys);
                            fileBody = data2xls(queryData, queryParams.entry_name, validKeys);
                        }
                    }


                    // const dataset = [];
                    // 
                    // queryData.forEach(entry => {
                    //     var value = {};
                    //     validKeys.forEach(key => {
                    //         value[key.key] = entry[key.key];
                    //     });
                    //     dataset.push(value);
                    // });
                    // console.log('dataset', dataset);

                    var s3ParamsInsert = {
                        Bucket: 'gorico2-reports',
                        Key: fileName,
                        Body: fileBody
                    };
                    var s3ParamsUrl = {
                        Bucket: 'gorico2-reports',
                        Key: fileName
                    };

                    // upload to S3
                    await s3.putObject(s3ParamsInsert).promise();

                    var url = s3.getSignedUrl('getObject', s3ParamsUrl);

                    body = { result: 'OK', url: url };

                }
                // else {

                //     queryString = 'SELECT ';
                //     // keep track of calculated where conditions, query becomes subqueries. 
                //     // See https://stackoverflow.com/questions/47455962/using-function-result-in-where-clause-in-postgresql


                //     for (index = 0; index < entry_keys.length; index++) {
                //         let element = entry_keys[index];
                //         if (isForm) { // check if combobox, then save query fields for later processing
                //             if (element.format.viewType === 'combobox' || element.format.viewType === 'radiobutton' || element.format.viewType === 'checkboxgroup') {
                //                 let comboQuery = element.format.comboQuery;
                //                 if (comboQuery != null) {
                //                     comboQuery = replaceKeys(comboQuery, table_keys, keyTypes);
                //                     comboQueries.push({ key: element.key, comboQuery: comboQuery });
                //                 }
                //             } else if (element.format.viewType === 'subform') {
                //                 // append the keys at the end of the array (avoiding recursion, they will be processed later in the loop)
                //                 element.format.subform_keys.forEach(subkey => {
                //                     if (element.sameOrigin != null) {
                //                         subkey['sameOrigin'] = element.sameOrigin;
                //                     }
                //                     entry_keys.push(subkey);
                //                 });
                //             }

                //         }
                //         if (!element.key || (element.sameOrigin != null && !element.sameOrigin && element.queryFunct == null) || element.format.viewType === 'subform') {  // no table key or the key is from another table
                //             continue;
                //         }

                //         let fieldString = comma + element.key;
                //         if (element.hasOwnProperty('queryFunct')) { // overridden by funct
                //             fieldString = comma + '(' + replaceKeys(element.queryFunct, table_keys, keyTypes) + ') AS ' + element.key;
                //         }
                //         comma = ','; // needed only the first time
                //         queryString = queryString + fieldString;

                //     };
                //     console.log('queryString1', queryString);


                //     if (entry_params.origin) {
                //         queryString = queryString + ' FROM ' + entry_params.origin;
                //     } else {  // no underlying table, skip building of main query, still there might be some combos
                //         return { mainQuery: null, comboQueries: comboQueries, preProcessQueries: preProcessQueries, postProcessQueries: postProcessQueries };
                //     }
                // }

                // if (queryString) {
                //     comma = ' WHERE ';
                //     if (isAdvanced) {
                //         if (queryString.includes('$')) {
                //             comma = ' AND ';
                //             queryString = replaceKeys(queryString, table_keys, keyTypes);
                //         }
                //     }
                //     else {

                //         for (const key in table_keys) {
                //             if (table_keys.hasOwnProperty(key)) {
                //                 let keyType = keyTypes.find(e => (e.key === key));
                //                 let delimiter = (keyType.dataType === 'text') ? '\'' : '';
                //                 let element = table_keys[key];
                //                 // replace single quotes with double quotes in strings
                //                 element = (keyType.dataType === 'text') ? element.replace(/'/g, "''") : element;
                //                 if (keyType.isCalculated) { // delay and make it part of the query above
                //                     calculatedWhereCond.push({ key: key, value: element, delimiter: delimiter })
                //                 } else {
                //                     let fieldString = comma + key + '=' + delimiter + element + delimiter;
                //                     queryString = queryString + fieldString;
                //                     comma = ' AND '; // needed only the first time
                //                 }
                //             }
                //         }
                //     }


                //     console.log('queryString2', queryString);

                //     if (search_keys) {
                //         let search_params = entry_params.search_keys;
                //         let search_types = search_params.map(k => {
                //             let dataType = k.format.dataType ? k.format.dataType : '';
                //             return { key: k.fieldName, dataType: dataType };
                //         });

                //         for (const key in search_keys) {
                //             if (search_keys.hasOwnProperty(key)) {
                //                 let search_param = search_params.find(s => (s.fieldName === key));
                //                 if (search_param != null && search_param.queryCond != null) {
                //                     let fieldString = replaceKeys(search_param.queryCond, search_keys, search_types);
                //                     queryString = queryString + comma + fieldString;
                //                     comma = ' AND '; // needed only the first time if no table_
                //                 }
                //             }
                //         }

                //         console.log('search_params', search_params);
                //     }

                //     console.log('queryString3', queryString);

                //     if (calculatedWhereCond.length) { // make query above
                //         queryString = 'SELECT * FROM (' + queryString + ') AS sub_query ';
                //         let comma = ' WHERE ';
                //         calculatedWhereCond.forEach(
                //             element => {
                //                 queryString += comma + element.key + '=' + element.delimiter + element.value + element.delimiter;
                //                 comma = ' AND ';
                //             });
                //     }

                //     console.log('queryString4', queryString);

                //     // add order by if present (for table view only
                //     if (orderBy != null && orderBy.key != null) {
                //         let order = orderBy.order === 'descending' ? ' DESC' : ' ASC';
                //         queryString = queryString + ' ORDER BY ' + orderBy.key + order;
                //     }

                //     queryString = queryString + ';';

                //     console.log('queryString5', queryString);

                //     queryData = await runQuery(queryString, client);
                //     // console.log('queryData', queryData);

                //     let fileBody = null;
                //     let fileName = null;

                //     var uuid = context.awsRequestId; // generate a 'unique' UUID as fileName

                //     if (isCSV) {
                //         fileName = 'CSV/' + uuid + '.csv';
                //         if (isAdvanced) {
                //             fileBody = data2csv(queryData);
                //         }
                //         else {
                //             var viewKeys = isForm ? entry_params.form_keys : entry_params.table_keys;
                //             console.log('viewKeys', viewKeys);

                //             const validKeys = viewKeys.filter(key => !key.isHidden);
                //             console.log('validKeys', validKeys);
                //             fileBody = data2csv(queryData, validKeys);
                //         }
                //     }
                //     else {
                //         fileName = 'Excel/' + uuid + '.xlsx';
                //         if (isAdvanced) {
                //             fileBody = data2xls(queryData, queryParams.entry_name);
                //         }
                //         else {
                //             var viewKeys = isForm ? entry_params.form_keys : entry_params.table_keys;
                //             console.log('viewKeys', viewKeys);

                //             const validKeys = viewKeys.filter(key => !key.isHidden);
                //             console.log('validKeys', validKeys);
                //             fileBody = data2xls(queryData, queryParams.entry_name, validKeys);
                //         }
                //     }


                //     // const dataset = [];
                //     // 
                //     // queryData.forEach(entry => {
                //     //     var value = {};
                //     //     validKeys.forEach(key => {
                //     //         value[key.key] = entry[key.key];
                //     //     });
                //     //     dataset.push(value);
                //     // });
                //     // console.log('dataset', dataset);

                //     var s3ParamsInsert = {
                //         Bucket: 'gorico2-reports',
                //         Key: fileName,
                //         Body: fileBody
                //     };
                //     var s3ParamsUrl = {
                //         Bucket: 'gorico2-reports',
                //         Key: fileName
                //     };

                //     // upload to S3
                //     await s3.putObject(s3ParamsInsert).promise();

                //     var url = s3.getSignedUrl('getObject', s3ParamsUrl);

                //     body = { result: 'OK', url: url };

                // }
                // else {
                //     body = { result: 'KO', reason: 'Query not found!' };
                // }

            }

            await client.release();
        } catch (e) {
            console.log(e);
            body = { result: 'KO', reason: 'Server error' };
        }

        return {
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "statusCode": 200,
            "body": JSON.stringify(body)
        };
    }
};