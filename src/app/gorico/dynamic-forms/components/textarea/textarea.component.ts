import { AfterViewInit, Component, ElementRef, HostBinding, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { ConsoleLoggerService } from "app/gorico/services/console_logger.service";
import { FieldConfig } from "../../field.interface";
@Component({
  selector: "app-textarea",
  template: `
<mat-form-field *ngIf="field.isVisible != false" [ngStyle]="{'width': '100%'}" appearance="outline" [formGroup]="group">
<mat-label>{{field.label}}</mat-label>
<textarea class="text-area" (input)="setHeights()" #textAreaEl
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
  
    .text-area {
      min-height: 18px !important;
      max-height: 256px !important;
    }
  `],
  host: {
    '[style.padding-top.px]': 'field.isVisible? "16": "0"',
    '[style.margin-right]': 'field.isVisible? "1%": "0"',
    '[style.margin-left]': 'field.isVisible? "1%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"'
  }
})
export class TextAreaComponent implements OnInit, AfterViewInit {
  field: FieldConfig;
  group: FormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page
  maxHeight: number = 256; // Maximum height of textarea element

  @ViewChild('textAreaEl') textAreaEl: ElementRef;
  @HostBinding('style.height.px') textAreaComponentHeight = '0';
  
  constructor(private _console: ConsoleLoggerService) { }
  
  ngOnInit() {
    this._console.log('textareaHeight:', this.field.textareaHeight);
  }

  ngAfterViewInit(){
    this.setHeights();
  }

  setHeights() {
    // Reset field height
    this.textAreaEl.nativeElement.style.height = 'inherit';

    // Get the computed styles for the element
    var computed = window.getComputedStyle(this.textAreaEl.nativeElement);

    // Calculate the height
    var height = Math.min(parseInt(computed.getPropertyValue('border-top-width'), 10)
      + parseInt(computed.getPropertyValue('padding-top'), 10)
      + this.textAreaEl.nativeElement.scrollHeight
      + parseInt(computed.getPropertyValue('padding-bottom'), 10)
      + parseInt(computed.getPropertyValue('border-bottom-width'), 10), this.maxHeight);

    // Apply heights
    this.textAreaEl.nativeElement.style.height = height + 'px';
    this.textAreaComponentHeight = (height + 78) + "";
  }
}
