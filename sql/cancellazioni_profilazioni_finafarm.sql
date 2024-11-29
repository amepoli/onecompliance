--select count(id_sondaggio) from entrasp.sondaggi where codice_azienda='FINAFARM' and id_modello_test=526 --35924
---- individuazione dei sondaggi da cancellare

--select count(id_sondaggio) from entrasp.sondaggi where codice_azienda='FINAFARM' --35933  36147
---- individuazione dei sondaggi da cancellare

WITH sondaggi_con_scadenza_nel_futuro AS (
   SELECT  
    snd.codice_azienda, 
    snd.id_sondaggio,
	ss.id_somministrazione,
    ss.object_key,
    ss.object_description,
    entrasp.scadenza_profilazione_estesa(ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) AS data_scadenza,
    ss.stato,
    ROW_NUMBER() OVER (
        PARTITION BY ss.object_key 
        ORDER BY COALESCE(snd.data_esecuzione, snd.data_prevista)
    ) AS rn
FROM 
    entrasp.sondaggi_somministrati ss
INNER JOIN 
    entrasp.sondaggi snd 
USING 
    (codice_azienda, id_sondaggio)
WHERE 
    snd.codice_azienda = 'FINAFARM' 
 --   AND ss.object_key = 'FINAFARM|14691'
    AND snd.id_modello_test = 526
    AND entrasp.scadenza_profilazione_estesa(ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) > CURRENT_DATE
    and ss.stato != 'C'
    AND snd.id_sondaggio NOT IN (
        SELECT 
            pf.id_sondaggio 
        FROM 
            entrasp.progetti_fasi pf 
        WHERE  
            codice_azienda = 'FINAFARM'
            AND pf.id_sondaggio IS NOT NULL
    )
ORDER BY 
    ss.object_key, 
    COALESCE(snd.data_esecuzione, snd.data_prevista)
    )	
       select *
	   from sondaggi_con_scadenza_nel_futuro snf
	--   where rn>1
	   where rn>1
	 --  AND object_key = 'FINAFARM|15472'
	   and id_sondaggio NOT IN (
        SELECT 
            rs.id_sondaggio 
        FROM 
            entrasp.risposte rs 
        WHERE  
            codice_azienda = 'FINAFARM'
            AND rs.id_sondaggio IS NOT NULL
    )
	   order by object_key;


	--- cancellazione sondaggi nel futuro
 SET session_replication_role = replica;

WITH sondaggi_con_scadenza_nel_futuro AS (
   SELECT  
    snd.codice_azienda, 
    snd.id_sondaggio,
	ss.id_somministrazione,
    ss.object_key,
    ss.object_description,
    entrasp.scadenza_profilazione_estesa(ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) AS data_scadenza,
    ss.stato,
    ROW_NUMBER() OVER (
        PARTITION BY ss.object_key 
        ORDER BY COALESCE(snd.data_esecuzione, snd.data_prevista)
    ) AS rn
FROM 
    entrasp.sondaggi_somministrati ss
INNER JOIN 
    entrasp.sondaggi snd 
USING 
    (codice_azienda, id_sondaggio)
WHERE 
    snd.codice_azienda = 'FINAFARM' 
 --   AND ss.object_key = 'FINAFARM|14691'
    AND snd.id_modello_test = 526
    AND entrasp.scadenza_profilazione_estesa(ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) > CURRENT_DATE
    and ss.stato != 'C'
    AND snd.id_sondaggio NOT IN (
        SELECT 
            pf.id_sondaggio 
        FROM 
            entrasp.progetti_fasi pf 
        WHERE  
            codice_azienda = 'FINAFARM'
            AND pf.id_sondaggio IS NOT NULL
    )
ORDER BY 
    ss.object_key, 
    COALESCE(snd.data_esecuzione, snd.data_prevista)
    )	
       select entrasp.sondaggio_delete(codice_azienda, id_sondaggio)
	   from sondaggi_con_scadenza_nel_futuro
	   where rn>1
	   and id_sondaggio NOT IN (
        SELECT 
            rs.id_sondaggio 
        FROM 
            entrasp.risposte rs 
        WHERE  
            codice_azienda = 'FINAFARM'
            AND rs.id_sondaggio IS NOT NULL
    );

--- aggiornamento sondaggi senza profilazione successiva


WITH sondaggi_con_scadenza_nel_futuro AS (
   SELECT  
    snd.codice_azienda, 
    snd.id_sondaggio,
	snd.data_prevista,
	ss.id_somministrazione,
    ss.object_key,
    ss.object_description,
    entrasp.scadenza_profilazione_estesa(ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) AS data_scadenza,
    ss.stato,
    ROW_NUMBER() OVER (
        PARTITION BY ss.object_key 
        ORDER BY COALESCE(snd.data_esecuzione, snd.data_prevista)
    ) AS rn
FROM 
    entrasp.sondaggi_somministrati ss
INNER JOIN 
    entrasp.sondaggi snd 
USING 
    (codice_azienda, id_sondaggio)
WHERE 
    snd.codice_azienda = 'FINAFARM' 
    AND ss.object_key = 'FINAFARM|14825'
    AND snd.id_modello_test = 526
    AND entrasp.scadenza_profilazione_estesa(ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) > CURRENT_DATE
    and ss.stato != 'C'
    AND snd.id_sondaggio NOT IN (
        SELECT 
            pf.id_sondaggio 
        FROM 
            entrasp.progetti_fasi pf 
        WHERE  
            codice_azienda = 'FINAFARM'
            AND pf.id_sondaggio IS NOT NULL
    )
ORDER BY 
    ss.object_key, 
    COALESCE(snd.data_esecuzione, snd.data_prevista)
    )
/*	
select ss.id_sondaggio, ss.id_somministrazione, snd.data_prevista,ss.data_esecuzione as dt_esec_ss, snd.data_esecuzione as dt_esec_snd, 
snd.id_sondaggio_succ, ss.id_sondaggio_succ, ss.id_somministrazione_succ 
from entrasp.sondaggi snd, entrasp.sondaggi_somministrati ss, sondaggi_con_scadenza_nel_futuro snf
where ss.codice_azienda='FINAFARM' 
and ss.object_key='FINAFARM|15472'
and snd.codice_azienda=ss.codice_azienda and snd.id_sondaggio=ss.id_sondaggio
and ss.object_key=snf.object_key
and snd.id_modello_test=526 
and snf.rn=1
and snf.data_prevista>ss.data_esecuzione
and (ss.id_somministrazione_succ is null or ss.id_sondaggio_succ is null)
AND entrasp.scadenza_profilazione_estesa(ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) > CURRENT_DATE;
*/

update entrasp.sondaggi snd
set id_sondaggio_succ=snf.id_sondaggio
from entrasp.sondaggi_somministrati ss, sondaggi_con_scadenza_nel_futuro snf
where ss.codice_azienda='FINAFARM' 
and ss.object_key='FINAFARM|14825'
and snd.codice_azienda=ss.codice_azienda and snd.id_sondaggio=ss.id_sondaggio
and ss.object_key=snf.object_key
and snd.id_modello_test=526 
and snf.rn=1
and snf.data_prevista>ss.data_esecuzione
and (ss.id_somministrazione_succ is null or ss.id_sondaggio_succ is null)
AND entrasp.scadenza_profilazione_estesa(ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) > CURRENT_DATE;

SET session_replication_role = origin;



-----

select entrasp.close_somministrazione_sondaggio_insert_following(ss.codice_azienda, ss.id_somministrazione, ss.id_sondaggio, user_update) 
from entrasp.sondaggi_somministrati ss
inner join entrasp.sondaggi snd
on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio_succ=snd.id_sondaggio
where ss.codice_azienda='FINAFARM' 
and ss.object_key='FINAFARM|15472'
and snd.id_modello_test=526 and snd.stato!='C'
and ss.stato='C'

select ss.codice_azienda, ss.id_somministrazione, ss.id_sondaggio, user_update 
from entrasp.sondaggi_somministrati ss
inner join entrasp.sondaggi snd
on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio_succ=snd.id_sondaggio
where ss.codice_azienda='FINAFARM' 
--and ss.id_sondaggio=41423
and ss.object_key='FINAFARM|15472'
and snd.id_modello_test=526 and snd.stato!='C'
and ss.stato='C'

select * from entrasp.sondaggi_somministrati
where id_sondaggio=41423 and codice_azienda='FINAFARM'


update entrasp.sondaggi
set id_sondaggio_succ=36749
where id_sondaggio=41423 and codice_azienda='FINAFARM'
--41423
select id_sondaggio, id_somministrazione, id_sondaggio_succ, id_somministrazione_succ
from entrasp.sondaggi_somministrati
where codice_azienda='FINAFARM' and id_sondaggio=41423


update entrasp.sondaggi_somministrati
set stato='P'
where codice_azienda='FINAFARM'
and id_somministrazione=43965


