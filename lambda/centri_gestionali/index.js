var processor = require('process_request');

exports.handler = function(event, context, callback) {

var element_form = [
    { 
        type: 'input',
        label: 'Codice Part',
        inputType: 'text',
        name: 'codice_part',
        isVisible: 'false',
        value: '',
        readonly: 'true'
      },
    { 
      type: 'input',
      label: 'ID',
      inputType: 'number',
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

var search_form = [
    { 
      type: 'input',
      label: 'ID',
      inputType: 'number',
      name: 'id_centro_gest',
      value: '',
      readonly: 'false'
    },
    {
      type: 'input',
      label: 'Codice',
      inputType: 'text',
      name: 'codice',
      value: '',
      readonly: 'false'
    },
    {
        type: 'input',
        label: 'Descrizione',
        inputType: 'text',
        name: 'descrizione',
        value: '',
        readonly: 'false'
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
        label: 'Solo principali',
        name: 'flag_principali',
        value: true
      }
    ];

    var table_form = [
        {
            key: 'codice_part', 
            label: 'Codice Part', 
            isPrimary: true, 
            isHidden: true
        },    
        {
            key: 'id_centro_gest', 
            label: 'ID', 
            isPrimary: true, 
            isHidden: false
        },                     
        {
            key: 'codice', 
            label: 'Codice', 
            isPrimary: false, 
            isHidden: false
        },
        {
            key: 'descrizione', 
            label: 'Descrizione', 
            isPrimary: false, 
            isHidden: false
        },
        {
            key: 'responsabile', 
            label: 'Responsabile', 
            isPrimary: false, 
            isHidden: false
        },
        {
            key: 'parente', 
            label: 'Centro Superiore', 
            isPrimary: false, 
            isHidden: false
        } 
    ];

    var subtable_form = [
        {
            label: 'Centri gestionali',
            table: 'centri_gest',
            keys: [
                { 
                    parent: 'id_centro_gest',
                    son: 'id_centro_gest_parent'
                }
            ]
        },
        {
            label: 'Elenco Personale',
            table: 'personale', 
            keys: [] // TODO
        },
        {
            label: 'Procedure aziendali',
            table: 'procedure',          
            keys: [] // TODO
        }
    ];

var form = {
    table_form: table_form,
    element_form: element_form,
    search_form: search_form,
    subtable_form: subtable_form
};

var queries = {};

queries.list = // WHERE conditions automatically added based on url parameters
`SELECT cg.codice_part, cg.id_centro_gest, CG.codice, CG.descrizione, 
entrasp.anagrafiche_id_codcognnome('$codice_part',cg.id_responsabile) as responsabile,
entrasp.centri_gestionali_descr('$codice_part',cg.id_centro_gest_parent) as parente
FROM entrasp.centri_gestionali CG;`;

queries.element = 
`SELECT codice_part,id_centro_gest,codice,descrizione,id_centro_gest_parent,id_responsabile,flag_grc_controller,flag_grc_gestore from entrasp.centri_gestionali 
WHERE codice_part='$codice_part' AND id_centro_gest='$id_centro_gest';`;

queries.next = 
`SELECT (MAX(id_centro_gest)+1) as id_centro_gest from entrasp.centri_gestionali WHERE codice_part='$codice_part';`;

queries.delete = `DELETE FROM entrasp.centri_gestionali
WHERE codice_part='$codice_part' AND id_centro_gest='$id_centro_gest';`;


queries.conditions = {
    search: {
        flag_principali: { test: true, condition: 'id_centro_gest_parent IS null' },
        descrizione: { condition: 'descrizione Like \'%$param%\'' }
    },
    table: {
    },
    sub_table: {
    }
};


var body;

if ((event.httpMethod === "POST" && event.queryStringParameters.operation != 'search') || event.httpMethod === "PUT") {
  body = JSON.parse(event.body.toString());
  queries.new = `INSERT INTO entrasp.centri_gestionali 
      (codice_part, id_centro_gest, codice, descrizione, id_centro_gest_parent, id_responsabile, id_gruppo_lavoro, tree_path, flag_grc_controller, flag_grc_gestore)
      VALUES
     (${body.codice_part}, ${body.id_centro_gest}, ${body.codice}, ${body.descrizione}, 
     ${body.id_centro_gest_parent}, ${body.id_responsabile}, 209, ${body.codice}, 
     ${body.flag_grc_controller}, ${body.flag_grc_gestore})
     RETURNING id_centro_gest;`;
  queries.update = `
    UPDATE entrasp.centri_gestionali
    SET codice = ${body.codice},
        descrizione = ${body.descrizione},
        id_centro_gest_parent = ${body.id_centro_gest_parent},
        id_responsabile = ${body.id_responsabile},
        flag_grc_controller = ${body.flag_grc_controller},
        flag_grc_gestore = ${body.flag_grc_gestore}
    WHERE codice_part=${body.codice_part} AND id_centro_gest=${body.id_centro_gest}`;
}

var queryString_centri_cmb=
`SELECT id_centro_gest AS id,descrizione AS name from entrasp.centri_gestionali WHERE codice_part='$codice_part';`

var queryString_anagr_cmb=
`SELECT id_anagrafica AS id, concat(codice, ' - ', nome, ' ', cognome) as name from entrasp.anagrafiche_id WHERE codice_part='$codice_part';`

// WARNING: whenever form changes, position of combobox queries should be updated accordingly
  
queries.combo = [
  {
    queryString: queryString_centri_cmb,
    name: 'id_centro_gest_parent'
  },
  {
    queryString: queryString_anagr_cmb,
    name: 'id_responsabile'
  }
];

var ret_callback = function(return_value) {
  console.log(return_value.status);
  callback(null, return_value.response);
};

processor.process_request(event, context, form, queries, ret_callback);

};
