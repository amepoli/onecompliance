--select count(id_sondaggio) from entrasp.sondaggi where codice_azienda='FINAFARM' --35933
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
	   from sondaggi_con_scadenza_nel_futuro
	   where rn>1
	   order by object_key;

	
 SET session_replication_role = replica;

--- cancellazione sondaggi nel futuro

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
	   order by object_key;

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
    ), aggiorna_ss as	(
		update entrasp.sondaggi_somministrati ss
		set id_sondaggio_succ=snf.id_sondaggio,
		id_somministrazione_succ=snf.id_somministrazione
		from entrasp.sondaggi snd, sondaggi_con_scadenza_nel_futuro snf
		where ss.codice_azienda='FINAFARM' 
		and snd.codice_azienda=ss.codice_azienda and snd.id_sondaggio=ss.id_sondaggio
		and ss.object_key=snf.object_key
		and snd.id_modello_test=526 
		and snf.rn=1
		and snf.data_prevista>ss.data_esecuzione
		and ss.id_somministrazione_succ is null
		AND entrasp.scadenza_profilazione_estesa(ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) > CURRENT_DATE)

		update entrasp.sondaggi snd
		set id_sondaggio_succ=snf.id_sondaggio
		from entrasp.sondaggi_somministrati ss, sondaggi_con_scadenza_nel_futuro snf
		where ss.codice_azienda='FINAFARM' 
		and snd.codice_azienda=ss.codice_azienda and snd.id_sondaggio=ss.id_sondaggio
		and ss.object_key=snf.object_key
		and snd.id_modello_test=526 
		and snf.rn=1
		and snf.data_prevista>ss.data_esecuzione
		and ss.id_somministrazione_succ is null
		AND entrasp.scadenza_profilazione_estesa(ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) > CURRENT_DATE
	;
SET session_replication_role = origin;


