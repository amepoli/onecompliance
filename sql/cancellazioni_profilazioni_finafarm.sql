WITH dominio_base AS (
    SELECT
        ss.object_key,
        snd.data_prevista,
        entrasp.anagrafiche_cognnome(ss.codice_part, (split_part(ss.object_key, '|', 2)::numeric)) AS cognome_nome,
        ss.id_somministrazione,
        ss.codice_part,
        snd.id_sondaggio
    FROM
        entrasp.sondaggi_somministrati ss
    INNER JOIN
        entrasp.sondaggi snd
    USING
        (codice_azienda, id_sondaggio)
    WHERE
        ss.codice_azienda = 'FINAFARM'
        AND snd.id_modello_test = 526
        AND snd.id_sondaggio NOT IN (
            SELECT id_sondaggio
            FROM entrasp.progetti_fasi
            WHERE codice_azienda = 'FINAFARM'
            AND id_sondaggio IS NOT NULL
        )
        AND snd.id_sondaggio NOT IN (
            SELECT id_sondaggio
            FROM entrasp.risposte
            WHERE codice_azienda = 'FINAFARM'
            AND id_sondaggio IS NOT NULL
        )
),
object_key



sotto_dominio AS (
    SELECT DISTINCT ON (db.object_key, db.data_prevista)
        db.object_key,
        db.data_prevista,
        db.cognome_nome,
        db.id_somministrazione,
        db.codice_part,
        db.id_sondaggio
    FROM
        dominio_base db
    INNER JOIN (
        SELECT
            object_key,
            MIN(data_prevista) AS data_inizio
        FROM
            dominio_base
        GROUP BY
            object_key
    ) t_min
    ON db.object_key = t_min.object_key
    WHERE
        db.data_prevista <= t_min.data_inizio + INTERVAL '40 days'
    ORDER BY
        db.object_key,
        db.data_prevista
),
sotto_dominio_con_rn AS (
    SELECT
        sd.*,
        ROW_NUMBER() OVER (PARTITION BY sd.object_key ORDER BY sd.data_prevista) AS row_number
    FROM
        sotto_dominio sd
)
SELECT *
FROM sotto_dominio_con_rn
where row_number>1;
