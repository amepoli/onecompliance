import { Component, HostBinding, OnInit, ViewEncapsulation } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { ConsoleLoggerService } from "app/gorico/services/console_logger.service";
import { FieldConfig } from "../../field.interface";
@Component({
  selector: "app-textarea",
  template: `
<mat-form-field *ngIf="field.isVisible != false" [ngStyle]="{'width': '100%'}" appearance="outline" [formGroup]="group">
<mat-label>{{field.label}}</mat-label>
<textarea [class.text-area-s]="field.textareaHeight == 'S'" [class.text-area-m]="field.textareaHeight == 'M'"
 [class.text-area-l]="field.textareaHeight == 'L'" [class.text-area-xl]="field.textareaHeight == 'XL'"
 matInput [formControlName]="field.name" [readonly]="field.readonly || readOnlyPage" matTextareaAutosize matAutosizeMinRows="1" matAutosizeMaxRows="5"></textarea>
<ng-container *ngFor="let validation of field.validations;" ngProjectAs="mat-error">
<mat-error *ngIf="group.get(field.name).hasError(validation.name)">{{validation.message}}</mat-error>
</ng-container>
</mat-form-field>
`,
  styles: [`
    :host ::ng-deep .mat-form-field-flex {
      background-color: aliceblue;
      border-radius: 8px;
    }
  
    .text-area-s {
      min-height: 18px !important;
      max-height: 18px !important;
      height: 18px !important;
    }
    
    .text-area-m {
      min-height: 68px !important;
      max-height: 68px !important;
      height: 68px !important;
    }
    
    .text-area-l {
      min-height: 118px !important;
      max-height: 118px !important;
      height: 118px !important;
    }
    
    .text-area-xl {
      min-height: 168px !important;
      max-height: 168px !important;
      height: 168px !important;
    }

  `],
  host: {
    '[style.padding-top.px]': 'field.isVisible? "16": "0"',
    '[style.margin-right]': 'field.isVisible? "1%": "0"',
    '[style.margin-left]': 'field.isVisible? "1%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"'
  }
})
export class TextAreaComponent implements OnInit {
  field: FieldConfig;
  group: FormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page

  //    '[style.height.px]': 'field.isVisible? (field.textareaHeight == "l"? "206": "96"): "0"',

  @HostBinding('style.height.px') height = '0';

  constructor(private _console: ConsoleLoggerService) { }
  ngOnInit() {
    this._console.log('textareaHeight:', this.field.textareaHeight);
    this.setHeights();
  }

  setHeights() {
    if (this.field.isVisible) {
      switch (this.field.textareaHeight) {
        case 'S': default:
          this.height = "96";
          break;
        case 'M':
          this.height = "146";
          break;
        case 'L':
          this.height = "196";
          break;
        case 'XL':
          this.height = "246";
          break;
      }
    }
    else {
      this.height = "0";
    }
  }
}
