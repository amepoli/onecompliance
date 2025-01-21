SELECT ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione, snd.id_modello_test
FROM entrasp.sondaggi_somministrati ss
INNER JOIN entrasp.sondaggi snd 
    ON ss.codice_azienda = snd.codice_azienda 
   AND ss.id_sondaggio = snd.id_sondaggio
WHERE snd.codice_azienda = 'FININTSGR' 
  AND snd.stato = 'C' 
  and snd.id_modello_test in (16, 616, 621, 634);



select entrasp.aggiorna_punteggi_somministrazioni(
	'FININTSGR',
	1609,
	1433
	);

select ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione, ss.pct_da, ss.giudizio, ss.object_key, ss.object_description
from entrasp.sondaggi_somministrati ss
where ss.codice_azienda='FININTSGR' and ss.id_somministrazione=1433


select id_modello_test, id_modello_Test_vr, count(id_sondaggio)
from entrasp.sondaggi
where codice_azienda='FININTSGR'
 AND stato = 'C' 
  and id_modello_test in (16, 616, 621, 634)
group by id_modello_test, id_modello_Test_vr
order by id_modello_test;


-- DIFFERENZE TRA SONDAGGI
select ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione, sndold.id_modello_test, 
sndold.id_modello_test_vr, snd.id_modello_test_vr, ssold.pct_da, ss.pct_da, ssold.giudizio, ss.giudizio, ss.object_key, ss.object_description
from ripristino_per_test.sondaggi_somministrati ssold
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
--and ss.object_description ~* '(torneria|sace|manurelli|corkscrew|eurofin|ecotek|sace)'
order by sndold.id_modello_test, sndold.id_modello_test_vr


-- SOMMINISTRAZIONI DIFFERENTI RAGGRUPPATE PER ID_MODELLO_TEST

SELECT 
    ss.codice_azienda,
    sndold.id_modello_test,
    sndold.id_modello_test_vr,
	count(ss.id_somministrazione) as n_somm,
    array_agg(ss.id_somministrazione ORDER BY ss.id_somministrazione) AS id_somministrazioni
FROM 
    ripristino_per_test.sondaggi_somministrati ssold
INNER JOIN 
    entrasp.sondaggi_somministrati ss
    ON ssold.codice_azienda = ss.codice_azienda 
    AND ssold.id_sondaggio = ss.id_sondaggio
    AND ssold.id_somministrazione = ss.id_somministrazione
INNER JOIN 
    entrasp.sondaggi sndold
    ON ssold.codice_azienda = sndold.codice_azienda 
    AND ssold.id_sondaggio = sndold.id_sondaggio
INNER JOIN 
    entrasp.sondaggi snd
    ON ss.codice_azienda = snd.codice_azienda 
    AND ss.id_sondaggio = snd.id_sondaggio
WHERE 
    ssold.codice_azienda = 'FININTSGR'
    AND ss.codice_azienda = 'FININTSGR'
    AND sndold.id_modello_test = snd.id_modello_test
   -- AND ss.pct_da != ssold.pct_da
    AND ss.stato = 'C'
    AND ssold.stato = 'C'
	  and snd.id_modello_test in (16, 616, 621, 634)
GROUP BY 
    ss.codice_azienda, 
    sndold.id_modello_test, 
    sndold.id_modello_test_vr
ORDER BY 
    sndold.id_modello_test, 
    sndold.id_modello_test_vr;


-- DIFFERENZE TRA id_risultato dei modelli_test
select mvr.codice_azienda, mvr.id_modello_test, 
mvr.id_modello_test_vr, mtold.id_risultato, mvr.id_risultato
from ripristino_per_test.modelli_test_vr mtold
inner join entrasp.modelli_test_vr mvr
on mtold.codice_azienda=mvr.codice_azienda 
and mtold.id_modello_test=mvr.id_modello_test
and mtold.id_modello_test_vr=mvr.id_modello_test
where mtold.codice_azienda='FININTSGR' and mvr.codice_azienda='FININTSGR'
and mvr.id_risultato!=mtold.id_risultato 

-- DIFFERENZE TRA DOMANDE
select dmold.codice_azienda, dmold.id_domanda, dm.id_domanda, dm.id_modello_test, dmold.descrizione, dm.descrizione 
from ripristino_per_test.domande dmold
full outer join entrasp.domande dm
on dmold.codice_azienda=dm.codice_azienda and dmold.id_modello_test=dm.id_modello_test and dmold.id_modello_test_vr=dm.id_modello_test_vr and dmold.id_domanda=dm.id_domanda
where dmold.codice_azienda='FININTSGR' and dm.codice_azienda='FININTSGR'
and ((dmold.id_domanda is null or dm.id_domanda is null) or dmold.punteggio!=dm.punteggio)

-- DIFFERENZE TRA RISPOSTE PREVISTE
select rpold.codice_azienda, rpold.id_domanda, rp.id_domanda, 
rpold.id_risposta_prev, rp.id_risposta_prev, rpold.risposta, rp.risposta 
from ripristino_per_test.risposte_previste rpold
full outer join entrasp.risposte_previste rp
on rpold.codice_azienda=rp.codice_azienda and rpold.id_modello_test=rp.id_modello_test 
and rpold.id_modello_test_vr=rp.id_modello_test_vr and rpold.id_domanda=rp.id_domanda
and rpold.id_risposta_prev=rp.id_risposta_prev
where rpold.codice_azienda='FININTSGR' and rp.codice_azienda='FININTSGR'
and (rpold.id_risposta_prev is null or rp.id_risposta_prev is null)

-- DIFFERENZE TRA PESO RISPOSTE PREVISTE O FLAG NON APPLICABILE
select rpold.codice_azienda, rpold.id_domanda, rp.id_domanda, 
rpold.id_risposta_prev, rp.id_risposta_prev, rpold.risposta, rp.risposta 
from ripristino_per_test.risposte_previste rpold
inner join entrasp.risposte_previste rp
on rpold.codice_azienda=rp.codice_azienda and rpold.id_modello_test=rp.id_modello_test 
and rpold.id_modello_test_vr=rp.id_modello_test_vr and rpold.id_domanda=rp.id_domanda
and rpold.id_risposta_prev=rp.id_risposta_prev
where rpold.codice_azienda='FININTSGR' and rp.codice_azienda='FININTSGR'
and ((rpold.peso!= rp.peso) or (rpold.cod_ext!=rp.cod_ext) or (rpold.flag_non_applicabile!=rp.flag_non_applicabile)) 


-- DIFFERENZE TRA RISPOSTE DATE

WITH risposte_aggregate AS (
    -- Raggruppiamo tutte le risposte in array per ogni combinazione di chiavi
    SELECT 
        rpold.codice_azienda,
        rpold.id_modello_test,
        rpold.id_modello_test_vr,
        rpold.id_domanda,
        rpold.id_sondaggio,
        rpold.id_somministrazione,
        array_agg(rpold.id_risposta_prev) AS risposte_old,
        array_agg(rp.id_risposta_prev) AS risposte_new
    FROM 
        ripristino_per_test.risposte rpold
    FULL OUTER JOIN entrasp.risposte rp
        ON rpold.codice_azienda = rp.codice_azienda
           AND rpold.id_modello_test = rp.id_modello_test
           AND rpold.id_modello_test_vr = rp.id_modello_test_vr
           AND rpold.id_domanda = rp.id_domanda
           AND rpold.id_sondaggio = rp.id_sondaggio
           AND rpold.id_somministrazione = rp.id_somministrazione
    WHERE 
        (rpold.codice_azienda = 'FININTSGR' OR rp.codice_azienda = 'FININTSGR')
    	and (rpold.codice_azienda, rpold.id_sondaggio, rpold.id_somministrazione)
		in (select ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione
from ripristino_per_test.sondaggi_somministrati ssold
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
and ss.pct_da!=ssold.pct_da and ss.stato='C' and ssold.stato='C' )
	GROUP BY 
        rpold.codice_azienda,
        rpold.id_modello_test,
        rpold.id_modello_test_vr,
        rpold.id_domanda,
        rpold.id_sondaggio,
        rpold.id_somministrazione
)
-- Confrontiamo gli array delle risposte
SELECT 
    codice_azienda,
    id_modello_test,
    id_modello_test_vr,
    id_domanda,
    id_sondaggio,
    id_somministrazione,
    risposte_old,
    risposte_new,
    -- Confrontiamo se gli array sono diversi
    NOT (risposte_old @> risposte_new AND risposte_new @> risposte_old) AS arrays_differ
FROM 
    risposte_aggregate
WHERE 
    -- Se gli array differiscono o uno dei due è NULL
    risposte_old IS NULL OR risposte_new IS NULL OR NOT (risposte_old @> risposte_new AND risposte_new @> risposte_old);


-- modelli_test_risultati_righe
SELECT 
  mtrold.codice_azienda, mtr.id_risultato, mtrold.pct_da, mtr.pct_da, mtrold.descrizione, mtr.descrizione
FROM
	ripristino_per_test.modelli_test_risultati_righe mtrold
	inner join entrasp.modelli_test_risultati_righe mtr
	on mtrold.codice_azienda=mtr.codice_azienda and mtrold.id_risultato=mtr.id_risultato and mtrold.prog_riga=mtr.prog_riga
WHERE 
 ((mtrold.pct_da!=mtr.pct_da) or (mtrold.descrizione!=mtr.descrizione))
 and mtrold.codice_azienda='FININTSGR'

 select id_risultato from entrasp.modelli_test_vr where id_modello_test=634 and id_modello_test_vr=1 and codice_azienda='FININTSGR'

 select id_modello_test, id_modello_test_vr from entrasp.modelli_test_vr where id_risultato=10 and codice_azienda='FININTSGR'

 