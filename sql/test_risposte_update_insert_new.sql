-- FUNCTION: entrasp.risposte_update_insert_new(character varying, numeric, numeric, numeric, numeric, numeric, text, numeric, character varying, numeric, date, numeric)

--DROP FUNCTION IF EXISTS entrasp.risposte_update_insert_new(character varying, numeric, numeric, numeric, numeric, numeric, text, numeric, character varying, numeric, date, numeric);

CREATE OR REPLACE FUNCTION entrasp.risposte_update_insert_new(
	codiceazienda character varying,
	iddomanda numeric,
	idsondaggio numeric,
	idsomministrazione numeric,
	noterisposta text,
	peso_ numeric DEFAULT NULL::numeric,
	rispostamultipla character varying DEFAULT NULL::character varying,
	rispostanum numeric DEFAULT NULL::numeric,
	rispostadate date DEFAULT NULL::date,
	idrispostaprev numeric DEFAULT NULL::numeric,
	idmodellotest numeric DEFAULT NULL::numeric,
	idmodellotestvr numeric DEFAULT NULL::numeric)
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
    punteggio_ numeric;
	idrisposte numeric[];
	num_risp numeric;
		idarg_mt numeric;
		codext_rp varchar;
		crea_nc boolean;
		codcompito varchar;
		idresponsabile numeric;
BEGIN

	SELECT id_modello_test, id_modello_test_vr
	FROM entrasp.sondaggi
	WHERE codice_azienda = codiceazienda
		and id_sondaggio = idsondaggio
		and id_somministrazione=idsomministrazione
	INTO idmodellotest, idmodellotestvr;

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

	SELECT id_risposta
	FROM entrasp.risposte
	WHERE codice_azienda = codiceazienda
		AND id_domanda = iddomanda
		AND id_modello_test = idmodellotest
		AND id_modello_test_vr = idmodellotestvr
		and id_sondaggio = idsondaggio
		and id_somministrazione=idsomministrazione
	INTO idrisposte;

	select cardinality(idrisposte)
	into num_risp;

	
--	raise notice 'itd: %', idtipodomanda;
	peso_oa := peso_;
	peso_ := NULL;
	
	SELECT coalesce(max(id_risposta),0)::integer
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

		/*
		1	radiobutton
		2	checkboxgroup
		3	text
		5	number
		6	date
		7	combobox
		*/

/*
		raise notice 'itd: %', idtipodomanda;
		raise notice 'rd: %', rispostadate;
		raise notice 'rn: %', rispostanum;
		raise notice 'ca: %', codiceazienda;
		raise notice 'r: %', risposta_;

		raise notice 'condizione: %', idrisposta IS NULL AND (idrispostaprev IS NOT NULL OR ((risposta_ IS NOT NULL and risposta_!='') or rispostanum IS NOT NULL or rispostadate IS NOT NULL));
		raise notice 'idrisposta: %', idrisposta; 
		raise notice 'idrispostaprev: %', idrispostaprev; 
		raise notice 'sottocondizione: %',	(risposta_ IS NOT NULL and risposta_!='') or rispostanum IS NOT NULL or rispostadate IS NOT NULL;
		raise notice 'risposta: %', '£'||risposta_||'£';
		raise notice 'rispostanum: %', '£'||rispostanum::varchar||'£';
		raise notice 'rispostadate: %', '£'||rispostadate::varchar||'£';
*/

-- gestione di tutte le risposte diverse da risposta multipla

	IF idtipodomanda in(1, 3, 5, 6, 7) and num_risp=1 THEN 
		UPDATE entrasp.risposte
		SET id_risposta_prev = idrispostaprev,
								risposta = risposta_,
								risposta_date = rispostadate,
								risposta_num=rispostanum,
								object_name = objectname,
								object_key = objectkey,
								punteggio = punteggio_,
								peso = coalesce(peso_, peso_oa),
								note = noterisposta,
								punteggio_risposta = punteggiorisposta + penalizzazione_
		WHERE codice_azienda = codiceazienda
				AND id_sondaggio = idsondaggio
				AND id_somministrazione = idsomministrazione
				AND id_modello_test = idmodellotest
				AND id_modello_test_vr = idmodellotestvr
				AND id_domanda = iddomanda
				AND id_risposta = idrisposta;
		elseif idtipodomanda in(1, 3, 5, 6, 7) and num_risp=0 then
			INSERT INTO entrasp.risposte (codice_azienda, id_modello_test, id_modello_test_vr, id_sondaggio, id_somministrazione, 
				id_domanda, id_risposta_prev, id_risposta, risposta, risposta_date, risposta_num, 
											  note, punteggio, peso, penalizzazione)
			VALUES (codiceazienda, idmodellotest, idmodellotestvr, idsondaggio, idsomministrazione, 
				iddomanda, idrispostaprev, idrispostamax+1, risposta_, rispostadate, rispostanum, 
						noterisposta, punteggio_, coalesce(peso_, peso_oa), coalesce(penalizzazione_, 0)) on conflict do nothing;
	
	end if;

-- gestione della risposta multipla

	IF idtipodomanda=2 THEN 
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
		
		end if;

			-- Step 1: Inserire i valori mancanti utilizzando ROW_NUMBER() per incrementare id_risposta
		    INSERT INTO entrasp.risposte (codice_azienda, id_modello_test, id_modello_test_vr, 
										  id_domanda, id_risposta, id_risposta_prev)
		    SELECT 
		        codiceazienda, 
		        idmodellotest, 
		        idmodellotestvr, 
		        iddomanda,
		        idrispostamax + ROW_NUMBER() OVER (),  -- Incrementa id_risposta in base a row_number
		        idrispostaprev
		    FROM unnest(risp_multipla_array) AS idrispostaprev
		    WHERE id_risposta_prev NOT IN (
		        SELECT id_risposta_prev
		        FROM entrasp.risposte
		        WHERE codice_azienda = codiceazienda
		          AND id_modello_test = idmodellotest
		          AND id_modello_test_vr = idmodellotestvr
		          AND id_domanda = iddomanda
		    );

		    -- Step 2: Eliminare i valori non presenti nell'array
		    DELETE FROM entrasp.risposte
		    WHERE codice_azienda = codiceazienda
		      AND id_modello_test = idmodellotest
		      AND id_modello_test_vr = idmodellotest
		      AND id_domanda = iddomanda
		      AND id_risposta_prev NOT IN (SELECT unnest(risp_multipla_array));
		
	end if;	

--le righe che seguono non dovrebbero servire: sono legate alla vecchia versione ... dove c'era questa pezza
/*
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
*/

END
$BODY$;

ALTER FUNCTION entrasp.risposte_update_insert_new(character varying, numeric, numeric, numeric, text, numeric, character varying, numeric, date, numeric, numeric, numeric)
    OWNER TO postgres;


select entrasp.crea_json_verifica('DEMO', 50, 1, 235, 255)

select id_domanda, descrizione, id_modello_test, id_modello_test_vr
from entrasp.domande dm
where codice_azienda='DEMO' and id_modello_test=50 and id_modello_test_vr=1

select entrasp.risposte_update_insert_new(
codiceazienda=>'DEMO'::varchar,  iddomanda=>3::numeric, 
idsondaggio=>235::numeric, idsomministrazione=>255::numeric, 
rispostadate=>'2024-10-30'::date, peso_=>30
note_=>'risposta di tipo data'::text);

select * from entrasp.risposte where codice_azienda='DEMO' and id_sondaggio=235 and id_somministrazione=255 and id_domanda=3;

select entrasp.risposte_update_insert_new(
codiceazienda=>'DEMO'::varchar,  iddomanda=>4::numeric, 
idsondaggio=>235::numeric, idsomministrazione=>255::numeric, 
rispostanum=>4::numeric, peso_=>40
note_=>'risposta di tipo number'::text);

select * from entrasp.risposte where codice_azienda='DEMO' and id_sondaggio=235 and id_somministrazione=255 and id_domanda=4;
*****

select entrasp.risposte_update_insert_new(
codiceazienda=>'DEMO'::varchar,  iddomanda=>5::numeric, 
idsondaggio=>235::numeric, idsomministrazione=>255::numeric, 
idrispostaprev=>86032::numeric, noterisposta=>'risposta tipo combobox: sì'::text);

select * from entrasp.risposte where codice_azienda='DEMO' and id_sondaggio=235 
and id_somministrazione=255 and id_domanda=5;

delete from entrasp.risposte
where codice_azienda='DEMO' and id_sondaggio=235 and id_somministrazione=255;

select * from entrasp.risposte_previste 
where id_domanda=5 
and codice_azienda='DEMO' and id_modello_test=50 and id_modello_test_vr=1

select * from entrasp.risposte 
where codice_azienda='DEMO' and id_sondaggio=235 and id_somministrazione=255 and id_domanda=5;

*****
select entrasp.risposte_update_insert_new(
codiceazienda=>'DEMO'::varchar,  iddomanda=>6::numeric, 
idsondaggio=>235::numeric, idsomministrazione=>255::numeric, 
peso_=>50,
noterisposta=>'risposta di tipo text modifica'::text);

select * from entrasp.risposte where codice_azienda='DEMO' and id_sondaggio=235 
and id_somministrazione=255 and id_domanda=6;

delete from entrasp.risposte
where codice_azienda='DEMO' and id_sondaggio=235 and id_somministrazione=255;

select * from entrasp.risposte_previste 
where id_domanda=1 
and codice_azienda='DEMO' and id_modello_test=50 and id_modello_test_vr=1

******

select entrasp.risposte_update_insert_new(
codiceazienda=>$codice_azienda$::varchar, iddomanda=>$id_domanda$::numeric, 
idsondaggio=>235::numeric, idsomministrazione=>255::numeric, 
idrispostaprev=>$id_risposta_prev$::numeric, note_=>$note_risposta$::text, peso_=>$peso_ans$);

*****
select entrasp.risposte_update_insert_new(
codiceazienda=>'DEMO'::varchar,  iddomanda=>1::numeric, 
idsondaggio=>235::numeric, idsomministrazione=>255::numeric, 
idrispostaprev=>86024::numeric, noterisposta=>'risposta tipo radio_button: sì'::text);

select * from entrasp.risposte where codice_azienda='DEMO' and id_sondaggio=235 
and id_somministrazione=255 and id_domanda=1;

delete from entrasp.risposte
where codice_azienda='DEMO' and id_sondaggio=235 and id_somministrazione=255;

select * from entrasp.risposte_previste 
where id_domanda=1 
and codice_azienda='DEMO' and id_modello_test=50 and id_modello_test_vr=1


SELECT id_modello_test, id_modello_test_vr
	FROM entrasp.sondaggi
	WHERE codice_azienda = 'DEMO'
		and id_sondaggio = 235


entrasp.risposte_update_insert_new(
	codiceazienda character varying,
	iddomanda numeric,
	idsondaggio numeric,
	idsomministrazione numeric,
	noterisposta text,
	peso_ numeric DEFAULT NULL::numeric,
	rispostamultipla character varying DEFAULT NULL::character varying,
	rispostanum numeric DEFAULT NULL::numeric,
	rispostadate date DEFAULT NULL::date,
	idrispostaprev numeric DEFAULT NULL::numeric,
	idmodellotest numeric DEFAULT NULL::numeric,
	idmodellotestvr numeric DEFAULT NULL::numeric)


