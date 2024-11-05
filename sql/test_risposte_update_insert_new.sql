select entrasp.crea_json_verifica('DEMO', 50, 1, 235, 255);

select id_domanda, descrizione, id_modello_test, id_modello_test_vr
from entrasp.domande dm
where codice_azienda='DEMO' and id_modello_test=50 and id_modello_test_vr=1;

select entrasp.risposte_update_insert_new(
codiceazienda=>'DEMO'::varchar,  iddomanda=>3::numeric, 
idsondaggio=>235::numeric, idsomministrazione=>255::numeric, 
rispostadate=>'2024-10-28'::date, peso_=>20,
noterisposta=>'risposta di tipo data 2'::text);

select * from entrasp.risposte 
where codice_azienda='DEMO' and id_sondaggio=235 and id_somministrazione=255 and id_domanda=3;

delete from entrasp.risposte
where codice_azienda='DEMO' and id_sondaggio=235 and id_somministrazione=255;

select * from entrasp.risposte_previste 
where id_domanda=5 
and codice_azienda='DEMO' and id_modello_test=50 and id_modello_test_vr=1

select * from entrasp.risposte 
where codice_azienda='DEMO' 
and id_sondaggio=235 and id_somministrazione=255 and id_domanda=5;

select sondaggio_completato, giudizio
from entrasp.sondaggi
where codice_azienda='DEMO' and id_sondaggio=235



********
select entrasp.risposte_update_insert_new(
codiceazienda=>'DEMO'::varchar,  iddomanda=>4::numeric, 
idsondaggio=>235::numeric, idsomministrazione=>255::numeric, 
rispostanum=>4::numeric, peso_=>40,
noterisposta=>'risposta di tipo number'::text);

select * from entrasp.risposte where codice_azienda='DEMO' and id_sondaggio=235 and id_somministrazione=255 and id_domanda=4;

delete from entrasp.risposte
where codice_azienda='DEMO' and id_sondaggio=235 and id_somministrazione=255;

select * from entrasp.risposte_previste 
where id_domanda=5 
and codice_azienda='DEMO' and id_modello_test=50 and id_modello_test_vr=1

select * from entrasp.risposte 
where codice_azienda='DEMO' and id_sondaggio=235 and id_somministrazione=255 and id_domanda=5;

select sondaggio_completato, giudizio
from entrasp.sondaggi
where codice_azienda='DEMO' and id_sondaggio=235

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

select sondaggio_completato, giudizio
from entrasp.sondaggi
where codice_azienda='DEMO' and id_sondaggio=235

select * from entrasp.risposte_previste 
where id_domanda=5
and codice_azienda='DEMO' and id_modello_test=50 and id_modello_test_vr=1


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
codiceazienda=>'DEMO'::varchar, iddomanda=>2::numeric, 
idsondaggio=>235::numeric, idsomministrazione=>255::numeric, 
rispostamultipla=>array[]::numeric[], noterisposta=>'risposta_checkbox'::text);

select * from entrasp.risposte 
where codice_azienda='DEMO' and id_sondaggio=235 
and id_somministrazione=255 and id_domanda=2;

    DELETE FROM entrasp.risposte
		    WHERE codice_azienda = 'DEMO'
		      AND id_modello_test = 50
		      AND id_modello_test_vr = 1
		      AND id_domanda = 2
			  and id_sondaggio=235
			  and id_somministrazione=255
	      AND id_risposta_prev NOT IN (SELECT unnest(array[86034]));



select rs.id_domanda, dm.descrizione, rs.id_risposta, entrasp.sondaggi_somministrati_complete(rs.codice_azienda,
	rs.id_somministrazione,
	rs.id_sondaggio), entrasp.domanda_active(
	rs.codice_azienda,
	rs.id_modello_test,
	rs.id_modello_test_vr,
	dm.id_domanda,
	rs.id_somministrazione,
	rs.id_sondaggio),
	ss.somministrazione_completata,
	rs.id_sondaggio,
	rs.id_somministrazione
from entrasp.risposte rs
right join entrasp.domande dm
using (codice_azienda, id_modello_test, id_modello_test_vr, id_domanda)
right join entrasp.sondaggi_somministrati ss
on rs.codice_azienda=ss.codice_azienda and rs.id_sondaggio=ss.id_sondaggio 
and rs.id_somministrazione=ss.id_somministrazione
where ss.codice_azienda='DEMO' and ss.id_sondaggio=235

select * from entrasp.risposte_previste 
Esawhere id_domanda=2
and codice_azienda='DEMO' and id_modello_test=50 and id_modello_test_vr=1



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



select rs.id_domanda, dm.descrizione, rs.id_risposta, entrasp.sondaggi_somministrati_complete(rs.codice_azienda,
	rs.id_somministrazione,
	rs.id_sondaggio), entrasp.domanda_active(
	rs.codice_azienda,
	rs.id_modello_test,
	rs.id_modello_test_vr,
	dm.id_domanda,
	rs.id_somministrazione,
	rs.id_sondaggio),
	ss.somministrazione_completata,
	rs.id_sondaggio,
	rs.id_somministrazione
from entrasp.risposte rs
right join entrasp.domande dm
using (codice_azienda, id_modello_test, id_modello_test_vr, id_domanda)
right join entrasp.sondaggi_somministrati ss
on rs.codice_azienda=ss.codice_azienda and rs.id_sondaggio=ss.id_sondaggio 
and rs.id_somministrazione=ss.id_somministrazione
where ss.codice_azienda='DEMO' and ss.id_sondaggio=235



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


