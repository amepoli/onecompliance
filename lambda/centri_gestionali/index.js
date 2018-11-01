console.log('PostgreSQL GET Function');
var pg = require("pg");

exports.handler = function(event, context, callback) {
 
console.log(event.queryStringParameters);
 
var conn = "postgres://postgres:et2themax@goricotest.caxbbckt9xen.eu-central-1.rds.amazonaws.com/GoRiCo";
var client = new pg.Client(conn);
var codice_part = event.queryStringParameters.codice_part;
console.log(`codice part is: ${codice_part}`);

var queryString = 
`SELECT centri_1.id_centro_gest AS ID, centri_1.codice, centri_1.descrizione, 
anagr.codice || ' - ' || anagr.cognome || ' ' || anagr.nome  as responsabile,
centri_1.ute_ref as Referente, centri_1.parente
FROM 
(SELECT *, NULL as parente FROM entrasp.centri_gestionali WHERE codice_part='${codice_part}' AND id_centro_gest_parent IS NULL
UNION
SELECT centri_3.*, centri_2.descrizione as parente
 FROM entrasp.centri_gestionali CENTRI_2 
 JOIN entrasp.centri_gestionali CENTRI_3 
 ON centri_2.id_centro_gest = centri_3.id_centro_gest_parent
 WHERE centri_2.codice_part='${codice_part}' AND centri_3.codice_part='${codice_part}') 
 AS CENTRI_1
JOIN entrasp.anagrafiche_id  ANAGR
ON id_responsabile=id_anagrafica
WHERE centri_1.codice_part='${codice_part}' AND anagr.codice_part='${codice_part}'
ORDER BY ID;`;

client.connect();
console.log('Connected to PostgreSQL database');
 
//var id = event.id;
var query = client.query(queryString);
query.on("row", function (row, result) {
 result.addRow(row);
});
query.on("end", function (result) {
 var jsonString = JSON.stringify(result.rows);
 var jsonObj = JSON.parse(jsonString);
// console.log(jsonString);
 client.end();
// context.succeed(jsonObj);
 var response = {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": JSON.stringify(jsonObj),
        "isBase64Encoded": false
    };
 callback(null, response);
});
};

