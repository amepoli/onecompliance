const AWS = require('aws-sdk');
AWS.config.update({
    region: 'REGION'
});
const s3 = new AWS.S3({
    apiVersion: '2006-03-01'
});

const excel = require('node-excel-export');

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

// Get Bad URL Response
function getBadUrlResponse() {
    return {
        "isBase64Encoded": false,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "statusCode": 500,
        "error": "Bad URL"
    };
}

function getDateFormatted() {
    var d = new Date();
    var month = d.getMonth() + 1;
    return d.getFullYear() + '-' + month.toString() + '-' + d.getDate();
}

function dataPrepare2xls(dataset, title, isMainSheet = false) {

    const styles = {
        headerDark: {
            fill: {
                fgColor: {
                    rgb: 'FF008000'
                },

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
                    rgb: 'FF2B679D'
                },
            },
            font: {
                color: {
                    rgb: 'FFFFFFFF'
                },
                sz: 34,
                bold: true
            }
        },
        data: {
            font: {
                color: {
                    rgb: 'FFFFFFFF'
                },
                sz: 16,
                bold : true
            },
            fill: {
                fgColor: {
                    rgb: 'FF16ACFF'
                },
            }
        },
        cellRed: {
            fill: {
                fgColor: {
                    rgb: 'FFFF0000'
                }
            }
        },
        cellUnderlined: {
            font: {
                color: {
                    rgb: 'FF0645AD'
                },
                underline : true
            }
        }
    };

    //Array of objects representing heading rows (very top)
    const heading = [
        [{
            value: title,
            style: styles.title
        }] // <-- It can be only values
    ];

    if (isMainSheet) {

        console.log('generate main sheet with dataset: ', dataset);

        const specification = {
            indicator_description: {
                displayName: 'Descrizione Indicatore',
                headerStyle: styles.data,
                width: 120
            },
            indicator_value: {
                displayName: 'Valore Indicatore',
                headerStyle: styles.data,
                /* cellStyle: function (value, row) {
                    // if the indicator_value is different than 0 then color in red else as default
                    return (row.indicator_value != 0) ? styles.cellRed : null;
                }, */
                width: 120
            },
            link: {
                displayName: 'Link alla pagina',
                headerStyle: styles.data,
                cellStyle: styles.cellUnderlined,
                width: 120
            },
            filter: {
                displayName: 'Filtri di ricerca',
                headerStyle: styles.data,
                width: 120
            }
        };

        const merges = [{
            start: {
                row: 1,
                column: 1
            },
            end: {
                row: 1,
                column: 4
            }
        }];

        return {
            name: title, // <- Specify sheet name (optional)
            heading: heading, // <- Raw heading array (optional)
            merges: merges, // <- Merge cell ranges
            specification: specification, // <- Report specification
            data: dataset // <-- Report data
        };

    } else {

        console.log('generate secondary sheets with dataset: ', dataset);
        const specification = {};

        let property = Object.keys(dataset.rows[0]);
        for (let i = 0; i < property.length; i++) {
            specification[property[i]] = {
                displayName: property[i],
                headerStyle: styles.data,
                width: 120
            };
        }

        const merges = [{
            start: {
                row: 1,
                column: 1
            },
            end: {
                row: 1,
                column: property.length
            }
        }];

        return {
            name: title, // <- Specify sheet name (optional)
            heading: heading, // <- Raw heading array (optional)
            merges: merges, // <- Merge cell ranges
            specification: specification, // <- Report specification
            data: dataset.rows // <-- Report data
        }
    }

}

exports.handler = async () => {

    // let caller_url = event.headers.host + event.requestContext.path;
    // console.log('\tHello from lambda mailing_list (: \nHere\'s the Caller: ', caller_url);

    let result;
    let body = [];

    await pool
        .query(`select * from entrasp.mailing_list();`)
        .then(res => result = res.rows.length > 0 ? res : null)
        .catch(err => console.error('Error executing query', err.stack))

    if (result) {

        let mail_to, mail_body, mail_subject, mail_sender, query_excel_to_create, sheet_titles, indicators_value, company, menu_links, search_filters;

        for (const row in result.rows) {
            
            mail_to = result.rows[row].mail_to;
            mail_body = result.rows[row].mail_body;
            mail_subject = result.rows[row].mail_subject;
            mail_sender = result.rows[row].mail_sender;
            query_excel_to_create = result.rows[row].query_excel_to_create;
            sheet_titles = result.rows[row].sheet_titles;
            indicators_value = result.rows[row].indicators_value;
            company = result.rows[row].company;
            menu_links = result.rows[row].menu_links;
            search_filters = result.rows[row].search_filters;

            // generate report main sheet's data
            let queries = query_excel_to_create.split(";");
            let titles = sheet_titles.split(";");
            let values = indicators_value.split(";");
            let links = menu_links.split(";");
            let filters = search_filters.split(";");

            let mainSheet = titles.map((value, index) => ({
                indicator_description: value,
                indicator_value: values[index],
                link: links[index],
                filter: filters[index]
            }));

            var excelData = [];
            excelData.push(dataPrepare2xls(mainSheet, mail_subject, true));

            // generate and join report sheet's data
            for (const value in values) {
                if (values[value] != 0) {
                    // here it prepares secondary sheets to the main one
                    await pool
                        .query(queries[value])
                        .then(res => excelData.push(dataPrepare2xls(res, titles[value])))
                        .catch(err => console.error('Error executing query', err.stack));
                }
            };

            // generate the report
            let report = excel.buildExport(excelData);
            console.log('excelData ', excelData );
            
            // configurations to upload the file on S3
            var filename = mail_subject + ' - ' + company + ' ' + getDateFormatted() + '.xlsx'; // generate a 'unique' identifier as filename

            var s3ParamsInsert = {
                Bucket: 'BUCKET_NAME',
                Key: 'mail/' + filename,
                Body: report
            };
            /* var s3ParamsUrl = {
                Bucket: 'BUCKET_NAME',
                Key: 'mail/' + filename
            }; */

            // upload to S3
            console.log('put object: ', filename);
            await s3.putObject(s3ParamsInsert).promise();

            //get the uploaded file url
            //var url = s3.getSignedUrl('getObject', s3ParamsUrl);

            //push the values
            body.push({
                to: { list: mail_to },
                sender: mail_sender,
                subject: mail_subject,
                body: { header: mail_body },
                attachments: [{
                    name: filename,
                    path: 'mail/' + filename
                }]
            });

            // console.log('SESParams: ', JSON.stringify(sesParams));
            // body = JSON.stringify(sesParams);

        };
    }
    //console.log('RETURNING:', body);
    return body;
};