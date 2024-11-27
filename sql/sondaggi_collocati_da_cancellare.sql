/*
select ss.object_key, ss.object_name, ss.id_somministrazione, ss.id_sondaggio 
from entrasp.sondaggi_somministrati ss
inner join entrasp.sondaggi snd
on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio=snd.id_sondaggio
where snd.codice_azienda='FININTSGR' and snd.id_modello_test=634
order by id_sondaggio asc;
*/

------
------
------
------

--        AND ss.object_key = 'FININT|2849' -- TANSINI
--        AND ss.object_key = 'FININT|3496' -- VITO

WITH base_query AS (
    SELECT  
        snd.codice_azienda, 
        snd.data_esecuzione,
        entrasp.scadenza_profilazione(ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) AS data_scadenza,
        ss.id_sondaggio, 
        ss.id_somministrazione,
        ss.object_key, 
        ss.object_name,
        entrasp.conta_sondaggi_successivi_entro_scadenza(snd.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) AS conta,
        fn.*, -- Colonne della funzione laterale
        CASE 
            WHEN CURRENT_DATE < entrasp.scadenza_profilazione(ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) THEN 'Non scaduto' 
            ELSE 'Scaduto' 
        END AS scad_non_scad
    FROM 
        entrasp.sondaggi_somministrati ss
    INNER JOIN 
        entrasp.sondaggi snd
    ON 
        ss.codice_azienda = snd.codice_azienda 
        AND ss.id_sondaggio = snd.id_sondaggio
    LEFT JOIN LATERAL 
        entrasp.sondaggi_successivi_entro_scadenza(
            ss.codice_azienda, 
            ss.id_sondaggio, 
            ss.id_somministrazione
        ) AS fn
    ON TRUE
    WHERE 
        snd.codice_azienda = 'FININTSGR' 
        AND snd.id_modello_test = 634
),
max_conta_query AS (
    SELECT 
        object_key, 
        object_name, 
        MAX(conta) AS max_conta
    FROM 
        base_query
    WHERE 
        conta > 1
    GROUP BY 
        object_key, 
        object_name
),
sondaggi_da_cancellare AS (
    SELECT 
        bq.codice_azienda, 
        bq.id_sondaggio, 
        bq.data_esecuzione,
        bq.data_scadenza,
        entrasp.scadenza_profilazione(bq.codice_azienda, bq.id_sondaggio, bq.id_somministrazione) AS dt_scad_orig,
        bq.id_somministrazione, 
        bq.object_key, 
        bq.object_name,  
        bq.*, -- Include le colonne derivate da fn nel base_query
        CASE 
            WHEN bq.prog = bq.max_prog THEN 'Ultimo' 
            ELSE 'Non ultimo' 
        END AS progressivo,
        bq.scad_non_scad,
        CASE 
            WHEN bq.prog < bq.max_prog 
                OR (bq.prog = bq.max_prog AND CURRENT_DATE < entrasp.scadenza_profilazione(bq.codice_azienda, bq.id_sondaggio, bq.id_somministrazione)) 
            THEN 'Delete' 
            ELSE 'Keep' 
        END AS D_K
    FROM 
        base_query bq
    INNER JOIN 
        max_conta_query mcq
    ON 
        bq.object_key = mcq.object_key 
        AND bq.conta = mcq.max_conta
    WHERE 
        bq.conta > 1
)
SELECT DISTINCT *
FROM sondaggi_da_cancellare
WHERE D_K = 'Delete';




/*
-- VITO PINTO 13-11-2023
select ss.object_key, ss.object_description, snd.id_modello_test, snd.id_sondaggio,  snd.data_esecuzione
from entrasp.sondaggi_somministrati ss
inner join entrasp.sondaggi snd
on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio=snd.id_sondaggio
where ss.object_key ilike '%3496%' 
and snd.id_modello_test=634
and snd.codice_azienda='FININTSGR'
order by snd.data_esecuzione desc;
*/
