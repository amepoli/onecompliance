select entrasp.crea_json_verifica('DEMO', 50, 1, 235, 255);

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
rispostamultipla=>'array[86033, 86034]'::varchar, noterisposta=>'risposta tipo combobox: sì'::text);

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


