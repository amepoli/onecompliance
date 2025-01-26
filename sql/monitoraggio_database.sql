-- Query 1: Elenca tutte le tabelle base (BASE TABLE) presenti negli schemi 'entrasp' e 'imports'.
SELECT table_name
FROM information_schema.tables
WHERE table_schema in ('entrasp','imports') -
  AND table_type = 'BASE TABLE'; -- Considera solo le tabelle di tipo "BASE TABLE" (tabelle fisiche e non viste o altre entità).

-- Query 2: Recupera i dettagli delle colonne delle tabelle negli schemi 'entrasp' e 'imports'.
SELECT table_schema, table_name, column_name, data_type, is_nullable, character_maximum_length
FROM information_schema.columns
WHERE table_schema in ('entrasp','imports') 
ORDER BY table_schema, table_name, ordinal_position; 

-- Query 3: Estrae statistiche sulle tabelle utente negli schemi 'entrasp' e 'imports'.
SELECT 
		current_date AS data_estrazione,
		pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_table_size(relid)) AS table_size,
    pg_size_pretty(pg_indexes_size(relid)) AS indexes_size,
		* 
FROM 
    pg_stat_user_tables
WHERE schemaname in ('entrasp','imports') 
ORDER BY 
    schemaname, n_live_tup DESC; 


-- Query 4: Estrae statistiche sulle query.
SELECT 
    *
FROM pg_stat_statements
ORDER BY total_exec_time DESC

-- Query 5: Estrae statistiche sugli indici.
SELECT 
   *
FROM pg_stat_user_indexes
WHERE schemaname in ('entrasp','imports') 
ORDER BY schemaname, relname;

-- Query 5: Estrae statistiche sui blocchi.
SELECT 
   *
FROM pg_locks
JOIN pg_stat_activity ON pg_locks.pid = pg_stat_activity.pid;


-- Query 6: Estrae spazio occupato dalle tabelle
SELECT 
    schemaname,
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_table_size(relid)) AS table_size,
    pg_size_pretty(pg_indexes_size(relid)) AS indexes_size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Query 7: Estrae statistiche sui trigger
SELECT 
    *
FROM pg_stat_user_functions
ORDER BY total_time DESC;

-- Query 8: Estrae statistiche sulle transazioni
SELECT 
    pid,
    usename,
    state,
    now() - xact_start AS transaction_age,
    query,
		*
FROM pg_stat_activity
ORDER BY transaction_age DESC;

-- Query 9: Estrae statistiche sulle connessioni
SELECT 
    datname,
    numbackends AS active_connections,
    max_conn,
    (numbackends * 100.0 / max_conn) AS utilization_percent,
		*
FROM pg_stat_database
CROSS JOIN (SELECT setting::int AS max_conn FROM pg_settings WHERE name = 'max_connections') max_conn;



