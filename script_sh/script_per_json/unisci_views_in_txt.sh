#!/bin/bash

# Imposta la directory contenente i file JSON
DIRECTORY="/home/apoli/Development/onecompliance/dynamo-tables/views/"

# Imposta il file di output
OUTPUT_FILE="/home/apoli/Development/onecompliance/script_sh/script_per_json/merged_views_json.txt"

# Controlla se la directory esiste
if [ ! -d "$DIRECTORY" ]; then
    echo "La directory specificata non esiste."
    exit 1
fi

# Cancella il file di output se esiste già
> "$OUTPUT_FILE"

# Scansiona tutti i file JSON nella directory e li concatena nel file di output
for file in "$DIRECTORY"/*.json; do
    if [ -f "$file" ]; then
        cat "$file" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"  # Aggiunge una nuova riga tra i file
    fi
done

echo "Tutti i file JSON sono stati uniti in $OUTPUT_FILE"
