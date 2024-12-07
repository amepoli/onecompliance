select id_sondaggio, data_esecuzione from entrasp.sondaggi where codice_azienda='FININTSGR' and id_modello_test=634 and data_esecuzione>'2024-11-28'

--CAMPESE: il giudizio è lo stesso le risposte sono le stesse
-- Nessuna differenza. Il giudizio è lo stesso


select rsp.id_risposta_prev, rsp.note   
from entrasp.risposte rsp
where rsp.id_sondaggio=1858 and rsp.codice_azienda='FININTSGR'

select rsp.id_risposta_prev, rsp.note
from r20241128.risposte rsold
where rsold.id_sondaggio=1858 and rsold.codice_azienda='FININTSGR'

select rsp.id_risposta_prev, rsp.note, rsold.id_risposta_prev, rsold.note
from entrasp.risposte rsp
inner join  
	(
	select codice_azienda, id_modello_test, id_modello_test_vr, id_domanda, id_risposta_prev, note
	from r20241128.risposte 
	where id_sondaggio=1858 and codice_azienda='FININTSGR'
	) rsold
	on rsp.codice_azienda=rsold.codice_azienda and rsp.id_modello_test=rsold.id_modello_test and rsp.id_modello_test_vr=rsold.id_modello_test_vr
	and rsp.id_domanda=rsold.id_domanda and rsp.id_risposta_prev=rsold.id_risposta_prev
where rsp.id_sondaggio=1858 and rsp.codice_azienda='FININTSGR'

--SPORTELLI GIANCARLO id_an=3900: il giudizio è lo stesso le risposte sono le stesse
-- Nessuna differenza. Il giudizio è lo stesso


select rsp.id_risposta_prev, rsp.note   
from entrasp.risposte rsp
where rsp.id_sondaggio=7120 and rsp.codice_azienda='FININTSGR'

select rsold.id_risposta_prev, rsold.note
from r20241128.risposte rsold
where rsold.id_sondaggio=7120 and rsold.codice_azienda='FININTSGR'

select rsp.id_risposta_prev, rsp.note, rsold.id_risposta_prev, rsold.note
from entrasp.risposte rsp
inner join  
	(
	select codice_azienda, id_modello_test, id_modello_test_vr, id_domanda, id_risposta_prev, note
	from r20241128.risposte 
	where id_sondaggio=7120 and codice_azienda='FININTSGR'
	) rsold
	on rsp.codice_azienda=rsold.codice_azienda and rsp.id_modello_test=rsold.id_modello_test and rsp.id_modello_test_vr=rsold.id_modello_test_vr
	and rsp.id_domanda=rsold.id_domanda and rsp.id_risposta_prev=rsold.id_risposta_prev
where rsp.id_sondaggio=7120 and rsp.codice_azienda='FININTSGR'







-- Giudizi ad oggi
select pct_da, pct_da_manuale from entrasp.sondaggi_somministrati
where id_sondaggio=1858 and codice_azienda='FININTSGR'

-- Giudizi al 28/11/2024
select pct_da, pct_da_manuale from r20241128.sondaggi_somministrati
where id_sondaggio=1858 and codice_azienda='FININTSGR'


select * from entrasp.individua_profilazioni_in_eccesso('FININTSGR', 634, 'FININT|2849')

select entrasp.cancella_profilazioni_in_eccesso_v2('FININTSGR', 634, 'FININT|2849');

select * 
FROM entrasp.individua_profilazioni_in_eccesso('FININTSGR', 634)
		where d_k_del='Delete' and  (codiceaz_orig, idsond_del) NOT IN (
                SELECT sdc2.codiceaz_orig, sdc2.idsond_del 
                from entrasp.individua_profilazioni_in_eccesso('FININTSGR', 634) sdc2
				where d_k_del='Keep'
            );




-- FUNCTION: entrasp.individua_profilazioni_in_eccesso(character varying, numeric, character varying, numeric)

-- DROP FUNCTION IF EXISTS entrasp.individua_profilazioni_in_eccesso(character varying, numeric, character varying, numeric);

CREATE OR REPLACE FUNCTION entrasp.individua_profilazioni_in_eccesso(
	codiceazienda character varying,
	idmodellotest numeric,
	objectkey character varying DEFAULT NULL::character varying,
	idsondaggiomax numeric DEFAULT NULL::numeric)
    RETURNS TABLE(anagrafica character varying, codiceaz_orig character varying, dtesec_orig date, dtscad_orig date, idsond_orig numeric, idsomm_orig numeric, objkey character varying, objname character varying, conta_del integer, idsond_del numeric, idss_del numeric, dtesec_del date, prog_del bigint, maxprog_del bigint, objdesc_del text, scad_non_scad_del text, ultimo_del text, d_k_del text) 
    LANGUAGE 'plpgsql'
    COST 100
    STABLE PARALLEL SAFE 
    ROWS 1000

AS $BODY$
BEGIN
    RETURN QUERY
    WITH base_query AS (
        SELECT  
            ss.object_description,
			snd.codice_azienda, 
            snd.data_esecuzione,
            entrasp.scadenza_profilazione(ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) AS data_scadenza,
            ss.id_sondaggio, 
            ss.id_somministrazione,
            ss.object_key, 
            ss.object_name,
			entrasp.conta_sondaggi_successivi_entro_scadenza(snd.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) AS conta,
            CASE 
                WHEN CURRENT_DATE < entrasp.scadenza_profilazione(ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione) THEN 'Non scaduto' 
                ELSE 'Scaduto' 
            END AS scad_non_scad,
        	fn.*
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
            snd.codice_azienda = codiceazienda
			and (snd.id_sondaggio>=coalesce(idsondaggiomax,0))
            AND snd.id_modello_test = idmodellotest
            AND (ss.object_key = objectkey OR objectkey IS NULL)
    ),
    max_conta_query AS (
        SELECT 
            object_key, 
            object_name, 
            MAX(base_query.conta) AS max_conta
        FROM 
            base_query
        WHERE 
            base_query.conta >= 1
        GROUP BY 
            object_key, 
            object_name
    )
    SELECT 
        bq.object_description::varchar,
		bq.codice_azienda AS codiceaz_orig,
        bq.data_esecuzione AS dtesec_orig,
        bq.data_scadenza AS dtscad_orig,
        bq.id_sondaggio AS idsond_orig,
        bq.id_somministrazione AS idsomm_orig,
        bq.object_key AS objkey,
        bq.object_name AS objname,
        bq.conta AS conta_del,
        bq.idsond::numeric AS idsond_del,
        bq.idss::numeric AS idss_del,
        bq.dtesec AS dtesec_del,
        prog::bigint AS prog_del,
        max_prog::bigint AS maxprog_del,
        objdesc::text AS objdesc_del,
        bq.scad_non_scad AS scad_non_scad_del,
        CASE 
            WHEN prog = max_prog THEN 'Ultimo' 
            ELSE 'Non ultimo' 
        END AS ultimo_del,
        CASE 
            WHEN prog < max_prog 
                OR (prog = max_prog AND CURRENT_DATE < entrasp.scadenza_profilazione(bq.codice_azienda, bq.id_sondaggio, bq.id_somministrazione)) 
            THEN 'Delete' 
            ELSE 'Keep' 
        END AS d_k_del
    FROM 
        base_query bq
    INNER JOIN 
        max_conta_query mcq
    ON 
        bq.object_key = mcq.object_key 
        AND bq.conta = mcq.max_conta
    WHERE 
        bq.conta >= 1;

    RETURN;
END;
$BODY$;

ALTER FUNCTION entrasp.individua_profilazioni_in_eccesso(character varying, numeric, character varying, numeric)
    OWNER TO postgres;
