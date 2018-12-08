console.log('PostgreSQL GET Function');
var pg = require("pg");

exports.handler = function(event, context, callback) {
 
var conn = "postgres://postgres:et2themax@goricotest.caxbbckt9xen.eu-central-1.rds.amazonaws.com/GoRiCo";
var client = new pg.Client(conn);
var codice_part = event.queryStringParameters.codice_part;
var id = event.queryStringParameters.id;

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

var queryString_new =
`SELECT cg.id_centro_gest, CG.codice, CG.descrizione, 
entrasp.anagrafiche_id_codcognnome('${codice_part}',cg.id_responsabile) as responsabile,
cg.ute_ref,
entrasp.centri_gestionali_descr('${codice_part}',cg.id_centro_gest_parent) as parente
FROM entrasp.centri_gestionali CG WHERE cg.codice_part='${codice_part}';`

var form = [
    {
      type: 'input',
      label: 'Codice',
      inputType: 'text',
      name: 'code',
      value: 'CdA',
      validations: [
        {
          name: 'required',
          validator: 'Validators.required',
          message: 'Codice mancante'
        },
        {
          name: 'pattern',
          validator: '^[a-zA-Z]+$',
          message: 'Accetta solo testo senza spazi'
        }
      ]
    },
    {
        type: 'input',
        label: 'Descrizione',
        inputType: 'text',
        name: 'Description',
        value: '',
        validations: [
          {
            name: 'required',
            validator: 'Validators.required',
            message: 'Descrizione mancante'
          },
        ]
      },
      {
        type: 'combobox',
        label: 'Centro gestionale di livello superiore',
        name: 'superiore',
        selected: '3',
        options: [{id: '1', name: 'Amministrazione'}, 
                  {id: '2', name: 'Commerciale'},
                  {id: '3', name: 'Compliance'}, 
                  {id: '4', name: 'Consiglio di Amministrazione'}]
      },
      {
        type: 'combobox',
        label: 'Responsabile',
        name: 'responsabile',
        selected: '2',
        options: [{id: '1', name: 'Poli Amedeo'}, 
                  {id: '2', name: 'Nicola Capovilla'},
                  {id: '3', name: 'Francesco Guarneri'}, 
                  {id: '4', name: 'Arlotta Carlo'}]
      },
      {
        type: 'combobox',
        label: 'Utente Referente',
        name: 'referente',
        selected: '4',
        options: [{id: '1', name: 'Poli Amedeo'}, 
                  {id: '2', name: 'Nicola Capovilla'},
                  {id: '3', name: 'Francesco Guarneri'}, 
                  {id: '4', name: 'Arlotta Carlo'}]
      },
      {
        type: 'checkbox',
        label: 'Supervisore di tutti i sondaggi',
        name: 'check_supervisore',
        value: false
      },
      {
        type: 'checkbox',
        label: 'Gestore di tutti i modelli di test',
        name: 'check_gestore',
        value: false
      }
    ];

client.connect();
//console.log('Connected to PostgreSQL database');
 
//var id = event.id;

if (id === '') {
  var query = client.query(queryString_new);
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
} else {    //query one element
  var jsonObj = JSON.stringify(form);
  client.end();
  var response = {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": jsonObj,
        "isBase64Encoded": false
    };
    callback(null, response);
}

};
