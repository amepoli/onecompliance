var processor = require('process_request');

exports.handler = function(event, context, callback) {
  
var codice_part = event.queryStringParameters.key1;
var id = event.queryStringParameters.key2;

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
          validator: '^[a-zA-Z0-9&_ ]+$',
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
        name: 'id_centro_gest_parent',
        value: '',
        options: []
      },
      {
        type: 'combobox',
        label: 'Responsabile',
        name: 'id_responsabile',
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

var queries = {};

queries.list =
`SELECT cg.codice_part, cg.id_centro_gest, CG.codice, CG.descrizione, 
entrasp.anagrafiche_id_codcognnome('${codice_part}',cg.id_responsabile) as responsabile,
entrasp.centri_gestionali_descr('${codice_part}',cg.id_centro_gest_parent) as parente
FROM entrasp.centri_gestionali CG WHERE cg.codice_part='${codice_part}';`

queries.element = 
`SELECT id_centro_gest,codice,descrizione,id_centro_gest_parent,id_responsabile,flag_grc_controller,flag_grc_gestore from entrasp.centri_gestionali 
WHERE codice_part='${codice_part}' AND id_centro_gest='${id}';`

queries.next = 
`SELECT (MAX(id_centro_gest)+1) as id_centro_gest from entrasp.centri_gestionali WHERE codice_part='${codice_part}';`

queries.delete = `DELETE FROM entrasp.centri_gestionali
WHERE codice_part='${codice_part}' AND id_centro_gest='${id}';`;

var body;

if (event.httpMethod === "POST" || event.httpMethod === "PUT") {
  body = JSON.parse(event.body.toString());
  body.flag_grc_controller = (body.flag_grc_controller == true) ? 1 : 0;
  body.flag_grc_gestore = (body.flag_grc_gestore == true) ? 1 : 0;
  queries.new = `INSERT INTO entrasp.centri_gestionali 
      (codice_part, id_centro_gest, codice, descrizione, id_centro_gest_parent, id_responsabile, id_gruppo_lavoro, tree_path, flag_grc_controller, flag_grc_gestore)
      VALUES
     ('${codice_part}', ${body['id_centro_gest']}, '${body['codice']}', '${body['descrizione']}', 
     ${body.id_centro_gest_parent.id}, ${body.id_responsabile.id}, 209, '${body['codice']}', 
     ${body['flag_grc_controller']}, ${body['flag_grc_gestore']})
     RETURNING id_centro_gest;`;
  queries.update = `
    UPDATE entrasp.centri_gestionali
    SET codice = '${body['codice']}',
        descrizione = '${body['descrizione']}',
        id_centro_gest_parent = ${body.id_centro_gest_parent.id},
        id_responsabile = ${body.id_responsabile.id},
        flag_grc_controller = ${body['flag_grc_controller']},
        flag_grc_gestore = ${body['flag_grc_gestore']}
    WHERE codice_part='${codice_part}' AND id_centro_gest='${body['id_centro_gest']}'`;
}

var queryString_centri=
`SELECT id_centro_gest AS id,descrizione AS name from entrasp.centri_gestionali WHERE codice_part='${codice_part}';`

var queryString_anagr=
`SELECT id_anagrafica AS id, concat(codice, ' - ', nome, ' ', cognome) as name from entrasp.anagrafiche_id WHERE codice_part='${codice_part}';`

// WARNING: whenever form changes, position of combobox queries should be updated accordingly
  
queries.combo = [
  {
    queryString: queryString_centri,
    name: 'id_centro_gest_parent'
  },
  {
    queryString: queryString_anagr,
    name: 'id_responsabile'
  }
];

var ret_callback = function(return_value) {
  console.log(return_value.status);
  callback(null, return_value.response);
};

processor.process_request(event, context, form, queries, ret_callback);

};
