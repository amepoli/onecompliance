import { Component, ViewChild, OnChanges, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { FormGetterComponent, formGetterParams } from '../form-getter/form-getter.component';
import { BackendService } from '../backend/backend.service';
import { AuthService } from 'app/gorico/login-page/auth.service';
import { ToastService } from 'app/gorico/services/toast.service';
import { formViewParams } from '../form/form-view.component';


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

export class FormTableViewComponent implements OnChanges, OnInit {

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

  constructor(
    private backendService: BackendService,
    private authService: AuthService,
    private _toastService: ToastService
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

  fullScreen(): void {
    this.isFullScreen = !this.isFullScreen;
    this.sendEvent.emit({ eventType: 'fullScreen', queryParams: { value: this.isFullScreen } });
    // Update availalbe height 
    this.calculateFormHeight();
  }


  addNew(): void {
    this.formGetter.addRow();
  }

  saveChanges(): void {
    let _this = this;
    const values = _this.formGetter.formArray.map(form => form.form.value);
    // process the booleans (1/0 instead of true/false)
    values.forEach(entry => {
      for (const value in entry) {
        if (entry.hasOwnProperty(value)) {
          const element = entry[value];
          if (element == null) {
            continue; // skip null entries
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
          _this._toastService.showSuccessToast("Saved successfully!"); // show success toast
          if (_this.formGetter.eventTrigger == 'onSave') {
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
        - 36 // Full screen button
        - 36 // New button
        - 2; // divider
    }
    else {
      this.formHeight = ((window.innerHeight - 64) * 0.33)
        - 28 // Separator
        - 48 // Tabs
        - 36 // Full screen button
        - 36 // New button
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
    this.onReload.emit();
  }
}
