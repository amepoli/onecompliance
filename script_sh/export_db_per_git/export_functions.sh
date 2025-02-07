#!/bin/bash

# Configura il database
# Legge i dettagli del database
DB_ENDPOINT=`cat /home/ec2-user/db_endpoint.donotremove`

DB_NAME="onecompliance"
DB_USER="postgres"
SCHEMA_NAME="entrasp"
EXPORT_DIR="/home/ec2-user/Database/${SCHEMA_NAME}/functions"

# Assicurati che la directory di export esista
mkdir -p "$EXPORT_DIR"

# Recupera i dati e salva direttamente ogni funzione in un file separato
psql  -h $DB_ENDPOINT -U postgres -d onecompliance -c "
SELECT p.proname, pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = '$SCHEMA_NAME';
" | while IFS='|' read -r function_name function_definition; do
    clean_function_name=$(echo "$function_name" | tr -cd '[:alnum:]_')

    # Scrivi la definizione nel file
    echo -e "$function_definition" > "$EXPORT_DIR/${clean_function_name}.sql"
done

echo "Esportazione completata."
