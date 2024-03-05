-- FUNCTION: entrasp.update_dynamo_user(text, text, character varying)

-- DROP FUNCTION IF EXISTS entrasp.update_dynamo_user(text, text, character varying);

CREATE OR REPLACE FUNCTION entrasp.update_dynamo_user(
	global_id_anagrafiche text,
	global_user_companies text,
	global_user_name character varying)
    RETURNS boolean
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
declare user_companies varchar[]; i integer; idutente numeric; codicepart varchar;
begin
global_user_companies:=replace(global_user_companies, ')','');
global_user_companies:=replace(global_user_companies, '(','');

--select 1;

update entrasp.anagrafiche_id set dynamo_user=null where dynamo_user=trim(global_user_name);

select string_to_array(global_user_companies, ',') into user_companies;
raise notice 'uc: %', user_companies;
for i in array_lower(user_companies, 1).. array_upper(user_companies, 1) loop
		select codice_part from entrasp.aziende 
		where codice_azienda=trim(user_companies[i]) 
		into codicepart;
		raise notice 'cp: %', codicepart;
		idutente:= array_to_string(REGEXP_MATCHES(global_id_anagrafiche, codicepart||'-'||'([0-9]+)'),'')::numeric;
		raise notice 'iu: %', idutente;
 		raise notice 'gun: %', global_user_name;
		update entrasp.anagrafiche_id set dynamo_user=trim(global_user_name) where codice_part=codicepart and id_anagrafica=idutente;
end loop;
return true;
end
$BODY$;

ALTER FUNCTION entrasp.update_dynamo_user(text, text, character varying)
    OWNER TO postgres;


select entrasp.update_dynamo_user(('AKSIASGR-26','ALCEDOSGR-37','AMBIENTASGR-14','CLESSIDRASGR-27','CONSILIUMSGR-27','FSI-22','GRADIENTE-33','IGISGR-10','NEXTALIASGR-32','PMPARTNERSSGR-27','PROGRESSIO-27','QUANTYX-298','QUATTROR-20','WISESGR-33')::text, ('AKSIASGR','ALCEDOSGR','AMBIENTASGR','CLESSIDRASGR','CONSILIUMSGR','FSI','GRADIENTESGR','IGISGR','NEXTALIASGR','PMPARTNERSSGR','PROGRESSIO','QUANTYX','QUATTROR','WISESGR')::text, 'fbordignon@quantyxsim.com')

select id_anagrafica, codice_part, dynamo_user 
from entrasp.anagrafiche_id
where codice_part='QUANTYX' and id_anagrafica=298;



select entrasp.aggiorna_giornate_e_users_da_rendicontare('niannetta')


-- FUNCTION: entrasp.aggiorna_cdms_bo_cdms_risorse(text, numeric, boolean)
ALTER TABLE IF EXISTS entrasp.modelli_test_risultati_righe
    ADD COLUMN font_color character varying(30) COLLATE pg_catalog."default";
	
select entrasp.aggiorna_giornate_e_users_da_rendicontare('fbordignon@quantyxsim.com')

select * from entrasp.giornate_e_users_da_rendicontare
where dynamo_user='fbordignon@quantyxsim.com'
order by giorno desc

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
	
	
		SELECT  entrasp.aggiorna_giornate_e_users_da_rendicontare(tab.dynamo_user)		
	FROM 
	(select distinct dynamo_user from 
	 entrasp.giornate_e_users_da_rendicontare
	WHERE (codice_ruolo IS NULL or ruolo is null)
	and codice_azienda in ('QUANTYX','QUANTYXSRL')) tab
	
	
	
	select id_anagrafica, codice_part, dynamo_user
	from entrasp.anagrafiche_id
	where codice_part='QUANTYX' and dynamo_user='niannetta'
	
	
	update entrasp.giornate_e_users_da_rendicontare gur
	set codice_ruolo=an.codice_ruolo, id_centro_Gest=an.id_centro_Gest 
	from entrasp.anagrafiche_id an
	where an.dynamo_user=gur.dynamo_user and an.codice_part='QUANTYX'
	and (gur.codice_ruolo is null or gur.id_Centro_gest is null)
	
	
	update entrasp.giornate_e_users_da_rendicontare gur
	set ruolo=rl.descrizione
	from entrasp.ruoli rl
	where gur.codice_ruolo=rl.codice_ruolo and gur.ruolo is null
	
	
	delete from entrasp.giornate_e_users_da_rendicontare gur
	where dynamo_user='d.tonicello95@gmail.com'
	order by giorno desc
	
	
	update entrasp.consuntivazioni csn
set date_time_begin=date_time_begin- 1050*interval '1 minutes',
date_time_end=date_time_end- 1050*interval '1 minutes'
from entrasp.anagrafiche_id an 
	where csn.codice_azienda='QUANTYXSRL'
	and csn.codice_part=an.codice_part and csn.id_risorsa=an.id_anagrafica
	and an.dynamo_user='lrobboni'
	and csn.note='Attività generica di rendicontazione'
	and an.id_anagrafica=256
	and extract(hour from date_time_begin)=18
	
	
		select  date_time_begin, date_time_begin- 1050*interval '1 minutes',
date_time_end, date_time_end- 1050*interval '1 minutes', extract(hour from date_time_begin)
from entrasp.anagrafiche_id an, entrasp.consuntivazioni csn 
	where csn.codice_azienda='QUANTYXSRL'
	and csn.codice_part=an.codice_part and csn.id_risorsa=an.id_anagrafica
	and an.dynamo_user='lrobboni'
	and csn.note='Attività generica di rendicontazione'
	and an.id_anagrafica=256 and extract(hour from date_time_begin)=18
	
	
	
	select codice_azienda, id_cons, date_time_begin, date_time_end, durata from entrasp.consuntivazioni csn
	inner join entrasp.anagrafiche_id an on csn.id_risorsa=an.id_anagrafica and csn.codice_part=an.codice_part
	where durata >600 and an.dynamo_user='annarita' order by date_time_begin desc


	select codice_azienda, id_cons, date_time_begin, date_time_end, durata from entrasp.consuntivazioni csn
	inner join entrasp.anagrafiche_id an on csn.id_risorsa=an.id_anagrafica and csn.codice_part=an.codice_part
	where an.dynamo_user like '%pellizz%'  and id_cons=5429
	
	
	select * from entrasp.ruoli
	where descrizione ilike '%manager%'


select * from entrasp.giornate_e_users_da_rendicontare
where dynamo_user='lrobboni'
order by giorno desc

update entrasp.giornate_e_users_da_rendicontare
set id_centro_gest=36, centro_gest='SRL- RM Private Equity'
where id_centro_gest=43 and codice_azienda in('QUANTYX', 'QUANTYXSRL')

select id_centro_gest, codice_ruolo, codice_part, id_anagrafica, dynamo_user
from entrasp.anagrafiche_id where dynamo_user='AFossati' and codice_part='QUANTYX'

select * from entrasp.employers
where dynamo_user='AFossati'

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
order by query_start as
									
									
																
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
									
									


	-- coerenza tra employers e giornate_e_users_da_rendicontare							
	select distinct gur.dynamo_user, em.dynamo_user, gur.id_Centro_gest, em.id_centro_gest 
	from entrasp.giornate_e_users_da_rendicontare gur, entrasp.employers em
	where gur.dynamo_user=em.dynamo_user and gur.id_Centro_gest!=em.id_centro_gest and em.codice_azienda in('QUANTYX', 'QUANTYXSRL')

update entrasp.giornate_e_users_da_rendicontare gur
set id_centro_gest=em.id_centro_gest, centro_gest=entrasp.centri_gestionali_descr_noid(em.codice_part, em.id_centro_gest)
from entrasp.employers em
where gur.dynamo_user=em.dynamo_user and gur.id_Centro_gest!=em.id_centro_gest and em.codice_azienda in('QUANTYX', 'QUANTYXSRL')

