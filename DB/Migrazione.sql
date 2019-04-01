-- elimino tutte le tabella che non mi servono salvo la tabella attivita che eliminerò solamente dopo aver proceduto all'accodamento
drop table entrasp.abi, entrasp.abilitazioni, entrasp.aliquote, entrasp.aliquote_parametri, entrasp.aliquote_tipi_doc_az, entrasp.anticipo_fatture_movim, entrasp.articoli, entrasp.articoli_ubicazioni, entrasp.articoli_varianti_ft, entrasp.articoli_varianti_limiti, entrasp.articoli_varianti_lingue, entrasp.aspetto_beni, entrasp.assegnazioni, entrasp.assegnazioni_incassi, entrasp.assegnazioni_incassi_aziende, entrasp.assegnazioni_xref, entrasp.assemblee, entrasp.assemblee_odg, entrasp.asset, entrasp.asset_movimenti, entrasp.attrezzature, entrasp.audit_trail, entrasp.autocert_134_2012, entrasp.autorizzazioni, entrasp.autorizzazioni_epc, entrasp.aziende_cfg, entrasp.batch_fatt, entrasp.batch_fatt_criteri, entrasp.batch_fatt_criteri_ragg, entrasp.batch_fatt_errors, entrasp.batch_gen_dett_fatt, entrasp.batch_gen_dett_fatt_err, entrasp.batch_scarichi, entrasp.batch_scarichi_documenti, entrasp.batch_servizi_fatturazione, entrasp.batch_servizi_fatturazione_err, entrasp.batch_servizi_fatturazione_err2, entrasp.black_list, entrasp.bolle, entrasp.bolle_righe, entrasp.bpm_data_effect, entrasp.bpm_data_effect_column, entrasp.bpm_flow, entrasp.bpm_log, entrasp.bpm_notifications, entrasp.bpm_proc_step, entrasp.bpm_proc_step_type, entrasp.bpm_process, entrasp.bpm_process_instance, entrasp.bpm_step_fields, entrasp.bpm_step_instance, entrasp.bpm_step_type_fields, entrasp.bpm_step_type_validation, entrasp.bpm_step_validation, entrasp.bpm_usr_notification_rules, entrasp.branch, entrasp.branch_consuntivazioni, entrasp.budget_agente, entrasp.cambi, entrasp.castelletto_riba, entrasp.cat_comm_provv_scale, entrasp.categorie_commerciali, entrasp.causali_770, entrasp.causali_bolle, entrasp.causali_documenti, entrasp.causali_min_persi, entrasp.causali_ritenute, entrasp.ce_ammortamenti, entrasp.ce_categorie, entrasp.ce_categorie_az, entrasp.ce_causali, entrasp.ce_cespiti, entrasp.ce_cespiti_doc CASCADE;
drop table entrasp.ce_gruppi, entrasp.ce_movimenti, entrasp.ce_movimenti_ft, entrasp.ce_piani_ammortamento, entrasp.ce_raggruppamenti, entrasp.ce_specie, entrasp.ce_tipi, entrasp.ce_tipi_az, entrasp.ce_tipi_cfg, entrasp.cee, entrasp.cee_aggregazioni, entrasp.centri_attivita, entrasp.centri_costo, entrasp.centri_riclass, entrasp.certificazione_unica, entrasp.certificazione_unica_documenti, entrasp.certificazione_unica_pagamenti, entrasp.cfg_anag, entrasp.cfg_funzioni, entrasp.cfg_mod_compliance, entrasp.cfg_mod_progetti, entrasp.cfg_mod_segnalazioni, entrasp.cfg_moduli, entrasp.cfg_welcome_page_utente, entrasp.cicli_produzione, entrasp.cicli_produzione_fasi, entrasp.classi_fatturazione, entrasp.classificazioni_articoli, entrasp.clienti_articoli, entrasp.clienti_magazzini, entrasp.clone_index, entrasp.codici_intrastat, entrasp.codici_provenienza, entrasp.codici_studi_settore, entrasp.codici_tipi_icks, entrasp.codifica_manutenzioni, entrasp.colleghi_default, entrasp.competenze, entrasp.comuni, entrasp.cond_pag_mesi_esclusi, entrasp.condizioni_fatturazione, entrasp.condizioni_pagamento, entrasp.configurazioni, entrasp.configurazioni_valori, entrasp.configurazioni_valori_part, entrasp.configurazioni_valori_sede, entrasp.contatti, entrasp.conti, entrasp.conti_cee, entrasp.conti_correnti, entrasp.conti_correnti_operazioni, entrasp.conti_correnti_sedi, entrasp.conti_ricavo, entrasp.contratti, entrasp.contratti_classificazioni, entrasp.contratti_consuntivazione, entrasp.contratti_mancanti, entrasp.contratti_materiali, entrasp.contratti_pacchetti, entrasp.contratti_passivi, entrasp.contratti_passivi_righe, entrasp.contratti_risorse, entrasp.contratti_risorse_asset, entrasp.conversazioni, entrasp.conversazioni_anag, entrasp.conversazioni_msg, entrasp.costi_fissi_orari, entrasp.costi_std, entrasp.criteri_ragg_fatt, entrasp.crm_contatti_eventi, entrasp.crm_eventi, entrasp.crm_log_contatti, entrasp.crm_log_contatti_det, entrasp.crm_tipi_evento, entrasp.data_element CASCADE;
drop table entrasp.data_synch, entrasp.data_view, entrasp.data_view_item, entrasp.db_esterni, entrasp.db_version, entrasp.depositi_movimenti, entrasp.derivazioni_contatto, entrasp.dichiarazioni_intento, entrasp.distinta, entrasp.distinta_comm, entrasp.divisioni, entrasp.doc_cfg, entrasp.doc_cfg_iva, entrasp.documenti, entrasp.documenti_arch_doc, entrasp.documenti_cfg, entrasp.documenti_movim, entrasp.documenti_righe_inc_pag, entrasp.dv_fogli_lavoro, entrasp.dv_fogli_lavoro_righe, entrasp.email, entrasp.email_address_extension, entrasp.email_allegati, entrasp.email_inbox, entrasp.email_inbox_address, entrasp.email_inbox_body_part, entrasp.email_inbox_oggetti, entrasp.empori_periodi, entrasp.esercizi, entrasp.etichette, entrasp.eventi, entrasp.expr_fix, entrasp.fabbisogni_ordini_acquisto, entrasp.fabbisogni_ordini_produzione, entrasp.festivita, entrasp.filtri_gruppi_banche, entrasp.filtri_indirizzi_email, entrasp.fonti_segnalazioni, entrasp.fornitori_articoli, entrasp.fre_clienti_sez_listino, entrasp.fre_data_riferimento, entrasp.fre_metodi_pesca, entrasp.fre_ordinato_giorno, entrasp.fre_produzione_giorno, entrasp.fre_registri_ddr, entrasp.garanzie, entrasp.gare_appalto, entrasp.giacenze_movimenti, entrasp.giacenze_statistiche, entrasp.giacenze_valori, entrasp.giroconti, entrasp.glossario, entrasp.gruppi, entrasp.gruppi_lavoro, entrasp.gruppi_lavoro_membri, entrasp.gruppi_utenti, entrasp.im_comp, entrasp.im_contr, entrasp.im_contr_anno, entrasp.im_contr_canoni, entrasp.im_contr_loc, entrasp.im_fatt_errors, entrasp.im_loc, entrasp.im_loc_pr, entrasp.im_rate, entrasp.indici_istat, entrasp.indipendenti, entrasp.input_output_attributes, entrasp.input_output_objects, entrasp.input_output_operation_elements, entrasp.input_output_operations, entrasp.input_output_relations, entrasp.integration_service_log CASCADE;
drop table entrasp.interventi, entrasp.interventi_compiti, entrasp.interventi_materiali, entrasp.interventi_risorse, entrasp.inventari_batch, entrasp.inviti_aziende, entrasp.inviti_utenti, entrasp.io_file_map_element_rules, entrasp.io_file_map_elements, entrasp.io_file_maps, entrasp.item_configuration, entrasp.job, entrasp.job_queue, entrasp.job_queue_errors, entrasp.knowledge_base, entrasp.lavorazioni_linee, entrasp.lavorazioni_sottofasi, entrasp.lgtc_addebiti, entrasp.lgtc_chilometri_mensili, entrasp.lgtc_interventi, entrasp.lgtc_modelli_veicoli, entrasp.lgtc_rifornimenti, entrasp.lgtc_sinistri, entrasp.lgtc_spese, entrasp.lgtc_tipi_intervento, entrasp.lgtc_tipi_rifornimento, entrasp.lgtc_tipi_sinistro, entrasp.lgtc_tipi_spesa, entrasp.lgtc_tratte_viaggi, entrasp.lgtc_veicoli, entrasp.lgtc_viaggi, entrasp.linee_produzione, entrasp.lingue, entrasp.lingue_ui, entrasp.liquidazione_iva, entrasp.liste_distribuzione, entrasp.liste_distribuzione_az, entrasp.liste_distribuzione_az_cfg, entrasp.liste_distribuzione_io, entrasp.liste_distribuzione_oggetti, entrasp.listini_acquisto, entrasp.listini_generali, entrasp.listini_ricarico_cc, entrasp.listini_vendita, entrasp.listini_vendita_righe, entrasp.loader_service_log, entrasp.lotti, entrasp.lotti_etichette, entrasp.macchine, entrasp.mag_mov_distinte, entrasp.mag_riepilogo, entrasp.magazzini, entrasp.magazzini_ubicazioni, entrasp.mappa_dispositivi, entrasp.mct_destinazioni, entrasp.mct_eventi, entrasp.mct_eventi_picking, entrasp.mct_inv_pklist, entrasp.mct_inv_udc, entrasp.mct_inventari, entrasp.mct_operazioni, entrasp.mct_packing_list, entrasp.mct_saldi, entrasp.mct_tipi_evento, entrasp.mct_travaso_list, entrasp.mct_udc, entrasp.messaggi, entrasp.metodi, entrasp.metodi_lingue, entrasp.mezzi, entrasp.mgr_profili, entrasp.mkt_campagne, entrasp.mkt_campagne_risorse, entrasp.mobile_log, entrasp.mod_intra CASCADE;
drop table entrasp.mod_intra_file, entrasp.mod_intra_righe, entrasp.moduli, entrasp.motivi_rifiuto_offerta, entrasp.nazioni, entrasp.note_spese, entrasp.note_spese_righe, entrasp.numeratori, entrasp.numeratori_default, entrasp.nv_addizionali, entrasp.nv_addizionali_righe, entrasp.nv_contabilizzazioni, entrasp.nv_rettifiche, entrasp.nv_riepilogo_attivita, entrasp.nv_riepilogo_attivita_righe, entrasp.nv_servizi, entrasp.object_reports, entrasp.object_reports_az, entrasp.object_reports_rcpt, entrasp.object_reports_sched, entrasp.offerte_concorrenti, entrasp.offerte_concorrenti_righe, entrasp.oggetti_acquisiti, entrasp.olap_cubi, entrasp.olap_cubi_dim, entrasp.olap_cubi_mis, entrasp.olap_dimensioni, entrasp.olap_dimensioni_rel, entrasp.olap_misure, entrasp.olap_modelli, entrasp.olap_periodi, entrasp.olap_query_items, entrasp.olap_valori_dimensioni, entrasp.op_massive_distinte, entrasp.ordini_clienti, entrasp.ordini_clienti_attivita, entrasp.ordini_clienti_offerte, entrasp.ordini_clienti_persone, entrasp.ordini_clienti_righe, entrasp.ordini_fornitori, entrasp.ordini_fornitori_righe, entrasp.ordini_produzione, entrasp.ordini_produzione_fasi, entrasp.ordini_produzione_fasi_tempi, entrasp.parametri_bolli, entrasp.parametri_cee, entrasp.partitario, entrasp.partitario_movim, entrasp.partitario_movim_epc, entrasp.partitario_operazioni, entrasp.partitario_pagamenti, entrasp.partite_master_log, entrasp.pdc, entrasp.periodi, entrasp.periodi_enasarco_att, entrasp.periodi_enasarco_pass, entrasp.periodi_fatturazione, entrasp.picking_righe, entrasp.politiche_sollecito, entrasp.politiche_sollecito_casi, entrasp.pratiche_credito, entrasp.pratiche_credito_crediti, entrasp.presidi, entrasp.prestazioni_dettaglio, entrasp.prestazioni_parametri, entrasp.prestazioni_periodo, entrasp.prestazioni_periodo_righe, entrasp.prezzi_cat_comm_lv, entrasp.prezzi_listini_acquisto, entrasp.prezzi_listini_acquisto_cat, entrasp.prezzi_vendita, entrasp.prezzi_vendita_scag, entrasp.priorita_sla, entrasp.prod_sim_input CASCADE;
drop table entrasp.prod_sim_output, entrasp.prod_simulazioni, entrasp.produttori, entrasp.profili, entrasp.profili_amministrabili, entrasp.profili_ereditati, entrasp.progetti_fasi_zone, entrasp.province, entrasp.provv_age, entrasp.provv_cat_comm, entrasp.provv_cli, entrasp.provvigioni, entrasp.provvigioni_autorizzate, entrasp.ratei_risconti, entrasp.ratei_risconti_rettifiche, entrasp.recupero_numeri_sequenze, entrasp.redditometro, entrasp.redditometro_righe, entrasp.reg_analitica, entrasp.reg_analitica_tmp, entrasp.reg_contabili, entrasp.reg_contabili_tmp, entrasp.reg_iva, entrasp.regioni, entrasp.registratori_cassa, entrasp.regole_sequenze, entrasp.resoconti, entrasp.resoconti_righe, entrasp.rettifiche_pro_rata, entrasp.richieste_acquisto, entrasp.richieste_acquisto_righe, entrasp.richieste_offerta, entrasp.richieste_offerta_attivita, entrasp.richieste_offerta_pa, entrasp.richieste_offerta_persone, entrasp.richieste_offerta_righe, entrasp.richieste_ragg_sf, entrasp.riclass, entrasp.riclass_sottoconti, entrasp.righe_contratti_mancanti, entrasp.righe_documento, entrasp.righe_partitario_pagamenti, entrasp.rilasci, entrasp.rinnovo_contratti, entrasp.rinnovo_prezzi_vendita, entrasp.ritenute, entrasp.scadenzario_terzi, entrasp.scale_provvigioni, entrasp.scale_provvigioni_valori, entrasp.schemi_dati_produzione, entrasp.sconti_cat_comm_cli, entrasp.sconti_forn_cli, entrasp.sconti_sede, entrasp.scontrini, entrasp.scontrini_righe, entrasp.scorte_minime, entrasp.sedi, entrasp.sedi_azienda, entrasp.sedi_azienda_cg, entrasp.sequenze, entrasp.serie_ripetizioni, entrasp.serie_ripetizioni_oggetti, entrasp.servizi, entrasp.servizi_compensi, entrasp.servizi_compenso_listino, entrasp.servizi_comprati, entrasp.servizi_comprati_contratti, entrasp.servizi_fatturazione, entrasp.servizi_offerti, entrasp.servizi_produzione, entrasp.servizi_segmenti, entrasp.servizi_tipo_compenso, entrasp.sistemi_esterni CASCADE;
drop table entrasp.sistemi_esterni_decodifica, entrasp.sistemi_esterni_iva, entrasp.sistemi_esterni_oggetti, entrasp.sistemi_esterni_tabelle, entrasp.soci, entrasp.soci_eventi, entrasp.soci_movim, entrasp.soci_tipi_movimento, entrasp.sottoconti, entrasp.sottoconti_ft, entrasp.sottoconti_ra, entrasp.sottoconti_sedi, entrasp.sottoconti_std, entrasp.sottoconti_vr, entrasp.spese, entrasp.spesometro_2012, entrasp.spesometro_2012_cfg_aliquote, entrasp.spesometro_2012_reg_iva, entrasp.spesometro_2012_totali, entrasp.spesometro_2012_totali_sa, information_schema.sql_features, information_schema.sql_implementation_info, information_schema.sql_languages, information_schema.sql_packages, information_schema.sql_parts, information_schema.sql_sizing, information_schema.sql_sizing_profiles, entrasp.stampa_libro_cespiti, entrasp.stampa_libro_giornale, entrasp.stampa_libro_iva, entrasp.stampe_bilancio, entrasp.stampe_bilancio_aziende, entrasp.stampe_bilancio_divisioni, entrasp.stampe_bilancio_righe, entrasp.stampe_bilancio_val_mag, entrasp.stampe_saldi_clienti, entrasp.stampe_saldi_contabili, entrasp.tag_oggetti, entrasp.tags, entrasp.tariffe_std, entrasp.tassi_interesse_legale, entrasp.template_documenti, entrasp.template_documenti_tpl, entrasp.template_fiscali, entrasp.template_risposte_previste, entrasp.template_risposte_previste_righe, entrasp.template_testi, entrasp.template_testi_lingue, entrasp.tessere_empori, entrasp.tessere_empori_periodi, entrasp.tessere_empori_vr, entrasp.tipi_anagrafiche_cfg, entrasp.tipi_articolo, entrasp.tipi_attivita_righe, entrasp.tipi_attivita_righe_op, entrasp.tipi_avviso_parametri, entrasp.tipi_avviso_std, entrasp.tipi_contatto, entrasp.tipi_contratto, entrasp.tipi_doc, entrasp.tipi_doc_az, entrasp.tipi_doc_az_causali_ddt, entrasp.tipi_doc_az_movim_ctb, entrasp.tipi_doc_movim_ctb, entrasp.tipi_documento, entrasp.tipi_fasi_progetti, entrasp.tipi_fonti_rischio, entrasp.tipi_garanzia, entrasp.tipi_imballo, entrasp.tipi_impegno, entrasp.tipi_luogo_impegni, entrasp.tipi_messaggi, entrasp.tipi_messaggi_az, entrasp.tipi_numeratore, entrasp.tipi_porto CASCADE;
drop table entrasp.tipi_progetti, entrasp.tipi_risorsa, entrasp.tipi_risposte_previste, entrasp.tipi_ruolo_contatto, entrasp.tipi_segnalazioni, entrasp.tipi_sottoconto_anag, entrasp.tipi_spedizione, entrasp.tipi_token, entrasp.tipi_token_az, entrasp.tipi_upload, entrasp.tipi_variante, entrasp.tipi_variante_articolo, entrasp.tipi_zone_aree, entrasp.tipo_scale_provvigioni, entrasp.tokens, entrasp.tr_riepilogo_giornaliero, entrasp.tr_riepilogo_giornaliero_indicatori, entrasp.translations, entrasp.um_scaglioni, entrasp.unita_misura, entrasp.upload_documenti, entrasp.upload_file, entrasp.uscite_cl, entrasp.user_log, entrasp.utenti, entrasp.utenti_area_doc, entrasp.utenti_azienda, entrasp.utenti_clienti_visibili, entrasp.utenti_login, entrasp.utilizzo_punti_altri_empori, entrasp.valori_variante, entrasp.valori_variante_articolo, entrasp.valute, entrasp.versamenti_f24, entrasp.voci_classificazione_art, entrasp.ws_partner, entrasp.zone, entrasp.zone_anagrafiche, entrasp.zone_aree CASCADE;
DROP TABLE entrasp.crm_concorrenti_su_clienti, entrasp.crm_cond_contr, entrasp.crm_dati_commerciali_annuali, entrasp.crm_modalita_liquidazioni_cond_contr, entrasp.crm_obiettivi_su_clienti, entrasp.crm_periodi_liquidazioni_cond_contr, entrasp.crm_tipi_azioni, entrasp.crm_tipi_clientela_xref, entrasp.crm_tipi_cond_contr, entrasp.crm_utilizzo_budget_marketing, entrasp.crm_volumi_annuali, entrasp.tipi_segreti, entrasp.tipi_taglie, entrasp.tipi_produzioni, entrasp.picking, entrasp.articoli_varianti, entrasp.articoli_varianti_imballi, entrasp.tipi_confezionamenti, entrasp.tipi_lavorazioni, entrasp.tipi_clientela, entrasp.gruppi_commerciali, entrasp.marchi_commerciali, entrasp.segreti, entrasp.anagrafiche_cat_tecn, entrasp.anagrafiche_cli, entrasp.anagrafiche_col, entrasp.anagrafiche_for, entrasp.anagrafiche_ft, entrasp.anagrafiche_marchi_commerciali, entrasp.anagrafiche_ris, entrasp.anagrafiche_statistiche, entrasp.anagrafiche_vr CASCADE;


-- aggiungo colonne alla tabela procedure_aziendali per procedere al successivo inserimento dalla tabella attività
ALTER TABLE entrasp.procedure_aziendali ADD COLUMN data_inizio_validita date NOT NULL DEFAULT '2000-01-01'::date;
ALTER TABLE entrasp.procedure_aziendali ADD COLUMN data_fine_validita date;
ALTER TABLE entrasp.procedure_aziendali ADD COLUMN data_fine_visibilita date;
ALTER TABLE entrasp.procedure_aziendali ADD COLUMN id_modello_test numeric(12,0);
-- ALTER TABLE entrasp.attivita ADD COLUMN id_attivita SERIAL ;
-- ALTER TABLE entrasp.attivita DROP COLUMN id_attivita;

ALTER TABLE entrasp.attivita ADD COLUMN id_attivita numeric(12,0);
ALTER TABLE entrasp.attivita ADD COLUMN id_attivita_parent numeric(12,0);


-- Crea funzione da utilizzare dopo per rinumerare le attività
CREATE OR REPLACE FUNCTION entrasp.temp_conta_att_per_az_e_cod(
    text,
    text
    )
RETURNS bigint AS
$BODY$
select count(codice_attivita) from entrasp.attivita WHERE codice_azienda=$1 and codice_attivita<=$2
$BODY$
  LANGUAGE sql VOLATILE
  COST 100;
ALTER FUNCTION entrasp.temp_conta_att_per_az_e_cod(text, text)
  OWNER TO postgres;

-- funzione temporanea per trovare l'ID dell'attività dando in input codice_azienda e codice_attivita
CREATE OR REPLACE FUNCTION entrasp.temp_id_attivita(
    text,
    text)
  RETURNS numeric AS
$BODY$
select id_attivita from entrasp.attivita WHERE codice_azienda=$1 AND codice_attivita=$2
$BODY$
  LANGUAGE sql VOLATILE
  COST 100;
ALTER FUNCTION entrasp.temp_id_attivita(text, text)
  OWNER TO postgres;

-- funzione temporanea per trovare l'ID minimo dell'attività per azienda con input il codice_azienda 
CREATE OR REPLACE FUNCTION entrasp.temp_massimo_id_procedura(
    text)
  RETURNS numeric AS
$BODY$
select coalesce(max(id_procedura), 0) from entrasp.procedure_aziendali WHERE codice_azienda=$1
$BODY$
  LANGUAGE sql VOLATILE
  COST 100;
ALTER FUNCTION entrasp.temp_massimo_id_procedura(text)
  OWNER TO postgres;


UPDATE entrasp.attivita SET id_attivita=entrasp.temp_conta_att_per_az_e_cod(codice_azienda, codice_attivita) ;
UPDATE entrasp.attivita SET id_attivita_parent=entrasp.temp_id_attivita(codice_azienda, codice_attivita_parent); 

-- cancello le due delle tre funzioni temporanne create
DROP FUNCTION entrasp.temp_conta_att_per_az_e_cod(text, text);
DROP FUNCTION entrasp.temp_id_attivita(text, text);

--ALTER TABLE entrasp.attivita ALTER COLUMN id_attivita SET NOT NULL;

-- CREO UNA TABELLA DOVE SALVARE I MASSIMI PER AZIENDA ... A QUANTO PARE VARIANO PER OGNI RIGA
CREATE TABLE entrasp.temp_massimi_azienda
(
  codice_azienda character varying(30) NOT NULL,
  massimo numeric(12,0)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE entrasp.temp_massimi_azienda
  OWNER TO postgres;
  
-- inserisco i massimi in tabella
INSERT INTO entrasp.temp_massimi_azienda(codice_azienda, massimo)
SELECT codice_azienda, entrasp.temp_massimo_id_procedura(codice_azienda)
FROM entrasp.aziende;

INSERT INTO entrasp.procedure_aziendali(codice_azienda, codice, descrizione_breve, id_procedura, id_procedura_parent, id_modello_test, ordinamento, tree_path, codice_part, descrizione, data_inizio_validita, data_fine_validita, data_fine_visibilita)
SELECT codice_azienda, codice_attivita, descrizione, id_attivita+(SELECT massimo FROM entrasp.temp_massimi_azienda WHERE codice_azienda=a.codice_azienda),id_attivita_parent+(SELECT massimo FROM entrasp.temp_massimi_azienda  WHERE codice_azienda=a.codice_azienda), id_modello_test, ordinamento, tree_path, codice_part, descrizione,data_inizio_validita, data_fine_validita, data_fine_visibilita
FROM entrasp.attivita as a;
--WHERE codice_azienda not in('VPSMGMT', 'CNX', 'N','DELUCA','INT');


DROP TABLE entrasp.temp_massimi_azienda;
DROP TABLE entrasp.attivita CASCADE;
DROP FUNCTION entrasp.temp_massimo_id_procedura(text);

-- inserisco tabella_time_report
CREATE TABLE entrasp.time_report
(
  codice_azienda character varying(30) NOT NULL,
  id_time_report numeric(12,0) NOT NULL,
  ute_ins character varying(30) NOT NULL,
  data_ins timestamp without time zone NOT NULL,
  data_rif date NOT NULL,
  descrizione text,
  object_name character varying(30),
  object_key character varying(120),
  CONSTRAINT tr_pk PRIMARY KEY (codice_azienda, id_time_report)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE entrasp.time_report
  OWNER TO postgres;

