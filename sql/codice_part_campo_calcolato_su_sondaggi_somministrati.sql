ALTER TABLE IF EXISTS entrasp.sondaggi_somministrati DROP COLUMN IF EXISTS codice_part;

ALTER TABLE IF EXISTS entrasp.sondaggi_somministrati
    ADD COLUMN codice_part character varying COLLATE pg_catalog."default" 
	GENERATED ALWAYS AS (entrasp.codice_part_from_azienda(codice_azienda)) STORED;

-- FUNCTION: entrasp.crea_evento(character varying, numeric, date, character varying, text, character varying, numeric, numeric, date, boolean)

-- DROP FUNCTION IF EXISTS entrasp.crea_evento(character varying, numeric, date, character varying, text, character varying, numeric, numeric, date, boolean);

CREATE OR REPLACE FUNCTION entrasp.crea_evento(
	codiceazienda character varying,
	idargomento numeric,
	datascad date DEFAULT CURRENT_DATE,
	_codice character varying DEFAULT NULL::character varying,
	_descrizione text DEFAULT NULL::text,
	codicecompitoparent character varying DEFAULT NULL::numeric,
	idresponsabile numeric DEFAULT NULL::numeric,
	idcentrogest numeric DEFAULT NULL::numeric,
	datarif date DEFAULT NULL::date,
	rigenerato boolean DEFAULT false)
    RETURNS numeric
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
 
 
DECLARE rec record; 
		codicecompito varchar;
		max_snd numeric;
		max_ss numeric;
		idmodellotest numeric;
		idmodellotestvr numeric;
		_titolo text;
		idsomministrazione numeric; 
		idanagrafica numeric;
		codicepart varchar;
		_ideventoparent numeric;
		_idsondaggio numeric;
		idargomentotipoazienda numeric;
		idargomentomt numeric;

BEGIN
	
--	RAISE NOTICE 'START entrasp.crea_evento SU AZIENDA - ARGOMENTO: %', codiceazienda||' '||idargomento;
	
	SELECT id_argomento 
	FROM entrasp.aziende 
	WHERE codice_azienda=codiceazienda 
	INTO idargomentotipoazienda;
	
	SELECT COALESCE( (MAX(codice_compito::numeric)+1)::varchar, '1' )
	FROM entrasp.compiti 
	WHERE codice_azienda=codiceazienda 
	AND textregexeq(codice_compito,'^[[:digit:]]+(\.[[:digit:]]+)?$')=true  
	INTO codicecompito;

	SELECT COALESCE(MAX(id_sondaggio),0) + 1
	FROM entrasp.sondaggi
	WHERE codice_azienda=codiceazienda 
	INTO max_snd;

	SELECT COALESCE(MAX(id_somministrazione),0) + 1
	FROM entrasp.sondaggi_somministrati
	WHERE codice_azienda=codiceazienda 
	INTO max_ss;

	SELECT id_modello_test,id_modello_test_vr,titolo, mt.id_argomento
	FROM entrasp.modelli_test mt 
	LEFT JOIN entrasp.argomenti_eventi ae ON mt.id_argomento=ae.id_argomento_modello_test
	WHERE mt.codice_azienda=codiceazienda 
	AND ae.id_argomento=idargomento
	AND id_modello_test_vr IN (SELECT max(id_modello_test_vr) 
							   FROM entrasp.modelli_test 
							   WHERE codice_azienda=mt.codice_azienda 
							   AND id_modello_test=mt.id_modello_test)
	INTO idmodellotest, idmodellotestvr, _titolo, idargomentomt;

	SELECT id_anagrafica, codice_part 
	FROM entrasp.aziende 
	WHERE codice_azienda=codiceazienda
	INTO idanagrafica, codicepart;
	
	/*IF (SELECT flag_scadenza_fissa FROM entrasp.argomenti_eventi WHERE id_argomento=idargomento) THEN
		datascad := (SELECT 
					(
						COALESCE( EXTRACT (YEAR FROM datascad),EXTRACT (YEAR FROM CURRENT_DATE))||'-'||
						EXTRACT(MONTH FROM data_evento)||'-'||
						EXTRACT(DAY FROM data_evento)
					)::DATE
					FROM entrasp.argomenti_eventi 
					WHERE id_argomento=idargomento);
		
		RAISE NOTICE 'Data scadenza fissa: %', datascad;
		
	ELSE*/
	
	datascad := COALESCE(datascad,CURRENT_DATE);
	
	/*END IF;*/
	
	IF (SELECT flag_scadenza_fissa 
		FROM entrasp.argomenti_eventi 
		WHERE id_argomento = idargomento) THEN
		
		/***** Sono nel caso in cui L'EVENTO E' FISSO durante l'anno, come il Natale *****/
		
		SELECT 
					( COALESCE( EXTRACT (YEAR FROM datascad),EXTRACT (YEAR FROM CURRENT_DATE))||'-'||
					  EXTRACT(MONTH FROM data_evento)||'-'||
					  EXTRACT(DAY FROM data_evento)
					)::DATE
					FROM entrasp.argomenti_eventi 
					WHERE id_argomento=idargomento
		into datascad;

--		RAISE NOTICE 'Data scadenza fissa: %', datascad;

		INSERT INTO entrasp.sondaggi(
		codice_azienda, id_sondaggio, descrizione, id_modello_test, stato, id_centro_gest, data_comp, id_modello_test_vr, titolo_cartella,
			titolo, flag_mono_somministrazione, data_prevista, data_riferimento_a)
		SELECT codiceazienda, max_snd, arg.descrizione, idmodellotest, 'S', 0, (SELECT ENTRASP.LAST_DAY_YEAR(CURRENT_DATE)) , idmodellotestvr, arg.codice,
		LEFT(arg.descrizione||' al '||data_evento::date||' - '||_titolo,239), false, datascad, datarif
		FROM entrasp.argomenti arg 
		INNER JOIN entrasp.argomenti_eventi ae ON arg.id_argomento=ae.id_argomento
		WHERE arg.id_argomento = idargomento
		RETURNING id_sondaggio 
		INTO _idsondaggio;

		INSERT INTO entrasp.sondaggi_somministrati(
		codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione, id_anagrafica, object_name, object_key, id_modello_test, object_description, stato)
		SELECT codiceazienda, _idsondaggio, max_ss, data_evento, idanagrafica, 'anagraficheId', codicepart||'|'||idanagrafica, idmodellotest, (SELECT entrasp.anagrafiche_vr_dati_identificativi(codicepart, idanagrafica)), 'S'
		FROM entrasp.argomenti arg 
		INNER JOIN entrasp.argomenti_eventi ae ON arg.id_argomento=ae.id_argomento
		WHERE arg.id_argomento = idargomento
		RETURNING id_somministrazione INTO idsomministrazione;

		INSERT INTO entrasp.compiti(
		id_tipo_segnalazione,codice_azienda, codice_compito,  data_segnalazione, foreseen_date, titolo, stato, id_argomento_tipo_evento, id_sondaggio, id_responsabile, id_centro_gest) 
		SELECT 701,codiceazienda, codicecompito, datascad, datascad,  LEFT(COALESCE(_descrizione||'-','')||arg.descrizione,99), 'A', arg.id_argomento, _idsondaggio, idresponsabile, idcentrogest
		FROM entrasp.argomenti arg 
		INNER JOIN entrasp.argomenti_eventi ae ON arg.id_argomento=ae.id_argomento
		WHERE arg.id_argomento = idargomento;
		
	ELSE

--		raise notice 'idargomento:%', idargomento;
		--Controllo se l'argomento dell'evento da creare ha figli 
		IF (SELECT count(id_argomento_son) > 0  
			FROM entrasp.argomenti_argomenti 
			WHERE id_argomento_father = idargomento) THEN

			/***** EVENTO CON FIGLI *****/
			
			--Non inserisco il sondaggio associato all'evento, a meno che non sia un figlio di un altro evento, a condizione che sia figlio della tipologia di azienda
			
			RAISE NOTICE 'ARGOMENTO CON FIGLI: %', idargomento;
			
				IF idargomentotipoazienda IS NOT NULL
				   AND idargomento NOT IN (SELECT id_argomento_son 
									   FROM entrasp.argomenti_argomenti 
									   WHERE id_argomento_father = idargomentotipoazienda) 
				   AND (SELECT COUNT(id_argomento_father)>0 
						FROM entrasp.argomenti_argomenti 
						WHERE id_argomento_son=idargomento 
						AND id_argomento_father IN (SELECT id_argomento_son FROM entrasp.argomenti_argomenti WHERE id_argomento_father = 133))
				   THEN

					--Situazione in cui l'evento da generare non è appartenente a questo tipo di azienda, quindi non genero
					RAISE NOTICE 'NON CREO %', idargomento;
					RETURN 0;

				END IF;
			
				IF idargomento IN (SELECT DISTINCT id_argomento_son 
							   FROM entrasp.argomenti_argomenti 
							   WHERE id_argomento_father IN (SELECT id_argomento_son FROM entrasp.argomenti_argomenti WHERE id_argomento_father=45417)) THEN
				
				/***** SE L'ARGOMENTO OLTRE AD AVERE FIGLI (SCATENANTE) E' GENERATO DA UN ALTRO EVENTO, DEVO ASSOCIARGLI COMUNQUE UN SONDAGGIO *****/
				
--				raise notice 'datascad: %', datascad;
				
					INSERT INTO entrasp.sondaggi(
					codice_azienda, id_sondaggio, descrizione, id_modello_test, stato, id_centro_gest, 
						data_comp, data_riferimento_a, 
						id_modello_test_vr, titolo, flag_mono_somministrazione, 
						data_prevista, titolo_cartella)
					SELECT codiceazienda, max_snd, arg.descrizione, idmodellotest, 'S', 0, 
					(SELECT ENTRASP.LAST_DAY_YEAR(CURRENT_DATE)), datarif+ (ae.interval_multiplier||''||ae.interval_value)::interval,
					idmodellotestvr, LEFT(arg.descrizione||' al '||(coalesce(datarif, datascad) + (ae.interval_multiplier||''||ae.interval_value)::interval)::date||' - '||_titolo,239), false,  
					datascad + (ae.interval_multiplier||''||ae.interval_value)::interval, arg.codice
					FROM entrasp.argomenti arg 
					INNER JOIN entrasp.argomenti_eventi ae ON arg.id_argomento=ae.id_argomento
					WHERE arg.id_argomento = idargomento
					RETURNING id_sondaggio 
					INTO _idsondaggio;

					INSERT INTO entrasp.sondaggi_somministrati(
					codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione, id_anagrafica, 
						object_name, object_key, id_modello_test, 
						object_description, stato)
					SELECT codiceazienda, _idsondaggio, max_ss, datascad + (ae.interval_multiplier||''||ae.interval_value)::interval, idanagrafica, 
					'anagraficheId', codicepart||'|'||idanagrafica, idmodellotest, 
					(SELECT entrasp.anagrafiche_vr_dati_identificativi(codicepart, idanagrafica)), 'S'
					FROM entrasp.argomenti arg 
					INNER JOIN entrasp.argomenti_eventi ae ON arg.id_argomento=ae.id_argomento
					WHERE arg.id_argomento = idargomento
					RETURNING id_somministrazione 
					INTO idsomministrazione;

					INSERT INTO entrasp.compiti(id_tipo_segnalazione,codice_azienda, codice_compito, codice_compito_parent, 
												data_segnalazione, foreseen_date, data_competenza,
												titolo, stato, 
												id_argomento_tipo_evento, id_sondaggio, id_responsabile, id_centro_gest)
					SELECT 701,codiceazienda, codicecompito, codicecompitoparent, 
					datascad, datascad + (ae.interval_multiplier||''||ae.interval_value)::interval, datarif + (ae.interval_multiplier||''||ae.interval_value)::interval, 
					COALESCE(_descrizione||'-','')||arg.descrizione, 'A', 
					arg.id_argomento, _idsondaggio, idresponsabile, idcentrogest
					FROM entrasp.argomenti arg 
					INNER JOIN entrasp.argomenti_eventi ae ON arg.id_argomento=ae.id_argomento
					WHERE arg.id_argomento = idargomento;
			
				ELSE			

					/***** L'ARGOMENTO E' UN EVENTO ORIGINE PURO, QUINDI INSERISCO SOLO IL COMPITO *****/
					raise notice 'evento puro';
					INSERT INTO entrasp.compiti(
					id_tipo_segnalazione, codice_azienda, codice_compito, data_ins, data_segnalazione, stato, data_competenza,
						titolo, id_argomento_tipo_evento, id_responsabile, id_centro_gest)
					SELECT 701,codiceazienda, codicecompito, CURRENT_DATE, datascad, 'A', datarif,
					LEFT(COALESCE(_descrizione||'-','')||arg.descrizione,99), arg.id_argomento, idresponsabile, idcentrogest
					FROM entrasp.argomenti arg
					WHERE arg.id_argomento = idargomento;
			
				END IF;

			/***** INSERISCO L'EVENTO PER OGNI FIGLIO *****/
				FOR rec IN (SELECT id_argomento_son FROM entrasp.argomenti_argomenti WHERE id_argomento_father = idargomento) LOOP
					raise notice 'errore?';
					PERFORM entrasp.crea_evento(codiceazienda, rec.id_argomento_son, COALESCE( datascad + (ae.interval_multiplier||''||ae.interval_value)::interval,datascad )::date, _codice, _descrizione, codicecompito)
					FROM entrasp.argomenti arg 
					INNER JOIN entrasp.argomenti_eventi ae ON arg.id_argomento=ae.id_argomento
					WHERE arg.id_argomento = idargomento;
				END LOOP;

		ELSE
			
			/***** L'ARGOMENTO NON HA FIGLI *****/
			raise notice 'argomento senza figli';
			IF idargomentotipoazienda IS NOT NULL
			   AND idargomento NOT IN (SELECT id_argomento_son 
								   FROM entrasp.argomenti_argomenti 
								   WHERE id_argomento_father = idargomentotipoazienda) 
			   AND (SELECT COUNT(id_argomento_father)>0 
					FROM entrasp.argomenti_argomenti 
					WHERE id_argomento_son=idargomento 
					AND id_argomento_father IN (SELECT id_argomento_son FROM entrasp.argomenti_argomenti WHERE id_argomento_father = 133))
			   THEN

				--Situazione in cui l'evento da generare non è appartenente a questo tipo di azienda, quindi non genero
				RAISE NOTICE 'NON CREO %', idargomento;
				RETURN 0;

			END IF;
			/* codice oridginario di Davide che inseriva direttamente sondaggi e somministrazione. 
			Amedeo al fine di sfruttare la logica già sviluppata per i sondaggi ha deciso di seguire quella (sondaggio multiplo e singolo)
			
			INSERT INTO entrasp.sondaggi(
			codice_azienda, id_sondaggio, descrizione, id_modello_test, stato, id_centro_gest, 
				data_comp, id_modello_test_vr, 
				titolo, titolo_cartella, 
				flag_mono_somministrazione, data_prevista, data_riferimento_a)
			SELECT codiceazienda, max_snd, arg.descrizione, idmodellotest, 'S', 0, 
			(SELECT ENTRASP.LAST_DAY_YEAR(CURRENT_DATE)) , idmodellotestvr, 
			LEFT(arg.descrizione||' al '|| (datascad + (ae.interval_multiplier||''||ae.interval_value)::interval)::date||' - '||_titolo,239), arg.codice,
			false,  datascad + (ae.interval_multiplier||''||ae.interval_value)::interval, datarif + (ae.interval_multiplier||''||ae.interval_value)::interval 
			FROM entrasp.argomenti arg 
			INNER JOIN entrasp.argomenti_eventi ae ON arg.id_argomento=ae.id_argomento
			WHERE arg.id_argomento = idargomento
			RETURNING id_sondaggio 
			INTO _idsondaggio;

			INSERT INTO entrasp.sondaggi_somministrati(
			codice_azienda, id_sondaggio, id_somministrazione, 
			data_esecuzione, id_anagrafica, object_name, object_key, id_modello_test, object_description, stato, codice_part)
			SELECT codiceazienda, _idsondaggio, max_ss, 
			datascad + (ae.interval_multiplier||''||ae.interval_value)::interval, idanagrafica, 'anagraficheId', codicepart||'|'||idanagrafica, idmodellotest, (SELECT entrasp.anagrafiche_vr_dati_identificativi(codicepart, idanagrafica)), 'S', codicepart
			FROM entrasp.argomenti arg 
			INNER JOIN entrasp.argomenti_eventi ae ON arg.id_argomento=ae.id_argomento
			WHERE arg.id_argomento = idargomento
			RETURNING id_somministrazione INTO idsomministrazione;
			*/
			-- il primo giro prendo la scadenza che mi genera il programma
			
			if rigenerato=true then
				
				select datascad + (ae.interval_multiplier||''||ae.interval_value)::interval, 
				datarif + (ae.interval_multiplier||''||ae.interval_value)::interval,
				LEFT(arg.descrizione||' al '|| (datarif + (ae.interval_multiplier||''||ae.interval_value)::interval)::date||' - '||_titolo,239)													
				FROM entrasp.argomenti arg 
				INNER JOIN entrasp.argomenti_eventi ae ON arg.id_argomento=ae.id_argomento
				WHERE arg.id_argomento = idargomento
				into datascad, datarif, _titolo;			
			
				else
				
				select LEFT(arg.descrizione||' al '||datarif ||' - '||_titolo,239)													
				FROM entrasp.argomenti arg 
				INNER JOIN entrasp.argomenti_eventi ae ON arg.id_argomento=ae.id_argomento
				WHERE arg.id_argomento = idargomento
				into _titolo;			
			
			end if;
			
			RAISE NOTICE 'datascad: %', datascad;
			
			-- Se il modello test è astrattamente multiplo lo creo multiplo altrimenti lo creo singolo
			
			
			raise notice 'idargomentomt: %', idargomentomt;
			
			--if idargomentomt in(301, 6723, 6724, 6725, 43561, 43567, 45083, 45421, 45764) then
				
				
				select crea_sondaggio_multiplo as new_id_sondaggio 
				from entrasp.crea_sondaggio_multiplo(codiceazienda, idmodellotest, 
				dataprevista=> datascad, datariferimento=> datarif,	titolo_=> _titolo, 
													 idargomentoevento=>idargomento)													
				into _idsondaggio;
				
				/*
				select coalesce(id_somministrazione, 0)
				from entrasp.sondaggi where codice_azienda=codiceazienda and id_sondaggio=_idsondaggio limit 1
				*/
			
			/*
				else
			
				select idsnd, idss
				from entrasp.crea_singola_verifica(codiceazienda, idmodellotest,
				dataprevista=> datascad, datariferimento=> datarif,	titolo_=> _titolo)								  
				into _idsondaggio, idsomministrazione;
			
			end if;
			*/

			INSERT INTO entrasp.compiti(id_tipo_segnalazione,codice_azienda, codice_compito, codice_compito_parent, 
										data_segnalazione, foreseen_date, data_competenza, 
										titolo, stato, id_argomento_tipo_evento, id_sondaggio, id_responsabile, id_centro_gest)
			SELECT 701,codiceazienda, codicecompito, codicecompitoparent, 
			datascad, datascad , datarif,  
			_titolo, 'A', arg.id_argomento, _idsondaggio, idresponsabile, idcentrogest
			FROM entrasp.argomenti arg 
			INNER JOIN entrasp.argomenti_eventi ae ON arg.id_argomento=ae.id_argomento
			WHERE arg.id_argomento = idargomento;

		END IF;
	END IF;
	
	RETURN 1;

END
 
 
$BODY$;

ALTER FUNCTION entrasp.crea_evento(character varying, numeric, date, character varying, text, character varying, numeric, numeric, date, boolean)
    OWNER TO postgres;

-- FUNCTION: entrasp.duplica_somministrazione(character varying, numeric)

-- DROP FUNCTION IF EXISTS entrasp.duplica_somministrazione(character varying, numeric);

CREATE OR REPLACE FUNCTION entrasp.duplica_somministrazione(
	p_codice_azienda character varying,
	p_idsomministrazione numeric)
    RETURNS TABLE(codice_azienda_result character varying, id_somministrazione_result numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
    max_idsomministrazione numeric; 
BEGIN
    SELECT max(id_somministrazione) 
    INTO max_idsomministrazione 
    FROM entrasp.sondaggi_somministrati 
    WHERE codice_azienda = p_codice_azienda;

    INSERT INTO entrasp.sondaggi_somministrati (
        codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione, id_anagrafica, object_name, object_key, 
        id_modello_test, id_sottomodello, object_description, punteggio_massimo, punteggio_ottenuto, stato, id_risultato, 
        note, pct_da, pct_da_manuale, id_modello_test_vr, id_somministrazione_prec
    )
    SELECT 
        codice_azienda, id_sondaggio, max_idsomministrazione + 1, data_esecuzione, id_anagrafica, object_name, object_key, 
        id_modello_test, id_sottomodello, object_description, punteggio_massimo, punteggio_ottenuto, stato, id_risultato, 
        note, pct_da, pct_da_manuale, id_modello_test_vr, id_somministrazione_prec
    FROM entrasp.sondaggi_somministrati 
    WHERE codice_azienda = p_codice_azienda AND id_somministrazione = p_idsomministrazione;

    RETURN QUERY SELECT p_codice_azienda, p_idsomministrazione; 
END;
$BODY$;

ALTER FUNCTION entrasp.duplica_somministrazione(character varying, numeric)
    OWNER TO postgres;

-- FUNCTION: entrasp.duplica_somministrazione(character varying, numeric)

-- DROP FUNCTION IF EXISTS entrasp.duplica_somministrazione(character varying, numeric);

CREATE OR REPLACE FUNCTION entrasp.duplica_somministrazione(
	p_codice_azienda character varying,
	p_idsomministrazione numeric)
    RETURNS TABLE(codice_azienda_result character varying, id_somministrazione_result numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
    max_idsomministrazione numeric; 
BEGIN
    SELECT max(id_somministrazione) 
    INTO max_idsomministrazione 
    FROM entrasp.sondaggi_somministrati 
    WHERE codice_azienda = p_codice_azienda;

    INSERT INTO entrasp.sondaggi_somministrati (
        codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione, id_anagrafica, object_name, object_key, 
        id_modello_test, id_sottomodello, object_description, punteggio_massimo, punteggio_ottenuto, stato, id_risultato, 
        note, pct_da, pct_da_manuale, id_modello_test_vr, id_somministrazione_prec
    )
    SELECT 
        codice_azienda, id_sondaggio, max_idsomministrazione + 1, data_esecuzione, id_anagrafica, object_name, object_key, 
        id_modello_test, id_sottomodello, object_description, punteggio_massimo, punteggio_ottenuto, stato, id_risultato, 
        note, pct_da, pct_da_manuale, id_modello_test_vr, id_somministrazione_prec
    FROM entrasp.sondaggi_somministrati 
    WHERE codice_azienda = p_codice_azienda AND id_somministrazione = p_idsomministrazione;

    RETURN QUERY SELECT p_codice_azienda, p_idsomministrazione; 
END;
$BODY$;

ALTER FUNCTION entrasp.duplica_somministrazione(character varying, numeric)
    OWNER TO postgres;

-- FUNCTION: entrasp.grc_accoda_singolo_sondaggio_stessa_azienda(text, numeric, boolean, numeric, interval, integer, boolean)

-- DROP FUNCTION IF EXISTS entrasp.grc_accoda_singolo_sondaggio_stessa_azienda(text, numeric, boolean, numeric, interval, integer, boolean);

CREATE OR REPLACE FUNCTION entrasp.grc_accoda_singolo_sondaggio_stessa_azienda(
	codiceazienda text,
	idsondaggio numeric,
	insert_allegati boolean DEFAULT false,
	idprogetto numeric DEFAULT NULL::numeric,
	interval_value interval DEFAULT NULL::interval,
	interval_multiplier integer DEFAULT NULL::integer,
	conrisposte boolean DEFAULT true)
    RETURNS TABLE(idnew numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
 
declare max_somministrazione integer; max_sondaggio integer; nomeseq varchar(200); tempo integer; Rec record; Rec1 record; Rec2 record;
idmodellotest numeric; idmodellotestvr numeric; idmodellotestvr_new numeric; 
max_id_risposta integer; max_id_risorsa numeric; conta_sondaggi numeric;
conta_somministazioni numeric; idsondaggio_ numeric; max_prog_revisione numeric; 
idsomministrazione_ numeric; idprogetto_ varchar;

begin
select max(id_sondaggio) as massimo2 from entrasp.sondaggi where codice_azienda= $1 into max_sondaggio;
select max(id_somministrazione) as massimo2 from entrasp.sondaggi_somministrati where codice_azienda= $1 into max_somministrazione;
select max(id_risposta) from entrasp.risposte where codice_azienda= $1 into max_id_risposta;

nomeseq:='entrasp.id_somministrazione';
perform setval(nomeseq, max_somministrazione);
nomeseq:='entrasp.id_risposta';
perform setval(nomeseq, max_id_risposta);

select id_modello_test, id_modello_test_vr 
from entrasp.sondaggi 
where codice_azienda=codiceazienda and id_sondaggio=idsondaggio into idmodellotest, idmodellotestvr;

select max(id_modello_test_vr) 
from entrasp.modelli_test_vr 
where codice_azienda=codiceazienda and id_modello_test=idmodellotest into idmodellotestvr_new;

INSERT INTO entrasp.sondaggi (codice_azienda, id_sondaggio, descrizione, data_rilevazione_da, data_rilevazione_a, object_name, 
							  id_modello_test, object_key, stato, data_prevista, data_esecuzione, 
							  codice_part, id_gruppo_lavoro, id_centro_gest, flag_utenti, id_anagrafica, id_contratto,
							  data_comp, id_modello_test_vr, data_riferimento_da, data_riferimento_a,  titolo, id_serie, 
							  selezione_campione, documentazione_analizzata, metodologia_presentazione_risultati) 
SELECT $1,max_sondaggio+1, descrizione, data_rilevazione_da, data_rilevazione_a, object_name, 
idmodellotest, object_key, 'P', coalesce(data_prevista+interval_value*interval_multiplier, current_date), null::date, 
codice_part, id_gruppo_lavoro, id_centro_gest, flag_utenti, id_anagrafica,  id_contratto,
coalesce(data_comp+interval_value*interval_multiplier, current_date), idmodellotestvr_new, data_riferimento_da, data_riferimento_a, left('XXXX'||coalesce(titolo,'')||'XXXX', 240), id_serie, 
'XXXX'||coalesce(selezione_campione,'')||'XXXX', 'XXXX'||coalesce(documentazione_analizzata,'')||'XXXX', 'XXXX'||coalesce(metodologia_presentazione_risultati,'')||'XXXX'
from entrasp.sondaggi
where codice_azienda=$1 and id_sondaggio=$2;

INSERT INTO entrasp.sondaggi_somministrati (codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione, id_anagrafica, object_name, object_key, 
											id_modello_test, id_sottomodello, object_description, punteggio_massimo, punteggio_ottenuto, stato, id_risultato, 
											note, pct_da, pct_da_manuale, id_modello_test_vr, id_somministrazione_prec) 
SELECT $1,max_sondaggio+1, nextval('entrasp.id_somministrazione'), current_date, ss.id_anagrafica, ss.object_name, ss.object_key, 
idmodellotest, ss.id_sottomodello, ss.object_description, ss.punteggio_massimo, ss.punteggio_ottenuto, 'P', ss.id_risultato, 
'XXXX'||coalesce(ss.note,'')||'XXXX', ss.pct_da, ss.pct_da_manuale, idmodellotestvr_new, ss.id_somministrazione
from entrasp.sondaggi_somministrati ss
where codice_azienda=$1 and id_sondaggio=$2;

--INSERT INTO entrasp.sondaggi_somministrati_oggetti_considerati(codice_azienda, id_sondaggio, id_somministrazione, object_name, object_key, object_description) 
--SELECT $1,max_sondaggio+1,max_somministrazione+1 , object_name, object_key, object_description
--from entrasp.sondaggi_somministrati_oggetti_considerati
--where codice_azienda=$1 and id_sondaggio=$2;

--raise notice 'ca: %', codiceazienda; 
--raise notice 'idmdt: %', idmodellotest; 
--raise notice 'idmdt: %', idmodellotestvr;

if conrisposte then

	INSERT INTO entrasp.risposte(codice_azienda, id_modello_test, id_risposta, risposta, id_domanda, id_risposta_prev, object_name, object_key, id_sondaggio, 
								 id_somministrazione, 
								 punteggio, peso, note, id_modello_test_vr, punteggio_risposta) 
	SELECT $1, idmodellotest, nextval('entrasp.id_risposta'), rp.risposta, rp.id_domanda, rp.id_risposta_prev, rp.object_name, rp.object_key, max_sondaggio+1, 
	(select ss2.id_somministrazione from entrasp.sondaggi_somministrati ss2 
	 where ss2.codice_azienda=codiceazienda and ss2.id_sondaggio=max_sondaggio+1 and ss2.object_key=ss.object_key limit 1), 
	 rp.punteggio, rp.peso, 'XXXX'||coalesce(rp.note,'')||'XXXX', idmodellotestvr_new, rp.punteggio_risposta 
	from entrasp.risposte rp inner join entrasp.sondaggi_somministrati ss on rp.codice_azienda=ss.codice_azienda and rp.id_somministrazione=ss.id_somministrazione
	where ss.codice_azienda=$1 AND ss.id_sondaggio=idsondaggio
	and rp.codice_azienda||'-'||rp.id_modello_test||'-'||rp.id_domanda||'-'||rp.id_risposta_prev in (
			select rprev.codice_azienda||'-'||rprev.id_modello_test||'-'||rprev.id_domanda||'-'||rprev.id_risposta_prev
			from entrasp.risposte_previste rprev
			where rprev.codice_azienda=codiceazienda and rprev.id_modello_test=idmodellotest 
			and rprev.id_modello_test_vr=idmodellotestvr_new and rprev.id_risposta_prev is not null
								);
end if;
--id_sondaggio_new
idsondaggio_ := max_sondaggio+1;

--INSERT REVISIONI (da somministrazioni) -- Per ogni documento di ogni somministrazione originale
--Davide added last inner join to check if risorsa existed
FOR Rec in(SELECT DISTINCT a.id_somministrazione,a.object_key,b.id_risorsa,b.prog_revisione 
		   from entrasp.sondaggi_somministrati a 
		   inner join  entrasp.cdms_risorse_oggetti b on a.codice_azienda=b.codice_azienda and a.id_sondaggio=b.id_sondaggio and a.id_somministrazione=b.id_somministrazione
		   inner join entrasp.cdms_risorse_revisioni c on b.codice_azienda=c.codice_azienda and b.id_risorsa=c.id_risorsa and b.prog_revisione=c.prog_revisione
		   INNER JOIN entrasp.cdms_risorse ris ON ris.codice_azienda=c.codice_azienda AND ris.id_risorsa=c.id_risorsa
		   where a.codice_azienda=$1 and a.id_sondaggio=$2 and b.nome_business_object='sondaggiSomministrati') LOOP

	select max(prog_revisione)+1 from entrasp.cdms_risorse_revisioni where codice_azienda=$1 and id_risorsa=Rec.id_risorsa into max_prog_revisione;
	
	/*raise notice 'ciclo 1 %', Rec.id_somministrazione;
	raise notice 'SND%', $2;
	raise notice 'rsr%', Rec.id_risorsa;
	raise notice 'pvr%', max_prog_revisione;*/
	
	INSERT INTO entrasp.cdms_risorse_revisioni(codice_azienda, id_risorsa, prog_revisione, data_creazione, file_id, client_file_name, content_type, descrizione, data_rif, revisore, id_argomento_stato)
	select $1, Rec.id_risorsa, max_prog_revisione, current_date,
	( select (coalesce((select max(rev.file_id)::numeric from entrasp.cdms_risorse_revisioni rev where file_id ~ '^[0-9\.]+$'),0))::numeric 
 	+ ROW_NUMBER() OVER(order by id_risorsa) from entrasp.cdms_risorse_revisioni order by id_risorsa desc limit 1)::varchar,
	'tbd','tbd', 'XXX'||a.descrizione||'XXX', coalesce(a.data_rif + interval_value*interval_multiplier, a.data_rif+'1 year'), a.revisore, 6150  --6150=DA DEFINIRE
	from entrasp.cdms_risorse_revisioni a inner join entrasp.cdms_risorse_oggetti b on a.codice_azienda=b.codice_azienda and a.id_risorsa=b.id_risorsa and a.prog_revisione=b.prog_revisione
	where a.id_risorsa=Rec.id_risorsa and b.codice_azienda=$1 and b.id_sondaggio=$2 and b.id_somministrazione=Rec.id_somministrazione and a.prog_revisione=Rec.prog_revisione 
	group by a.id_risorsa,a.descrizione,a.data_rif,a.revisore; 	
					 
	select ss.id_somministrazione from entrasp.sondaggi_somministrati ss where ss.codice_azienda=$1 and ss.id_sondaggio=idsondaggio_ /*max_sondaggio+1*/ and ss.object_key=Rec.object_key limit 1 into idsomministrazione_;
	
	INSERT INTO entrasp.cdms_risorse_oggetti (codice_azienda, id_risorsa, prog_revisione, nome_business_object, chiave, id_sondaggio, id_somministrazione, id_modello_test, id_modello_test_vr, id_progetto, oggetto_cancellato, da_classificare)
	SELECT DISTINCT $1, Rec.id_risorsa, max_prog_revisione, nome_business_object, codiceazienda||'^'||idsondaggio_::varchar||'^'||idsomministrazione_::varchar, idsondaggio_, idsomministrazione_ , idmodellotest , idmodellotestvr_new, idprogetto, false, false
	from entrasp.cdms_risorse_oggetti where codice_azienda=$1 and id_sondaggio=$2 and id_somministrazione=Rec.id_somministrazione AND nome_business_object != 'sondaggi';
	
	PERFORM entrasp.calcola_id_argomento_stato($1, Rec.id_risorsa, true);
	
END LOOP;

--SE SOLO SU SONDAGGIO(ovvero doc con flag_applicazione_singola a '1')
FOR Rec2 in(SELECT distinct a.codice_azienda,a.id_risorsa,a.prog_revisione,b.descrizione,b.data_rif,b.revisore 
			from entrasp.cdms_risorse_oggetti a inner join entrasp.cdms_risorse_revisioni b on a.codice_azienda=b.codice_azienda and a.id_risorsa=b.id_risorsa and a.prog_revisione=b.prog_revisione 
			inner join entrasp.cdms_risorse c on b.id_risorsa=c.id_risorsa and b.codice_azienda=c.codice_azienda
			where a.codice_azienda=$1 and a.id_sondaggio=$2 and nome_business_object = 'sondaggi'
			and c.id_argomento_tipo_allegato in (select id_argomento_documento 
												 from entrasp.modelli_test_argomenti_documenti 
												 where codice_azienda=$1
												 and id_modello_test=(select id_modello_test from entrasp.sondaggi where codice_azienda=$1 and id_sondaggio=$2)
												 and flag_applicazione_singola='1'
												)
			) LOOP

	select max(prog_revisione)+1 from entrasp.cdms_risorse_revisioni where codice_azienda=$1 and id_risorsa=Rec2.id_risorsa into max_prog_revisione;

--	raise notice 'ciclo 2';
--	raise notice 'SND%', $2;
--	raise notice 'rsr%', Rec2.id_risorsa;
--	raise notice 'pvr%', max_prog_revisione;

	INSERT INTO entrasp.cdms_risorse_revisioni(codice_azienda, id_risorsa, prog_revisione, data_creazione, file_id, client_file_name, content_type, descrizione, data_rif, revisore, id_argomento_stato)
	select $1, Rec2.id_risorsa, max_prog_revisione, current_date,
	( select (coalesce((select max(rev.file_id)::numeric from entrasp.cdms_risorse_revisioni rev where file_id ~ '^[0-9\.]+$'),0))::numeric 
	+ ROW_NUMBER() OVER(order by id_risorsa) from entrasp.cdms_risorse_revisioni order by id_risorsa desc limit 1)::varchar,
	'tbd','tbd', 'XXX'||Rec2.descrizione||'XXX', Rec2.data_rif + interval '1 year', Rec2.revisore, 6150;  --6150=DA DEFINIRE

	INSERT INTO entrasp.cdms_risorse_oggetti (codice_azienda, id_risorsa, prog_revisione, nome_business_object, chiave, id_sondaggio, id_modello_test, id_modello_test_vr, id_progetto, oggetto_cancellato, da_classificare)
	SELECT DISTINCT $1, id_risorsa, max_prog_revisione, nome_business_object, codiceazienda||'^'||idsondaggio_::varchar, idsondaggio_, idmodellotest , idmodellotestvr_new,idprogetto,  false, false
	from entrasp.cdms_risorse_oggetti where codice_azienda=$1 and id_risorsa=Rec2.id_risorsa and prog_revisione=Rec2.prog_revisione;

	PERFORM entrasp.calcola_id_argomento_stato($1, Rec2.id_risorsa, true);

END LOOP;
--END IF;

return query select id_sondaggio from entrasp.sondaggi where id_sondaggio=max_sondaggio+1  and codice_azienda=codiceazienda;

end
 
$BODY$;

ALTER FUNCTION entrasp.grc_accoda_singolo_sondaggio_stessa_azienda(text, numeric, boolean, numeric, interval, integer, boolean)
    OWNER TO postgres;

-- FUNCTION: entrasp.grc_accoda_sondaggiecollegati(text, text)

-- DROP FUNCTION IF EXISTS entrasp.grc_accoda_sondaggiecollegati(text, text);

CREATE OR REPLACE FUNCTION entrasp.grc_accoda_sondaggiecollegati(
	"AziendaSorgente" text,
	"AziendaDestinataria" text)
    RETURNS void
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$

INSERT INTO entrasp.sondaggi (codice_azienda, id_sondaggio, descrizione, data_rilevazione_da, data_rilevazione_a, object_name, id_modello_test, object_key, stato, data_prevista, data_esecuzione, codice_part, id_gruppo_lavoro, id_centro_gest, flag_utenti, id_anagrafica, data_comp, id_modello_test_vr, data_riferimento_da, data_riferimento_a, id_somministrazione, titolo, id_serie, selezione_campione, documentazione_analizzata, metodologia_presentazione_risultati) 
SELECT $2,entrasp.grc_sondaggio_piu_1($2), descrizione, data_rilevazione_da, data_rilevazione_a, object_name, entrasp.grc_id_mdt($1,$2,id_modello_test,id_modello_test_vr), object_key, stato, data_prevista, data_esecuzione, codice_part, id_gruppo_lavoro, id_centro_gest, flag_utenti, id_anagrafica, data_comp, id_modello_test_vr, data_riferimento_da, data_riferimento_a, id_somministrazione, titolo, id_serie, selezione_campione, documentazione_analizzata, metodologia_presentazione_risultati
from entrasp.sondaggi
where codice_azienda=$1;

INSERT INTO entrasp.sondaggi_somministrati (codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione, id_anagrafica, object_name, object_key, id_modello_test, id_sottomodello, object_description, punteggio_massimo, punteggio_ottenuto, stato, id_risultato,  id_sondaggio_succ, id_somministrazione_succ, note, pct_da, pct_da_manuale, id_modello_test_vr) 
SELECT $2,entrasp.grc_id_sondaggio($1,$2,id_sondaggio), id_somministrazione, data_esecuzione, id_anagrafica, object_name, object_key, entrasp.grc_id_mdt($1,$2,id_modello_test,id_modello_test_vr), id_sottomodello, object_description, punteggio_massimo, punteggio_ottenuto, stato, id_risultato, id_sondaggio_succ, id_somministrazione_succ, note, pct_da, pct_da_manuale, id_modello_test_vr
from entrasp.sondaggi_somministrati
where codice_azienda=$1;

INSERT INTO entrasp.sondaggi_somministrati_oggetti_considerati(codice_azienda, id_sondaggio, id_somministrazione, object_name, object_key, object_description) 
SELECT $2,entrasp.grc_id_sondaggio($1,$2,id_sondaggio), entrasp.grc_id_somministrazione($1,$2,id_somministrazione), object_name, object_key, object_description
from entrasp.sondaggi_somministrati_oggetti_considerati
where codice_azienda=$1;

INSERT INTO entrasp.risposte(codice_azienda, id_modello_test, id_risposta, risposta, id_domanda, id_risposta_prev, object_name, object_key, id_sondaggio, id_somministrazione, punteggio, peso, note, id_modello_test_vr, punteggio_risposta) 
SELECT $2, entrasp.grc_id_mdt($1,$2,id_modello_test, id_modello_test_vr), id_risposta, risposta,entrasp.grc_id_domanda($1,$2,id_domanda,id_modello_test, id_modello_test_vr), entrasp.grc_id_risposta_prev($1,$2,id_risposta_prev,id_modello_test, id_modello_test_vr, id_domanda) , object_name, object_key, entrasp.grc_id_sondaggio($1,$2,id_sondaggio), entrasp.grc_id_somministrazione($1,$2,id_somministrazione), punteggio, peso, note, id_modello_test_vr, punteggio_risposta 
from entrasp.risposte
where codice_azienda=$1 AND
entrasp.grc_id_domanda($1,$2,id_domanda, id_modello_test, id_modello_test_vr) is not null;

$BODY$;

ALTER FUNCTION entrasp.grc_accoda_sondaggiecollegati(text, text)
    OWNER TO postgres;

-- FUNCTION: entrasp.grc_duplica_sondaggi_somministrazioni(text, integer, integer)

-- DROP FUNCTION IF EXISTS entrasp.grc_duplica_sondaggi_somministrazioni(text, integer, integer);

CREATE OR REPLACE FUNCTION entrasp.grc_duplica_sondaggi_somministrazioni(
	"CodAzienda" text,
	"IdSondaggioVecchio" integer,
	"IdSondaggioNuovo" integer)
    RETURNS void
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$


insert into entrasp.sondaggi(codice_azienda,  id_sondaggio,  descrizione,  data_rilevazione_da,  data_rilevazione_a,  object_name,  id_modello_test,  object_key,  stato,  data_prevista,  data_esecuzione,  codice_part,  id_gruppo_lavoro,  id_centro_gest,  flag_utenti,  id_anagrafica,  data_comp,  id_modello_test_vr,  data_riferimento_da,  data_riferimento_a,  id_somministrazione,  titolo,  id_serie,  selezione_campione,  documentazione_analizzata,  metodologia_presentazione_risultati,  ts_last_state,  flag_annullamento_manuale)
select codice_azienda,  $3,  descrizione,  data_rilevazione_da,  data_rilevazione_a,  object_name,  id_modello_test,  object_key,  stato,  data_prevista,  data_esecuzione,  codice_part,  id_gruppo_lavoro,  id_centro_gest,  flag_utenti,  id_anagrafica,  data_comp,  id_modello_test_vr,  data_riferimento_da,  data_riferimento_a,  id_somministrazione,  titolo,  id_serie,  selezione_campione,  documentazione_analizzata,  metodologia_presentazione_risultati,  ts_last_state,  flag_annullamento_manuale
from entrasp.sondaggi
WHERE codice_azienda=$1 AND id_sondaggio=$2; 

insert into entrasp.sondaggi_somministrati(codice_azienda,  id_sondaggio,  id_somministrazione,  data_esecuzione,  id_anagrafica,  object_name,  object_key,  id_modello_test,  id_sottomodello,  object_description,  punteggio_massimo,  punteggio_ottenuto,  stato,  id_risultato,  id_sondaggio_succ,  id_somministrazione_succ,  note,  pct_da,  pct_da_manuale,  id_modello_test_vr,  ts_last_state,  flag_annullamento_manuale)
SELECT codice_azienda,  $3,  id_somministrazione,  data_esecuzione,  id_anagrafica,  object_name,  object_key,  id_modello_test,  id_sottomodello,  object_description,  punteggio_massimo,  punteggio_ottenuto,  stato,  id_risultato,  id_sondaggio_succ,  id_somministrazione_succ,  note,  pct_da,  pct_da_manuale,  id_modello_test_vr,  ts_last_state,  flag_annullamento_manuale
from entrasp.sondaggi_somministrati
WHERE codice_azienda=$1 AND id_sondaggio=$2; 

insert into entrasp.sondaggi_somministrati_oggetti_considerati(codice_azienda,  id_sondaggio,  id_somministrazione,  object_name,  object_key,  object_description)
SELECT codice_azienda,  $3,  id_somministrazione,  object_name,  object_key,  object_description
from entrasp.sondaggi_somministrati_oggetti_considerati
WHERE codice_azienda=$1 AND id_sondaggio=$2; 

insert into entrasp.risposte(codice_azienda,  id_modello_test,  id_risposta,  risposta,  id_domanda,  id_risposta_prev,  object_name,  object_key,  id_sondaggio,  id_somministrazione,  punteggio,  peso,  note,  id_modello_test_vr,  punteggio_risposta)
SELECT codice_azienda,  id_modello_test,  id_risposta,  risposta,  id_domanda,  id_risposta_prev,  object_name,  object_key,  $3,  id_somministrazione,  punteggio,  peso,  note,  id_modello_test_vr,  punteggio_risposta
from entrasp.risposte
WHERE codice_azienda=$1 AND id_sondaggio=$2; 

$BODY$;

ALTER FUNCTION entrasp.grc_duplica_sondaggi_somministrazioni(text, integer, integer)
    OWNER TO postgres;

-- FUNCTION: entrasp.inizializza_sondaggi_somministrati_risultati_sezioni(character varying, numeric, numeric)

-- DROP FUNCTION IF EXISTS entrasp.inizializza_sondaggi_somministrati_risultati_sezioni(character varying, numeric, numeric);

CREATE OR REPLACE FUNCTION entrasp.inizializza_sondaggi_somministrati_risultati_sezioni(
	codiceazienda character varying,
	idsondaggio numeric,
	idsomministrazione numeric)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
declare punteggioottenuto numeric; punteggiomassimo numeric; idrisultato numeric; pctrisultatoottenuto numeric; peso numeric; punteggio numeric; nonapplicabile integer;
pct_max_sez numeric; pct_min_sez numeric; avg_wgt_pct numeric; avg_wgt_conv_pct numeric; avg_pct numeric; id_tipo_risultato numeric; section_weight numeric;

begin
	
	--raise notice 'inizializza_sondaggi_somministrati_risultati_sezioni';

	-- aggiorno la versione del sondaggio alla massima disponibile
	update entrasp.sondaggi snd
	set id_modello_test_vr=entrasp.modello_test_vr_max(codice_azienda, id_modello_test)
	where codice_azienda=codiceazienda and id_sondaggio=idsondaggio and stato!='C' 
	and mantieni_versione_corrente='0'
	and not exists(select id_sondaggio 
					from entrasp.risposte 
					where codice_azienda=codiceazienda and id_sondaggio=idsondaggio); 

	-- iserisce nella tabella entrasp.sondaggi_somministrati_risultati_sezioni ssrs eventuali sezioni mancanti 
	insert into entrasp.sondaggi_somministrati_risultati_sezioni(codice_azienda, id_sondaggio, id_somministrazione, id_modello_test, id_modello_test_vr, id_sezione)
	select ds.codice_azienda, ss.id_sondaggio, ss.id_somministrazione, ds.id_modello_test, ds.id_modello_test_vr, ds.id_sezione
	from entrasp.sondaggi_somministrati ss inner join entrasp.sondaggi snd on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio=snd.id_sondaggio 
	inner join entrasp.domande_sezioni ds on snd.codice_azienda=ds.codice_azienda and snd.id_modello_test=ds.id_modello_test and snd.id_modello_test_vr=ds.id_modello_test_vr
	left join entrasp.sondaggi_somministrati_risultati_sezioni ssrs on ds.codice_azienda=ssrs.codice_azienda and ds.id_modello_test=ssrs.id_modello_test and ds.id_modello_test_vr=ssrs.id_modello_test_vr and ds.id_sezione=ssrs.id_sezione and ss.id_somministrazione=ssrs.id_somministrazione
	where ss.id_sondaggio=idsondaggio and ss.id_somministrazione= idsomministrazione and ss.codice_azienda=codiceazienda and ssrs.codice_azienda is null and ssrs.id_modello_test is null and ssrs.id_modello_test_vr is null and ssrs.id_sezione is null and ssrs.id_somministrazione is null;

	-- iserisce nella tabella entrasp.sondaggi_somministrati il codice_part 
	update entrasp.sondaggi_somministrati ss 
	set data_esecuzione=coalesce(ss.data_esecuzione, snd.data_esecuzione)
	from entrasp.sondaggi snd 
	where ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio=snd.id_sondaggio 
	and ss.id_sondaggio=idsondaggio and ss.id_somministrazione=idsomministrazione and ss.codice_azienda=codiceazienda;
	
--	raise notice 'passo 1';
	-- gestire il pezzo di cancellare le sezioni che non esistono più
	--delete from entrasp.sondaggi_somministrati_risultati_sezioni ssrs where codice_azienda=codice_azienda and id_sondaggio=disondaggio and id_somministrazione=idsomministrazione and id_sezione not in  

	delete from entrasp.sondaggi_somministrati_risultati_sezioni ssrs 
	where ssrs.codice_azienda||'-'||ssrs.id_modello_test||'-'||ssrs.id_modello_test_vr||'-'||ssrs.id_sezione||'-'||ssrs.id_sondaggio||'-'||ssrs.id_somministrazione 
	not in (select ds.codice_azienda||'-'||ds.id_modello_test||'-'||ds.id_modello_test_vr||'-'||ds.id_sezione||'-'||ss.id_sondaggio||'-'||ss.id_somministrazione 
	from entrasp.domande_sezioni ds inner join entrasp.sondaggi snd on ds.codice_azienda=snd.codice_azienda and ds.id_modello_test=snd.id_modello_test and ds.id_modello_test_vr=snd.id_modello_test_vr 
	inner join entrasp.sondaggi_somministrati ss on snd.codice_azienda=ss.codice_azienda and snd.id_sondaggio=ss.id_sondaggio	
	where ds.codice_azienda=ssrs.codice_azienda and ds.id_modello_test=ssrs.id_modello_test and ds.id_modello_test_vr=ssrs.id_modello_test_vr)
	and ssrs.codice_azienda=codiceazienda and ssrs.id_sondaggio=idsondaggio and ssrs.id_somministrazione=id_somministrazione; 
	-- aggiorna i punteggi massimi e punteggi ottenuti per sezione

	

end ;
$BODY$;

ALTER FUNCTION entrasp.inizializza_sondaggi_somministrati_risultati_sezioni(character varying, numeric, numeric)
    OWNER TO postgres;

-- FUNCTION: entrasp.ripristino_progetti_fasi_e_collegati(character varying, numeric)

-- DROP FUNCTION IF EXISTS entrasp.ripristino_progetti_fasi_e_collegati(character varying, numeric);

CREATE OR REPLACE FUNCTION entrasp.ripristino_progetti_fasi_e_collegati(
	codiceazienda character varying,
	idfase numeric)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
begin
INSERT INTO entrasp.progetti_fasi(
	codice_azienda, id_fase, id_progetto, id_progetto_sub, id_fase_sup, titolo, tipo_fase, stato, id_tipo_fase, id_articolo, codice_variante, qta, codice_part, id_cliente_sede, codice_attivita, id_sondaggio, ts_last_state, flag_annullamento_manuale, qta_pdv_dv, id_sondaggio_rimpiazzato, flag_ritiro_dv, flag_certificazione_presenza_dv, id_checklist_template, flag_visibilita_cli, flag_visibilita_tech, id_fattura, id_riga_fattura, codice, ordinamento, foreseen_date, budgeted_time)
select codice_azienda, id_fase, id_progetto, id_progetto_sub, id_fase_sup, titolo, tipo_fase, stato, id_tipo_fase, id_articolo, codice_variante, qta, codice_part, id_cliente_sede, codice_attivita, id_sondaggio, ts_last_state, flag_annullamento_manuale, qta_pdv_dv, id_sondaggio_rimpiazzato, flag_ritiro_dv, flag_certificazione_presenza_dv, id_checklist_template, flag_visibilita_cli, flag_visibilita_tech, id_fattura, id_riga_fattura, codice, ordinamento, foreseen_date, budgeted_time 
from "20230106".progetti_fasi pf where pf.id_fase = idfase and pf.codice_azienda=codiceazienda on conflict do nothing;

INSERT INTO entrasp.sondaggi(
	codice_azienda, id_sondaggio, descrizione, data_rilevazione_da, data_rilevazione_a, object_name, id_modello_test, object_key, stato, data_prevista, data_esecuzione, codice_part, id_gruppo_lavoro, id_centro_gest, flag_utenti, id_anagrafica, data_comp, id_modello_test_vr, data_riferimento_da, data_riferimento_a, id_somministrazione, titolo, id_serie, selezione_campione, documentazione_analizzata, metodologia_presentazione_risultati, ts_last_state, flag_annullamento_manuale, pct_da, pct_da_manuale, id_sondaggio_succ, azione_richiesta, link, sondaggio_completato, budgeted_time, id_anagrafica_assegnataria, codice_compito, id_sondaggio_parent, ris_percentuale, giudizio, giudizio_manuale)
select 	snd.codice_azienda, snd.id_sondaggio, descrizione, data_rilevazione_da, data_rilevazione_a, object_name, id_modello_test, object_key, snd.stato, data_prevista, data_esecuzione, snd.codice_part, id_gruppo_lavoro, id_centro_gest, flag_utenti, id_anagrafica, data_comp, id_modello_test_vr, data_riferimento_da, data_riferimento_a, id_somministrazione, snd.titolo, id_serie, selezione_campione, documentazione_analizzata, metodologia_presentazione_risultati, snd.ts_last_state, snd.flag_annullamento_manuale, snd.pct_da, snd.pct_da_manuale, snd.id_sondaggio_succ, azione_richiesta, link, sondaggio_completato, snd.budgeted_time, id_anagrafica_assegnataria, codice_compito, id_sondaggio_parent, ris_percentuale, giudizio, giudizio_manuale
from "20230106".sondaggi snd 
inner join "20230106".progetti_fasi pf on snd.codice_azienda=pf.codice_azienda and snd.id_sondaggio=pf.id_sondaggio
where pf.codice_azienda=codiceazienda and pf.id_fase=idfase on conflict do nothing;

INSERT INTO entrasp.sondaggi_somministrati(
	codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione, id_anagrafica, object_name, object_key, id_modello_test, id_sottomodello, object_description, punteggio_massimo, punteggio_ottenuto, stato, id_risultato, id_sondaggio_succ, id_somministrazione_succ, note, pct_da, pct_da_manuale, id_modello_test_vr, ts_last_state, flag_annullamento_manuale, pct_risultato_ottenuto_calcolato, calcolo_risultato_log, somministrazione_completata, foreseen_date, budgeted_time, id_anagrafica_assegnataria, ris_percentuale, giudizio, punteggio_description, giudizio_manuale)
select 	ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione, ss.data_esecuzione, ss.id_anagrafica, ss.object_name, ss.object_key, ss.id_modello_test, ss.id_sottomodello, ss.object_description, ss.punteggio_massimo, ss.punteggio_ottenuto, ss.stato, ss.id_risultato, ss.id_sondaggio_succ, ss.id_somministrazione_succ, ss.note, ss.pct_da, ss.pct_da_manuale, ss.id_modello_test_vr, ss.ts_last_state, ss.flag_annullamento_manuale, ss.pct_risultato_ottenuto_calcolato, ss.calcolo_risultato_log, ss.somministrazione_completata, ss.foreseen_date, ss.budgeted_time, ss.id_anagrafica_assegnataria, ss.ris_percentuale, ss.giudizio, ss.punteggio_description, ss.giudizio_manuale
from "20230106".sondaggi_somministrati ss inner join "20230106".sondaggi snd on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio=snd.id_sondaggio
inner join "20230106".progetti_fasi pf on snd.codice_azienda=pf.codice_azienda and snd.id_sondaggio=pf.id_sondaggio
where pf.codice_azienda=codiceazienda and pf.id_fase=idfase on conflict do nothing;

INSERT INTO entrasp.risposte(
	codice_azienda, id_modello_test, id_risposta, risposta, id_domanda, id_risposta_prev, object_name, object_key, id_sondaggio, id_somministrazione, punteggio, peso, note, id_modello_test_vr, punteggio_risposta, flag_non_applicabile, numero_allegati)
select 	rp.codice_azienda, rp.id_modello_test, rp.id_risposta, rp.risposta, id_domanda, id_risposta_prev, rp.object_name, rp.object_key, rp.id_sondaggio, rp.id_somministrazione, rp.punteggio, rp.peso, rp.note, rp.id_modello_test_vr, rp.punteggio_risposta, rp.flag_non_applicabile, numero_allegati

from "20230106".risposte rp
inner join "20230106".sondaggi_somministrati ss on rp.codice_azienda=ss.codice_azienda and rp.id_sondaggio=ss.id_sondaggio and rp.id_somministrazione=ss.id_somministrazione
inner join "20230106".sondaggi snd on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio=snd.id_sondaggio
inner join "20230106".progetti_fasi pf on snd.codice_azienda=pf.codice_azienda and snd.id_sondaggio=pf.id_sondaggio
where pf.codice_azienda=codiceazienda and pf.id_fase=idfase on conflict do nothing;

update entrasp.progetti_fasi a
set id_sondaggio=pf.id_sondaggio
FROM "20230106".progetti_fasi pf
where pf.codice_azienda=codiceazienda and pf.id_fase=a.id_fase and pf.id_fase=idfase and a.codice_azienda=codiceazienda and a.codice_azienda=pf.codice_azienda;
								

end
$BODY$;

ALTER FUNCTION entrasp.ripristino_progetti_fasi_e_collegati(character varying, numeric)
    OWNER TO postgres;

