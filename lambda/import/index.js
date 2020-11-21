const excel = require('node-excel-export');

const AWS = require('aws-sdk');
AWS.config.update({ region: 'REGION' });
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

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

const global_variables = {
    global_codice_azienda: '',
    global_codice_part: '',
    global_userid: 0
};

function getDateFormat() {
    var d = new Date();
    var month = d.getMonth() + 1;
    return d.getFullYear() + '-' + month.toString() + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
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

async function setGlobalVariables(company, client, userid) {

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

    console.log('global_variables', global_variables);

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

                if (typeof keys[key] === 'object' && Array.isArray(keyType.dataType) && keys[key] != null) { // key with multiple subkeys
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
        result += columns.map(c => row[c]).join('CSV_DELIMITER') + '\n';
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
            value[c] = row[c];
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

exports.handler = async (event, context) => {

    const queryParams = event.queryStringParameters;
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

                const s3ParamsInsert = {
                    Bucket: bucket,
                    Key: fileName
                };

                // create a temporary signed URL for the object 
                const signedUrl = s3.getSignedUrl('putObject', s3ParamsInsert);
                console.log(`Creating new import file: ${fileName} Url: ${signedUrl}`);

                // Response Body
                body = { result: 'OK', url: signedUrl, fileName: fileName };
            }
            else if (requestType === 'importFile') {
                // Load mandatory query params
                let fileName = queryParams['filename'];
                let table = queryParams['table'];

                // Check if mandatory query params provided
                if (!fileName || !table) {
                    // Error Response Body
                    body = { result: 'KO', reason: 'File and/or table not provided!' };
                }
                else {
                    // Load file from S3
                    const s3ParamsGetList = {
                        Bucket: bucket,
                        Key: fileName
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
                            columns = csvFile.Body.toString().split('\n')[0].replace(/'/g, '').replace(/\r/g, '').replace(/CSV_DELIMITER/g, ',');
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
                            aws_commons.create_s3_uri('${bucket}', '${fileName}','${region}')
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
            else if (requestType === 'deleteFile') {
                const fileName = queryParams['filename'];

                const s3ParamsDelete = {
                    Bucket: bucket,
                    Key: fileName
                };

                const signedUrl = s3.getSignedUrl('deleteObject', s3ParamsDelete);

                body = { result: 'OK', url: signedUrl };
            }
            else if (requestType === 'downloadTemplate') {
                // Load mandatory query params
                let table = queryParams['table'];

                console.log("Table: " + table);
                // Check if mandatory query params provided
                if (!table) {
                    // Error Response Body
                    body = { result: 'KO', reason: 'Table not provided!' };
                }
                else {
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

                const userid = event.requestContext.identity.cognitoAuthenticationProvider.split(':')[2];

                const DynamoParams = {
                    TableName: 'VIEWS_NAME',
                    Key: {
                        entryKey: queryParams['entry_name']
                    }
                };

                let entry_params = await dynamo.get(DynamoParams).promise();
                entry_params = entry_params.Item;

                await addCodiceAzienda(table_keys, company, entry_params, client, isForm);
                await setGlobalVariables(company, client, userid);

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

                let queryString = null;

                // queryString = 'SELECT * FROM entrasp.grc_riepilogo_risposte';
                let keyTypes = getKeyTypes(entry_keys);
                let calculatedWhereCond = [];

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

                }
                else {

                    queryString = 'SELECT ';
                    let comma = ''; // first entry has no comma 
                    // keep track of calculated where conditions, query becomes subqueries. 
                    // See https://stackoverflow.com/questions/47455962/using-function-result-in-where-clause-in-postgresql


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
                    console.log('queryString1', queryString);


                    if (entry_params.origin) {
                        queryString = queryString + ' FROM ' + entry_params.origin;
                    } else {  // no underlying table, skip building of main query, still there might be some combos
                        return { mainQuery: null, comboQueries: comboQueries, preProcessQueries: preProcessQueries, postProcessQueries: postProcessQueries };
                    }
                }

                if (queryString) {

                    comma = ' WHERE ';

                    for (const key in table_keys) {
                        if (table_keys.hasOwnProperty(key)) {
                            let keyType = keyTypes.find(e => (e.key === key));
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

                    console.log('queryString2', queryString);

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

                        console.log('search_params', search_params);
                    }

                    console.log('queryString3', queryString);

                    if (calculatedWhereCond.length) { // make query above
                        queryString = 'SELECT * FROM (' + queryString + ') AS sub_query ';
                        let comma = ' WHERE ';
                        calculatedWhereCond.forEach(
                            element => {
                                queryString += comma + element.key + '=' + element.delimiter + element.value + element.delimiter;
                                comma = ' AND ';
                            });
                    }

                    console.log('queryString4', queryString);

                    // add order by if present (for table view only
                    if (orderBy != null && orderBy.key != null) {
                        let order = orderBy.order === 'descending' ? ' DESC' : ' ASC';
                        queryString = queryString + ' ORDER BY ' + orderBy.key + order;
                    }

                    queryString = queryString + ';';

                    console.log('queryString5', queryString);

                    queryData = await runQuery(queryString, client);
                    // console.log('queryData', queryData);

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
                else {
                    body = { result: 'KO', reason: 'Query not found!' };
                }

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