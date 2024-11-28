WITH base_query AS (
        SELECT  
            snd.codice_azienda, 
            coalesce(snd.data_esecuzione, snd.data_prevista) as data_esecuzione,
            entrasp.scadenza_profilazione(ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) AS data_scadenza,
            ss.id_sondaggio, 
            ss.id_somministrazione,
            ss.object_key, 
            ss.object_name,
            entrasp.conta_sondaggi_successivi_entro_scadenza_incl_futuri(snd.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) AS conta,
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
            entrasp.sondaggi_successivi_entro_scadenza_incl_futuri(
                ss.codice_azienda, 
                ss.id_sondaggio, 
                ss.id_somministrazione
            ) AS fn
        ON TRUE
        WHERE 
            snd.codice_azienda = 'FINAFARM'
            AND snd.id_modello_test = 526
						and ss.object_key = 'FINAFARM|14691'
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
    -- Esegue la cancellazione per i sondaggi contrassegnati come 'Delete'
    SELECT *   --entrasp.sondaggio_delete(sdc.codice_azienda, sdc.idsond)
    FROM sondaggi_da_cancellare sdc 
	
    WHERE 
		D_K = 'Delete'
     -- AND sdc.idsond NOT IN (
     --      SELECT sdc2.idsond
     --      FROM sondaggi_da_cancellare sdc2 
     --      WHERE sdc2.D_K = 'Keep'
     --  )
			-- And 
			-- sdc.idsond not in (
			-- 	select id_sondaggio from entrasp.progetti_fasi where codice_azienda='FINAFARM' and id_sondaggio is not null
			-- )
			And sdc.idsond not in (
				select id_sondaggio from entrasp.risposte where codice_azienda='FINAFARM'
			 )
				order by idsond desc