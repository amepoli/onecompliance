var processor = require('process_request');

exports.handler = function(event, context, callback) {

var codice_part = event.queryStringParameters.key1;
var id = event.queryStringParameters.key2;

var element_form = [
    { 
      type: 'input',
      label: 'ID',
      inputType: 'number',
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
          validator: '^[a-zA-Z1-9&_. ]+$',
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
      newLine: 'false',
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
      newLine: 'false',
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

var search_form = [
    {type: 'input',
		 label: 'Nome',
		 inputType: 'text',
		 name: 'nome',
		 value: '',
		 readonly: 'false'
		  },
	  {type: 'input',
		 label: 'Cognome',
		 inputType: 'text',
		 name: 'cognome',
		 value: '',
		 readonly: 'false'
		}	
    ];

var form = {
    element_form: element_form,
    search_form: search_form
};


var queries = {};

queries.list = 
`SELECT distinct
anagrafiche_id.codice_part,
anagrafiche_id.id_anagrafica, 
anagrafiche_id.codice, 
anagrafiche_id.cognome, 
anagrafiche_id.nome
FROM 
entrasp.anagrafiche_id, 
entrasp.ruoli, 
entrasp.ruoli_anagrafiche
WHERE 
anagrafiche_id.codice_part = ruoli_anagrafiche.codice_part AND
ruoli_anagrafiche.codice_ruolo = ruoli.codice_ruolo AND
ruoli.codice_ruolo ='DIP' AND
anagrafiche_id.codice_part='${codice_part}' ;`;

queries.element = 
`SELECT id_anagrafica,codice,cognome,nome from entrasp.anagrafiche_id 
WHERE codice_part='${codice_part}' AND id_anagrafica='${id}';`;

queries.next = 
`SELECT (MAX(id_anagrafica)+1) as id_anagrafica from entrasp.anagrafiche_id WHERE codice_part='${codice_part}';`;

queries.delete = `DELETE FROM entrasp.anagrafiche_id
      WHERE codice_part='${codice_part}' AND id_anagrafica='${id}';`;

queries.conditions = {
  nome: {condition: 'nome Like \'%$param%\''},
  cognome: {condition: 'cognome Like \'%$param%\''}
};

var body;

if ((event.httpMethod === "POST" && event.queryStringParameters.operation != 'search') || event.httpMethod === "PUT") {
   body = JSON.parse(event.body.toString()); // drove me crazy!!!!
   queries.new = `INSERT INTO entrasp.anagrafiche_id 
        (codice_part, id_anagrafica, codice, cognome, nome)
        VALUES
       ('${codice_part}', ${body.id_anagrafica}, ${body.codice}, ${body.cognome}, ${body.nome})
         RETURNING id_anagrafica;`;
    
   queries.update = `
         UPDATE entrasp.anagrafiche_id
         SET codice = ${body.codice},
             cognome = ${body.cognome},
             nome = ${body.nome}
         WHERE codice_part='${codice_part}' AND id_anagrafica=${body.id_anagrafica}`;   
}

var ret_callback = function(return_value) {
  console.log(return_value.status);
  callback(null, return_value.response);
};

processor.process_request(event, context, form, queries, ret_callback);

};
