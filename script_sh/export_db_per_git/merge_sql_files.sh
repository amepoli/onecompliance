#!/bin/bash

# Definizione delle directory da cui leggere i file .sql
directories=(
    "/home/ec2-user/Database/entrasp/functions"
    "/home/ec2-user/Database/entrasp/trigger_functions"
    "/home/ec2-user/Database/entrasp/tables"
)

# File di output
output_file="/home/ec2-user/Database/input_gpt.txt"

# Cancella il file input_gpt.txt se esiste già
rm -f "$output_file"

# Unisce i file .sql presenti nelle directory
for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        # Scorre tutti i file .sql nella directory corrente
        for file in "$dir"/*.sql; do
            if [ -f "$file" ]; then
                echo "/* File: $file */" >> "$output_file"
                cat "$file" >> "$output_file"
                echo -e "\n" >> "$output_file"  # Aggiunge una linea vuota alla fine di ogni file
            fi
        done
    else
        echo "Directory non trovata: $dir"
    fi
done

echo "Unione completata. Il file risultante è: $output_file"
