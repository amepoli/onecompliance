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

WITH base_query AS (
    SELECT  
        snd.codice_azienda, 
		snd.data_esecuzione,
        ss.id_sondaggio, 
        ss.id_somministrazione,
        ss.object_key, 
        ss.object_name,
		entrasp.scadenza_profilazione(ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) 
		as data_scadenza,
	        entrasp.conta_sondaggi_successivi_entro_scadenza(snd.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) AS conta
    FROM 
        entrasp.sondaggi_somministrati ss
    INNER JOIN 
        entrasp.sondaggi snd
    ON 
        ss.codice_azienda = snd.codice_azienda 
        AND ss.id_sondaggio = snd.id_sondaggio
    WHERE 
        snd.codice_azienda = 'FININTSGR' 
        AND snd.id_modello_test = 634
				and ss.object_key= 'FININT|2849'
),
data_scad_origin AS(
SELECT 
        object_key, 
        object_name, 
        data_scadenza as dt_scad_orig
    FROM 
        base_query
    WHERE 
        conta = 0
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
sondaggi_da_cancellare AS (SELECT 
    bq.codice_azienda, 
    bq.id_sondaggio, 
    bq.id_somministrazione, 
    bq.object_key, 
    bq.object_name, 
	bq.data_scadenza,
	dso.dt_scad_orig,
    fn.*,
		CURRENT_DATE<bq.data_scadenza as cond,
	case when (fn.prog < fn.max_prog) or (fn.prog = fn.max_prog and CURRENT_DATE<dso.dt_scad_orig) then 'Delete' else 'Keep' end as D_K
FROM 
    base_query bq
INNER JOIN 
    max_conta_query mcq
ON 
    bq.object_key = mcq.object_key 
    AND bq.conta = mcq.max_conta
		INNER JOIN data_scad_origin dso
		ON
		bq.object_key = dso.object_key 

LEFT JOIN LATERAL 
    entrasp.sondaggi_successivi_entro_scadenza(
        bq.codice_azienda, 
        bq.id_sondaggio, 
        bq.id_somministrazione
    ) AS fn
ON TRUE
WHERE 
bq.conta > 1
and bq.object_key= 'FININT|2849'
)

select distinct *
from sondaggi_da_cancellare sdc
where D_K='Delete';


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
