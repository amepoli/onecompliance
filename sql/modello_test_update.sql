-- FUNCTION: entrasp.modello_test_update(character varying, numeric, character varying, text, character varying, character, text, character, text, text, character, numeric, character varying, numeric, character varying, numeric, numeric, numeric, numeric, character, character, character, date, numeric, numeric, numeric, character, character, character, character, numeric, numeric, numeric, numeric, character varying, boolean, character varying, character, character, text, numeric, character)

-- DROP FUNCTION IF EXISTS entrasp.modello_test_update(character varying, numeric, character varying, text, character varying, character, text, character, text, text, character, numeric, character varying, numeric, character varying, numeric, numeric, numeric, numeric, character, character, character, date, numeric, numeric, numeric, character, character, character, character, numeric, numeric, numeric, numeric, character varying, boolean, character varying, character, character, text, numeric, character);

--DROP FUNCTION IF EXISTS entrasp.modello_test_update(character varying,numeric,character varying,text,character varying,character,text,character,text,text,character,numeric,character varying,numeric,character varying,numeric,numeric,numeric,character,character,character varying,boolean,character,character,character,character,text,numeric,character,character varying) ;

	CREATE OR REPLACE FUNCTION entrasp.modello_test_update(
    codiceazienda character varying,
    idmodellotest numeric,
    titolo_ character varying DEFAULT 'Definire'::character varying,
    descrizione_ text DEFAULT 'Definire'::text,
    objectname character varying DEFAULT 'Non definito'::character varying,
    flagapplicazionesingola character DEFAULT '0'::bpchar,
    docnecessaria_ text DEFAULT 'Non definita'::text,
    stato_ character DEFAULT 'P'::bpchar,
    filter_ text DEFAULT NULL::text,
    bindexpression text DEFAULT ''::text,
    flagsezioni character DEFAULT '0'::bpchar,
    giornianticipopresdoc numeric DEFAULT 0,
    codicepart character varying DEFAULT ''::character varying,
    idcentrogest numeric DEFAULT NULL::numeric,
    codice_ character varying DEFAULT ''::character varying,
    idtipomodellotest numeric DEFAULT 1,
    idargomento numeric DEFAULT NULL::numeric,
    idmodellotestvr numeric DEFAULT 1,
    flagmenu character DEFAULT '0'::bpchar,
    flagnonapplicabilerispostanull character DEFAULT '0'::bpchar,
    flagnodomande character varying DEFAULT '0'::character varying,
    stopreplanningwhencontractsclosed boolean DEFAULT false,
    flagworkflow character DEFAULT '0'::bpchar,
    flaglimitarisultatopct character DEFAULT '0'::bpchar,
    flagmostrapunteggi character DEFAULT '1'::bpchar,
    flagripianificapercliente character DEFAULT '0'::bpchar,
    rifnormativi_ text DEFAULT NULL::text,
    prezzo_ numeric DEFAULT (0)::numeric,
    flagcondivisioneautomatica character DEFAULT '0'::bpchar,
    titolocartella_ character varying DEFAULT NULL::character varying)
    
RETURNS void
LANGUAGE 'plpgsql'
COST 100
VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
   minidsezione numeric;
    minordidsezione numeric;
    idsezioneprinc numeric;
    maxidsezione numeric;
    contasezioni integer;
BEGIN

/*IF flag_applicazione_singola IS NULL THEN 
    flag_applicazione_singola := '0';
END IF;

IF flag_sezioni IS NULL THEN 
    flag_sezioni := '0';
END IF;

IF flag_menu IS NULL THEN 
    flag_menu := '0';
END IF;

IF flag_limita_risultato_pct IS NULL THEN 
    flag_limita_risultato_pct := '0';
END IF;

IF flag_mostra_punteggi IS NULL THEN 
    flag_mostra_punteggi := '1';
END IF;

IF flag_non_applicabile_risposta_null IS NULL THEN 
    flag_non_applicabile_risposta_null := '0';
END IF;

IF flagnodomande IS NULL THEN 
    flagnodomande := '0';
END IF;

IF stopreplanningwhencontractsclosed IS NULL THEN 
    stopreplanningwhencontractsclosed := FALSE;
END IF;

IF flagworkflow IS NULL THEN 
    flagworkflow := '0';
END IF;

IF flagripianificapercliente IS NULL THEN 
    flagripianificapercliente := '0';
END IF;
*/

IF flagsezioni = '0' OR flagsezioni = '€flag_sezioni€' THEN
    UPDATE entrasp.domande dm SET id_sezione = NULL 
    WHERE dm.codice_azienda = codiceazienda AND dm.id_modello_test = idmodellotest AND dm.id_modello_test_vr = idmodellotestvr;
    
    DELETE FROM entrasp.sondaggi_somministrati_risultati_sezioni ssrs 
    WHERE ssrs.codice_azienda = codiceazienda AND ssrs.id_modello_test = idmodellotest AND ssrs.id_modello_test_vr = idmodellotestvr;
    
    DELETE FROM entrasp.domande_sezioni ds 
    WHERE ds.codice_azienda = codiceazienda AND ds.id_modello_test = idmodellotest AND ds.id_modello_test_vr = idmodellotestvr;
ELSE
    UPDATE entrasp.domande dm SET descrizione = dm.id_domanda || '+' || dm.descrizione
    WHERE dm.codice_azienda = codiceazienda AND dm.id_modello_test = idmodellotest AND dm.id_modello_test_vr = idmodellotestvr AND
          dm.codice_azienda || '+' || dm.id_argomento || '+' || dm.id_modello_test || '+' || dm.id_modello_test_vr IN
          (SELECT dm2.codice_azienda || '+' || dm2.id_argomento || '+' || dm2.id_modello_test || '+' || dm2.id_modello_test_vr
           FROM entrasp.domande dm2
           WHERE dm2.codice_azienda || '+' || dm2.id_argomento || '+' || dm2.id_modello_test || '+' || dm2.id_modello_test_vr IS NOT NULL
           GROUP BY dm2.codice_azienda, dm2.id_argomento, dm2.id_modello_test, dm2.id_modello_test_vr
           HAVING COUNT(dm2.id_domanda) > 1);

    PERFORM entrasp.argomenti_create_and_update_domande(dm.codice_azienda, dm.id_domanda, dm.id_modello_test, 
                                                        dm.id_modello_test_vr, dm.descrizione, dm.descrizione, 574)
    FROM entrasp.domande dm
    WHERE dm.codice_azienda = codiceazienda AND dm.id_modello_test = idmodellotest AND dm.id_modello_test_vr = idmodellotestvr AND
          dm.codice_azienda || '+' || dm.id_argomento || '+' || dm.id_modello_test || '+' || dm.id_modello_test_vr IN
          (SELECT dm2.codice_azienda || '+' || dm2.id_argomento || '+' || dm2.id_modello_test || '+' || dm2.id_modello_test_vr
           FROM entrasp.domande dm2
           WHERE dm2.codice_azienda || '+' || dm2.id_argomento || '+' || dm2.id_modello_test || '+' || dm2.id_modello_test_vr IS NOT NULL
           GROUP BY dm2.codice_azienda, dm2.id_argomento, dm2.id_modello_test, dm2.id_modello_test_vr
           HAVING COUNT(dm2.id_domanda) > 1);

   SELECT COUNT(id_sezione) 
    FROM entrasp.domande_sezioni ds 
    WHERE ds.codice_azienda = codiceazienda AND ds.id_modello_test = idmodellotest AND ds.id_modello_test_vr = idmodellotestvr 
    INTO contasezioni;
    
    IF contasezioni > 0 THEN 
        SELECT MIN(ordinamento), MIN(id_sezione) 
        FROM entrasp.domande_sezioni ds 
        WHERE ds.codice_azienda = codiceazienda AND ds.id_modello_test = idmodellotest AND ds.id_modello_test_vr = idmodellotestvr 
        INTO  minidsezione;
        
        SELECT id_sezione 
        FROM entrasp.domande_sezioni ds 
        WHERE ds.codice_azienda = codiceazienda AND ds.id_modello_test = idmodellotest AND ds.id_modello_test_vr = idmodellotestvr AND ds.ordinamento = min_ord_id_sezione 
        INTO idsezioneprinc;
        
        UPDATE entrasp.domande dm SET id_sezione = COALESCE(idsezioneprinc, minidsezione) 
        WHERE dm.codice_azienda = codiceazienda AND dm.id_modello_test = idmodellotest AND dm.id_modello_test_vr = idmodellotestvr AND id_sezione IS NULL;    
    ELSE
        SELECT COALESCE(MAX(ds.id_sezione), 0) 
        FROM entrasp.domande_sezioni ds 
        WHERE ds.codice_azienda = codiceazienda AND ds.id_modello_test = idmodellotest AND ds.id_modello_test_vr = idmodellotestvr 
        INTO maxidsezione;
        
        INSERT INTO entrasp.domande_sezioni(codice_azienda, id_modello_test, id_sezione, descrizione, ordinamento, id_modello_test_vr, flag_non_applicabile_risposta_null, peso)
        VALUES (codiceazienda, idmodellotest, maxidsezione + 1, 'Sezione default', 1, idmodellotestvr, '0', 1.00);    
        
        UPDATE entrasp.domande dm SET id_sezione = maxidsezione + 1 
        WHERE dm.codice_azienda = codiceazienda AND dm.id_modello_test = idmodellotest AND dm.id_modello_test_vr = idmodellotestvr AND id_sezione IS NULL;    
    END IF;
END IF;


UPDATE entrasp.modelli_test mt 
SET titolo = titolo_, descrizione = descrizione_, object_name = objectname, flag_applicazione_singola = flagapplicazionesingola, 
    documentazione_necessaria = docnecessaria_, stato = stato_, filter = filter_, bind_expression = bindexpression, giorni_anticipo_pres_doc = giornianticipopresdoc, 
    codice_part = codicepart, id_centro_gest = idcentrogest, codice = codice_, id_tipo_modello_test = idtipomodellotest, 
    id_argomento = idargomento, id_modello_test_vr = idmodellotestvr, flag_menu = flagmenu, flag_limita_risultato_pct = flaglimitarisultatopct, flag_mostra_punteggi = flagmostrapunteggi, titolo_cartella = titolocartella_
WHERE mt.codice_azienda = codiceazienda_ AND mt.id_modello_test = idmodellotest;

/*UPDATE entrasp.modelli_test_vr vr
SET id_risultato = id_risultato, punteggio_domande_default = punteggio_domande_default, peso_risposte_default = peso_risposte_default, ute_ins = ute_ins, ute_upd = ute_upd, flag_sezioni = flag_sezioni, data_upd = CAST(CURRENT_DATE AS timestamp without time zone), 
    flag_non_applicabile_risposta_null = flag_non_applicabile_risposta_null, attiva_disattiva = attiva_disattiva, id_modello_test_att_dis = id_modello_test_att_dis, id_modello_test_vr_att_dis = id_modello_test_vr_att_dis, id_domanda_att_dis = id_domanda_att_dis, id_risposta_prev_att_dis = id_risposta_prev_att_dis, 
    flag_no_domande = flagnodomande, stop_replanningwhencontractsclosed = stopreplanningwhencontractsclosed, flag_workflow = flagworkflow,
    flag_ripianifica_per_cliente = flagripianificapercliente, rif_normativi = rifnormativi, prezzo = prezzo_, flag_condivisione_automatica = flagcondivisioneautomatica,
    id_filtro_selezione = idfiltroselezione
WHERE vr.codice_azienda = codice_azienda AND vr.id_modello_test = id_modello_test AND vr.id_modello_test_vr = id_modello_test_vr; */

EXCEPTION
    WHEN not_null_violation THEN
        RAISE EXCEPTION 'Required fields are not populated' USING DETAIL = SQLERRM, ERRCODE = SQLSTATE;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Unexpected error' USING DETAIL = SQLERRM;
END
$BODY$;

ALTER FUNCTION entrasp.modello_test_update(character varying,numeric,character varying,text,character varying,character,text,character,text,text,character,numeric,character varying,numeric,character varying,numeric,numeric,numeric,character,character,character varying,boolean,character,character,character,character,text,numeric,character,character varying)
OWNER TO postgres;
