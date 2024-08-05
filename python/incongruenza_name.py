import os
import json

def find_mismatched_json_keys(directory_path):
    for root, _, files in os.walk(directory_path):
        for file in files:
            if file.endswith('.json'):
                file_path = os.path.join(root, file)
                with open(file_path, 'r') as f:
                    try:
                        data = json.load(f)
                        file_name_without_extension = os.path.splitext(file)[0].lower()  # Nome file in minuscolo
                        
                        if isinstance(data, dict) and 'name' in data:
                            name = data['name'].lower()  # Chiave in minuscolo
                            if name != file_name_without_extension:
                                print(f"File: {file} | Name: {data['name']}")
                        else:
                            print(f"File: {file} non contiene una proprietà 'name' valida.")
                    except json.JSONDecodeError:
                        print(f"Errore nella decodifica del file JSON: {file_path}")

# Sostituisci 'your_directory_path' con il percorso effettivo della tua directory
directory_path = '/home/apoli/Development/onecompliance/dynamo-tables/profiles'
find_mismatched_json_keys(directory_path)


