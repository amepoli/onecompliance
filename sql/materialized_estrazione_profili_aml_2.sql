-- View: entrasp.estrazione_profili_aml_2

DROP MATERIALIZED VIEW IF EXISTS entrasp.estrazione_profili_aml_2;


CREATE MATERIALIZED VIEW IF NOT EXISTS entrasp.estrazione_profili_aml_2
TABLESPACE pg_default
AS
-- Step 1: Filtering companies that have active contracts
WITH aziende_filtered AS (
    SELECT DISTINCT aziende.codice_part,
           aziende.codice_azienda
    FROM entrasp.aziende
    WHERE EXISTS (
        SELECT 1
        FROM entrasp.contratti cnt_1
        WHERE cnt_1.stato <> 'C'::bpchar
          AND cnt_1.codice_azienda::text = aziende.codice_azienda::text
    )
),

-- Step 2: Getting the maximum version number for each customer's profile
anagrafiche_vr_max AS (
    SELECT anagrafiche_vr.codice_part,
           anagrafiche_vr.id_anagrafica,
           max(anagrafiche_vr.prog_vr) AS max_prog_vr
    FROM entrasp.anagrafiche_vr
    GROUP BY anagrafiche_vr.codice_part, anagrafiche_vr.id_anagrafica
),

-- Step 3: Extracting PACE (Profilo AML Cliente Extended) data for each customer
pace_data AS (
    SELECT cnt_1.codice_azienda,
           cnt_1.id_cliente AS id_anagrafica,
           pace_1.profilo,
           pace_1.punteggio_ottenuto,
           pace_1.data_esecuzione,
           pace_1.id_sondaggio,
           pace_1.id_risultato,
           pace_1.risultato_percentuale
    FROM entrasp.contratti cnt_1
    JOIN LATERAL entrasp.profilo_aml_cliente_extended(cnt_1.codice_azienda::character varying, cnt_1.id_cliente) pace_1(profilo, punteggio_ottenuto, data_esecuzione, id_sondaggio, id_risultato, risultato_percentuale) ON true
    WHERE pace_1.id_sondaggio IS NOT NULL 
      AND pace_1.punteggio_ottenuto IS NOT NULL 
      AND pace_1.profilo::text <> 'Nessun profilo'::text
)

-- Step 4: Creating the main query for the materialized view
SELECT DISTINCT 
    (CURRENT_DATE - '1 day'::interval)::date AS data_profilo,
    av.codice AS codice_anagrafica,
    COALESCE(NULLIF((an.nome::text || ' '::text) || an.cognome::text, ' '::text), av.ragione_sociale::text) AS denominazione,
    entrasp.pep_yn(cnt.codice_azienda::character varying, av.id_anagrafica) AS pep,
    pace.punteggio_ottenuto AS p_classe_rischio_ver,
    (
        SELECT modelli_test_risultati_righe_da_punteggio_ottenuto.descrizione
        FROM entrasp.modelli_test_risultati_righe_da_punteggio_ottenuto(cnt.codice_azienda, pace.id_risultato, pace.risultato_percentuale) modelli_test_risultati_righe_da_punteggio_ottenuto(descrizione, val_riferimento, flagvaloresignificativo, codiceazienda, pct_da, codice_colore, idrisultato, tipo_calcolo)
    ) AS profilo,
    pace.data_esecuzione AS data_calc_rischio,
    pace.id_risultato,
    COALESCE(av.codice_nazione, av.nazione) AS nazione,
    an.tipo_soggetto,
    ate.cod_ateco,
    cnt.codice_azienda,
    pace.id_sondaggio
FROM entrasp.anagrafiche_id an
JOIN entrasp.anagrafiche_vr av ON an.codice_part::text = av.codice_part::text AND an.id_anagrafica = av.id_anagrafica
LEFT JOIN entrasp.ateco ate ON av.id_ateco = ate.id_ateco
JOIN entrasp.ruoli_anagrafiche ra ON av.codice_part::text = ra.codice_part::text AND av.id_anagrafica = ra.id_anagrafica
JOIN entrasp.contratti cnt ON av.codice_part::text = cnt.codice_part::text AND av.id_anagrafica = cnt.id_cliente
JOIN pace_data pace ON cnt.codice_azienda::text = pace.codice_azienda::text AND av.id_anagrafica = pace.id_anagrafica
JOIN aziende_filtered azf ON av.codice_part::text = azf.codice_part::text
WHERE ra.codice_ruolo::text = 'CLI'::text 
  AND av.prog_vr = (
      SELECT anagrafiche_vr_max.max_prog_vr
      FROM anagrafiche_vr_max
      WHERE av.codice_part::text = anagrafiche_vr_max.codice_part::text 
        AND av.id_anagrafica = anagrafiche_vr_max.id_anagrafica
  )
WITH DATA;

-- Altering the owner of the materialized view to 'marco'
ALTER TABLE IF EXISTS entrasp.estrazione_profili_aml_2
    OWNER TO marco;
