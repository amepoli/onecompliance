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

function dataPrepend2xls(dataset, title, isMainSheet = false) {
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
        },
        cellRed: {
            fill: {
                fgColor: {
                    rgb: 'FFFF0000'
                }
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

        //console.log('generate main sheet');

        const specification = {
            indicator_description: {
                displayName: 'Descrizione Indicatore',
                headerStyle: styles.data,
                width: 120
            },
            indicator_value: {
                displayName: 'Valore Indicatore',
                headerStyle: styles.data,
                cellStyle: function(value, row) {
                    // if the indicator_value is different than 0 then color in red else as default
                    return (row.indicator_value != 0) ? styles.cellRed : null;
                },
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
                column: 2
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

        //console.log('generate secondary sheets');

        const specification = {};

        let property = Object.keys(dataset.rows[0]);
        for (let i = 0; i < property.length; i++) {
            specification[property[i]] = {
                displayName: property[i],
                headerStyle: styles.data,
                width: 120
            };
        }

        return {
            name: title, // <- Specify sheet name (optional)
            heading: heading, // <- Raw heading array (optional)
            specification: specification, // <- Report specification
            data: dataset.rows // <-- Report data
        }
    }

}

exports.handler = async (event) => {

    console.log('Hello from lambda mailing_list (: ');

    let caller_url = event.headers.host + event.requestContext.path;
    console.log('Caller: ', caller_url);

    let result;

    await pool
        .query(`select * from entrasp.mailing_list();`)
        .then(res => result = res.rows.length > 0 ? res : null)
        .catch(err => console.error('Error executing query', err.stack))

    if (result) {

        let mail_to, mail_body, mail_subject, mail_sender, query_excel_to_create, sheet_titles, indicators_value;

        for (const row in result.rows) {

            mail_to = result.rows[row].mail_to;
            mail_body = result.rows[row].mail_body;
            mail_subject = result.rows[row].mail_subject;
            mail_sender = result.rows[row].mail_sender;
            query_excel_to_create = result.rows[row].query_excel_to_create;
            sheet_titles = result.rows[row].sheet_titles;
            indicators_value = result.rows[row].indicators_value;

            //generate excel report (multiple rows in query_excel_to_create)

            let queries = query_excel_to_create.split(";");
            let titles = sheet_titles.split(";");
            let values = indicators_value.split(";");

            let mainSheet = titles.map((value, index) => ({
                indicator_description: value,
                indicator_value: values[index]
            }));

            //Generate report's main sheet
            var excelData = [];
            excelData.push(dataPrepend2xls(mainSheet, mail_subject, true));

            //Generate and join report's sheets
            for (const value in values) {
                if (values[value] != 0) {
                    // here prepend secondary sheet to the main one
                    await pool
                        .query(queries[value])
                        .then(res => excelData.push(dataPrepend2xls(res, titles[value])))
                        .catch(err => console.error('Error executing query', err.stack))
                }
            };

            const report = excel.buildExport(excelData);

            console.log("\nsending email to: ", mail_to,
                ";\nfrom: ", mail_sender,
                ";\nwith subject: ", mail_subject,
                ";\nand body: ", mail_body,
                ";\nattaching the report: ", report);

            //send email

        };

    }

    return {
        "statusCode": 200,
        "isBase64Encoded": false,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": 'OK'
    };
};