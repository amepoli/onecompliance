#!/bin/bash

# Configura il database e la directory di export
DB_ENDPOINT=`cat /home/ec2-user/db_endpoint.donotremove`
DB_NAME="onecompliance"
DB_USER="postgres"
SCHEMA_NAME="entrasp"
EXPORT_DIR="/home/ec2-user/Database/${SCHEMA_NAME}/tables"

# Assicurati che la directory di export esista
mkdir -p "$EXPORT_DIR"

# Ottieni l'elenco delle tabelle dallo schema
table_names=$(psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -At -c "
    SELECT c.relname FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r' AND n.nspname = '$SCHEMA_NAME';
")

# Itera su ogni tabella e salva la definizione in un file separato
for table_name in $table_names; do
    clean_table_name=$(echo "$table_name" | tr -cd '[:alnum:]_')
    output_file="$EXPORT_DIR/${clean_table_name}.sql"

    echo "Esportando definizione completa della tabella: $table_name in $output_file"

    # Inizia la definizione della tabella
    {
        echo "-- Definizione della tabella $table_name"

        # Definizione della tabella con le colonne
        psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -At -c "
            SELECT 'CREATE TABLE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || ' (' || E'\n' ||
                   string_agg('    ' || att.attname || ' ' || format_type(att.atttypid, att.atttypmod), E',\n') || E'\n);'
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            JOIN pg_attribute att ON att.attrelid = c.oid AND att.attnum > 0 AND NOT att.attisdropped
            WHERE c.relkind = 'r' AND n.nspname = '$SCHEMA_NAME' AND c.relname = '$table_name'
            GROUP BY c.relname, n.nspname;
        "

        # Constraints della tabella
        echo "-- Constraints"
        psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -At -c "
            SELECT 'ALTER TABLE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || 
                   ' ADD ' || pg_get_constraintdef(con.oid) || ';'
            FROM pg_constraint con
            JOIN pg_class c ON c.oid = con.conrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = '$SCHEMA_NAME' AND c.relname = '$table_name';
        "

        # Trigger legati alla tabella, escludendo quelli interni (constraint)
        echo "-- Trigger"
        psql -h "$DB_ENDPOINT" -U "$DB_USER" -d "$DB_NAME" -At -c "
            SELECT 'CREATE TRIGGER ' || tgname || ' ' || pg_get_triggerdef(t.oid) || ';'
            FROM pg_trigger t
            JOIN pg_class c ON c.oid = t.tgrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = '$SCHEMA_NAME' AND c.relname = '$table_name' AND NOT t.tgisinternal;
        "

    } | sed 's/\\n/\n/g; s/\\t/    /g' > "$output_file"

    if [[ $? -eq 0 ]]; then
        echo "Esportazione completata per $table_name"
    else
        echo "Errore durante l'esportazione di $table_name"
    fi
done

echo "Esportazione completata per tutte le tabelle."
