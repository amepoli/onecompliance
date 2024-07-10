import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { FieldConfig } from '../../../../oc/interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss'],
  host: {
    '[style.padding-top]': 'field.isVisible? field.widgetType == "s3-explorer"? "10px": "8px": "0"',
    '[style.margin-right]': 'field.isVisible? field.widgetType == "s3-explorer"? "0.5%": "8px": "0"',
    '[style.margin-left]': 'field.isVisible? field.widgetType == "s3-explorer"? "0.5%": "0px": "0"',
    '[style.width]': 'field.isVisible? field.widgetType == "s3-explorer"? "98%": "32px": "0"',
    '[style.height]': 'field.isVisible? field.widgetType == "s3-explorer"? "500px": "32px": "0"',
    '[style.background-color]': 'field.isVisible? field.widgetType == "s3-explorer"? "aliceblue": "transparent": "transparent"',
    '[style.border]': 'field.isVisible? field.widgetType == "s3-explorer"? "1px solid lightgrey": "none": "none"',
    '[style.border-radius]': 'field.isVisible? field.widgetType == "s3-explorer"? "5px": "0": "0"',
 }
})
export class WidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  field: FieldConfig;
  group: UntypedFormGroup;
  readOnlyPage: boolean = false; // field.readonly overridden by page
  isRequired = false; // field is required or not

  // For future use
  // @HostBinding('style.margin-right') marginRight = '0.5%';

  constructor() { }

  ngOnInit(): void {
    
  }

  ngAfterViewInit(): void {
    // To get parent element using a class
    // const parentElement = this.elRef.nativeElement.closest('.form-view-component');
  }

  ngOnDestroy(): void {
  }

  attachmentOnSave(result) {
    
  }
}
