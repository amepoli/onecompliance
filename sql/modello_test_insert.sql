-- FUNCTION: entrasp.modello_test_insert(character varying, character varying, text, character varying, character, text, character, text, text, character, numeric, character varying, numeric, character varying, numeric, numeric, numeric, numeric, character, character, character, date, numeric, numeric, numeric, character, character, character, character, numeric, numeric, numeric, numeric, character, boolean, character varying, character, character, text, numeric, character)

--DROP FUNCTION IF EXISTS entrasp.modello_test_insert(character varying, character varying, text, character varying, character, text, character, text, text, character, numeric, character varying, numeric, character varying, numeric, numeric, numeric, numeric, character, character, character, date, numeric, numeric, numeric, character, character, character, character, numeric, numeric, numeric, numeric, character, boolean, character varying, character, character, text, numeric, character);

CREATE OR REPLACE FUNCTION entrasp.modello_test_insert(
	codiceazienda_ character varying, 
	titolo_ character varying DEFAULT 'Definire'::character varying, 
	descrizione_ text DEFAULT 'Definire'::text, 
	objectname character varying DEFAULT 'Non definito'::character varying, 
	flagapplicazionesingola character DEFAULT '0'::bpchar, 
	documentazionenecessaria text DEFAULT 'Non definita'::text, 
	stato_ character DEFAULT 'P'::bpchar, filter_ text DEFAULT NULL::text,
	bindexpression text DEFAULT ''::text, flagsezioni character DEFAULT '0'::bpchar, 
	giornianticipopresdoc numeric DEFAULT (0)::numeric, 
	codicepart character varying DEFAULT ''::character varying, 
	idcentrogest numeric DEFAULT NULL::numeric, 
	codice_ character varying DEFAULT ''::character varying, 
	idtipomodellotest numeric DEFAULT 1, 
	idargomento numeric DEFAULT NULL::numeric, 
	idmodellotestvr numeric DEFAULT 1, 
	flagmenu_ character DEFAULT '1'::bpchar, 
	flaglimitarisultatopct character DEFAULT '0'::bpchar,
	flagmostrapunteggi character DEFAULT '1'::bpchar)
    RETURNS TABLE(idmodellotest numeric, cod character varying) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

DECLARE maxi numeric; conta integer; codiceorigin text; numrecord integer;

BEGIN
    SELECT COALESCE(MAX(mt.id_modello_test),0) AS massimo FROM entrasp.modelli_test mt WHERE mt.codice_azienda = codiceazienda_ INTO maxi;

    INSERT INTO entrasp.modelli_test(codice_azienda, id_modello_test, titolo, descrizione, object_name, flag_applicazione_singola, documentazione_necessaria, stato, 
		filter, bind_expression, giorni_anticipo_pres_doc, codice_part, id_centro_gest, codice, id_tipo_modello_test,
		id_argomento, id_modello_test_vr, flag_menu, flag_limita_risultato_pct, flag_mostra_punteggi, titolo_cartella) 
    VALUES(codiceazienda_, maxi + 1, titolo_, descrizione_, objectname, flagapplicazionesingola,
		documentazionenecessaria, stato_, filter_, bindexpression, giornianticipopresdoc, codicepart, 
		idcentrogest, codice_, idtipomodellotest, idargomento, idmodellotestvr, flagmenu_, flaglimitarisultatopct, 
		flagmostrapunteggi, titolo_cartella);

    /*INSERT INTO entrasp.modelli_test_vr(codice_azienda, id_modello_test, id_modello_test_vr, data_inizio_validita, id_risultato, punteggio_domande_default, peso_risposte_default, ute_ins, ute_upd, flag_non_applicabile_risposta_null, flag_sezioni, attiva_disattiva, id_modello_test_att_dis, id_modello_test_vr_att_dis, id_domanda_att_dis, id_risposta_prev_att_dis, data_ins, flag_no_domande, stop_replanning_when_contracts_closed, flag_workflow, flag_ripianifica_per_cliente, rif_normativi, prezzo, flag_condivisione_automatica, id_filtro_selezione)
    VALUES(codiceazienda_, maxi+1, idmodellotestvr, $22, $23, $24, $25, $26, $27, $28, $10, $29, $30, $31, $32, $33, CAST(CURRENT_DATE AS timestamp without time zone), flagnodomande, stopreplanningwhencontractsclosed, flagworkflow, flagripianificapercliente, rifnormativi, prezzo_, flagcondivisioneautomatica, idfiltroselezione);*/

    RETURN QUERY SELECT maxi+1, idmodellotestvr, mt.codice FROM entrasp.modelli_test mt WHERE codice_azienda = codiceazienda_ AND mt.id_modello_test = maxi+1;

EXCEPTION
    WHEN not_null_violation THEN
        RAISE EXCEPTION 'Required fields are not populated' USING DETAIL = SQLERRM, ERRCODE = SQLSTATE;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Unexpected error' USING DETAIL = SQLERRM;

END

$BODY$;

ALTER FUNCTION entrasp.modello_test_insert(character varying, character varying, text, character varying, character, text, character, text, text, character, numeric, character varying, numeric, character varying, numeric, numeric, numeric, numeric, character, character, character, date, numeric, numeric, numeric, character, character, character, character, numeric, numeric, numeric, numeric, character, boolean, character varying, character, character, text, numeric, character)
    OWNER TO postgres;
