-- DIFFERENZE TRA id_risultato dei modelli_test
select mvr.codice_azienda, mvr.id_modello_test, 
mvr.id_modello_test_vr, mtold.id_risultato, mvr.id_risultato
from r20240131.modelli_test_vr mtold
inner join entrasp.modelli_test_vr mvr
on mtold.codice_azienda=mvr.codice_azienda 
and mtold.id_modello_test=mvr.id_modello_test
and mtold.id_modello_test_vr=mvr.id_modello_test
where mtold.codice_azienda='FININTSGR' and mvr.codice_azienda='FININTSGR'
and mvr.id_risultato!=mtold.id_risultato 


-- DIFFERENZE TRA SONDAGGI
select ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione, sndold.id_modello_test, 
sndold.id_modello_test_vr, snd.id_modello_test_vr, ssold.pct_da, ss.pct_da, ss.object_key, ss.object_description
from r20240131.sondaggi_somministrati ssold
inner join entrasp.sondaggi_somministrati ss
on ssold.codice_azienda=ss.codice_azienda 
and ssold.id_sondaggio=ss.id_sondaggio
and ssold.id_somministrazione=ss.id_somministrazione
inner join entrasp.sondaggi sndold
on ssold.codice_azienda=sndold.codice_azienda and ssold.id_sondaggio=sndold.id_sondaggio
inner join entrasp.sondaggi snd
on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio=snd.id_sondaggio
where ssold.codice_azienda='FININTSGR' and ss.codice_azienda='FININTSGR'
and sndold.id_modello_test=snd.id_modello_test
and ss.pct_da!=ssold.pct_da and ss.stato='C' and ssold.stato='C' 
order by sndold.id_modello_test, sndold.id_modello_test_vr

-- DIFFERENZE TRA DOMANDE
select dmold.codice_azienda, dmold.id_domanda, dm.id_domanda, dm.id_modello_test, dmold.descrizione, dm.descrizione 
from r20240131.domande dmold
full outer join entrasp.domande dm
on dmold.codice_azienda=dm.codice_azienda and dmold.id_modello_test=dm.id_modello_test and dmold.id_modello_test_vr=dm.id_modello_test_vr and dmold.id_domanda=dm.id_domanda
where dmold.codice_azienda='FININTSGR' and dm.codice_azienda='FININTSGR'
and ((dmold.id_domanda is null or dm.id_domanda is null) or dmold.punteggio!=dm.punteggio)

-- DIFFERENZE TRA RISPOSTE PREVISTE
select rpold.codice_azienda, rpold.id_domanda, rp.id_domanda, 
rpold.id_risposta_prev, rp.id_risposta_prev, rpold.risposta, rp.risposta 
from r20240131.risposte_previste rpold
full outer join entrasp.risposte_previste rp
on rpold.codice_azienda=rp.codice_azienda and rpold.id_modello_test=rp.id_modello_test 
and rpold.id_modello_test_vr=rp.id_modello_test_vr and rpold.id_domanda=rp.id_domanda
and rpold.id_risposta_prev=rp.id_risposta_prev
where rpold.codice_azienda='FININTSGR' and rp.codice_azienda='FININTSGR'
and (rpold.id_risposta_prev is null or rp.id_risposta_prev is null)

-- DIFFERENZE TRA PESO RISPOSTE PREVISTE
select rpold.codice_azienda, rpold.id_domanda, rp.id_domanda, 
rpold.id_risposta_prev, rp.id_risposta_prev, rpold.risposta, rp.risposta 
from r20240131.risposte_previste rpold
inner join entrasp.risposte_previste rp
on rpold.codice_azienda=rp.codice_azienda and rpold.id_modello_test=rp.id_modello_test 
and rpold.id_modello_test_vr=rp.id_modello_test_vr and rpold.id_domanda=rp.id_domanda
and rpold.id_risposta_prev=rp.id_risposta_prev
where rpold.codice_azienda='FININTSGR' and rp.codice_azienda='FININTSGR'
and (rpold.peso!= rp.peso)