DO $$
DECLARE
    func RECORD;
    target_code TEXT := 'WHEN not_null_violation THEN
	RAISE EXCEPTION USING DETAIL=(CAMPI OBBLIGATORI NON VALORIZZATIì::text), ERRCODE=SQLSTATE, HINT=SQLERRM;

WHEN OTHERS THEN
	RAISE EXCEPTION USING DETAIL=SQLERRM;';  
    return_type TEXT;  
BEGIN
    FOR func IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_functiondef(p.oid) as function_def,
            format_type(p.prorettype, NULL) as return_type  
        FROM 
            pg_proc p
        JOIN 
            pg_namespace n ON p.pronamespace = n.oid
        WHERE 
            n.nspname NOT IN ('pg_catalog', 'information_schema')  
            AND n.nspname = 'entrasp'  
            --AND p.proname LIKE 'prefix_%' 
    LOOP
        IF func.function_def NOT LIKE '%' || target_code || '%' THEN
            
            return_type := func.return_type;
            
           
            EXECUTE format('
                CREATE OR REPLACE FUNCTION %I.%I() RETURNS %s AS $$
                %s
                %s
                $$ LANGUAGE plpgsql;
            ', func.schema_name, func.function_name, return_type, target_code, func.function_def);
        END IF;
    END LOOP;
END $$;
