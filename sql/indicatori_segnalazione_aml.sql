--Contratti attivi al 31/12 dell'anno precedente --id_indicatore=426 769
select distinct
	an.id_anagrafica,
	avr.codice,
	COALESCE(
		NULLIF(an.nome, '')||' '||NULLIF(an.cognome, ''),
		avr.ragione_sociale
	) as denominazione,
	cnt.id_contratto,
	cnt.numero_contratto,
	cnt.data_cessazione,
	cnt.data_stipulazione,
	EXTRACT(
		year
		from
			cnt.data_stipulazione
	) as anno_stipula
from
	entrasp.anagrafiche_id an
	inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part
	and an.id_anagrafica=avr.id_anagrafica
	inner join entrasp.contratti cnt on an.codice_part=cnt.codice_part
	and an.id_anagrafica=cnt.id_cliente
	inner join entrasp.ruoli_anagrafiche ru on an.codice_part=ru.codice_part
	and an.id_anagrafica=ru.id_anagrafica
where
	an.codice_part='FINAFARM'
	and ru.codice_ruolo='CLI'
	and coalesce (cnt.data_stipulazione, cnt.data_contratto_da)<date_trunc('year', current_date)
	and (coalesce (cnt.data_cessazione, cnt.data_contratto_a) IS NULL OR coalesce (cnt.data_cessazione, cnt.data_contratto_a) >= date_trunc('year', current_date)
				)
	and avr.prog_vr=entrasp.anagrafiche_vr_max (avr.codice_part, avr.id_anagrafica)
	and cnt.id_argomento_contratto!=49580
	order by
	denominazione;

--Clienti attivi al 31/12 dell'anno precendente --id_indicatore=427 499
select distinct id_anagrafica, entrasp.anagrafiche_vr_dati_identificativi(codice_part, id_anagrafica) from entrasp.anagrafiche_id where (codice_part,id_anagrafica) in(
select distinct
	an.codice_part,an.id_anagrafica
from
	entrasp.anagrafiche_id an
	inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part
	and an.id_anagrafica=avr.id_anagrafica
	inner join entrasp.contratti cnt on an.codice_part=cnt.codice_part
	and an.id_anagrafica=cnt.id_cliente
	inner join entrasp.ruoli_anagrafiche ru on an.codice_part=ru.codice_part
	and an.id_anagrafica=ru.id_anagrafica
where
	an.codice_part='FINAFARM'
	and ru.codice_ruolo='CLI'
	and coalesce (cnt.data_stipulazione, cnt.data_contratto_da)<date_trunc('year', current_date)
	and (coalesce (cnt.data_cessazione, cnt.data_contratto_a) IS NULL OR coalesce (cnt.data_cessazione, cnt.data_contratto_a) >= date_trunc('year', current_date))
	and avr.prog_vr=entrasp.anagrafiche_vr_max (avr.codice_part, avr.id_anagrafica)
	and cnt.id_argomento_contratto!=49580
);

-- clienti attivi persone fisiche e cointestate al 31/12 del precedente anno id_indicatore=428 162
select distinct id_anagrafica, entrasp.anagrafiche_id_codcognnome(codice_part, id_anagrafica) from entrasp.anagrafiche_id where codice_part||id_anagrafica in(
select distinct
	an.codice_part||an.id_anagrafica
from
	entrasp.anagrafiche_id an
	inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part
	and an.id_anagrafica=avr.id_anagrafica
	inner join entrasp.contratti cnt on an.codice_part=cnt.codice_part
	and an.id_anagrafica=cnt.id_cliente
	inner join entrasp.ruoli_anagrafiche ru on an.codice_part=ru.codice_part
	and an.id_anagrafica=ru.id_anagrafica
where
	an.codice_part='FINAFARM'
	and ru.codice_ruolo='CLI'
	and coalesce (cnt.data_stipulazione, cnt.data_contratto_da)<date_trunc('year', current_date)
	and (coalesce (cnt.data_cessazione, cnt.data_contratto_a) IS NULL OR coalesce (cnt.data_cessazione, cnt.data_contratto_a) >= date_trunc('year', current_date))
	and avr.prog_vr=entrasp.anagrafiche_vr_max (avr.codice_part, avr.id_anagrafica)
	and cnt.id_argomento_contratto!=49580
) and tipo_soggetto in ('P', 'C')

-- clienti attivi persone giuridiche al 31/12 del precedente anno id_indicatore=429 337
select distinct id_anagrafica, entrasp.anagrafiche_vr_dati_identificativi(codice_part, id_anagrafica) from entrasp.anagrafiche_id where codice_part||id_anagrafica in(
select distinct
	an.codice_part||an.id_anagrafica
from
	entrasp.anagrafiche_id an
	inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part
	and an.id_anagrafica=avr.id_anagrafica
	inner join entrasp.contratti cnt on an.codice_part=cnt.codice_part
	and an.id_anagrafica=cnt.id_cliente
	inner join entrasp.ruoli_anagrafiche ru on an.codice_part=ru.codice_part
	and an.id_anagrafica=ru.id_anagrafica
where
	an.codice_part='FINAFARM'
	and ru.codice_ruolo='CLI'
	and coalesce (cnt.data_stipulazione, cnt.data_contratto_da)<date_trunc('year', current_date)
	and (coalesce (cnt.data_cessazione, cnt.data_contratto_a) IS NULL OR coalesce (cnt.data_cessazione, cnt.data_contratto_a) >= date_trunc('year', current_date))
	and avr.prog_vr=entrasp.anagrafiche_vr_max (avr.codice_part, avr.id_anagrafica)
	and cnt.id_argomento_contratto!=49580
) and tipo_soggetto in ('E')

--Nuovi clienti persone giuridiche nel periodo 01/01 - 31/12 nel precedente esercizio id_indicatore=430 21

SELECT distinct an.id_anagrafica,entrasp.anagrafiche_vr_dati_identificativi(an.codice_part, an.id_anagrafica)as nuovo_cliente,  
an.codice
FROM entrasp.anagrafiche_id an
INNER JOIN entrasp.anagrafiche_vr avr 
	ON an.codice_part = avr.codice_part
	AND an.id_anagrafica = avr.id_anagrafica
INNER JOIN entrasp.contratti cnt 
	ON an.codice_part = cnt.codice_part
	AND an.id_anagrafica = cnt.id_cliente
INNER JOIN entrasp.ruoli_anagrafiche ru 
	ON an.codice_part = ru.codice_part
	AND an.id_anagrafica = ru.id_anagrafica
WHERE
	an.codice_part = 'FINAFARM'
	AND ru.codice_ruolo = 'CLI'
	AND coalesce (cnt.data_stipulazione, cnt.data_contratto_da) BETWEEN 
	    date_trunc('year', current_date) - interval '1 year' 
	AND 
	    date_trunc('year', current_date) - interval '1 day'
	AND (coalesce(cnt.data_cessazione, cnt.data_contratto_a) IS NULL 
	     OR coalesce(cnt.data_cessazione, cnt.data_contratto_a) >= date_trunc('year', current_date))
	AND avr.prog_vr = entrasp.anagrafiche_vr_max(avr.codice_part, avr.id_anagrafica)
	AND cnt.id_argomento_contratto != 49580 and an.tipo_soggetto ='E'
	AND NOT EXISTS (
		SELECT 1
		FROM entrasp.contratti cnt_pre
		WHERE cnt_pre.codice_part = an.codice_part
			AND cnt_pre.id_cliente = an.id_anagrafica
			AND cnt_pre.data_stipulazione < date_trunc('year', current_date) - interval '1 year'
			AND cnt_pre.id_argomento_contratto != 49580
	);

--Nuovi clienti persone fisiche e cointestati nel periodo 01/01 - 31/12 nel precedente esercizio id_indicatore=431 11

SELECT distinct an.id_anagrafica,entrasp.anagrafiche_vr_dati_identificativi(an.codice_part, an.id_anagrafica)as nuovo_cliente,  
an.codice
FROM entrasp.anagrafiche_id an
INNER JOIN entrasp.anagrafiche_vr avr 
	ON an.codice_part = avr.codice_part
	AND an.id_anagrafica = avr.id_anagrafica
INNER JOIN entrasp.contratti cnt 
	ON an.codice_part = cnt.codice_part
	AND an.id_anagrafica = cnt.id_cliente
INNER JOIN entrasp.ruoli_anagrafiche ru 
	ON an.codice_part = ru.codice_part
	AND an.id_anagrafica = ru.id_anagrafica
WHERE
	an.codice_part = 'FINAFARM'
	AND ru.codice_ruolo = 'CLI'
	AND coalesce (cnt.data_stipulazione, cnt.data_contratto_da) BETWEEN 
	    date_trunc('year', current_date) - interval '1 year' 
	AND 
	    date_trunc('year', current_date) - interval '1 day' 
	AND (coalesce(cnt.data_cessazione, cnt.data_contratto_a) IS NULL 
	     OR coalesce(cnt.data_cessazione, cnt.data_contratto_a) >= date_trunc('year', current_date))
	AND avr.prog_vr = entrasp.anagrafiche_vr_max(avr.codice_part, avr.id_anagrafica)
	AND cnt.id_argomento_contratto != 49580 and an.tipo_soggetto in ('P', 'C')
	AND NOT EXISTS (
		SELECT 1
		FROM entrasp.contratti cnt_pre
		WHERE cnt_pre.codice_part = an.codice_part
			AND cnt_pre.id_cliente = an.id_anagrafica
			AND cnt_pre.data_stipulazione < date_trunc('year', current_date) - interval '1 year' 
			AND cnt_pre.id_argomento_contratto != 49580
	);

--modalità di identificazione nuovi clienti persone fisiche nell'ultimo esercizio id_indicatore=432
WITH ranked_responses AS (
    SELECT 
        sdr.codice_azienda, 
        sdr.id_modello_test,
        snd.data_esecuzione,
        entrasp.anagrafiche_vr_dati_identificativi(az.codice_part::text, split_part(sdr.object_key, '|', 2)::numeric) AS cliente, 
        risposta_rp,
        ROW_NUMBER() OVER (PARTITION BY split_part(sdr.object_key, '|', 2)::numeric ORDER BY snd.data_esecuzione) AS rn
    FROM entrasp.select_domande_delle_risposte sdr
    INNER JOIN entrasp.sondaggi snd 
        ON sdr.codice_azienda = snd.codice_azienda 
        AND sdr.id_sondaggio = snd.id_sondaggio 
    INNER JOIN entrasp.aziende az 
        ON sdr.codice_azienda = az.codice_azienda
    WHERE 
        sdr.id_argomento = 17576 
        AND sdr.codice_azienda = 'FINAFARM' 
        AND sdr.id_risposta_prev IS NOT NULL 
        AND split_part(sdr.object_key, '|', 2)::numeric IN (
            SELECT DISTINCT an.id_anagrafica
            FROM entrasp.anagrafiche_id an
            INNER JOIN entrasp.anagrafiche_vr avr 
                ON an.codice_part = avr.codice_part
                AND an.id_anagrafica = avr.id_anagrafica
            INNER JOIN entrasp.contratti cnt 
                ON an.codice_part = cnt.codice_part
                AND an.id_anagrafica = cnt.id_cliente
            INNER JOIN entrasp.ruoli_anagrafiche ru 
                ON an.codice_part = ru.codice_part
                AND an.id_anagrafica = ru.id_anagrafica
            WHERE 
                an.codice_part = 'FINAFARM'
                AND ru.codice_ruolo = 'CLI'
                AND COALESCE(cnt.data_stipulazione, cnt.data_contratto_da) BETWEEN 
                    date_trunc('year', current_date) - interval '1 year'
                    AND date_trunc('year', current_date) - interval '1 day'
                AND (COALESCE(cnt.data_cessazione, cnt.data_contratto_a) IS NULL 
                    OR COALESCE(cnt.data_cessazione, cnt.data_contratto_a) >= date_trunc('year', current_date))
                AND avr.prog_vr = entrasp.anagrafiche_vr_max(avr.codice_part, avr.id_anagrafica)
                AND cnt.id_argomento_contratto != 49580 
                AND an.tipo_soggetto IN ('P', 'C')
                AND NOT EXISTS (
                    SELECT 1
                    FROM entrasp.contratti cnt_pre
                    WHERE cnt_pre.codice_part = an.codice_part
                        AND cnt_pre.id_cliente = an.id_anagrafica
                        AND cnt_pre.data_stipulazione < date_trunc('year', current_date) - interval '1 year'
                        AND cnt_pre.id_argomento_contratto != 49580
                )
        )
)
SELECT 
    codice_azienda,
    id_modello_test,
    data_esecuzione,
    cliente,
    risposta_rp
FROM ranked_responses
WHERE rn = 1
ORDER BY cliente;



--modalità di identificazione nuovi clienti persone giuridiche nell'ultimo esercizio -433
WITH ranked_responses AS (
    SELECT 
        sdr.codice_azienda, 
        sdr.id_modello_test,
        snd.data_esecuzione,
        entrasp.anagrafiche_vr_dati_identificativi(az.codice_part::text, split_part(sdr.object_key, '|', 2)::numeric) AS cliente, 
        risposta_rp,
        ROW_NUMBER() OVER (PARTITION BY split_part(sdr.object_key, '|', 2)::numeric ORDER BY snd.data_esecuzione) AS rn
    FROM entrasp.select_domande_delle_risposte sdr
    INNER JOIN entrasp.sondaggi snd 
        ON sdr.codice_azienda = snd.codice_azienda 
        AND sdr.id_sondaggio = snd.id_sondaggio 
    INNER JOIN entrasp.aziende az 
        ON sdr.codice_azienda = az.codice_azienda
    WHERE 
        sdr.id_argomento = 17576 
        AND sdr.codice_azienda = 'FINAFARM' 
        AND sdr.id_risposta_prev IS NOT NULL 
        AND split_part(sdr.object_key, '|', 2)::numeric IN (
            SELECT DISTINCT an.id_anagrafica
            FROM entrasp.anagrafiche_id an
            INNER JOIN entrasp.anagrafiche_vr avr 
                ON an.codice_part = avr.codice_part
                AND an.id_anagrafica = avr.id_anagrafica
            INNER JOIN entrasp.contratti cnt 
                ON an.codice_part = cnt.codice_part
                AND an.id_anagrafica = cnt.id_cliente
            INNER JOIN entrasp.ruoli_anagrafiche ru 
                ON an.codice_part = ru.codice_part
                AND an.id_anagrafica = ru.id_anagrafica
            WHERE 
                an.codice_part = 'FINAFARM'
                AND ru.codice_ruolo = 'CLI'
                AND COALESCE(cnt.data_stipulazione, cnt.data_contratto_da) BETWEEN 
                    date_trunc('year', current_date) - interval '1 year'
                    AND date_trunc('year', current_date) - interval '1 day'
                AND (COALESCE(cnt.data_cessazione, cnt.data_contratto_a) IS NULL 
                    OR COALESCE(cnt.data_cessazione, cnt.data_contratto_a) >= date_trunc('year', current_date))
                AND avr.prog_vr = entrasp.anagrafiche_vr_max(avr.codice_part, avr.id_anagrafica)
                AND cnt.id_argomento_contratto != 49580 
                AND an.tipo_soggetto IN ('E')
                AND NOT EXISTS (
                    SELECT 1
                    FROM entrasp.contratti cnt_pre
                    WHERE cnt_pre.codice_part = an.codice_part
                        AND cnt_pre.id_cliente = an.id_anagrafica
                        AND cnt_pre.data_stipulazione < date_trunc('year', current_date) - interval '1 year'
                        AND cnt_pre.id_argomento_contratto != 49580
                )
        )
)
SELECT 
    codice_azienda,
    id_modello_test,
    data_esecuzione,
    cliente,
    risposta_rp
FROM ranked_responses
WHERE rn = 1
ORDER BY cliente;

-- clienti persone fisiche suddivise per nazione di residenza --434
select distinct entrasp.nazione_descr_bdi(avr1.codice_nazione::numeric), count (an1.id_anagrafica)  from entrasp.anagrafiche_id an1 inner join entrasp.anagrafiche_vr avr1 on an1.codice_part=avr1.codice_part
	and an1.id_anagrafica=avr1.id_anagrafica 
where an1.codice_part||an1.id_anagrafica in(
select distinct
	an.codice_part||an.id_anagrafica
from
	entrasp.anagrafiche_id an
	inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part
	and an.id_anagrafica=avr.id_anagrafica
	inner join entrasp.contratti cnt on an.codice_part=cnt.codice_part
	and an.id_anagrafica=cnt.id_cliente
	inner join entrasp.ruoli_anagrafiche ru on an.codice_part=ru.codice_part
	and an.id_anagrafica=ru.id_anagrafica
where
	an.codice_part='FINAFARM'
	and ru.codice_ruolo='CLI'
	and coalesce (cnt.data_stipulazione, cnt.data_contratto_da)<date_trunc('year', current_date)
	and (coalesce (cnt.data_cessazione, cnt.data_contratto_a) IS NULL OR coalesce (cnt.data_cessazione, cnt.data_contratto_a) >= date_trunc('year', current_date))
	and avr.prog_vr=entrasp.anagrafiche_vr_max (avr.codice_part, avr.id_anagrafica)
	and cnt.id_argomento_contratto!=49580
) and tipo_soggetto in ('P', 'C') and avr1.prog_vr = entrasp.anagrafiche_vr_max(avr1.codice_part, avr1.id_anagrafica)
group by avr1.codice_nazione;

-- clienti persone giuridiche suddivise per nazione di residenza --435
select distinct entrasp.nazione_descr_bdi(avr1.codice_nazione::numeric), count (an1.id_anagrafica)  
from entrasp.anagrafiche_id an1 
inner join entrasp.anagrafiche_vr avr1 on an1.codice_part=avr1.codice_part and an1.id_anagrafica=avr1.id_anagrafica 

where an1.codice_part||an1.id_anagrafica in(
select distinct
	an.codice_part||an.id_anagrafica
from
	entrasp.anagrafiche_id an
	inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part
	and an.id_anagrafica=avr.id_anagrafica
	inner join entrasp.contratti cnt on an.codice_part=cnt.codice_part
	and an.id_anagrafica=cnt.id_cliente
	inner join entrasp.ruoli_anagrafiche ru on an.codice_part=ru.codice_part
	and an.id_anagrafica=ru.id_anagrafica
where
	an.codice_part='FINAFARM'
	and ru.codice_ruolo='CLI'
	and coalesce (cnt.data_stipulazione, cnt.data_contratto_da)<date_trunc('year', current_date)
	and (coalesce (cnt.data_cessazione, cnt.data_contratto_a) IS NULL OR coalesce (cnt.data_cessazione, cnt.data_contratto_a) >= date_trunc('year', current_date))
	and avr.prog_vr=entrasp.anagrafiche_vr_max (avr.codice_part, avr.id_anagrafica)
	and cnt.id_argomento_contratto!=49580
) and tipo_soggetto in ('E') and avr1.prog_vr = entrasp.anagrafiche_vr_max(avr1.codice_part, avr1.id_anagrafica)
group by avr1.codice_nazione;

--contratti attivi relativi a persone giuridiche al 31/12 --436
select distinct
	an.id_anagrafica,
	avr.codice,
	COALESCE(
		NULLIF(an.nome, '')||' '||NULLIF(an.cognome, ''),
		avr.ragione_sociale
	) as denominazione,
	cnt.id_contratto,
	cnt.numero_contratto,
	cnt.data_cessazione,
	cnt.data_stipulazione
from
	entrasp.anagrafiche_id an
	inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part
	and an.id_anagrafica=avr.id_anagrafica
	inner join entrasp.contratti cnt on an.codice_part=cnt.codice_part
	and an.id_anagrafica=cnt.id_cliente
	inner join entrasp.ruoli_anagrafiche ru on an.codice_part=ru.codice_part
	and an.id_anagrafica=ru.id_anagrafica
where
	an.codice_part='FINAFARM'
	and ru.codice_ruolo='CLI'
	and coalesce (cnt.data_stipulazione, cnt.data_contratto_da)<date_trunc('year', current_date)
	and (coalesce (cnt.data_cessazione, cnt.data_contratto_a) IS NULL OR coalesce (cnt.data_cessazione, cnt.data_contratto_a) >= date_trunc('year', current_date)
				)
	and avr.prog_vr=entrasp.anagrafiche_vr_max (avr.codice_part, avr.id_anagrafica)
	and cnt.id_argomento_contratto!=49580 and an.tipo_soggetto='E'
	order by
	denominazione;

--contratti attivi relativi a persone fisiche e cointestati al 31/12 --437
select distinct
	an.id_anagrafica,
	avr.codice,
	COALESCE(
		NULLIF(an.nome, '')||' '||NULLIF(an.cognome, ''),
		avr.ragione_sociale
	) as denominazione,
	cnt.id_contratto,
	cnt.numero_contratto,
	cnt.data_cessazione,
	cnt.data_stipulazione,
	EXTRACT(
		year
		from
			cnt.data_stipulazione
	) as anno_stipula
from
	entrasp.anagrafiche_id an
	inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part
	and an.id_anagrafica=avr.id_anagrafica
	inner join entrasp.contratti cnt on an.codice_part=cnt.codice_part
	and an.id_anagrafica=cnt.id_cliente
	inner join entrasp.ruoli_anagrafiche ru on an.codice_part=ru.codice_part
	and an.id_anagrafica=ru.id_anagrafica
where
	an.codice_part='FINAFARM'
	and ru.codice_ruolo='CLI'
	and coalesce (cnt.data_stipulazione, cnt.data_contratto_da)<date_trunc('year', current_date)
	and (coalesce (cnt.data_cessazione, cnt.data_contratto_a) IS NULL OR coalesce (cnt.data_cessazione, cnt.data_contratto_a) >= date_trunc('year', current_date)
				)
	and avr.prog_vr=entrasp.anagrafiche_vr_max (avr.codice_part, avr.id_anagrafica)
	and cnt.id_argomento_contratto!=49580 and an.tipo_soggetto in ('P', 'C')
	order by
	denominazione;


-- Rapporti attivi relativi a persone giuridiche al 31/12 suddivisi per nazione di residenza --438
select distinct
	entrasp.nazione_descr_bdi(avr.codice_nazione::numeric),
	count (cnt.id_contratto)
from
	entrasp.anagrafiche_id an
	inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part
	and an.id_anagrafica=avr.id_anagrafica
	inner join entrasp.contratti cnt on an.codice_part=cnt.codice_part
	and an.id_anagrafica=cnt.id_cliente
	inner join entrasp.ruoli_anagrafiche ru on an.codice_part=ru.codice_part
	and an.id_anagrafica=ru.id_anagrafica
where
	an.codice_part='FINAFARM'
	and ru.codice_ruolo='CLI'
	and coalesce (cnt.data_stipulazione, cnt.data_contratto_da)<date_trunc('year', current_date)
	and (coalesce (cnt.data_cessazione, cnt.data_contratto_a) IS NULL OR coalesce (cnt.data_cessazione, cnt.data_contratto_a) >= date_trunc('year', current_date)
				)
	and avr.prog_vr=entrasp.anagrafiche_vr_max (avr.codice_part, avr.id_anagrafica)
	and cnt.id_argomento_contratto!=49580 and an.tipo_soggetto = 'E'
	group by avr.codice_nazione;

-- Rapporti attivi relativi a persone fisiche al 31/12 suddivisi per nazione di residenza --439
select distinct
	entrasp.nazione_descr_bdi(avr.codice_nazione::numeric),
	count (cnt.id_contratto)
from
	entrasp.anagrafiche_id an
	inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part
	and an.id_anagrafica=avr.id_anagrafica
	inner join entrasp.contratti cnt on an.codice_part=cnt.codice_part
	and an.id_anagrafica=cnt.id_cliente
	inner join entrasp.ruoli_anagrafiche ru on an.codice_part=ru.codice_part
	and an.id_anagrafica=ru.id_anagrafica
where
	an.codice_part='FINAFARM'
	and ru.codice_ruolo='CLI'
	and coalesce (cnt.data_stipulazione, cnt.data_contratto_da)<date_trunc('year', current_date)
	and (coalesce (cnt.data_cessazione, cnt.data_contratto_a) IS NULL OR coalesce (cnt.data_cessazione, cnt.data_contratto_a) >= date_trunc('year', current_date)
				)
	and avr.prog_vr=entrasp.anagrafiche_vr_max (avr.codice_part, avr.id_anagrafica)
	and cnt.id_argomento_contratto!=49580 and an.tipo_soggetto in ('P', 'C')
	group by avr.codice_nazione;

--rafforzate clienti persone giuridiche nell'ultimo esercizio --440
select distinct sdr.codice_azienda, sdr.id_modello_test,entrasp.anagrafiche_vr_dati_identificativi(az.codice_part::text, split_part (sdr.object_key, '|',2)::numeric)as cliente, risposta_rp  
from entrasp.select_domande_delle_risposte sdr
inner join entrasp.aziende az on sdr.codice_azienda=az.codice_azienda
WHERE sdr.id_argomento = 47504 and argomento_risposte_previste=6765 and sdr.codice_azienda='FINAFARM' and sdr.id_risposta_prev is not null and split_part(sdr.object_key, '|', 2)::numeric in (

select distinct
	an.id_anagrafica
from
	entrasp.anagrafiche_id an
	inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part
	and an.id_anagrafica=avr.id_anagrafica
	inner join entrasp.contratti cnt on an.codice_part=cnt.codice_part
	and an.id_anagrafica=cnt.id_cliente
	inner join entrasp.ruoli_anagrafiche ru on an.codice_part=ru.codice_part
	and an.id_anagrafica=ru.id_anagrafica
where
	an.codice_part='FINAFARM'
	and ru.codice_ruolo='CLI'
	and coalesce (cnt.data_stipulazione, cnt.data_contratto_da)<date_trunc('year', current_date)
	and (coalesce (cnt.data_cessazione, cnt.data_contratto_a) IS NULL OR coalesce (cnt.data_cessazione, cnt.data_contratto_a) >= date_trunc('year', current_date))
	and avr.prog_vr=entrasp.anagrafiche_vr_max (avr.codice_part, avr.id_anagrafica)
	and cnt.id_argomento_contratto!=49580 and an.tipo_soggetto='E'
)order by cliente;

--rafforzate clienti persone fisiche nell'ultimo esercizio --441
select distinct sdr.codice_azienda, sdr.id_modello_test,entrasp.anagrafiche_vr_dati_identificativi(az.codice_part::text, split_part (sdr.object_key, '|',2)::numeric)as cliente, risposta_rp  
from entrasp.select_domande_delle_risposte sdr
inner join entrasp.aziende az on sdr.codice_azienda=az.codice_azienda
WHERE sdr.id_argomento = 47504 and argomento_risposte_previste=6765 and sdr.codice_azienda='FINAFARM' and sdr.id_risposta_prev is not null and split_part(sdr.object_key, '|', 2)::numeric in (

select distinct
	an.id_anagrafica
from
	entrasp.anagrafiche_id an
	inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part
	and an.id_anagrafica=avr.id_anagrafica
	inner join entrasp.contratti cnt on an.codice_part=cnt.codice_part
	and an.id_anagrafica=cnt.id_cliente
	inner join entrasp.ruoli_anagrafiche ru on an.codice_part=ru.codice_part
	and an.id_anagrafica=ru.id_anagrafica
where
	an.codice_part='FINAFARM'
	and ru.codice_ruolo='CLI'
	and coalesce (cnt.data_stipulazione, cnt.data_contratto_da)<date_trunc('year', current_date)
	and (coalesce (cnt.data_cessazione, cnt.data_contratto_a) IS NULL OR coalesce (cnt.data_cessazione, cnt.data_contratto_a) >= date_trunc('year', current_date))
	and avr.prog_vr=entrasp.anagrafiche_vr_max (avr.codice_part, avr.id_anagrafica)
	and cnt.id_argomento_contratto!=49580 and an.tipo_soggetto in ('P','C')
)order by cliente;

--motivazioni rafforzate clienti persone giuridiche nell'ultimo esercizio --442
select distinct sdr.codice_azienda, sdr.id_modello_test,entrasp.anagrafiche_vr_dati_identificativi(az.codice_part::text, split_part (sdr.object_key, '|',2)::numeric)as cliente, risposta_rp  
from entrasp.select_domande_delle_risposte sdr
inner join entrasp.aziende az on sdr.codice_azienda=az.codice_azienda
WHERE sdr.id_argomento = 47505 and sdr.codice_azienda='FINAFARM' and sdr.id_risposta_prev is not null and split_part(sdr.object_key, '|', 2)::numeric in (

select distinct
	an.id_anagrafica
from
	entrasp.anagrafiche_id an
	inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part
	and an.id_anagrafica=avr.id_anagrafica
	inner join entrasp.contratti cnt on an.codice_part=cnt.codice_part
	and an.id_anagrafica=cnt.id_cliente
	inner join entrasp.ruoli_anagrafiche ru on an.codice_part=ru.codice_part
	and an.id_anagrafica=ru.id_anagrafica
where
	an.codice_part='FINAFARM'
	and ru.codice_ruolo='CLI'
	and coalesce (cnt.data_stipulazione, cnt.data_contratto_da)<date_trunc('year', current_date)
	and (coalesce (cnt.data_cessazione, cnt.data_contratto_a) IS NULL OR coalesce (cnt.data_cessazione, cnt.data_contratto_a) >= date_trunc('year', current_date))
	and avr.prog_vr=entrasp.anagrafiche_vr_max (avr.codice_part, avr.id_anagrafica)
	and cnt.id_argomento_contratto!=49580 and an.tipo_soggetto='E'
)order by cliente;

--motivazioni rafforzate clienti persone fisiche nell'ultimo esercizio --443
select distinct sdr.codice_azienda, sdr.id_modello_test,entrasp.anagrafiche_vr_dati_identificativi(az.codice_part::text, split_part (sdr.object_key, '|',2)::numeric)as cliente, risposta_rp  
from entrasp.select_domande_delle_risposte sdr
inner join entrasp.aziende az on sdr.codice_azienda=az.codice_azienda
WHERE sdr.id_argomento = 47505 and sdr.codice_azienda='FINAFARM' and sdr.id_risposta_prev is not null and split_part(sdr.object_key, '|', 2)::numeric in (

select distinct
	an.id_anagrafica
from
	entrasp.anagrafiche_id an
	inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part
	and an.id_anagrafica=avr.id_anagrafica
	inner join entrasp.contratti cnt on an.codice_part=cnt.codice_part
	and an.id_anagrafica=cnt.id_cliente
	inner join entrasp.ruoli_anagrafiche ru on an.codice_part=ru.codice_part
	and an.id_anagrafica=ru.id_anagrafica
where
	an.codice_part='FINAFARM'
	and ru.codice_ruolo='CLI'
	and coalesce (cnt.data_stipulazione, cnt.data_contratto_da)<date_trunc('year', current_date)
	and (coalesce (cnt.data_cessazione, cnt.data_contratto_a) IS NULL OR coalesce (cnt.data_cessazione, cnt.data_contratto_a) >= date_trunc('year', current_date))
	and avr.prog_vr=entrasp.anagrafiche_vr_max (avr.codice_part, avr.id_anagrafica)
	and cnt.id_argomento_contratto!=49580 and an.tipo_soggetto in ('C', 'P')
)order by cliente;


--riunioni con tema antiriciclaggio --444
Select ri.id_riunione,ri.data_riunione from entrasp.riunioni ri 
inner join entrasp.odg_riunioni odg on ri.codice_azienda=odg.codice_azienda and ri.id_riunione=odg.id_riunione
where odg.codice_azienda='FINAFARM' and odg.id_argomento in (4203,4209,4212,43550) AND ri.data_riunione BETWEEN date_trunc('year', CURRENT_DATE)-INTERVAL '1 year'
                           AND (date_trunc('year', CURRENT_DATE) - INTERVAL '1 day');

--riunioni con tema relazione e autovalutazione antiriciclaggio --445
Select ri.id_riunione,ri.data_riunione from entrasp.riunioni ri 
inner join entrasp.odg_riunioni odg on ri.codice_azienda=odg.codice_azienda and ri.id_riunione=odg.id_riunione
where odg.codice_azienda='FINAFARM' and odg.id_argomento in (4203) AND ri.data_riunione BETWEEN date_trunc('year', CURRENT_DATE)-INTERVAL '1 year'
                           AND (date_trunc('year', CURRENT_DATE) - INTERVAL '1 day');

													 
--riunioni con tema carenze antiriciclaggio --446
Select ri.id_riunione,ri.data_riunione from entrasp.riunioni ri 
inner join entrasp.odg_riunioni odg on ri.codice_azienda=odg.codice_azienda and ri.id_riunione=odg.id_riunione
where odg.codice_azienda='FINAFARM' and odg.id_argomento in (4209,4212,43550) AND ri.data_riunione BETWEEN date_trunc('year', CURRENT_DATE)-INTERVAL '1 year'
                           AND (date_trunc('year', CURRENT_DATE) - INTERVAL '1 day');

--clienti con alert di terrorismo identificati da software --447
select distinct
	risposta,
	risposta_tc,
	entrasp.anagrafiche_vr_dati_identificativi (ams.codice_part, ams.id_anagrafica)
from
	imports.aml_scans ams
	inner join (
		select
			codice_azienda,
			id_sondaggio,
			id_somministrazione
		from
			entrasp.sondaggi_somministrati
		where
			codice_azienda='FINAFARM') ss
			on ams.id_somministrazione=ss.id_somministrazione
			and ams.codice_azienda=ss.codice_azienda
where
	ams.codice_azienda='FINAFARM'
	and risposta='Sì'
	and ams.date_of_scan BETWEEN (date_trunc('year', CURRENT_DATE) - INTERVAL '1 year') AND date_trunc('year', CURRENT_DATE)
                           


--clienti con alert confermati di terrorismo identificati da software
select distinct
	risposta,
	risposta_tc,
	entrasp.anagrafiche_vr_dati_identificativi (ams.codice_part, ams.id_anagrafica), ams.date_of_scan 
from
	imports.aml_scans ams
	inner join (
		select
			codice_azienda,
			id_sondaggio,
			id_somministrazione
		from
			entrasp.sondaggi_somministrati
		where
			codice_azienda='FINAFARM') ss
			on ams.id_somministrazione=ss.id_somministrazione
			and ams.codice_azienda=ss.codice_azienda
where
	ams.codice_azienda='FINAFARM'
	and risposta='Sì'
	and risposta_tc in ('Terrorista/ CFT', 'Crime')
	and ams.date_of_scan BETWEEN (date_trunc('year', CURRENT_DATE) - INTERVAL '1 year') AND date_trunc('year', CURRENT_DATE);


--clienti con adeguata verifica non aggiornata
select
	ss.id_somministrazione,
	mt.id_modello_test,
	snd.titolo,
	ss.object_description as verifica_su,
	snd.data_prevista as scaduto_il,
	snd.data_esecuzione as effettuato_il
from
	entrasp.sondaggi_somministrati ss
	inner join entrasp.sondaggi snd on ss.codice_azienda=snd.codice_azienda
	and ss.id_sondaggio=snd.id_sondaggio
	inner join entrasp.modelli_test mt on snd.codice_azienda=mt.codice_azienda
	and snd.id_modello_test=mt.id_modello_test
	and SPLIT_PART(ss.object_key, '|', 2)::NUMERIC in (
		select
			cnt.id_cliente
		from
			entrasp.contratti cnt
		where
			cnt.codice_azienda='FINAFARM'
			and cnt.stato!='C'
	)
where
	snd.codice_azienda='FINAFARM'
	and mt.id_tipo_modello_test=50
	and snd.data_prevista<date_trunc('year', current_date) 
	and snd.data_esecuzione>snd.data_prevista
	and ss.stato not in ('C', 'N')
	and id_argomento!=45421
	and mt.id_argomento in (48339,48338)
	and ss.object_name='anagraficheId';

--clienti con rafforzata e con adeguata verifica non aggiornata
select
	ss.id_somministrazione,
	mt.id_modello_test,
	snd.titolo,
	ss.object_description as verifica_su,
	snd.data_prevista as scaduto_il
from
	entrasp.sondaggi_somministrati ss
	inner join entrasp.sondaggi snd on ss.codice_azienda=snd.codice_azienda
	and ss.id_sondaggio=snd.id_sondaggio
	inner join entrasp.modelli_test mt on snd.codice_azienda=mt.codice_azienda
	and snd.id_modello_test=mt.id_modello_test
	and SPLIT_PART(ss.object_key, '|', 2)::NUMERIC in (
		select
			cnt.id_cliente
		from
			entrasp.contratti cnt
		where
			cnt.codice_azienda='FINAFARM'
			and cnt.stato!='C'
	)
where
	snd.codice_azienda='FINAFARM'
	and mt.id_tipo_modello_test=50
	and snd.data_prevista<current_date
	and ss.stato not in ('C', 'N')
	and id_argomento!=45421
	and mt.id_argomento in (48339,48338)
	and ss.object_name='anagraficheId'
	and (ss.codice_azienda, SPLIT_PART(ss.object_key, '|', 2)::NUMERIC) in (
	select distinct sdr.codice_azienda, split_part (sdr.object_key, '|',2)::numeric
from entrasp.select_domande_delle_risposte sdr
inner join entrasp.aziende az on sdr.codice_azienda=az.codice_azienda
WHERE sdr.id_argomento = 47504 and argomento_risposte_previste=6765 and sdr.codice_azienda='FINAFARM' and sdr.id_risposta_prev is not null and split_part(sdr.object_key, '|', 2)::numeric in (

select distinct
	an.id_anagrafica
from
	entrasp.anagrafiche_id an
	inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part
	and an.id_anagrafica=avr.id_anagrafica
	inner join entrasp.contratti cnt on an.codice_part=cnt.codice_part
	and an.id_anagrafica=cnt.id_cliente
	inner join entrasp.ruoli_anagrafiche ru on an.codice_part=ru.codice_part
	and an.id_anagrafica=ru.id_anagrafica
where
	an.codice_part='FINAFARM'
	and ru.codice_ruolo='CLI'
	and coalesce (cnt.data_stipulazione, cnt.data_contratto_da)<date_trunc('year', current_date)
	and (coalesce (cnt.data_cessazione, cnt.data_contratto_a) IS NULL OR coalesce (cnt.data_cessazione, cnt.data_contratto_a) >= date_trunc('year', current_date))
	and avr.prog_vr=entrasp.anagrafiche_vr_max (avr.codice_part, avr.id_anagrafica)
	and cnt.id_argomento_contratto!=49580 and an.tipo_soggetto in ('P','C')
));