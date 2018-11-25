import { Component, OnInit, ViewChild } from '@angular/core';
import { Validators } from '@angular/forms';
import { FieldConfig } from 'app/gorico/dynamic-forms/field.interface';
import { DynamicFormComponent } from 'app/gorico/dynamic-forms/components/dynamic-form/dynamic-form.component';


@Component({
  selector: 'selected-element',
  templateUrl: './selected-element.component.html',
  styleUrls: ['./selected-element.component.scss']
})
export class SelectedElementComponent implements OnInit {
    
  @ViewChild(DynamicFormComponent) form: DynamicFormComponent;
  n = 1;
  tot = 50;
  regConfig_it: FieldConfig[] = [
    {
      type: 'input',
      label: 'Codice',
      inputType: 'text',
      name: 'code',
      validations: [
        {
          name: 'required',
          validator: Validators.required,
          message: 'Codice mancante'
        },
        {
          name: 'pattern',
          validator: Validators.pattern('^[a-zA-Z]+$'),
          message: 'Accetta solo testo'
        }
      ]
    },
    {
        type: 'input',
        label: 'Descrizione',
        inputType: 'text',
        name: 'Description',
        validations: [
          {
            name: 'required',
            validator: Validators.required,
            message: 'Descrizione mancante'
          },
        ]
      },
      {
        type: 'combobox',
        label: 'Centro gestionale di livello superiore',
        name: 'superiore',
        options: [{id: '1', name: 'Amministrazione'}, 
                  {id: '2', name: 'Commerciale'}, 
                  {id: '3', name: 'Compliance'}, 
                  {id: '4', name: 'Consiglio di Amministrazione'}]
      }
    ];


  constructor() { }

  ngOnInit() {
  }

  submit(value: any) {
  }

}
