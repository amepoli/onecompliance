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

const queryOnCompanyChange = `COMPANY_QUERY`;

const AWS = require('aws-sdk');
AWS.config.update({ region: 'eu-central-1' });
const dynamo = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const excel = require('node-excel-export');
const readXlsxFile = require('read-excel-file/node');

const helperFuncts = require('./helperFuncts');

var global_variables = {};

function isDataTypeString(type) {
    return (type.dataType === 'text' || type.dataType === 'date' || type.dataType === 'datetime' || type.dataType === 'time' || type.viewType === 'textarea')
}

function replaceGlobalkeys(queryString) {
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
    }

    return queryString;
}

function replaceLocalKeys(queryString, keys) {

    let delimiters = ['£'];
    for (var key in keys) {
        delimiters.forEach(delimiter => {
            let toReplace = delimiter + key + delimiter;
            let replacement = keys[key];
            if (replacement != null && typeof (replacement) === 'object') {
                replacement = replacement.value;
            }
            if (replacement == null) {
                replacement = 'null';
            }
            //replacement = (typeof replacement === 'string') ? '\'' + replacement.replace(/'/g, "''") + '\'' : replacement;
            //console.log('toReplace: ', toReplace, ', replacement: ', replacement);
            let newString = queryString.replace(toReplace, replacement);
            //console.log('queryString: ', queryString, ' newString: ', newString);
            while (newString !== queryString) { // handle multiple occurences
                queryString = newString;
                newString = queryString.replace(toReplace, replacement);
            }
        });
    }
    //console.log('Local replace queryString: ', queryString);
    return queryString;
}

function replaceKeys(queryString, keys, keyTypes) {

    //console.log(keys);
    var delimiters = ['$', '€', '£'];
    if (queryString) {
        // first replace the global variables, must be €-contoured
        queryString = replaceGlobalkeys(queryString);

        for (var key in keys) {
            // console.table(key);
            delimiters.forEach(delimiter => {
                let keyType = keyTypes.find(e => (e.key === key));

                if (keyType != null && keyType.subKeys != null) { // key with multiple subkeys
                    //console.log('Key with subkeys: ', keys[key], keyType);
                    // tslint:disable-next-line:forin
                    keyType.subKeys.forEach(subkey => {
                        // console.log(subKey)
                        let bracket = (delimiter === '$' && isDataTypeString(subkey)) ? '\'' : '';
                        let toReplace = delimiter + key + '.' + subkey.key + delimiter;
                        // replace single quotes with double quotes within strings to avoid errors with queries
                        let valueWithFixedQuotes = keys[key] == null ? null : subkey.dataType === 'text' ? keys[key][subkey.key].replace(/'/g, "''") : keys[key][subkey.key];
                        let replacement = keys[key] == null ? 'null' : bracket + valueWithFixedQuotes + bracket;
                        let newString = queryString.replace(toReplace, replacement);
                        while (newString !== queryString) { // handle multiple occurences
                            queryString = newString;
                            newString = queryString.replace(toReplace, replacement);
                        }
                    });
                } else if (typeof keys[key] !== 'object' || keys[key] == null || (keyType != null && (keyType.viewType === 'checkboxgroup' || keyType.viewType === 'combobox'))) {  // avoid spourious values like arrays form events - n.b.: null is 'object'
                    let bracket = (delimiter === '$' && keyType != null && isDataTypeString(keyType)) ? '\'' : '';
                    let toReplace = delimiter + key + delimiter;
                    let valueWithFixedQuotes = keys[key];
                    try {
                        valueWithFixedQuotes = (keys[key] != null && keyType != null && keyType.viewType !== 'combobox' && (keyType.dataType === 'text' || keyType.viewType === 'textarea')) ? keys[key].replace(/'/g, "''") : keys[key];
                    } catch (e) {
                        console.log("Error on key: ", key, " with value: ", keys[key]);
                    }
                    let replacement = keys[key] == null || keys[key] == undefined ? 'null' : bracket + valueWithFixedQuotes + bracket;
                    // handle checkboxgroup, converting array to string
                    replacement = (keyType != null && keyType.viewType === 'checkboxgroup') ?
                        '[' + ((keys[key] != null && keys[key].length > 0) ? keys[key].toString() : '') + ']'
                        : replacement;

                    // handle combobox
                    if (keyType != null && keyType.viewType === 'combobox') {
                        replacement = (keys[key] != null && keys[key].length > 0) ? bracket + keys[key].toString() + bracket : 'null';
                    }

                    //console.log ('toReplace: ', toReplace, ' replacement: ', replacement, ' value: ', keys[key], ' keyType: ', keyType);
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

function getKeyTypes(entry_keys) {
    let keyTypes = entry_keys.map(k => {
        return { key: k.key, viewType: k.format.viewType, dataType: k.format.dataType, subKeys: k.subKeys, isPrimary: k.isPrimary, isCalculated: k.queryFunct != null, sameOrigin: k.sameOrigin };
    });
    entry_keys.forEach(k => {
        if (k.format.viewType === 'subform') {
            keyTypes = keyTypes.concat(getKeyTypes(k.format.subform_keys));
        }
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

function getComboFuncts(comboQueries, entry_keys, table_keys, keyTypes) {
    for (let index = 0; index < entry_keys.length; index++) {
        let element = entry_keys[index];
        if (element.format.viewType === 'combobox' || element.format.viewType === 'radiobutton' || element.format.viewType === 'checkboxgroup') {
            let comboQuery = element.format.comboQuery;
            if (comboQuery != null) {
                comboQuery = replaceKeys(comboQuery, table_keys, keyTypes);
                comboQueries.push({ key: element.key, comboQuery: comboQuery, type: element.format.viewType });
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

// build the Postgresql query from parameters
function getTableQuery(entry_params, table_keys, isForm, search_keys, additionalQueryConds) {

    let comboQueries = [];

    let preProcessQueries = [];

    let postProcessQueries = [];

    let postProcessQueriesAllRows = [];

    let preCheckQueries = [];

    let orderBy;

    let querySuffixes;

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
            additionalQueryCond = " AND " + additionalQueryCond.queryString;
        }
    }

    orderBy = entry_params.orderBy;

    querySuffixes = entry_params.querySuffixes;

    if (!entry_keys) return '';

    let keyTypes = getKeyTypes(entry_keys);

    if (isForm) { // check if we have comboboxes, then save query fields for later processing
        getComboFuncts(comboQueries, entry_keys, table_keys, keyTypes);
    }

    // process pre-defined queries for table/form view, if any

    let searchQuery;
    if (entry_params.predefinedQueries) {
        let mainQuery;
        entry_params.predefinedQueries.forEach(query => {
            if ((isForm && query.operation === "selectForm") || (!isForm && query.operation === "selectTable")) {
                if (query.type === "main" && search_keys == null) {
                    mainQuery = replaceKeys(addQueryCond(query.queryString, additionalQueryCond), table_keys, keyTypes); // only one main query allowed
                } else if (query.type === "main" && search_keys != null) {
                    searchQuery = replaceKeys(query.queryString, table_keys, keyTypes); // only one main query allowed
                } else if (query.type === "preProcessing") {
                    preProcessQueries.push(replaceKeys(addQueryCond(query.queryString, additionalQueryCond), table_keys, keyTypes));
                } else if (query.type === "postProcessing") {
                    postProcessQueries.push(replaceKeys(addQueryCond(query.queryString, additionalQueryCond), table_keys, keyTypes));
                } else if (query.type === "postProcessingAllRows") {
                    postProcessQueriesAllRows.push(replaceKeys(addQueryCond(query.queryString, additionalQueryCond), table_keys, keyTypes));
                } else if (query.type === "preCheck") {
                    preCheckQueries.push({ message: query.messageNotNull, query: replaceKeys(query.queryString, keys, keyTypes), operation: query.operation });
                }
            }
        });
        if (mainQuery) { // no need to further build main query, stop here
            if (orderBy != null && orderBy.key != null) {
                if (mainQuery.slice(-1) === ';') {
                    mainQuery = mainQuery.slice(0, -1);  // remove the final ';'
                }
                let order = orderBy.order === 'descending' ? ' DESC' : ' ASC';
                mainQuery = mainQuery + ' ORDER BY ' + orderBy.key + order + ';';
            }
            if (querySuffixes != null) {
                let querySuffix = isForm && querySuffixes.formViewSuffix != null ? querySuffixes.formViewSuffix
                    : !isForm && querySuffixes.tableViewSuffix != null ? querySuffixes.tableViewSuffix
                        : null;
                if (querySuffix != null) {
                    if (mainQuery.slice(-1) === ';') {
                        mainQuery = mainQuery.slice(0, -1);  // remove the final ';'
                    }
                    mainQuery += ' ' + querySuffix + ';';
                }
            }
            return {
                mainQuery: mainQuery,
                comboQueries: comboQueries,
                preCheckQueries: preCheckQueries,
                preProcessQueries: preProcessQueries,
                postProcessQueries: postProcessQueries,
                postProcessQueriesAllRows: postProcessQueriesAllRows
            };
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

        for (let index = 0; index < entry_keys.length; index++) {
            let element = entry_keys[index];
            if (isForm && element.format.viewType === 'subform') {
                // append the keys at the end of the array (avoiding recursion, they will be processed later in the loop)
                element.format.subform_keys.forEach(subkey => {
                    // #278
                    // Put sameOrigin if subkey does not have it
                    if (subkey['sameOrigin'] == null && element.sameOrigin != null) {
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
                fieldString = comma + '(' + replaceKeys(element.queryFunct, table_keys, keyTypes) + ') AS ' + element.key;
            }
            comma = ','; // needed only the first time
            queryString = queryString + fieldString;

        };

        if (entry_params.origin) {
            queryString = queryString + ' FROM ' + entry_params.origin;
        } else {  // no underlying table, skip building of main query, still there might be some combos
            return {
                mainQuery: null,
                comboQueries: comboQueries,
                preCheckQueries: preCheckQueries,
                preProcessQueries: preProcessQueries,
                postProcessQueries: postProcessQueries,
                postProcessQueriesAllRows: postProcessQueriesAllRows
            };
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

        //console.log("Query so far: ", queryString);

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
        comma = ' WHERE ';
        calculatedWhereCond.forEach(
            element => {
                queryString += comma + element.key + '=' + element.delimiter + element.value + element.delimiter;
                comma = ' AND ';
            });
    }

    queryString = addQueryCond(queryString, additionalQueryCond);

    if (queryString.slice(-1) === ';') {
        queryString = queryString.slice(0, -1);  // remove the final ';'
    }

    // add order by if present (for table view only
    if (orderBy != null && orderBy.key != null) {
        let order = orderBy.order === 'descending' ? ' DESC' : ' ASC';
        queryString = queryString + ' ORDER BY ' + orderBy.key + order;
    }

    // add suffix if present
    if (querySuffixes != null) {
        let querySuffix = isForm && querySuffixes.formViewSuffix != null ? querySuffixes.formViewSuffix
            : !isForm && querySuffixes.tableViewSuffix != null ? querySuffixes.tableViewSuffix
                : null;
        if (querySuffix != null) {
            queryString += ' ' + querySuffix;
        }
    }

    queryString = queryString + ';';

    queryString = replaceKeys(queryString, table_keys, keyTypes);

    return {
        mainQuery: queryString,
        comboQueries: comboQueries,
        preCheckQueries: preCheckQueries,
        preProcessQueries: preProcessQueries,
        postProcessQueries: postProcessQueries,
        postProcessQueriesAllRows: postProcessQueriesAllRows
    };

}

function getCustomQuery(entry_params, customQueryButtonKey) {
    if (entry_params.table_keys != null && entry_params.table_keys.length > 0) {
        let buttonTableKey = entry_params.table_keys.filter(el => el.key == customQueryButtonKey);
        if (buttonTableKey != null && buttonTableKey.length > 0) {
            buttonTableKey = buttonTableKey[0];
            if (buttonTableKey.buttonAction && buttonTableKey.buttonAction.action == 'query') {
                return buttonTableKey.buttonAction.query;
            }
        }
    }
    return null;
}

function getTableMultiSelectionActionQuery(entry_params, tableMultiSelectionActionParams) {
    let queryString = null;
    let tableMultiSelectionActions = entry_params.Item.table_multiselection_actions;
    
    if (tableMultiSelectionActions != null && tableMultiSelectionActions.length > 0) {        
        if(tableMultiSelectionActionParams.viewType === 'button') {
            let buttonEl = tableMultiSelectionActions.filter(el => el.key == tableMultiSelectionActionParams.key);
            if (buttonEl != null && buttonEl.length > 0) {
                buttonEl = buttonEl[0];
                queryString = buttonEl.query;                
            }
        }
        else {
            let menuEl = tableMultiSelectionActions.filter(el => el.key == tableMultiSelectionActionParams.menuKey);
            if (menuEl != null && menuEl.length > 0) {
                menuEl = menuEl[0];
                if (menuEl.menuOptions && menuEl.menuOptions.length > 0) {
                    let buttonEl = menuEl.menuOptions.filter(el => el.key == tableMultiSelectionActionParams.key);
                    if (buttonEl != null && buttonEl.length > 0) {
                        buttonEl = buttonEl[0];
                        queryString = buttonEl.query;                
                    }
                }
            }
        }
    }

    if(queryString != null && tableMultiSelectionActionParams != null && tableMultiSelectionActionParams.keys) {
        queryString = replaceGlobalkeys(queryString);        
        Object.keys(tableMultiSelectionActionParams.keys).forEach(key => {
            queryString = queryString.replace(`$${key}$`, tableMultiSelectionActionParams.keys[key]);
        });
    }

    console.log('TableMultiSelectionActionQuery: ', queryString);
    return queryString;
}

function getHomepageQuery(entry_params) {
    let queryString = {};
    let homepage = entry_params.Item;    
    if (homepage != null && homepage.tabs != null && homepage.tabs.length > 0) {
        queryString['tabBadgeQueries'] = homepage.tabs.map( tab => {
            return {entry: tab.entry, query: replaceGlobalkeys(tab.badgeQuery)}
        });
    }
    return queryString;
}

function getCompanyChangeQuery() {
    return replaceGlobalkeys(queryOnCompanyChange);
}

function getHomepageTabQuery(entry_params) {
    let queryString = {};
    let homepageTab = entry_params.Item;    
    if (homepageTab != null && homepageTab.tiles != null && homepageTab.tiles.length > 0) {
        queryString['tabTilesQueries'] = homepageTab.tiles.filter(tile => tile.content && tile.content.query).map( tile => {
            return {entry: tile.content.fieldName, query: replaceGlobalkeys(tile.content.query)}
        });
    }
    if (homepageTab != null && homepageTab.toolbar_elements != null && homepageTab.toolbar_elements.length > 0) {
        queryString['tabToolbarElementsQueries'] = homepageTab.toolbar_elements.filter(toolbar_element => toolbar_element.comboQuery).map( toolbar_element => {
            return {entry: toolbar_element.fieldName, query: replaceGlobalkeys(toolbar_element.comboQuery)}
        });
    }
    return queryString;
}

function getLazyComboQuery(entry_keys, table_keys, keyTypes, lazy_key, event_keys) {

    let keys = event_keys != null && event_keys.length? JSON.parse(event_keys): {};

    let comboQueries = [];

    getComboFuncts(comboQueries, entry_keys, table_keys, keyTypes);

    let comboQuery = comboQueries.find(q => (q.key === lazy_key));

    comboQuery = replaceGlobalkeys(comboQuery.comboQuery);
    comboQuery = replaceKeys(comboQuery, keys, keyTypes);
    comboQuery = replaceLocalKeys(comboQuery, keys);

    console.log('ComboQuery: ', comboQuery);

    if (comboQuery != null) {
        return {
            mainQuery: comboQuery
        }
    } else {
        return null;
    }

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
            comboQueries.push({ key: element.fieldName, comboQuery: comboQuery, type: element.format.viewType });
        }
    });
}

function getEventQuery(entry_params, body, eventInfo, queryParams) {

    let entry_keys = entry_params.form_keys;
    let eventQueries = [];  // exploit preprocess queries to run the event queries
    let comboQueries = [];
    let table_keys = body;  // keys provided with body
    //console.log("Event body: ", body);
    let keyTypes = getKeyTypes(entry_keys);

    if (eventInfo.type === 'combo_lazy_loading') {
        return getLazyComboQuery(entry_keys, table_keys, keyTypes, eventInfo.field, queryParams['keys']);
    }

    const findKey = (dataset, param) => {
        let found = dataset.find(field => field.key === param);
        if (found == null) {
            for (let i = 0; i < dataset.length; i++) {
                if (dataset[i].format.viewType === 'subform') {
                    found = findKey(dataset[i].format.subform_keys, param);
                    if (found != null) {
                        break;
                    }
                }
            }
        }
        return found;
    };
    let field_key = findKey(entry_keys, eventInfo.field);

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
                // re-run comboQuery if combobox and updating the value
                if (field_key.format != null && field_key.format.comboQuery != null && eventInfo.type === 'query') {
                    comboQueries.push({ key: field_key.fieldName, comboQuery: replaceKeys(field_key.format.comboQuery, table_keys, keyTypes), type: field_key.format.viewType });
                }
            }
            else {
                // Message stuff
                // Let's see if there's any show_message action
                field_key.inputEvents.forEach(
                    event => {
                        if (event.actionType === 'show_message' && event.eventName === eventInfo.name) {
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

    return {
        mainQuery: '',
        preCheckQueries: [],
        preProcessQueries: [],
        postProcessQueries: [],
        postProcessQueriesAllRows: [],
        comboQueries: comboQueries,
        eventQueries: eventQueries
    };

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
            comboQueries.push({ key: element.key, comboQuery: comboQuery, type: element.format.viewType });
        }
    });

    return {
        mainQuery: null,
        comboQueries: comboQueries,
        preCheckQueries: [],
        preProcessQueries: [],
        postProcessQueries: [],
        postProcessQueriesAllRows: [],
        defaultValues: defaultValues
    };
}

function getInsertUpdateQuery(entry_params, keys, newRecord) {

    //console.log('entry_params: ', entry_params);
    let entry_keys = entry_params.form_keys;

    if (entry_keys == null) return '';

    let preCheckQueries = [];

    let preProcessQueries = [];

    let postProcessQueries = [];

    let keyTypes = getKeyTypes(entry_keys);

    let primaryKeys = entry_keys.filter(key => key.isPrimary === true);

    let autoGenKeyEntry = entry_keys.find(key => key.autoGenerate === true);

    let autoGenKey = autoGenKeyEntry != null && autoGenKeyEntry.key != null ? autoGenKeyEntry.key : null;
    let autoGenType = autoGenKeyEntry != null && autoGenKeyEntry.format != null ? autoGenKeyEntry.format.dataType : null;

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
                } else if (query.type === "preCheck") {
                    preCheckQueries.push({ message: query.messageNotNull, query: replaceKeys(query.queryString, keys, keyTypes), operation: query.operation });
                }
            }
        });
        if (mainQuery) { // no need to further build main query, stop here
            return {
                mainQuery: mainQuery,
                comboQueries: [],
                preCheckQueries: preCheckQueries,
                preProcessQueries: preProcessQueries,
                postProcessQueries: postProcessQueries,
                postProcessQueriesAllRows: []
            };
        }
    }

    // automatic build of main query

    let queryString = newRecord ? 'INSERT INTO ' + entry_params.origin + ' (' : 'UPDATE ' + entry_params.origin + ' SET ';

    let genString;

    let comma;

    if (autoGenKey != null && newRecord) {  // retrieve the new ID 
        if (autoGenType == 'number') {
            genString = 'SELECT (COALESCE(MAX(' + autoGenKey + '),0)+1) FROM ' + entry_params.origin;
        } else if (autoGenType == 'text') { // string
            genString = 'SELECT (COALESCE(MAX(' + autoGenKey + '::numeric), 0)+1)::varchar FROM ' + entry_params.origin;
        }

        comma = ' WHERE ';
        for (const key in keys) {
            if (keys.hasOwnProperty(key)) {
                let keyType = keyTypes.find(e => (e.key === key));
                if (!keyType.isPrimary || keyType.key === autoGenKey) continue; // avoid to add non primary keys to the WHERE condition
                let delimiter = isDataTypeString(keyType) ? '\'' : '';
                let element = keys[key];
                // replace single quotes with double quotes in strings
                if (element != null) {
                    element = ((keyType.dataType === 'text' || keyType.viewType === 'textarea')) ? element.replace(/'/g, "''") : element;
                }
                let fieldString = comma + key + '=' + delimiter + element + delimiter;
                genString = genString + fieldString;
                comma = ' AND '; // needed only the first time
            }
        }
        if (autoGenType == 'text') {
            genString = genString + comma + autoGenKey + " ~ '^-?[0-9]+.?[0-9]*$' AND " + autoGenKey + " !~ '(\\/|_)'";
        }
    }

    comma = ''; // first entry has no comma 

    let values = {};

    entry_keys.forEach(element => {

        if (element.key == null || (element.insertUpdateFunct == null && (element.sameOrigin != null && !element.sameOrigin) || element.queryFunct != null
            || element.subKeys != null || element.format.viewType === 'subform')) { // skip foreing columns
            return;
        }

        let value;
        let keyType = keyTypes.find(e => (e.key === element.key));

        if (element.insertUpdateFunct != null) { // predefined query for inserting/updating this field
            value = '(' + replaceKeys(element.insertUpdateFunct, keys, keyTypes) + ')';
            keyType.dataType = keyType.viewType = null; // avoid to get further quotes added 
        } else if (element.autoGenerate && newRecord && genString != null) {  // it is an autogenerate value
            value = '(' + genString + ')'; // pass the generation query string as value 
            keyType.dataType = keyType.viewType = null; // avoid to get further quotes added 
        } else if (keys[element.key] == null) {  // no value passed for the key
            // Save the null value of combobox if we are updating 
            if (element.format != null && element.format.viewType === 'combobox' && !newRecord) {
                value = keys[element.key];
            }
            else {
                if (element.format.value) {
                    value = element.format.value; // use default value 
                    //keyType.dataType = keyType.viewType = null; // avoid to get further quotes added 
                } else {
                    return;   // no value passed and no default, skip the key
                }
            }
        } else {
            value = keys[element.key];
        }

        queryString = queryString + comma + element.key;
        values[element.key] = value;
        if (!newRecord) { // values set immediately for UPDATE, later in the query for INSERT
            if (value) {
                let delimiter = isDataTypeString(keyType) ? '\'' : '';
                if (value && value.id) { // combobox 
                    value = value.id;
                }
                // if (keyType.viewType === 'combobox' && !value) {
                //     value = 'null';
                // }
                // replace single quotes with double quotes in strings
                value = ((keyType.dataType === 'text' && keyType.viewType === 'input') || keyType.viewType === 'textarea') ? value.replace(/'/g, "''") : value;
                queryString = queryString + '=' + delimiter + value + delimiter;
            }
            else {
                queryString = queryString + '=' + value;

            }
        }
        comma = ', ';
    });

    if (newRecord) { // complete the INSERT query
        comma = ') VALUES (';
        for (const key in values) {
            let keyType = keyTypes.find(e => (e.key === key));
            let delimiter = isDataTypeString(keyType) ? '\'' : '';
            let value = values[key];
            if (value && value.id) { // combobox 
                value = value.id;
            }
            if (keyType.viewType === 'combobox' && !value) {
                value = 'null';
            }
            // replace single quotes with double quotes in strings
            value = (keyType.dataType === 'text' || keyType.viewType === 'textarea') ? value.replace(/'/g, "''") : value;
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
        keyTypes = getKeyTypes(entry_keys);  // regenerate keyTypes as they have been modified above 
        primaryKeys.forEach(primaryKey => {
            let keyType = keyTypes.find(e => (e.key === primaryKey.key));
            let delimiter = isDataTypeString(keyType) ? '\'' : '';
            let element = keys[primaryKey.key];
            // replace single quotes with double quotes in strings
            element = (keyType.dataType === 'text' || keyType.viewType === 'textarea') ? element.replace(/'/g, "''") : element;
            let fieldString = comma + primaryKey.key + '=' + delimiter + element + delimiter;
            queryString = queryString + fieldString;
            comma = ' AND '; // needed only the first time
        });
    }

    queryString += ';';

    return {
        mainQuery: queryString,
        comboQueries: [],
        preCheckQueries: preCheckQueries,
        preProcessQueries: preProcessQueries,
        postProcessQueries: postProcessQueries,
        postProcessQueriesAllRows: []
    };
}

async function runInsertUpdatePostProcessingRowQueries(entry_params, keys, client) {

    let postProcessQueriesAllRows = [];

    let entry_keys = entry_params.form_keys;

    let keyTypes = getKeyTypes(entry_keys);

    if (entry_params.predefinedQueries) {
        entry_params.predefinedQueries.forEach(query => {
            if ((query.operation === "insert" || query.operation === "update") && query.type === "postProcessingAllRows") {
                postProcessQueriesAllRows.push(replaceKeys(query.queryString, keys, keyTypes));
            }
        });
    }

    for (let i = 0; i < postProcessQueriesAllRows.length; i++) {
        let query = postProcessQueriesAllRows[i];
        console.log('Running post processing all rows query: ', query);
        await client.query(query);
    }

}

function getDeleteQuery(entry_params, table_keys) {

    let preProcessQueries = [];

    let postProcessQueries = [];

    let postProcessQueriesAllRows = [];

    let preCheckQueries = [];

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
                } else if (query.type === "postProcessingAllRows") {
                    postProcessQueriesAllRows.push(replaceKeys(query.queryString, table_keys, keyTypes));
                } else if (query.type === "preCheck") {
                    preCheckQueries.push({ message: query.messageNotNull, query: replaceKeys(query.queryString, keys, keyTypes), operation: query.operation });
                }
            }
        });
        if (mainQuery) { // no need to further build main query, stop here
            return {
                mainQuery: mainQuery,
                preCheckQueries: preCheckQueries,
                preProcessQueries: preProcessQueries,
                postProcessQueries: postProcessQueries,
                postProcessQueriesAllRows: postProcessQueriesAllRows
            };
        }
    }

    // automatic build of main query

    let queryString = 'DELETE FROM ' + entry_params.origin;

    let comma = ' WHERE ';

    for (const key in table_keys) {
        if (table_keys.hasOwnProperty(key)) {
            let keyType = keyTypes.find(e => (e.key === key));
            let delimiter = isDataTypeString(keyType) ? '\'' : '';
            let element = table_keys[key];
            // replace single quotes with double quotes in strings
            element = (keyType.dataType === 'text' || keyType.viewType === 'textarea') ? element.replace(/'/g, "''") : element;
            let fieldString = comma + key + '=' + delimiter + element + delimiter;
            queryString = queryString + fieldString;
            comma = ' AND '; // needed only the first time
        }
    }

    return {
        mainQuery: queryString,
        comboQueries: [],
        preCheckQueries: preCheckQueries,
        preProcessQueries: preProcessQueries,
        postProcessQueries: postProcessQueries,
        postProcessQueriesAllRows: postProcessQueriesAllRows
    };

}

function getFormActionQuery(formActionType, keys, entry_params) {

    let entry_keys = entry_params.form_keys;
    // if (entry_keys == null) {
    //     returnValue.error = "Something wrong with provided data";
    //     return returnValue;
    // }

    let keyTypes = getKeyTypes(entry_keys);

    let mainQuery = null;
    let preCheckQueries = [];

    if (entry_params.predefinedQueries != null && entry_params.predefinedQueries.length > 0) {
        entry_params.predefinedQueries
            .filter(el => el.operation == formActionType)
            .forEach(element => {
                if (element.type === 'main') {
                    if (element.queryString) {
                        mainQuery = replaceKeys(element.queryString, keys, []);
                    }
                }
                else if (element.type === 'preCheck') {
                    preCheckQueries.push({ message: element.messageNotNull, query: replaceKeys(element.queryString, keys, []), operation: element.operation });
                }
            }
            );
    }

    return {
        mainQuery: mainQuery,
        preCheckQueries: preCheckQueries
    };
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

    //console.log('Attribute Array:  ', attributeFunctArray);

    for (let i = 0; i < attributeFunctArray.length; i++) {
        const attributeFunctEl = attributeFunctArray[i];
        const attributeFunct = attributeFunctEl.attributeFunct;
        const entry_key = attributeFunctEl.key;
        if (attributeFunct.queryString == null || attributeFunct.attributeType == null || (attributeFunct.attributeType === 'style' && attributeFunct.styleAttribute == null)) {
            continue;
        }
        for (let j = 0; j < keys.length; j++) {
            //console.log('Attribute: ', attributeFunct.queryString, keys[j], keyTypes);
            const query = replaceKeys(attributeFunct.queryString, keys[j], keyTypes);
            //console.log('Query attributes: ', query);
            let result = await client.query(query);
            result = result.rows[0];
            //console.log('Query attributes result: ', result);
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

async function processPreCheck(queryString, client, operationType) {

    let local_keys = {}; // additional keys generated with pre-processing  
    //console.log('queryString : ', queryString);

    let preErrors = [];

    if (queryString == null) {
        return preErrors;
    }

    // pre check
    if (queryString.preCheckQueries != null && queryString.preCheckQueries.length) {
        for (let index = 0; index < queryString.preCheckQueries.length; index++) {
            let operation = queryString.preCheckQueries[index].operation;
            if (operation != operationType) {
                continue;
            }
            let query = queryString.preCheckQueries[index].query;
            let message = queryString.preCheckQueries[index].message;
            query = replaceLocalKeys(query, local_keys);
            let result = await client.query(query);
            if (result) {
                if (Array.isArray(result.rows)) {
                    if (result.rows.length > 0) {
                        preErrors.push(message);
                    }
                }
                else if (result.rows) {
                    preErrors.push(message);
                }
            }
        }
    }
    //console.log("Pre check errors: ", preErrors);
    return preErrors;
}

function returnPreCheckResult(preErrors) {
    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify({ result: 'KO', preErrors: preErrors })
    };
}


async function processPreMainPost(queryString, client, notFullTable, isGet) {

    let local_keys_pre = {}; // additional keys generated with pre-processing  

    let queryData = [{}];

    //console.log('queryString : ', queryString);

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
        console.log('Running main query : ', query);
        queryData = await client.query(query);
        queryData = queryData.rows;
        console.log('Main query : ', query, ' result : ', queryData);
    }

    if (queryString.postProcessQueries != null && queryString.postProcessQueries.length) {
        queryData = await postProcess(queryString.postProcessQueries, client, queryData, local_keys_pre, notFullTable, !isGet);
    }

    if (queryString.postProcessQueriesAllRows != null && queryString.postProcessQueriesAllRows.length) {
        queryData = await postProcess(queryString.postProcessQueriesAllRows, client, queryData, local_keys_pre, false, true);
    }

    return queryData;
}

async function postProcess(queries, client, queryData, local_keys_pre, notFullTable, allRows) {
    let local_keys_post = {}; // additional keys generated with post-processing
    let local_keys_post_allRows = [];

    // post-processing, exclude table view
    if (queries != null && queries.length) { // post-processing 
        let haveMainData = queryData.length > 0;
        // let maxindex = haveMainData ? queryData.length : 1; 
        let maxindex = allRows ? 1 : queryData.length; // run the queries once if is insert/update/delete, one per row if get
        for (let row_index = 0; row_index < maxindex; row_index++) {
            local_keys_post = haveMainData ? Object.assign(local_keys_pre, queryData[row_index]) : local_keys_post;
            for (let index = 0; index < queries.length; index++) {
                let query = queries[index];
                query = replaceLocalKeys(query, local_keys_post);
                let result = await client.query(query);
                let rawResult = result;
                result = notFullTable ? result.rows[0] : result.rows;
                // check if we are in a allRows scenario
                let multipleRows = Array.isArray(result);
                if (!multipleRows) {
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
                } else { // one shot, multiple rows
                    for (let row_index2 = 0; row_index2 < result.length; row_index2++) {
                        if (local_keys_post_allRows[row_index2] == null) {
                            local_keys_post_allRows.push(result[row_index2]);
                        } else {
                            local_keys_post_allRows[row_index2] = Object.assign(local_keys_post_allRows[row_index2], result[row_index2]);
                        }
                        if (haveMainData) {
                            queryData[row_index2] = Object.assign(queryData[row_index2], result[row_index2]);
                        }
                    }
                }
                console.log('Post query : ', query, ' result : ', result, ' raw result: ', rawResult);
            }
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

async function processCustomQuery(queryString, keys, client) {
    if (queryString != null) {
        queryString = replaceGlobalkeys(queryString);
        queryString = replaceLocalKeys(queryString, keys);
        try {
            let result = await client.query(queryString);
            if (result.rows != null && result.rows.length > 0) {
                result = result.rows[0];
            }
            return {
                "isBase64Encoded": false,
                "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                "statusCode": 200,
                "body": JSON.stringify({ result: 'OK', response: result, queryString: queryString })
            };
        }
        catch (e) {
            console.log('Custom Query Error: ', e);
            return {
                "isBase64Encoded": false,
                "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                "statusCode": 200,
                "body": JSON.stringify({ result: 'KO', error: e, queryString: queryString })
            };
        }
    }
}

async function processHomepageQuery(entry_params, queryString, client) {
   let homepage = entry_params.Item;
    if (queryString != null) {
        if(queryString['tabBadgeQueries'] && queryString['tabBadgeQueries'].length) {
            for(let tabIndex = 0; tabIndex < queryString['tabBadgeQueries'].length; tabIndex++) {
                try {
                    console.log('Running query: ' + queryString['tabBadgeQueries'][tabIndex].query);                    
                    let result = await client.query(queryString['tabBadgeQueries'][tabIndex].query);
                    console.log('Result: ', JSON.stringify(result));
                    if (result != null && result.rowCount > 0) {                        
                        let key = Object.keys(result.rows[0])[0];
                        let data = result.rows[0][key];
                        for(let i = 0; i < homepage.tabs.length; i++) {
                            if(homepage.tabs[i].entry === queryString['tabBadgeQueries'][tabIndex].entry) {
                                homepage.tabs[i].badgeValue = data;
                            }
                        }
                    }
                }
                catch(e) {
                    console.log('Error occured while running query: ' + queryString['tabBadgeQueries'][tabIndex].query);
                }
            }
        }        
    }
    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify({ result: 'OK', response: homepage, queryString: queryString })
    }
}

async function processHomepageTabQuery(entry_params, queryString, search_keys, client) {
    let tilesView = entry_params.Item;
    
    let searchQueries = [];

    if (search_keys != null) {
        let search_keys_keys = Object.keys(search_keys);
        let toolBarElementsIncludedInQuery = tilesView.toolbar_elements.filter(e => search_keys_keys.includes(e.fieldName));
        for(let i = 0; i < toolBarElementsIncludedInQuery.length; i++) {
            search_keys_keys.forEach( k => {
                toolBarElementsIncludedInQuery[i].queryCond = toolBarElementsIncludedInQuery[i].queryCond.replace('$' + k + '$', search_keys[k]);
            });
            searchQueries.push(toolBarElementsIncludedInQuery[i].queryCond);
        }

    }
    
    if (queryString != null) {
        if(queryString['tabTilesQueries'] && queryString['tabTilesQueries'].length) {
            for(let tileIndex = 0; tileIndex < queryString['tabTilesQueries'].length; tileIndex++) {
                let tileQuery = queryString['tabTilesQueries'][tileIndex].query;
                if(searchQueries.length){
                    if(tileQuery.toLowerCase().includes(' where ')) {
                        tileQuery += ' AND ' + searchQueries.join(' AND '); 
                    }
                    else {
                        tileQuery += ' WHERE ' + searchQueries.join(' AND '); 
                    }
                }
                tileQuery += ';';
                try {                    
                    console.log('Running query: ' + tileQuery);
                    let result = await client.query(tileQuery);
                    console.log('Result: ', JSON.stringify(result));
                    if (result != null && result.rowCount > 0) {                        
                        let key = Object.keys(result.rows[0])[0];
                        let data = result.rows[0][key];
                        for(let i = 0; i < tilesView.tiles.length; i++) {
                            if(tilesView.tiles[i].content.fieldName === queryString['tabTilesQueries'][tileIndex].entry) {
                                tilesView.tiles[i].content.value = data;
                            }
                        }
                    }
                }
                catch(e) {
                    console.log('Error occured while running query: ' + tileQuery);
                }
            }
        }

        if(queryString['tabToolbarElementsQueries'] && queryString['tabToolbarElementsQueries'].length) {
            for(let elementIndex = 0; elementIndex < queryString['tabToolbarElementsQueries'].length; elementIndex++) {
                try {
                    console.log('Running query: ' + queryString['tabToolbarElementsQueries'][elementIndex].query);                    
                    let result = await client.query(queryString['tabToolbarElementsQueries'][elementIndex].query);
                    console.log('Result: ', JSON.stringify(result));
                    if (result != null && result.rowCount > 0) {                        
                        let keyId = Object.keys(result.rows[0])[0];
                        let keyName = Object.keys(result.rows[0])[1];
                        let data = result.rows.map(row => {
                            return {
                                id: row[0],
                                name: row[1]
                            }
                        });
                        for(let i = 0; i < tilesView.tiles.length; i++) {
                            if(tilesView["toolbar_elements"][i].fieldName === queryString['tabToolbarElementsQueries'][elementIndex].entry) {
                                tilesView["toolbar_elements"][i]["options"] = result.rows;
                            }
                        }
                    }
                }
                catch(e) {
                    console.log('Error occured while running query: ' + queryString['tabToolbarElementsQueries'][elementIndex].query);
                }
            }
        }
    }
    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify({ result: 'OK', response: tilesView })
    }
}

async function processCompanyChangeQuery(queryString, client) {
    let queryResult = await client.query(queryString);
    console.log('CompanyChangeQuery Result: ', JSON.stringify(queryResult));
    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify({ result: 'OK', response: queryResult })
    }
}

async function processTableMultiSelectionActionQuery(queryString, client) {
    let queryResult = await client.query(queryString);
    console.log('TableMultiSelectionActionQuery Result: ', JSON.stringify(queryResult));
    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify({ result: 'OK', response: queryResult })
    }
}


async function processFormActionQuery(formActionType, queryString, keys, client) {
    if (queryString != null) {
        console.log('queryString: ', queryString);
        if (queryString.preCheckQueries && queryString.preCheckQueries.length) {
            let preCheckErrors = await processPreCheck(queryString, client, formActionType);
            if (preCheckErrors && preCheckErrors.length) {
                return {
                    "isBase64Encoded": false,
                    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    "statusCode": 200,
                    "body": JSON.stringify({ result: 'KO', reason: preCheckErrors })
                };
            }
        }

        if (queryString.mainQuery) {
            console.log(`Running ${formActionType} query`);

            // queryString = replaceGlobalkeys(queryString);
            // queryString = replaceLocalKeys(queryString, keys);
            try {
                let result = await client.query(queryString.mainQuery);
                if (result.rows != null && result.rows.length > 0) {
                    result = result.rows[0];
                }
                return {
                    "isBase64Encoded": false,
                    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    "statusCode": 200,
                    "body": JSON.stringify({ result: 'OK', response: result, queryString: queryString })
                };
            }
            catch (e) {
                console.log(`${formActionType} Query Error: `, e);
                return {
                    "isBase64Encoded": false,
                    "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                    "statusCode": 200,
                    "body": JSON.stringify({ result: 'KO', error: e, queryString: queryString })
                };
            }
        }
        else {
            return {
                "isBase64Encoded": false,
                "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                "statusCode": 200,
                "body": JSON.stringify({ result: 'KO', error: ['No main query provided'] })
            };
        }
    }
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

    data = await helperFuncts.overrideTable('PROFILES_NAME', data.Item, dynamo);

    data = await helperFuncts.includeTable('PROFILES_NAME', data, dynamo);

    return data;
}


function isAuthorized(entry_name, profileData) {

    let allowed;

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

function getProfileHideActions(entry_name, profileData) {
    let profileHideActions = [];
    if (profileData != null && profileData.tables.table_actions != null) {
        let tableActions = profileData.tables.table_actions;
        let entryTableActions = tableActions.filter(x => x.entry == entry_name);
        if (entryTableActions != null && entryTableActions.length > 0) {
            entryTableActions = entryTableActions[0];
            if (entryTableActions.hide) {
                profileHideActions = entryTableActions.hide;
            }
        }
    }
    return profileHideActions;
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

    //console.log('Keys: ', keys);

}


function getAdditionalQueryCond(entry_name, profileData) {

    var queryConds = [];

    if (profileData != null && profileData.tables != null && profileData.tables.queryCond != null) {
        let queryCond = profileData.tables.queryCond;
        queryConds = queryCond.filter(cond => cond.entry === entry_name);
    }

    return queryConds;
}

function hasIsInsertQuery(entry_params, keys, queryString) {

    let entry_keys = entry_params.form_keys;
    let returnValue = {
        query: null,
        error: null
    }

    let predefinedInsert = false;
    let predefinedIsInsertQuery = null;
    let preCheckQueries = [];

    if (entry_keys == null) {
        returnValue.error = "Something wrong with provided data";
        return returnValue;
    }

    let keyTypes = getKeyTypes(entry_keys);

    if (entry_params.predefinedQueries) {
        entry_params.predefinedQueries.forEach(query => {
            if ((query.type === "main") && (query.operation === "insert")) {
                predefinedInsert = true;
            } else if ((query.type === "main") && (query.operation === "isInsert")) {
                predefinedIsInsertQuery = replaceKeys(query.queryString, keys, keyTypes);
            } else if ((query.type === "preCheck") && ((query.operation === "insert") || (query.operation === "update"))) {
                preCheckQueries.push({ message: query.messageNotNull, query: replaceKeys(query.queryString, keys, keyTypes), operation: query.operation });
            }
        });
    }

    if (!predefinedInsert && predefinedIsInsertQuery == null) {
        returnValue.query = null;
    } else if (predefinedInsert && predefinedIsInsertQuery != null) {
        returnValue.query = predefinedIsInsertQuery;
    } else { // something wrong with configuration
        returnValue.error = "Something wrong with the configuration"
        return returnValue
    }

    queryString.preCheckQueries = preCheckQueries;
    return returnValue;
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

    
    
    var isFormRecord = (queryParams['form'] === '1');
    
    var isEventUpdate = (queryParams['event'] != null);
    
    var isHomepage =  (queryParams['homepage'] === '1');
    
    var isHomepageTab =  (queryParams['homepagetab'] === '1');
    
    var isTableMultiSelectionActionQuery = (queryParams['table_multi_selection_action_query'] === '1');
    var tableMultiSelectionActionParams = null;
    
    if(isTableMultiSelectionActionQuery) {
        tableMultiSelectionActionParams = JSON.parse(event.body);
    }

    var dashboardIndex = queryParams['dashboard_index'];
    
    var isExcel = (queryParams['excel'] === '1');
    
    var isCustomQuery = (queryParams['custom_query'] === '1');;
    var customQueryButtonKey = queryParams['custom_query_key'];
    
    var isCompanyChangeQuery = (queryParams['company_change_query'] === '1');;
    
    var isFormAction = queryParams['isFormAction'] === '1';
    var formActionType = queryParams['formActionType'];
    
    var search_keys = queryParams['search_keys'];
    if (search_keys) {
        search_keys = JSON.parse(search_keys); // production scenario only
    }
    var isSearchRequest = (!isHomepage && !isHomepageTab && !isCompanyChangeQuery && !isTableMultiSelectionActionQuery && search_keys) ? true : false;

    var isNewRecord = (queryParams['new'] === '1');
    //var table_keys = queryParams['keys']; // test scenario
    var table_keys = queryParams['keys'] != null ? JSON.parse(queryParams['keys']) : null; // production scenario
    
    var company = queryParams['company'];

    const profile = await getProfile(userid, company);

    const profileData = await getProfileData(profile);

    var authorized = (isHomepage || isHomepageTab || isCompanyChangeQuery)? true: (isAuthorized(queryParams.entry_name, profileData));

    if (!authorized) {
        console.log(method, ' request for ', queryParams.entry_name, ' not authorized!');
        return {
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            // "statusCode": 403,
            // "error": "Not Authorized"
            "statusCode": 200,
            "body": JSON.stringify({ result: 'KO', reason: "Not Authorized" })
        };
    } else {
        console.log(method, ' request for ', queryParams.entry_name, ' authorized!');
    }

    var readOnly = isCompanyChangeQuery? true: isReadOnly(queryParams.entry_name, profileData);

    // avoid update, insert or delete if read only
    if (readOnly && (method === 'DELETE' || (method === 'POST' && !isEventUpdate))) {
        console.log(queryParams.entry_name, ' Not Authorized!');
        return {
            "isBase64Encoded": false,
            "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            // "statusCode": 403,
            // "error": "Not Authorized"
            "statusCode": 200,
            "body": JSON.stringify({ result: 'KO', reason: "Not Authorized" })
        };
    }

    var flags = { readOnly: readOnly }; // if this is a get signal to frontend this is a readonly table

    var queryData;

    var queryString = {};

    var tableProperties;

    var attributes = {};

    var additionalQueryCond = [];

    try {


        var client = await pool.connect();

        let DynamoParams = null;    
        let entry_params = null;
        
        if(!isCompanyChangeQuery) {
            if(isHomepage) {
                // Load homepage
                DynamoParams = {
                    TableName: 'HOMEPAGES_NAME',
                    Key: {
                        entryKey: 'hp_' + global_variables.global_profile
                    }
                };
            
                console.log('DynamoParams: ', DynamoParams);
                
                // read the entry params from DynamoDB view table
                entry_params = await dynamo.get(DynamoParams).promise();

                if(!entry_params || !entry_params.Item) {
                    // Load default homepage
                    DynamoParams = {
                        TableName: 'HOMEPAGES_NAME',
                        Key: {
                            entryKey: 'default'
                        }
                    };
                
                    console.log('DynamoParams: ', DynamoParams);
                    
                    // read the entry params from DynamoDB view table
                    entry_params = await dynamo.get(DynamoParams).promise();
                }
            }
            else {

                DynamoParams = {
                    TableName: 'VIEWS_NAME',
                    Key: {
                        entryKey: queryParams['entry_name']
                    }
                };
            
                console.log('DynamoParams: ', DynamoParams);
                
                // read the entry params from DynamoDB view table
                entry_params = await dynamo.get(DynamoParams).promise();    
            }
        }

        if(!isTableMultiSelectionActionQuery &&  !isHomepage && !isHomepageTab && !isCompanyChangeQuery) {
            // complete table if inherited
            entry_params = await helperFuncts.overrideTable('VIEWS_NAME', entry_params.Item, dynamo);

            // replace constants
            entry_params = replaceJSONParams(entry_params, entry_params.define)

            // retrieve codice_azienda and codice_part from company if needed

            await addCodiceAzienda(table_keys, company, entry_params, client, isFormRecord || isNewRecord || isEventUpdate);

            // retrieve additional query conditions from profile (if any)

            additionalQueryCond = getAdditionalQueryCond(queryParams.entry_name, profileData);        
        }
        
        global_variables = await helperFuncts.setGlobalVariables(company, client, userid, dynamo);
        console.log('global_variables: ', global_variables);
        
        if (method === 'GET') {
            if (dashboardIndex != null) {
                queryString = getDashboardQuery(entry_params, table_keys, dashboardIndex);
            } else if (isHomepage) {
                queryString = getHomepageQuery(entry_params);
            } else if (isHomepageTab) {
                queryString = getHomepageTabQuery(entry_params);
            } else if(isCompanyChangeQuery) {
                queryString = getCompanyChangeQuery();
            } else if (isFormAction) {
                queryString = getFormActionQuery(formActionType, table_keys, entry_params);
            } else if (isSearchRequest) {
                queryString = getTableQuery(entry_params, table_keys, false, search_keys, additionalQueryCond);
            } else if (isNewRecord) {
                queryString = getNewQuery(entry_params, table_keys);
            } else if (isFormRecord) {
                queryString = getTableQuery(entry_params, table_keys, true, null, additionalQueryCond);
                // Check if there are errors in the preCheck
                let preErrors = await processPreCheck(queryString, client, "selectForm");
                // Return if there are errors 
                if (preErrors.length > 0) {
                    await client.release();
                    return returnPreCheckResult(preErrors);
                }
            } else { // table query
                queryString = getTableQuery(entry_params, table_keys, false, null, additionalQueryCond);
                // Check if there are errors in the preCheck
                let preErrors = await processPreCheck(queryString, client, "selectTable");
                // Return if there are errors 
                if (preErrors.length > 0) {
                    await client.release();
                    return returnPreCheckResult(preErrors);
                }
                // add the search combos if any
                getSearchCombos(entry_params, table_keys, false, queryString.comboQueries);
            }
        } else if (method === 'POST') {
            if (isEventUpdate) {
                queryString = getEventQuery(entry_params, JSON.parse(event.body), JSON.parse(queryParams['event']), queryParams);
            } else if (isCustomQuery) {
                queryString = getCustomQuery(entry_params, customQueryButtonKey);
            } else if(isTableMultiSelectionActionQuery) {
                queryString = getTableMultiSelectionActionQuery(entry_params, tableMultiSelectionActionParams);
            } else {
                // process later
            }
        } else if (method === 'DELETE') {
            queryString = getDeleteQuery(entry_params, table_keys);
        }

        if (dashboardIndex != null) {
            // process dashboard queries
            queryData = await processDashboard(queryString, client);
        } else if (isHomepage) {
            let response = await processHomepageQuery(entry_params, queryString, client);
            console.log(response);
            await client.release();
            return response;
        } else if (isHomepageTab) {
            let response = await processHomepageTabQuery(entry_params, queryString, search_keys, client);
            console.log(response);
            await client.release();
            return response;
        } else if(isTableMultiSelectionActionQuery) {
            let response = await processTableMultiSelectionActionQuery(queryString, client);
            console.log(response);
            await client.release();
            return response;
        } else if(isCompanyChangeQuery) {
            let response = await processCompanyChangeQuery(queryString, client);
            console.log(response);
            await client.release();
            return response;
        } else if (isCustomQuery) {
            let response = await processCustomQuery(queryString, JSON.parse(event.body), client);
            console.log(response);
            await client.release();
            return response;
        } else if (isFormAction) {
            let response = await processFormActionQuery(formActionType, queryString, table_keys, client);
            console.log(`${formActionType} Response`, response);
            await client.release();
            return response;
            // queryData = await processPreMainPost(queryString, client, true, true);
        } else {
            // process query string(s) 
            queryData = await processPreMainPost(queryString, client, (isFormRecord || isNewRecord || method === 'DELETE'), (method === 'GET'));
        }

        // process comboboxes 
        if (method === 'GET' && dashboardIndex == null && !isEventUpdate && !isCustomQuery && !isFormAction) {

            if (queryData != null && isNewRecord && queryString.defaultValues != null) { // only for new records, merge default values
                queryData.forEach(item => {
                    Object.assign(item, queryString.defaultValues);
                });
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
                        //console.log('Combo query: ', query, ' Result: ', comboData.rows);
                        if (isFormRecord || isNewRecord) { // form/new record, add combobox options to relevant field
                            let comboEntry = new Object;
                            comboEntry[element.key] = new Object;
                            let comboValue = comboEntry[element.key]['value'] = queryData[qd_index][element.key];
                            if (element.type !== 'combobox') {
                                comboEntry[element.key]['options'] = comboData.rows;
                            } else {
                                if (comboData.rows == null) {
                                    comboEntry[element.key]['options'] = [null];
                                } else {
                                    comboEntry[element.key]['options'] = [];
                                    comboEntry[element.key]['options'].push(comboData.rows.find(e => (e.id == comboValue)));
                                }
                                // set always lazy loading to trigger reload of combos whose query is parametric with the page values
                                comboEntry[element.key]['lazyLoading'] = true;
                            }

                            Object.assign(queryData[qd_index], comboEntry);
                            //console.log("Combo Data: value->", queryData[qd_index], " key->", element.key, " options->",comboData.rows);
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
        }

        if (method === 'POST' && !isEventUpdate) {
            let body = JSON.parse(event.body); // production scenario 
            console.log('BODY values: ', body);
            //let body = event.body; // test scenario
            let queryStrings = [];
            let newRecord = false;
            for (let index = 0; index < body.length; index++) { // process all body rows
                let keys = body[index];
                newRecord = false;

                let insertCheck = hasIsInsertQuery(entry_params, keys, queryString);

                if (insertCheck.error != null) { // insert predefined query without isInsert query or viceversa
                    return returnPreCheckResult(insertCheck.error);
                }

                if (insertCheck.query != null) {
                    let result = await client.query(insertCheck.query);
                    newRecord = result.rows[0].label;
                    //console.log("NEW RECORD: Query - ",insertCheck.query, " Result - ", newRecord, " Keys - ", keys);
                } else {
                    // filter out the primary keys from the row
                    let primaryKeys = {};
                    entry_params.form_keys.forEach(key => {
                        if ((key.isPrimary && keys[key.key] != null && keys[key.key] !== '') || (table_keys[key.key] != null)) {
                            primaryKeys[key.key] = keys[key.key];
                        } else if (key.isPrimary && (keys[key.key] == null || keys[key.key] === '')) {
                            newRecord = true;   // found a null/empty primary key, we are pushing a new record!
                        }
                    });
                    if (!newRecord) {
                        // have to check if the record exists (update) or is new (insert), so try to recover it
                        queryString = getTableQuery(entry_params, primaryKeys, true, null, additionalQueryCond);
                        queryData = await processPreMainPost(queryString, client, true, false);
                        // perform insert or update depending on previous query
                        newRecord = queryData.length ? false : true;
                    }
                }

                // Check if there are errors in the insertion/update data
                let preErrors = await processPreCheck(queryString, client, newRecord ? "insert" : "update");
                // Return if there are errors in insertion
                if (preErrors.length > 0) {
                    await client.release();
                    return returnPreCheckResult(preErrors);
                }

                queryString = getInsertUpdateQuery(entry_params, keys, newRecord);
                queryStrings.push(queryString);
            }

            // process insert/update query string(s)
            console.log('Insert/update queries: ', queryStrings);
            queryData = [];

            for (let index = 0; index < queryStrings.length; index++) {
                let data = await processPreMainPost(queryStrings[index], client, true, false);
                queryData.push(data);
            }

            let keys = body[0];
            await runInsertUpdatePostProcessingRowQueries(entry_params, keys, client);
        }

        // last chance to calculate the keys with an evalFunct and to process attributes

        if (method === 'GET' && dashboardIndex == null && !isCustomQuery && !isFormAction) {
            queryData = getCalculatedParams(entry_params, queryData, isFormRecord);
            // process attributeFuncts
            if (isFormRecord) {
                attributes = await processAttributeQueries(entry_params, queryData, client);
            }

        }
        // return colors if dashboard and colors array is defined
        else if (method === 'GET' && dashboardIndex != null) {
            if (entry_params.dashboards[dashboardIndex].colors != null) {
                queryData = entry_params.dashboards[dashboardIndex].colors;
            }
        }

        // process events Queries 
        if (isEventUpdate) {
            if (queryString.eventQueries != null) {
                queryData = [];
                for (let index = 0; index < queryString.eventQueries.length; index++) {
                    let eventData = await client.query(queryString.eventQueries[index]);
                    queryData = queryData.concat(eventData.rows);
                }
            }

            // we might need to re-run combobox query of the event affected field
            if (queryString.comboQueries != null && queryString.comboQueries.length) {
                let element = queryString.comboQueries[0];
                let query = element.comboQuery;
                let comboData = await client.query(query);
                let comboValue = queryData[0][element.key];
                let options = [];
                if (element.type !== 'combobox') {
                    options = comboData.rows;
                } else {
                    if (comboData.rows == null) {
                        options = [null];
                    } else {
                        options = [comboData.rows.find(e => (e.id == comboValue))];
                    }
                }
                queryData = { value: queryData, options: options }
            }

        }



        // disconnect from DB
        await client.release();

        if (isExcel && method === 'GET') {  // returning the Excel

            var viewKeys = isFormRecord ? entry_params.form_keys : entry_params.table_keys;
            var excelData = data2xls(queryData, queryParams.entry_name, viewKeys);
            var uuid = context.awsRequestId; // generate a 'unique' UUID as filename
            var filename = 'Excel/' + uuid + '.xlsx'
            var s3ParamsInsert = {
                Bucket: 'BUCKET_NAME',
                Key: filename,
                Body: excelData
            };
            var s3ParamsUrl = {
                Bucket: 'BUCKET_NAME',
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

    queryData['profileHideActions'] = getProfileHideActions(queryParams.entry_name, profileData);
    console.log(queryData);

    return {
        "isBase64Encoded": false,
        "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        "statusCode": 200,
        "body": JSON.stringify({ result: 'OK', flags: flags, data: queryData, attributes: attributes, properties: tableProperties })
    };
};
