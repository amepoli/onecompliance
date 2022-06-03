export interface RegulatAPIParams {
    actionType: 'get_aml_scan',
    entityParams?: {
        codice_azienda: string,
        id_anagrafica: number,
        nome: string,
        cognome: string,
        yob: number,
        id_somministrazione: number,
        tipo_soggetto: string
    }
};