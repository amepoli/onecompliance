import type { Meta, StoryObj } from '@storybook/angular';
import {
  argsToTemplate,
  moduleMetadata,
  applicationConfig,
} from '@storybook/angular';


import { requiredValidator } from '../helpers/validation-sb';

import { OCFormComponent } from './oc-form.component';
import { fn } from '@storybook/test';
import { DynamicFormsModule } from '../../oc/dynamic-forms/dynamic-forms.module';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DynamicFormComponent } from '../../oc/dynamic-forms/components/dynamic-form/dynamic-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { OneCompliancePipesModule } from '../../oc/pipes/pipes.module';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../oc/dynamic-forms/material.module';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, provideHttpClient } from '@angular/common/http';


const ocFormData = [
  {
    table: "progetti",
    label: "",
    translate: "RESOURCES.user_upd",
    name: "user_upd",
    type: "input",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: "mguadagnini",
    inputType: "text",
    readonly: false,
    isVisible: true,
    newLine: true,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 80,
    options: [
    ],
    menuOptions: [
    ],
    lazyLoading: false,
    validations: [
    ],
    eventName: null,
    eventTrigger: null,
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "Riapri Progetto",
    translate: "RESOURCES.reopen_progetto_k",
    name: "reopen_progetto_k",
    type: "button",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: null,
    inputType: "text",
    readonly: true,
    isVisible: true,
    newLine: false,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: {
      background_color: "#698EC2",
      font_color: "#5b635a",
    },
    width: 80,
    options: [
    ],
    menuOptions: [
    ],
    lazyLoading: false,
    validations: [
    ],
    eventName: "progetto_reopen",
    eventTrigger: "press",
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "Progetto",
    translate: "RESOURCES.project",
    name: "progettolabel",
    type: "label",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: null,
    inputType: "text",
    readonly: true,
    isVisible: true,
    newLine: false,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: {
      font_weight: "600",
      font_style: "normal",
      background_color: "transparent",
      font_color: "black",
      font_size: "1.5em",
    },
    width: 65.6,
    options: [
    ],
    menuOptions: [
    ],
    lazyLoading: false,
    validations: [
    ],
    eventName: null,
    eventTrigger: null,
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "Data ins",
    translate: "RESOURCES.data_inserimento",
    name: "data_inserimento",
    type: "input",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: "2024-07-04T00:00:00.000Z",
    inputType: "date",
    readonly: false,
    isVisible: true,
    newLine: false,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 15.599999999999998,
    options: [
    ],
    menuOptions: [
    ],
    lazyLoading: false,
    validations: [
      {
        message: "Data progetto necessari",
        name: "required",
        validator: function (control) {
          return requiredValidator(control);
        },
      },
    ],
    eventName: "data_ins_change_progetti",
    eventTrigger: "change",
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "invisible_2",
    translate: "RESOURCES.invisible_2",
    name: "invisible_2",
    type: "invisible",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: null,
    inputType: "text",
    readonly: true,
    isVisible: true,
    newLine: false,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 4,
    options: [
    ],
    menuOptions: [
    ],
    lazyLoading: false,
    validations: [
    ],
    eventName: null,
    eventTrigger: null,
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: " ",
    translate: "RESOURCES.progetti_actions",
    name: "progetti_actions",
    type: "menu",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: null,
    inputType: "text",
    readonly: false,
    isVisible: true,
    newLine: true,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: "more_vert",
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 10.800000000000011,
    options: [
    ],
    menuOptions: [
      {
        icon: "sync_alt",
        label: "Aggiorna codici",
        translate: "RESOURCES.code_update",
        key: "codici_aggiorna",
        outputEventName: "codici_aggiorna",
      },
      {
        icon: "history",
        label: "Annulla progetto",
        translate: "RESOURCES.cancel_project",
        outputEventName: "progetto_annulla",
      },
      {
        icon: "stacked_line_chart",
        label: "Modello di progetto associato",
        outputEventName: "to_attivita_associata",
      },
      {
        icon: "sync_alt",
        label: "Sync. mod. progetto associato",
        outputEventName: "sync_mod_progetto",
      },
      {
        icon: "content_copy",
        label: "Duplica",
        outputEventName: "progetto_duplica",
      },
      {
        icon: "copy_all",
        label: "Duplica (CON risposte)",
        key: "progetto_duplica_con_risposte",
        outputEventName: "progetto_duplica_con_risposte",
      },
      {
        icon: "sync_alt",
        label: "All. date e centri gest",
        key: "allinea_date",
        outputEventName: "allinea_date",
      },
      {
        icon: "sync",
        label: "Sync.doc.controparte",
        key: "get_drive_folder_contents",
        outputEventName: "get_drive_folder_contents",
      },
    ],
    lazyLoading: false,
    validations: [
    ],
    eventName: null,
    eventTrigger: null,
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "Codice",
    translate: "RESOURCES.code",
    name: "codice_progetto",
    type: "input",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: "6",
    inputType: "text",
    readonly: false,
    isVisible: true,
    newLine: false,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 7.299999999999999,
    options: [
    ],
    menuOptions: [
    ],
    lazyLoading: false,
    validations: [
      {
        message: "Necessario specificare un codice del progetto",
        name: "required",
        validator: function (control) {
          return requiredValidator(control);
        },
      },
    ],
    eventName: "codice_progetto_change",
    eventTrigger: "change",
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "# Progetto",
    translate: "RESOURCES.id_project",
    name: "id_progetto",
    type: "input",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: "12",
    inputType: "number",
    readonly: true,
    isVisible: true,
    newLine: false,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 6.3,
    options: [
    ],
    menuOptions: [
    ],
    lazyLoading: false,
    validations: [
    ],
    eventName: null,
    eventTrigger: null,
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "Vers.",
    translate: "RESOURCES.attivita_vr",
    name: "attivita_vr",
    type: "input",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: "1",
    inputType: "text",
    readonly: true,
    isVisible: true,
    newLine: false,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 5.7,
    options: [
    ],
    menuOptions: [
    ],
    lazyLoading: false,
    validations: [
    ],
    eventName: null,
    eventTrigger: null,
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "Titolo",
    translate: "RESOURCES.title",
    name: "titolo",
    type: "input",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: "Progetto di Certificazione",
    inputType: "text",
    readonly: false,
    isVisible: true,
    newLine: false,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 32.3,
    options: [
    ],
    menuOptions: [
    ],
    lazyLoading: false,
    validations: [
      {
        message: "Necessario specificare un titolo del progetto",
        name: "required",
        validator: function (control) {
          return requiredValidator(control);
        },
      },
    ],
    eventName: null,
    eventTrigger: null,
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "Stato",
    translate: "RESOURCES.status",
    name: "stato",
    type: "combobox",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: "A",
    inputType: "text",
    readonly: true,
    isVisible: true,
    newLine: false,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 15.599999999999998,
    options: [
      {
        id: "A",
        name: "Pianificato",
      },
    ],
    menuOptions: [
    ],
    lazyLoading: true,
    validations: [
      {
        message: "Stato necessario",
        name: "required",
        validator: function (control) {
          return requiredValidator(control);
        },
      },
    ],
    eventName: "codice_colore_change_stato",
    eventTrigger: "select",
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "Data prev. conclusione",
    translate: "RESOURCES.foreseen_date",
    name: "foreseen_date",
    type: "input",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: "2024-07-04T00:00:00.000Z",
    inputType: "date",
    readonly: false,
    isVisible: true,
    newLine: true,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 26.80000000000001,
    options: [
    ],
    menuOptions: [
    ],
    lazyLoading: false,
    validations: [
    ],
    eventName: null,
    eventTrigger: null,
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "Cliente",
    translate: "RESOURCES.customer",
    name: "id_cliente",
    type: "combobox",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: "2",
    inputType: "text",
    readonly: false,
    isVisible: true,
    newLine: false,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 19,
    options: [
      {
        id: "2",
        name: "1-AMEDEO.POLIAmedeo Poli",
      },
    ],
    menuOptions: [
    ],
    lazyLoading: true,
    validations: [
      {
        message: "Nome Cliente Richiesto",
        name: "required",
        validator: function (control) {
          return requiredValidator(control);
        },
      },
    ],
    eventName: "change_id_cliente",
    eventTrigger: "select",
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "Contratto",
    translate: "RESOURCES.contract",
    name: "id_contratto",
    type: "combobox",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: "5",
    inputType: "text",
    readonly: false,
    isVisible: true,
    newLine: false,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 19,
    options: [
      {
        id: "5",
        name: "5-1-AMEDEO.POLIAmedeo Poli",
      },
    ],
    menuOptions: [
    ],
    lazyLoading: true,
    validations: [
    ],
    eventName: "change_id_contratto",
    eventTrigger: "select",
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "Codice Part",
    translate: "RESOURCES.codice_part",
    name: "codice_part",
    type: "input",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: "ASACERT",
    inputType: "text",
    readonly: false,
    isVisible: true,
    newLine: false,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 80,
    options: [
    ],
    menuOptions: [
    ],
    lazyLoading: false,
    validations: [
    ],
    eventName: null,
    eventTrigger: null,
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "Azienda",
    translate: "RESOURCES.codice_azienda",
    name: "codice_azienda",
    type: "input",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: "ASACERT",
    inputType: "text",
    readonly: false,
    isVisible: true,
    newLine: false,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 80,
    options: [
    ],
    menuOptions: [
    ],
    lazyLoading: false,
    validations: [
    ],
    eventName: null,
    eventTrigger: null,
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "Centro Gestionale",
    translate: "RESOURCES.office",
    name: "id_centro_gest",
    type: "combobox",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: "2",
    inputType: "text",
    readonly: false,
    isVisible: true,
    newLine: false,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 19,
    options: [
      {
        id: "2",
        name: "Ufficio Amministrativo",
      },
    ],
    menuOptions: [
    ],
    lazyLoading: true,
    validations: [
      {
        message: "Indicare il centro gestionale!",
        name: "required",
        validator: function (control) {
          return requiredValidator(control);
        },
      },
    ],
    eventName: null,
    eventTrigger: null,
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "Assegnatario",
    name: "id_anagrafica_assegnataria",
    type: "combobox",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: null,
    inputType: "text",
    readonly: false,
    isVisible: true,
    newLine: false,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 15.599999999999998,
    options: [
      null,
    ],
    menuOptions: [
    ],
    lazyLoading: true,
    validations: [
      {
        message: "Indicare l'assegnatario",
      },
    ],
    eventName: null,
    eventTrigger: null,
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "Data Competenza",
    translate: "RESOURCES.reference_date",
    name: "data_competenza",
    type: "input",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: null,
    inputType: "date",
    readonly: false,
    isVisible: true,
    newLine: true,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 22.400000000000006,
    options: [
    ],
    menuOptions: [
    ],
    lazyLoading: false,
    validations: [
    ],
    eventName: null,
    eventTrigger: null,
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "Modello di Progetto",
    translate: "RESOURCES.project_template",
    name: "codice_attivita",
    type: "combobox",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: "1",
    inputType: "text",
    readonly: true,
    isVisible: true,
    newLine: false,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 32.3,
    options: [
      {
        id: "1",
        name: "PRG.CERT-Progetto di Certificazione",
      },
    ],
    menuOptions: [
    ],
    lazyLoading: true,
    validations: [
    ],
    eventName: "select_modello",
    eventTrigger: "select",
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "Note",
    translate: "RESOURCES.notes",
    name: "note",
    type: "textarea",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: null,
    inputType: "text",
    readonly: false,
    isVisible: true,
    newLine: false,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 65.7,
    options: [
    ],
    menuOptions: [
    ],
    lazyLoading: false,
    validations: [
    ],
    eventName: null,
    eventTrigger: null,
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
  {
    table: "progetti",
    label: "Argomento",
    translate: "RESOURCES.tag",
    name: "id_argomento",
    type: "input",
    index: 0,
    fullValueSet: {
      user_upd: "mguadagnini",
      data_inserimento: "2024-07-04T00:00:00.000Z",
      codice_progetto: "6",
      id_progetto: "12",
      attivita_vr: "1",
      titolo: "Progetto di Certificazione",
      stato: {
        value: "A",
        options: [
          {
            id: "A",
            name: "Pianificato",
          },
        ],
        lazyLoading: true,
      },
      foreseen_date: "2024-07-04T00:00:00.000Z",
      id_cliente: {
        value: "2",
        options: [
          {
            id: "2",
            name: "1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      id_contratto: {
        value: "5",
        options: [
          {
            id: "5",
            name: "5-1-AMEDEO.POLIAmedeo Poli",
          },
        ],
        lazyLoading: true,
      },
      codice_part: "ASACERT",
      codice_azienda: "ASACERT",
      id_centro_gest: {
        value: "2",
        options: [
          {
            id: "2",
            name: "Ufficio Amministrativo",
          },
        ],
        lazyLoading: true,
      },
      id_anagrafica_assegnataria: {
        value: null,
        options: [
          null,
        ],
        lazyLoading: true,
      },
      data_competenza: null,
      codice_attivita: {
        value: "1",
        options: [
          {
            id: "1",
            name: "PRG.CERT-Progetto di Certificazione",
          },
        ],
        lazyLoading: true,
      },
      note: null,
      id_argomento: "52343 - Progetto di Certificazione",
    },
    primaryKeys: {
      codice_azienda: "ASACERT",
      id_progetto: "12",
    },
    value: "52343 - Progetto di Certificazione",
    inputType: "text",
    readonly: true,
    isVisible: true,
    newLine: false,
    textareaHeight: "S",
    showTextAreaRichFormatter: false,
    buttonIcon: null,
    confirmButtonAction: false,
    isDownloadButton: false,
    style: null,
    width: 80,
    options: [
    ],
    menuOptions: [
    ],
    lazyLoading: false,
    validations: [
    ],
    eventName: null,
    eventTrigger: null,
    conditionalQuery: null,
    subform: null,
    isMultiSelect: false,
    showTagsView: false,
    onChangeResetKey: [
    ],
  },
];

const meta: Meta<OCFormComponent> = {
  title: 'Example/OCForm',
  component: OCFormComponent,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {
    fields: ocFormData
  },
};

export default meta;
type Story = StoryObj<OCFormComponent>;


export const Progetti: Story = {
  args: {
    fields: ocFormData
  }
}
