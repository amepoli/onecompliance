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
sndold.id_modello_test_vr, snd.id_modello_test_vr, ssold.pct_da as pct_da_cfr, ss.pct_da as pct_da_attuale, ssold.giudizio_da_cfr, ss.giudizio_attuale, ss.object_key, ss.object_description
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

 -- DISCORDANZE DATI DI INPUT DOCUMENTI PERSONE FISICHE A PARITA' DI CODICE CLIENTE

SELECT 
    vaf.cliente,
    COUNT(DISTINCT vaf.numero_doc) AS distinct_numero_doc,
    COUNT(DISTINCT TO_DATE(vaf.data_rilascio, 'DD/MM/YYYY')) AS distinct_data_rilascio,
    COUNT(DISTINCT TO_DATE(vaf.data_scadenza, 'DD/MM/YYYY')) AS distinct_data_scadenza,
    COUNT(DISTINCT vaf.tipo_doc) AS distinct_tipo_doc,
    COUNT(DISTINCT vaf.rilasciato_da) AS distinct_rilasciato_da
FROM 
    imports.verifiche_anagrafiche_finint vaf
WHERE 
    vaf.cliente IN (SELECT codice FROM entrasp.anagrafiche_vr WHERE codice_part = 'FININT') 
    AND vaf.sesso IS NOT NULL
GROUP BY 
    vaf.cliente
HAVING 
    COUNT(DISTINCT vaf.numero_doc) > 1
    OR COUNT(DISTINCT TO_DATE(vaf.data_rilascio, 'DD/MM/YYYY')) > 1
    OR COUNT(DISTINCT TO_DATE(vaf.data_scadenza, 'DD/MM/YYYY')) > 1
    OR COUNT(DISTINCT vaf.tipo_doc) > 1
    OR COUNT(DISTINCT vaf.rilasciato_da) > 1;



	select * from imports.verifiche_anagrafiche_finint
where cliente
in
(SELECT 
    vaf.cliente
FROM 
    imports.verifiche_anagrafiche_finint vaf
WHERE 
    vaf.cliente IN (SELECT codice FROM entrasp.anagrafiche_vr WHERE codice_part = 'FININT') 
    AND vaf.sesso IS NOT NULL
GROUP BY 
    vaf.cliente
HAVING 
    COUNT(DISTINCT vaf.numero_doc) > 1
    OR COUNT(DISTINCT TO_DATE(vaf.data_rilascio, 'DD/MM/YYYY')) > 1
    OR COUNT(DISTINCT TO_DATE(vaf.data_scadenza, 'DD/MM/YYYY')) > 1
    OR COUNT(DISTINCT vaf.tipo_doc) > 1
    OR COUNT(DISTINCT vaf.rilasciato_da) > 1)

-- DISCORDANZE DATI DI INPUT PERSONE GIURIDICHE A PARITA' DI CODICE CLIENTE
select * from imports.verifiche_anagrafiche_finint
where cliente
in(SELECT 
    vaf.cliente
FROM 
    imports.verifiche_anagrafiche_finint vaf
GROUP BY 
    vaf.cliente
HAVING 
    COUNT(DISTINCT CASE WHEN vaf.sesso IS NULL THEN vaf.cognome ELSE NULL END) > 1
    OR COUNT(DISTINCT COALESCE(vaf.nome || ' ' || vaf.cognome, vaf.cognome)) > 1
    OR COUNT(DISTINCT vaf.codice_fiscale) > 1
    OR COUNT(DISTINCT vaf.partita_iva) > 1
    OR COUNT(DISTINCT vaf.indirizzo_residenza) > 1
    OR COUNT(DISTINCT vaf.cap_residenza) > 1
    OR COUNT(DISTINCT vaf.localita_residenza) > 1
    OR COUNT(DISTINCT vaf.provincia_residenza) > 1
)

SELECT 
    vaf.cliente,
    COUNT(DISTINCT CASE WHEN vaf.sesso IS NULL THEN vaf.cognome ELSE NULL END) AS distinct_cognome_null_sesso,
    COUNT(DISTINCT COALESCE(vaf.nome || ' ' || vaf.cognome, vaf.cognome)) AS distinct_nome_cognome,
    COUNT(DISTINCT vaf.codice_fiscale) AS distinct_codice_fiscale,
    COUNT(DISTINCT vaf.partita_iva) AS distinct_partita_iva,
    COUNT(DISTINCT vaf.indirizzo_residenza) AS distinct_indirizzo_residenza,
    COUNT(DISTINCT vaf.cap_residenza) AS distinct_cap_residenza,
    COUNT(DISTINCT vaf.localita_residenza) AS distinct_localita_residenza,
    COUNT(DISTINCT vaf.provincia_residenza) AS distinct_provincia_residenza
FROM 
    imports.verifiche_anagrafiche_finint vaf
GROUP BY 
    vaf.cliente
HAVING 
    COUNT(DISTINCT CASE WHEN vaf.sesso IS NULL THEN vaf.cognome ELSE NULL END) > 1
    OR COUNT(DISTINCT COALESCE(vaf.nome || ' ' || vaf.cognome, vaf.cognome)) > 1
    OR COUNT(DISTINCT vaf.codice_fiscale) > 1
    OR COUNT(DISTINCT vaf.partita_iva) > 1
    OR COUNT(DISTINCT vaf.indirizzo_residenza) > 1
    OR COUNT(DISTINCT vaf.cap_residenza) > 1
    OR COUNT(DISTINCT vaf.localita_residenza) > 1
    OR COUNT(DISTINCT vaf.provincia_residenza) > 1;

 -- DISCORDANZE SUI DATI SUI DOCUMENTI IDENTIFICATIVI A PARITA' DI CODICE FISCALE
select * from imports.verifiche_anagrafiche_finint
where codice_fiscale in
(SELECT 
    vaf.codice_fiscale
FROM 
    imports.verifiche_anagrafiche_finint vaf
WHERE 
    vaf.sesso IS NOT NULL
GROUP BY 
    vaf.codice_fiscale
HAVING 
    COUNT(DISTINCT vaf.cliente) > 1
    OR COUNT(DISTINCT vaf.numero_doc) > 1
    OR COUNT(DISTINCT TO_DATE(vaf.data_rilascio, 'DD/MM/YYYY')) > 1
    OR COUNT(DISTINCT TO_DATE(vaf.data_scadenza, 'DD/MM/YYYY')) > 1
    OR COUNT(DISTINCT vaf.tipo_doc) > 1
    OR COUNT(DISTINCT vaf.rilasciato_da) > 1)

order by codice_fiscale


SELECT 
    vaf.codice_fiscale,
    COUNT(DISTINCT vaf.cliente) AS distinct_cliente,
    COUNT(DISTINCT vaf.numero_doc) AS distinct_numero_doc,
    COUNT(DISTINCT TO_DATE(vaf.data_rilascio, 'DD/MM/YYYY')) AS distinct_data_rilascio,
    COUNT(DISTINCT TO_DATE(vaf.data_scadenza, 'DD/MM/YYYY')) AS distinct_data_scadenza,
    COUNT(DISTINCT vaf.tipo_doc) AS distinct_tipo_doc,
    COUNT(DISTINCT vaf.rilasciato_da) AS distinct_rilasciato_da
FROM 
    imports.verifiche_anagrafiche_finint vaf
WHERE 
    vaf.sesso IS NOT NULL
GROUP BY 
    vaf.codice_fiscale
HAVING 
    COUNT(DISTINCT vaf.cliente) > 1
    OR COUNT(DISTINCT vaf.numero_doc) > 1
    OR COUNT(DISTINCT TO_DATE(vaf.data_rilascio, 'DD/MM/YYYY')) > 1
    OR COUNT(DISTINCT TO_DATE(vaf.data_scadenza, 'DD/MM/YYYY')) > 1
    OR COUNT(DISTINCT vaf.tipo_doc) > 1
    OR COUNT(DISTINCT vaf.rilasciato_da) > 1


-- DATI DISCORDANTI ALTRI DATI A PARITA' DI CODICE FISCALE
select * from imports.verifiche_anagrafiche_finint
where codice_fiscale in
(

SELECT 
    vaf.codice_fiscale
FROM 
    imports.verifiche_anagrafiche_finint vaf
GROUP BY 
    vaf.codice_fiscale
HAVING 
    COUNT(DISTINCT vaf.cliente) > 1
    OR COUNT(DISTINCT CASE WHEN vaf.sesso IS NULL THEN vaf.cognome ELSE NULL END) > 1
    OR COUNT(DISTINCT COALESCE(vaf.nome || ' ' || vaf.cognome, vaf.cognome)) > 1
    OR COUNT(DISTINCT vaf.partita_iva) > 1
    OR COUNT(DISTINCT vaf.indirizzo_residenza) > 1
    OR COUNT(DISTINCT vaf.cap_residenza) > 1
    OR COUNT(DISTINCT vaf.localita_residenza) > 1
    OR COUNT(DISTINCT vaf.provincia_residenza) > 1
)

order by codice_fiscale





SELECT 
    vaf.codice_fiscale,
    COUNT(DISTINCT vaf.cliente) AS distinct_cliente,
    COUNT(DISTINCT CASE WHEN vaf.sesso IS NULL THEN vaf.cognome ELSE NULL END) AS distinct_cognome_null_sesso,
    COUNT(DISTINCT COALESCE(vaf.nome || ' ' || vaf.cognome, vaf.cognome)) AS distinct_nome_cognome,
    COUNT(DISTINCT vaf.partita_iva) AS distinct_partita_iva,
    COUNT(DISTINCT vaf.indirizzo_residenza) AS distinct_indirizzo_residenza,
    COUNT(DISTINCT vaf.cap_residenza) AS distinct_cap_residenza,
    COUNT(DISTINCT vaf.localita_residenza) AS distinct_localita_residenza,
    COUNT(DISTINCT vaf.provincia_residenza) AS distinct_provincia_residenza
FROM 
    imports.verifiche_anagrafiche_finint vaf
GROUP BY 
    vaf.codice_fiscale
HAVING 
    COUNT(DISTINCT vaf.cliente) > 1
    OR COUNT(DISTINCT CASE WHEN vaf.sesso IS NULL THEN vaf.cognome ELSE NULL END) > 1
    OR COUNT(DISTINCT COALESCE(vaf.nome || ' ' || vaf.cognome, vaf.cognome)) > 1
    OR COUNT(DISTINCT vaf.partita_iva) > 1
    OR COUNT(DISTINCT vaf.indirizzo_residenza) > 1
    OR COUNT(DISTINCT vaf.cap_residenza) > 1
    OR COUNT(DISTINCT vaf.localita_residenza) > 1
    OR COUNT(DISTINCT vaf.provincia_residenza) > 1;


--Clienti con più data_ricezione uguali
SELECT codice_cliente,nome, cognome, data_ricezione, COUNT(*) AS numero_righe
FROM imports.verifiche_clienti_finint
WHERE codice_cliente IS NOT NULL AND data_ricezione IS NOT NULL
	AND COALESCE(TRIM(rete, '0'), '') != '7'
	AND data_verifica != '0'
	AND tipo_legame in ('A', 'M')
GROUP BY codice_cliente, data_ricezione, nome, cognome
HAVING COUNT(*) > 1
order by codice_cliente;

--Clienti con più data_verifica uguali
SELECT codice_cliente,nome, cognome, data_verifica, COUNT(*) AS numero_righe
FROM imports.verifiche_clienti_finint
WHERE codice_cliente IS NOT NULL AND data_ricezione IS NOT NULL
	AND COALESCE(TRIM(rete, '0'), '') != '7'
	AND data_verifica != '0'
	AND tipo_legame in ('A', 'M')
GROUP BY codice_cliente, data_verifica, nome, cognome
HAVING COUNT(*) > 1
order by codice_cliente;

--Clienti con più data_verifica e data_ricezione uguali
SELECT codice_cliente,nome, cognome, data_ricezione, data_verifica,rete, COUNT(*) AS numero_righe
FROM imports.verifiche_clienti_finint
WHERE codice_cliente IS NOT NULL 
  AND data_ricezione IS NOT NULL 
  AND data_verifica IS NOT NULL
	AND tipo_legame in ('A', 'M')
	AND COALESCE(TRIM(rete, '0'), '') != '7'
			  AND data_verifica != '0'
GROUP BY codice_cliente,nome, cognome, data_ricezione, data_verifica,rete
HAVING COUNT(*) > 1 order by codice_cliente;


--clienti a parità di codice, data_verifica e data_ricezione con informazioni diverse
SELECT distinct
    vc1.codice_cliente,
		vc1.nome,
		vc1.cognome,
    vc1.tipo_legame,
    vc1.data_verifica,
    vc1.data_ricezione,
    vc1.tipo_verifica AS tipo_verifica_1,
    vc2.tipo_verifica AS tipo_verifica_2,
    vc1.natura_giuridica AS natura_giuridica_1,
    vc2.natura_giuridica AS natura_giuridica_2,
    vc1.scopo_del_rapporto AS scopo_del_rapporto_1,
    vc2.scopo_del_rapporto AS scopo_del_rapporto_2,
    vc1.tipo_operazione AS tipo_operazione_1,
    vc2.tipo_operazione AS tipo_operazione_2,
    vc1.natura_rapporto AS natura_rapporto_1,
    vc2.natura_rapporto AS natura_rapporto_2,
    vc1.tipologia_rapporto_professi AS tipologia_rapporto_professi_1,
    vc2.tipologia_rapporto_professi AS tipologia_rapporto_professi_2,
    vc1.titolare_effettivo AS titolare_effettivo_1,
    vc2.titolare_effettivo AS titolare_effettivo_2,
    vc1.paese_attivita AS paese_attivita_1,
    vc2.paese_attivita AS paese_attivita_2,
    vc1.persona_esposta_politicamen AS persona_esposta_politicamen_1,
    vc2.persona_esposta_politicamen AS persona_esposta_politicamen_2,
    vc1.codtipolperspolitesposta AS codtipolperspolitesposta_1,
    vc2.codtipolperspolitesposta AS codtipolperspolitesposta_2,
    vc1.codrelazione_cli_esecutore AS codrelazione_cli_esecutore_1,
    vc2.codrelazione_cli_esecutore AS codrelazione_cli_esecutore_2,
    vc1.codrelazione_cli_titeff AS codrelazione_cli_titeff_1,
    vc2.codrelazione_cli_titeff AS codrelazione_cli_titeff_2,
    vc1.provincia_domicilio AS provincia_domicilio_1,
    vc2.provincia_domicilio AS provincia_domicilio_2,
    vc1.paese_domicilio AS paese_domicilio_1,
    vc2.paese_domicilio AS paese_domicilio_2,
    vc1.paese_residenza_fiscale AS paese_residenza_fiscale_1,
    vc2.paese_residenza_fiscale AS paese_residenza_fiscale_2,
    vc1.rilevata_presenza_banc_onlin AS rilevata_presenza_banc_onlin_1,
    vc2.rilevata_presenza_banc_onlin AS rilevata_presenza_banc_onlin_2,
    vc1.provincia_attivita AS provincia_attivita_1,
    vc2.provincia_attivita AS provincia_attivita_2,
    vc1.provincia_residenza_fiscale AS provincia_residenza_fiscale_1,
    vc2.provincia_residenza_fiscale AS provincia_residenza_fiscale_2
FROM imports.verifiche_clienti_finint vc1
JOIN imports.verifiche_clienti_finint vc2
    ON vc1.codice_cliente = vc2.codice_cliente
   AND vc1.data_verifica = vc2.data_verifica
   AND vc1.data_ricezione = vc2.data_ricezione
	 	AND COALESCE(TRIM(vc1.rete, '0'), '') != '7'
		AND COALESCE(TRIM(vc2.rete, '0'), '') != '7'
	AND vc1.data_verifica != '0'
	AND vc2.data_verifica != '0'
   AND vc1.tipo_legame IN ('A', 'M')
   AND vc2.tipo_legame IN ('A', 'M')
   AND (
        vc1.tipo_verifica <> vc2.tipo_verifica OR
        vc1.natura_giuridica <> vc2.natura_giuridica OR
        vc1.scopo_del_rapporto <> vc2.scopo_del_rapporto OR
        vc1.tipo_operazione <> vc2.tipo_operazione OR
        vc1.natura_rapporto <> vc2.natura_rapporto OR
        vc1.tipologia_rapporto_professi <> vc2.tipologia_rapporto_professi OR
        vc1.titolare_effettivo <> vc2.titolare_effettivo OR
        vc1.paese_attivita <> vc2.paese_attivita OR
        vc1.persona_esposta_politicamen <> vc2.persona_esposta_politicamen OR
        vc1.codtipolperspolitesposta <> vc2.codtipolperspolitesposta OR
        vc1.codrelazione_cli_esecutore <> vc2.codrelazione_cli_esecutore OR
        vc1.codrelazione_cli_titeff <> vc2.codrelazione_cli_titeff OR
        vc1.provincia_domicilio <> vc2.provincia_domicilio OR
        vc1.paese_domicilio <> vc2.paese_domicilio OR
        vc1.paese_residenza_fiscale <> vc2.paese_residenza_fiscale OR
        vc1.rilevata_presenza_banc_onlin <> vc2.rilevata_presenza_banc_onlin OR
        vc1.provincia_attivita <> vc2.provincia_attivita OR
        vc1.provincia_residenza_fiscale <> vc2.provincia_residenza_fiscale
   )

SELECT *
FROM imports.verifiche_clienti_finint
WHERE  tipo_legame in ('A', 'M')
	AND COALESCE(TRIM(rete, '0'), '') != '7'
	AND data_verifica != '0' and
 --   LENGTH(data_ricezione) != 8 
   ( data_ricezione !~ '^[0-9]+$'
		OR data_verifica !~ '^[0-9]+$'
    OR (LENGTH(data_ricezione) = 8 AND data_ricezione ~ '^[0-9]+$' AND TO_DATE(data_ricezione, 'YYYYMMDD') > CURRENT_DATE)
    OR (LENGTH(data_verifica) = 8 AND data_verifica ~ '^[0-9]+$' AND TO_DATE(data_verifica, 'YYYYMMDD') > CURRENT_DATE));