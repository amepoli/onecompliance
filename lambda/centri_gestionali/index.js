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

var queryString_element = 
`SELECT id_centro_gest,codice,descrizione,id_centro_gest_parent,id_responsabile,flag_grc_controller,flag_grc_gestore from entrasp.centri_gestionali 
WHERE codice_part='${codice_part}' AND id_centro_gest='${id}';`

var queryString_centri=
`SELECT id_centro_gest AS id,descrizione AS name from entrasp.centri_gestionali WHERE codice_part='${codice_part}';`

var queryString_anagr=
`SELECT id_anagrafica AS id, codice, concat(codice, ' - ', nome, ' ', cognome) as name from entrasp.anagrafiche_id WHERE codice_part='${codice_part}';`

var queryString_next = 
`SELECT (MAX(id_centro_gest)+1) as prossimo from entrasp.centri_gestionali WHERE codice_part='${codice_part}';`

var form = [
    { 
      type: 'input',
      label: 'ID',
      inputType: 'text',
      name: 'id_centro_gest',
      value: '',
      readonly: 'true'
    },
    {
      type: 'input',
      label: 'Codice',
      inputType: 'text',
      name: 'codice',
      value: '',
      readonly: 'false',
      validations: [
        {
          name: 'required',
          validator: 'Validators.required',
          message: 'Codice mancante'
        },
        {
          name: 'pattern',
          validator: '^[a-zA-Z1-9&_ ]+$',
          message: 'Uso caratteri non ammessi'
        }
      ]
    },
    {
        type: 'input',
        label: 'Descrizione',
        inputType: 'text',
        name: 'descrizione',
        value: '',
        readonly: 'false',
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
        value: '',
        selected: '',
        options: []
      },
      {
        type: 'combobox',
        label: 'Responsabile',
        name: 'responsabile',
        value: '',
        selected: '',
        options: []
      },
      {
        type: 'checkbox',
        label: 'Supervisore di tutti i sondaggi',
        name: 'flag_grc_controller',
        value: false
      },
      {
        type: 'checkbox',
        label: 'Gestore di tutti i modelli di test',
        name: 'flag_grc_gestore',
        value: false
      }
    ];


//console.log('Connected to PostgreSQL database');
 
//var id = event.id;

if (id === '') {
  client.connect();
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
} else {    //query one element or NEW element
 
  if (id !== 'NEW') {
    client.connect();
    client.query(queryString_centri, function (err, result) {
      form[3]['options']=result.rows;
      client.query(queryString_anagr, function (err, result) {
        form[4]['options']=result.rows;
        var query = client.query(queryString_element);
        query.on("row", function (row, result) {
          result.addRow(row);
        });
        query.on("end", function (result) {
          var jsonString = result.rows[0];
          client.end();
          if (jsonString['id_centro_gest']) {
            form[0]['value'] = jsonString['id_centro_gest'];
          }
          if (jsonString['codice']) {
            form[1]['value'] = jsonString['codice'];
          }
          if (jsonString['descrizione']) {
            form[2]['value'] = jsonString['descrizione'];
          }
          if (jsonString['id_centro_gest_parent']) {
            form[3]['selected'] = jsonString['id_centro_gest_parent'];
          }
          if (jsonString['id_responsabile']) {
            form[4]['selected'] = jsonString['id_responsabile'];
          }
          if (jsonString['flag_grc_controller'] === '1') {
            form[5]['value'] = 'true';
          }
          if (jsonString['flag_grc_gestore'] === '1') {
            form[6]['value'] = 'true';
          }
          var jsonObj = JSON.stringify(form);
          var response = {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": jsonObj,
            "isBase64Encoded": false
         };
         callback(null, response);
        });
      });
    });
  } else {  //NEW element
    client.connect();
    client.query(queryString_centri, function (err, result) {
      form[3]['options']=result.rows;
      client.query(queryString_anagr, function (err, result) {
        form[4]['options']=result.rows;
        client.query(queryString_next, function (err, result) {
          var jsonString = result.rows[0];
          client.end();
          form[0]['value'] = jsonString['prossimo'];
          var jsonObj = JSON.stringify(form);
          var response = {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": jsonObj,
            "isBase64Encoded": false
          };
          callback(null, response);
        });
      });
    });
  }
}
};
