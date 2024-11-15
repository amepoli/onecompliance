export interface DomandaRispostaCondition {
    id_domanda: number;
    id_risposta_prev: number;
    condition: "equal" | "notEqual" | "greaterThan" | "lessThan";
}