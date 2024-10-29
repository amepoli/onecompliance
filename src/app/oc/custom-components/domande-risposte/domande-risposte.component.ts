import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit, ViewChild, QueryList, ViewChildren, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { FieldConfig, FormViewKey, Item, RegulatAPIParams} from "../../interfaces";
import { AuthService, BackendService, ConsoleLoggerService, DialogService, EmailService, FormsService, HelperService, ImportExportService, NavigationService, PubSubService, ReportService, TimeTrackerService, ToastService } from "../../services";
import { MatTabChangeEvent as MatTabChangeEvent } from "@angular/material/tabs";
import { UntypedFormBuilder } from "@angular/forms";
import { ComboboxComponent } from "app/oc/dynamic-forms/components/combobox/combobox.component";
import { DomandaRispostaComponent } from "./domanda-risposta/domanda-risposta.component";
import { MatDialog } from "@angular/material/dialog";
import { MenuOptionsCustomDialogComponent } from "app/oc/dialogs/menu-options-custom.dialog/menu-options-custom.dialog.component";
import { add } from "lodash";
import { memoize } from "app/oc/decorators/memoize";

export interface DomandaRispostaResponse {
    id_risposta_prev: number;
    risposta: string;
    chosen: boolean;
    ordinamento: number;
    peso_ans: number;
    background_color_ans: string;
    font_color_ans: string;
}
export interface DomandaRispostaElement {
    id_domanda: number;
    descrizione: string;
    note_domanda: string;
    condition: any,
    type: "checkboxgroup" | "radiobutton" | "combobox" | "text" | "number" | "date";
    kycDeepButton?: boolean;
    kycLightButton?: boolean;
    mailButton?: boolean;
    checkProvincia?: boolean;
    peso: number;
    background_color: string;
    font_color: string;
    risposta_data?: string;
    risposta_num?: number;
    risposta_text?: string;
    risposte_previste_options?: DomandaRispostaResponse[];
    num_allegati?: number;
    note_risposta?: string;
    compito?: object;
    keys?: object;
}

export interface DomandeRisposteParams {
    keys: any;
    entryName: string;
}

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
        entryName: "domande_risposte",
    };

    tabs: any = null;
    activeIndex = 0;
    tiles: any = [];

    entryName: string
    isQuickAdd: boolean = false;
    readOnlyPage: boolean = false;
    isReadOnly: boolean = false;
    
    isLoading: boolean = true;
    
    formParams: any[] = [];
    attributes = {};
    externalKeys = {};

    resultsDefault: DomandaRispostaElement[] = [
        {
            "id_domanda": 1,
            "descrizione": "Radio button",
            "note_domanda": "-",
            "condition": null,
            "type": "radiobutton",
            "kycDeepButton": true,
            "kycLightButton": true,
            "mailButton": false,
            "checkProvincia": false,
            "peso": 0.00,
            "background_color": null,
            "font_color": null,
            "num_allegati": 1,
            "risposta_data": null,
            "risposta_num": null,
            "note_risposta": null,
            "risposte_previste_options": [
                {
                    "id_risposta_prev": 86024,
                    "risposta": "Sì",
                    "ordinamento": 1,
                    "chosen": false,
                    "peso_ans": 0.00,
                    "background_color_ans": null,
                    "font_color_ans": null
                },
                {
                    "id_risposta_prev": 86036,
                    "risposta": "No",
                    "ordinamento": 2,
                    "chosen": true,
                    "peso_ans": 100.00,
                    "background_color_ans": null,
                    "font_color_ans": null
                },
                {
                    "id_risposta_prev": 86035,
                    "risposta": "Non applicabile",
                    "ordinamento": 3,
                    "chosen": false,
                    "peso_ans": 0.00,
                    "background_color_ans": null,
                    "font_color_ans": null
                }
            ],
            "compito": {
                "codice_azienda": "DEMO",
                "codice_compito": "198"
            },
            "keys": {
                "codice_azienda": "DEMO",
                "id_modello_test": 50,
                "id_modello_test_vr": 1,
                "id_sondaggio": 235,
                "id_somministrazione": 255,
                "id_sezione": null,
                "id_domanda": 1
            }
        },
        {
            "id_domanda": 2,
            "descrizione": "Check box",
            "note_domanda": "-",
            "condition": [
                {
                    "id_domanda": 1,
                    "id_risposta_prev": 86024,
                    "condition": "equal"
                }
            ],
            "type": "checkboxgroup",
            "kycDeepButton": false,
            "kycLightButton": false,
            "mailButton": false,
            "checkProvincia": false,
            "peso": 150.00,
            "background_color": null,
            "font_color": null,
            "num_allegati": 2,
            "risposta_data": null,
            "risposta_num": null,
            "note_risposta": null,
            "risposte_previste_options": [
                {
                    "id_risposta_prev": 86033,
                    "risposta": "Yes",
                    "ordinamento": 1,
                    "chosen": false,
                    "peso_ans": 0.00,
                    "background_color_ans": null,
                    "font_color_ans": null
                },
                {
                    "id_risposta_prev": 86034,
                    "risposta": "In progress",
                    "ordinamento": 2,
                    "chosen": true,
                    "peso_ans": 50.00,
                    "background_color_ans": null,
                    "font_color_ans": null
                },
                {
                    "id_risposta_prev": 86032,
                    "risposta": "No",
                    "ordinamento": 3,
                    "chosen": true,
                    "peso_ans": 100.00,
                    "background_color_ans": null,
                    "font_color_ans": null
                }
            ],
            "compito": null,
            "keys": {
                "codice_azienda": "DEMO",
                "id_modello_test": 50,
                "id_modello_test_vr": 1,
                "id_sondaggio": 235,
                "id_somministrazione": 255,
                "id_sezione": null,
                "id_domanda": 2
            }
        },
        {
            "id_domanda": 2,
            "descrizione": "Check box",
            "note_domanda": "-",
            "condition": [
                {
                    "id_domanda": 1,
                    "id_risposta_prev": 86024,
                    "condition": "equal"
                }
            ],
            "type": "checkboxgroup",
            "kycDeepButton": false,
            "kycLightButton": false,
            "mailButton": false,
            "checkProvincia": false,
            "peso": 150.00,
            "background_color": null,
            "font_color": null,
            "num_allegati": 0,
            "risposta_data": null,
            "risposta_num": null,
            "note_risposta": null,
            "risposte_previste_options": [
                {
                    "id_risposta_prev": 86033,
                    "risposta": "Yes",
                    "ordinamento": 1,
                    "chosen": false,
                    "peso_ans": 0.00,
                    "background_color_ans": null,
                    "font_color_ans": null
                },
                {
                    "id_risposta_prev": 86034,
                    "risposta": "In progress",
                    "ordinamento": 2,
                    "chosen": true,
                    "peso_ans": 50.00,
                    "background_color_ans": null,
                    "font_color_ans": null
                },
                {
                    "id_risposta_prev": 86032,
                    "risposta": "No",
                    "ordinamento": 3,
                    "chosen": true,
                    "peso_ans": 100.00,
                    "background_color_ans": null,
                    "font_color_ans": null
                }
            ],
            "compito": null,
            "keys": {
                "codice_azienda": "DEMO",
                "id_modello_test": 50,
                "id_modello_test_vr": 1,
                "id_sondaggio": 235,
                "id_somministrazione": 255,
                "id_sezione": null,
                "id_domanda": 2
            }
        },
        {
            "id_domanda": 5,
            "descrizione": "Combobox",
            "note_domanda": "-",
            "condition": null,
            "type": "combobox",
            "kycDeepButton": false,
            "kycLightButton": false,
            "mailButton": false,
            "checkProvincia": false,
            "peso": null,
            "background_color": null,
            "font_color": null,
            "num_allegati": 0,
            "risposta_data": null,
            "risposta_num": null,
            "note_risposta": null,
            "risposte_previste_options": [
                {
                    "id_risposta_prev": 86033,
                    "risposta": "Yes",
                    "ordinamento": 1,
                    "chosen": false,
                    "peso_ans": 0.00,
                    "background_color_ans": null,
                    "font_color_ans": null
                },
                {
                    "id_risposta_prev": 86034,
                    "risposta": "In progress",
                    "ordinamento": 2,
                    "chosen": true,
                    "peso_ans": 50.00,
                    "background_color_ans": null,
                    "font_color_ans": null
                },
                {
                    "id_risposta_prev": 86032,
                    "risposta": "No",
                    "ordinamento": 3,
                    "chosen": false,
                    "peso_ans": 100.00,
                    "background_color_ans": null,
                    "font_color_ans": null
                }
            ],
            "compito": null,
            "keys": {
                "codice_azienda": "DEMO",
                "id_modello_test": 50,
                "id_modello_test_vr": 1,
                "id_sondaggio": 235,
                "id_somministrazione": 255,
                "id_sezione": null,
                "id_domanda": 5
            }
        },
        {
            "id_domanda": 3,
            "descrizione": "Date answer",
            "note_domanda": "-",
            "condition": null,
            "type": "date",
            "kycDeepButton": false,
            "kycLightButton": false,
            "mailButton": false,
            "checkProvincia": false,
            "peso": 3,
            "background_color": null,
            "font_color": null,
            "num_allegati": 0,
            "risposta_data": "2020-02-03",
            "risposta_num": null,
            "note_risposta": null,
            "risposte_previste_options": null,
            "compito": null,
            "keys": {
                "codice_azienda": "DEMO",
                "id_modello_test": 50,
                "id_modello_test_vr": 1,
                "id_sondaggio": 235,
                "id_somministrazione": 255,
                "id_sezione": null,
                "id_domanda": 3
            }
        },
        {
            "id_domanda": 4,
            "descrizione": "Risposta number",
            "note_domanda": "-",
            "condition": null,
            "type": "number",
            "kycDeepButton": false,
            "kycLightButton": false,
            "mailButton": false,
            "checkProvincia": false,
            "peso": 1,
            "background_color": null,
            "font_color": null,
            "num_allegati": 0,
            "risposta_data": null,
            "risposta_num": null,
            "note_risposta": null,
            "risposte_previste_options": null,
            "compito": null,
            "keys": {
                "codice_azienda": "DEMO",
                "id_modello_test": 50,
                "id_modello_test_vr": 1,
                "id_sondaggio": 235,
                "id_somministrazione": 255,
                "id_sezione": null,
                "id_domanda": 4
            }
        },
        {
            "id_domanda": 6,
            "descrizione": "Open answer",
            "note_domanda": "-",
            "condition": null,
            "type": "text",
            "kycDeepButton": false,
            "kycLightButton": false,
            "mailButton": false,
            "checkProvincia": false,
            "peso": 2,
            "background_color": null,
            "font_color": null,
            "num_allegati": 0,
            "risposta_data": null,
            "risposta_num": null,
            "risposta_text": "Text response",
            "note_risposta": null,
            "risposte_previste_options": null,
            "compito": null,
            "keys": {
                "codice_azienda": "DEMO",
                "id_modello_test": 50,
                "id_modello_test_vr": 1,
                "id_sondaggio": 235,
                "id_somministrazione": 255,
                "id_sezione": null,
                "id_domanda": 6
            }
        }
    ];
    
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
        // this.loadData();
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
                _this.data = results;
                _this.prepareData(results);
            }
            subscription.unsubscribe();
            _this.isLoading = false;
        }, error => {
            subscription.unsubscribe();
            _this.isLoading = false;
        });
    }

    prepareData(results: DomandaRispostaElement[]) {
        const _this = this;
        _this.prepareFormParams(results);
        _this.domandaKeys = results.map(x => x.keys);
        _this.viewKeys = results.map((x, i) => _this.prepareView(x, i));

        for(let i = 0; i < results.length; i++) {
            const curFormData = _this._formsService.getFormData(_this.viewKeys[i], [results[i]], _this.attributes, _this.formParams[i], results[i].keys, _this.isReadOnly)[0].map(x => (x.type === "combobox") ? {...x, value: null}: x);
            
            curFormData.forEach((_, j) => {
                switch(curFormData[j].name) {
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
                    case 'risposte_previste':
                        if(curFormData[j].type === 'radiobutton') {
                            curFormData[j].onClick = (event: any, field: FieldConfig) => _this.updateRispostaPrevista(event, field, i);
                        }
                        break;
                    default: return;
                }
            })

            _this.formData = [..._this.formData, curFormData];
            _this.addOptionsAndValue(_this.formData[i], results[i]);
        }
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
                "format": {
                    "dataType": "number",
                    "viewType": "input"
                },
                "isHidden": false,
                "isVisible": true,
                "isPrimary": false,
                "key": "id_domanda",
                "label": "N.",
                "newLine": false,
                "readOnly": true,
                "size": 1,
                "style": {
                    "font_color": "black",
                    "font_weight": "600"
                },
                "translate": "RESOURCES.n_domande_risposte"
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
                isVisible: true,
                newLine: false,
                readOnly: true,
                size: 5.55,
                textareaHeight: "S",
                translate: "RESOURCES.domanda_domande_risposte",
            },
            {
                "autoGenerate": false,
                "buttonIcon": "more_vert",
                "format": {
                    "menuOptions": [
                        // {
                        //     "icon": "report_problem",
                        //     "label": "Crea Segnalazione",
                        //     "outputEventName": "risposte_update_insert_on_create",
                        //     "onClick": () => {_this.creaSegnalazione()},
                        //     "translate": "RESOURCES.crea_segnalazione_domande_risposte"
                        // },
                        // {
                        //     "icon": "launch",
                        //     "label": "Vai a segnalazione",
                        //     "outputEventName": "segnalazione_navigate",
                        //     "translate": "RESOURCES.vai_a_segnalazione_domande_risposte"
                        // },
                        // {
                        //     "icon": "close",
                        //     "label": "Dissocia Segnalazione",
                        //     "outputEventName": "dissocia_segnalazione",
                        //     "translate": "RESOURCES.dissocia_segnalazione_domande_risposte"
                        // },
                        // {
                        //     "icon": "delete",
                        //     "label": "Cancella risposta",
                        //     "outputEventName": "delete_risposta",
                        //     "translate": "RESOURCES.cancella_risposta_domande_risposte"
                        // },
                        {
                            "icon": "content_copy",
                            "label": "Copia questa risp. sulle verifiche (somministrazioni) del sondaggio",
                            "outputEventName": "answer_copy",
                            "onClick": (item: any, field: FieldConfig) => {_this.answerCopy(item, field, index)},
                            "translate": "RESOURCES.copia_questa_risp_sulle_verifiche_somministrazioni_del_sondaggio_domande_risposte"
                        },
                        {
                            "icon": "link",
                            "label": "Seleziona note",
                            "outputEventName": "associa_note",
                            onClick: (item: any, field: FieldConfig) => {_this.associaNote(item, field, index)},
                            "translate": "RESOURCES.seleziona_note_domande_risposte"
                        }
                    ],
                    "viewType": "menu"
                },
                "inputEvents": [
                    {
                        "actionType": "show_message",
                        "condition": "none",
                        "eventName": "delete_risposta",
                        "message": {
                            "actionOnNo": {
                                "actionType": "skip",
                                "queryFunct": "select 1"
                            },
                            "actionOnYes": {
                                "actionType": "query",
                                "queryFunct": "SELECT entrasp.delete_risposta( $codice_azienda$,$id_domanda$,$id_modello_test$,$id_modello_test_vr$,$id_sondaggio$,$id_somministrazione$, $id_sezione$)"
                            },
                            "messageText": "Cancellare definitivamente la risposta?"
                        },
                        "outputEventWhenComplete": "triggerReload",
                        "successMessage": "Risposta cancellata correttamente",
                        "values": []
                    },
                    {
                        "actionType": "show_message",
                        "condition": "none",
                        "eventName": "dissocia_segnalazione",
                        "message": {
                            "actionOnNo": {
                                "actionType": "skip",
                                "queryFunct": "select 1"
                            },
                            "actionOnYes": {
                                "actionType": "query",
                                "queryFunct": "delete from entrasp.compiti_rif_bo where codice_azienda='£codice_azienda£' and codice_compito='£codice_compito£' and id_domanda=£id_domanda£ and object_name='riepilogoRisposte' and id_somministrazione=$id_somministrazione$"
                            },
                            "messageText": "Dissociare la segnalazione dalla domanda?"
                        },
                        "outputEventWhenComplete": "triggerReload",
                        "successMessage": "Segnalazione dissociata correttamente",
                        "values": []
                    },
                    {
                        "actionType": "show_message",
                        "condition": "none",
                        "eventName": "answer_copy",
                        "message": {
                            "actionOnNo": {
                                "actionType": "skip",
                                "queryFunct": "select 1"
                            },
                            "actionOnYes": {
                                "actionType": "query",
                                "queryFunct": "select entrasp.accoda_risposte_somministrazione(snd.codice_azienda, snd.id_modello_test, snd.id_modello_test_vr, ss.id_sondaggio, ss.id_somministrazione, $id_somministrazione$, $id_domanda$, false) from entrasp.sondaggi_somministrati ss inner join entrasp.sondaggi snd on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio=snd.id_sondaggio where snd.codice_azienda=$codice_azienda$ and snd.id_sondaggio=$id_sondaggio$ and ss.id_somministrazione!=$id_somministrazione$"
                            },
                            "messageText": "Copiare questa risposta su tutte le verifiche (somministrazioni) del sondaggio?"
                        },
                        "successMessage": "Risposte copiate correttamente",
                        "values": []
                    },
                    {
                        "actionType": "dialog",
                        "condition": "none",
                        "customDialogEntryName": "dialog_domande_associa_note",
                        "customDialogTitle": "Associa Nota",
                        "eventName": "associa_note",
                        "outputEventWhenComplete": "triggerReload",
                        "values": []
                    }
                ],
                "isHidden": false,
                "isVisible": true,
                "isPrimary": false,
                "key": "domande_actions",
                "label": "",
                "newLine": false,
                "readOnly": false,
                "sameOrigin": false,
                "size": 0.6
            },
            {
                "autoGenerate": false,
                "format": {
                    "viewType": "widget",
                    "widgetType": "multi-attachments"
                },
                "isHidden": false,
                "isVisible": true,
                "isPrimary": false,
                "key": "num_allegati",
                "label": "All.",
                "newLine": true,
                "readOnly": true,
                "size": 0.75
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
                isVisible: true,
                newLine: true,
                readOnly: true,
                size: 10,
                style: {
                    font_color: "black",
                    font_style: "italic",
                    font_weight: "500",
                },
                textareaHeight: "S",
                translate:
                    "RESOURCES.annotazioni_esplicative_domanda_domande_risposte",
            },
        ];

        viewKeys.push({
            "format": {
                "dataType": "text",
                "value": null,
                "viewType": "label"
            },
            "isHidden": false,
            "isVisible": true,
            "isPrimary": false,
            "key": "risposta",
            "label": "Risposta",
            "newLine": false,
            "readOnly": true,
            "sameOrigin": false,
            "size": 9,
            "style": {
                "background_color": "#03a9f4",
                "font_color": "white",
                "font_size": "1.3em",
                "font_style": "italic",
                "font_weight": "400"
            },
            "translate": "RESOURCES.risposta_domande_risposte"
        });


        viewKeys.push({
            "format": {
                "viewType": "invisible"
            },
            "isVisible": true,
            "isHidden": false,
            "isPrimary": false,
            "key": "no_new_line",
            "label": "no_new_line",
            "newLine": false,
            "readOnly": true,
            "sameOrigin": false,
            "size": 3,
            "translate": "RESOURCES.no_new_line_domande_risposte"
        });

        var addInvisible = false;

        if(result.kycDeepButton) {
            viewKeys.push({
                "buttonIcon": "person_search",
                "format": {
                    "viewType": "button"
                },
                "isHidden": false,
                "isVisible": true,
                "isPrimary": false,
                "key": "kyc_deep",
                "label": "OneKYC - Deep",
                "newLine": false,
                "outputEvent": {
                    "eventName": "get_aml_scan",
                    "eventTrigger": "press"
                },
                "readOnly": false,
                "sameOrigin": false,
                "size": 2,
                "style": {
                    "background_color": "firebrick",
                    "font_color": "white"
                },
                "tooltip": "Controllo OneKYC approfondito",
                "translate": "RESOURCES.onekyc__deep_domande_risposte",
                // "onClick": (field: FieldConfig) => {_this.kycDeep(field)},
            });
            addInvisible = true;
        };
        
        if(result.mailButton) {
            viewKeys.push({
                "buttonIcon": "mail",
                "format": {
                    "viewType": "button"
                },
                "isHidden": false,
                "isVisible": true,
                "isPrimary": false,
                "key": "send_mail",
                "label": "Invia mail",
                "newLine": false,
                "outputEvent": {
                    "eventName": "invia_mail",
                    "eventTrigger": "press"
                },
                "readOnly": false,
                "sameOrigin": false,
                "size": 2,
                "style": {
                    "background_color": "firebrick",
                    "font_color": "white"
                },
                "tooltip": "Invia mail",
                "translate": "RESOURCES.invia_mail_domande_risposte",
                // "onClick": (field: FieldConfig) => {_this.sendMail(field)},             
            });
            addInvisible = true;
        }
        
        if(result.kycLightButton) {
            viewKeys.push(
                {
                    "buttonIcon": "person_search",
                    "format": {
                        "viewType": "button"
                    },
                    "isHidden": false,
                    "isVisible": true,
                    "isPrimary": false,
                    "key": "kyc_light",
                    "label": "OneKYC - Light",
                    "newLine": false,
                    "outputEvent": {
                        "eventName": "get_light_aml_scan",
                        "eventTrigger": "press"
                    },
                    "readOnly": false,
                    "sameOrigin": false,
                    "size": 2,
                    "tooltip": "Controllo OneKYC limitato alle liste anti-terrorismo",
                    "translate": "RESOURCES.onekyc__light_domande_risposte",
                    // "onClick": (field: FieldConfig) => {_this.kycLight(field)},
                }
            );
            addInvisible = true;
        }

        if(result.checkProvincia) {
            viewKeys.push({
                "buttonIcon": "person_search",
                "format": {
                    "viewType": "button"
                },
                "isHidden": false,
                "isVisible": true,
                "isPrimary": false,
                "key": "check_provincia",
                "label": "Check provincia",
                "newLine": false,
                "outputEvent": {
                    "eventName": "check_provincia_event",
                    "eventTrigger": "press"
                },
                "readOnly": false,
                "sameOrigin": false,
                "size": 2,
                "style": {
                    "background_color": "royalblue",
                    "font_color": "white"
                },
                "tooltip": "Check provincia",
                "translate": "RESOURCES.check_provincia_domande_risposte",
                // "onClick": (field: FieldConfig) => {_this.checkProvincia(field)},
            });
            addInvisible = true;
        }

        if(addInvisible && !addInvisible){
            viewKeys.push(
                {
                    "format": {
                        "viewType": "invisible"
                    },
                    "isHidden": false,
                    "isVisible": true,
                    "isPrimary": false,
                    "key": "new_line",
                    "label": "new_line",
                    "newLine": true,
                    "readOnly": true,
                    "sameOrigin": false,
                    "size": 3,
                    "translate": "RESOURCES.new_line_domande_risposte"
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
                    isVisible: true,
                    newLine: false,
                    readOnly: false,
                    size: 8.5,
                    translate: "RESOURCES.risposta_domande_risposte",
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
                    newLine: false,
                    readOnly: true,
                    size: 1,
                    translate: "RESOURCES.risultato__domande_risposte"
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
                    isVisible: true,
                    newLine: false,
                    readOnly: false,
                    size: 8.5,
                    translate: "RESOURCES.risposta_domande_risposte",
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
                    newLine: false,
                    readOnly: true,
                    size: 1,
                    translate: "RESOURCES.risultato__domande_risposte"
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
                    isVisible: true,
                    newLine: false,
                    readOnly: false,
                    size: 8.5,
                    translate: "RESOURCES.risposta_domande_risposte",
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
                    newLine: false,
                    readOnly: true,
                    size: 1,
                    translate: "RESOURCES.risultato__domande_risposte"
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
                    isVisible: true,
                    newLine: false,
                    readOnly: false,
                    size: 1,
                    translate: "RESOURCES.risposta_domande_risposte",
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
                    newLine: false,
                    readOnly: false,
                    size: 1,
                    translate: "RESOURCES.risultato__domande_risposte"
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
                    isVisible: true,
                    newLine: false,
                    readOnly: false,
                    size: 1,
                    translate: "RESOURCES.risposta_domande_risposte",
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
                    newLine: false,
                    readOnly: false,
                    size: 1,
                    translate: "RESOURCES.risultato__domande_risposte"
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
                    newLine: false,
                    readOnly: false,
                    size: 1,
                    translate: "RESOURCES.risultato__domande_risposte"
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
                isVisible: true,
                newLine: true,
                readOnly: true,
                size: 10,
                style: {
                    font_color: "black",
                    font_style: "italic",
                    font_weight: "500",
                },
                textareaHeight: "S",
                translate: "RESOURCES.note",
            }
        ];
        return viewKeys;
    }

    addOptionsAndValue(formData: FieldConfig[], result: DomandaRispostaElement){
        if(result.type === "radiobutton") {
            let options: Item[] = [];
            let value = null;

            if(result["risposte_previste_options"]) {
                options = result["risposte_previste_options"].sort(x => x.ordinamento).map(x => { return { id: x.id_risposta_prev, name: x.risposta } });
                let valueIndex = result["risposte_previste_options"].findIndex((x: any) => x.chosen === true)
                if(valueIndex  > -1) {
                    value = result["risposte_previste_options"][valueIndex].id_risposta_prev;
                }

                formData.forEach((_, i) => {
                    if(formData[i].name === 'risposte_previste') {
                        formData[i].options = options;
                        formData[i].value = value;
                    }
                    if(formData[i].name === 'peso' && value) {
                        formData[i].value = result["risposte_previste_options"].find((x: any) => x.id_risposta_prev == value).peso_ans;
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

            if(result["risposte_previste_options"]) {
                options = result["risposte_previste_options"].sort(x => x.ordinamento).map(x => { return { id: x.id_risposta_prev, name: x.risposta } });
                value = result["risposte_previste_options"].filter((x: any) => x.chosen === true)?.map(x => x.id_risposta_prev) ?? null;
                checkboxGroupItemsStyle = result["risposte_previste_options"].map(x => {
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
                        if(value) {
                            formData[i].value = result["risposte_previste_options"].filter((x: any) => value.includes(x.id_risposta_prev)).map(x => x.peso_ans).reduce((a, b) => a + b);
                        }
                        formData[i].style = {};
                        if(result.background_color) {
                            formData[i].style = {...formData[i].style, background_color: result.background_color};
                        }
                        if(result.font_color) {
                            formData[i].style = {...formData[i].style, font_color: result.font_color};
                        }
                    }
                })
            }
        }
        else if(result.type === "combobox") {
            let options: Item[] = [];
            let value = null;

            if(result["risposte_previste_options"]) {
                options = result["risposte_previste_options"].sort(x => x.ordinamento).map(x => { return { id: x.id_risposta_prev, name: x.risposta } });
                let valueIndex = result["risposte_previste_options"].findIndex((x: any) => x.chosen === true)
                if(valueIndex > -1) {
                    value = result["risposte_previste_options"][valueIndex].id_risposta_prev;
                }

                formData.forEach((_, i) => {
                    if(formData[i].name === 'risposte_previste') {
                        formData[i].options = options;
                        formData[i].value = value;
                    }
                    if(formData[i].name === 'peso' && value) {
                        formData[i].value = result["risposte_previste_options"].find((x: any) => x.id_risposta_prev == value).peso_ans;
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
        const childrenArray = _this.formArray.toArray();
        
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
                    var action = "actionNo";

                    // If user clicked yes, load yes action info
                    if (result.value === true) {
                        actionType = event.message.actionOnYes.actionType;
                        queryFunct = event.message.actionOnYes.queryFunct;
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
                        // iterate over all indexes when full table or instead affect the target index only
                            // some lines might be hidden, search for the right one
                            const current_line = childrenArray.find(
                                (c) => c.fields[0].index === index,
                            );
                            let formValues = current_line.form.value;
                            _this._emailService.performSendEmail(event, formValues, value, _this.domandaKeys[index-1]);
                        
                        // _this._console.log(JSON.stringify(event));
                        // _this.sendEmail({ templateKey: 'test' });
                    } 
                    else if (actionType === "regulat_api") {
                        const keys = {
                            codiceAziendaAML: _this.domandeRisposteParams.keys.codice_azienda,
                            idAnagraficaAML: _this.domandaKeys[index].id_anagrafica,
                            idSomministrazioneAML: _this.domandaKeys[index].id_somministrazione,
                            dynamoUserAML: _this.authService.userinfo.value.username,
                            isLightScan: event.regulatAPIParams.entityParams.is_light_scan,
                        }

                        await _this._formsService.runRegulatEvent(
                            event.message.actionOnYes,
                            value,
                            keyListener,
                            _this.formArray[index].form.value,
                            keys
                        );
                        _this.reload();
                    }
                    // } else if (actionType === "user_api") {
                    //     _this.runUserManagementEvent(event, value, keyListener);
                    // } 
                    else {
                        // iterate over all indexes when full table or instead affect the target index only
                            // some lines might be hidden, search for the right one
                            const current_line = childrenArray.find(
                                (c) => c.fields[0].index === index,
                            );
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
                });
        }
        else if(event.actionType === "query") {
            let chiavi = {};
            const target_index = value.type !== "page" ? value.index : null; // null means the event comes from the full table
            let index = target_index == null ? _this.formArray.length : 1;
            const targetViewField = _this.viewKeys[index-1].find(
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
            let chiavi = {};
            const target_index = value.type !== "page" ? value.index : null; // null means the event comes from the full table
            let index = target_index == null ? _this.formArray.length : 1;
            index--;
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

                    // if (event.outputEventWhenComplete != null) {
                    //     _this.pubSubService.publishEvent(
                    //         event.outputEventWhenComplete,
                    //         value,
                    //     );
                    // }
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

    updateRispostaPrevista(event: any, field: FieldConfig, index: number) {
        if(field.type === 'radiobutton') {
            const newAnswer = this.data[index].risposte_previste_options.find(x => x.id_risposta_prev === event.value.id);
            const newPeso = newAnswer.peso_ans;
            this.data[index].peso = newPeso;
            // this.prepareData(this.data);
            this.formData[index].forEach((x, i) => {
                if(x.name === 'peso') {
                    this.formData[index][i].value = newPeso;
                    this.formData[index][i].style = {
                        background_color: newAnswer.background_color_ans,
                        font_color: newAnswer.font_color_ans,
                    };
                }
            });
            // console.log(field);
        }
        else if(field.type === 'checkboxgroup') {
            /// TODO:
        }
        else if(field.type === 'combobox') {
            /// TODO:
        }
    }

    creaSegnalazione() {
        alert('Yeah!');
        // Crea Segnalazione
        // Navigate
    }

    answerCopy(item: any, field: FieldConfig, index: number) {
        this.eventCallback({
            "actionType": "show_message",
            "condition": "none",
            "eventName": "answer_copy",
            "message": {
                "actionOnNo": {
                    "actionType": "skip",
                    "queryFunct": "select 1"
                },
                "actionOnYes": {
                    "actionType": "query",
                    "queryFunct": "select entrasp.accoda_risposte_somministrazione(snd.codice_azienda, snd.id_modello_test, snd.id_modello_test_vr, ss.id_sondaggio, ss.id_somministrazione, $id_somministrazione$, $id_domanda$, false) from entrasp.sondaggi_somministrati ss inner join entrasp.sondaggi snd on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio=snd.id_sondaggio where snd.codice_azienda=$codice_azienda$ and snd.id_sondaggio=$id_sondaggio$ and ss.id_somministrazione!=$id_somministrazione$"
                },
                "messageText": "Copiare questa risposta su tutte le verifiche (somministrazioni) del sondaggio?"
            },
            "successMessage": "Risposte copiate correttamente",
            "values": []
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
            "actionType": "dialog",
            "condition": "none",
            "customDialogEntryName": "dialog_domande_associa_note",
            "customDialogTitle": "Associa Nota",
            "eventName": "associa_note",
            "outputEventWhenComplete": "triggerReload",
            "values": []
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
            "actionType": "show_message",
            "condition": "none",
            "eventName": "invia_mail",
            "message": {
                "actionOnNo": {
                    "actionType": "skip",
                    "queryFunct": "select true"
                },
                "actionOnYes": {
                    "actionType": "email",
                    "emailActionParameters": {
                        "subject": "",
                        "body": "",
                        "bodyKeys": [],
                        "ccList": [],
                        "recipientKeys": [],
                        "subjectKeys": []
                    }
                },
                "messageText": "Inviare la mail al cliente? Si intende proseguire?",
                "messageTitle": "INVIA MAIL AL CLIENTE"
            },
            "values": []
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

    kycDeep(field: FieldConfig, index: number) {
        this.eventCallback({
            "actionType": "show_message",
            "condition": "none",
            "eventName": "get_aml_scan",
            "message": {
                "actionOnNo": {
                    "actionType": "skip",
                    "queryFunct": "select true"
                },
                "actionOnYes": {
                    "actionType": "regulat_api",
                    "regulatAPIParams": {
                        "actionType": "get_aml_scan",
                        "entityParams": {
                            "codice_azienda": "codice_azienda",
                            "dynamo_user": "username",
                            "id_anagrafica": "id_anagrafica",
                            "id_somministrazione": "id_somministrazione",
                            "is_light_scan": false
                        }
                    }
                },
                "messageText": "L'avvio comporta l'addebito dei costi secondo il piano tariffario concordato. Si intende proseguire?",
                "messageTitle": "SERVIZIO A PAGAMENTO: OneKYC"
            },
            "values": []
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
            "actionType": "show_message",
            "condition": "none",
            "eventName": "get_light_aml_scan",
            "message": {
                "actionOnNo": {
                    "actionType": "skip",
                    "queryFunct": "select true"
                },
                "actionOnYes": {
                    "actionType": "regulat_api",
                    "regulatAPIParams": {
                        "actionType": "get_aml_scan",
                        "entityParams": {
                            "codice_azienda": "codice_azienda",
                            "dynamo_user": "username",
                            "id_anagrafica": "id_anagrafica",
                            "id_somministrazione": "id_somministrazione",
                            "is_light_scan": true
                        }
                    }
                },
                "messageText": "L'avvio comporta l'addebito dei costi secondo il piano tariffario concordato. Si intende proseguire?",
                "messageTitle": "SERVIZIO A PAGAMENTO: OneKYC"
            },
            "values": []
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
            "actionType": "show_message",
            "condition": "none",
            "eventName": "check_provincia_event",
            "message": {
                "actionOnNo": {
                    "actionType": "skip",
                    "queryFunct": "select true"
                },
                "actionOnYes": {
                    "actionType": "query",
                    "queryFunct": "SELECT entrasp.check_provincia($codice_azienda$,'€global_codice_part€',$id_anagrafica$, $id_somministrazione$)"
                },
                "messageText": "Procedere?",
                "messageTitle": "Controllo rischio relativo alla provincia di residenza"
            },
            "outputEventWhenComplete": "onSaveD_R",
            "values": []
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


    


}
