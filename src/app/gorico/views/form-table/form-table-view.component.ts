import { Component, ViewChild, OnChanges, Input, Output, EventEmitter, OnInit, HostListener, ChangeDetectorRef, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormGetterComponent, formGetterParams } from '../form-getter/form-getter.component';
import { BackendService } from '../backend/backend.service';
import { AuthService } from 'app/gorico/login-page/auth.service';
import { ToastService } from 'app/gorico/services/toast.service';
import { formViewParams } from '../form/form-view.component';
import { NavigationService, HideAction } from 'app/gorico/services/navigation.service';
import { DialogService } from 'app/gorico/services/dialog.service';
import { MessageView, MessageElement, MessagesService } from 'app/gorico/services/messages.service';
import { ScrollService } from 'app/gorico/services/scroll.service';


export interface formTableViewParams {
  entryName: string;
  keys: any;
  showHeader: boolean;
}

@Component({
  selector: 'form-table-view',
  templateUrl: './form-table-view.component.html',
  styleUrls: ['./form-table-view.component.scss']
})

export class FormTableViewComponent implements OnChanges, OnInit, AfterViewInit {

  // is Current Tab
  @Input() isTabMode: boolean = false;
  @Input() isCurTab: boolean = false;

  @ViewChild(FormGetterComponent) formGetter: FormGetterComponent;

  @Input() tableData: formTableViewParams;
  @Input() SaveData: boolean;
  @Output() sendEvent = new EventEmitter<any>();
  @Output() onReload = new EventEmitter<any>();

  getterParams: formGetterParams; // params for the child formGetter form view

  processView = false;   // handle the form-getter child view

  isFullScreen = false;

  filter: string = ""; // for filtering results

  // Height available for view
  formHeight = 1000;

  hideActions: string[] = []; // Hide actions
  @Output() onHideActionsUpdated: EventEmitter<HideAction[]> = new EventEmitter();

  messages: MessageElement[] = []; // Messages
  @Output() onMessagesUpdated: EventEmitter<MessageView[]> = new EventEmitter();

  // Form table view toolbar 
  isFormTableViewToolbarSticky: boolean = false;
  formTableViewToolbarPosition: number = 0;
  @ViewChild('formTableViewToolbar') formTableViewToolbar: ElementRef;

  constructor(
    private cdRef: ChangeDetectorRef,
    private backendService: BackendService,
    private authService: AuthService,
    private _dialogService: DialogService,
    private _toastService: ToastService,
    private _navigationServce: NavigationService,
    private _messagesService: MessagesService
  ) { }

  ngOnInit() {
    const _this = this;
    _this.formGetter.sendEvent.subscribe(
      event => {
        if (event.eventType === 'updateData') {   // child downloaded data

        } else { // just forward the event to parent
          _this.sendEvent.emit(event);
        }
      });
    this.calculateFormHeight();
  }

  ngOnChanges(changes) {
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
      console.table({ change: "form-isCurTab", tableData: _this.tableData ? true : false, isTabMode: _this.isTabMode, isCurTab: _this.isCurTab });
      console.log("inside form-table-view isCurTab changes!");
    }
    else if (changes.isTabMode) {
      console.table({ change: "form-isTabMode", tableData: _this.tableData ? true : false, isTabMode: _this.isTabMode, isCurTab: _this.isCurTab });
      console.log("inside form-table-view isCurTab changes!");
    }

  }

  ngAfterViewInit() {
    this.updateToolbarOffset();

    // Make toolbar sticky based on main-table scroll
    ScrollService.MainTableScrollEventEmitter.subscribe(scrollInfo => {
      const windowScroll = scrollInfo.y;
      if (this.formTableViewToolbarPosition < 1) {
        this.updateToolbarOffset();
      }
      if (windowScroll >= this.formTableViewToolbarPosition) {
        this.isFormTableViewToolbarSticky = true;
      } else {
        this.isFormTableViewToolbarSticky = false;
      }
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
      this.formGetter.formArray.forEach(form => {
        if (!form.form.valid) {
          isValid = false;
          // Highlight all empty required fields
          Object.keys(form.form.controls).forEach(field => {
            const control = form.form.get(field);
            control.markAsTouched({ onlySelf: true });
          });
        }
      });
    }
    return isValid;
  }

  saveChanges(): void {
    let _this = this;
    if (_this.isFormValid()) {
      const values = _this.formGetter.formArray.map(form => form.form.value);
      // process the booleans (1/0 instead of true/false)
      values.forEach(entry => {
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
      });
      _this.backendService.updateData(_this.tableData.entryName, _this.authService.getCurrentCompany(), _this.tableData.keys, values).subscribe(   // backend expects an array of data
        result => {
          console.log(result);
          if (result.result === 'OK') {
            _this._toastService.showSuccessToast('Saved successfully!'); // show success toast
            if (_this.formGetter.eventTrigger === 'onSave') {
              setTimeout(() => {
                _this.sendEvent.emit({ eventType: _this.formGetter.outputEvent }); // notify parent
              }, 1000);
            }
          }
          else {
            // Show error snackbar
            _this._toastService.showErrorToast(result.reason);
          }
        });
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
    console.log('onReload: form-table-view');
    this.clearForm();
    this.onReload.emit();
  }

  clearForm() {
    this.getterParams = null;
    this.cdRef.detectChanges();
  }

  updateHideActions(hideActions: HideAction[]) {
    this.hideActions = this._navigationServce.getFormHideActions(hideActions);
    this.onHideActionsUpdated.emit(hideActions);
  }

  updateMessages(messageViews: MessageView[]) {
    this.messages = this._messagesService.getFormMessages(messageViews);
    this.onMessagesUpdated.emit(messageViews);
  }

  updateToolbarOffset() {
    let offset = ScrollService.cumulativeOffset(this.formTableViewToolbar.nativeElement);
    this.formTableViewToolbarPosition = offset.top - 100;
  }
}
