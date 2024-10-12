-- FUNCTION: entrasp.risposte_update_insert(character varying, numeric, numeric, text, numeric, date, numeric, numeric, numeric, numeric, numeric, numeric, text, numeric, numeric, character varying, character varying, character varying)

DROP FUNCTION IF EXISTS entrasp.risposte_update_insert(character varying, numeric, numeric, text, numeric, numeric, numeric, numeric, text, numeric, numeric, numeric, character varying, numeric, date, numeric, character varying, character varying);

DROP FUNCTION IF EXISTS entrasp.risposte_update_insert(character varying, numeric, numeric, text, numeric, date, numeric, numeric, numeric, numeric, numeric, numeric, text, numeric, numeric, character varying, character varying, character varying);

CREATE OR REPLACE FUNCTION entrasp.risposte_update_insert(
	codiceazienda character varying,
	idmodellotest numeric,
	idrisposta numeric,
	iddomanda numeric,
	idsondaggio numeric,
	idsomministrazione numeric,
	punteggio_ numeric,
	note_ text,
	idmodellotestvr numeric,
	punteggiorisposta numeric,
	risposta_ text DEFAULT NULL::text,
	peso_ numeric DEFAULT NULL::numeric,
	rispostamultipla character varying DEFAULT NULL::character varying,
	rispostanum numeric DEFAULT NULL::numeric,
	rispostadate date DEFAULT NULL::date,
	idrispostaprev numeric DEFAULT NULL::numeric,
	objectname character varying DEFAULT NULL::character varying,
	objectkey character varying DEFAULT NULL::character varying)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
    idtipodomanda numeric;
    risp_multipla_array numeric[];
    risp_mancanti numeric[];
    risp_presenti numeric[];
    risp_da_cancellare numeric[];
    idrispostamax integer;
    singola_risp numeric;
    peso_singola_risp numeric;
    peso_oa numeric;
    penalizzazione_ numeric;
    num_risp numeric;
		idarg_mt numeric;
		codext_rp varchar;
		crea_nc boolean;
		codcompito varchar;
		idresponsabile numeric;
BEGIN

--	select 1;
  SELECT punteggio,
	 			 penalizzazione,
		  	 id_tipo_domanda
	FROM entrasp.domande
	WHERE codice_azienda = codiceazienda
		AND id_domanda = iddomanda
		AND id_modello_test = idmodellotest
		AND id_modello_test_vr = idmodellotestvr 
	INTO punteggio_, penalizzazione_, idtipodomanda;
	
--	raise notice 'itd: %', idtipodomanda;
	peso_oa := peso_;
	peso_ := NULL;
	
	SELECT max(id_risposta)::integer
	FROM entrasp.risposte
	WHERE codice_azienda = codiceazienda 
	INTO idrispostamax;
	
	PERFORM setval('entrasp.id_risposta', idrispostamax, TRUE);--caso del radio button e della risposta aperta

	-- HACK ON BENETTON REQUEST per creare le non conformità automaticamente e mettere il negozio come responsabile
	IF codiceazienda in('BENETTONGROUP') THEN
	
	/*
		SELECT id_argomento 
		FROM entrasp.modelli_test 
		WHERE codice_azienda=codiceazienda 
			AND id_modello_test=idmodellotest
		INTO idarg_mt;
	*/	
		SELECT flag_apri_nc_automaticamente::boolean,coalesce(cod_ext,'')
		FROM entrasp.risposte_previste
		WHERE codice_azienda=codiceazienda 
			AND id_modello_test=idmodellotest
			AND id_modello_test_vr=idmodellotestvr
			AND id_domanda=iddomanda
			AND id_risposta_prev=idrispostaprev
		INTO crea_nc,codext_rp;
		
	--	IF idarg_mt = 48601 AND codext_rp IN ('NO','NI') THEN
		
		IF crea_nc THEN
		
			select entrasp.compiti_rif_bo_insert('riepilogoRisposte', dmd.descrizione||'. Risposta rilevata: '||codext_rp||' ', codiceazienda, idsondaggio, idsomministrazione, idmodellotest, idmodellotestvr, iddomanda)
			FROM entrasp.domande dmd
			WHERE dmd.codice_azienda=codiceazienda
			AND dmd.id_domanda=iddomanda
			AND dmd.id_modello_test=idmodellotest
			AND dmd.id_modello_test_vr=idmodellotestvr
			AND codiceazienda||'#'||idsondaggio||'#'||idsomministrazione||'#'||idmodellotest||'#'||idmodellotestvr||'#'||iddomanda NOT IN (
				SELECT object_key FROM entrasp.compiti_rif_bo 
				WHERE codice_azienda = codiceazienda
				AND object_name ='riepilogoRisposte'
				AND object_key = (codiceazienda||'#'||idsondaggio||'#'||idsomministrazione||'#'||idmodellotest||'#'||idmodellotestvr||'#'||iddomanda)::varchar
				AND object_key IS NOT NULL
			)
			into codcompito;
			
			-- seguenti due comandi per riportare l'id del negozio sulla non conformità sul campo responsabile
			select split_part(object_key, '|', 2)::numeric
			from entrasp.sondaggi_somministrati
			where codice_azienda=codiceazienda and id_sondaggio=idsondaggio and id_somministrazione=idsomministrazione
			and object_name='anagraficheId'
			into idresponsabile;
			
			update entrasp.compiti
			set id_responsabile=idresponsabile
			where codice_azienda=codiceazienda and codice_compito=codcompito;
			
		END IF;
		
		
		
	END IF;	
	
IF idtipodomanda in(1,3,5,6,7) THEN 
	
	IF idrispostaprev IS NOT NULL THEN 
	
		SELECT peso
		FROM entrasp.risposte_previste
		WHERE codice_azienda = codiceazienda
				AND id_modello_test = idmodellotest
				AND id_domanda = iddomanda
				AND id_risposta_prev = idrispostaprev INTO peso_;
		END IF;
		
		SELECT id_risposta
		FROM entrasp.risposte
		WHERE codice_azienda = codiceazienda
				AND id_modello_test = idmodellotest
				AND id_modello_test_vr = idmodellotestvr
				AND id_domanda = iddomanda
				AND id_sondaggio = idsondaggio
				AND id_somministrazione = idsomministrazione INTO idrisposta;
				
				--raise notice 'parametri:%', 'azienda'||codiceazienda||'-idsondaggio'||idsondaggio||'-idsomministrazione'||idsomministrazione||'-idmodellotest'||idmodellotest||'-idmodellotestvr'||idmodellotestvr||'-iddomanda'||iddomanda||'-idrisposta'||idrisposta;
	 			--raise notice 'id_risposta_prev+peso:%', idrispostaprev||'-'||peso_;

/*
		raise notice 'itd: %', idtipodomanda;
		raise notice 'rd: %', rispostadate;
		raise notice 'rn: %', rispostanum;
		raise notice 'ca: %', codiceazienda;
		raise notice 'r: %', risposta_;
*/

		raise notice 'condizione: %', idrisposta IS NULL AND (idrispostaprev IS NOT NULL OR ((risposta_ IS NOT NULL and risposta_!='') or rispostanum IS NOT NULL or rispostadate IS NOT NULL));
		raise notice 'idrisposta: %', idrisposta; 
		raise notice 'idrispostaprev: %', idrispostaprev; 
		raise notice 'sottocondizione: %',	(risposta_ IS NOT NULL and risposta_!='') or rispostanum IS NOT NULL or rispostadate IS NOT NULL;
		raise notice 'risposta: %', '£'||risposta_||'£';
		raise notice 'rispostanum: %', '£'||rispostanum::varchar||'£';
		raise notice 'rispostadate: %', '£'||rispostadate::varchar||'£';
			

	 	IF idrisposta IS NULL AND (idrispostaprev IS NOT NULL OR (
																(risposta_ IS NOT NULL and risposta_!='') 
																  or rispostanum IS NOT NULL 
																  or rispostadate IS NOT NULL 
																  )
								  ) THEN 
				
				idrisposta := nextval('entrasp.id_risposta');
			
				INSERT INTO entrasp.risposte (codice_azienda, id_modello_test, id_modello_test_vr, id_sondaggio, id_somministrazione, 
				id_domanda, id_risposta_prev, id_risposta, risposta, risposta_date, risposta_num, 
											  note, punteggio, peso, penalizzazione)
				VALUES (codiceazienda, idmodellotest, idmodellotestvr, idsondaggio, idsomministrazione, 
				iddomanda, idrispostaprev, idrisposta, risposta_, rispostadate, rispostanum, 
						note_, punteggio_, coalesce(peso_, peso_oa), coalesce(penalizzazione_, 0)) on conflict do nothing;
				
				
			
	
	ELSE 
	UPDATE entrasp.risposte
	SET id_risposta_prev = idrispostaprev,
							risposta = risposta_,
							risposta_date = rispostadate,
							risposta_num=rispostanum,
							object_name = objectname,
							object_key = objectkey,
							punteggio = punteggio_,
							peso = coalesce(peso_, peso_oa),
							note = note_,
							punteggio_risposta = punteggiorisposta + penalizzazione_
	WHERE codice_azienda = codiceazienda
			AND id_sondaggio = idsondaggio
			AND id_somministrazione = idsomministrazione
			AND id_modello_test = idmodellotest
			AND id_modello_test_vr = idmodellotestvr
			AND id_domanda = iddomanda
			AND id_risposta = idrisposta;
	END IF;--caso della risposta multipla
ELSEIF idtipodomanda = 2 THEN 
-- le due righe di replace che seguono, inserite in data 03/04/2024 servono a gestire la modifica intervenuta del passaggio dei campi multipli come array (prima non c'era)
	rispostamultipla=replace(rispostamultipla, '[ARRAY[', '[');
	rispostamultipla=replace(rispostamultipla, ']]', ']');
	
	LOOP EXIT WHEN (position('[,' IN rispostamultipla) = 0 AND position(',]' IN rispostamultipla) = 0);
		rispostamultipla = replace(rispostamultipla, '[,', '[');
		rispostamultipla = replace(rispostamultipla, ',]', ']');
	END LOOP;
	
	IF rispostamultipla = '[]' OR rispostamultipla = '[,]' THEN 
		risp_multipla_array := NULL;
	ELSE 
		rispostamultipla := substring(rispostamultipla FROM 2 FOR (char_length(rispostamultipla) - 2));
		risp_multipla_array := string_to_array(rispostamultipla, ',')::numeric[];
		--		raise notice 'risp_multipla_array: %', risp_multipla_array;
 		--		RAISE NOTICE 'risp presenti: %', risp_presenti;
 END IF;
 
 SELECT array_agg(id_risposta_prev)
 FROM entrasp.risposte
 WHERE codice_azienda = codiceazienda
			AND id_modello_test = idmodellotest
			AND id_modello_test_vr = idmodellotestvr
			AND id_sondaggio = idsondaggio
			AND id_somministrazione = idsomministrazione
			AND id_domanda = iddomanda INTO risp_presenti;SELECT ARRAY (
								SELECT unnest(risp_presenti)
								EXCEPT SELECT unnest(risp_multipla_array)
							) INTO risp_da_cancellare;--RAISE NOTICE 'risp da cancellare: %', risp_da_cancellare;
 DELETE
 FROM entrasp.risposte
 WHERE id_risposta_prev = ANY (risp_da_cancellare)
			AND codice_azienda = codiceazienda
			AND id_modello_test = idmodellotest
			AND id_modello_test_vr = idmodellotestvr
			AND id_sondaggio = idsondaggio
			AND id_somministrazione = idsomministrazione
			AND id_domanda = iddomanda;SELECT ARRAY (
								SELECT unnest(risp_multipla_array)
								EXCEPT SELECT unnest(risp_presenti)
							) INTO risp_mancanti;
	--		RAISE NOTICE 'codice_azienda: %, id_modello_test: %, id_modello_test_vr: %, id_sondaggio: %, id_somministrazione: %, id_domanda=%', codiceazienda, idmodellotest, idmodellotestvr, idsondaggio, idsomministrazione, iddomanda;
	--		RAISE NOTICE 'risp mancanti: %', risp_mancanti;

	FOREACH singola_risp IN ARRAY risp_mancanti LOOP 
		SELECT peso
		FROM entrasp.risposte_previste
		WHERE codice_azienda = codiceazienda
			AND id_modello_test = idmodellotest
			AND id_domanda = iddomanda
			AND id_risposta_prev = singola_risp INTO peso_singola_risp;
			
		INSERT INTO entrasp.risposte (codice_azienda, id_modello_test, id_modello_test_vr, id_sondaggio, id_somministrazione, id_domanda, id_risposta_prev, peso, id_risposta, punteggio, note)
		VALUES (codiceazienda, idmodellotest, idmodellotestvr, idsondaggio, idsomministrazione, iddomanda, singola_risp, peso_singola_risp, nextval('entrasp.id_risposta'), punteggio_, note_)
		on conflict do nothing;
	END LOOP;
	
	SELECT coalesce(count(id_risposta), 1)
	FROM entrasp.risposte
	WHERE codice_azienda = codiceazienda
			AND id_domanda = iddomanda
			AND id_modello_test = idmodellotest
			AND id_modello_test_vr = idmodellotestvr INTO num_risp;--raise notice 'num_risp-penalizzazione: %', num_risp||'-'||penalizzazione_;
 	UPDATE entrasp.risposte
	SET penalizzazione = coalesce(penalizzazione_ / NULLIF (num_risp, 0), 0)
	WHERE codice_azienda = codiceazienda
			AND id_sondaggio = idsondaggio
			AND id_somministrazione = idsomministrazione
			AND id_modello_test = idmodellotest
			AND id_modello_test_vr = idmodellotestvr
			AND id_domanda = iddomanda;
	
	UPDATE entrasp.risposte
	SET punteggio = punteggio_,
							note = note_,
							punteggio_risposta = punteggiorisposta + coalesce(penalizzazione, 0)
	WHERE codice_azienda = codiceazienda
			AND id_sondaggio = idsondaggio
			AND id_somministrazione = idsomministrazione
			AND id_modello_test = idmodellotest
			AND id_modello_test_vr = idmodellotestvr
			AND id_domanda = iddomanda;
			--             AND id_risposta = idrisposta;
 --if idrispostaprev is not null then
 --		risp_multipla_array:=array_append(risp_multipla_array, idrispostaprev);
 --end if;
 END IF;

-- query per eliminare le righe doppie

	WITH CTE AS (
	    SELECT
	        codice_azienda,
	        id_modello_test,
	        id_risposta,
	        risposta,
	        id_domanda,
	        id_risposta_prev,
	        object_name,
	        object_key,
	        id_sondaggio,
	        id_somministrazione,
	        punteggio,
	        peso,
	        note,
	        id_modello_test_vr,
	        punteggio_risposta,
	        flag_non_applicabile,
	        numero_allegati,
	        md5,
	        penalizzazione,
	        flag_attiva,
	        num_criticita,
	        id_sezione,
	        risposta_num,
	        risposta_date,
	        ROW_NUMBER() OVER (
	            PARTITION BY codice_azienda, id_sondaggio, id_somministrazione, id_modello_test, id_modello_test_vr, id_domanda, id_risposta_prev
	            ORDER BY (SELECT NULL)  -- per evitare ordinamento specifico e mantenere solo una riga casuale
	        ) AS rn
	    FROM entrasp.risposte
		where codice_azienda=codiceazienda and id_sondaggio=idsondaggio and id_somministrazione=idsomministrazione and id_domanda=iddomanda
	)
	DELETE FROM entrasp.risposte
	WHERE EXISTS (
	    SELECT 1
	    FROM CTE
	    WHERE CTE.codice_azienda = entrasp.risposte.codice_azienda
	      AND CTE.id_sondaggio = entrasp.risposte.id_sondaggio
	      AND CTE.id_somministrazione = entrasp.risposte.id_somministrazione
	      AND CTE.id_modello_test = entrasp.risposte.id_modello_test
	      AND CTE.id_modello_test_vr = entrasp.risposte.id_modello_test_vr
	      AND CTE.id_domanda = entrasp.risposte.id_domanda
	      AND CTE.id_risposta_prev = entrasp.risposte.id_risposta
	      AND CTE.rn > 1
		  AND CTE.codice_azienda=codiceazienda and CTE.id_sondaggio=idsondaggio and CTE.id_somministrazione=idsomministrazione and CTE.id_domanda=iddomanda
	);

END
$BODY$;

ALTER FUNCTION entrasp.risposte_update_insert(character varying, numeric, numeric, numeric, numeric, numeric, numeric, text, numeric, numeric, text, numeric, character varying, numeric, date, numeric, character varying, character varying)
    OWNER TO amedeo;
