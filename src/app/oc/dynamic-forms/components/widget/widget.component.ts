import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FieldConfig } from 'app/oc/interfaces';
import { ConsoleLoggerService, DialogService, HelperService, PubSubService, ValidationsService } from 'app/oc/services';
import { TimezoneService } from 'app/oc/services/timezone.service';
import * as moment from 'moment';
import { Moment } from 'moment';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss'],
  host: {
    '[style.padding-top]': 'field.isVisible? field.widgetType == "s3-manager"? "10px": "24px": "0"',
    '[style.margin-right]': 'field.isVisible? field.widgetType == "s3-manager"? "1%": "8px": "0"',
    '[style.margin-left]': 'field.isVisible? field.widgetType == "s3-manager"? "1%": "8px": "0"',
    '[style.width]': 'field.isVisible? field.widgetType == "s3-manager"? "98%": "32px": "0"',
    '[style.height]': 'field.isVisible? field.widgetType == "s3-manager"? "500px": "32px": "0"',
    '[style.background-color]': 'field.isVisible? field.widgetType == "s3-manager"? "aliceblue": "transparent": "transparent"',
    '[style.border]': 'field.isVisible? field.widgetType == "s3-manager"? "1px solid lightgrey": "none": "none"',
    '[style.border-radius]': 'field.isVisible? field.widgetType == "s3-manager"? "5px": "0": "0"',
 }
})
export class WidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  field: FieldConfig;
  group: FormGroup;
  readOnlyPage: boolean = false; // field.readonly overridden by page
  isRequired = false; // field is required or not

  subscription: Subscription;

  // For future use
  // @HostBinding('style.margin-right') marginRight = '1%';

  constructor(private elRef: ElementRef,
              private timezoneService: TimezoneService,
              private pubSubService: PubSubService,
              private _console: ConsoleLoggerService,
              private _dialogService: DialogService) { }
  ngOnInit(): void {
    
  }

  ngAfterViewInit(): void {
    // To get parent element using a class
    // const parentElement = this.elRef.nativeElement.closest('.form-view-component');
  }

  ngOnDestroy(): void {
      if (this.subscription != null) {
        this.subscription.unsubscribe();
      }
  }

  attachmentOnSave(result) {
    this._console.log(result);
  }
}
