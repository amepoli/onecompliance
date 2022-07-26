export interface RegulatAPIParams {
    actionType: 'get_aml_scan',
    entityParams?: {
        codice_azienda: string,
        id_anagrafica: number,
        id_somministrazione: number
    }
};