/* 

select snd.data_esecuzione, snd.id_sondaggio, rs.id_somministrazione, length(note), rs.note
from entrasp.risposte rs 
inner join entrasp.sondaggi snd
on rs.codice_azienda=snd.codice_azienda and rs.id_sondaggio=snd.id_sondaggio
where rs.codice_azienda='FINAFARM' and rs.id_domanda=1 and rs.id_modello_Test=604 
and rs.id_sondaggio=42634
and note like '%7c7b6c26-8a4e-46b7-8703-c7c91b8092f6%'
order by data_esecuzione desc

select * 
from imports.aml_scans
where 
--id_scan='7c7b6c26-8a4e-46b7-8703-c7c91b8092f6' and
id_anagrafica=3460 and codice_azienda='FINAFARM'
order by date_of_scan desc

select entrasp.onekyc_describe_aml_scan_data(scan_data)
from imports.aml_scans
where 
--id_scan='7c7b6c26-8a4e-46b7-8703-c7c91b8092f6'


select rs.note, entrasp.onekyc_describe_aml_scan_data(ias.scan_data)
from imports.aml_scans ias
inner join entrasp.risposte rs
on ias.codice_azienda=rs.codice_azienda and ias.id_somministrazione=rs.id_somministrazione
inner join entrasp.domande dm on 
rs.codice_azienda=dm.codice_azienda and rs.id_modello_test=dm.id_modello_test 
and rs.id_modello_test_vr=dm.id_modello_test_vr and rs.id_domanda=dm.id_domanda
where rs.codice_azienda='FINAFARM' and dm.id_argomento=45414 and rs.id_sondaggio=42634
and rs.note!=entrasp.onekyc_describe_aml_scan_data(ias.scan_data)




select 
	routine_catalog AS DatabaseName
	,routine_schema AS SchemaName
	,routine_name AS FunctionName
	,routine_type AS ObjectType
from information_schema.routines 
where routine_definition ilike '%nessun riscontro%'
*/

/*

select snd.data_esecuzione, snd.id_sondaggio, rs.id_somministrazione, length(note), rs.note
from entrasp.risposte rs 
inner join entrasp.sondaggi snd
on rs.codice_azienda=snd.codice_azienda and rs.id_sondaggio=snd.id_sondaggio
where rs.codice_azienda='FINAFARM' and rs.id_domanda=1 and rs.id_modello_Test=604 
and rs.id_sondaggio=42634
order by data_esecuzione desc


select 
	routine_catalog AS DatabaseName
	,routine_schema AS SchemaName
	,routine_name AS FunctionName
	,routine_type AS ObjectType
from information_schema.routines 
where routine_definition ilike '%nessun riscontro%'
*/


select entrasp.onekyc_confronta_precedenti_aml_scans(
    scan_data,
    'FINAFARM',
    id_somministrazione
)
from imports.aml_scans
where codice_azienda='FINAFARM' and id_somministrazione=54776


-- FUNCTION: entrasp.onekyc_process_aml_scans(json, numeric)

-- DROP FUNCTION IF EXISTS entrasp.onekyc_process_aml_scans(json, numeric);

CREATE OR REPLACE FUNCTION entrasp.onekyc_process_aml_scans(
	scans json,
	idsomministrazione_ numeric DEFAULT NULL::numeric)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$

DECLARE
	codiceazienda varchar;
	idsomministrazione numeric;
	Rec record;
	codicepart varchar;
	old_scans_to_check text;
	new_scans_to_check text;
	somministrazione_to_check numeric;
	first_condition boolean;
	second_condition boolean;
	outer_condition boolean;

BEGIN
	-- Logging the start of the process
	RAISE NOTICE 'Starting process scan on registry: %', scans->>'registry';
	RAISE NOTICE 'checkId: %', (scans ->> 'checkId')::numeric;

	-- Extract company code
	SELECT scans->>'company' INTO codiceazienda;

	-- Determine the administration ID
	idsomministrazione := COALESCE(idsomministrazione_, (scans ->> 'checkId')::numeric);

	-- Check if already analyzed
	IF scans->>'isAlreadyBeenAnalyzed' = 'true' THEN
		RAISE NOTICE 'isAlreadyBeenAnalyzed! Registry: %', scans->>'registry';

		PERFORM entrasp.onekyc_process_aml_scans(scan_data, idsomministrazione)
		FROM imports.aml_scans
		WHERE codice_azienda = codiceazienda
		AND id_anagrafica::varchar = scans->>'registry'
		AND date_of_scan = CURRENT_DATE;

	ELSE
		IF scans->'data'->>'anti_money_laundering' = '[]' THEN
			-- Processing if no anti-money laundering data found
			INSERT INTO entrasp.risposte (
					codice_azienda, id_modello_test, id_risposta, id_domanda, id_risposta_prev, id_sondaggio, 
					id_somministrazione, punteggio, peso, note, id_modello_test_vr, punteggio_risposta, flag_non_applicabile)
			SELECT ss.codice_azienda, snd.id_modello_test, 1, dm.id_domanda, rp.id_risposta_prev, ss.id_sondaggio,
					ss.id_somministrazione, dm.punteggio, rp.peso, entrasp.onekyc_describe_aml_scan_data(scans), snd.id_modello_test_vr, round(dm.punteggio*rp.peso/100.00, 2), false
			FROM entrasp.sondaggi_somministrati ss
			INNER JOIN entrasp.sondaggi snd ON ss.codice_azienda = snd.codice_azienda AND ss.id_sondaggio = snd.id_sondaggio
			INNER JOIN entrasp.domande dm ON snd.codice_azienda = dm.codice_azienda AND snd.id_modello_test = dm.id_modello_test AND snd.id_modello_test_vr = dm.id_modello_test_vr
			INNER JOIN entrasp.risposte_previste rp ON dm.codice_azienda = rp.codice_azienda AND dm.id_modello_test = rp.id_modello_test AND dm.id_modello_test_vr = rp.id_modello_test_vr AND dm.id_domanda = rp.id_domanda
			WHERE ss.codice_azienda = codiceazienda 
			AND ss.id_somministrazione = idsomministrazione
			AND dm.id_argomento = 45414
			AND (rp.risposta SIMILAR TO 'No|NO|no' OR rp.id_argomento = 2372)
			ON CONFLICT DO NOTHING;

			-- Updating the status of the survey as complete
			UPDATE entrasp.sondaggi_somministrati ss
			SET somministrazione_completata = 'Completo'
			WHERE ss.codice_azienda = codiceazienda AND ss.id_somministrazione = idsomministrazione
			AND (SELECT CASE WHEN COUNT(DISTINCT id_domanda) > 2 THEN FALSE ELSE TRUE END
				FROM entrasp.risposte_previste rp
				INNER JOIN entrasp.sondaggi snd ON snd.codice_azienda = rp.codice_azienda AND snd.id_modello_test = rp.id_modello_test AND snd.id_modello_test_vr = rp.id_modello_test_vr
				WHERE rp.codice_azienda = codiceazienda AND snd.id_sondaggio = ss.id_sondaggio);

			-- Updating scores
			PERFORM entrasp.aggiorna_punteggi_somministrazioni(codice_azienda, id_sondaggio, id_somministrazione) 
			FROM entrasp.sondaggi_somministrati 
			WHERE codice_azienda = codiceazienda AND id_somministrazione = idsomministrazione;

		ELSE
			-- Processing if anti-money laundering data found
			INSERT INTO entrasp.risposte (
					codice_azienda, id_modello_test, id_risposta, id_domanda, id_risposta_prev, id_sondaggio, 
					id_somministrazione, punteggio, peso, note, id_modello_test_vr, punteggio_risposta, flag_non_applicabile)
			SELECT ss.codice_azienda, snd.id_modello_test, 1, dm.id_domanda, rp.id_risposta_prev, ss.id_sondaggio,
					ss.id_somministrazione, dm.punteggio, rp.peso, entrasp.OneKYC_describe_aml_scan_data(scans), snd.id_modello_test_vr, round(dm.punteggio*rp.peso/100.00, 2), false
			FROM entrasp.sondaggi_somministrati ss
			INNER JOIN entrasp.sondaggi snd ON ss.codice_azienda = snd.codice_azienda AND ss.id_sondaggio = snd.id_sondaggio
			INNER JOIN entrasp.domande dm ON snd.codice_azienda = dm.codice_azienda AND snd.id_modello_test = dm.id_modello_test AND snd.id_modello_test_vr = dm.id_modello_test_vr
			INNER JOIN entrasp.risposte_previste rp ON dm.codice_azienda = rp.codice_azienda AND dm.id_modello_test = rp.id_modello_test AND dm.id_modello_test_vr = rp.id_modello_test_vr AND dm.id_domanda = rp.id_domanda
			WHERE ss.codice_azienda = codiceazienda 
			AND ss.id_somministrazione = idsomministrazione
			AND dm.id_argomento = 45414
			AND (rp.risposta SIMILAR TO 'Sì|SI|si|Si' OR rp.id_argomento = 6765)
			ON CONFLICT ON CONSTRAINT rspt_pk
				DO UPDATE SET note = entrasp.risposte.note || entrasp.OneKYC_describe_aml_scan_data(scans), 
								risposta = 'Sì',
								id_risposta_prev = (SELECT rp.id_risposta_prev
													FROM entrasp.sondaggi_somministrati ss
													INNER JOIN entrasp.sondaggi snd ON ss.codice_azienda = snd.codice_azienda AND ss.id_sondaggio = snd.id_sondaggio
													INNER JOIN entrasp.domande dm ON snd.codice_azienda = dm.codice_azienda AND snd.id_modello_test = dm.id_modello_test AND snd.id_modello_test_vr = dm.id_modello_test_vr
													INNER JOIN entrasp.risposte_previste rp ON dm.codice_azienda = rp.codice_azienda AND dm.id_modello_test = rp.id_modello_test AND dm.id_modello_test_vr = rp.id_modello_test_vr AND dm.id_domanda = rp.id_domanda
													WHERE ss.codice_azienda = codiceazienda 
													AND ss.id_somministrazione = idsomministrazione
													AND dm.id_argomento = 45414
													AND (rp.risposta SIMILAR TO 'Sì|SI|si|Si' OR rp.id_argomento = 6765));
			-- Additional processing
			SELECT id_somministrazione
			FROM imports.aml_scans aml
			WHERE aml.id_anagrafica::varchar = scans->>'registry'
			AND aml.scan_data->>'scanType' = scans->>'scanType'
			AND codice_azienda = codiceazienda
			ORDER BY date_of_scan DESC LIMIT 1
			INTO somministrazione_to_check;

			SELECT count(id_risposta) = 1
			FROM entrasp.sondaggi_somministrati ss
			INNER JOIN entrasp.sondaggi snd ON ss.codice_azienda = snd.codice_azienda AND ss.id_sondaggio = snd.id_sondaggio
			INNER JOIN entrasp.domande dm ON snd.codice_azienda = dm.codice_azienda AND snd.id_modello_test = dm.id_modello_test AND snd.id_modello_test_vr = dm.id_modello_test_vr
			INNER JOIN entrasp.risposte_previste rp ON dm.codice_azienda = rp.codice_azienda AND dm.id_modello_test = rp.id_modello_test AND dm.id_modello_test_vr = rp.id_modello_test_vr AND dm.id_domanda = rp.id_domanda
			INNER JOIN entrasp.risposte r ON r.codice_azienda = rp.codice_azienda AND r.id_modello_test = rp.id_modello_test AND r.id_modello_test_vr = rp.id_modello_test_vr AND r.id_domanda = rp.id_domanda AND r.id_somministrazione = ss.id_somministrazione AND r.id_risposta_prev = rp.id_risposta_prev			
			WHERE ss.codice_azienda = codiceazienda
			AND ss.id_somministrazione = somministrazione_to_check
			AND dm.id_argomento = 45415
			AND rp.id_argomento = 48623
			INTO first_condition;

			SELECT STRING_AGG(scan_data->'data'->>'anti_money_laundering', '~' ORDER BY id_anagrafica ASC)
			FROM imports.aml_scans aml
			WHERE aml.codice_azienda = codiceazienda
			AND id_somministrazione = somministrazione_to_check
			INTO old_scans_to_check;

			SELECT STRING_AGG(scan_data->'data'->>'anti_money_laundering', '~' ORDER BY id_anagrafica ASC)
			FROM imports.aml_scans aml
			WHERE aml.codice_azienda = codiceazienda
			AND id_somministrazione = idsomministrazione
			INTO new_scans_to_check;

			SELECT new_scans_to_check = old_scans_to_check
			INTO second_condition;

			RAISE NOTICE 'idSomministrazioneToCheck: %', somministrazione_to_check;

			IF (first_condition AND second_condition) THEN
				RAISE NOTICE 'inserisco falso positivo!';

				INSERT INTO entrasp.risposte (
						codice_azienda, id_modello_test, id_risposta, risposta, id_domanda, id_risposta_prev, id_sondaggio, 
						id_somministrazione, punteggio, peso, note, id_modello_test_vr, punteggio_risposta, flag_non_applicabile)
				SELECT ss.codice_azienda, snd.id_modello_test, 1, rp.risposta, dm.id_domanda, rp.id_risposta_prev, ss.id_sondaggio,
						ss.id_somministrazione, dm.punteggio, rp.peso, 'Falso positivo automatico sulla base delle evidenze riscontrate durante la precedente scansione, verifica ' || COALESCE(somministrazione_to_check::varchar, ''), snd.id_modello_test_vr, round(dm.punteggio*rp.peso/100.00, 2), false
				FROM entrasp.sondaggi_somministrati ss
				INNER JOIN entrasp.sondaggi snd ON ss.codice_azienda = snd.codice_azienda AND ss.id_sondaggio = snd.id_sondaggio
				INNER JOIN entrasp.domande dm ON snd.codice_azienda = dm.codice_azienda AND snd.id_modello_test = dm.id_modello_test AND snd.id_modello_test_vr = dm.id_modello_test_vr
				INNER JOIN entrasp.risposte_previste rp ON dm.codice_azienda = rp.codice_azienda AND dm.id_modello_test = rp.id_modello_test AND dm.id_modello_test_vr = rp.id_modello_test_vr AND dm.id_domanda = rp.id_domanda
				WHERE ss.codice_azienda = codiceazienda 
				AND ss.id_somministrazione = idsomministrazione
				AND dm.id_argomento = 45415
				AND rp.id_argomento = 48623
				ON CONFLICT DO NOTHING;		
			END IF;

			PERFORM entrasp.aggiorna_sondaggi_pre_loading(codice_azienda, id_sondaggio),
				entrasp.inizializza_sondaggi_somministrati_risultati_sezioni(codice_azienda, id_sondaggio, id_somministrazione),
				entrasp.aggiorna_punteggi_somministrazioni(codice_azienda, id_sondaggio, id_somministrazione)
			FROM entrasp.sondaggi_somministrati 
			WHERE codice_azienda = codiceazienda AND id_somministrazione = idsomministrazione;

			UPDATE entrasp.sondaggi_somministrati
			SET data_esecuzione = CURRENT_DATE
			WHERE codice_azienda = codiceazienda AND id_somministrazione = idsomministrazione;

			UPDATE entrasp.sondaggi
			SET data_esecuzione = CURRENT_DATE
			WHERE codice_azienda = codiceazienda AND id_sondaggio IN (SELECT id_sondaggio FROM entrasp.sondaggi_somministrati WHERE codice_azienda = codiceazienda AND id_somministrazione = idsomministrazione);
		END IF;
	END IF;
END
$BODY$;

ALTER FUNCTION entrasp.onekyc_process_aml_scans(json, numeric)
    OWNER TO postgres;

/*select snd.data_esecuzione, snd.id_sondaggio, rs.id_somministrazione, length(note), rs.note
from entrasp.risposte rs 
inner join entrasp.sondaggi snd
on rs.codice_azienda=snd.codice_azienda and rs.id_sondaggio=snd.id_sondaggio
where rs.codice_azienda='FINAFARM' and rs.id_domanda=1 and rs.id_modello_Test=604 
and rs.id_sondaggio=42634
order by data_esecuzione desc


select 
	routine_catalog AS DatabaseName
	,routine_schema AS SchemaName
	,routine_name AS FunctionName
	,routine_type AS ObjectType
from information_schema.routines 
where routine_definition ilike '%nessun riscontro%'
*/


select * from 
imports.aml_scans 
where id_anagrafica=18800 and codice_azienda='FINAFARM'
order by date_of_scan desc





-- FUNCTION: entrasp.onekyc_process_aml_scans(json, numeric)

-- DROP FUNCTION IF EXISTS entrasp.onekyc_process_aml_scans(json, numeric);





	select ss.object_key, snd.data_esecuzione, 
	entrasp.anagrafiche_cognnome(ss.codice_part, (split_part(ss.object_key, '|', 2)::numeric)), count(ss.id_somministrazione)  
	from entrasp.sondaggi_somministrati ss
	inner join entrasp.sondaggi snd
	using(codice_azienda, id_sondaggio)
	where ss.codice_azienda='FINAFARM'
	and snd.id_modello_test=526
--	and ss.id_somministrazione in(54730, 54716)
	group by ss.object_key, snd.data_esecuzione, ss.codice_part
	having count(ss.id_somministrazione)>1 

	select object_key, data_esecuzione, codice_part, object_description
	from entrasp.sondaggi_somministrati
	where codice_azienda='FINAFARM'
	and id_somministrazione in(54730, 54716)

	select ss.object_key, ss.data_esecuzione, snd.data_esecuzione, ss.codice_part,  ss.object_description
	from entrasp.sondaggi_somministrati ss
	inner join entrasp.sondaggi snd
	using (codice_azienda, id_sondaggio)
	where ss.codice_azienda='FINAFARM'
	and ss.id_somministrazione in(55287, 55310)


	

	
