import { Component, ViewChild, OnChanges, Input, Output, EventEmitter, OnInit, HostListener, ChangeDetectorRef, ElementRef, AfterViewInit, OnDestroy, SimpleChanges } from '@angular/core';
import { FormGetterComponent } from '../form-getter/form-getter.component';
import { Subscription } from 'rxjs';
import { FormGetterParams, FormTableViewParams, MessageElement, MessageView } from 'app/oc/interfaces';
import { AuthService, BackendService, ConsoleLoggerService, DialogService, MessagesService, NavigationService, ScrollService, ToastService } from 'app/oc/services';
import { memoize } from 'app/oc/decorators/memoize';


@Component({
  selector: 'form-table-view',
  templateUrl: './form-table-view.component.html',
  styleUrls: ['./form-table-view.component.scss']
})

export class FormTableViewComponent implements OnChanges, OnInit, AfterViewInit, OnDestroy {

  // is Current Tab
  @Input() isTabMode: boolean = false;
  @Input() isCurTab: boolean = false;

  @ViewChild(FormGetterComponent, { static: true }) formGetter: FormGetterComponent;

  @Input() tableData: FormTableViewParams;
  @Input() SaveData: boolean;
  @Output() sendEvent = new EventEmitter<any>();
  @Output() onReload = new EventEmitter<any>();

  getterParams: FormGetterParams; // params for the child formGetter form view

  processView = false;   // handle the form-getter child view

  refreshOnSave = false;

  isFullScreen = false;

  filter: string = ""; // for filtering results

  // Height available for view
  formHeight = 1000;

  hideActions: string[] = []; // Hide actions

  messages: MessageElement[] = []; // Messages
  @Output() onMessagesUpdated: EventEmitter<MessageView[]> = new EventEmitter();

  // Form table view toolbar 
  isFormTableViewToolbarSticky: boolean = false;
  formTableViewToolbarPosition: number = 0;
  @ViewChild('formTableViewToolbar', { static: true }) formTableViewToolbar: ElementRef;

  subscriptions: Subscription[] = [];

  isDomandeRisposte?: boolean = null;
  domandeRisposteParams: any = {
    entryName: '',
    keys: {}
  };

  constructor(
    private cdRef: ChangeDetectorRef,
    private backendService: BackendService,
    private authService: AuthService,
    private _dialogService: DialogService,
    private _toastService: ToastService,
    private _navigationService: NavigationService,
    private _messagesService: MessagesService,
    private _console: ConsoleLoggerService
  ) { }

  ngOnInit() {
    const _this = this;
    _this.subscriptions.push(_this.formGetter.sendEvent.subscribe(
      event => {
        if (event.eventType === 'updateData') {   // child downloaded data

        } else { // just forward the event to parent
          _this.sendEvent.emit(event);
        }
      }));
    this.calculateFormHeight();
  }

  @memoize()
  ngOnChanges(changes: SimpleChanges) {
    const _this = this; // useful to debug
    if (changes.tableData) {
      _this.getterParams = {
        entryName: _this.tableData.entryName,
        keys: _this.tableData.keys,
        isNew: false,
        isVisible: true  // hide the child view and handle it from parent
      };
    } else if (changes.SaveData) {
      // To save on global Save event
      // _this.saveChanges();
    }
    else if (changes.isCurTab) {
      _this._console.table({ change: "form-isCurTab", tableData: _this.tableData ? true : false, isTabMode: _this.isTabMode, isCurTab: _this.isCurTab });
      _this._console.log("inside form-table-view isCurTab changes!");
    }
    else if (changes.isTabMode) {
      _this._console.table({ change: "form-isTabMode", tableData: _this.tableData ? true : false, isTabMode: _this.isTabMode, isCurTab: _this.isCurTab });
      _this._console.log("inside form-table-view isCurTab changes!");
    }

    if(_this.tableData.entryName === 'domande_risposte' || _this.tableData.entryName === 'domande_risposte_sezione') {
      _this.isDomandeRisposte = true;
      _this.domandeRisposteParams = {
        entryName: _this.tableData.entryName,
        keys: _this.tableData.keys
      }
    }
    else {
      _this.isDomandeRisposte = false;
    }
  }

  ngAfterViewInit() {
    let _this = this;
    _this.updateToolbarOffset();

    // Make toolbar sticky based on main-table scroll
    _this.subscriptions.push(ScrollService.MainTableScrollEventEmitter.subscribe(scrollInfo => {
      const windowScroll = scrollInfo.y;
      if (_this.formTableViewToolbarPosition < 1) {
        _this.updateToolbarOffset();
      }
      if (windowScroll >= _this.formTableViewToolbarPosition) {
        _this.isFormTableViewToolbarSticky = false;
      } else {
        _this.isFormTableViewToolbarSticky = false;
      }
    }));

    if (_this.isTabMode) {
      _this.subscriptions.push(_this._navigationService.onBottomTabRefreshRequested.subscribe((value) => {
        if (_this.isCurTab) {
          _this.saveChanges();
          // _this.formGetter.refreshView();
        }
      }));
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(element => {
      element.unsubscribe();
    });
  }

  fullScreen(): void {
    this.isFullScreen = !this.isFullScreen;
    this.sendEvent.emit({ eventType: 'fullScreen', queryParams: { value: this.isFullScreen } });
    // Update availalbe height 
    this.calculateFormHeight();

    setTimeout(() => {
      if (this.fullScreen) {
        ScrollService.RequestMainTableScrollToTopEventEmitter.emit(true);
        this.formTableViewToolbar.nativeElement.scrollIntoView();
      }
      this.updateToolbarOffset();
    }, 500);

  }


  addNew(): void {
    this.formGetter.addRow(this.tableData.keys);
  }

  isFormValid() {
    let isValid = true;

    if (this.formGetter.formArray && this.formGetter.formArray.length) {
      let formArray = this.formGetter.formArray.toArray();
      for (let i = 0; i < formArray.length; i++) {
        const form = formArray[i];
        // Old method in which we check the whole form at once
        // This is not good because it also checks invisible fields
        // if (!form.form.valid) {
        //     isValid = false;
        // }
        for (let j = 0; j < form.fields.length; j++) {
          const field = form.fields[j];
          if (field.isVisible) {
            if (form.form.get(field.name) && !form.form.get(field.name).valid) {
              form.form.get(field.name).markAsTouched({ onlySelf: false });
              isValid = false;
            }
          }
        }

        // if (!isValid) {
        //     // Highlight all empty required fields
        //     Object.keys(form.form.controls).forEach(field => {
        //         const control = form.form.get(field);
        //         control.markAsTouched({ onlySelf: false });
        //     });
        // }
      }
    }

    return isValid;
  }

  saveChanges(): void {
    const _this = this;
    if (_this.isFormValid()) {
      const values = _this.formGetter.formArray.map(form => form.form.value);
      // process the booleans (1/0 instead of true/false)
      for (let i = 0; i < values.length; i++) {
        const entry = values[i];
        for (const value in entry) {
          if (entry.hasOwnProperty(value)) {
            let element = entry[value];
            if (element == null) {
              // check if it is one of the table keys
              element = entry[value] = _this.tableData.keys[value];
              if (element == null) {
                continue; // skip null entries
              }
            }
            // decode combos
            if (element['id'] != null) {
              entry[value] = element['id'];
            }
            // encode boolean
            else if (element === true) {
              entry[value] = '1';
            }
            else if (element === false) {
              entry[value] = '0';
            }
          }
        }
      }
      _this.subscriptions.push(_this.backendService.updateData(_this.tableData.entryName, _this.authService.getCurrentCompany(_this.tableData.keys), _this.tableData.keys, values).subscribe(   // backend expects an array of data
        result => {
          _this._console.log(result);
          if (result.result === 'OK') {
            _this._toastService.showSuccessToast('Saved successfully!'); // show success toast
            if (_this.refreshOnSave) {
              _this.formGetter.refreshView();
            }
            else {
              _this.formGetter.runOnSaveEvents();
            }

            // if (_this.formGetter.eventTrigger === 'onSave') {
            //   setTimeout(() => {
            //     _this.sendEvent.emit({ eventType: _this.formGetter.outputEvent }); // notify parent
            //   }, 1000);
            // }

          }
          else {
            // Show error snackbar
            _this._toastService.showErrorToastWithReason(result.reason);
          }
        }));
    }

  }

  // Get height on resize
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    // Update height available
    this.calculateFormHeight();
  }

  calculateFormHeight() {
    if (this.isFullScreen) {
      this.formHeight = window.innerHeight
        - 64 // Titlebar
        - 47 // Navibar
        - 28 // Separator
        - 48 // Tabs
        - 36 // Buttons
        - 2; // divider
    }
    else {
      this.formHeight = ((window.innerHeight - 64) * 0.33)
        - 28 // Separator
        - 48 // Tabs
        - 36 // Buttons
        - 2; // divider
    }
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.filter = filterValue;
  }

  reload() {
    this._console.log('onReload: form-table-view');
    this.clearForm();
    this.onReload.emit();
  }

  clearForm() {
    this.getterParams = null;
    this.cdRef.detectChanges();
  }

  updateMessages(messageViews: MessageView[]) {
    this.messages = this._messagesService.getFormMessages(messageViews);
    this.onMessagesUpdated.emit(messageViews);
  }

  updateToolbarOffset() {
    let offset = ScrollService.cumulativeOffset(this.formTableViewToolbar.nativeElement);
    this.formTableViewToolbarPosition = offset.top - 150;
  }
}
