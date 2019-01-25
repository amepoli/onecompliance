import { Component, OnInit, ViewChild } from '@angular/core';
import { Validators } from '@angular/forms';
import { FieldConfig } from 'app/gorico/dynamic-forms/field.interface';
import { DynamicFormComponent } from 'app/gorico/dynamic-forms/components/dynamic-form/dynamic-form.component';
import { ActivatedRoute, Router } from '@angular/router';
import 'rxjs/add/operator/filter';
import { GenericTableService, operationType } from '../generic-table/generic-table.service';
import { element } from 'protractor';


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
  primaryKeys: any;
  table: string;
  isLoading = true;
  path: string;
  operation: operationType;

  constructor(private tableService: GenericTableService,
              private route: ActivatedRoute,
              private router: Router) { }
  
  ngOnInit() {
    this.n = this.tableService.currentIndex + 1;
    this.tot = this.tableService.keysArray.length;

    this.route.queryParams
      .subscribe(params => {
        this.primaryKeys = this.getKeys(params);
        this.table = params.table;  
        this.path = '/' + this.table; // table names must match with the path
        this.operation = params.operation;
        console.log(params);
        
        this.tableService.getData(this.path, this.primaryKeys, this.operation).subscribe(
            results => {
              this.isLoading = false;
              // console.log(results);
              let sameLineElements: FieldConfig[] = [];
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
                  if (result['newLine'] === 'false') {
                     sameLineElements.push(result);
                  } else {
                    result.width = this.processInlineElements(sameLineElements);
                    sameLineElements = [];
                  }
                }
              this.processInlineElements(sameLineElements); // handles inline elements of last line
              sameLineElements = [];
              console.log(results);
              this.regConfig_it = results; 
            },
            error => {
              this.isLoading = false;
          });
      });
  }

  private getKeys(obj) {
    const newObj = Object.keys(obj).reduce(function(no,key) {
        if (key.substring(0, 3) === 'key') {
          no[key] = obj[key];
        }
        return no;
    }, {});
    return newObj;
  }

  private processInlineElements (elements: FieldConfig[]): Number {
      // this is a small trick to reload indexes if coming from subtable 
    this.n = this.tableService.currentIndex + 1;
    this.tot = this.tableService.keysArray.length;

    const numElements = 1 + elements.length; // current + previouses
    let sumWidths = 0;
    if (elements.length) { // some elements to put on the same line
      const singleWidth = Math.floor(100 / numElements);
       for (let element of elements) {
        element.width = singleWidth  - 10; // considering 10% margins;
        sumWidths += singleWidth;
      }
    }  
    return (100 - 10 - sumWidths); // considering 10% margins
  }

  submit(value: any) {
      console.log(value);
      if (this.operation === operationType.create) {  // new record
          this.tableService.pushData(this.path, this.primaryKeys, value).subscribe(
              result => {
                  console.log(result);
              }
          );
      } else {  // this.operation = "select", need to update the record
        this.tableService.updateData(this.path, this.primaryKeys, value).subscribe(
          result => {
            console.log(result);
          }
        );
      }
      this.router.navigate(['/gorico/' + this.table]);
  }

  delElement() {
    this.tableService.deleteData(this.path, this.primaryKeys).subscribe(
      result => {
        console.log(result);
        this.router.navigate(['/gorico/' + this.table]);
      }
    )
  }

  toElement(target: string) {
    const indexArray = this.tableService.keysArray;
    const currentIndex = this.tableService.currentIndex;
    let targetIndex = currentIndex;
    if (target === 'first') {
        targetIndex = 0;
    }
    if (target === 'prev') {
        if (currentIndex > 0) {
            targetIndex = currentIndex - 1;
        } 
    }
    if (target === 'next') {
        if (currentIndex < (indexArray.length - 1)) {
            targetIndex = currentIndex + 1;
        } 
    }
    if (target === 'last') {
        targetIndex = indexArray.length - 1;
    }

    this.tableService.currentIndex = targetIndex;
    this.n = targetIndex + 1;
    const targetKeys = this.tableService.keysArray[targetIndex];
    const mergedParams = Object.assign({}, {table: this.table, operation: operationType.select}, targetKeys);
    this.router.navigate(['/gorico/details'], { queryParams: mergedParams, skipLocationChange: true });
  }

}
