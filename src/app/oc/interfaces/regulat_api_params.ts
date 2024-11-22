export interface RegulatAPIParams {
    actionType: 'get_aml_scan' | 'get_aml_scans',
    entityParams?: {
        codice_azienda: string,
        id_anagrafica: number,
        id_somministrazione: number,
        dynamo_user: string,
        is_light_scan: any
    },
    surveyParams?: {
        codice_azienda: string,
        id_anagrafica: number,
        id_somministrazione: number,
        id_sondaggio: number,
        dynamo_user: string,
        is_light_scan: any
    }
};