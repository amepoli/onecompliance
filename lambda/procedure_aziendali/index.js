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
	  label: 'Codice azienda',
      inputType: 'text',
	  name: 'codice_azienda',
	  value: '',
	  readonly: 'true',
	  isVisible: 'false',
	  newLine: 'true'
    },
    {
      type: 'input',
      label: 'ID procedura',
	  inputType: 'text',
	  name: 'id_procedura',
	  value: '',
	  readonly: 'true',
	  isVisible: 'true',
	  newLine: 'true'
    },
    {
      type: 'combobox',
	  label: 'Procedura principale',
	  inputType: 'text',
	  name: 'id_procedura_parent',
	  value: '',
	  readonly: 'false',
	  isVisible: 'true',
	  newLine: 'true',
	  options: []
	},
	{
      type: 'input',
	  label: 'Codice',
	  inputType: 'text',
	  name: 'codice',
	  value: '',
	  readonly: 'false',
	  isVisible: 'true',
	  newLine: 'true',
	  validations: [
	    {
	      name: 'required',
	      validator: 'Validators.required',
	      message: 'Codice mancante'
	    }
	  ]
    },
    {
      type: 'input',
	  label: 'Descrizione breve',
	  inputType: 'text',
	  name: 'descrizione_breve',
	  value: '',
	  readonly: 'false',
	  isVisible: 'true',
	  newLine: 'true',
	  validations: [
		  {
		    name: 'required',
		    validator: 'Validators.required',
		    message: 'Descrizione mancante'
		  },
	      {
	        name: 'pattern',
	        validator: '^[a-zA-Z1-9&_,.;: ]+$',
	        message: 'Uso caratteri non ammessi'
	      }   
	  ]
    },
    {
      type: 'textarea',
	  label: 'Descrizione',
	  inputType: 'text',
	  name: 'descrizione',
	  value: '',
	  readonly: 'false',
	  isVisible: 'true',
	  newLine: 'true',
	  validations: [{
		  name: 'required',
		  validator: 'Validators.required',
		  message: 'Descrizione mancante'
	  }]
    },
	/*	{
      type: 'input',
		  label: 'ordinamento',
		  inputType: 'text',
		  name: 'ordinamento',
		  value: '',
		  readonly: 'false',
		  isVisible: 'true',
		  newLine: 'true'
  }, 
		{type: 'input',
		 label: 'tree_path',
		 inputType: 'text',
		 name: 'tree_path',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'true'
		},
		{type: 'input',
		 label: 'frequenza',
		 inputType: 'text',
		 name: 'frequenza',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'true'
		},
		{type: 'input',
		 label: 'strumento_informatico',
		 inputType: 'text',
		 name: 'strumento_informatico',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'true'
		}, */
	{
      type: 'combobox',
	  label: 'Centro gestionale',
	  inputType: 'text',
	  name: 'id_centro_gest',
	  value: '',
	  readonly: 'false',
	  isVisible: 'true',
	  newLine: 'true', 
	  options: []
    },
	/*	{type: 'input',
		 label: 'codice_part',
		 inputType: 'text',
		 name: 'codice_part',
		 value: '',
		 readonly: 'false',
		 isVisible: 'true',
		 newLine: 'true'
		},*/
	{
      type: 'combobox',
	  label: 'Tipo procedura',
	  inputType: 'text',
	  name: 'tipo_procedura',
	  value: '',
	  readonly: 'false',
	  isVisible: 'true',
	  newLine: 'true',
	  options: [
        { id: '0', name: 'Procedura normale' }, 
        { id: '1', name: 'Presidio' }, 
        { id: '2', name: 'Procedura e presidio'}]
	},
	{
      type: 'combobox',
	  label: 'Stato attuazione',
	  inputType: 'text',
	  name: 'stato_attuazione',
	  value: '',
	  readonly: 'false',
	  isVisible: 'true',
	  newLine: 'true',
	  options: [
        { id: '0', name: 'Attivo' }, 
        { id: '1', name: 'In Implementazione' }, 
        { id: '2', name: 'Auspicabile'}]
	},
	{
      type: 'combobox',
	  label: 'Tipo processo',
	  inputType: 'text',
	  name: 'id_tipo_processo',
	  value: '',
	  readonly: 'false',
	  isVisible: 'true',
	  newLine: 'true',
	  options: []
	}
];



var queryString =
`SELECT procedure_aziendali.id_procedura, procedure_aziendali.codice, procedure_aziendali.descrizione_breve, entrasp.centri_gestionali_descr('${codice_part}',procedure_aziendali.id_centro_gest) AS centro_gest
FROM entrasp.procedure_aziendali
WHERE codice_azienda='${codice_part}'; `

var queryString_element = 
`SELECT codice_azienda,id_procedura,id_procedura_parent,codice,descrizione_breve,descrizione,
id_centro_gest,tipo_procedura,stato_attuazione,id_tipo_processo 
FROM entrasp.procedure_aziendali
WHERE codice_azienda='${codice_part}' AND id_procedura='${id}';`

var queryString_procedura_parent_cmb =
`SELECT id_procedura AS id, descrizione_breve AS name from entrasp.procedure_aziendali WHERE codice_azienda='${codice_part}';`

var queryString_centro_gest_cmb=
`SELECT id_centro_gest AS id, descrizione AS name from entrasp.centri_gestionali WHERE codice_part='${codice_part}';`

var queryString_tipo_processo_cmb=
`SELECT id_tipo_processo AS id, descrizione AS name from entrasp.tipi_processi WHERE codice_azienda='${codice_part}';`

var queryString_next = 
`SELECT (MAX(id_procedura)+1) as prossimo from entrasp.procedure_aziendali WHERE codice_azienda='${codice_part}';`

var deleteString = `DELETE FROM entrasp.procedure_aziendali
      WHERE codice_azienda='${codice_part}' AND id_procedura='${id}';`;

var body;

if (event.httpMethod === "POST" || event.httpMethod === "PUT") {
   body = JSON.parse(event.body.toString()); // drove me crazy!!!!

   // Check of non null value needed for all combo box selected choices
   // Please note the difference between processing numeric or string types of selected choices
   var id_procedura_parent = body.id_procedura_parent.id ? `'${body.id_procedura_parent.id}'` : null;
   var id_centro_gest = body.id_centro_gest.id ? body.id_centro_gest.id : null;
   var stato_attuazione = body.stato_attuazione.id ? `'${body.stato_attuazione.id}'` : null;
   var tipo_procedura = body.tipo_procedura.id ? `'${body.tipo_procedura.id}'` : null;
   var id_tipo_processo = body.id_tipo_processo.id ? `'${body.id_tipo_processo.id}'` : null;
   
   
   var insertNewString = `INSERT INTO entrasp.procedure_aziendali 
        (codice_azienda, id_procedura, id_procedura_parent, codice, descrizione_breve,
         descrizione, id_centro_gest, tipo_procedura, stato_attuazione, id_tipo_processo)
        VALUES
       ('${codice_part}', ${body.id_procedura}, ${id_procedura_parent}, '${body.codice}', 
        '${body.descrizione_breve}', '${body.descrizione}', ${id_centro_gest}, 
        ${tipo_procedura},${stato_attuazione}, ${id_tipo_processo})
         RETURNING id_procedura;`;
    
     var updateString = `
         UPDATE entrasp.procedure_aziendali
         SET id_procedura_parent = ${id_procedura_parent},
             codice = '${body.codice}',
             descrizione_breve = '${body.descrizione_breve}',
             descrizione = '${body.descrizione}',
             id_centro_gest = ${id_centro_gest},
             tipo_procedura = ${tipo_procedura},
             stato_attuazione = ${stato_attuazione},
             id_tipo_processo = ${id_tipo_processo}
         WHERE codice_azienda='${codice_part}' AND id_procedura='${body.id_procedura}';`;   
}

if (event.httpMethod === "POST") {
  console.log(body);
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
  if (id === '') { // query the full table
    pool.connect().then(c => {
          client = c;
          return client.query(queryString);
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
  // start unrolling all combo box values
  pool.connect().then(c => {
      client = c;
      return client.query(queryString_procedura_parent_cmb);
  }).then(res => {
    client.release();
    form[2]['options']=res.rows;
    pool.connect().then(c => {
      client = c;
      return client.query(queryString_centro_gest_cmb);
    }).then(res => {
      client.release();
      form[6]['options']=res.rows;
      pool.connect().then(c => {
      client = c;
      return client.query(queryString_tipo_processo_cmb);
    }).then(res => {
      client.release();
      form[9]['options']=res.rows;
      // unrolling of combo box values finishes here
      if (id !== 'NEW') {  // existing element
        pool.connect().then(c => {
        client = c;
        return client.query(queryString_element);
        }).then(res => {
        client.release();
          var jsonString = res.rows[0];
          if (jsonString['codice_azienda']) {
            form[0]['value'] = jsonString['codice_azienda'];
          }
          if (jsonString['id_procedura']) {
            form[1]['value'] = jsonString['id_procedura'];
          }
          if (jsonString['id_procedura_parent']) {
            form[2]['value'] = jsonString['id_procedura_parent'];
          }
          if (jsonString['codice']) {
            form[3]['value'] = jsonString['codice'];
          }
          if (jsonString['descrizione_breve']) {
            form[4]['value'] = jsonString['descrizione_breve'];
          }
          if (jsonString['descrizione']) {
            form[5]['value'] = jsonString['descrizione'];
          }
          if (jsonString['id_centro_gest']) {
            form[6]['value'] = jsonString['id_centro_gest'];
          }
          if (jsonString['tipo_procedura']) {
            form[7]['value'] = jsonString['tipo_procedura'];
          }
          if (jsonString['stato_attuazione']) {
            form[8]['value'] = jsonString['stato_attuazione'];
          }
          if (jsonString['id_tipo_processo']) {
            form[9]['value'] = jsonString['id_tipo_processo'];
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
      } else {  //NEW element
        pool.connect().then(c => {
          client = c;
          return client.query(queryString_next);
          }).then(res => {
            client.release();
            var jsonString = res.rows[0];
            form[0]['value'] = codice_part;
            form[1]['value'] = jsonString['prossimo'];
            var jsonObj = JSON.stringify(form);
            var response = {
              "statusCode": 200,
              "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
              "body": jsonObj,
              "isBase64Encoded": false
            };
            callback(null, response);
          });
      }
      });
    });
   });
}
}
};
