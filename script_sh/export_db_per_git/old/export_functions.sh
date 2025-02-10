#!/bin/bash

# Configura il database
DB_ENDPOINT=`cat /home/ec2-user/db_endpoint.donotremove`
DB_NAME="onecompliance"
DB_USER="postgres"
SCHEMA_NAME="entrasp"
EXPORT_DIR="/home/ec2-user/Database/${SCHEMA_NAME}/functions"

# Assicurati che la directory di export esista
mkdir -p "$EXPORT_DIR"

# Cancella tutti i file esistenti nella directory di destinazione
rm -f "$EXPORT_DIR"/*

# Recupera i dati e salva direttamente ogni funzione in un file separato
psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -At -c "
SELECT p.proname || '▲' || pg_get_functiondef(p.oid) || 'Ç'
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = '$SCHEMA_NAME'
AND p.prorettype NOT IN (SELECT oid FROM pg_type WHERE typname = 'trigger');
" | {

    current_function_name=""
    current_function_definition=""

    while read -r line; do
        # Gestisci l'inizio di una nuova funzione se trovi `▲`
        if [[ "$line" == *▲* ]]; then
            current_function_name=$(echo "$line" | cut -d'▲' -f1)
            current_function_definition=$(echo "$line" | cut -d'▲' -f2)
        
        # Se trovi `Ç`, completa la funzione
        elif [[ "$line" == *Ç ]]; then
            current_function_definition="${current_function_definition}${line//Ç/}"

            # Pulisci il nome del file
            clean_function_name=$(echo "$current_function_name" | tr -cd '[:alnum:]_')

            # Scrivi la definizione nel file
            if [[ -n "$clean_function_name" && -n "$current_function_definition" ]]; then
                echo -e "$current_function_definition" > "$EXPORT_DIR/${clean_function_name}.sql"
            else
                echo "Errore: Nome funzione o definizione vuota per $current_function_name"
            fi

            # Reset per la prossima funzione
            current_function_name=""
            current_function_definition=""
        
        # Accumula le righe nella definizione corrente
        else
            current_function_definition="${current_function_definition}${line}"$'\n'
        fi
    done
}

echo "Esportazione completata."
