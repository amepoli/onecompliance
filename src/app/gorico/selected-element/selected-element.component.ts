import { Component, OnInit, ViewChild } from '@angular/core';
import { Validators } from '@angular/forms';
import { FieldConfig } from 'app/gorico/dynamic-forms/field.interface';
import { DynamicFormComponent } from 'app/gorico/dynamic-forms/components/dynamic-form/dynamic-form.component';
import { ActivatedRoute, Router } from '@angular/router';
import 'rxjs/add/operator/filter';
import { MngtUnitsService } from '../mngt-units/mngt-units.service';


@Component({
  selector: 'selected-element',
  templateUrl: './selected-element.component.html',
  styleUrls: ['./selected-element.component.scss']
})
export class SelectedElementComponent implements OnInit {
    
  @ViewChild(DynamicFormComponent) form: DynamicFormComponent;
  n = 1;
  tot = 50;
  
  regConfig_it: FieldConfig[] = []; 
  id: string;
  codice_part: string;
  table: string;
  isLoading = true;

  constructor(private unitsService: MngtUnitsService,
              private route: ActivatedRoute,
              private router: Router) { }
  
  ngOnInit() {
    this.route.queryParams
      .filter(params => params.id)
      .subscribe(params => {
        this.id = params.id;
        this.codice_part = params.part;
        this.table = params.table;
        console.log(params);
        
        this.unitsService.getData(this.codice_part, this.id).subscribe(
            results => {
              this.isLoading = false;
              // console.log(results);
              for (let result of results) {
                  if (result['validations']) {
                  for (let validator of result['validations']) {
                     if (validator['name'] === 'required') {
                        validator['validator'] = Validators.required;
                     }
                     if (validator['name'] === 'pattern') {
                         validator['validator'] = Validators.pattern(validator['validator']);
                     }
                  }
                  }
                }
              this.regConfig_it = results; 
            },
            error => {
              this.isLoading = false;
            });
      });
  }

  submit(value: any) {
      console.log(value);
      if (this.id === 'NEW') {
          this.unitsService.pushData(this.codice_part, value).subscribe(
              result => {
                  console.log(result);
              }
          );
      } else {
        this.unitsService.updateData(this.codice_part, value).subscribe(
          result => {
            console.log(result);
          }
        )
      }
  }

  delElement() {
    this.unitsService.deleteData(this.codice_part, this.id).subscribe(
      result => {
        console.log(result);
        this.router.navigate(['/gorico/' + this.table]);
      }
    )
  }

}
