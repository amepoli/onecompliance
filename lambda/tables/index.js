const Pool = require('pg-pool');
const pool = new Pool({
    host: 'HOST_NAME',
    database: 'DB_NAME',
    user: 'postgres',
    password: 'et2themax',
    port: 5432,
    max: 1,
    min: 0,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 1000
});

const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-central-1' });
const dynamo = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const excel = require('node-excel-export');
const readXlsxFile = require('read-excel-file/node');

const global_variables = {
    global_codice_azienda: '', 
    global_codice_part: '', 
    global_userid: 0
};


function replaceLocalKeys(queryString, keys) {

    // Â£ to fix problems with Windows clients pushing the tables
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

            if (typeof keys[key] === 'object' && Array.isArray(keyType.dataType) && keys[key] != null) { // key with multiple subkeys
                    console.log(keys[key],keyType);
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
                } else if (typeof keys[key] !== 'object' || keys[key] == null) {  // avoid spourious values like arrays form events - n.b.: null is 'object'
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
        return { key: k.key, dataType: dataType, isPrimary: k.isPrimary, isCalculated: k.queryFunct != null, sameOrigin: k.sameOrigin};
    });
    return keyTypes;
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

// build the Postgresql query from parameters
function getTableQuery(entry_params, table_keys, isForm, search_keys) {

    let comboQueries = [];

    let preProcessQueries = [];

    let postProcessQueries = [];

    let orderBy;

    let entry_keys;
    if (isForm) {
        entry_keys = entry_params.form_keys;
    } else {
        entry_keys = entry_params.table_keys;
    }

    orderBy = entry_params.orderBy;

    if (!entry_keys) return '';

    let keyTypes = getKeyTypes(entry_keys);

    // process pre-defined queries for table/form view, if any

    if (entry_params.predefinedQueries) {
        let mainQuery;
        entry_params.predefinedQueries.forEach(query => {
            if ((isForm && query.operation === "selectForm") || (!isForm && query.operation === "selectTable")) {
                if (query.type === "main" && search_keys == null) {
                    mainQuery = replaceKeys(query.queryString, table_keys, keyTypes); // only one main query allowed
                } else if (query.type === "search" && search_keys != null) {
                    mainQuery = replaceKeys(query.queryString, table_keys, keyTypes); // only one main query allowed
                } else if (query.type === "preProcessing") {
                    preProcessQueries.push(replaceKeys(query.queryString, table_keys, keyTypes));
                } else if (query.type === "postProcessing") {
                    postProcessQueries.push(replaceKeys(query.queryString, table_keys, keyTypes));
                }
            }
        });
        if (mainQuery) { // no need to further build main query, stop here
            return { mainQuery: mainQuery, comboQueries: [], preProcessQueries: preProcessQueries, postProcessQueries: postProcessQueries };

        }
    }

    // automatic build of main query

    let queryString = 'SELECT ';
    let comma = ''; // first entry has no comma 
    // keep track of calculated where conditions, query becomes subqueries. 
    // See https://stackoverflow.com/questions/47455962/using-function-result-in-where-clause-in-postgresql
    let calculatedWhereCond = [];

    for (index = 0; index < entry_keys.length; index++) {
        let element = entry_keys[index];
        if (isForm) { // check if combobox, then save query fields for later processing
            if (element.format.viewType === 'combobox' || element.format.viewType === 'radiobutton' || element.format.viewType === 'checkboxgroup') {
                let comboQuery = element.format.comboQuery;
                if (comboQuery != null) {
                    comboQuery = replaceKeys(comboQuery, table_keys, keyTypes);
                    comboQueries.push({ key: element.key, comboQuery: comboQuery });
                }
            } else if (element.format.viewType === 'subform') {
                // append the keys at the end of the array (avoiding recursion, they will be processed later in the loop)
                element.format.subform_keys.forEach(subkey => {
                    if (element.sameOrigin != null) {
                        subkey['sameOrigin'] = element.sameOrigin;
                    }
                    entry_keys.push(subkey);
                });
            }

        }
        if (!element.key || (element.sameOrigin != null && !element.sameOrigin && element.queryFunct == null) || element.format.viewType === 'subform') {  // no table key or the key is from another table
            continue;
        }

        let fieldString = comma + element.key;
        if (element.hasOwnProperty('queryFunct')) { // overridden by funct
            fieldString = comma + '(' + replaceKeys(element.queryFunct, table_keys, keyTypes) + ') AS ' + element.key;
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
            let delimiter = (keyType.dataType === 'text') ? '\'' : '';
            let element = table_keys[key];
            // replace single quotes with double quotes in strings
            element = (keyType.dataType === 'text') ? element.replace(/'/g, "''") : element;
            if (keyType.isCalculated) { // delay and make it part of the query above
                calculatedWhereCond.push({ key: key, value: element, delimiter: delimiter })
            } else {
                let fieldString = comma + key + '=' + delimiter + element + delimiter;
                queryString = queryString + fieldString;
                comma = ' AND '; // needed only the first time
            }
        }
    }

    if (search_keys) {

        let search_params = entry_params.search_keys;
        let search_types = search_params.map(k => {
            let dataType = k.format.dataType ? k.format.dataType : '';
            return { key: k.fieldName, dataType: dataType };
        });

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

    return { mainQuery: queryString, comboQueries: comboQueries, preProcessQueries: preProcessQueries, postProcessQueries: postProcessQueries };

}

function getSearchCombos (entry_params, table_keys, isForm, comboQueries) {

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

function getEventQuery(entry_params, body, eventInfo, queryParams) {

    let entry_keys = entry_params.form_keys;
    let eventQueries = [];  // exploit preprocess queries to run the event queries
    let table_keys = body;  // keys provided with body
    console.log("Event body: ", body);
    let keyTypes = getKeyTypes(entry_keys);
    let field_key = entry_keys.find(entry => entry.key === eventInfo.field);

    if (field_key != null) {
        if (field_key.inputEvents != null) {
            if (!eventInfo.isMessage) {
                field_key.inputEvents.forEach(
                    event => {
                        if (event.queryFunct != null && event.eventName === eventInfo.name && event.actionType === eventInfo.type) {
                            const queryString = replaceKeys(event.queryFunct, table_keys, keyTypes);
                            eventQueries.push(queryString);
                        }
                    });
            }
            else {
                // Message stuff
                // Let's see if there's any show_message action
                field_key.inputEvents.forEach(
                    event => {
                        if (event.actionType === 'show_message') {
                            // This is the action we were looking for.
                            if (eventInfo.type === 'actionYes') {
                                // It's a Yes Action
                                if (event.message.actionOnYes.actionType === 'query') {
                                    // It's a query
                                    const queryString = replaceKeys(event.message.actionOnYes.queryFunct, table_keys, keyTypes);
                                    eventQueries.push(queryString);
                                }
                                else {
                                    // It's something else
                                    console.error('Non-query action found in show_message!');
                                }
                            }
                            else {
                                // It's a No Action
                                if (event.message.actionOnNo.actionType === 'query') {
                                    // It's a query
                                    const queryString = replaceKeys(event.message.actionOnNo.queryFunct, table_keys, keyTypes);
                                    eventQueries.push(queryString);
                                }
                                else {
                                    // It's something else
                                    console.error('Non-query action found in show_message!');
                                }
                            }
                        }
                    }
                );
            }
        }
    }

    return { mainQuery: '', preProcessQueries: [], postProcessQueries: [], comboQueries: [], eventQueries: eventQueries };

}

function getDashboardQuery(entry_params, table_keys, dashboard_index) {

    let entry_keys = entry_params.table_keys;

    let colorsQuery = entry_params.dashboards[dashboard_index].labels.colorsQuery;

    let rowsQuery = entry_params.dashboards[dashboard_index].labels.rowsQuery;

    let columnsQuery = entry_params.dashboards[dashboard_index].labels.columnsQuery;

    let keyTypes = getKeyTypes(entry_keys);

    if (colorsQuery != null) {
        colorsQuery.query = replaceKeys(colorsQuery.query, table_keys, keyTypes);
    }

    if (rowsQuery != null) {
        rowsQuery.query = replaceKeys(rowsQuery.query, table_keys, keyTypes);
    }

    if (columnsQuery != null) {
        columnsQuery.query = replaceKeys(columnsQuery.query, table_keys, keyTypes);
    }

    return { colorsQuery: colorsQuery, rowsQuery: rowsQuery, columnsQuery: columnsQuery };

}

function getNewQuery(entry_params, table_keys) {

    let entry_keys = entry_params.form_keys;

    let defaultValues = {};

    let comboQueries = [];

    let keyTypes = getKeyTypes(entry_keys);

    entry_keys.forEach(element => {

        // set keys' default values and check for combobox queries
        let obj = new Object;
        // add passed key value, unless it is autogenerate (must be null)
        if (table_keys[element.key] && (element.autoGenerate == null || element.autoGenerate === false)) {
            obj[element.key] = table_keys[element.key];
        // add default value if any
        } else if (element.format.hasOwnProperty('value')) {
            obj[element.key] = element.format.value;
        } else {
            obj[element.key] = null;
        }
        Object.assign(defaultValues, obj);
        let comboQuery = element.format.comboQuery;
        if (comboQuery) {
            comboQuery = replaceKeys(comboQuery, table_keys, keyTypes);
            comboQueries.push({ key: element.key, comboQuery: comboQuery });
        }
    });

    return { mainQuery: null, comboQueries: comboQueries, preProcessQueries: [], postProcessQueries: [], defaultValues: defaultValues };
}

function getInsertUpdateQuery(entry_params, keys, newRecord) {

    let entry_keys = entry_params.form_keys;

    if (entry_keys == null) return '';

    let preProcessQueries = [];

    let postProcessQueries = [];

    let keyTypes = getKeyTypes(entry_keys);

    let primaryKeys = entry_keys.filter(key => key.isPrimary === true);

    let autoGenKeyEntry = entry_keys.find(key => key.autoGenerate === true);

    let autoGenKey = autoGenKeyEntry != null && autoGenKeyEntry.key != null ? autoGenKeyEntry.key : null;

    // further check if the value is passed from front-end, in such case skip the autogeneration
    autoGenKey = keys[autoGenKey] != null ? null : autoGenKey;

    // process pre-defined queries for table/form view, if any
    if (entry_params.predefinedQueries) {
        let mainQuery;
        entry_params.predefinedQueries.forEach(query => {
            if ((newRecord && query.operation === "insert") || (!newRecord && query.operation === "update")) {
                if (query.type === "main") {
                    mainQuery = replaceKeys(query.queryString, keys, keyTypes); // only one main query allowed, last one wins
                } else if (query.type === "preProcessing") {
                    preProcessQueries.push(replaceKeys(query.queryString, keys, keyTypes));
                } else if (query.type === "postProcessing") {
                    postProcessQueries.push(replaceKeys(query.queryString, keys, keyTypes));
                }
            }
        });
        if (mainQuery) { // no need to further build main query, stop here
            return { mainQuery: mainQuery, comboQueries: [], preProcessQueries: preProcessQueries, postProcessQueries: postProcessQueries };
        }
    }

    // automatic build of main query

    let queryString = newRecord ? 'INSERT INTO ' + entry_params.origin + ' (' : 'UPDATE ' + entry_params.origin + ' SET ';

    let genString;

    let comma;

    console.log("atogen: ", autoGenKey, " newR: ", newRecord);

    if (autoGenKey != null && newRecord) {  // retrieve the new ID 
        genString = 'SELECT (MAX(' + autoGenKey + ')+1) FROM ' + entry_params.origin;
        comma = ' WHERE ';
        for (const key in keys) {
            if (keys.hasOwnProperty(key)) {
                let keyType = keyTypes.find(e => (e.key === key));
                if (!keyType.isPrimary || keyType.key === autoGenKey) continue; // avoid to add non primary keys to the WHERE condition
                let delimiter = (keyType.dataType === 'text') ? '\'' : '';
                let element = keys[key];
                // replace single quotes with double quotes in strings
                if (element != null) {
                    element = (keyType.dataType === 'text') ? element.replace(/'/g, "''") : element;
                }
                let fieldString = comma + key + '=' + delimiter + element + delimiter;
                genString = genString + fieldString;
                comma = ' AND '; // needed only the first time
            }
        }

        console.log("genString: ", genString);
    }

    comma = ''; // first entry has no comma 

    let values = {};

    entry_keys.forEach(element => {

        if (element.key == null || (element.sameOrigin != null && !element.sameOrigin) || element.queryFunct != null || element.format.viewType === 'subform') { // skip foreing columns
            return;
        }

        let value;

        if (element.autoGenerate && newRecord && genString != null) {  // it is an autogenerate value
            value = '(' + genString + ')'; // pass the generation query string as value 
        } else if (keys[element.key] == null) {  // no value passed for the key
            if (element.format.value) {
                value = element.format.value; // use default value 
            } else {
                return;   // no value passed and no default, skip the key
            }
        } else {
            value = keys[element.key];
        }

        queryString = queryString + comma + element.key;
        values[element.key] = value;
        if (!newRecord) { // values set immediately for UPDATE, later in the query for INSERT
            let keyType = keyTypes.find(e => (e.key === element.key));
            let delimiter = (keyType.dataType === 'text') ? '\'' : '';
            if (value.id) { // combobox 
                value = value.id;
            }
            // replace single quotes with double quotes in strings
            value = (keyType.dataType === 'text') ? value.replace(/'/g, "''") : value;
            queryString = queryString + '=' + delimiter + value + delimiter;
        }
        comma = ', ';
    });

    if (newRecord) { // complete the INSERT query
        comma = ') VALUES (';
        for (const key in values) {
            let keyType = keyTypes.find(e => (e.key === key));
            let delimiter = (keyType.dataType === 'text') ? '\'' : '';
            let value = values[key];
            if (value.id) { // combobox 
                value = value.id;
            }
            // replace single quotes with double quotes in strings
            value = (keyType.dataType === 'text') ? value.replace(/'/g, "''") : value;
            let fieldString = comma + delimiter + value + delimiter;
            queryString = queryString + fieldString;
            comma = ', '; // needed only the first time
        }
        if (autoGenKey != null) {
            queryString += ') RETURNING ' + autoGenKey;
        } else {
            queryString += ')';
        }
    } else { // add WHERE conditions to UPDATE query
        comma = ' WHERE ';
        primaryKeys.forEach(primaryKey => {
            let keyType = keyTypes.find(e => (e.key === primaryKey.key));
            let delimiter = (keyType.dataType === 'text') ? '\'' : '';
            let element = keys[primaryKey.key];
            // replace single quotes with double quotes in strings
            element = (keyType.dataType === 'text') ? element.replace(/'/g, "''") : element;
            let fieldString = comma + primaryKey.key + '=' + delimiter + element + delimiter;
            queryString = queryString + fieldString;
            comma = ' AND '; // needed only the first time
        });
    }

    queryString += ';';

    return { mainQuery: queryString, comboQueries: [], preProcessQueries: preProcessQueries, postProcessQueries: postProcessQueries };

}

function getDeleteQuery(entry_params, table_keys) {

    let preProcessQueries = [];

    let postProcessQueries = [];

    let entry_keys = entry_params.form_keys;

    let keyTypes = getKeyTypes(entry_keys);


    // process pre-defined queries for table/form view, if any

    if (entry_params.predefinedQueries) {
        let mainQuery;
        entry_params.predefinedQueries.forEach(query => {
            if (query.operation === "delete") {
                if (query.type === "main") {
                    mainQuery = replaceKeys(query.queryString, table_keys, keyTypes); // only one main query allowed
                } else if (query.type === "preProcessing") {
                    preProcessQueries.push(replaceKeys(query.queryString, table_keys, keyTypes));
                } else if (query.type === "postProcessing") {
                    postProcessQueries.push(replaceKeys(query.queryString, table_keys, keyTypes));
                }
            }
        });
        if (mainQuery) { // no need to further build main query, stop here
            return { mainQuery: mainQuery, preProcessQueries: preProcessQueries, postProcessQueries: postProcessQueries };
        }
    }

    // automatic build of main query

    let queryString = 'DELETE FROM ' + entry_params.origin;

    let comma = ' WHERE ';

    for (const key in table_keys) {
        if (table_keys.hasOwnProperty(key)) {
            let keyType = keyTypes.find(e => (e.key === key));
            let delimiter = (keyType.dataType === 'text') ? '\'' : '';
            let element = table_keys[key];
            // replace single quotes with double quotes in strings
            element = (keyType.dataType === 'text') ? element.replace(/'/g, "''") : element;
            let fieldString = comma + key + '=' + delimiter + element + delimiter;
            queryString = queryString + fieldString;
            comma = ' AND '; // needed only the first time
        }
    }

    return { mainQuery: queryString, comboQueries: [], preProcessQueries: preProcessQueries, postProcessQueries: postProcessQueries };

}

async function processAttributeQueries(entry_params, keys, client) {
    
    let entry_keys = entry_params.form_keys;

    let keyTypes = getKeyTypes(entry_keys);

    let attributes = [];

    for (let i = 0; i < entry_keys.length; i++) {
        const entry_key = entry_keys[i];
        if (entry_key.key == null || entry_key.attributeFuncts == null || entry_key.attributeFuncts.length === 0) {
            continue;
        }
            
        for (let j = 0; j < entry_key.attributeFuncts.length; j++) {
                const attributeFunct = entry_key.attributeFuncts[j];
                if (attributeFunct.queryString == null || attributeFunct.attributeType == null || (attributeFunct.attributeType === 'style' && attributeFunct.styleAttribute == null)) {
                continue;
            }
                console.log('Attribute: ', attributeFunct.queryString, keys[0], keyTypes);
                const query = replaceKeys(attributeFunct.queryString, keys[0], keyTypes);
                console.log('Query attributes: ', query);
            let result = await client.query(query);
                result = result.rows;
                console.log('Query attributes result: ', result);
                for (let k = 0; k <result.length; k++) {
                    let attribute = {};
                    attribute[entry_key.key] = {};
                    if (attributeFunct.attributeType === 'style') {
                let attr_style = {};
                        attr_style[attributeFunct.styleAttribute] = result[k].label;  // query must return {label: value} 
                        attribute[entry_key.key]['style'] = Object.assign(attribute[entry_key.key]['style'], attr_style);
            } else {
                        attribute[entry_key.key][attributeFunct.attributeType] = result[k].label;
                    }
                    attributes.push(attribute);
                }
            }
        }
    return attributes;
}

async function processPreMainPost(queryString, client, notFullTable) {

    let local_keys = {}; // additional keys generated with pre-main-post processing  
    let queryData = [{}];

    console.log('queryString : ', queryString);

    if (queryString == null) {
        return queryData;
    }

    // pre-processing
    if (queryString.preProcessQueries != null && queryString.preProcessQueries.length) {
        for (let index = 0; index < queryString.preProcessQueries.length; index++) {
            let query = queryString.preProcessQueries[index];
            query = replaceLocalKeys(query, local_keys);
            let result = await client.query(query);
            result = notFullTable ? result.rows[0] : result.rows;
            if (result !== null) { // add resulting keys to the list of local keys if any
                local_keys = Object.assign(local_keys, result);
            }
            console.log('Pre query : ', query, ' result : ', result);
        }
    }

    // main query
    if (queryString.mainQuery != null && queryString.mainQuery !== '') {
        let query = replaceLocalKeys(queryString.mainQuery, local_keys);
        queryData = await client.query(query);
        queryData = queryData.rows;
        console.log('Main query : ', query, ' result : ', queryData);
    }


    // post-processing
    if (queryString.postProcessQueries != null && queryString.postProcessQueries.length) { // post-processing 
        for (let index = 0; index < queryString.postProcessQueries.length; index++) {
            let query = queryString.postProcessQueries[index];
            query = replaceLocalKeys(query, local_keys);
            let result = await client.query(query);
            result = notFullTable ? result.rows[0] : result.rows;
            if (result !== null) { // add resulting keys to the list of local keys if any
                local_keys = Object.assign(local_keys, result);
            }
            console.log('Post query : ', query, ' result : ', result);
        }
    }


    return queryData;
}

async function processDashboard(queryString, client) {
    let queryData = {};

    let colors, rows, columns;

    console.log('dashboardString : ', queryString);

    if (queryString.colorsQuery != null) {
        colors = await client.query(queryString.colorsQuery.query);
        queryData['colors'] = { colors: colors.rows, type: queryString.colorsQuery.type };
    }

    if (queryString.rowsQuery != null) {
        rows = await client.query(queryString.rowsQuery.query);
        queryData['rows'] = { data: rows.rows, key: queryString.rowsQuery.key };
    }

    if (queryString.columnsQuery != null) {
        columns = await client.query(queryString.columnsQuery.query);
        queryData['columns'] = { data: columns.rows, key: queryString.columnsQuery.key };
    }

    return queryData;
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

async function checkEntry(entry_name, profile) {

    var profileParams = {
        TableName: 'PROFILES_NAME',
        Key: {
            name: profile
        }
    };
    let allowed = false;
    let permissions = await dynamo.get(profileParams).promise();
    permissions = permissions.Item;
    console.log('Permissions: ', permissions, ' Entry: ', entry_name);
    if (permissions != null && permissions.tables != null) {
        permissions = permissions.tables;
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

async function checkReadOnly(entry_name, profile) {

    var profileParams = {
        TableName: 'PROFILES_NAME',
        Key: {
            name: profile
        }
    };
    let readonly = false;
    let permissions = await dynamo.get(profileParams).promise();
    permissions = permissions.Item;

    if (permissions != null && permissions.tables != null && permissions.tables.readOnly != null) {
        permissions = permissions.tables.readOnly;
        if (permissions.indexOf(entry_name) !== -1) { // readOnly 
            readonly = true;
        }
    }
    return readonly;
}

async function isAuthorized(entry_name, company, userid) {

    if (company == null) {
        console.log('Error: No company provided!');
        return false;
    }

    // we have a company, now check if user has authorization for the table
    const profile = await getProfile(userid, company);
    const response = await checkEntry(entry_name, profile);
    return response;

}

async function isReadOnly(entry_name, company, userid) {
    const profile = await getProfile(userid, company);
    const response = await checkReadOnly(entry_name, profile);
    return response;
}

function data2xls(data, title, viewKeys) {
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

    // filter visible and map the columns

    const validKeys = viewKeys.filter(key => !key.isHidden);

    validKeys.forEach(key => {
        specification[key.key] = { displayName: key.label, headerStyle: styles.data, width: 120 }
    });

    const dataset = [];

    data.forEach(entry => {
        var value = {};
        validKeys.forEach(key => {
            value[key.key] = entry[key.key];
        });
        dataset.push(value);
    });

    const merges = [
        { start: { row: 1, column: 1 }, end: { row: 1, column: validKeys.length } }
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

async function process_properties(entry_params, table_keys, isFormRecord, client) {

    var tableProperties = {};

    if (entry_params.view_properties == null) {
        return tableProperties;
    }

    var properties = entry_params.view_properties.filter(p => isFormRecord ? p.viewType === 'formView' : p.viewType === 'tableView');

    var entry_keys = isFormRecord ? entry_params.form_keys : entry_params.table_keys;

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

    const entry_azienda = entry_keys.find(entry => (entry.key === 'codice_azienda' && entry.isPrimary));
    const entry_part = entry_keys.find(entry => (entry.key === 'codice_part' && entry.isPrimary));

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

async function setGlobalVariables(company, client,userid) {

    global_variables.global_codice_azienda = company;

    const queryString = "SELECT codice_part FROM entrasp.aziende WHERE codice_azienda='" + company + "';";
    const response = await client.query(queryString);
    if (response != null) {
        global_variables.global_codice_part = response.rows[0].codice_part;
    }

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
            companies.forEach(c => {
                if (c.name === company) { // found user's profile
                global_variables.global_userid = c.id_anagrafica;
                }
            });
        }
    }

    console.log(global_variables);

}

// main function starts here

exports.handler = async (event, context) => {

    const queryParams = event.queryStringParameters;

    const method = event.httpMethod;

    // quite a tricky method to retrieve the Cognito sub ID , would be maybe better to map it in API GW template
    // see https://forums.aws.amazon.com/thread.jspa?threadID=236366 
    const userid = event.requestContext.identity.cognitoAuthenticationProvider.split(':')[2];

    console.log('userid: ', userid);

    console.log('queryParams: ', queryParams);

    const DynamoParams = {
        TableName: 'VIEWS_NAME',
        Key: {
            entryKey: queryParams['entry_name']
        }
    };

    var search_keys = queryParams['search_keys'];
    if (search_keys) {
        search_keys = JSON.parse(search_keys); // production scenario only
    }

    var isSearchRequest = search_keys ? true : false;

    var isNewRecord = (queryParams['new'] === '1');

    var isFormRecord = (queryParams['form'] === '1');

    var isEventUpdate = (queryParams['event'] != null);

    var dashboardIndex = queryParams['dashboard_index'];

    var isExcel = (queryParams['excel'] === '1');

    //var table_keys = queryParams['keys']; // test scenario
    var table_keys = queryParams['keys'] != null ? JSON.parse(queryParams['keys']) : null; // production scenario

    var company = queryParams['company'];

    var authorized = await isAuthorized(queryParams.entry_name, company, userid);

    if (!authorized) {
        console.log(queryParams.entry_name, ' Not Authorized!');
        return {
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "statusCode": 403,
            "error": "Not Authorized"
        };
    } else {
        console.log(queryParams.entry_name, ' Authorized!');
    }

    var readOnly = await isReadOnly(queryParams.entry_name, company, userid);

    // avoid update, insert or delete if read only
    if (readOnly && (method === 'DELETE' || (method === 'POST' && !isEventUpdate))) {
        console.log(queryParams.entry_name, ' Not Authorized!');
        return {
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "statusCode": 403,
            "error": "Not Authorized"
        };
    }

    var flags = { readOnly: readOnly }; // if this is a get signal to frontend this is a readonly table

    var queryData;

    var queryString = {};

    var tableProperties;

    var attributes = {};

    try {


        var client = await pool.connect();

        // read the entry params from DynamoDB view table
        let entry_params = await dynamo.get(DynamoParams).promise();

        entry_params = entry_params.Item;

        // retrieve codice_azienda and codice_part from company if needed

        await addCodiceAzienda(table_keys, company, entry_params, client, isFormRecord || isNewRecord || isEventUpdate);

        await setGlobalVariables(company, client, userid);

        if (method === 'GET') {
            if (dashboardIndex != null) {
                queryString = getDashboardQuery(entry_params, table_keys, dashboardIndex);
            } else if (isSearchRequest) {
                queryString = getTableQuery(entry_params, table_keys, false, search_keys);
            } else if (isNewRecord) {
                queryString = getNewQuery(entry_params, table_keys);
            } else if (isFormRecord) {
                queryString = getTableQuery(entry_params, table_keys, true, null);
            } else { // table query
                queryString = getTableQuery(entry_params, table_keys, false, null);
                // add the search combos if any
                getSearchCombos(entry_params, table_keys, false, queryString.comboQueries);
            }
        } else if (method === 'POST') {
            if (isEventUpdate) {
                queryString = getEventQuery(entry_params, JSON.parse(event.body), JSON.parse(queryParams['event']), queryParams);
            } else {
                // process later
            }
        } else if (method === 'DELETE') {
            queryString = getDeleteQuery(entry_params, table_keys);
        }

        if (dashboardIndex != null) {
            // process dashboard queries
            queryData = await processDashboard(queryString, client);
        } else {
            // process query string(s) - just check if new insertion in case of POST
            queryData = await processPreMainPost(queryString, client, (isFormRecord || isNewRecord || method === 'DELETE'));
        }

        // process comboboxes and/or event queries 
        if (method === 'GET' && dashboardIndex == null || isEventUpdate) {

            if (queryData != null && isNewRecord && queryString.defaultValues != null) { // only for new records, merge default values
                queryData.forEach(item => {
                    Object.assign(item, queryString.defaultValues);
                });
            }

            if (queryString.eventQueries != null) {
                queryData = [];
                for (let index = 0; index < queryString.eventQueries.length; index++) {
                    let eventData = await client.query(queryString.eventQueries[index]);
                    queryData = queryData.concat(eventData.rows);
                }
            }

            let searchOptions = [];
            if (queryData != null && queryString.comboQueries != null && queryString.comboQueries.length) {
                for (let qd_index = 0; qd_index < queryData.length; qd_index++) {
                    for (let index = 0; index < queryString.comboQueries.length; index++) {
                        let element = queryString.comboQueries[index];
                        let query = element.comboQuery;
                        // search for local keys
                        query = replaceLocalKeys(query, queryData[qd_index]);
                        let comboData = await client.query(query);
                        if (isFormRecord || isNewRecord) { // form/new record, add combobox options to relevant field
                            let comboEntry = new Object;
                            comboEntry[element.key] = new Object;
                            comboEntry[element.key]['value'] = queryData[qd_index][element.key];
                            comboEntry[element.key]['options'] = comboData.rows;
                            Object.assign(queryData[qd_index], comboEntry);
                        }
                        else  { // table view, add search combobox to search_combos field's array
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
        }


        if (method === 'POST' && !isEventUpdate) {
            let body = JSON.parse(event.body); // production scenario 
            //let body = event.body; // test scenario
            let queryStrings = [];
            for (let index = 0; index < body.length; index++) { // process all body rows
                let keys = body[index];
                // filter out the primary keys from the row
                let primaryKeys = {};
                let newRecord = false;
                entry_params.form_keys.forEach(key => {
                    if (key.isPrimary && keys[key.key] != null && keys[key.key] !== '') {
                        primaryKeys[key.key] = keys[key.key];
                    } else if (key.isPrimary && (keys[key.key] == null || keys[key.key] === '')) {
                        newRecord = true;   // found a null/empty primary key, we are pushing a new record!
                    }
                });
                if (!newRecord) {
                    // have to check if the record exists (update) or is new (insert), so try to recover it
                    queryString = getTableQuery(entry_params, primaryKeys, true, null);
                    queryData = await processPreMainPost(queryString, client, true);
                    // perform insert or update depending on previous query
                    newRecord = queryData.length ? false : true;
                }
                queryString = getInsertUpdateQuery(entry_params, keys, newRecord);
                queryStrings.push(queryString);
            }
            // process insert/update query string(s)
            queryData = [];
            for (let index = 0; index < queryStrings.length; index++) {
                let data = await processPreMainPost(queryStrings[index], client, true);
                queryData.push(data);
            }
        }

        // disconnect from DB
        await client.release();

        // last chance to calculate the keys with an evalFunct and to process attributes

        if (method === 'GET' && dashboardIndex == null) {
            queryData = getCalculatedParams(entry_params, queryData, isFormRecord);
            // process attributeFuncts
            if (isFormRecord) {
                attributes = await processAttributeQueries(entry_params, queryData, client);
            }
            
        }

        // return colors if dashboard and colors array is defined

        if (method === 'GET' && dashboardIndex != null) {
            if (entry_params.dashboards[dashboardIndex].colors != null) {
                queryData = entry_params.dashboards[dashboardIndex].colors;
            }
        }

        if (isExcel && method === 'GET') {  // returning the Excel

            var viewKeys = isFormRecord ? entry_params.form_keys : entry_params.table_keys;
            var excelData = data2xls(queryData, queryParams.entry_name, viewKeys);
            var uuid = context.awsRequestId; // generate a 'unique' UUID as filename
            var filename = 'Excel/' + uuid + '.xlsx'
            var s3ParamsInsert = {
                Bucket: 'gorico2.reports',
                Key: filename,
                Body: excelData
            };
            var s3ParamsUrl = {
                Bucket: 'gorico2.reports',
                Key: filename
            };

            // upload to S3
            await s3.putObject(s3ParamsInsert).promise();

            var url = s3.getSignedUrl('getObject', s3ParamsUrl);

            return {
                "isBase64Encoded": false,
                "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                "statusCode": 200,
                "body": JSON.stringify({ result: 'OK', url: url })
            }
        }

    } catch (e) {
        console.log(e);
        await client.release();
        return {
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            "statusCode": 200,
            "body": JSON.stringify({ result: 'KO', reason: e, queryString: queryString })
        };
    }

    console.log(queryData);

    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify({ result: 'OK', flags: flags, data: queryData, attributes: attributes, properties: tableProperties })
    };
};
