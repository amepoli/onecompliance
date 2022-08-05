export interface RegulatAPIParams {
    actionType: 'get_aml_scan' | 'get_aml_scans',
    entityParams?: {
        codice_azienda: string,
        id_anagrafica: number,
        id_somministrazione: number
    },
    surveyParams?: {
        codice_azienda: string,
        id_sondaggio: number
    }
};