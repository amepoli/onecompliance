import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { FileManagerService } from 'app/main/apps/file-manager/file-manager.service';
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
  businessObjectName: string = 'riepilogoRisposte';

  subscription: Subscription;

  numberValue?: number = undefined;
  stringValue?: string = undefined;

  // For future use
  // @HostBinding('style.margin-right') marginRight = '0.5%';

  constructor(private elRef: ElementRef,
              private timezoneService: TimezoneService,
              private pubSubService: PubSubService,
              private _console: ConsoleLoggerService,
              private _dialogService: DialogService,
              private fileService: FileManagerService) { }

  ngOnInit(): void {
    let _this = this;
    if(_this.field.value != null)
    {
      if ( _this.field.widgetType === 'multi-attachments' || _this.field.widgetType === 'attachments' ) {
        _this.numberValue = parseInt(_this.field.value, 0);
      }
    }

    if(_this.field.fullValueSet.businessObjectName) {
      _this.businessObjectName = _this.field.fullValueSet.businessObjectName;
    }
    
    _this.fileService.onSave.subscribe(entryName => {
      _this.attachmentOnSave(entryName);
    })
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
