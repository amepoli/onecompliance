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


var form = [
    { 
      type: 'input',
      label: 'ID',
      inputType: 'text',
      name: 'id_anagrafica',
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
      label: 'Nome',
      inputType: 'text',
      name: 'nome',
      value: '',
      readonly: 'false',
      validations: [
        {
          name: 'required',
          validator: 'Validators.required',
          message: 'Nome obbligatorio'
        },
        {
          name: 'pattern',
          validator: '^[a-zA-Z ]+$',
          message: 'Uso caratteri non ammessi'
        }
      ]
    },
    {
      type: 'input',
      label: 'Cognome',
      inputType: 'text',
      name: 'cognome',
      value: '',
      readonly: 'false',
      validations: [
        {
          name: 'required',
          validator: 'Validators.required',
          message: 'Cognome obbligatorio'
        },
        {
          name: 'pattern',
          validator: '^[a-zA-Z ]+$',
          message: 'Uso caratteri non ammessi'
        }
      ]
    }
    ];


var queryString = 
`SELECT 
anagrafiche_id.id_anagrafica, 
anagrafiche_id.codice, 
anagrafiche_id.cognome, 
anagrafiche_id.nome, 
ruoli_anagrafiche.codice_part
FROM 
entrasp.anagrafiche_id, 
entrasp.ruoli, 
entrasp.ruoli_anagrafiche
WHERE 
anagrafiche_id.codice_part = ruoli_anagrafiche.codice_part AND
ruoli_anagrafiche.codice_ruolo = ruoli.codice_ruolo AND
ruoli.codice_ruolo ='DIP' AND
anagrafiche_id.codice_part='${codice_part}' ;`;

var queryString_element = 
`SELECT id_centro_gest,codice,descrizione,id_centro_gest_parent,id_responsabile,flag_grc_controller,flag_grc_gestore from entrasp.centri_gestionali 
WHERE codice_part='${codice_part}' AND id_anagrafiche='${id}';`

var queryString_centri=
`SELECT id_centro_gest AS id,descrizione AS name from entrasp.centri_gestionali WHERE codice_part='${codice_part}';`

var queryString_anagr=
`SELECT id_anagrafica AS id, codice, concat(codice, ' - ', nome, ' ', cognome) as name from entrasp.anagrafiche_id WHERE codice_part='${codice_part}';`

var queryString_next = 
`SELECT (MAX(id_centro_gest)+1) as prossimo from entrasp.centri_gestionali WHERE codice_part='${codice_part}';`

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
