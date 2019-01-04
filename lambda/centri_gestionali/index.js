var pg = require("pg");

const Pool = require('pg-pool');
const pool = new Pool({
    host: 'goricotest.caxbbckt9xen.eu-central-1.rds.amazonaws.com',
    database: 'GoRiCo',
    user: 'postgres',
    password: 'et2themax',
    port: 5432,
    max: 1,
    min: 0,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 1000
});


exports.handler = function(event, context, callback) {
  
context.callbackWaitsForEmptyEventLoop = false; // don't know why, but this prevents the lambda to hang

var codice_part = event.queryStringParameters.codice_part;
var id = event.queryStringParameters.id;

// from this point on I try to generate the lambda in automatic

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
        options: []
      },
      {
        type: 'combobox',
        label: 'Responsabile',
        name: 'responsabile',
        value: '',
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
`SELECT cg.id_centro_gest as ID, CG.codice as Codice, CG.descrizione as Descrizione, 
entrasp.anagrafiche_id_codcognnome('${codice_part}',cg.id_responsabile) as Responsabile,
entrasp.centri_gestionali_descr('${codice_part}',cg.id_centro_gest_parent) as Parente
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

if (event.httpMethod === "POST") {
  var body = JSON.parse(event.body.toString());
  body.flag_grc_controller = (body.flag_grc_controller == true) ? 1 : 0;
  body.flag_grc_gestore = (body.flag_grc_gestore == true) ? 1 : 0;
  var updateString = `
    UPDATE entrasp.centri_gestionali
    SET codice = '${body['codice']}',
        descrizione = '${body['descrizione']}',
        id_centro_gest_parent = ${body.superiore.id},
        id_responsabile = ${body.responsabile.id},
        flag_grc_controller = ${body['flag_grc_controller']},
        flag_grc_gestore = ${body['flag_grc_gestore']}
    WHERE codice_part='${codice_part}' AND id_centro_gest='${body['id_centro_gest']}'`;
    console.log(updateString);
  let client;
  pool.connect().then(c => {
        client = c;
        return client.query(updateString);
    }).then(res => {
        client.release();
        var response = {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "isBase64Encoded": false,
            "body": JSON.stringify(res.rows)
        };
        console.log(response);
        callback(null, response);
    }).catch(error => {
        console.log("ERROR", error);
        const response =  {
            "isBase64Encoded": false,
            "statusCode": 500,
            "body": JSON.stringify(error)
        };
        callback(null, response);
    });
}

if (event.httpMethod === "DELETE") {
  var deleteString = `DELETE FROM entrasp.centri_gestionali
      WHERE codice_part='${codice_part}' AND id_centro_gest='${id}';`;
  let client;
  pool.connect().then(c => {
        client = c;
        return client.query(deleteString);
    }).then(res => {
      client.release();
      var response = {
          "statusCode": 200,
          "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
          "isBase64Encoded": false,
          "body": JSON.stringify(res.rows)
      };
      callback(null, response);
    }).catch(error => {
        console.log("ERROR", error);
        const response =  {
            "isBase64Encoded": false,
            "statusCode": 500,
            "body": JSON.stringify(error)
        };
        callback(null, response);
    });
}

if (event.httpMethod === "PUT") {
  
  var body = JSON.parse(event.body.toString()); // drove me crazy!!!!
  body.flag_grc_controller = (body.flag_grc_controller == true) ? 1 : 0;
  body.flag_grc_gestore = (body.flag_grc_gestore == true) ? 1 : 0;
  
  var insertNewString = `INSERT INTO entrasp.centri_gestionali 
        (codice_part, id_centro_gest, codice, descrizione, id_centro_gest_parent, id_responsabile, id_gruppo_lavoro, tree_path, flag_grc_controller, flag_grc_gestore)
        VALUES
       ('${codice_part}', ${body['id_centro_gest']}, '${body['codice']}', '${body['descrizione']}', 
         ${body.superiore.id}, ${body.responsabile.id}, 209, '${body['codice']}', 
         ${body['flag_grc_controller']}, ${body['flag_grc_gestore']})
         RETURNING id_centro_gest;`;
         
  console.log(insertNewString);
  let client;
  pool.connect().then(c => {
        client = c;
        return client.query(insertNewString);
    }).then(res => {
        client.release();
        var response = {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "isBase64Encoded": false,
            "body": JSON.stringify(res.rows)
        };
        console.log(response);
        callback(null, response);
    }).catch(error => {
        console.log("ERROR", error);
        const response =  {
            "isBase64Encoded": false,
            "statusCode": 500,
            "body": JSON.stringify(error)
        };
        callback(null, response);
    });
}

if (event.httpMethod === "GET") {

let client;
if (id === '') {
  pool.connect().then(c => {
        client = c;
        return client.query(queryString_new);
    }).then(res => {
      client.release();
      var response = {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": JSON.stringify(res.rows),
        "isBase64Encoded": false
      };
      callback(null, response);
    }).catch(error => {
        console.log("ERROR", error);
        const response =  {
            "isBase64Encoded": false,
            "statusCode": 500,
            "body": JSON.stringify(error)
        };
        callback(null, response);
   });
} else {    //query one element or NEW element
  if (id !== 'NEW') {
    pool.connect().then(c => {
        client = c;
        return client.query(queryString_centri);
    }).then(res => {
      client.release();
      form[3]['options']=res.rows;
      pool.connect().then(c => {
        client = c;
        return client.query(queryString_anagr);
      }).then(res => {
        client.release();
        form[4]['options']=res.rows;
        pool.connect().then(c => {
        client = c;
        return client.query(queryString_element);
        }).then(res => {
        client.release();
          var jsonString = res.rows[0];
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
            form[3]['value'] = jsonString['id_centro_gest_parent'];
          }
          if (jsonString['id_responsabile']) {
            form[4]['value'] = jsonString['id_responsabile'];
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
    pool.connect().then(c => {
        client = c;
        return client.query(queryString_centri);
    }).then(res => {
      client.release();
      form[3]['options']=res.rows;
      pool.connect().then(c => {
        client = c;
        return client.query(queryString_anagr);
      }).then(res => {
      client.release();
        form[4]['options']=res.rows;
        pool.connect().then(c => {
        client = c;
        return client.query(queryString_next);
        }).then(res => {
          client.release();
          var jsonString = res.rows[0];
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
}
};
