-- Query for functions and procedures
SELECT
    routine_catalog AS DatabaseName,
    routine_schema AS SchemaName,
    routine_name AS FunctionName,
    routine_type AS ObjectType
FROM 
    information_schema.routines 
WHERE 
    routine_definition ILIKE '%entrasp.crediti_ceduti%'
    AND (routine_definition ILIKE '%update%' OR routine_definition ILIKE '%insert%')

UNION

-- Query for trigger functions
SELECT
    current_database() AS DatabaseName,
    nspname AS SchemaName,
    proname AS FunctionName,
    'TRIGGER' AS ObjectType
FROM 
    pg_proc
JOIN 
    pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE 
    prosrc ILIKE '%entrasp.crediti_ceduti%'
    AND (prosrc ILIKE '%update%' OR prosrc ILIKE '%insert%')
    AND EXISTS (
       SELECT 1
       FROM pg_trigger
      WHERE pg_trigger.tgfoid = pg_proc.oid
  );
