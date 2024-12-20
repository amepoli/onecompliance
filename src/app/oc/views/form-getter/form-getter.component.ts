
import { Component, Input, Output, EventEmitter, OnChanges, ViewChildren, QueryList, AfterViewInit, OnDestroy, SimpleChanges, ChangeDetectorRef, ViewChild, Attribute } from "@angular/core";
import { DynamicFormComponent } from "app/oc/dynamic-forms/components/dynamic-form/dynamic-form.component";
import { ComboboxComponent } from "app/oc/dynamic-forms/components/combobox/combobox.component";
import { Subscription } from "rxjs";
import { SubformComponent } from "app/oc/dynamic-forms/components/subform/subform.component";
import { AttributePostChecks, EmailActionParameters, ExportItem, FieldConfig, FormGetterParams, FormViewKey, GoogleAPIParams, ImportItem, MessageView, OutputEvent, WidgetsConfigurations } from "app/oc/interfaces";
import { FormDataType } from "app/oc/types";
import { AuthService, BackendService, ConsoleLoggerService, DialogService, EmailService, FormsService, GoogleAPIService, HelperService, ImportExportService, NavigationService, PubSubService, TimeTrackerService, ToastService, ValidationsService } from "app/oc/services";
import { DynamicFieldDirective } from "app/oc/directives";
import { SubFormDynamicFieldDirective } from "app/oc/directives/subform-dynamic-field.directive";
import { RegulatAPIParams } from "app/oc/interfaces/regulat_api_params";
import { NotifyTicketParams } from "app/oc/interfaces/notify_ticket_params.interface";
import { MatDialog as MatDialog } from "@angular/material/dialog";
import { MenuOptionsCustomDialogComponent } from "app/oc/dialogs/menu-options-custom.dialog/menu-options-custom.dialog.component";
import { FileManagerService } from "app/main/apps/file-manager/file-manager.service";

import { memoize } from "app/oc/decorators/memoize";
import { TranslateService } from "@ngx-translate/core";

@Component({
    selector: "form-getter",
    templateUrl: "./form-getter.component.html",
    styleUrls: ["./form-getter.component.scss"],
})
export class FormGetterComponent
    implements OnChanges, AfterViewInit, OnDestroy
{
    // Is form-getter inside a tab
    @Input() isTabMode: boolean = false;

    // Is form-getter part of form-view
    @Input() isFormView: boolean = false;

    // Is form-getter part of dialog form-view
    @Input() isDialog: boolean = false;

    @Input() filter: string;
    @Input() formParams: FormGetterParams = null;
    @Output() sendEvent = new EventEmitter<any>();
    @Output() onReload = new EventEmitter<any>();

    // Keys that are provided by external source and are passed to the values in onSave function
    @Input() externalKeys: object = {};

    @ViewChildren(DynamicFormComponent)
    formArray: QueryList<DynamicFormComponent>;

    // Contains form Data
    filteredFormData: FieldConfig[][];
    quickAddData: boolean[];

    isLoading = false;
    isAddingNew = false;

    isReadOnly = false;

    hiddenRows: boolean[] = [];

    readonlyRows: boolean[] = [];

    hideActions: string[] = [];

    importList: ImportItem[] = [];
    exportList: ExportItem[] = [];

    numRows = 1;

    @Output() onMessagesUpdated: EventEmitter<MessageView[]> = new EventEmitter();

    isAuthorized: boolean = true;
    viewKeys: FormViewKey[]; // view form fields as specified by the backend
    formRowProperties: any[];
    businessObjectName: string = null;

    currentKeys: any; // relevant keys passed by the parent component

    outputEvents: OutputEvent[]; // event to be published to PubSub after (re)loading the table values
    // eventTrigger: string = null;

    formSubscriptions: Subscription[] = [];
    generalSubscriptions: Subscription[] = [];

    results: any[] = null;

    attributes: any[] = null;

    valueOverrides: any = {};

    private addingNew = false; // avoid to trigger a refresh (with related events) when adding a row

    private margins = 1; // % of margins, considering left and right

    private pagination = {
        curPage: 1,
        curRecords: [],
        totalPages: 1
    };

    private recordsPerPage = 10000;

    widgetsConfiguration: WidgetsConfigurations = {
        attachments: {
            onSaveAction: "reload",
        },
    };

    attributePostChecks: { [key: string]: AttributePostChecks[] } = {};

    constructor(
        private cdRef: ChangeDetectorRef,
        private backendService: BackendService,
        private pubSubService: PubSubService,
        private authService: AuthService,
        private _toastService: ToastService,
        private _dialogService: DialogService,
        private _importExportService: ImportExportService,
        private _navigationService: NavigationService,
        private _console: ConsoleLoggerService,
        private _timeTrackerService: TimeTrackerService,
        private _googleAPIService: GoogleAPIService,
        public cutomDialog: MatDialog,
        private _fileService: FileManagerService,
        private _formsService: FormsService,
        private _emailService: EmailService,
        private _translateService: TranslateService
    ) {}

    @memoize()
    ngOnChanges(changes: SimpleChanges) {
        if (changes.filter && this.results && this.results.length) {
            this.applyFilter();
        }
        // Make sure params are different before refreshing view
        // if (!this.addingNew && changes.formParams && this.formParams) {
        //     if (!changes.formParams.previousValue || (JSON.stringify(changes.formParams.previousValue) !== JSON.stringify(changes.formParams.currentValue))) {
        //         this.refreshView();
        //     }
        // } else {
        //     this.addingNew = false;
        // }
        if (changes.formParams && this.formParams) {
            if (!this.addingNew) {
                if (!changes.formParams.previousValue || JSON.stringify(changes.formParams.previousValue) !== JSON.stringify(changes.formParams.currentValue)) {
                    // unsubscribe and then subscribe again
                    this.formSubscriptions.forEach((subscription) => {
                        subscription.unsubscribe();
                    });
                    this.refreshView(true);
                }
            } else {
                this.addingNew = false;
            }
        }
        // else {
        //     this.clearForm();
        // }
    }

    ngAfterViewInit() {
        const _this = this;
        // check and in case publish a table event on PubSub
        let subscription = _this.formArray.changes.subscribe((c) => {
            // run events based on form state
            if (_this.formParams && _this.formArray.length) {
                // If adding new, run on Add New Events
                if (_this.formParams.isNew) {
                    _this.runOnAddNewEvents();
                }
                // otherwise, run on Reload Events
                else {
                    _this.runOnReloadEvents();
                }
            }
        });
        _this.generalSubscriptions.push(subscription);

        subscription = _this._fileService.onSave.subscribe((entryName) => {
            _this.attachmentsOnSave(entryName);
        });
        _this.generalSubscriptions.push(subscription);

        if (_this.isFormView && !_this.isTabMode) {
            subscription = _this.pubSubService.subscribe(
                "navigate_on_save_button",
                (value) => {
                    _this.eventCallback(value.data, value, null); // null as keyListener means that the full table is affected
                },
            );
            _this.generalSubscriptions.push(subscription);
        }

        const mainToolbarDialogsSubscription =
            _this._dialogService.onShowMainToolbarDialog.subscribe(
                (outputEventName) => {
                    if (outputEventName) {
                        _this.showMainToolbarDialog(outputEventName);
                    }
                },
            );
        _this.generalSubscriptions.push(mainToolbarDialogsSubscription);
    }

    ngOnDestroy() {
        this._dialogService.updateMainToolbarDialogs([]);

        this.generalSubscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });

        this.formSubscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }

    @memoize()
    public resetPagination(filteredFormData: FieldConfig[][]) {
        if (filteredFormData && filteredFormData.length) {
            this.pagination = {
                curPage: 1,
                curRecords: [],
                totalPages: Math.ceil(
                    filteredFormData.length / this.recordsPerPage,
                ),
            };
            this.updatePagination(0);
        } else {
            this.pagination = {
                curPage: 1,
                curRecords: [],
                totalPages: 1,
            };
        }
    }

    public updatePagination(pageInc: number = 0) {
        let curPage =
            this.pagination.curPage + pageInc > 0 &&
            this.pagination.curPage + pageInc <= this.pagination.totalPages
                ? this.pagination.curPage + pageInc
                : this.pagination.curPage;

        let start = (curPage - 1) * this.recordsPerPage;
        let end = Math.min(
            this.filteredFormData.length,
            start + this.recordsPerPage,
        );

        let curRecords = [];
        for (let i = start; i < end; i++) {
            curRecords = [...curRecords, i];
        }

        //let curRecords = Array(Math.min(this.recordsPerPage,  + ).map((v, i) => ((this.pagination.curPage -1) * this.pagination.recordsPerPage) + i);
        this.pagination.curPage = curPage;
        this.pagination.curRecords = curRecords;
    }

    public runOnAddNewEvents() {
        if (this.outputEvents != null && this.outputEvents.length) {
            for (let i = 0; i < this.outputEvents.length; i++) {
                const outputEvent = this.outputEvents[i];
                if (
                    !outputEvent.eventTrigger ||
                    outputEvent.eventTrigger === "onAddNew"
                ) {
                    this.pubSubService.publishEvent(outputEvent.eventName, {
                        origin: "table",
                        index: 0,
                        data: this.filteredFormData,
                        type: "page",
                    });
                }
            }
        }
    }

    public runOnReloadEvents() {
        if (this.outputEvents != null && this.outputEvents.length) {
            for (let i = 0; i < this.outputEvents.length; i++) {
                const outputEvent = this.outputEvents[i];
                if (
                    !outputEvent.eventTrigger ||
                    outputEvent.eventTrigger === "onReload"
                ) {
                    this.pubSubService.publishEvent(outputEvent.eventName, {
                        origin: "table",
                        index: 0,
                        data: this.filteredFormData,
                        type: "page",
                    });
                }
            }
        }
    }

    public runOnSaveEvents() {
        if (this.outputEvents != null && this.outputEvents.length) {
            for (let i = 0; i < this.outputEvents.length; i++) {
                const outputEvent = this.outputEvents[i];
                if (
                    !outputEvent.eventTrigger ||
                    outputEvent.eventTrigger === "onSave"
                ) {
                    this.pubSubService.publishEvent(outputEvent.eventName, {
                        origin: "table",
                        index: 0,
                        data: this.filteredFormData,
                        type: "page",
                    });
                }
            }
        }
    }

    public showMainToolbarDialog(outputEventName: string) {
        if (this.filteredFormData != null) {
            let field = this.filteredFormData[0][0];
            this.pubSubService.publishEvent(outputEventName, {
                origin: "toolbar",
                index: 0,
                valueSet: field.fullValueSet,
                type: "menu",
            });
        }
    }

    refreshView(reloadEvents: boolean = true) {
        const _this = this;
        _this.isLoading = true;
        if (!_this.isDialog) {
            _this.sendEvent.emit({
                eventType: "searchKeys",
                queryParams: { keys: null },
            }); // pass search keys to parent view
        }

        const subscription = _this.backendService
            .getView(
                _this.formParams.entryName,
                _this.authService.getCurrentCompany(_this.currentKeys),
                _this.formParams.keys,
            )
            .subscribe((results) => {
                _this._console.log(results);
                if (results.result === "OK") {
                    const params = results.data;

                    const mainToolbarDialogs = params.main_toolbar_dialogs;
                    if (
                        _this.isFormView &&
                        !this.isTabMode &&
                        mainToolbarDialogs
                    ) {
                        _this._dialogService.updateMainToolbarDialogs(
                            mainToolbarDialogs,
                        );
                    } else {
                        _this._dialogService.updateMainToolbarDialogs([]);
                    }

                    _this.viewKeys = params.form_keys;
                    if (_this.viewKeys == null) {
                        return; // no formKeys defined for the table, stop here
                    }
                    _this.businessObjectName = params.businessObjectName;

                    // Load Hide actions if available
                    _this.hideActions =
                        _this._navigationService.getFormHideActions(
                            params.hideActions,
                        );

                    // Profile hide actions
                    if (params.profileHideActions) {
                        _this.hideActions = _this.hideActions.concat(
                            params.profileHideActions,
                        );
                    }

                    // Load Import Queries list if available
                    if (
                        params.importQueries &&
                        params.importQueries.formQueries
                    ) {
                        _this.importList = params.importQueries.formQueries;
                    } else {
                        _this.importList = [];
                    }

                    // Load Export Queries list if available
                    if (
                        params.exportQueries &&
                        params.exportQueries.formQueries
                    ) {
                        _this.exportList = params.exportQueries.formQueries;
                    } else {
                        _this.exportList = [];
                    }

                    if (
                        _this.isFormView &&
                        !_this.isTabMode &&
                        !_this.isDialog
                    ) {
                        // Load Import Queries list if available
                        if (
                            params.importQueries &&
                            params.importQueries.formQueries
                        ) {
                            _this._console.log(
                                "importQueries",
                                params.importQueries,
                            );
                            _this._importExportService.updateImportList(
                                _this.formParams.entryName,
                                params.importQueries.formQueries,
                            );
                        } else {
                            _this._importExportService.updateImportList(
                                _this.formParams.entryName,
                                [],
                            );
                        }

                        // Load Export Queries list if available
                        if (
                            params.exportQueries &&
                            params.exportQueries.formQueries
                        ) {
                            _this._console.log(
                                "exportQueries",
                                params.exportQueries,
                            );
                            _this._importExportService.updateExportList(
                                _this.formParams.entryName,
                                params.exportQueries.formQueries,
                            );
                        } else {
                            _this._importExportService.updateExportList(
                                _this.formParams.entryName,
                                [],
                            );
                        }

                        // Load Hide actions if available
                        _this._navigationService.updateToolbarHideActions(
                            _this.hideActions,
                        );

                        // Load Messages if available
                        if (params.messages) {
                            _this._console.log(params.messages);
                            _this.onMessagesUpdated.emit(params.messages);
                        } else {
                            _this.onMessagesUpdated.emit([]);
                        }
                    }

                    _this.loadAttributePostChecks();

                    // signal toolbar about a dashboard
                    _this._navigationService.onDashboardTableLoad.emit({
                        origin: _this.formParams.entryName,
                        dashboardTables: params.dashboardTables,
                    });

                    // Get View properties if exist
                    _this.formRowProperties = params.formRowProperties;
                    if (
                        _this.formRowProperties &&
                        _this.formRowProperties.length
                    ) {
                        for (
                            let i = 0;
                            i < _this.formRowProperties.length;
                            i++
                        ) {
                            const formRowProperty = _this.formRowProperties[i];
                            // Subscribe to all the input Events
                            if (
                                formRowProperty.inputEvents &&
                                formRowProperty.inputEvents.length
                            ) {
                                for (
                                    let j = 0;
                                    j < formRowProperty.inputEvents.length;
                                    j++
                                ) {
                                    const event =
                                        formRowProperty.inputEvents[j];
                                    setTimeout(() => {
                                        const subcription =
                                            _this.pubSubService.subscribe(
                                                event.eventName,
                                                (value) => {
                                                    _this.eventCallback(
                                                        event,
                                                        value,
                                                        null,
                                                    ); // null as keyListener means that the full table is affected
                                                },
                                            );
                                        _this.formSubscriptions.push(
                                            subcription,
                                        );
                                    }, 50);
                                }
                            }
                        }
                    }

                    _this.currentKeys = _this.getCurrentKeys(
                        _this.viewKeys,
                        _this.formParams.keys,
                    );
                    _this.sendEvent.emit({
                        eventType: "formData",
                        queryParams: { label: params.label },
                        viewKeys: _this.currentKeys,
                        tabKeys: params.subTables,
                    });
                    if (!_this.isTabMode && !_this.isDialog) {
                        _this.sendEvent.emit({
                            eventType: "currentTableLabel",
                            queryParams: { label: params.label },
                        }); // pass current label to parent view
                    }

                    // handle input events
                    if (reloadEvents) {
                        if (params.inputEvents != null) {
                            // subscribe to global table events
                            for (
                                let i = 0;
                                i < params.inputEvents.length;
                                i++
                            ) {
                                const event = params.inputEvents[i];
                                setTimeout(() => {
                                    const subcription =
                                        _this.pubSubService.subscribe(
                                            event.eventName,
                                            (value) => {
                                                _this.eventCallback(
                                                    event,
                                                    value,
                                                    null,
                                                ); // null as keyListener means that the full table is affected
                                            },
                                        );
                                    _this.formSubscriptions.push(subcription);
                                }, 50);
                            }
                        }
                        setTimeout(() => {
                            _this.subscribeFieldInputEvents(_this.viewKeys);
                        }, 50);
                    }
                    // load output events if any
                    if (params.outputEvents != null) {
                        _this.outputEvents = params.outputEvents;
                    }

                    // load the form
                    _this.loadTableData();

                    // Load widgets configurations
                    _this.loadWidgetsConfiguration(params.widgetsConfiguration);
                } else {
                    if (results.reason === "Not Authorized") {
                        _this._console.log("Not Authorized");
                        _this.isAuthorized = false;
                    } else {
                        // Show error snackbar
                        _this._toastService.showErrorToastWithReason(results.reason);
                    }
                    // // Show error snackbar
                    // _this._toastService.showErrorToast(results.reason);
                }
            }, error => {
                _this._console.log(error);
            });
        _this.generalSubscriptions.push(subscription);
    }

    loadAttributePostChecks() {
        const _this = this;

        let attributePostChecks = {};

        _this.viewKeys.forEach((key) => {
            if (key.attributePostChecks && key.attributePostChecks.length) {
                attributePostChecks[key.key] = key.attributePostChecks;
            }
        });
        _this.attributePostChecks = attributePostChecks;
    }

    applyAttributePostChecks(results: any) {
        const _this = this;
        if (Array.isArray(results.data)) {
            for (let i = 0; i < results.data.length; i++) {
                Object.keys(_this.attributePostChecks).forEach((key) => {
                    _this.attributePostChecks[key].forEach((postCheck) => {
                        let conditionMet = true;
                        if (postCheck.resultType === "condition") {
                            if (postCheck.conditionType === "equalTo") {
                                if (
                                    results.data[i][postCheck.key] != null &&
                                    typeof results.data[i][postCheck.key] ===
                                        "object"
                                ) {
                                    if (
                                        results.data[i][postCheck.key].value ===
                                        postCheck.conditionValue
                                    ) {
                                        conditionMet = true;
                                    } else {
                                        conditionMet = false;
                                    }
                                } else {
                                    if (
                                        results.data[i][postCheck.key] ===
                                        postCheck.conditionValue
                                    ) {
                                        conditionMet = true;
                                    } else {
                                        conditionMet = false;
                                    }
                                }
                            } else if (
                                postCheck.conditionType === "notEqualTo"
                            ) {
                                if (
                                    results.data[i][postCheck.key] != null &&
                                    typeof results.data[i][postCheck.key] ===
                                        "object"
                                ) {
                                    if (
                                        results.data[i][postCheck.key].value !==
                                        postCheck.conditionValue
                                    ) {
                                        conditionMet = true;
                                    } else {
                                        conditionMet = false;
                                    }
                                } else {
                                    if (
                                        results.data[i][postCheck.key] !==
                                        postCheck.conditionValue
                                    ) {
                                        conditionMet = true;
                                    } else {
                                        conditionMet = false;
                                    }
                                }
                            } else if (
                                postCheck.conditionType === "greaterThan"
                            ) {
                                if (
                                    results.data[i][postCheck.key] != null &&
                                    typeof results.data[i][postCheck.key] ===
                                        "object"
                                ) {
                                    if (
                                        results.data[i][postCheck.key].value >
                                        postCheck.conditionValue
                                    ) {
                                        conditionMet = true;
                                    } else {
                                        conditionMet = false;
                                    }
                                } else {
                                    if (
                                        results.data[i][postCheck.key] >
                                        postCheck.conditionValue
                                    ) {
                                        conditionMet = true;
                                    } else {
                                        conditionMet = false;
                                    }
                                }
                            } else if (postCheck.conditionType === "lessThan") {
                                if (
                                    results.data[i][postCheck.key] != null &&
                                    typeof results.data[i][postCheck.key] ===
                                        "object"
                                ) {
                                    if (
                                        results.data[i][postCheck.key].value <
                                        postCheck.conditionValue
                                    ) {
                                        conditionMet = true;
                                    } else {
                                        conditionMet = false;
                                    }
                                } else {
                                    if (
                                        results.data[i][postCheck.key] <
                                        postCheck.conditionValue
                                    ) {
                                        conditionMet = true;
                                    } else {
                                        conditionMet = false;
                                    }
                                }
                            } else if (postCheck.conditionType === "Includes") {
                                if (
                                    results.data[i][postCheck.key] != null &&
                                    typeof results.data[i][postCheck.key] ===
                                        "object"
                                ) {
                                    if (
                                        results.data[i][
                                            postCheck.key
                                        ].value.includes(
                                            postCheck.conditionValue,
                                        )
                                    ) {
                                        conditionMet = true;
                                    } else {
                                        conditionMet = false;
                                    }
                                } else {
                                    if (
                                        results.data[i][postCheck.key].includes(
                                            postCheck.conditionValue,
                                        )
                                    ) {
                                        conditionMet = true;
                                    } else {
                                        conditionMet = false;
                                    }
                                }
                            }
                        }

                        let value =
                            results.data[i][postCheck.key] != null &&
                            results.data[i][postCheck.key] != null &&
                            typeof results.data[i][postCheck.key] === "object"
                                ? results.data[i][postCheck.key].value
                                : results.data[i][postCheck.key];

                        if (postCheck.resultType === "condition") {
                            if (conditionMet) {
                                value = postCheck.resultTrueValue;
                            } else {
                                value = postCheck.resultFalseValue;
                            }
                        }

                        if (postCheck.attributeType !== "style") {
                            if (!results.attributes[key]) {
                                results.attributes[key] = {};
                            }
                            if (
                                !results.attributes[key][
                                    postCheck.attributeType
                                ]
                            ) {
                                results.attributes[key][
                                    postCheck.attributeType
                                ] = [];
                            }
                            results.attributes[key][postCheck.attributeType][
                                i
                            ] = value;
                        } else {
                            if (!results.attributes[key]) {
                                results.attributes[key] = {};
                            }
                            if (
                                !results.attributes[key][
                                    postCheck.attributeType
                                ]
                            ) {
                                results.attributes[key][
                                    postCheck.attributeType
                                ] = {};
                            }
                            if (
                                !results.attributes[key][
                                    postCheck.attributeType
                                ][postCheck.styleAttribute]
                            ) {
                                results.attributes[key][
                                    postCheck.attributeType
                                ][postCheck.styleAttribute] = [];
                            }
                            results.attributes[key][postCheck.attributeType][
                                postCheck.styleAttribute
                            ][i] = value;
                        }
                    });
                });
            }
        }
        return results;
    }

    
    subscribeFieldInputEvents(viewKeys: FormViewKey[]): void {
        const _this = this;
        for (let i = 0; i < viewKeys.length; i++) {
            // subscribe to single field events
            const key = viewKeys[i];
            // subscribe to input events
            if (key.inputEvents != null) {
                for (let j = 0; j < key.inputEvents.length; j++) {
                    const event = key.inputEvents[j];
                    const subscription = _this.pubSubService.subscribe(
                        event.eventName,
                        (value) => {
                            _this.eventCallback(event, value, key.key);
                        },
                    );
                    _this.formSubscriptions.push(subscription);
                }
            }
            if (key.onChangeResetKey) {
                const reset_by_key_subscription = _this.pubSubService.subscribe(
                    _this.formParams.entryName +
                        "_" +
                        key.key +
                        "_reset_by_key",
                    (value) => {
                        _this.eventCallback(
                            { actionType: "reset_by_key" },
                            value,
                            value.data,
                        );
                    },
                );
                _this.formSubscriptions.push(reset_by_key_subscription);
            }
            // subscribe to combos
            if (key.format.viewType === "combobox") {
                // subscribe combobox lazy loading events
                const lazy_subscription = _this.pubSubService.subscribe(
                    _this.formParams.entryName +
                        "_" +
                        key.key +
                        "_combo_lazy_loading",
                    (value) => {
                        _this.eventCallback(
                            { actionType: "combo_lazy_loading" },
                            value,
                            value.data,
                        );
                    },
                );
                _this.formSubscriptions.push(lazy_subscription);
            }
            if (
                key.format.viewType === "subform" &&
                key.format.subform_keys != null
            ) {
                // uncommented to get subform's event states' update
                _this.subscribeFieldInputEvents(key.format.subform_keys);
            }
        }
    }

    getCurrentKeys(validKeysArray: FormViewKey[], inputKeys: any) {
        const outputKeys = {};
        for (const key in inputKeys) {
            if (inputKeys.hasOwnProperty(key)) {
                const element = inputKeys[key];
                if (
                    validKeysArray != null &&
                    validKeysArray.find((e) => e.key === key)
                ) {
                    if (
                        element == null ||
                        (element.id == null && element.value == null)
                    ) {
                        outputKeys[key] = element;
                    } else if (element.id != null) {
                        outputKeys[key] = element.id;
                    } else if (element.value != null) {
                        outputKeys[key] = element.value;
                    }
                }
            }
        }

        return outputKeys;
    }

    loadTableData(): void {
        const _this = this; // useful to debug
        _this.isLoading = true;

        const subscription = _this.backendService.getData(_this.formParams.entryName, _this.authService.getCurrentCompany(_this.currentKeys), { ..._this.currentKeys, ..._this.externalKeys }, null, true, _this.formParams.isNew, null, false)
            .subscribe(
                (results) => {
                    _this._console.log(results);
                    if (results.result === "OK") {
                        results = _this.applyAttributePostChecks(results);
                        _this.isReadOnly = results.flags.readOnly;
                        // hide/make read only relevant rows if any
                        if (
                            results.properties.hidden != null &&
                            results.properties.hidden.length
                        ) {
                            _this.hiddenRows = results.properties.hidden.map(
                                (p) => p.label,
                            );
                        }
                        if (
                            results.properties.readOnly != null &&
                            results.properties.readOnly.length
                        ) {
                            _this.readonlyRows =
                                results.properties.readOnly.map((p) => p.label);
                        } else {
                            _this.readonlyRows = [];
                        }
                        // signal parent to show/hide "save" icon
                        _this.sendEvent.emit({
                            eventType: "readOnly",
                            value: _this.isReadOnly,
                        });
                        if (_this.formParams.isNew) {
                            // handle newly set primary keys
                            const primaryKeys = _this.viewKeys.filter(
                                (key) => key.isPrimary,
                            );
                            _this.currentKeys = _this.getCurrentKeys(
                                primaryKeys,
                                results.data[0],
                            ); // TBC why do we receive an array with one element here?
                            _this.sendEvent.emit({
                                eventType: "updateKeys",
                                viewKeys: _this.currentKeys,
                            });
                        }

                        // Process results
                        _this.results = results.data;
                        _this.attributes = results.attributes;
                        _this.valueOverrides = results.valueOverrides;
                        
                        _this.processResults(_this.results);
                        // _this.loadWidgetsConfiguration = _this.results.widgetsConfiguration;
                        // Stop loading
                        _this.isLoading = false;
                    } else {
                        // Show error snackbar
                        _this._toastService.showErrorToastWithReason(results.reason);

                        // Set results empty
                        _this.results = [];
                        _this.processResults(_this.results);

                        // Stop loading
                        _this.isLoading = false;
                    }
                },
                (error) => {
                    _this._toastService.showErrorToastWithReason(error);

                    // Set results empty
                    _this.results = [];
                    _this.processResults(_this.results);

                    // Stop loading
                    _this.isLoading = false;
                },
            );

        _this.generalSubscriptions.push(subscription);
    }

    processResults(results: any[]): void {
        const _this = this;
        _this.numRows = results.length;

        // Override values in form_keys input events
        _this.viewKeys.forEach((_: any, v: number) => {
            Object.keys(_this.valueOverrides.inputEvents).forEach(key => {
                _this.valueOverrides.inputEvents[key].forEach((_: any, i: number) => {
                    if(_this.valueOverrides.inputEvents[key][i].key == _this.viewKeys[v].key) {
                        const k = _this.viewKeys[v].inputEvents.findIndex(x => x.eventName === _this.valueOverrides.inputEvents[key][i].eventName)
                        _this.viewKeys[v].inputEvents[k].values = _this.valueOverrides.inputEvents[key][i].values;
                        _this.viewKeys[v].inputEvents[k].customValues = _this.valueOverrides.inputEvents[key][i].customValues;
                    }
                });
            });
        });

        // prepare the form
        _this.filteredFormData = _this.numRows === 0 ? [] : JSON.parse(JSON.stringify(_this._formsService.getFormData(_this.viewKeys, results, _this.attributes, _this.formParams, _this.currentKeys, _this.isReadOnly)));
        _this.quickAddData = _this.filteredFormData.map((x) => false);
        _this.resetPagination(this.filteredFormData);

        // process the form
        _this.process_form(_this.filteredFormData);

        // emit event for the parent
        _this.sendEvent.emit({
            eventType: "updateData",
            data: _this.filteredFormData,
        });
    }

    addRow(default_keys: any): void {
        const _this = this;
        _this.isAddingNew = true;
        const subscription = _this.backendService
            .getData(_this.formParams.entryName, _this.authService.getCurrentCompany(_this.currentKeys), { ..._this.currentKeys, ..._this.externalKeys }, null, true, true, null, false)
            .subscribe(
                (result) => {
                    _this._console.log(result);
                    if (result.result === "OK") {
                        result = result.data;
                        // add passed keys, if any - useful to valorize father's keys in subtables
                        if (default_keys != null) {
                            for (let i = 0; i < result.length; i++) {
                                let element = result[i];
                                element = Object.assign(element, default_keys);
                            }
                        }
                        // update the status to prevent the whole table refresh
                        _this.addingNew = true;
                        // process the new row
                        const filteredFormData = _this._formsService.getFormData(_this.viewKeys, result, _this.attributes, _this.formParams, _this.currentKeys, _this.isReadOnly);
                        _this.process_form(filteredFormData);


                        if (_this.filteredFormData && _this.filteredFormData.length) {
                            _this.filteredFormData.unshift(filteredFormData[0]);
                            _this.quickAddData.unshift(true);
                        } else {
                            _this.filteredFormData = filteredFormData;
                            _this.quickAddData = [true];
                        }
                        // add it to the top of the list
                        _this.resetPagination(_this.filteredFormData);
                    } else {
                        // Show error snackbar
                        _this._toastService.showErrorToastWithReason(result.reason);
                    }
                    _this.isAddingNew = false;
                },
                (error) => {
                    _this._toastService.showErrorToastWithReason(error);
                    _this.isAddingNew = false;
                },
            );
        _this.generalSubscriptions.push(subscription);
    }

    private process_form(input_form: FieldConfig[][]): void {
        // pre-process form got from back-end

        for (let index = 0; index < input_form.length; index++) {
            this.process_form_row(input_form[index], this.margins);
        }
    }

    private process_form_row(
        input_form_row: FieldConfig[],
        margins: number,
    ): void {
        let sameLineElements: FieldConfig[] = [];
        for (const result of input_form_row) {
            if (result["validations"] && result["validations"].length > 0) {
                result["validations"] =
                    ValidationsService.processFormValidations(
                        result["validations"],
                    );
            }

            // Nicola's code for creating elements width
            // if (result.width == null && result.subform == null) {     // if null, must be null for all elements on the same line, then split the width equally
            //     if (result['newLine'] === false) {
            //         sameLineElements.push(result);
            //     } else {
            //         result.width = this.processInlineElements(sameLineElements, margins);
            //         sameLineElements = [];
            //     }
            // }

            if (result.isVisible) {
                sameLineElements.push(result);
            } else {
                result.width = 0;
            }
            if (result.subform == null) {
                // if null, must be null for all elements on the same line, then split the width equally
                if (
                    result["newLine"] === true &&
                    sameLineElements !== null &&
                    sameLineElements.length > 0
                ) {
                    // result.width = this.processInlineElements(sameLineElements, margins);
                    this.processInlineElements(sameLineElements, margins);
                    sameLineElements = [];
                }
            }

            // recursively process subform
            if (result.subform != null) {
                this.process_form_row(result.subform, margins);
            }
        }
        this.processInlineElements(sameLineElements, margins); // handles inline elements of last line
    }

    private processInlineElements(
        elements: FieldConfig[],
        margins: number,
    ): number {
        // Nicola's code
        // const numElements = 1 + elements.length; // current + previouses
        const numElements = elements.length; // current + previouses
        let sumWidths = 0;
        if (elements.length) {
            // some elements to put on the same line
            // process the elements with defined 1/10 size first
            const singleWidth = Math.floor(100 / numElements);
            // for (const element of elements) {
            //     element.width = singleWidth - margins; // considering 4% margins;
            //     sumWidths += singleWidth;
            // }
            for (let i = 0; i < elements.length; i++) {
                if (i === elements.length - 1) {
                    elements[i].width = 100 - margins - sumWidths; // considering 4% margins;
                } else {
                    if (elements[i].width === null) {
                        sumWidths += singleWidth;
                        elements[i].width = singleWidth - margins; // considering 4% margins;
                    } else {
                        sumWidths += elements[i].width;
                        elements[i].width = elements[i].width - margins; // considering 4% margins;
                    }
                }
            }
        }
        return 100 - margins - sumWidths; // considering 4% margins
    }

    private replaceLocalKeys(functString: string, keys: any): string {
        const delimiter = "£";
        // tslint:disable-next-line: forin
        for (const key in keys) {
            const toReplace = delimiter + key + delimiter;
            let replacement = keys[key];
            // check if it is an object
            if (replacement != null && replacement.id != null) {
                replacement = replacement.id;
            }
            let newString = functString.replace(toReplace, replacement);
            while (newString !== functString) {
                // handle multiple occurences
                functString = newString;
                newString = functString.replace(toReplace, replacement);
            }
        }
        return functString;
    }

    // callback for pubSub events, value has form of {origin, index, valueSet, data}
    private eventCallback(event: any, value: any, keyListener: string): void {
        const _this = this;
        // console.table(event);
        // console.table(value);
        // console.table(_this.filteredFormData);
        // _this._console.log(`keyListener: ${keyListener}`);
        _this._console.log(event, value, keyListener);

        // not a ViewProperties event, check the condition if any -- TODO: support other conditions beyond equalTo
        let conditionMet = true;

        if (event.condition != null) {
            let msgData: any[];
            if(event.customValues) {
                msgData = Array.isArray(event.customValues) ? 
                    event.customValues: 
                    [event.customValues];
            }
            else if(event.valueKey) {
                const formValues = _this.formArray.toArray()[value.index].form.value;
                msgData = Array.isArray(formValues[event.valueKey]) ? 
                    formValues[event.valueKey]: 
                    [formValues[event.valueKey]];
            }
            else {
                msgData = Array.isArray(value.data) ? value.data : [value.data];
            }
            
            msgData = msgData.map((m) =>
                m === true || m === "true" || m === "t"
                    ? "1"
                    : m === false || m === "false" || m === "f"
                      ? "0"
                      : m,
            );

            // normalize if boolean conditions
            let eventValues: any = event.values.map((v) =>
                v === "true" ? "1" : v === "false" ? "0" : v,
            );

            // handle jolly chars
            eventValues = eventValues.map((e) =>
                e === "*" ? msgData[eventValues.indexOf(e)] : e,
            );
            if (event.condition === "equalTo") {
                // Check each element instead of comparing arrays as string like before
                msgData.forEach((curValue: any) => {
                    if (!eventValues.includes(curValue)) {
                        conditionMet = false;
                    }
                });
            } else if (event.condition === "notEqualTo") {
                // Check each element instead of comparing arrays as string like before
                msgData.forEach((curValue: any) => {
                    if (eventValues.includes(curValue)) {
                        conditionMet = false;
                    }
                });
            }
        }

        // check  if this is a formRowProperties event
        if (event.actionType === "showRow" && event.condition === "equalTo") {
            // Check if formRowProperties contains keys
            if (event.keys != null) {
                // Check each form table line to see if the condition is met
                for (let i = 0; i < _this.filteredFormData.length; i++) {
                    const formKeys = _this.filteredFormData[i];

                    let matchingKeys = true;
                    let matchingValues = true;

                    // Run for each key
                    for (let j = 0; j < event.keys.length; j++) {
                        const key = event.keys[j];

                        let senderValue;
                        const receiverEntry: any = formKeys.find(
                            (x) => x.label === key.receiver,
                        );
                        const receiverValue = receiverEntry
                            ? receiverEntry.value
                            : key.receiver;

                        // If it's %value%, put in values variables
                        if (key.sender.includes("%value%")) {
                            senderValue = value.data;
                            const equalNotEqualEntry: any = formKeys.find(
                                (x) => x.label === "equal_notequal",
                            );
                            const equalNotEqualValue = equalNotEqualEntry
                                ? equalNotEqualEntry.value
                                : "equal_notequal";
                            if (equalNotEqualValue === "notEqualTo") {
                                if (
                                    senderValue != null &&
                                    Array.isArray(senderValue)
                                ) {
                                    // check if it is an array (checkbox group)
                                    for (
                                        let k = 0;
                                        k < senderValue.length;
                                        k++
                                    ) {
                                        // at least one array value matches
                                        const element = senderValue[k];
                                        if (element == receiverValue) {
                                            matchingValues = false;
                                        }
                                    }
                                } else if (
                                    senderValue == null ||
                                    senderValue == receiverValue
                                ) {
                                    matchingValues = false;
                                }
                            } else {
                                //value.valueSet.equal_notequal === 'equalTo'
                                if (
                                    senderValue != null &&
                                    Array.isArray(senderValue)
                                ) {
                                    // check if it is an array (checkbox group)
                                    matchingValues = false;
                                    for (
                                        let k = 0;
                                        k < senderValue.length;
                                        k++
                                    ) {
                                        // at least one array value matches
                                        const element = senderValue[k];
                                        if (element == receiverValue) {
                                            matchingValues = true;
                                        }
                                    }
                                } else if (
                                    senderValue == null ||
                                    senderValue != receiverValue
                                ) {
                                    matchingValues = false;
                                }
                            }
                        } else {
                            // compare keys
                            senderValue = value.valueSet[key.sender]
                                ? value.valueSet[key.sender]
                                : key.sender;
                            if (senderValue != receiverValue) {
                                matchingKeys = false;
                            }
                        }
                    }

                    // // Perform action based on conditions check above
                    // if (!matchingKeys) {
                    //     return; // the message is not for this row
                    // }

                    // Zee change: Perform action based on conditions check above
                    // return is causing issue as it goes out of for loop prematurely
                    if (matchingKeys) {
                        _this.hiddenRows[i] = !matchingValues;
                    }
                }
            }
            return;
        }
        
        if (
            event.actionType === "show" ||
            event.actionType === "hide" ||
            event.actionType === "toggle"
        ) {
            // get the listener element if not full table
            let listener: FieldConfig = null;
            // if (keyListener != null && value.type !== 'page') {
            if (keyListener != null) {
                const targetLine = _this.filteredFormData[value.index]; // recover the form "line"
                if (targetLine != null) {
                    listener = HelperService.findElement(
                        targetLine,
                        keyListener,
                    );
                    // listener = targetLine.find(field => field.name === keyListener);
                }
            }
            if (keyListener == null) {
                // act on the full table
                if (conditionMet) {
                    _this.formParams.isVisible =
                        event.actionType === "show"
                            ? true
                            : event.actionType === "hide"
                              ? false
                              : !_this.formParams.isVisible;
                } else {
                    _this.formParams.isVisible =
                        event.actionType === "show"
                            ? false
                            : event.actionType === "hide"
                              ? true
                              : _this.formParams.isVisible;
                }
            } else if (listener != null) {
                // act on the listening element
                if (conditionMet) {
                    listener.isVisible =
                        event.actionType === "show"
                            ? true
                            : event.actionType === "hide"
                              ? false
                              : !listener.isVisible;
                } else {
                    listener.isVisible =
                        event.actionType === "show"
                            ? false
                            : event.actionType === "hide"
                              ? true
                              : listener.isVisible;
                }
            }
            if (event.outputEventWhenComplete != null) {
                _this.pubSubService.publishEvent(
                    event.outputEventWhenComplete,
                    value,
                );
            }
        } else if (event.actionType === "readOnly") {
            // get the listener element if not full table
            let listener: FieldConfig = null;
            if (keyListener != null && value.type !== "page") {
                const targetLine = _this.filteredFormData[value.index]; // recover the form "line"
                if (targetLine != null) {
                    listener = HelperService.findElement(
                        targetLine,
                        keyListener,
                    );
                    // listener = targetLine.find(field => field.name === keyListener);
                }
            }
            if (keyListener == null) {
                // act on the full table --> NO! formRowProperties must be used in this case!!!
                // _this.isReadOnly = conditionMet;
                // _this.sendEvent.emit({ eventType: 'readOnly', value: _this.isReadOnly }); // signal to the parent to show/hide save button
            } else if (listener != null) {
                // act on the listening element
                listener.readonly = conditionMet;
            }
            if (event.outputEventWhenComplete != null) {
                _this.pubSubService.publishEvent(
                    event.outputEventWhenComplete,
                    value,
                );
            }
        } else if (event.actionType === "reload" && conditionMet) {
            _this.refreshView(false);
            if (event.outputEventWhenComplete != null) {
                _this.pubSubService.publishEvent(
                    event.outputEventWhenComplete,
                    value,
                );
            }
        } else if (event.actionType === "update_time_tracker") {
            //_this._timeTrackerService.isTrStarted = !_this._timeTrackerService.isTrStarted;
            //_this._timeTrackerService.fromOtherPlaces = true;
            _this._timeTrackerService.checkStatus();
        } else if (event.actionType === "navigate" && conditionMet) {
            const formLine = _this.filteredFormData[value.index];
            const navigationKeys = {};
            for (let j = 0; j < formLine.length; j++) {
                const key = formLine[j];
                navigationKeys[key.name] = key.value;
            }
            // formLine.reduce((outputKeys, key) => {
            //     outputKeys[key.name] = key.value;
            //     return outputKeys;
            // }, {});
            let filteredKeys = {};
            if (
                event.actionTarget.keymap != null &&
                event.actionTarget.keymap.length
            ) {
                // explicit key map between tables
                for (let i = 0; i < event.actionTarget.keymap.length; i++) {
                    const element = event.actionTarget.keymap[i];
                    if (element.source != null && element.destination != null) {
                        // If we came from show_message event, the keys must be in value.data
                        if (
                            typeof value.data === "object" &&
                            value.data["keys"] &&
                            value.data["keys"][element.source]
                        ) {
                            filteredKeys[element.destination] =
                                value.data["keys"][element.source] != null
                                    ? value.data["keys"][element.source]
                                    : null;
                        }
                        // Check if event contains values in case of manually generated event
                        else if (event.values != null) {
                            filteredKeys[element.destination] =
                                event.values[element.source] != null
                                    ? event.values[element.source]
                                    : null;
                        } else if (navigationKeys != null) {
                            filteredKeys[element.destination] =
                                navigationKeys[element.source] != null
                                    ? navigationKeys[element.source].id != null
                                        ? navigationKeys[element.source].id
                                        : navigationKeys[element.source]
                                    : null;
                        }
                    }
                }
            } else {
                const primaryKeys = _this.viewKeys.filter(
                    (key) => key.isPrimary,
                );
                filteredKeys = _this.getCurrentKeys(
                    primaryKeys,
                    navigationKeys,
                );
            }

            // destroy current subscriptions before moving to a new view
            _this.formSubscriptions.forEach((subscription) => {
                subscription.unsubscribe();
            });
            _this.sendEvent.emit({
                eventType: "navigate",
                queryParams: {
                    entry: event.actionTarget,
                    keys: [filteredKeys],
                    index: 1,
                    total: 1,
                },
            });
            if (event.outputEventWhenComplete != null) {
                _this.pubSubService.publishEvent(
                    event.outputEventWhenComplete,
                    value,
                );
            }
        } else if (
            (event.actionType === "query" ||
                event.actionType === "query_style" ||
                event.actionType === "combo_lazy_loading") &&
            conditionMet
        ) {
            let chiavi = {};
            const target_index = value.type !== "page" ? value.index : null; // null means the event comes from the full table
            let index = target_index == null ? _this.formArray.length : 1;
            const targetViewField = _this.viewKeys.find(
                (viewKey) => viewKey.key === keyListener,
            );
            const childrenArray = _this.formArray.toArray();
            // iterate over all indexes when full table or instead affect the target index only
            while (index > 0) {
                index--;
                const current_index =
                    target_index != null ? target_index : index;
                // some lines might be hidden, search for the right one
                const current_line = childrenArray.find(
                    (c) => c.fields[0].index === current_index,
                );
                if (current_line == null) {
                    continue;
                }
                chiavi = current_line.form.value;
                // fix problem with changed value that might be not updated yet by getting it directly from event
                if (value.type === "change") {
                    chiavi[value.origin] = value.data;
                }
                // process values
                for (const key in chiavi) {
                    if (chiavi.hasOwnProperty(key)) {
                        const element = chiavi[key];
                        if (element == null) {
                            continue; // skip null entries
                        }
                        if (Array.isArray(element) && element.length > 0) {
                            if (element.length === 1 && element[0] === null) {
                                continue; // skip null entries
                                // chiavi[key] = 'ARRAY[NULL]';
                            } else if (
                                typeof element[0] === "object" &&
                                Object.keys(element[0]).length > 0 &&
                                element[0]["id"]
                            ) {
                                chiavi[key] =
                                    "ARRAY[" +
                                    element.map((x) => x.id).join(",") +
                                    "]";
                            } else {
                                chiavi[key] =
                                    "ARRAY[" +
                                    element.map((x) => x).join(",") +
                                    "]";
                            }
                        }
                        // decode combos
                        else if (element["id"] != null) {
                            chiavi[key] = element["id"];
                        }
                        // decode multi-combo / tags
                        // encode boolean
                        else if (element === true) {
                            chiavi[key] = "1";
                        } else if (element === false) {
                            chiavi[key] = "0";
                        }
                    }
                }
                if (value.showEventProcessing === true) {
                    _this._dialogService.showLoadingDialog(
                        "Processing",
                        "Please wait...",
                    );
                }
                const subscription = _this.backendService
                    .postEvent(
                        _this.formParams.entryName,
                        _this.authService.getCurrentCompany(_this.currentKeys),
                        { ..._this.currentKeys, ..._this.externalKeys },
                        keyListener,
                        chiavi,
                        event.eventName,
                        event.actionType,
                    )
                    .subscribe(
                        (result) => {
                            if (result.result === "OK") {
                                if (event.successMessage) {
                                    _this._toastService.showSuccessToast(
                                        event.successMessage,
                                    );
                                }

                                result = result.data;
                                _this._console.log(
                                    `keyListener: ${keyListener}`,
                                );
                                //console.table(result);
                                if (event.actionType === "query") {
                                    let combobox: ComboboxComponent = null;
                                    if (
                                        typeof result === "object" &&
                                        result.value != null
                                    ) {
                                        // got combobox/radiobutton/checkboxgroup options
                                        // Old method
                                        // _this.formArray[value.index].form.patchValue({ [keyListener]['options']: result});
                                        combobox = <ComboboxComponent>(
                                            current_line.dynamicFields.find(
                                                (df) =>
                                                    df.field.name ===
                                                    keyListener,
                                            ).componentRef.instance
                                        );
                                        // Set options and make sure we don't cause the onchange selector while
                                        // changing options
                                        if (
                                            (result.options != null &&
                                                result.options[0] != null) ||
                                            result.value == null
                                        ) {
                                            combobox.setOptions(
                                                result.options,
                                                true,
                                            );
                                        }
                                        result = result.value;
                                    }
                                    for (var k in result[0]) {
                                        if (result[0].hasOwnProperty(k)) {
                                            // patch the form
                                            current_line.form.patchValue({
                                                [k]: result[0][k],
                                            });
                                            // patch the undelying data
                                            const el =
                                                HelperService.findElement(
                                                    _this.filteredFormData[
                                                        current_index
                                                    ],
                                                    k,
                                                );
                                            // const el = _this.filteredFormData[current_index].find(field => field.name === k);
                                            if (
                                                el != null &&
                                                result[0][k] != null
                                            ) {
                                                // If combobox, set the value using the options available
                                                // so cannot add directly
                                                if (combobox) {
                                                    combobox.setValue(
                                                        result[0][k],
                                                    );
                                                } else {
                                                    // It's not a combobox so set value directly
                                                    el.value = result[0][k];
                                                }
                                            }
                                        }
                                    }
                                } else if (
                                    event.actionType === "combo_lazy_loading"
                                ) {
                                    // Issue #178
                                    let comboboxEl =
                                        _this.findElementInDynamicFields(
                                            current_line.dynamicFields,
                                            keyListener,
                                        );
                                    if (comboboxEl) {
                                        let combobox: ComboboxComponent = null;
                                        combobox = <ComboboxComponent>(
                                            comboboxEl.componentRef.instance
                                        );
                                        if (
                                            combobox.field.isMultiSelect ||
                                            combobox.field.showTagsView
                                        ) {
                                            let comboValues = [];
                                            if (combobox.field.value != null) {
                                                combobox.field.value.forEach(
                                                    (comboValue) => {
                                                        if (
                                                            typeof comboValue ===
                                                            "object"
                                                        ) {
                                                            if (
                                                                comboValue.id !==
                                                                undefined
                                                            ) {
                                                                comboValues.push(
                                                                    comboValue.id,
                                                                );
                                                            }
                                                        } else {
                                                            var possibleValues =
                                                                result.filter(
                                                                    (x) =>
                                                                        x.id ===
                                                                        comboValue,
                                                                );
                                                            if (
                                                                possibleValues &&
                                                                possibleValues.length >
                                                                    0
                                                            ) {
                                                                comboValues.push(
                                                                    possibleValues[0]
                                                                        .id,
                                                                );
                                                            }
                                                        }
                                                    },
                                                );
                                            }

                                            combobox.setOptions(
                                                result,
                                                true,
                                                true,
                                            );
                                            if (comboValues != null) {
                                                combobox.setValue(comboValues);
                                            }
                                        } else {
                                            const comboValue =
                                                combobox.field.value != null
                                                    ? combobox.field.value.id
                                                    : null;
                                            combobox.setOptions(
                                                result,
                                                true,
                                                true,
                                            );
                                            if (comboValue != null) {
                                                combobox.setValue(comboValue);
                                            }
                                        }
                                    }
                                } else {
                                    // query_style
                                    const filterFormData = (dataset, param) => {
                                        let found = HelperService.findElement(
                                            dataset,
                                            param,
                                        );
                                        // let found = dataset.find(field => field.name === param);
                                        if (found == null) {
                                            for (
                                                let i = 0;
                                                i < dataset.length;
                                                i++
                                            ) {
                                                if (
                                                    dataset[i].subform != null
                                                ) {
                                                    found = filterFormData(
                                                        dataset[i].subform,
                                                        param,
                                                    );
                                                    if (found != null) {
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                        return found;
                                    };
                                    const element = filterFormData(
                                        _this.filteredFormData[current_index],
                                        keyListener,
                                    );
                                    if (
                                        element != null &&
                                        event.styleAttribute != null
                                    ) {
                                        if (element.style == null) {
                                            element.style = {};
                                        }

                                        if (result[0]) {
                                            // we can get multiple rows from backend, each one providing a different attribute, find the right one
                                            const attrKey =
                                                keyListener +
                                                "_" +
                                                event.styleAttribute; // as per specs the returned key is of type '<key>_<styleAttribute>'
                                            if (result[0][attrKey]) {
                                                element.style[
                                                    event.styleAttribute
                                                ] = result[0][attrKey];
                                            } else {
                                                _this._console.log(
                                                    `result does not contain attrKey: ${attrKey}`,
                                                );
                                            }
                                        }
                                    }
                                }
                                // Close processing dialog
                                _this._dialogService.closeDialog();
                                if (event.outputEventWhenComplete != null) {
                                    _this.pubSubService.publishEvent(
                                        event.outputEventWhenComplete,
                                        value,
                                    );
                                }
                            } else {
                                // Close processing dialog
                                _this._dialogService.closeDialog();

                                // Show error snackbar
                                _this._console.log(
                                    `keyListener: ${keyListener}`,
                                );
                                //console.table(result);

                                _this._console.log(result);
                                _this._toastService.showErrorToastWithReason(result.reason);
                            }
                        },
                        (error) => {
                            _this._toastService.showErrorToast(error);
                        },
                    );

                _this.generalSubscriptions.push(subscription);
            }
            /* if (event.outputEventWhenComplete != null) {
                _this.pubSubService.publishEvent(event.outputEventWhenComplete, value);
            } */
        } else if (event.actionType === "reset_by_key" && conditionMet) {
            const target_index = value.type !== "page" ? value.index : null; // null means the event comes from the full table
            let index = target_index == null ? _this.formArray.length : 1;
            const childrenArray = _this.formArray.toArray();
            // iterate over all indexes when full table or instead affect the target index only
            while (index > 0) {
                index--;
                const current_index =
                    target_index != null ? target_index : index;
                // some lines might be hidden, search for the right one
                const current_line = childrenArray.find(
                    (c) => c.fields[0].index === current_index,
                );
                if (current_line == null) {
                    continue;
                }

                // To reset only combobox
                // let combobox: ComboboxComponent = <ComboboxComponent>current_line.dynamicFields.find(df => df.field.name === value.data).componentRef.instance;
                // combobox.reset();

                // To try generically all dynamic fields
                if (value.data) {
                    value.data.forEach((v) => {
                        let dynamicField: any =
                            <any>(
                                current_line.dynamicFields.find(
                                    (df) => df.field.name === v,
                                )?.componentRef?.instance
                            ) ?? null;
                        if (dynamicField && dynamicField.reset) {
                            dynamicField.reset();
                        } else {
                            _this._toastService.showErrorToast(
                                "Error",
                                "Error resetting " + v,
                            );
                        }
                    });
                }
            }
        } else if (
            (event.actionType === "update" ||
                event.actionType === "update_style") &&
            conditionMet
        ) {
            if (event.updateFunct != null && keyListener != null) {
                const childrenArray = _this.formArray.toArray();
                // some lines might be hidden, search for the right one
                const current_line = childrenArray.find(
                    (c) => c.fields[0].index === value.index,
                );
                if (current_line == null) {
                    return;
                }
                const keys = current_line.form.value;
                const resolvedFunct = _this.replaceLocalKeys(
                    event.updateFunct,
                    keys,
                );
                // tslint:disable-next-line: no-eval
                if (event.actionType === "update") {
                    current_line.form.patchValue({
                        [keyListener]: eval(resolvedFunct),
                    });
                } else {
                    // update_syle
                    const element = HelperService.findElement(
                        this.filteredFormData[value.index],
                        keyListener,
                    );
                    // const element = _this.filteredFormData[value.index].find(field => field.name === keyListener);
                    if (element != null && event.styleAttribute != null) {
                        element.style[event.styleAttribute] =
                            eval(resolvedFunct);
                    }
                }
            }
            if (event.outputEventWhenComplete != null) {
                _this.pubSubService.publishEvent(
                    event.outputEventWhenComplete,
                    value,
                );
            }
        } else if (
            event.actionType === "show_message" &&
            event.message
        ) {
            if(conditionMet){
                // Show confirmation dialog
                _this._dialogService
                    .showConfimationDialog(
                        event.message.messageTitle != null
                            ? event.message.messageTitle
                            : "Confirm",
                        event.message.messageText,
                        "Yes",
                        "No",
                        "info",
                    )
                    .then((result) => {
                        // Initialize with No action info
                        var actionType = event.message.actionOnNo.actionType;
                        var queryFunct = event.message.actionOnNo.queryFunct;
                        var regulatAPIParams: RegulatAPIParams = event.message.actionOnNo.regulatAPIParams;
                        var notifyTicketParams: NotifyTicketParams = event.message.actionOnNo.notifyTicketParams;
                        var eventMessage = event.message.actionOnNo;
                        var action = "actionNo";

                        // If user clicked yes, load yes action info
                        if (result.value === true) {
                            actionType = event.message.actionOnYes.actionType;
                            queryFunct = event.message.actionOnYes.queryFunct;
                            regulatAPIParams = event.message.actionOnYes.regulatAPIParams;
                            notifyTicketParams = event.message.actionOnYes.notifyTicketParams;
                            eventMessage = event.message.actionOnYes;
                            action = "actionYes";
                        }

                        // Let's perform Yes Action
                        if (actionType === "reload") {
                            _this.reload();
                            // Reload screen
                            if (event.outputEventWhenComplete != null) {
                                _this.pubSubService.publishEvent(
                                    event.outputEventWhenComplete,
                                    value,
                                );
                            }
                        } else if (action === "update_time_tracker") {
                            //_this._timeTrackerService.isTrStarted = !_this._timeTrackerService.isTrStarted;
                            // = true;
                            _this._timeTrackerService.checkStatus();
                        } else if (actionType === "email") {
                            let formValues = _this.formArray.first.form.value;

                            _this._emailService.performSendEmail(event, formValues, value, _this.currentKeys);

                            // _this._console.log(JSON.stringify(event));
                            // _this.sendEmail({ templateKey: 'test' });
                        } else if (actionType === "regulat_api") {
                            const formValues = _this.formArray.first.form.value;

                            if (!regulatAPIParams) {
                                console.error('regulatAPIParams undefined');
                                return; 
                            } 

                            let keys={};
                            if (regulatAPIParams.actionType === "get_aml_scan") {
                                if(regulatAPIParams.entityParams) {
                                    keys = {
                                        codiceAziendaAML: formValues[
                                            regulatAPIParams.entityParams.codice_azienda
                                        ],
                                        idAnagraficaAML: formValues[
                                            regulatAPIParams.entityParams.id_anagrafica
                                        ],
                                        idSomministrazioneAML: formValues[
                                            regulatAPIParams.entityParams
                                                .id_somministrazione
                                        ],
                                        dynamoUserAML: formValues[
                                            regulatAPIParams.entityParams.dynamo_user
                                        ],
                                        isLightScan: regulatAPIParams.entityParams.is_light_scan,
                                    }
                                } else {
                                    console.error('entityParams undefined:', regulatAPIParams);
                                    return; 
                                }
                                
                            } else if (regulatAPIParams.actionType === "get_aml_scans") {
                                if(regulatAPIParams.surveyParams) {
                                    keys = {
                                        codiceAziendaAML: formValues[
                                            regulatAPIParams.surveyParams.codice_azienda
                                        ],
                                        idAnagraficaAML: formValues[
                                            regulatAPIParams.surveyParams.id_anagrafica
                                        ],
                                        idSomministrazioneAML: formValues[
                                            regulatAPIParams.surveyParams
                                                .id_somministrazione
                                        ],
                                        dynamoUserAML: formValues[
                                            regulatAPIParams.surveyParams.dynamo_user
                                        ],
                                        isLightScan: regulatAPIParams.surveyParams.is_light_scan,
                                    }
                                } else {
                                    console.error('surveyParams undefined:', regulatAPIParams);
                                    return; 
                                }
                            }

                            _this._formsService.runRegulatEvent(
                                eventMessage,
                                value,
                                keyListener,
                                formValues,
                                keys
                            );
                        } else if (actionType === "user_api") {
                            _this.runUserManagementEvent(event, value, keyListener);
                        } else if (actionType === "notify_ticket_status") {
                            const formValues = _this.formArray.first.form.value;
                        
                            if (!notifyTicketParams) {
                                console.error('openTicketParams undefined');
                                return;
                            }
                        
                            let keys = {};
                            if (notifyTicketParams.openTicketParams) {
                                keys = {
                                    chiavi: formValues[notifyTicketParams.openTicketParams.chiavi],
                                    contesto: formValues[notifyTicketParams.openTicketParams.contesto],
                                    username: formValues[notifyTicketParams.openTicketParams.username]
                                };
                            } else {
                                console.error('ticketParams undefined:', notifyTicketParams.openTicketParams);
                                return;
                            }
                        
                            _this._formsService.runNotifyTicketEvent(
                                // eventMessage,
                                // value,
                                // keyListener,
                                formValues,
                                keys
                            );
                        }
                        
                        else {
                            // Run query
                            let chiavi = {};
                            const target_index =
                                value.type !== "page" ? value.index : null; // null means the event comes from the full table
                            let index =
                                target_index == null ? _this.formArray.length : 1;
                            const targetViewField = _this.viewKeys.find(
                                (viewKey) => viewKey.key === keyListener,
                            );
                            const childrenArray = _this.formArray.toArray();
                            // iterate over all indexes when full table or instead affect the target index only
                            while (index > 0) {
                                index--;
                                const current_index =
                                    target_index != null ? target_index : index;
                                // some lines might be hidden, search for the right one
                                const current_line = childrenArray.find(
                                    (c) => c.fields[0].index === current_index,
                                );
                                if (current_line == null) {
                                    continue;
                                }
                                chiavi = current_line.form.value;
                                // fix problem with changed value that might be not updated yet by getting it directly from event
                                if (value.type === "change") {
                                    chiavi[value.origin] = value.data;
                                }
                                // process values
                                for (const key in chiavi) {
                                    if (chiavi.hasOwnProperty(key)) {
                                        const element = chiavi[key];
                                        if (element == null) {
                                            continue; // skip null entries
                                        }
                                        // decode combos
                                        if (element["id"] != null) {
                                            chiavi[key] = element["id"];
                                        }
                                        // encode boolean
                                        else if (element === true) {
                                            chiavi[key] = "1";
                                        } else if (element === false) {
                                            chiavi[key] = "0";
                                        }
                                    }
                                }
                                const subscription = _this.backendService
                                    .postEvent(
                                        _this.formParams.entryName,
                                        _this.authService.getCurrentCompany(
                                            _this.currentKeys,
                                        ),
                                        {
                                            ..._this.currentKeys,
                                            ..._this.externalKeys,
                                        },
                                        keyListener,
                                        chiavi,
                                        event.eventName,
                                        action,
                                        true,
                                    )
                                    .subscribe((result) => {
                                        if (result.result === "OK") {
                                            _this._console.table(result);
                                            if (result.data) {
                                                if (Array.isArray(result.data)) {
                                                    // I am hoping that the result contains keys for the next event
                                                    value.data = {};
                                                    value.data["keys"] =
                                                        result.data[0];
                                                } else {
                                                    value.data = result.data;
                                                }
                                            }

                                            if (event.successMessage) {
                                                _this._toastService.showSuccessToast(
                                                    event.successMessage,
                                                );
                                            } else {
                                                _this._toastService.showSuccessToast(
                                                    "Success!",
                                                );
                                            }
                                            if (
                                                event.outputEventWhenComplete !=
                                                null
                                            ) {
                                                _this.pubSubService.publishEvent(
                                                    event.outputEventWhenComplete,
                                                    value,
                                                );
                                            }
                                        } else {
                                            _this._console.table(result);
                                            _this._toastService.showErrorToast(
                                                "Error ",
                                                result.reason.detail == undefined
                                                    ? ""
                                                    : JSON.stringify(
                                                        result.reason.detail,
                                                    ) +
                                                        (result.reason.hint ==
                                                        undefined
                                                            ? ""
                                                            : JSON.stringify(
                                                                    result.reason
                                                                        .hint,
                                                                )),
                                                5000,
                                                true,
                                            );
                                        }
                                    });

                                _this.generalSubscriptions.push(subscription);
                            }
                        }
                    });
            }
            else {
                _this.showConditionNotMetMessage(event);
            }
        } else if (event.actionType === "google_api") {
            _this.runGoogleEvent(event, value, keyListener);
        } else if (event.actionType === "regulat_api") {
            _this.runRegulatEvent(event, value, keyListener);
        } else if (event.actionType === "user_api") {
            if(conditionMet) {
                _this.runUserManagementEvent(event, value, keyListener);
            }
            else {
                _this.showConditionNotMetMessage(event);
            }
        } else if (event.actionType === "dialog") {
            if(conditionMet) {
                let data = { ...event, keys: {} };
                _this.viewKeys
                    .filter((x) => x.isPrimary)
                    .forEach((viewKey: FormViewKey) => {
                        data.keys[viewKey.key] = value.valueSet[viewKey.key];
                    });
                data.keys = { ...data.keys, ..._this.currentKeys };
                const dialogRef = _this.cutomDialog.open(
                    MenuOptionsCustomDialogComponent,
                    {
                        width: "1280px",
                        height: "auto",
                        data: data,
                    },
                );
    
                const dialogRefSub = dialogRef.afterClosed().subscribe(
                    (response: any) => {
                        dialogRefSub.unsubscribe();
                        if (event.outputEventWhenComplete != null) {
                            _this.pubSubService.publishEvent(
                                event.outputEventWhenComplete,
                                value,
                            );
                        }
                    },
                    (error: any) => {
                        dialogRefSub.unsubscribe();
                    },
                );
            }
            else {
                _this.showConditionNotMetMessage(event);
            }
        } 
        
    }

    showConditionNotMetMessage(event: any) {
        const _this = this;
        let conditionNotMetMessage = "Condition not met";
        if(event.conditionNotMetMessageTranslate){
            conditionNotMetMessage = _this._translateService.instant(event.conditionNotMetMessageTranslate);
        }
        else if(event.conditionNotMetMessageLabel){
            conditionNotMetMessage = event.conditionNotMetMessageLabel;
        }
        _this._toastService.showErrorToast(conditionNotMetMessage);
    }
    
    async runGoogleEvent(event, value, keyListener) {
        let _this = this;
        const googleAPIParams: GoogleAPIParams = event.googleAPIParams;
        let formValues = _this.formArray.first.form.value;

        // process the booleans (1/0 instead of true/false)
        for (const value in formValues) {
            if (formValues.hasOwnProperty(value)) {
                const element = formValues[value];
                if (element == null) {
                    continue; // skip null entries
                }
                // decode combos
                if (element["id"] != null) {
                    formValues[value] = element["id"];
                }
                // encode boolean
                else if (element === true) {
                    formValues[value] = "1";
                } else if (element === false) {
                    formValues[value] = "0";
                }
            }
        }

        if (!googleAPIParams || !googleAPIParams.actionType) {
            _this._toastService.showErrorToast("Missing Google API Params");
        } else {
            if (googleAPIParams.actionType == "get_directions") {
                if (!googleAPIParams.directionsParams) {
                    _this._toastService.showErrorToast(
                        "Missing Google API Get Directions Params",
                    );
                } else {
                    const origin = HelperService.getValueInValueSet(
                        value.valueSet,
                        googleAPIParams.directionsParams.originKey,
                    );
                    const destination = HelperService.getValueInValueSet(
                        value.valueSet,
                        googleAPIParams.directionsParams.destinationKey,
                    );
                }
            } else if (googleAPIParams.actionType == "get_distance") {
                if (!googleAPIParams.distanceParams) {
                    _this._toastService.showErrorToast(
                        "Missing Google API Get Distance Params",
                    );
                } else {
                    const origin =
                        formValues[googleAPIParams.distanceParams.originKey];
                    const destination =
                        formValues[
                            googleAPIParams.distanceParams.destinationKey
                        ];
                    if (!origin || !destination) {
                        _this._toastService.showErrorToast(
                            "Missing Google API Get Distance Params",
                        );
                    } else {
                        _this.backendService
                            .getDistance(origin, destination)
                            .subscribe(
                                (response) => {
                                    // _this._console.log(response);
                                    if (response.result === "OK") {
                                        let distance = 0;
                                        if (
                                            response.data.rows &&
                                            response.data.rows.length &&
                                            response.data.rows[0].elements &&
                                            response.data.rows[0].elements
                                                .length &&
                                            response.data.rows[0].elements[0]
                                                .distance &&
                                            response.data.rows[0].elements[0]
                                                .distance.value
                                        ) {
                                            distance =
                                                response.data.rows[0]
                                                    .elements[0].distance
                                                    .value / 1000;
                                        }

                                        let element = HelperService.findElement(
                                            this.filteredFormData[value.index],
                                            keyListener,
                                        );
                                        // const element = _this.filteredFormData[value.index].find(field => field.name === keyListener);
                                        if (element != null) {
                                            element.value = distance;
                                        }
                                        // Try this as well in future if value not set
                                        // if(element.value != null) {
                                        //     const childrenArray = _this.formArray.toArray();
                                        //     const current_line = childrenArray.find(c => c.fields[0].index === 0);

                                        //     let dynamicEl = <InputComponent>_this.findElementInDynamicFields(current_line.dynamicFields, keyListener);
                                        //     if(dynamicEl && dynamicEl.setValue) {
                                        //         dynamicEl.setValue(distance);
                                        //     }
                                        // }

                                        if (
                                            event.outputEventWhenComplete !=
                                            null
                                        ) {
                                            _this.pubSubService.publishEvent(
                                                event.outputEventWhenComplete,
                                                value,
                                            );
                                        }
                                    } else {
                                        _this._toastService.showErrorToastWithReason(response.data);
                                    }
                                },
                                (error) => {
                                    _this._console.log(error);
                                    _this._toastService.showErrorToastWithReason(error);
                                },
                            );
                    }
                }
            } else if (googleAPIParams.actionType == "get_email_thread") {
                if (_this.authService.getSyncMode() === "google") {
                    if (!googleAPIParams.emailThreadParams) {
                        _this._toastService.showErrorToast(
                            "Missing Google API Get Email Thread Params",
                        );
                    } else {
                        const emailId = HelperService.getValueInValueSet(
                            value.valueSet,
                            googleAPIParams.emailThreadParams.emailIdKey,
                        );
                        const threadId = HelperService.getValueInValueSet(
                            value.valueSet,
                            googleAPIParams.emailThreadParams.threadIdKey,
                        );
                    }
                } else {
                    _this._dialogService.showErrorDialog(
                        "Error",
                        "You are not subscribed to use Google services",
                    );
                }
            } else if (googleAPIParams.actionType == "create_drive_folder") {
                if (_this.authService.getSyncMode() === "google") {
                    if (!googleAPIParams.driveFolderParams) {
                        _this._toastService.showErrorToast(
                            "Missing Google API Drive Folder Params",
                        );
                    } else {
                        const driveFolder =
                            formValues[
                                googleAPIParams.driveFolderParams.driveFolderKey
                            ];
                        if (!driveFolder) {
                            _this._toastService.showErrorToast(
                                "Missing Google API Drive Folder Params",
                            );
                        } else {
                            let auth =
                                _this.authService.loadGoogleAuth("gdrive");
                            _this.backendService
                                .createDriveFolder(driveFolder, auth)
                                .subscribe(
                                    (response) => {
                                        // _this._console.log(response);
                                        if (response["result"] === "OK") {
                                            if (
                                                event.outputEventWhenComplete !=
                                                null
                                            ) {
                                                _this.pubSubService.publishEvent(
                                                    event.outputEventWhenComplete,
                                                    value,
                                                );
                                            }
                                        } else {
                                            _this._toastService.showErrorToastWithReason(
                                                response["reason"],
                                            );
                                        }
                                    },
                                    (error) => {
                                        _this._console.log(error);
                                        _this._toastService.showErrorToastWithReason(error);
                                    },
                                );
                        }
                    }
                } else {
                    _this._dialogService.showErrorDialog(
                        "Error",
                        "You are not subscribed to use Google services",
                    );
                }
            } else if (googleAPIParams.actionType == "copy_s3_to_drive") {
                if (_this.authService.getSyncMode() === "google") {
                    if (!googleAPIParams.s3ToDriveParams) {
                        _this._toastService.showErrorToast(
                            "Missing Google API Path Params",
                        );
                    } else {
                        const s3Path =
                            formValues[
                                googleAPIParams.s3ToDriveParams.s3PathKey
                            ];
                        const drivePath =
                            formValues[
                                googleAPIParams.s3ToDriveParams.drivePathKey
                            ];
                        if (!s3Path || !drivePath) {
                            _this._toastService.showErrorToast(
                                "Missing Google API Path Params",
                            );
                        } else {
                            let auth =
                                _this.authService.loadGoogleAuth("gdrive");
                            _this.backendService
                                .copyFromS3ToDrive(s3Path, drivePath, auth)
                                .subscribe(
                                    (response) => {
                                        // _this._console.log(response);
                                        if (response["result"] === "OK") {
                                            if (
                                                event.outputEventWhenComplete !=
                                                null
                                            ) {
                                                _this.pubSubService.publishEvent(
                                                    event.outputEventWhenComplete,
                                                    value,
                                                );
                                            }
                                        } else {
                                            _this._toastService.showErrorToastWithReason(
                                                response["reason"],
                                            );
                                        }
                                    },
                                    (error) => {
                                        _this._console.log(error);
                                        _this._toastService.showErrorToastWithReason(error);
                                    },
                                );
                        }
                    }
                } else {
                    _this._dialogService.showErrorDialog(
                        "Error",
                        "You are not subscribed to use Google services",
                    );
                }
            } else if (googleAPIParams.actionType == "copy_drive_to_s3") {
                if (_this.authService.getSyncMode() === "google") {
                    if (!googleAPIParams.driveToS3Params) {
                        _this._toastService.showErrorToast(
                            "Missing Google API Path Params",
                        );
                    } else {
                        const drivePath =
                            formValues[
                                googleAPIParams.driveToS3Params.drivePathKey
                            ];
                        const s3Path =
                            formValues[
                                googleAPIParams.s3ToDriveParams.s3PathKey
                            ];
                        if (!drivePath || !s3Path) {
                            _this._toastService.showErrorToast(
                                "Missing Google API Path Params",
                            );
                        } else {
                            let auth =
                                _this.authService.loadGoogleAuth("gdrive");
                            _this.backendService
                                .copyFromDriveToS3(drivePath, s3Path, auth)
                                .subscribe(
                                    (response) => {
                                        // _this._console.log(response);
                                        if (response["result"] === "OK") {
                                            if (
                                                event.outputEventWhenComplete !=
                                                null
                                            ) {
                                                _this.pubSubService.publishEvent(
                                                    event.outputEventWhenComplete,
                                                    value,
                                                );
                                            }
                                        } else {
                                            _this._toastService.showErrorToastWithReason(
                                                response["reason"],
                                            );
                                        }
                                    },
                                    (error) => {
                                        _this._console.log(error);
                                        _this._toastService.showErrorToastWithReason(error);
                                    },
                                );
                        }
                    }
                } else {
                    _this._dialogService.showErrorDialog(
                        "Error",
                        "You are not subscribed to use Google services",
                    );
                }
            } else if (
                googleAPIParams.actionType == "get_emails_by_codice_azienda"
            ) {
                if (_this.authService.getSyncMode() === "google") {
                    let loadingToast = _this._toastService.showLoadingToast(
                        "Loading emails",
                        "Please wait...",
                    );
                    try {
                        const googleAuth =
                            await _this.authService.loadGoogleAuth("gmail");
                        // get user data after login
                        const codiceAziendaList =
                            _this.authService.userinfo.getValue().companies;

                        let getEmailsByCodiceAziendaResult =
                            await _this._googleAPIService.getEmailsByCodiceAzienda(
                                googleAuth,
                                codiceAziendaList,
                            );
                        _this._console.log(getEmailsByCodiceAziendaResult);

                        _this._toastService.hideLoadingToast(loadingToast);

                        if (getEmailsByCodiceAziendaResult.result === "OK") {
                            _this._toastService.showSuccessToast(
                                event.successMessage || "Done!",
                            );
                        } else {
                            _this._toastService.showErrorToast(
                                event.message || "Error occured!",
                            );
                        }
                    } catch (e) {
                        _this._console.log(e);
                        _this._toastService.hideLoadingToast(loadingToast);
                        _this._toastService.showErrorToast(e);
                    }
                } else {
                    _this._dialogService.showErrorDialog(
                        "Error",
                        "You are not subscribed to use Google services",
                    );
                }
            } else if (googleAPIParams.actionType === "get_drive_changes") {
                if (_this.authService.getSyncMode() === "google") {
                    let loadingToast = _this._toastService.showLoadingToast(
                        "Getting Google Drive changes",
                        "Please wait...",
                    );
                    try {
                        const googleAuth =
                            await _this.authService.loadGoogleAuth("gdrive");

                        let getChangesResult =
                            await _this._googleAPIService.getChanges(
                                googleAuth,
                            );
                        _this._console.log(getChangesResult);

                        _this._toastService.hideLoadingToast(loadingToast);

                        if (getChangesResult.result === "OK") {
                            _this._toastService.showSuccessToast(
                                event.successMessage || "Done!",
                            );
                        } else {
                            _this._toastService.showErrorToast(
                                event.message || "Error occured!",
                            );
                        }
                    } catch (e) {
                        _this._console.log(e);
                        _this._toastService.hideLoadingToast(loadingToast);
                        _this._toastService.showErrorToast(e);
                    }
                } else {
                    _this._dialogService.showErrorDialog(
                        "Error",
                        "You are not subscribed to use Google services",
                    );
                }
            } else if (
                googleAPIParams.actionType == "get_folder_expanded_contents"
            ) {
                if (_this.authService.getSyncMode() === "google") {
                    if (!googleAPIParams.driveExpandedContentsParams) {
                        _this._toastService.showErrorToast(
                            "Missing Google Drive Expanded Contents Params",
                        );
                    } else {
                        const codiceAzienda =
                            formValues[
                                googleAPIParams.driveExpandedContentsParams
                                    .codiceAziendaKey
                            ];
                        const idAnagrafica =
                            formValues[
                                googleAPIParams.driveExpandedContentsParams
                                    .idAnagraficaKey
                            ];
                        const idProgetto = googleAPIParams
                            .driveExpandedContentsParams.idProgettoKey
                            ? formValues[
                                  googleAPIParams.driveExpandedContentsParams
                                      .idProgettoKey
                              ]
                            : null;
                        const idRisorsa = googleAPIParams
                            .driveExpandedContentsParams.idRisorsaKey
                            ? formValues[
                                  googleAPIParams.driveExpandedContentsParams
                                      .idRisorsaKey
                              ]
                            : null;
                        const idSondaggio = googleAPIParams
                            .driveExpandedContentsParams.idSondaggioKey
                            ? formValues[
                                  googleAPIParams.driveExpandedContentsParams
                                      .idSondaggioKey
                              ]
                            : null;
                        const codicePart = googleAPIParams
                            .driveExpandedContentsParams.codicePartKey
                            ? formValues[
                                  googleAPIParams.driveExpandedContentsParams
                                      .codicePartKey
                              ]
                            : null;
                        const syncMode = googleAPIParams
                            .driveExpandedContentsParams.syncMode
                            ? googleAPIParams.driveExpandedContentsParams
                                  .syncMode
                            : "full";
                        if (!codiceAzienda) {
                            _this._toastService.showErrorToast(
                                "Missing Google Drive Expanded Contents Params",
                            );
                        } else {
                            let loadingToast =
                                _this._toastService.showLoadingToast(
                                    "Synching Google Drive",
                                    "Please wait...",
                                );
                            try {
                                const googleAuth =
                                    await _this.authService.loadGoogleAuth(
                                        "gdrive",
                                    );

                                await _this._googleAPIService.syncGoogleDrive(
                                    googleAuth,
                                    syncMode,
                                    codiceAzienda,
                                    idAnagrafica,
                                    idProgetto,
                                    idRisorsa,
                                    idSondaggio,
                                    codicePart,
                                );

                                /*
                                // let getChangesResult = await _this._googleAPIService.getChanges(googleAuth);
                                // _this._console.log(getChangesResult);
                                // if(getChangesResult && getChangesResult.length) {
                                //     let syncDataResponse = await forkJoin(getChangesResult.map(x => _this._googleAPIService.syncGoogleDrive(googleAuth, x.codice_azienda, x.anagrafica_id, null))).toPromise();
                                // }

                                let anagrafica_contents = await _this.backendService.getGoogleDriveFolderNameByAnagrafica(codiceAzienda, idAnagrafica, _this.authService.getUsername()).toPromise();
                                _this._console.log(anagrafica_contents);
                                let anagraficaFolders = anagrafica_contents.response[0]['anagrafica_folder_name_and_sub_folders'];
                                //anagraficaFolders['root_folder'] = '0020-Amedeo Poli';
                                let sub_folders = anagraficaFolders['sub_folders'];
                                if (sub_folders && sub_folders.length > 0) {
                                    for (let i = 0; i < sub_folders.length; i++) {
                                        if (sub_folders[i]['folder'].endsWith('/')) {
                                            sub_folders[i]['folder'] = sub_folders[i]['folder'].slice(0, -1);
                                        }
                                        if (!sub_folders[i]['folder'].includes('/')) {
                                            sub_folders[i]['fileid'] = sub_folders[i]['s3Folder'] + '/' + sub_folders[i]['fileid'];
                                        }
                                    }
                                    //sub_folders = sub_folders.filter(x => !x.md5 || !x.md5.includes('null::varchar'))
                                }

                                anagraficaFolders['sub_folders'] = sub_folders;

                                _this._console.log(codiceAzienda, idProgetto, idAnagrafica, anagraficaFolders);

                                const driveFolder = anagraficaFolders['root_folder'];
                                const subFolders = anagraficaFolders['sub_folders'] || [];

                                let foldersToCheck = [driveFolder];
                                if (subFolders && subFolders.length > 0) {
                                    for await (let subFolder of subFolders) {
                                        if (!foldersToCheck.includes(subFolder.folder)) {
                                            foldersToCheck.push(subFolder.folder);
                                        }
                                    }
                                }

                                _this._console.log('foldersToCheck: ', JSON.stringify(foldersToCheck));

                                anagraficaFolders['folder_ids'] = {};
                                for await (let folderToCheck of foldersToCheck) {
                                    let fixDriveFolderPathByIdentifierResponse = await _this.backendService.fixDriveFolderPathByIdentifier(folderToCheck, googleAuth).toPromise();
                                    anagraficaFolders['folder_ids'][fixDriveFolderPathByIdentifierResponse['folder']] = fixDriveFolderPathByIdentifierResponse['folderId'];

                                }

                                // let fixDriveFolderPathByIdentifierResponse = await forkJoin(foldersToCheck.map(x => _this.backendService.fixDriveFolderPathByIdentifier(x, googleAuth))).toPromise();
                                // _this._console.log('fixDriveFolderPathByIdentifier Response: ', fixDriveFolderPathByIdentifierResponse);

                                // anagraficaFolders['folder_ids'] = {};
                                // fixDriveFolderPathByIdentifierResponse.forEach(x => {
                                //     anagraficaFolders['folder_ids'][x['folder']] = x['folderId']
                                // });

                                anagraficaFolders['codice_azienda'] = codiceAzienda;

                                _this._console.log(anagraficaFolders);
                                // let fixAnagraficaFolderByIdentifierResponse = await _this.backendService.fixAnagraficaFolderByIdentifier(anagraficaFolders, googleAuth).toPromise();
                                // _this._console.log('fixAnagraficaFolderByIdentifier Response ', fixAnagraficaFolderByIdentifierResponse);
                                // anagraficaFolders['folder_ids'] = fixAnagraficaFolderByIdentifierResponse['folderIds'];
                                // anagraficaFolders['codice_azienda'] = codiceAzienda;


                                let getDriveFolderDeepContentsResponse: any = await _this.backendService.getDriveFolderDeepContents(anagraficaFolders, googleAuth).toPromise();
                                _this._console.log('getDriveFolderDeepContentsResponse ', getDriveFolderDeepContentsResponse);

                                let syncDataResponse = await forkJoin(getDriveFolderDeepContentsResponse.syncData.map(x => _this.backendService.syncDriveS3File([x], googleAuth))).toPromise();
                                _this._console.log('syncDataResponse', syncDataResponse);

                                anagraficaFolders['root_drive_contents'] = getDriveFolderDeepContentsResponse.rootDriveContents;
                                let processDriveFolderDeepContentsResponse: any = await _this.backendService.processDriveFolderDeepContents(anagraficaFolders, googleAuth).toPromise();
                                _this._console.log('processDriveFolderDeepContentsResponse ', processDriveFolderDeepContentsResponse);


                                let filteredFilesForSetProperFileFolder = [];
                                for (let file of processDriveFolderDeepContentsResponse.files) {
                                    if (file.fileid.includes('/')) {
                                        file.fileid = file.fileid.split('/')[1];
                                    }
                                    if (filteredFilesForSetProperFileFolder.filter(x => x.fileid == file.fileid && x.filename == file.filename && x.folder == file.folder).length == 0) {
                                        filteredFilesForSetProperFileFolder.push(file);
                                    }
                                }

                                let contentsJson = {
                                    codice_azienda: codiceAzienda,
                                    id_progetto: idProgetto,
                                    id_anagrafica: idAnagrafica,
                                    files: filteredFilesForSetProperFileFolder
                                }
                                _this._console.log(contentsJson);

                                let setProperFileFolderResponse: any = await _this.backendService.setProperFileFolder(contentsJson).toPromise();
                                _this._console.log('setProperFileFolder Response: ', setProperFileFolderResponse);



                                let performDriveOperationsResponse = [];
                                if (setProperFileFolderResponse.response && setProperFileFolderResponse.response.rows && setProperFileFolderResponse.response.rows.length > 0) {
                                    for await (let operation of setProperFileFolderResponse.response.rows) {
                                        let performDriveOperationResponse = await _this.backendService.performDriveOperations([operation], googleAuth).toPromise();
                                        performDriveOperationsResponse.push(performDriveOperationResponse);
                                    }
                                    // let performDriveOperationsResponse = await forkJoin(setProperFileFolderResponse.response.rows.map(x => _this.backendService.performDriveOperations([x], googleAuth))).toPromise();
                                }

                                _this._console.log('performDriveOperations Response: ', performDriveOperationsResponse);
                                
                                */

                                _this._toastService.hideLoadingToast(
                                    loadingToast,
                                );
                                _this._toastService.showSuccessToast(
                                    event.successMessage || "Done!",
                                );
                            } catch (e) {
                                _this._console.log(e);
                                _this._toastService.hideLoadingToast(
                                    loadingToast,
                                );
                                _this._toastService.showErrorToast(e);
                            }
                        }
                    }
                } else {
                    _this._dialogService.showErrorDialog(
                        "Error",
                        "You are not subscribed to use Google services",
                    );
                }
            } else {
                _this._toastService.showErrorToast(
                    "Missing Google API Get Email Thread Params",
                );
            }
        }
    }

    async runRegulatEvent(event, value, keyListener) {
        let _this = this;
        const regulatAPIParams: RegulatAPIParams = event.regulatAPIParams;
        let formValues = _this.formArray.first.form.value;

        // process the booleans (1/0 instead of true/false)
        for (const value in formValues) {
            if (formValues.hasOwnProperty(value)) {
                const element = formValues[value];
                if (element == null) {
                    continue; // skip null entries
                }
                // decode combos
                if (element["id"] != null) {
                    formValues[value] = element["id"];
                }
                // encode boolean
                else if (element === true) {
                    formValues[value] = "1";
                } else if (element === false) {
                    formValues[value] = "0";
                }
            }
        }

        if (!regulatAPIParams || !regulatAPIParams.actionType) {
            _this._toastService.showErrorToast("Missing Regulat API params");
        } else {
            if (_this.authService.getOneKYCAuth()) {
                if (regulatAPIParams.actionType === "get_aml_scan") {
                    if (!regulatAPIParams.entityParams) {
                        _this._toastService.showErrorToast(
                            "Missing Regulat API entity params",
                        );
                    } else {
                        let loadingToast = _this._toastService.showLoadingToast(
                            "Running OneKYC",
                            "Please wait, it may takes a few minutes",
                        );
                        //_this._dialogService.showLoadingDialog('Running OneKYC', 'Please wait...');

                        const codiceAziendaAML =
                            formValues[
                                regulatAPIParams.entityParams.codice_azienda
                            ];
                        const idAnagraficaAML =
                            formValues[
                                regulatAPIParams.entityParams.id_anagrafica
                            ];
                        const idSomministrazioneAML =
                            formValues[
                                regulatAPIParams.entityParams
                                    .id_somministrazione
                            ];
                        const dynamoUserAML =
                            formValues[
                                regulatAPIParams.entityParams.dynamo_user
                            ];
                        const isLightScan =
                            regulatAPIParams.entityParams.is_light_scan;

                        //First step, get connected registries
                        let connected_registries = await _this.backendService
                            .getConnectedRegistries(
                                codiceAziendaAML,
                                idAnagraficaAML,
                            )
                            .toPromise();
                        _this._console.log(connected_registries.response);

                        if (connected_registries.response === "KO") {
                            _this._console.log("KO");
                            _this._toastService.hideLoadingToast(loadingToast);
                            //_this._dialogService.closeDialog();
                            _this._toastService.showErrorToastWithReason(connected_registries.reason);
                        } else {
                            let connectedRegistries =
                                connected_registries.response;

                            //Second step, query regulat.io
                            let scan_contents = await _this.backendService
                                .getAmlScan(
                                    codiceAziendaAML,
                                    connectedRegistries,
                                    idSomministrazioneAML,
                                    dynamoUserAML,
                                    isLightScan,
                                )
                                .toPromise();
                            _this._console.log(scan_contents);

                            _this._toastService.hideLoadingToast(loadingToast);
                            //_this._dialogService.closeDialog();
                            _this._toastService.showSuccessToast(
                                "OneKYC: Completed!",
                            ); // show success toast
                            this.refreshView(); // refresh the view
                        }
                    }
                } else if (regulatAPIParams.actionType === "get_aml_scans") {
                    if (!regulatAPIParams.surveyParams) {
                        _this._toastService.showErrorToast(
                            "Missing Regulat API survey params",
                        );
                    } else {
                        let loadingToast = _this._toastService.showLoadingToast(
                            "Running OneKYC",
                            "Please wait, it may takes a few minutes",
                        );
                        //_this._dialogService.showLoadingDialog('Running OneKYC', 'Please wait...');

                        const codiceAziendaAML =
                            formValues[
                                regulatAPIParams.surveyParams.codice_azienda
                            ];
                        const idSondaggioAML =
                            formValues[
                                regulatAPIParams.surveyParams.id_sondaggio
                            ];
                        const dynamoUserAML =
                            formValues[
                                regulatAPIParams.surveyParams.dynamo_user
                            ];
                        const isLightScan =
                            regulatAPIParams.surveyParams.is_light_scan;

                        //First step, get connected registries
                        let connected_checks = await _this.backendService
                            .getConnectedChecks(
                                codiceAziendaAML,
                                idSondaggioAML,
                            )
                            .toPromise();
                        _this._console.log(connected_checks.response);

                        if (connected_checks.response === "KO") {
                            _this._console.log("KO");
                            _this._toastService.hideLoadingToast(loadingToast);
                            //_this._dialogService.closeDialog();
                            _this._toastService.showErrorToastWithReason(connected_checks.reason);
                        } else {
                            let connectedChecks = connected_checks.response;

                            for (let i = 0; i < connectedChecks.length; i++) {
                                _this._console.log(
                                    connectedChecks[i].id_somministrazione,
                                );

                                //First step, get connected registries
                                let connected_registries =
                                    await _this.backendService
                                        .getConnectedRegistriesFromCheck(
                                            codiceAziendaAML,
                                            connectedChecks[i]
                                                .id_somministrazione,
                                        )
                                        .toPromise();
                                _this._console.log(
                                    connected_registries.response,
                                );

                                if (connected_registries.response === "KO") {
                                    _this._console.log("KO");
                                    _this._toastService.hideLoadingToast(
                                        loadingToast,
                                    );
                                    //_this._dialogService.closeDialog();
                                    _this._toastService.showErrorToast(
                                        connected_registries.reason,
                                    );
                                    return;
                                } else {
                                    let connectedRegistries =
                                        connected_registries.response;

                                    //Second step, query regulat.io
                                    let scan_contents =
                                        await _this.backendService
                                            .getAmlScan(
                                                codiceAziendaAML,
                                                connectedRegistries,
                                                connectedChecks[i]
                                                    .id_somministrazione,
                                                dynamoUserAML,
                                                isLightScan,
                                            )
                                            .toPromise();
                                    _this._console.log(scan_contents);
                                }
                            }
                            _this._toastService.hideLoadingToast(loadingToast);
                            //_this._dialogService.closeDialog();
                            _this._toastService.showSuccessToast(
                                "OneKYC: Completed!",
                            ); // show success toast
                            this.refreshView(); // refresh the view
                        }
                    }
                } else {
                    _this._toastService.showErrorToast(
                        "Missing Regulat Api Params",
                    );
                }
            } else {
                _this._console.error(
                    "You are not subscribed to use OneKYC service",
                );
                _this._dialogService.showErrorDialog(
                    "Missing authorization",
                    "You are not subscribed to use OneKYC service",
                );
            }
        }
    }

    async runUserManagementEvent(event, value, keyListener) {
        let _this = this;
        const userAPIParams =
            event.userAPIParams || event.message.actionOnYes.userAPIParams;
        let formValues = _this.formArray.first.form.value;
        if (!userAPIParams || !userAPIParams.actionType) {
            _this._toastService.showErrorToast("Missing User API params");
        } else if (userAPIParams.actionType === "invite_user") {
            if (_this.authService.getAllowedToManage()) {
                let loadingToast = _this._toastService.showLoadingToast(
                    "Inviting user...",
                    "Please wait",
                );

                const username = formValues["email_to"].trim();
                const temporaryPassword = HelperService.generatePassword(9);
                const company = formValues["codice_azienda"];
                const associated_user = formValues["associa_user"]
                    ? formValues["associa_user"].id
                    : null;
                const profile = formValues["profile"]
                    ? formValues["profile"].id
                    : null;
                const registry = formValues["id_anagrafica"];
                const tax_code = formValues["codice_fiscale"];

                let inviteUser: any = await _this.backendService
                    .inviteUser(
                        username,
                        company,
                        associated_user,
                        registry,
                        tax_code,
                        temporaryPassword,
                        profile,
                    )
                    .toPromise();
                if (inviteUser.result === "KO") {
                    _this._toastService.hideLoadingToast(loadingToast);
                    _this._toastService.showErrorToast(
                        inviteUser.reason.message,
                    );
                } else {
                    _this._toastService.hideLoadingToast(loadingToast);
                    _this._toastService.showSuccessToast(
                        "User invited successfully",
                    );
                    _this._dialogService.closeDialog();
                    this.refreshView();
                }
            } else {
                _this._console.error("User isn't allowed to invite!");
                _this._dialogService.showErrorDialog(
                    "Missing authorization",
                    "You are not subscribed to invite users",
                );
            }
        } else if (userAPIParams.actionType === "invite_user_again") {
            if (_this.authService.getAllowedToManage()) {
                let loadingToast = _this._toastService.showLoadingToast(
                    "Inviting user again...",
                    "Please wait",
                );
                const email = formValues[userAPIParams.userParams.email];
                const temporaryPassword = HelperService.generatePassword(9);
                let inviteUserAgain: any = await _this.backendService
                    .inviteUserAgain(email, temporaryPassword)
                    .toPromise();
                // _this._console.log(inviteUserAgain);
                if (inviteUserAgain.result === "KO") {
                    _this._toastService.hideLoadingToast(loadingToast);
                    _this._toastService.showErrorToast(
                        inviteUserAgain.reason.message,
                    );
                } else {
                    _this._toastService.hideLoadingToast(loadingToast);
                    _this._toastService.showSuccessToast(
                        "New invitation sent successfully",
                    );
                    this.refreshView();
                }
            } else {
                _this._console.error("User isn't allowed to invite!");
                _this._dialogService.showErrorDialog(
                    "Missing authorization",
                    "You are not subscribed to invite users",
                );
            }
        } else if (userAPIParams.actionType === "delete_user") {
            if (_this.authService.getAllowedToManage()) {
                let loadingToast = _this._toastService.showLoadingToast(
                    "Deleting user...",
                    "Please wait",
                );
                const username = formValues[userAPIParams.userParams.username];
                let deleteUser: any = await _this.backendService
                    .deleteUser(username)
                    .toPromise();
                // _this._console.log(deleteUser);
                if (deleteUser.result === "KO") {
                    _this._toastService.hideLoadingToast(loadingToast);
                    _this._toastService.showErrorToast(
                        deleteUser.reason.message,
                    );
                } else {
                    _this._toastService.hideLoadingToast(loadingToast);
                    _this._toastService.showSuccessToast(
                        "User deleted successfully",
                    );
                    this.refreshView();
                }
            } else {
                _this._console.error("User isn't allowed to invite!");
                _this._dialogService.showErrorDialog(
                    "Missing authorization",
                    "You are not subscribed to delete users",
                );
            }
        } else if (userAPIParams.actionType === "enable_company_to_user") {
            if (_this.authService.getAllowedToManage()) {
                let loadingToast = _this._toastService.showLoadingToast(
                    "Enabling companies to user...",
                    "Please wait",
                );
                const username = formValues["username"];
                const registry = formValues["id_anagrafica"];
                const companyPart = formValues["codice_part"];
                const profile = formValues["profile"]
                    ? formValues["profile"].id
                    : null;
                const enableCompany = formValues["azienda_to_enable"]
                    ? formValues["azienda_to_enable"].id
                    : null;
                const associated_user = formValues["associa_user"]
                    ? formValues["associa_user"].id
                    : null;
                const office = formValues["id_centro_gest"];
                let enableCompanyToUser: any = await _this.backendService
                    .enableCompanyToUser(
                        username,
                        companyPart,
                        enableCompany,
                        office,
                        profile,
                        associated_user,
                        registry,
                    )
                    .toPromise();
                if (enableCompanyToUser.result === "KO") {
                    _this._toastService.hideLoadingToast(loadingToast);
                    _this._toastService.showErrorToast(
                        enableCompanyToUser.reason.message,
                    );
                } else {
                    _this._toastService.hideLoadingToast(loadingToast);
                    _this._toastService.showSuccessToast(
                        "Companies enabled successfully",
                    );
                    this.refreshView();
                }
            } else {
                _this._console.error("User isn't allowed to invite!");
                _this._dialogService.showErrorDialog(
                    "Missing authorization",
                    "You are not subscribed to invite users",
                );
            }
        } else if (
            userAPIParams.actionType === "multi_enablement_company_to_users"
        ) {
            if (_this.authService.getAllowedToManage()) {
                let loadingToast = _this._toastService.showLoadingToast(
                    "Enabling companies to user...",
                    "Please wait",
                );
                const profile = formValues["profile"]
                    ? formValues["profile"].id
                    : null;
                const enableCompany = formValues["azienda_to_enable"]
                    ? formValues["azienda_to_enable"].id
                    : null;
                const associated_user = formValues["associa_user"]
                    ? formValues["associa_user"].id
                    : null;
                const companyPart = formValues["codice_part"];
                try {
                    for (const [index, username] of formValues[
                        "usernames"
                    ].entries()) {
                        let registry = formValues["id_anagrafiche"][index];
                        let office = formValues["id_centri_gest"][index];

                        let enableCompanyToUser: any =
                            await _this.backendService
                                .enableCompanyToUser(
                                    username,
                                    companyPart,
                                    enableCompany,
                                    office,
                                    profile,
                                    associated_user,
                                    registry,
                                )
                                .toPromise();

                        if (enableCompanyToUser.result === "KO") {
                            _this._toastService.showErrorToast(
                                enableCompanyToUser.reason.message,
                            );
                            // return; // Stop processing if an error occurs
                        }
                    }
                } catch (error) {
                    console.error("An error occurred:", error);
                    // Handle the error as needed
                }
                // formValues["usernames"].forEach(async (username, index) => {
                //     let registry = formValues['id_anagrafica'][index];
                //     let office = formValues['id_centro_gest_default'][index];
                //     let enableCompanyToUser: any = await _this.backendService.enableCompanyToUser(username, companyPart, enableCompany, office, profile, associated_user, registry).toPromise();
                //     if (enableCompanyToUser.result === 'KO') {
                //         _this._toastService.hideLoadingToast(loadingToast);
                //         _this._toastService.showErrorToast(enableCompanyToUser.reason.message,null,5);
                //     }
                // });
                _this._toastService.hideLoadingToast(loadingToast);
                _this._toastService.showSuccessToast(
                    "Companies enabled successfully",
                );
                this.refreshView();
            } else {
                _this._console.error("User isn't allowed to invite!");
                _this._dialogService.showErrorDialog(
                    "Missing authorization",
                    "You are not subscribed to invite users",
                );
            }
        } else if (userAPIParams.actionType === "dissociates_company") {
            if (_this.authService.getAllowedToManage()) {
                let loadingToast = _this._toastService.showLoadingToast(
                    "Dissociating companies from user...",
                    "Please wait",
                );
                const username = formValues["username"];
                const dissociatesCompany = formValues["company_to_dissociate"]
                    ? formValues["company_to_dissociate"].id
                    : null;
                let dissociatesCompanyResult: any = await _this.backendService
                    .dissociatesCompanyFromUser(username, dissociatesCompany)
                    .toPromise();
                if (dissociatesCompanyResult.result === "KO") {
                    _this._toastService.hideLoadingToast(loadingToast);
                    _this._toastService.showErrorToast(
                        dissociatesCompanyResult.reason.message,
                    );
                } else {
                    _this._toastService.hideLoadingToast(loadingToast);
                    _this._toastService.showSuccessToast(
                        "Company successfully dissociates",
                    );
                    this.refreshView();
                }
            } else {
                _this._console.error("User isn't allowed to dissociates!");
                _this._dialogService.showErrorDialog(
                    "Missing authorization",
                    "You are not subscribed to invite users",
                );
            }
        }
    }

    reload() {
        this._console.log("onReload: form-getter");
        this.clearForm();
        this.onReload.emit();
    }

    clearForm() {
        this.filteredFormData = [];
        this.quickAddData = [];

        this.cdRef.detectChanges();
    }

    applyFilter() {
        let _this = this;
        if (_this.results && _this.results.length) {
            if (_this.filter) {
                var filteredResults = _this.results.filter((entry) => {
                    var add = true;
                    var done = false;

                    if (entry && Object.entries(entry).length) {
                        // Since we will use fullValueSet, we don't need to read all fields
                        for (const [key, value] of Object.entries(entry)) {
                            // _this._console.log(key, value);
                            if (value && !done) {
                                let dataType = typeof value;
                                if (
                                    dataType == "string" ||
                                    dataType == "number"
                                ) {
                                    let data: string = "" + value;
                                    if (
                                        data &&
                                        data
                                            .toLowerCase()
                                            .includes("" + _this.filter)
                                    ) {
                                        add = true;
                                        done = true;
                                    } else {
                                        add = false;
                                        done = false;
                                    }
                                } else if (value.constructor == Object) {
                                    let comboField: any = value;
                                    if (
                                        comboField.options &&
                                        comboField.options.length &&
                                        comboField.value
                                    ) {
                                        let selectedItem =
                                            comboField.options.filter(
                                                (x) => x.id == comboField.value,
                                            )[0];
                                        if (
                                            selectedItem.name &&
                                            selectedItem.name
                                                .toLowerCase()
                                                .includes(_this.filter)
                                        ) {
                                            add = true;
                                            done = true;
                                        } else {
                                            add = false;
                                            done = false;
                                        }
                                    }
                                    // Combobox
                                    // code here...
                                }
                            }
                        }
                    }
                    return add;
                });

                _this.processResults(filteredResults);
            } else {
                _this.processResults(_this.results);
                // _this.filteredFormData = JSON.parse(JSON.stringify(_this.formData));
            }
            _this.process_form(_this.filteredFormData);
        }
    }

    findElementInDynamicFields(
        dynamicFields:
            | QueryList<DynamicFieldDirective>
            | QueryList<SubFormDynamicFieldDirective>,
        name: string,
    ) {
        let element = null;

        dynamicFields.forEach((dynamicField) => {
            if (dynamicField.field.name === name) {
                element = dynamicField;
            }
            if (
                dynamicField.componentRef.instance instanceof
                    SubformComponent &&
                !element
            ) {
                let findResult = this.findElementInDynamicFields(
                    (<SubformComponent>dynamicField.componentRef.instance)
                        .dynamicFields,
                    name,
                );
                if (findResult) {
                    element = findResult;
                }
            }
        });
        return element;
    }

    getFormValues(): any {
        const _this = this;
        if (this.formArray != null) {
            return HelperService.getFormValues(this.formArray.first.form.value);
        }
        return {};
    }

    // Import export stuff
    uploadCSV(): void {
        this._importExportService.importCSV(this.formParams.entryName);
    }

    importAdvanced(item: ImportItem) {
        this._importExportService.importAdvancedCSV(
            this.formParams.entryName,
            this.formParams.keys,
            item.label,
            true,
        );
    }

    downloadTemplateFile(): void {
        this._importExportService.getTemplateFile(this.formParams.entryName);
    }

    downloadCSV() {
        const formValues = this.getFormValues();
        this._importExportService.downloadCSV(
            this.formParams.entryName,
            this.authService.getCurrentCompany(this.currentKeys),
            this.formParams.keys,
            null,
            true,
            formValues,
            null,
        );
    }

    downloadAdvancedCSV(item: ExportItem): void {
        const formValues = this.getFormValues();
        this._importExportService.downloadCSV(
            this.formParams.entryName,
            this.authService.getCurrentCompany(this.currentKeys),
            this.formParams.keys,
            null,
            true,
            formValues,
            item.label,
        );
    }

    downloadExcel() {
        const formValues = this.getFormValues();
        this._importExportService.downloadExcel(
            this.formParams.entryName,
            this.authService.getCurrentCompany(this.currentKeys),
            this.formParams.keys,
            null,
            true,
            formValues,
            null,
        );
    }

    downloadAdvancedExcel(item: ExportItem): void {
        const formValues = this.getFormValues();
        this._importExportService.downloadExcel(
            this.formParams.entryName,
            this.authService.getCurrentCompany(this.currentKeys),
            this.formParams.keys,
            null,
            true,
            formValues,
            item.label,
        );
    }

    loadWidgetsConfiguration(widgetsConfiguration: WidgetsConfigurations) {
        if (widgetsConfiguration) {
            this.widgetsConfiguration = widgetsConfiguration;
        } else {
            this.widgetsConfiguration = {
                attachments: {
                    onSaveAction: "reload",
                },
            };
        }
    }

    attachmentsOnSave(result) {
        if (
            result &&
            this.widgetsConfiguration.attachments.onSaveAction == "reload"
        ) {
            this.refreshView();
        }
    }

    trackItems(index: number, item: any) {
        return index;
    }
}
