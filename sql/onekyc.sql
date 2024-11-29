
SELECT ENTRASP.ONEKYC_PROCESS_AML_SCANS(
	codice_azienda,
	ID_SOMMINISTRAZIONE ,
	ID_SONDAGGIO)
FROM ENTRASP.SONDAGGI_SOMMINISTRATI
WHERE CODICE_AZIENDA='FINAFARM' AND ID_SONDAGGIO=42634;

select id_somministrazione
from entrasp.sondaggi
where codice_azienda='FINAFARM' and id_sondaggio=42634

delete from entrasp.risposte
where codice_azienda='FINAFARM' and id_sondaggio=42634

select id_scan, anti_money_laundering, anti_money_laundering='[]'
	from imports.aml_scans
	where codice_azienda='QUANTYX' 
	and id_sondaggio=42634

	select count(id_scan)
	from imports.aml_scans
	where codice_azienda='FINAFARM' 
	and id_sondaggio=42634
	and anti_money_laundering='[]'


select id_scan, date_of_scan, id_somministrazione, id_sondaggio, id_anagrafica, risultati_scan
FROM imports.aml_scans
where id_somministrazione=54849 and codice_azienda='FINAFARM'	 

select codice_azienda
from  imports.aml_scans
order by date_of_scan desc

select codice_azienda, max(date_of_scan), count(id_scan),
from  imports.aml_scans
group by codice_azienda


DROP TRIGGER IF EXISTS trigger_aml_scan_after_insert ON imports.aml_scans;

CREATE OR REPLACE TRIGGER trigger_aml_scan_after_insert
    AFTER INSERT or UPDATE
    ON imports.aml_scans
    FOR EACH ROW
    EXECUTE FUNCTION imports.aml_scan_aggiorna_dati_tabella();

update imports.aml_scans
set risposta_estesa='a'
where codice_azienda='FINAFARM' and date_of_Scan='2024-11-22'


CREATE TRIGGER trigger_aml_scan_after_insert
AFTER INSERT
ON imports.aml_scans
FOR EACH ROW
EXECUTE FUNCTION imports.aml_scan_aggiorna_dati_tabella();





select codice_azienda, date_of_scan, id_scan, id_somministrazione, id_sondaggio
from imports.aml_scans
where codice_azienda='QUANTYX' and date_of_Scan='2024-11-29'

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


select id_anagrafica as id_anagrafica_collegata,    
		entrasp.anagrafiche_vr_dati_identificativi(codice_part, id_anagrafica) as anagrafica_collegata,
		(select split_part(codice_part, object_key, '|', 2)::numeric) from entrasp.sondaggi_somministrati where codice_azienda='FINAFARM' and id_somministrazione=54776),
	entrasp.onekyc_confronta_precedenti_aml_scans(
    scan_data,
    'FINAFARM',
    id_somministrazione)
from imports.aml_scans
where codice_azienda='FINAFARM' and id_somministrazione=54776







select * from imports.aml_scans
where id_somministrazione=55268
--codice_azienda='FINAFARM' and 
id_anagrafica is null



-- FUNCTION: entrasp.onekyc_process_aml_scans(json, numeric)

-- DROP FUNCTION IF EXISTS entrasp.onekyc_process_aml_scans(json, numeric);


select entrasp.onekyc_process_aml_scans(
	codice_azienda,
	id_somministrazione, 
	id_sondaggio)
from entrasp.sondaggi_somministrati
where codice_azienda='FINAFARM'
and id_sondaggio=42634 and id_somministrazione=54849


select id_risposta_prev, id_argomento_risposta, anti_money_laundering
from imports.aml_scans
where --codice_azienda='FINAFARM'
--and 
id_sondaggio=42634 and id_risposta_prev is not null
and anti_money_laundering!='[]' --15

select * from entrasp.risposte
where (codice_azienda, id_somministrazione) in
(select codice_azienda, id_somministrazione
from imports.aml_scans
where --codice_azienda='FINAFARM'
--and 
id_sondaggio=42634 and id_risposta_prev is not null
and anti_money_laundering!='[]')

--id_somministrazione=54849
SELECT ams.id_sondaggio, ams.codice_part, ams.codice_azienda, ams.id_scan, 
ams.id_anagrafica, ams.id_somministrazione, ams.dynamo_user, ams.date_of_scan, entrasp.anagrafiche_vr_dati_identificativi('€global_codice_azienda€', ams.id_anagrafica) AS descr_anagrafica, entrasp.onekyc_describe_aml_scan_data(ams.scan_data, ams.date_of_scan) AS descr_scan_data, CASE ams.scan_data->>'scanType' WHEN 'LIGHTSCAN' THEN 'Light Scan' ELSE 'Deep Scan' END AS scan_type FROM imports.aml_scans ams INNER JOIN (SELECT codice_azienda, id_sondaggio, id_somministrazione FROM entrasp.sondaggi_somministrati WHERE codice_azienda='€global_codice_azienda€') ss 
ON ams.id_somministrazione = ss.id_somministrazione and ams.codice_azienda=ss.codice_azienda 
inner join entrasp.modelli_test mt 
on dm.codice_azienda=mt.codice_azienda and dm.id_modello_test=mt.id_modello_test and dm.id_modello_test_vr=mt.id_modello_test_vr and dm.id_domanda=mt.id_domanda 
WHERE ams.codice_azienda = 'FINAFARM' and mt.id_argomento=45421;


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


-- FUNCTION: entrasp.onekyc_describe_aml_scan_data(json, date)

-- DROP FUNCTION IF EXISTS entrasp.onekyc_describe_aml_scan_data(json, date);


update imports.aml_scans	
set risultati_scan=entrasp.onekyc_describe_aml_scan_result(scan_data);
	
ALTER TABLE IF EXISTS imports.aml_scans
    ADD COLUMN isAlreadyAnalyzed boolean;

ALTER TABLE IF EXISTS imports.aml_scans
    ADD COLUMN anti_money_laundering varchar;


-- FUNCTION: imports.aml_scan_aggiorna_dati_tabella()

-- DROP FUNCTION IF EXISTS imports.aml_scan_aggiorna_dati_tabella();

CREATE OR REPLACE FUNCTION imports.aml_scan_aggiorna_dati_tabella()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$

declare idanagraficaprincipale numeric;
BEGIN

if new.id_sondaggio is null then
update imports.aml_scans am
	set 
	id_sondaggio=ss.id_sondaggio,
	isAlreadyAnalyzed = 
        CASE 
            WHEN scan_data->>'registry' IN ('true', 'false', 't', 'f', '1', '0') 
            THEN (scan_data->>'registry')::boolean 
            ELSE NULL 
        END,
	anti_money_laundering =(scan_data->'data'->>'anti_money_laundering')::varchar
	from entrasp.sondaggi_somministrati ss 
	where am.codice_azienda=ss.codice_azienda 
	and am.id_somministrazione=ss.id_somministrazione
    and am.id_somministrazione=new.id_somministrazione
	and am.codice_azienda=new.codice_azienda;
end if;

RETURN NEW;
END;
$BODY$;

ALTER FUNCTION imports.aml_scan_aggiorna_dati_tabella()
    OWNER TO postgres;

-- FUNCTION: imports.aml_scan_aggiorna_dati_tabella()

-- DROP FUNCTION IF EXISTS imports.aml_scan_aggiorna_dati_tabella();

UPDATE imports.aml_scans am
SET 
    id_sondaggio = ss.id_sondaggio,
    isAlreadyAnalyzed = CASE 
        WHEN (scan_data->>'registry') = 'true' THEN true 
        ELSE false 
    END,
    anti_money_laundering = scan_data->'data'->>'anti_money_laundering'
FROM entrasp.sondaggi_somministrati ss
WHERE am.codice_azienda = ss.codice_azienda 
  AND am.id_somministrazione = ss.id_somministrazione;


select id_sondaggio, isAlreadyAnalyzed, anti_money_laundering from imports.aml_scans


ALTER TABLE IF EXISTS imports.aml_scans
    ADD COLUMN id_modello_test numeric(12,0);

ALTER TABLE IF EXISTS imports.aml_scans
    ADD COLUMN id_modello_test_vr numeric(12,0);


select count(id_scan) from imports.aml_scans where id_risposta_prev is not null; --1779
select count(id_scan) from imports.aml_scans where id_risposta_prev is null; --27420
select count(id_scan) from imports.aml_scans; --29199;


select count(id_risposta_prev) from imports.aml_scans where id_sondaggio is null --1779

	update imports.aml_scans am
	set id_risposta_prev=rp.id_risposta_prev,
	risposta=rp.risposta,
	id_argomento_risposta=rp.id_argomento,
	id_anagrafica_principale=(SELECT CASE WHEN split_part(ss.object_key, '|', 2) ~ '^\d+(\.\d+)?$' THEN split_part(ss.object_key, '|', 2)::numeric
									ELSE NULL END),
	id_domanda=dm.id_domanda,
	id_modello_test=rs.id_modello_test,
	id_modello_test_vr=rs.id_modello_test_vr
	from entrasp.risposte rs
	inner join entrasp.domande dm
	on rs.codice_azienda=dm.codice_azienda and rs.id_modello_test=dm.id_modello_test and rs.id_modello_test_vr=dm.id_modello_test_vr and rs.id_domanda=dm.id_domanda
	inner join entrasp.risposte_previste rp
	on rs.codice_azienda=dm.codice_azienda and rs.id_modello_test=rp.id_modello_test 
	and rs.id_modello_test_vr=rp.id_modello_test_vr and rs.id_domanda=rp.id_domanda
	and rs.id_risposta_prev=rp.id_risposta_prev
	inner join entrasp.sondaggi_somministrati ss
	on rs.codice_azienda=ss.codice_azienda and rs.id_sondaggio=ss.id_sondaggio 
	and rs.id_somministrazione=ss.id_somministrazione
	where am.codice_azienda=rs.codice_azienda
	and am.id_somministrazione=rs.id_somministrazione
	and dm.id_argomento= 45415
	and rs.id_risposta_prev is not null and am.id_risposta_prev is null;


