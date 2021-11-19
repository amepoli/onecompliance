import { Component, OnInit, ViewChild, ElementRef, AfterContentInit, OnDestroy, HostListener, ChangeDetectorRef, AfterViewInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';


import { TableViewComponent } from 'app/oc/views/table/table-view.component';
import { FormViewComponent } from '../views/form/form-view.component';
import { BottomTabsComponent } from '../bottom-tabs/bottom-tabs.component';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FormViewParams, MessageView, TableViewParams, TabType } from '../interfaces';
import { AuthService, BackendService, ConsoleLoggerService, DialogService, HelperService, ImportExportService, NavigationService, PubSubService, ReportService, ScrollService, TimeTrackerService, ToastService } from '../services';
import { DataSharingService } from '../services/data_sharing.service';
import { ToolbarElementsComponent } from '../toolbar-elements/toolbar-elements.component';

@Component({
    selector: 'homepage-tab',
    templateUrl: './homepage-tab.component.html',
    styleUrls: ['./homepage-tab.component.scss']
})

export class HomepageTabComponent implements OnInit, AfterViewInit, OnDestroy {

    tiles: any = [];
    toolbar_elements: any = [];

    isLoading: boolean = false;

    @Input() entry: string;
    @Input() keys: any = null;
    @Output() tabLoaded = new EventEmitter<any>();
    @ViewChild('toolbarElements') toolbarElements: ToolbarElementsComponent;


    constructor(
        protected route: ActivatedRoute,
        protected router: Router,
        protected backendService: BackendService,
        private pubSubService: PubSubService,
        private authService: AuthService,
        protected location: Location,
        private httpClient: HttpClient,
        private _toastService: ToastService,
        private _dialogService: DialogService,
        private _importExportService: ImportExportService,
        private _reportService: ReportService,
        private _navigationService: NavigationService,
        private _cdr: ChangeDetectorRef,
        private _timeTrackerService: TimeTrackerService,
        private _console: ConsoleLoggerService,
        private _dataSharingService: DataSharingService) {
    }

    ngOnInit(): void {

        const _this = this;

        this.tiles = [];
        
        
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.entry && this.entry && this.entry.length && changes.entry.previousValue !== this.entry) {
            this.loadTab();
        }
        // Make sure params are different before refreshing view
        // if (!this.addingNew && changes.formParams && this.formParams) {
        //     if (!changes.formParams.previousValue || (JSON.stringify(changes.formParams.previousValue) !== JSON.stringify(changes.formParams.currentValue))) {
        //         this.refreshView();
        //     }
        // } else {
        //     this.addingNew = false;
        // }
        // else {
        //     this.clearForm();
        // }
    }

    ngAfterViewInit() {
    }
    

    ngOnDestroy() {
        
    }

    loadTab() {
        const _this = this;
        if(_this.entry) {
            _this.isLoading = true;
            _this.backendService.loadHomePageTab(_this.entry,  _this.authService.getCurrentCompany({})).subscribe(
                response => {
                    console.log(response);
                    if(response.result === 'OK') {
                        _this.loadTiles(response.response.tiles);
                        _this.loadToolbarElements(response.response.toolbar_elements);
                    }
                    _this.isLoading = false;
                },
                error => {
                    _this._toastService.showErrorToast(error);
                    _this.isLoading = false;
                }
            )
        }
    }

    handleScroll($event) {
       
    }

    reload() {
        this._console.log('onReload: homepage-tab');
    }

    loadTiles(tiles: any) {
        this.tiles = [];
        if(tiles && tiles.length) {
            tiles.forEach(tile => {
                this.tiles.push(tile);
                if(tile.new_line) {
                    this.tiles.push(
                        {
                            isNewLineTile: true
                        }
                    )
                }
            })
        }
    }

    loadToolbarElements(toolbar_elements: any) {
        let leftElement = toolbar_elements.filter( x => x.position === 'left');
        let spacer = {
            viewType: 'spacer'
        };        
        let rightElement = toolbar_elements.filter( x => x.position === 'right');
        
        
        this.toolbar_elements = [];
        
        leftElement.map( element => {
            if(element.viewType === 'toggle') {
                this.toolbar_elements.push({
                    ...element,
                    checked: false
                });
            }
            else {
                this.toolbar_elements.push({
                    ...element,
                    selected: null
                });
            }
        });

        this.toolbar_elements.push(spacer);

        rightElement.map( element => {
            if(element.viewType === 'toggle') {
                this.toolbar_elements.push({
                    ...element,
                    checked: false
                });
            }
            else {
                this.toolbar_elements.push({
                    ...element,
                    selected: null
                });
            }
        });

        console.log(this.toolbar_elements);
    }

    updateSearchToggle(index: number, checked: boolean) {
        this.toolbar_elements[index].checked = checked;
    }
    
    gotoTile(i: number) {
        let keys = {};
        this.toolbarElements.toolbar_elements.filter( element => element.viewType === "toggle" && element.checked).forEach( element => {
            keys[element.fieldName] = true
        });

        this.toolbarElements.toolbar_elements.filter( element => element.viewType === "combobox" && element.selected).forEach( element => {
            keys[element.fieldName] = element.selected
        });
        
        this._dataSharingService.setData('homepageSearchKeys', keys);
        this.router.navigate(['/oc/main-table/progetti']);   
    }

}
