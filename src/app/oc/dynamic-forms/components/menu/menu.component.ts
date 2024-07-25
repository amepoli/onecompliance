import { Component, OnInit } from "@angular/core";
import { UntypedFormGroup } from "@angular/forms";
import { FieldConfig, MenuOption } from 'app/oc/interfaces';
import { PubSubService } from 'app/oc/services';

@Component({
  selector: "app-menu",
  template: `
  <div align="center" [ngStyle]="{'display': 'inline-block', 'width': '100%'}" [style.padding-top]="'0px'">
    <button mat-raised-button color="primary" [disabled]="field.readonly" [matMenuTriggerFor]="matMenu1"
    [style.width]="'100%'" [style.height.px]="'64'" [style.border-radius]="'4px'" [style.background-color]="'#2A4F9D'" [style.color]="field.style && field.style.font_color? field.style.font_color: null"
    [style.padding]="'0px'" [style.border]="'0.1px solid #144FB7'" [matTooltip]="field.tooltip">
      {{field | octranslate}}<mat-icon>{{field.buttonIcon}}</mat-icon>
    </button>
    <mat-menu #matMenu1="matMenu">
      <ng-container *ngFor="let item of filteredMenuOptions">
          <button mat-menu-item (click)="onClick(item)" [matTooltip]="item.tooltip">
            <span>
              <mat-icon>{{item.icon}}</mat-icon>
            </span>{{item | octranslate}}
          </button>
      </ng-container>
      <!-- <button mat-menu-item *ngIf="showKycTechButton" (click)="kycTech()">  
        <mat-icon>update</mat-icon>
        Check in Global Watchlist
    </button> -->
    </mat-menu>
  </div>
  `,
  styles: [`
    .checkboxgroup-label-padding {
      padding-left: 4px;
    }
    :host ::ng-deep .mat-form-field-wrapper {
      padding-bottom: 2px !important;
    }
  `],
  host: {
    // '[style.padding-top.px]': 'field.isVisible? "4": "0"',
    // '[style.padding-bottom.px]': 'field.isVisible? "4": "0"',
    '[style.margin-right]': 'field.isVisible? "0.5%": "0"',
    '[style.margin-left]': 'field.isVisible? "0.5%": "0"',
    '[style.width]': 'field.isVisible? field.width + "%": "0"',
    '[style.height]': 'field.isVisible? "76px": "0"'
  }
})
export class MenuComponent implements OnInit {
  field: FieldConfig;
  group: UntypedFormGroup;
  readOnlyPage: boolean; // field.readonly overridden by page

  selection = [];

  filteredMenuOptions: MenuOption[] = [];


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

    if(_this.field.menuOptions != null && _this.field.menuOptions.length > 0) {
      _this.filteredMenuOptions = _this.field.menuOptions.filter(x => !x.isHidden);
    }
    else {
      _this.filteredMenuOptions = [];
    }

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
}
