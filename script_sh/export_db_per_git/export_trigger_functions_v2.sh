#!/bin/bash

# Configura il database e la directory di export
DB_ENDPOINT=`cat /home/ec2-user/db_endpoint.donotremove`
DB_NAME="onecompliance"
DB_USER="postgres"
SCHEMA_NAME="entrasp"
EXPORT_DIR="/home/ec2-user/Database/${SCHEMA_NAME}/trigger_functions"

# Assicurati che la directory di export esista
mkdir -p "$EXPORT_DIR"

# Ottieni l'elenco delle trigger functions dallo schema
trigger_function_names=$(psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -At -c "
    SELECT proname FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_trigger t ON t.tgfoid = p.oid
    WHERE n.nspname = '$SCHEMA_NAME' AND p.prorettype = 2279;
")

# Itera su ogni funzione e salva la definizione in un file separato
for trigger_function_name in $trigger_function_names; do
    clean_function_name=$(echo "$trigger_function_name" | tr -cd '[:alnum:]_')
    output_file="$EXPORT_DIR/${clean_function_name}.sql"

    echo "Esportando trigger function: $trigger_function_name in $output_file"

    # Esegui il comando COPY per esportare la definizione della funzione, gestendo correttamente i ritorni a capo
    psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -At -c "
        SELECT pg_get_functiondef(p.oid)
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = '$SCHEMA_NAME' AND p.proname = '$trigger_function_name';
    " | sed 's/\\n/\n/g; s/\\t/    /g' > "$output_file"

    if [[ $? -eq 0 ]]; then
        echo "Esportazione completata per $trigger_function_name"
    else
        echo "Errore durante l'esportazione di $trigger_function_name"
    fi
done

echo "Esportazione completata per tutte le trigger functions."
