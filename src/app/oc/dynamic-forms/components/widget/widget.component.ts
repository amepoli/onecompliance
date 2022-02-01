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
    '[style.padding-top.px]': 'field.isVisible? "24": "0"',
    '[style.margin-right.px]': 'field.isVisible? "8": "0"',
    '[style.margin-left.px]': 'field.isVisible? "8": "0"',
    '[style.width.px]': 'field.isVisible? "32": "0"',
    '[style.height.px]': 'field.isVisible? "32": "0"',
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
