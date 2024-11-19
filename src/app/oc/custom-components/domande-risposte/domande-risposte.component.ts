import { Component, QueryList, ViewChildren, Input, OnChanges, SimpleChanges, Output, EventEmitter } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { DomandaRispostaElement, DomandeRisposteParams, FieldConfig, FormViewKey, Item } from "../../interfaces";
import { AuthService, BackendService, ConsoleLoggerService, DialogService, EmailService, FormsService, HelperService, ToastService } from "../../services";
import { ComboboxComponent } from "app/oc/dynamic-forms/components/combobox/combobox.component";
import { DomandaRispostaComponent } from "./domanda-risposta/domanda-risposta.component";
import { MatDialog } from "@angular/material/dialog";
import { MenuOptionsCustomDialogComponent } from "app/oc/dialogs/menu-options-custom.dialog/menu-options-custom.dialog.component";
import { memoize } from "app/oc/decorators/memoize";
import { UntypedFormGroup } from "@angular/forms";

@Component({
    selector: "domande-risposte",
    templateUrl: "./domande-risposte.component.html",
    styleUrls: ["./domande-risposte.component.scss"],
    host: {
        '[style.width]': '"100%"',
      }
})
export class DomandeRisposteComponent implements OnChanges
{
    @ViewChildren(DomandaRispostaComponent)
    formArray: QueryList<DomandaRispostaComponent>;

    @Input() domandeRisposteParams: DomandeRisposteParams = {
        keys: {},
        entryName: "",
    };

    @Output() sendEvent = new EventEmitter<any>();

    tabs: any = null;
    activeIndex = 0;
    tiles: any = [];

    entryName: string
    isQuickAdd: boolean = false;

    isLoading: boolean = true;

    formParams: any[] = [];
    attributes = {};
    externalKeys = {};

    businessObjectName: string = 'riepilogoRisposte';

    data: DomandaRispostaElement[] = [];

    domandaKeys: any[] = [];

    viewKeys: FormViewKey[][] = null;

    formData: FieldConfig[][] = [];

    constructor(
        protected route: ActivatedRoute,
        protected router: Router,
        protected backendService: BackendService,
        protected location: Location,
        private _console: ConsoleLoggerService,
        private _formsService: FormsService,
        private _dialogService: DialogService,
        private authService: AuthService,
        private _toastService: ToastService,
        private cutomDialog: MatDialog,
        private _emailService: EmailService
    ) {
    }

    @memoize()
    ngOnChanges(changes: SimpleChanges): void {
        if(changes.domandeRisposteParams) {
            this.loadData();
        }
    }

    loadData() {
        const _this = this;
        _this.isLoading = true;
        const subscription = _this.backendService.getDomandeRisposte(_this.domandeRisposteParams.keys.codice_azienda, this.domandeRisposteParams.entryName, _this.domandeRisposteParams.keys).subscribe(result => {
            if(result && result.data && result.data.crea_json_verifica) {
                const results: DomandaRispostaElement[] = JSON.parse(result.data.crea_json_verifica);
                _this.data = results.map(x => (
                    {
                        //  variabili restituite: in caso di modifiche post operazioni, inserire qui (es.: decodifica delle note eseguita dopo le elaborazioni di note)
                        ...x,
                        codice_compito: x.compito? x.compito.codice_compito: null,
                        note_risposta: _this.decodeNotes(x.note_risposta)
                    }
                ));
                _this.processData(_this.data);
            }
            subscription.unsubscribe();
            _this.isLoading = false;
        }, error => {
            subscription.unsubscribe();
            _this.isLoading = false;
        });
    }

    processData(results: DomandaRispostaElement[]) {
        const _this = this;
        _this.prepareFormParams(results);
        _this.domandaKeys = results.map(x => x.keys);
        _this.viewKeys = results.map((x, i) => _this.prepareView(x, i));
        _this.formData = [];

        for(let i = 0; i < results.length; i++) {
            const keys: any = {...results[i], ...results[i].keys, businessObjectName: _this.businessObjectName};
            if(keys.hasOwnProperty('keys')){
                delete keys.keys;
            }
            if(keys.hasOwnProperty('risposte_previste_options')){
                delete keys.risposte_previste_options;
            }

            let newKeys = {};
            Object.keys(keys).map(key => {
                if(keys[key] != null && typeof keys[key] === "number") {
                    newKeys[key] = "" + keys[key];
                }
                else {
                    newKeys[key] = keys[key];
                }
            });

            const curFormData = _this._formsService.getFormData(_this.viewKeys[i], [newKeys], _this.attributes, _this.formParams[i], results[i].keys, results[i].readonly)[0].map(x => (x.type === "combobox") ? {...x, value: null}: x);
            
            //  Funzioni di update racchiudibili in un'unica funzione con switch per i diversi casi, per migliorare leggibilità
            curFormData.forEach((_, j) => {
                switch(curFormData[j].name) {
                    case 'descrizione':
                        curFormData[j].onClick = (field: FieldConfig) => _this.navigateToDomandeDettaglio(field, i);
                        break;
                    case 'codice_compito':
                        curFormData[j].onClick = (field: FieldConfig) => _this.navigateToCompiti(field, i);
                        break;
                    case 'kyc_deep':
                        curFormData[j].onClick = (field: FieldConfig) => _this.kycDeep(field, i);
                        break;
                    case 'kyc_light':
                        curFormData[j].onClick = (field: FieldConfig) => _this.kycLight(field, i);
                        break;
                    case 'send_mail':
                        curFormData[j].onClick = (field: FieldConfig) => _this.sendMail(field, i);
                        break;
                    case 'check_provincia':
                        curFormData[j].onClick = (field: FieldConfig) => _this.checkProvincia(field, i);
                        break;
                    case 'note_risposta':
                        curFormData[j].onBlur = (event: any, field: FieldConfig) => _this.updateNoteRisposta(i);
                        break;
                    case 'peso':
                        curFormData[j].onBlur = (event: any, field: FieldConfig) => _this.updateDomandaRisposta(i);
                        break;
                    case 'risposte_previste':
                        curFormData[j].onClick = (event: any, field: FieldConfig) => _this.updateRispostPreviste(event, field, i);
                        curFormData[j].onBlur = (event: any, field: FieldConfig) => _this.updateDomandaRisposta(i);
                        break;
                    default: return;
                }
            })

            _this.formData = [..._this.formData, curFormData];
            _this.addOptionsAndValue(_this.formData[i], results[i]);
        }
        this.processConditions();
    }

    prepareFormParams(results: DomandaRispostaElement[]) {
        const _this = this;
        this.formParams = results.map(x =>
            (
                {
                    entryName: this.domandeRisposteParams.entryName,
                    keys: x.keys,
                    isNew: false,
                    isVisible: true,
                }
            )
        );
    }

    prepareView(result: DomandaRispostaElement, index: number) {
        const _this = this;
        let viewKeys: FormViewKey[] = [
            {
                format: {
                    dataType: "number",
                    viewType: "input"
                },
                isHidden: false,
                isVisible: true,
                isPrimary: false,
                key: "ordinamento",
                label: "N.",
                translate: "RESOURCES.domande_risposte_n",
                newLine: false,
                readOnly: result.readonly || true,
                size: 0.5,
                style: {
                    font_color: "black",
                    font_weight: "600"
                },
            },
            {
                format: {
                    dataType: "text",
                    viewType: "textarea",
                },
                isHidden: false,
                isPrimary: false,
                key: "descrizione",
                label: "Domanda",
                translate: "RESOURCES.domande_risposte_domanda",
                isVisible: true,
                newLine: false,
                readOnly: result.readonly || true,
                size: 6.5,
                textareaHeight: "S",
            }
        ];
        if(result.codice_compito) {
            viewKeys = [
                ...viewKeys,
                {
                    format: {
                        dataType: "number",
                        viewType: "input",
                    },
                    isHidden: false,
                    isVisible: true,
                    isPrimary: false,
                    key: "codice_compito",
                    label: "NC",
                    translate: "RESOURCES.domande_risposte_nc",
                    newLine: false,
                    readOnly: result.readonly || true,
                    size: 1,
                    textareaHeight: "S",
                }
            ]
        }

        viewKeys = [
            ...viewKeys,
            {
                format: {
                    dataType: "number",
                    viewType: "input"
                },
                isHidden: false,
                isVisible: true,
                isPrimary: false,
                key: "punteggio",
                label: "Punteggio",
                translate: "RESOURCES.domande_risposte_punteggio",
                newLine: false,
                readOnly: result.readonly || true,
                size: 0.5,
            },
            {
                autoGenerate: false,
                buttonIcon: "more_vert",
                format: {
                    menuOptions: _this.getMenuActions(result, index),
                    viewType: "menu"
                },
                inputEvents: [
                    {
                        actionType: "show_message",
                        condition: "none",
                        eventName: "delete_risposta",
                        message: {
                            actionOnNo: {
                                actionType: "skip",
                                queryFunct: "select 1"
                            },
                            actionOnYes: {
                                actionType: "query",
                                queryFunct: "SELECT entrasp.delete_risposta( $codice_azienda$,$id_domanda$,$id_modello_test$,$id_modello_test_vr$,$id_sondaggio$,$id_somministrazione$, $id_sezione$)"
                            },
                            messageText: "Cancellare definitivamente la risposta?"
                        },
                        outputEventWhenComplete: "triggerReload",
                        successMessage: "Risposta cancellata correttamente",
                        values: []
                    },
                    {
                        actionType: "show_message",
                        condition: "none",
                        eventName: "dissocia_segnalazione",
                        message: {
                            actionOnNo: {
                                actionType: "skip",
                                queryFunct: "select 1"
                            },
                            actionOnYes: {
                                actionType: "query",
                                queryFunct: "delete from entrasp.compiti_rif_bo where codice_azienda='£codice_azienda£' and codice_compito='£codice_compito£' and id_domanda=£id_domanda£ and object_name='riepilogoRisposte' and id_somministrazione=$id_somministrazione$"
                            },
                            messageText: "Dissociare la segnalazione dalla domanda?"
                        },
                        outputEventWhenComplete: "triggerReload",
                        successMessage: "Segnalazione dissociata correttamente",
                        values: []
                    },
                    {
                        actionType: "show_message",
                        condition: "none",
                        eventName: "answer_copy",
                        message: {
                            actionOnNo: {
                                actionType: "skip",
                                queryFunct: "select 1"
                            },
                            actionOnYes: {
                                actionType: "query",
                                queryFunct: "select entrasp.accoda_risposte_somministrazione(snd.codice_azienda, snd.id_modello_test, snd.id_modello_test_vr, ss.id_sondaggio, ss.id_somministrazione, $id_somministrazione$, $id_domanda$, false) from entrasp.sondaggi_somministrati ss inner join entrasp.sondaggi snd on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio=snd.id_sondaggio where snd.codice_azienda=$codice_azienda$ and snd.id_sondaggio=$id_sondaggio$ and ss.id_somministrazione!=$id_somministrazione$"
                            },
                            messageText: "Copiare questa risposta su tutte le verifiche (somministrazioni) del sondaggio?"
                        },
                        successMessage: "Risposte copiate correttamente",
                        values: []
                    },
                    {
                        actionType: "dialog",
                        condition: "none",
                        customDialogEntryName: "dialog_domande_associa_note",
                        customDialogTitle: "Associa Nota",
                        eventName: "associa_note",
                        outputEventWhenComplete: "triggerReload",
                        values: []
                    }
                ],
                isHidden: false,
                isVisible: true,
                isPrimary: false,
                key: "domande_actions",
                label: "",
                newLine: false,
                readOnly: result.readonly || false,
                sameOrigin: false,
                size: 0.6
            },
            {
                autoGenerate: false,
                format: {
                    viewType: "widget",
                    widgetType: "multi-attachments"
                },
                isHidden: false,
                isVisible: true,
                isPrimary: false,
                key: "num_allegati",
                label: "All.",
                translate: "RESOURCES.domande_risposte_all",
                newLine: true,
                readOnly: result.readonly || true,
                size: 0.6
            },
            {
                format: {
                    dataType: "text",
                    viewType: "textarea",
                },
                isHidden: false,
                isPrimary: false,
                key: "note_domanda",
                label: "Annotazioni Esplicative Domanda",
                translate: "RESOURCES.domande_risposte_annotazioni_esplicative_domanda",
                isVisible: true,
                newLine: true,
                readOnly: result.readonly || true,
                size: 10,
                style: {
                    font_color: "black",
                    font_style: "italic",
                    font_weight: "500",
                },
                textareaHeight: "S",
            },
        ];

        viewKeys.push({
            format: {
                dataType: "text",
                value: null,
                viewType: "label"
            },
            isHidden: false,
            isVisible: true,
            isPrimary: false,
            key: "risposta",
            label: "Risposta",
            translate: "RESOURCES.domande_risposte_risposta",
            newLine: false,
            readOnly: result.readonly || true,
            sameOrigin: false,
            size: 9,
            style: {
                background_color: "#03a9f4",
                font_color: "white",
                font_size: "1.3em",
                font_style: "italic",
                font_weight: "400"
            },
        });


        viewKeys.push({
            format: {
                viewType: "invisible"
            },
            isVisible: true,
            isHidden: false,
            isPrimary: false,
            key: "no_new_line",
            label: "no_new_line",
            translate: "RESOURCES.domande_risposte_no_new_line",
            newLine: false,
            readOnly: result.readonly || true,
            sameOrigin: false,
            size: 3,
        });

        var addInvisible = false;

        if(result.kycDeepButton) {
            viewKeys.push({
                buttonIcon: "person_search",
                format: {
                    viewType: "button"
                },
                isHidden: false,
                isVisible: true,
                isPrimary: false,
                key: "kyc_deep",
                label: "OneKYC - Deep",
                translate: "RESOURCES.domande_risposte_onekyc__deep",
                newLine: false,
                outputEvent: {
                    eventName: "get_aml_scan",
                    eventTrigger: "press"
                },
                readOnly: result.readonly || false,
                sameOrigin: false,
                size: 2,
                style: {
                    background_color: "firebrick",
                    font_color: "white"
                },
                tooltip: "Controllo OneKYC approfondito",
            });
            addInvisible = true;
        };

        if(result.mailButton) {
            viewKeys.push({
                buttonIcon: "mail",
                format: {
                    viewType: "button"
                },
                isHidden: false,
                isVisible: true,
                isPrimary: false,
                key: "send_mail",
                label: "Invia mail",
                translate: "RESOURCES.domande_risposte_invia_mail",
                newLine: false,
                outputEvent: {
                    eventName: "invia_mail",
                    eventTrigger: "press"
                },
                readOnly: result.readonly || false,
                sameOrigin: false,
                size: 2,
                style: {
                    background_color: "firebrick",
                    font_color: "white"
                },
                tooltip: "Invia mail",
            });
            addInvisible = true;
        }

        if(result.kycLightButton) {
            viewKeys.push(
                {
                    buttonIcon: "person_search",
                    format: {
                        viewType: "button"
                    },
                    isHidden: false,
                    isVisible: true,
                    isPrimary: false,
                    key: "kyc_light",
                    label: "OneKYC - Light",
                    translate: "RESOURCES.domande_risposte_onekyc__light",
                    newLine: false,
                    outputEvent: {
                        eventName: "get_light_aml_scan",
                        eventTrigger: "press"
                    },
                    readOnly: result.readonly || false,
                    sameOrigin: false,
                    size: 2,
                    tooltip: "Controllo OneKYC limitato alle liste anti-terrorismo",
                }
            );
            addInvisible = true;
        }

        if(result.checkProvincia) {
            viewKeys.push({
                buttonIcon: "person_search",
                format: {
                    viewType: "button"
                },
                isHidden: false,
                isVisible: true,
                isPrimary: false,
                key: "check_provincia",
                label: "Check provincia",
                translate: "RESOURCES.domande_risposte_check_provincia",
                newLine: false,
                outputEvent: {
                    eventName: "check_provincia_event",
                    eventTrigger: "press"
                },
                readOnly: result.readonly || false,
                sameOrigin: false,
                size: 2,
                style: {
                    background_color: "royalblue",
                    font_color: "white"
                },
                tooltip: "Check provincia",
            });
            addInvisible = true;
        }

        if(addInvisible && !addInvisible){
            viewKeys.push(
                {
                    format: {
                        viewType: "invisible"
                    },
                    isHidden: false,
                    isVisible: true,
                    isPrimary: false,
                    key: "new_line",
                    label: "new_line",
                    translate: "RESOURCES.domande_risposte_new_line",
                    newLine: true,
                    readOnly: result.readonly || true,
                    sameOrigin: false,
                    size: 3,
                }
            );
        }

        if(result.type === "radiobutton") {
            let options: Item[] = [];
            let value = null;

            viewKeys = [...viewKeys,
                {
                    format: {
                        comboQuery: "",
                        viewType: "radiobutton",
                        options: options,
                        value: value
                    },
                    isHidden: false,
                    isPrimary: false,
                    key: "risposte_previste",
                    label: "Risposta",
                    translate: "RESOURCES.domande_risposte_risposta",
                    isVisible: true,
                    newLine: false,
                    readOnly: result.readonly || false,
                    size: 8.5,
                },
                {
                    format: {
                        dataType: "number",
                        viewType: "input"
                    },
                    isPrimary: false,
                    isHidden: false,
                    isVisible: true,
                    key: "peso",
                    label: "Risultato %",
                    translate: "RESOURCES.domande_risposte_risultato_",
                    newLine: false,
                    readOnly: result.readonly || true,
                    size: 1,
                },
            ];
        }
        else if(result.type === "checkboxgroup") {
            let options: Item[] = [];
            let value = null;

            viewKeys = [...viewKeys,
                {
                    format: {
                        comboQuery: "",
                        viewType: "checkboxgroup",
                        options: options,
                        value: value
                    },
                    isHidden: false,
                    isPrimary: false,
                    key: "risposte_previste",
                    label: "Risposta",
                    translate: "RESOURCES.domande_risposte_risposta",
                    isVisible: true,
                    newLine: false,
                    readOnly: result.readonly || false,
                    size: 8.5,
                },
                {
                    format: {
                        dataType: "number",
                        viewType: "input"
                    },
                    isPrimary: false,
                    isHidden: false,
                    isVisible: true,
                    key: "peso",
                    label: "Risultato %",
                    translate: "RESOURCES.domande_risposte_risultato_",
                    newLine: false,
                    readOnly: result.readonly || true,
                    size: 1,
                },
            ];
        }
        else if(result.type === "combobox") {
            let options: Item[] = [];
            let value = null;

            viewKeys = [...viewKeys,
                {
                    format: {
                        comboQuery: "",
                        viewType: "combobox",
                        options: options,
                        value: value
                    },
                    isHidden: false,
                    isPrimary: false,
                    key: "risposte_previste",
                    label: "Risposta",
                    translate: "RESOURCES.domande_risposte_risposta",
                    isVisible: true,
                    newLine: false,
                    readOnly: result.readonly || false,
                    size: 8.5,
                },
                {
                    format: {
                        dataType: "number",
                        viewType: "input"
                    },
                    isPrimary: false,
                    isHidden: false,
                    isVisible: true,
                    key: "peso",
                    label: "Risultato %",
                    translate: "RESOURCES.domande_risposte_risultato_",
                    newLine: false,
                    readOnly: result.readonly || true,
                    size: 1,
                },
            ];
        }
        else if(result.type === "date") {
            let options: Item[] = [];
            let value = null;

            viewKeys = [...viewKeys,
                {
                    format: {
                        comboQuery: "",
                        viewType: "input",
                        dataType: "datetime",
                        options: options,
                        value: value
                    },
                    isHidden: false,
                    isPrimary: false,
                    key: "risposte_previste",
                    label: "Risposta",
                    translate: "RESOURCES.domande_risposte_risposta",
                    isVisible: true,
                    newLine: false,
                    readOnly: result.readonly || false,
                    size: 1,
                },
                {
                    format: {
                        dataType: "number",
                        viewType: "input"
                    },
                    isPrimary: false,
                    isHidden: false,
                    isVisible: true,
                    key: "peso",
                    label: "Risultato %",
                    translate: "RESOURCES.domande_risposte_risultato_",
                    newLine: false,
                    readOnly: result.readonly || false,
                    size: 1,
                },
            ];
        }
        else if(result.type === "number") {
            let options: Item[] = [];
            let value = null;

            viewKeys = [...viewKeys,
                {
                    format: {
                        comboQuery: "",
                        viewType: "input",
                        dataType: "number",
                        options: options,
                        value: value
                    },
                    isHidden: false,
                    isPrimary: false,
                    key: "risposte_previste",
                    label: "Risposta",
                    translate: "RESOURCES.domande_risposte_risposta",
                    isVisible: true,
                    newLine: false,
                    readOnly: result.readonly || false,
                    size: 1,
                },
                {
                    format: {
                        dataType: "number",
                        viewType: "input"
                    },
                    isPrimary: false,
                    isHidden: false,
                    isVisible: true,
                    key: "peso",
                    label: "Risultato %",
                    translate: "RESOURCES.domande_risposte_risultato_",
                    newLine: false,
                    readOnly: result.readonly || false,
                    size: 1,
                },
            ];
        }
        else if(result.type === "text") {

            viewKeys = [...viewKeys,
                {
                    format: {
                        dataType: "number",
                        viewType: "input"
                    },
                    isPrimary: false,
                    isHidden: false,
                    isVisible: true,
                    key: "peso",
                    label: "Risultato %",
                    translate: "RESOURCES.domande_risposte_risultato_",
                    newLine: false,
                    readOnly: result.readonly || false,
                    size: 1,
                },
            ];
        }

        viewKeys = [...viewKeys,
            {
                format: {
                    dataType: "text",
                    viewType: "textarea",
                },
                isHidden: false,
                isPrimary: false,
                key: "note_risposta",
                label: "Note",
                translate: "RESOURCES.domande_risposte_note",
                isVisible: true,
                newLine: true,
                readOnly: result.readonly || false,
                size: 10,
                style: {
                    font_color: "black",
                    font_style: "italic",
                    font_weight: "500",
                },
                textareaHeight: "S",
            }
        ];
        return viewKeys;
    }

    getMenuActions(result: DomandaRispostaElement, index: number) {
        const _this = this;
        // {
        //     icon: "report_problem",
        //     label: "Crea Segnalazione",
        //  translate: "RESOURCES.domande_risposte_crea_segnalazione",
        //     outputEventName: "risposte_update_insert_on_create",
        //     onClick: () => {_this.creaSegnalazione()},
        // },
        // {
        //     icon: "launch",
        //     label: "Vai a segnalazione",
        //  translate: "RESOURCES.domande_risposte_vai_a_segnalazione",
        //     outputEventName: "segnalazione_navigate",
        // },
        // {
        //     icon: "close",
        //     label: "Dissocia Segnalazione",
        //  translate: "RESOURCES.domande_risposte_dissocia_segnalazione",
        //     outputEventName: "dissocia_segnalazione",
        // },
        let menuActions: any[] = [
            {
                icon: "report_problem",
                label: "Crea segnalazione",
                translate: "RESOURCES.domande_risposte_crea_segnalazione",
                onClick: (item: any, field: FieldConfig) => {_this.creaSegnalazione(item, field, index)},
            },
            {
                icon: "link",
                label: "Associa compito",
                translate: "RESOURCES.domande_risposte_associa_compito",
                onClick: (item: any, field: FieldConfig) => {_this.associaCompito(item, field, index)}
            },
        ];

        if(result.type === 'radiobutton') {
            menuActions = [...menuActions,
                {
                    icon: "delete",
                    label: "Cancella risposta",
                    translate: "RESOURCES.domande_risposte_cancella_risposta",
                    outputEventName: "delete_risposta",
                    onClick: (item: any, field: FieldConfig) => {_this.resetRispostaPrevista(item, field, index)},
                },
            ]
        }

        menuActions = [...menuActions,
            {
                icon: "content_copy",
                label: "Copia questa risp. sulle verifiche (somministrazioni) del sondaggio",
                translate: "RESOURCES.domande_risposte_copia_questa_risp_sulle_verifiche_somministrazioni_del_sondaggio",
                outputEventName: "answer_copy",
                onClick: (item: any, field: FieldConfig) => {_this.answerCopy(item, field, index)},
            },
            {
                icon: "link",
                label: "Seleziona note",
                translate: "RESOURCES.domande_risposte_seleziona_note",
                outputEventName: "associa_note",
                onClick: (item: any, field: FieldConfig) => {_this.associaNote(item, field, index)},
            }
        ];
        return menuActions;
    }

    addOptionsAndValue(formData: FieldConfig[], result: DomandaRispostaElement){
        if(result.type === "radiobutton") {
            let options: Item[] = [];
            let value = null;

            if(result.risposte_previste_options) {
                options = result.risposte_previste_options.sort(x => x.ordinamento).map(x => { return { id: x.id_risposta_prev, name: x.risposta } });
                let valueIndex = result.risposte_previste_options.findIndex((x: any) => x.chosen === true)
                if(valueIndex  > -1) {
                    value = result.risposte_previste_options[valueIndex].id_risposta_prev;
                }

                formData.forEach((_, i) => {
                    if(formData[i].name === 'risposte_previste') {
                        formData[i].options = options;
                        formData[i].value = value;
                    }
                    if(formData[i].name === 'peso') {
                        if(value) {
                            formData[i].value = result.risposte_previste_options.find((x: any) => x.id_risposta_prev == value).peso_ans;
                        }
                        formData[i].style = {};
                        if(result.background_color) {
                            formData[i].style = {...formData[i].style, background_color: result.background_color};
                        }
                        if(result.font_color) {
                            formData[i].style = {...formData[i].style, font_color: result.font_color};
                        }
                        if(valueIndex>-1) {
                            if(result.risposte_previste_options[valueIndex].background_color_ans) {
                                formData[i].style = {...formData[i].style, background_color: result.risposte_previste_options[valueIndex].background_color_ans};
                            }
                            if(result.risposte_previste_options[valueIndex].font_color_ans) {
                                formData[i].style = {...formData[i].style, font_color: result.risposte_previste_options[valueIndex].font_color_ans};
                            }
                        }
                    }
                })
            }
        }
        else if(result.type === "checkboxgroup") {
            let options: Item[] = [];
            let value = [];
            let checkboxGroupItemsStyle: {
                id: any;
                background_color?: string;
                font_color?: string;
                font_size?: string;
                font_style?: "italic" | "normal";
                font_weight?: string;
            }[] = [];

            if(result.risposte_previste_options) {
                options = result.risposte_previste_options.sort(x => x.ordinamento).map(x => { return { id: x.id_risposta_prev, name: x.risposta } });
                value = result.risposte_previste_options.filter((x: any) => x.chosen === true)?.map(x => x.id_risposta_prev) ?? null;
                checkboxGroupItemsStyle = result.risposte_previste_options.map(x => {
                    return {
                        id: x.id_risposta_prev,
                        background_color: x.background_color_ans,
                        font_color: x.font_color_ans
                    }
                });

                formData.forEach((_, i) => {
                    if(formData[i].name === 'risposte_previste') {
                        formData[i].options = options;
                        formData[i].value = value;
                        formData[i].checkboxGroupItemsStyle = checkboxGroupItemsStyle;
                    }

                    if(formData[i].name === 'peso') {
                        if(value && value.length > 0) {
                            formData[i].value = result.risposte_previste_options.filter((x: any) => value.includes(x.id_risposta_prev)).map(x => x.peso_ans).reduce((a, b) => a + b);
                        }
                        formData[i].style = {};
                        // if(result.background_color) {
                        //     formData[i].style = {...formData[i].style, background_color: result.background_color};
                        // }
                        // if(result.font_color) {
                        //     formData[i].style = {...formData[i].style, font_color: result.font_color};
                        // }
                    }
                })
            }
        }
        else if(result.type === "combobox") {
            let options: Item[] = [];
            let value = null;

            if(result.risposte_previste_options) {
                options = result.risposte_previste_options.sort(x => x.ordinamento).map(x => { return { id: x.id_risposta_prev, name: x.risposta } });
                let valueIndex = result.risposte_previste_options.findIndex((x: any) => x.chosen === true)
                if(valueIndex > -1) {
                    value = result.risposte_previste_options[valueIndex].id_risposta_prev;
                }

                formData.forEach((_, i) => {
                    if(formData[i].name === 'risposte_previste') {
                        formData[i].options = options;
                        formData[i].value = value;
                    }
                    if(formData[i].name === 'peso' && value) {
                        formData[i].value = result.risposte_previste_options.find((x: any) => x.id_risposta_prev == value).peso_ans;
                    }
                })
            }
        }
        else if(result.type === "date") {
            formData.forEach((_, i) => {
                if(formData[i].name === 'risposte_previste') {
                    formData[i].options = null;
                    formData[i].value = result.risposta_data;
                }
            })
        }
        else if(result.type === "number") {
            formData.forEach((_, i) => {
                if(formData[i].name === 'risposte_previste') {
                    formData[i].options = null;
                    formData[i].value = result.risposta_num;
                }
            })
        }
        else if(result.type === "text") {
            formData.forEach((_, i) => {
                if(formData[i].name === 'risposte_previste') {
                    formData[i].options = null;
                    formData[i].value = result.risposta_text;
                }
            })
        }
    }

    processConditions(initialCheck = true) {
        const _this = this;
        _this.data.forEach((x, i) => {
            var isHidden = false;

            if(x.condition && x.condition.length > 0) {
                x.condition.forEach(c => {
                    const destElIndex = _this.data.findIndex(y => y.id_domanda === c.id_domanda);

                    let id_risposta_prev = null;
                    if(initialCheck) {
                        const destEl = this.data[destElIndex];
                        if(destEl.type === 'radiobutton' || destEl.type === 'combobox') {
                            id_risposta_prev = destEl.risposte_previste_options?.find((x: any) => x.chosen === true)?.id_risposta_prev ?? null;
                        }
                        else if(destEl.type === 'checkboxgroup') {
                            id_risposta_prev = destEl.risposte_previste_options?.filter((x: any) => x.chosen === true)?.map(x => x.id_risposta_prev) ?? null                                
                        }
                        else if(destEl.type === 'text') {
                            id_risposta_prev = destEl.risposta_text;
                        }
                        else if(destEl.type === 'date') {
                            id_risposta_prev = destEl.risposta_data;
                        }
                        else if(destEl.type === 'number') {
                            id_risposta_prev = destEl.risposta_num;
                        }
                    }
                    else {
                        const targetForm: UntypedFormGroup = _this.getTargetFormByOrdinamento(_this.data[destElIndex].ordinamento);

                        let values = _this._formsService.processFormValues(targetForm.value);
                        id_risposta_prev = values.risposte_previste;
                    }

                    if(c.condition === "equal") {
                        if(id_risposta_prev !== c.id_risposta_prev) {
                            isHidden = true;
                        }
                    }
                    else if(c.condition === "notEqual") {
                        if(id_risposta_prev === c.id_risposta_prev) {
                            isHidden = true;
                        }
                    }
                    else if(c.condition === "greaterThan") {
                        if(id_risposta_prev <= c.id_risposta_prev) {
                            isHidden = true;
                        }
                    }
                    else if(c.condition === "lessThan") {
                        if(id_risposta_prev >= c.id_risposta_prev) {
                            isHidden = true;
                        }
                    }
                });

                _this.data[i].isHidden = isHidden;
            }
            
            // row.id_domanda
        });
    }

    onSubmit(event: Event) {
        event.preventDefault();
    }

    trackItems(index: number, item: any) {
        return index;
    }

    async eventCallback(event: any, value: any, keyListener: string, index: number) {
        const _this = this;
        // Run query
        let chiavi = {};
        // const target_index =
        //     value.type !== "page" ? value.index : null; // null means the event comes from the full table
        // let index =
        //     target_index == null ? _this.formArray.length : 1;
        const targetViewField = _this.viewKeys[index].find(
            (viewKey) => viewKey.key === keyListener,
        );
        const targetForm: UntypedFormGroup = _this.getTargetFormByOrdinamento(_this.data[index].ordinamento);

        if (
            event.actionType === "show_message" && event.message
        ) {
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
                .then(async (result) => {
                    // Initialize with No action info
                    var actionType = event.message.actionOnNo.actionType;
                    var queryFunct = event.message.actionOnNo.queryFunct;
                    var regulatAPIParams = event.message.actionOnNo.regulatAPIParams;

                    var action = "actionNo";

                    // If user clicked yes, load yes action info
                    if (result.value === true) {
                        actionType = event.message.actionOnYes.actionType;
                        queryFunct = event.message.actionOnYes.queryFunct;
                        regulatAPIParams = event.message.actionOnYes.regulatAPIParams;
                        action = "actionYes";
                    }

                    // Let's perform Yes Action
                    if (actionType === "reload") {
                        _this.reload();
                        // Reload screen
                        if (event.outputEventWhenComplete === "triggerReload") {
                            // Reload
                            _this.reload();
                        }
                    }
                    // else if (action === "update_time_tracker") {
                    //     //_this._timeTrackerService.isTrStarted = !_this._timeTrackerService.isTrStarted;
                    //     // = true;
                    //     _this._timeTrackerService.checkStatus();
                    // }
                    else if (actionType === "email") {
                            let formValues = targetForm.value;
                            _this._emailService.performSendEmail(event, formValues, value, _this.domandaKeys[index]);

                        // _this._console.log(JSON.stringify(event));
                        // _this.sendEmail({ templateKey: 'test' });
                    }
                    else if (actionType === "regulat_api") {
                        const keys = {
                            codiceAziendaAML: _this.domandeRisposteParams.keys.codice_azienda,
                            idAnagraficaAML: _this.domandaKeys[index].id_anagrafica,
                            idSomministrazioneAML: _this.domandaKeys[index].id_somministrazione,
                            dynamoUserAML: _this.authService.userinfo.value.username,
                            isLightScan: regulatAPIParams.entityParams.is_light_scan,
                        }


                        let formValues = targetForm.value;

                        await _this._formsService.runRegulatEvent(
                            event.message.actionOnYes,
                            value,
                            keyListener,
                            formValues,
                            keys
                        );
                        _this.reload();
                    }
                    // } else if (actionType === "user_api") {
                    //     _this.runUserManagementEvent(event, value, keyListener);
                    // }
                    else if (actionType === "query"){
                            chiavi = {...targetForm.value, ...this.domandaKeys[index], ..._this.externalKeys};
                            // fix problem with changed value that might be not updated yet by getting it directly from event
                            if (value.type === "change") {
                                chiavi[value.origin] = value.data;
                            }
                            // process values
                            chiavi = _this._formsService.processFormValues(chiavi);

                            const subscription = _this.backendService
                                .postEvent(
                                    _this.domandeRisposteParams.entryName,
                                    _this.authService.getCurrentCompany(this.domandaKeys[index]),
                                    {
                                        ...this.domandaKeys[index],
                                        ..._this.externalKeys,
                                    },
                                    keyListener,
                                    chiavi,
                                    event.eventName,
                                    action,
                                    true,
                                )
                                .subscribe((result) => {
                                    if(result) {
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
                                            if (event.outputEventWhenComplete === "triggerReload") {
                                                // Reload
                                                _this.reload();
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
                                    }
                                    else {
                                        _this._toastService.showErrorToast("Error");
                                    }
                                }, (error) => {
                                    _this._toastService.showErrorToast(error);
                                });

                            // _this.generalSubscriptions.push(subscription);

                    }
                    else {
                        //Skip
                    }
                });
        }
        else if(event.actionType === "query") {
            let chiavi = {};
            // const target_index = value.type !== "page" ? value.index : null; // null means the event comes from the full table
            // let index = target_index == null ? _this.formArray.length : 1;
            const targetViewField = _this.viewKeys[index].find(
                (viewKey) => viewKey.key === keyListener,
            );
            const childrenArray = _this.formArray.toArray();
            // iterate over all indexes when full table or instead affect the target index only
            while (index > 0) {
                // index--;
                // const current_index =
                //     target_index != null ? target_index : index;
                const current_line = childrenArray[index];

                if (current_line == null) {
                    continue;
                }
                chiavi = {...current_line.form.value, ...this.domandaKeys[index], ..._this.externalKeys};
                // fix problem with changed value that might be not updated yet by getting it directly from event
                if (value.type === "change") {
                    chiavi[value.origin] = value.data;
                }
                // process values
                chiavi = _this._formsService.processFormValues(chiavi);

                if (value.showEventProcessing === true) {
                    _this._dialogService.showLoadingDialog(
                        "Processing",
                        "Please wait...",
                    );
                }

                const subscription = _this.backendService
                    .postEvent(
                        _this.formParams[index].entryName,
                        _this.authService.getCurrentCompany(this.domandaKeys[index]),
                        { ..._this.domandaKeys[index], ..._this.externalKeys },
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
                                                    _this.formData[
                                                        index //current_index
                                                    ],
                                                    k,
                                                );
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
                                }
                                // Close processing dialog
                                _this._dialogService.closeDialog();
                                if (event.outputEventWhenComplete != null) {
                                    alert('outputEventWhenComplete');
                                    // Close processing dialog
                                    _this._dialogService.closeDialog();
                                    // _this.pubSubService.publishEvent(
                                    //     event.outputEventWhenComplete,
                                    //     value,
                                    // );
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
                    // subscription.unsubscribe();
            }
            /* if (event.outputEventWhenComplete != null) {
                _this.pubSubService.publishEvent(event.outputEventWhenComplete, value);
            } */
        }
        else if(event.actionType === "dialog") {
            // let chiavi = {};
            // const target_index = value.type !== "page" ? value.index : null; // null means the event comes from the full table
            // let index = target_index == null ? _this.formArray.length : 1;
            // index--;
            let data = { ...event, keys: {} };
            _this.viewKeys[index].filter((x) => x.isPrimary).forEach((viewKey: FormViewKey) => {
                data.keys[viewKey.key] = value.valueSet[viewKey.key];
            });
            data.keys = { ...data.keys, ..._this.domandaKeys[index], ..._this.externalKeys };
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

                    // Reload data
                    _this.reload();
                },
                (error: any) => {
                    dialogRefSub.unsubscribe();
                },
            );
        }
    }


    saveChanges() {
        const _this = this;
        _this.formArray.forEach(domandaRisposta => {
            console.log(domandaRisposta.form.value);
        });
    }

    reload() {
        this.loadData();
    }

    updateRispostPreviste(event: any, field: FieldConfig, index: number) {
        if(this.data[index].type === 'radiobutton' || this.data[index].type === 'combobox') {
            const newAnswer = this.data[index].risposte_previste_options.find(x => x.id_risposta_prev === event.value.id);
            const newPeso = newAnswer.peso_ans;
            this.data[index].peso = newPeso;
            this.formData[index].forEach((x, i) => {
                if(x.name === 'peso') {
                    this.formData[index][i].value = '' + newPeso;
                    this.formData[index][i].style = {
                        background_color: newAnswer.background_color_ans,
                        font_color: newAnswer.font_color_ans,
                    };
                }
            });
        }
        else if(this.data[index].type === 'checkboxgroup') {
            const newAnswers = this.data[index].risposte_previste_options.filter(x => event.value.id.includes(x.id_risposta_prev)).map(x => x.peso_ans);
            const newPeso = newAnswers.reduce((a, b) => a + b, 0);
            this.data[index].peso = newPeso;
            this.formData[index].forEach((x, i) => {
                if(x.name === 'peso') {
                    this.formData[index][i].value = '' + newPeso;
                }
            });
        }

        this.updateDomandaRisposta(index);
    }

    updateNoteRisposta(index: number) {
        this.updateDomandaRisposta(index);
    }

    updateDomandaRisposta(index: number) {
        const _this = this;
        const type = _this.data[index].type;

        const targetForm: UntypedFormGroup = _this.getTargetFormByOrdinamento(_this.data[index].ordinamento);

        let values = _this._formsService.processFormValues(targetForm.value);
        var data = {
            type: type
        };

        if(type === 'radiobutton' || type === 'combobox') {
            data["id_risposta_prev"] = values.risposte_previste ?? null;
            data["noterispostarisposta"] = _this.encodeNotes(values.note_risposta);
        }
        else if(type === 'checkboxgroup') {
            data["risposta_multipla"] = values.risposte_previste ?? null;
            data["noterispostarisposta"] = _this.encodeNotes(values.note_risposta);
        }
        else if(type === 'text') {
            data["peso_ans"] = values.peso ?? "";
            data["noterispostarisposta"] = _this.encodeNotes(values.note_risposta);
        }
        else if(type === 'date') {
            data["risposta_data"] = values.risposte_previste ?? null;
            data["peso_ans"] = values.peso ?? "";
            data["noterispostarisposta"] = _this.encodeNotes(values.note_risposta);
        }
        else if(type === 'number') {
            data["risposta_num"] = values.risposte_previste ?? null;
            data["peso_ans"] = values.peso ?? "";
            data["noterispostarisposta"] = _this.encodeNotes(values.note_risposta);
        }


        _this.backendService.updateDomandeRisposte(_this.data[index].keys.codice_azienda, _this.domandeRisposteParams.entryName, _this.data[index].keys, data).subscribe(
            result => {
                if(result.result == "OK") {
                    _this._toastService.showInfoToast('Saved!');
                    _this.processConditions(false);
                }
                else {
                    _this._toastService.showErrorToastWithReason(result.reason);
                }
            },
            error => {
                _this._toastService.showErrorToast('An error occured!', error);
            }
        )
    }

    resetRispostaPrevista(item: any, field: FieldConfig, index: number) {
        const _this = this;
        if(_this.data[index].type === 'radiobutton' || _this.data[index].type === 'combobox') {
            
            const targetForm: UntypedFormGroup = _this.getTargetFormByOrdinamento(_this.data[index].ordinamento);

            targetForm.patchValue({risposte_previste: null});
            const newPeso = null;
            _this.data[index].peso = newPeso;
            _this.formData[index].forEach((x, i) => {
                if(x.name === 'peso') {
                    _this.formData[index][i].value = '' + newPeso;
                    _this.formData[index][i].style = {
                        background_color: null,
                        font_color: null,
                    };
                }
            });
        }

        _this.updateDomandaRisposta(index);
    }

    creaSegnalazione(item: any, field: FieldConfig, index: number) {
        this.eventCallback({
            actionType: "dialog",
            condition: "none",
            customDialogEntryName: "dialog_crea_compito_from_domande",
            customDialogTitle: "Crea segnalazione",
            eventName: "crea_segnalazione",
            outputEventWhenComplete: "triggerReload",
            values: []
        }, {
            showEventProcessing: true,
            origin: field.name,
            index: field.index,
            valueSet: field.fullValueSet,
            data: item.label,
            type: "menu",
        }, field.name,
        index);
    }

    associaCompito(item: any, field: FieldConfig, index: number) {
        this.eventCallback({
            actionType: "dialog",
            condition: "none",
            customDialogEntryName: "dialog_associa_compito_from_domande",
            customDialogTitle: "Associa compito",
            eventName: "associa_compito",
            outputEventWhenComplete: "triggerReload",
            values: []
        }, {
            showEventProcessing: true,
            origin: field.name,
            index: field.index,
            valueSet: field.fullValueSet,
            data: item.label,
            type: "menu",
        }, field.name,
        index);
    }

    answerCopy(item: any, field: FieldConfig, index: number) {
        this.eventCallback({
            actionType: "show_message",
            condition: "none",
            eventName: "answer_copy",
            message: {
                actionOnNo: {
                    actionType: "skip",
                    queryFunct: "select 1"
                },
                actionOnYes: {
                    actionType: "query",
                    queryFunct: "select entrasp.accoda_risposte_somministrazione(snd.codice_azienda, snd.id_modello_test, snd.id_modello_test_vr, ss.id_sondaggio, ss.id_somministrazione, $id_somministrazione$, $id_domanda$, false) from entrasp.sondaggi_somministrati ss inner join entrasp.sondaggi snd on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio=snd.id_sondaggio where snd.codice_azienda=$codice_azienda$ and snd.id_sondaggio=$id_sondaggio$ and ss.id_somministrazione!=$id_somministrazione$"
                },
                messageText: "Copiare questa risposta su tutte le verifiche (somministrazioni) del sondaggio?"
            },
            successMessage: "Risposte copiate correttamente",
            values: []
        }, {
            showEventProcessing: true,
            origin: field.name,
            index: field.index,
            valueSet: field.fullValueSet,
            data: item.label,
            type: "menu",
        }, field.name,
        index);
    }

    associaNote(item: any, field: FieldConfig, index: number) {
        this.eventCallback({
            actionType: "dialog",
            condition: "none",
            customDialogEntryName: "dialog_domande_associa_note",
            customDialogTitle: "Associa Nota",
            eventName: "associa_note",
            outputEventWhenComplete: "triggerReload",
            values: []
        }, {
            showEventProcessing: true,
            origin: field.name,
            index: field.index,
            valueSet: field.fullValueSet,
            data: item.label,
            type: "menu",
        }, field.name,
        index);
    }

    sendMail(field: FieldConfig, index: number) {
        this.eventCallback({
            actionType: "show_message",
            condition: "none",
            eventName: "invia_mail",
            message: {
                actionOnNo: {
                    actionType: "skip",
                    queryFunct: "select true"
                },
                actionOnYes: {
                    actionType: "email",
                    emailActionParameters: {
                        subject: "",
                        body: "",
                        bodyKeys: [],
                        ccList: [],
                        recipientKeys: [],
                        subjectKeys: []
                    }
                },
                messageText: "Inviare la mail al cliente? Si intende proseguire?",
                messageTitle: "INVIA MAIL AL CLIENTE"
            },
            values: []
        },
        {
            showEventProcessing: true,
            origin: field.name,
            index: field.index,
            valueSet: field.fullValueSet,
            data: "",
            type: "buton_click",
        }, field.name,
        index);

    }

    navigate(params: any) {
        setTimeout(() => { this.sendEvent.emit({ eventType: 'navigate', queryParams: params }); }, 50);
    }

    navigateToDomandeDettaglio(field: FieldConfig, index: number) {
        const targetEntryName = "domande_dettaglio";
        const keys = {
            codice_azienda: this.domandaKeys[index].codice_azienda,
            id_domanda: this.domandaKeys[index].id_domanda,
            id_modello_test: this.domandaKeys[index].id_modello_test,
            id_modello_test_vr: this.domandaKeys[index].id_modello_test_vr
        };

        const mergedParams = { entry: { name: targetEntryName, type: 'form' }, keys: [keys], index: 1, total: 1 };
        this.navigate(mergedParams);
    }

    navigateToCompiti(field: FieldConfig, index: number) {
        const targetEntryName = "non_conformita";
        const mergedParams = { entry: { name: targetEntryName, type: 'form' }, keys: [this.data[index].compito], index: 1, total: 1 };
        this.navigate(mergedParams);
    }

    kycDeep(field: FieldConfig, index: number) {
        this.eventCallback({
            actionType: "show_message",
            condition: "none",
            eventName: "get_aml_scan",
            message: {
                actionOnNo: {
                    actionType: "skip",
                    queryFunct: "select true"
                },
                actionOnYes: {
                    actionType: "regulat_api",
                    regulatAPIParams: {
                        actionType: "get_aml_scan",
                        entityParams: {
                            codice_azienda: "codice_azienda",
                            dynamo_user: "username",
                            id_anagrafica: "id_anagrafica",
                            id_somministrazione: "id_somministrazione",
                            is_light_scan: false
                        }
                    }
                },
                messageText: "L'avvio comporta l'addebito dei costi secondo il piano tariffario concordato. Si intende proseguire?",
                messageTitle: "SERVIZIO A PAGAMENTO: OneKYC"
            },
            values: []
        },
        {
            showEventProcessing: true,
            origin: field.name,
            index: field.index,
            valueSet: field.fullValueSet,
            data: "",
            type: "buton_click",
        }, field.name,
        index);

    }

    kycLight(field: FieldConfig, index: number) {
        this.eventCallback({
            actionType: "show_message",
            condition: "none",
            eventName: "get_light_aml_scan",
            message: {
                actionOnNo: {
                    actionType: "skip",
                    queryFunct: "select true"
                },
                actionOnYes: {
                    actionType: "regulat_api",
                    regulatAPIParams: {
                        actionType: "get_aml_scan",
                        entityParams: {
                            codice_azienda: "codice_azienda",
                            dynamo_user: "username",
                            id_anagrafica: "id_anagrafica",
                            id_somministrazione: "id_somministrazione",
                            is_light_scan: true
                        }
                    }
                },
                messageText: "L'avvio comporta l'addebito dei costi secondo il piano tariffario concordato. Si intende proseguire?",
                messageTitle: "SERVIZIO A PAGAMENTO: OneKYC"
            },
            values: []
        },
        {
            showEventProcessing: true,
            origin: field.name,
            index: field.index,
            valueSet: field.fullValueSet,
            data: "",
            type: "buton_click",
        }, field.name,
        index);
    }

    checkProvincia(field: FieldConfig, index: number) {
        this.eventCallback({
            actionType: "show_message",
            condition: "none",
            eventName: "check_provincia_event",
            message: {
                actionOnNo: {
                    actionType: "skip",
                    queryFunct: "select true"
                },
                actionOnYes: {
                    actionType: "query",
                    queryFunct: "SELECT entrasp.check_provincia($codice_azienda$,'€global_codice_part€',$id_anagrafica$, $id_somministrazione$)"
                },
                messageText: "Procedere?",
                messageTitle: "Controllo rischio relativo alla provincia di residenza"
            },
            outputEventWhenComplete: "onSaveD_R",
            values: []
        },
        {
            showEventProcessing: true,
            origin: field.name,
            index: field.index,
            valueSet: field.fullValueSet,
            data: "",
            type: "buton_click",
        }, field.name,
        index
        );
    }

    //  Funzione sostitutiva di trimEnd(), presente in JavaScript ES2019 ed oltre
    trimEndPolyfill(str: string): string {
        return str.replace(/\s+$/, '');
    }

    //  Funzione di sanitizzazione note (conversione caratteri vietati con caratteri permessi)
    encodeNotes(notes: string) {
        return (notes?.replace(/'/g, "’") + " ") 
        ?? "";
    }

    //  Funzione di sanitizzazione note (deconversione caratteri alterati con encodeNotes per usabilità utente)
    decodeNotes(notes: string) {
        return notes ? this.trimEndPolyfill(notes.replace(/’/g, "'")) : " ";

    }
    

    getTargetFormByOrdinamento(ordinamento: number) {
        const _this = this;
        let targetForm: UntypedFormGroup = null;
        _this.formArray.toArray().forEach(form => {
            if(form.form.value.ordinamento === '' + ordinamento) {
                targetForm = form.form;
            }
        });

        return targetForm;
    }

}
