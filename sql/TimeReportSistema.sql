-- FUNCTION: entrasp.update_dynamo_user(text, text, character varying)

-- DROP FUNCTION IF EXISTS entrasp.update_dynamo_user(text, text, character varying);

select entrasp.update_dynamo_user(('AKSIASGR-26','ALCEDOSGR-37','AMBIENTASGR-14','CLESSIDRASGR-27','CONSILIUMSGR-27','FSI-22','GRADIENTE-33','IGISGR-10','NEXTALIASGR-32','PMPARTNERSSGR-27','PROGRESSIO-27','QUANTYX-298','QUATTROR-20','WISESGR-33')::text, ('AKSIASGR','ALCEDOSGR','AMBIENTASGR','CLESSIDRASGR','CONSILIUMSGR','FSI','GRADIENTESGR','IGISGR','NEXTALIASGR','PMPARTNERSSGR','PROGRESSIO','QUANTYX','QUATTROR','WISESGR')::text, 'fbordignon@quantyxsim.com')

select id_anagrafica, codice_part, dynamo_user 
from entrasp.anagrafiche_id
where codice_part='QUANTYX' and id_anagrafica=298;

select id_anagrafica, codice_part, dynamo_user, data_avvio_collaborazione 
from entrasp.anagrafiche_id
where dynamo_user ilike '%ivaldi%' or email_sender ilike '%ivaldi%'
	order by codice_part;

select * from entrasp.employers
where dynamo_user like '%ivaldi%'

SELECT  *		
FROM entrasp.users	
where username like '%ivaldi%'
	

select * from entrasp.giornate_e_users_da_rendicontare
where dynamo_user like '%ivaldi%'
order by giorno desc

CALL entrasp.update_tr_quantyx();

	
select entrasp.aggiorna_giornate_e_users_da_rendicontare('givaldi')


-- FUNCTION: entrasp.aggiorna_cdms_bo_cdms_risorse(text, numeric, boolean)
ALTER TABLE IF EXISTS entrasp.modelli_test_risultati_righe
    ADD COLUMN font_color character varying(30) COLLATE pg_catalog."default";
	
select entrasp.aggiorna_giornate_e_users_da_rendicontare('fmaccario@quantyxsim.com')



select id_anagrafica, codice_part, dynamo_user 
from entrasp.anagrafiche_id
where codice_part='QUANTYX' and id_anagrafica=354


SELECT --distinct 
dynamo_user,
							nome,
							codice_ruolo,
							ruolo 
	
	
	FROM entrasp.giornate_e_users_da_rendicontare
	WHERE (codice_ruolo IS NULL or ruolo is null)
	and codice_azienda in ('QUANTYX','QUANTYXSRL')
	
	
	SELECT  entrasp.aggiorna_giornate_e_users_da_rendicontare(dynamo_user)		
	FROM entrasp.users	


	select id_anagrafica, codice_part, dynamo_user, data_fine_collaborazione
	from entrasp.anagrafiche_id
	where codice_part='QUANTYX' and dynamo_user like '%maccario%'
	
	
	update entrasp.giornate_e_users_da_rendicontare gur
	set codice_ruolo=an.codice_ruolo, id_centro_Gest=an.id_centro_Gest 
	from entrasp.anagrafiche_id an
	where an.dynamo_user=gur.dynamo_user and an.codice_part='QUANTYX'
	and (gur.codice_ruolo is null or gur.id_Centro_gest is null)
	
-- per cambiare massivamente le consuntivazioni da un'azienda all'altra	
	update entrasp.consuntivazioni csn
	set codice_azienda='QUANTYX', id_cons= id_cons+1380 /* differenza tra il max di id_cons di QUANTYX e il min di id_cons di QUANTYXSRL ... vedi le due query successive*/
	from entrasp.anagrafiche_id an 
	where csn.codice_azienda='QUANTYXSRL'
	and csn.codice_part=an.codice_part and csn.id_risorsa=an.id_anagrafica
	and an.dynamo_user='fbenedetti@quantyxsim.com'
	and csn.note='Attività generica di rendicontazione'
	and an.id_anagrafica=352 and an.codice_part='QUANTYX'
	
	
	/* le seguenti due query sono strumentali alla query precedente */
		select max(id_cons)
	from entrasp.consuntivazioni
	where codice_azienda='QUANTYX' 8359

	select min(id_cons)
	from entrasp.consuntivazioni
	where codice_azienda='QUANTYXSRL' and id_risorsa=352 min 6987    max 8392
	
	------------------------------------------------
	
	
	
		select  date_time_begin, date_time_begin, csn.codice_azienda
from entrasp.anagrafiche_id an, entrasp.consuntivazioni csn 
	where csn.codice_azienda='QUANTYXSRL'
	and csn.codice_part=an.codice_part and csn.id_risorsa=an.id_anagrafica
	and an.dynamo_user='fbenedetti@quantyxsim.com'
--	and csn.note='Attività generica di rendicontazione'
	and an.id_anagrafica=352 
	
	


	
	
	
	select codice_azienda, id_cons, date_time_begin, date_time_end, durata from entrasp.consuntivazioni csn
	inner join entrasp.anagrafiche_id an on csn.id_risorsa=an.id_anagrafica and csn.codice_part=an.codice_part
	where durata >600 and an.dynamo_user='annarita' order by date_time_begin desc


	select codice_azienda, id_cons, date_time_begin, date_time_end, durata from entrasp.consuntivazioni csn
	inner join entrasp.anagrafiche_id an on csn.id_risorsa=an.id_anagrafica and csn.codice_part=an.codice_part
	where an.dynamo_user like '%benedetti%'  and id_cons=5429
	
	
	select * from entrasp.ruoli
	where descrizione ilike '%manager%'


select * from entrasp.giornate_e_users_da_rendicontare
where dynamo_user like '%maccario%'
order by giorno desc

update entrasp.giornate_e_users_da_rendicontare
set id_centro_gest=36, centro_gest='SRL- RM Private Equity'
where id_centro_gest=43 and codice_azienda in('QUANTYX', 'QUANTYXSRL')

select id_centro_gest, codice_ruolo, codice_part, id_anagrafica, dynamo_user, data_avvio_collaborazione
from entrasp.anagrafiche_id where dynamo_user='mguadagnini' and codice_part='AUDITFT'



select id_indicatore, sql_select,  sql_indicatore from entrasp.indicatori
where id_indicatore in(146, 334)

select entrasp.aggiorna_giornate_e_users_da_rendicontare(dynamo_user)
from entrasp.employers
where codice_azienda in('QUANTYX', 'QUANTYXSRL')

update entrasp.employers em
set id_Centro_gest=an.id_centro_gest
from entrasp.anagrafiche_id
where em.dynamo_user=an.dynamo_user

select pid, query_start, now() - pg_stat_activity.query_start as RunningTime, state, query
from pg_stat_activity
where state!='idle'



									
									
																
select distinct csn.codice_azienda, csn.codice_compito  
from entrasp.consuntivazioni csn
where csn.id_risorsa||'-'||csn.codice_part
In(select  an.id_anagrafica||'-'||an.codice_part 
   from entrasp.anagrafiche_id an
	where an.dynamo_user='fbordignon@quantyxsim.com')
and csn.codice_azienda in('QUANTYX', 'QUANTYXSRL')


select csn.id_cons, csn.id_risorsa, csn.codice_azienda, csn.codice_compito  
from entrasp.consuntivazioni csn
where csn.id_risorsa||'-'||csn.codice_part
In(select  an.id_anagrafica||'-'||an.codice_part 
   from entrasp.anagrafiche_id an
	where an.dynamo_user='fbordignon@quantyxsim.com')
and csn.codice_azienda in('QUANTYXSRL')
order by id_cons

select max(id_cons) from entrasp.consuntivazioni where codice_azienda='QUANTYX'


-- coerenza tra employers e anagrafiche							
select distinct an.dynamo_user, em.dynamo_user, an.id_Centro_gest, em.id_centro_gest, an.codice_ruolo, em.codice_ruolo,  
	from entrasp.anagrafiche_id an, entrasp.employers em
	where an.dynamo_user=em.dynamo_user and (an.id_Centro_gest!=em.id_centro_gest or an.codice_ruolo!=em.codice_ruolo) 
											 and em.codice_azienda in('QUANTYX', 'QUANTYXSRL')

update entrasp.employers em
set id_centro_gest=an.id_centro_gest, 
codice_ruolo=an.codice_ruolo,
codice_part=an.codice_part
from entrasp.anagrafiche_id an
	where an.dynamo_user=em.dynamo_user and (an.id_Centro_gest!=em.id_centro_gest or an.codice_ruolo!=em.codice_ruolo) 
											 and em.codice_azienda in('QUANTYX', 'QUANTYXSRL')


select codice_ruolo, codice_part
from entrasp.employers
where codice_azienda in('QUANTYX', 'QUANTYXSRL')
and codice_part='FININT'



-- coerenza tra employers e giornate_e_users_da_rendicontare							
select distinct gur.dynamo_user, em.dynamo_user, gur.id_Centro_gest, em.id_centro_gest 
	from entrasp.giornate_e_users_da_rendicontare gur, entrasp.employers em
	where gur.dynamo_user=em.dynamo_user and gur.id_Centro_gest!=em.id_centro_gest and em.codice_azienda in('QUANTYX', 'QUANTYXSRL')

update entrasp.giornate_e_users_da_rendicontare gur
set id_centro_gest=em.id_centro_gest, 
centro_gest=entrasp.centri_gestionali_descr_noid(em.codice_part, em.id_centro_gest),
codice_ruolo=em.codice_ruolo,
ruolo=entrasp.ruolo_descr(em.codice_ruolo)
from entrasp.employers em
where gur.dynamo_user=em.dynamo_user and (gur.id_Centro_gest!=em.id_centro_gest or gur.codice_ruolo!=em.codice_ruolo) 
										  and em.codice_azienda in('QUANTYX', 'QUANTYXSRL')

--- righe che seguono per sistemare gli uffici anomali
									
									select * from entrasp.sondaggi
									where id_centro_gest=43 and codice_azienda in ('QUANTYX', 'QUANTYXSRL')
									
									select * from entrasp.modelli_test
									where id_centro_gest=43 and codice_azienda in ('QUANTYX', 'QUANTYXSRL')
									
									select * from entrasp.progetti
									where id_centro_gest=43 and codice_azienda in ('QUANTYX', 'QUANTYXSRL')
									
									select * from entrasp.cpl_trattamenti_centri_gestionali
									where id_centro_gest=43 and codice_azienda in ('QUANTYX', 'QUANTYXSRL')

									select codice_compito, codice_azienda, id_centro_gest, id_centro_gest_monitor from entrasp.compiti
									where id_centro_gest_monitor=43 and codice_azienda in ('QUANTYX', 'QUANTYXSRL')
									
									select dynamo_user, codice_azienda, id_centro_gest from entrasp.employers
									where id_centro_gest=43 and codice_azienda in ('QUANTYX', 'QUANTYXSRL')
									

SELECT DISTINCT DATE_TRUNC('YEAR',

																		CURRENT_DATE)::date AS DT_INIZIO_RIF,
	ENTRASP.LAST_DAY_YEAR(CURRENT_DATE) AS DT_FINE_RIF,
	AN.DYNAMO_USER,
	EM.NOME || ' ' || EM.COGNOME AS DENOMINAZIONE,
	ROUND(SUM(CSN.DURATA) / 480,
		2) AS DURATA,
	ENTRASP.CONSUNTIVAZIONI_TIME_CONSUMED_AZIENDA(DYNAMOUSER => AN.DYNAMO_USER,

										DATAINIZIO => (CURRENT_DATE - interval '12 months')::date, DATAFINE => CURRENT_DATE::date) AS DD_12_MONTHS,
	ENTRASP.CONSUNTIVAZIONI_TIME_CONSUMED_AZIENDA(DYNAMOUSER => AN.DYNAMO_USER,

										DATAINIZIO => (CURRENT_DATE - interval '1 months')::date, DATAFINE => CURRENT_DATE::date) AS DD_1_MONTHS,
	ENTRASP.CONSUNTIVAZIONI_TIME_CONSUMED_AZIENDA(DYNAMOUSER => AN.DYNAMO_USER,

										DATAINIZIO => ENTRASP.FIRST_DAY_PREVIOUS_MONTH(CURRENT_DATE)::date, DATAFINE => ENTRASP.LAST_DAY_PREVIOUS_MONTH(CURRENT_DATE)) AS PREV_MONTH,
	ENTRASP.CONSUNTIVAZIONI_TIME_CONSUMED_AZIENDA(DYNAMOUSER => AN.DYNAMO_USER,

										DATAINIZIO => (CURRENT_DATE - interval '3 months')::date, DATAFINE => CURRENT_DATE::date) AS DD_3_MONTHS
FROM ENTRASP.CONSUNTIVAZIONI CSN
INNER JOIN ENTRASP.ANAGRAFICHE_ID AN ON CSN.ID_RISORSA = AN.ID_ANAGRAFICA
AND CSN.CODICE_PART = AN.CODICE_PART
INNER JOIN
	(SELECT DISTINCT ES.DYNAMO_USER,
			ES.COGNOME,
			ES.NOME
		FROM ENTRASP.EMPLOYERS ES) EM ON AN.DYNAMO_USER = EM.DYNAMO_USER
WHERE CSN.CODICE_AZIENDA IN('QUANTYX')
	AND AN.DYNAMO_USER = 'fbenedetti@quantyxsim.com'
GROUP BY AN.DYNAMO_USER,
	EM.NOME || ' ' || EM.COGNOME
ORDER BY DYNAMO_USER;


SELECT DYNAMO_USER,
			COGNOME,
			NOME,
			codice_azienda,
			minuti_richiesti_giornalieri
		FROM ENTRASP.EMPLOYERS ES
		where dynamo_user like '%guadagnini%'


select *
from entrasp.giornate_e_users_da_rendicontare
where dynamo_user like '%benedetti%'


-- query di creazione di 
select * 
from entrasp.individua_giornate_e_users_da_rendicontare
where username like '%maccario%'

SELECT date_trunc('day'::text, gg.gg)::date AS giorno,
    du.username,
    du.minuti_richiesti_giornalieri,
    du.min_extra_anomali_tr,
    entrasp.ruolo_descr(du.codice_ruolo::character varying) AS ruolo,
    entrasp.centri_gestionali_descr(du.codice_part::text, du.id_centro_gest) AS centro_gest,
    du.codice_ruolo,
    du.codice_part,
    du.codice_azienda,
    du.id_centro_gest
   FROM generate_series(CURRENT_DATE - 400::double precision * '1 day'::interval, CURRENT_DATE::timestamp without time zone, '1 day'::interval) gg(gg),
   entrasp.users du
  WHERE 
  du.username like '%guadagnini%' and

NOT ((du.username::text || '-'::text) || date_trunc('day'::text, gg.gg)::date IN ( 
	  SELECT (GIORNATE_E_USERS_DA_RENDICONTARE.DYNAMO_USER::text || '-'::text) || GIORNATE_E_USERS_DA_RENDICONTARE.GIORNO
	  FROM ENTRASP.GIORNATE_E_USERS_DA_RENDICONTARE))


AND DATE_TRUNC('day'::text,

					GG.GG)::date >= DU.DATA_AVVIO_COLLABORAZIONE

order by date_trunc('day'::text, gg.gg)::date desc


AND DATE_TRUNC('day'::text,

					GG.GG)::date <= COALESCE(DU.DATA_FINE_COLLABORAZIONE,

																						CURRENT_DATE)
AND NOT (DATE_TRUNC('day'::text,

										GG.GG)::date IN
										(SELECT FESTIVITA.DATA
											FROM ENTRASP.FESTIVITA
											WHERE FESTIVITA.CODICE_AZIENDA IS NULL
												AND FESTIVITA.DYNAMO_USER IS NULL))
AND NOT ((DU.USERNAME::text || '-'::text) || DATE_TRUNC('day'::text,

																																														GG.GG)::date IN
	(SELECT (FESTIVITA.DYNAMO_USER::text || '-'::text) || FESTIVITA.DATA
		FROM ENTRASP.FESTIVITA
		WHERE FESTIVITA.DURATA = 0::numeric
			AND ((FESTIVITA.DYNAMO_USER::text || '-'::text) || FESTIVITA.DATA) IS NOT NULL));


-- query per inserire in automatico i compiti legati ad un'azienda o progetto

perform entrasp.compito_insert_from_pf(pf.codice_azienda, current_date, current_date, pf.titolo, null,
		coalesce(snd.id_centro_gest, pr.id_centro_gest),	pf.id_fase,	'A')
	from entrasp.progetti_fasi pf
	left join entrasp.compiti cmp
	on pf.id_fase=cmp.id_fase and pf.codice_azienda=cmp.codice_azienda
	left join entrasp.sondaggi snd
	on pf.id_sondaggio=snd.id_sondaggio and pf.codice_azienda=snd.codice_azienda
	inner join entrasp.progetti pr
	on pf.id_progetto=pr.id_progetto and pf.codice_azienda=pr.codice_azienda
	inner join entrasp.centri_gestionali cg
	on pr.id_centro_gest=cg.id_centro_gest and pr.codice_part=cg.codice_part
	inner join entrasp.argomenti_argomenti aa
	on cg.id_argomento=aa.id_argomento_son
	where pr.stato!='C' and (id_argomento_father=3861 or coalesce(snd.id_centro_gest, pr.id_centro_gest)=0 or coalesce(snd.id_centro_gest, pr.id_centro_gest) is null) and cmp.codice_compito is null
	and pf.codice_azienda=NEW.codice_azienda and pf.id_fase=NEW.id_fase;

--select entrasp.duplica_argomento(45641)

-- query per trovare tutti i compiti di un'azienda
select * from entrasp.compiti
where codice_azienda='BGROUP';


