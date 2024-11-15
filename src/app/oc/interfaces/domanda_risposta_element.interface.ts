import { DomandaRispostaCondition } from "./domanda_risposta_condition.interface";
import { DomandaRispostaResponse } from "./domanda_risposta_response.interface";

export interface DomandaRispostaElement {
    id_domanda: number;
    ordinamento : number;
    punteggio: number;
    descrizione: string;
    note_domanda: string;
    condition?: DomandaRispostaCondition[],
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
    compito?: {
        codice_azienda: string;
        codice_compito: string;
    };
    codice_compito?: string;
    keys?: any;
    readonly: boolean;
    isHidden: boolean;
}
