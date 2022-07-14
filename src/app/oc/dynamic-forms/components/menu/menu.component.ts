import { Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { FieldConfig, MenuOption } from 'app/oc/interfaces';
import { PubSubService } from 'app/oc/services';

@Component({
  selector: "app-menu",
  template: `
  <div align="center" [ngStyle]="{'display': 'inline-block', 'width': '100%'}">
    <button mat-icon-button color="primary" [disabled]="field.readonly" [matMenuTriggerFor]="matMenu1"
    [style.width]="'100%'" [style.height.px]="'64'" [style.padding]="'16px'" [style.border-radius]="'4px'" [style.background-color]="field.style && field.style.background_color? field.style.background_color: 'transparent'" [style.color]="field.style && field.style.font_color? field.style.font_color: null">
      {{field.label}}<mat-icon>{{field.buttonIcon}}</mat-icon>
    </button>
    <mat-menu #matMenu1="matMenu">
      <ng-container *ngFor="let item of field.menuOptions">
          <button mat-menu-item (click)="onClick(item)">
            <span>
              <mat-icon>{{item.icon}}</mat-icon>
            </span>{{item.label}}
          </button>
      </ng-container>
      <button mat-menu-item (click)="kycTech()"> <!-- *ngIf="showKycTechButton" (click)="kycTech()"-->
        <mat-icon>update</mat-icon>
        Check in Global Watchlist
    </button>
    </mat-menu>
  </div>
  `,
  styles: [`
    .checkboxgroup-label-padding {
      padding-left: 4px;
    }
  `],
  host: {
    '[style.padding-top.px]': 'field.isVisible? "8": "0"',
    '[style.margin-right]': 'field.isVisible? "1%": "0"',
    '[style.margin-left]': 'field.isVisible? "1%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"'
  }
})
export class MenuComponent implements OnInit {
  field: FieldConfig;
  group: FormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page

  selection = [];


  constructor(private pubSubService: PubSubService) { }
  ngOnInit() {
    const _this = this;

    if (_this.field.value == null || _this.field.value.length == null) {
      _this.field.value = [];
    }
    _this.field.options.forEach(option => {
      const selected = (_this.field.value.indexOf(option.id)) > -1 ? 1 : 0;
      _this.selection.push(selected);
    });

    // _this.field.options.map(x => {
    //   return { id: x.id, checked: false }
    // });

    // trigger an event the first time
    // setTimeout(() => { _this.pubSubService.publishEvent(_this.field.eventName, { origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: _this.field.value, type: 'checkboxgroup' }); }, 50);
  }

  onCheck(id: number, checked: boolean): void {
    const _this = this;

    this.selection[id] = checked ? 1 : 0;

    var index = _this.field.value.indexOf(_this.field.options[id].id);

    if (index > -1 && !checked) {  //remove an existing element from value array
      _this.field.value.splice(index, 1);
    } else if (checked && index === -1) {
      _this.field.value.push(_this.field.options[id].id);
    }

    if (_this.field.eventName !== null) {
      // wait a while before triggering the event
    }
  }

  onClick(item: MenuOption) {
    const _this = this;
    setTimeout(() => { _this.pubSubService.publishEvent(item.outputEventName, { showEventProcessing: true, origin: _this.field.name, index: _this.field.index, valueSet: _this.field.fullValueSet, data: item.label, type: 'menu' }); }, 50);
    
  }

  kycTech() {
    const _this = this;
    console.log('Check in global watchlist');

    //Here i have to call the method in form-getter line 1641

    
    /* if (_this.importDataSource === 'kyctech') {
      _this._dialogService.showLoadingDialog('Connecting to Regulat.io', 'Please wait...');
      _this.subscriptions.push(_this.backendService.KycTech(0).subscribe( // get the number of records
        result => {
          _this._console.log(result);
          _this._dialogService.closeDialog();
          _this._dialogService.showLoadingDialog('Retrieving records from Regulat.io', 'Please wait...');
          if (result.result === 'OK') {
            _this.subscriptions.push(_this.backendService.KycTech(result.numRecords).subscribe(
              innerResult => {
                _this._console.log(innerResult);
                if (innerResult.result === 'OK') {
                  _this.loadData();
                  _this._dialogService.closeDialog();
                  _this._toastService.showSuccessToast('Successfully updated!'); // show success toast} else {
                  _this._dialogService.closeDialog();
                  _this._toastService.showErrorToast('An error occured!');
                }
              },
              innerError => {
                _this._dialogService.closeDialog();
                _this._toastService.showErrorToast('An error occured!');
              }
            ));
          } else {
            _this._dialogService.closeDialog();
            _this._toastService.showErrorToast('An error occured!');
          }
        },
        error => {
          _this._dialogService.closeDialog();
          _this._toastService.showErrorToast('An error occured!');
        }
      ));
    } */
  }
}
