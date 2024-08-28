import os
import json
import sys

def find_origin_files(base_names, search_directory):
    origin_files = {}

    # Itera su ogni file JSON nella directory specificata
    for root, dirs, files in os.walk(search_directory):
        for file in files:
            if file.endswith('.json'):
                file_path = os.path.join(root, file)
                
                # Cerca di aprire e leggere il file JSON
                try:
                    with open(file_path, 'r', encoding='utf-8') as json_file:
                        data = json.load(json_file)
                        
                        # Controlla se esiste una chiave 'origin' e se il valore corrisponde a uno dei nomi base
                        if 'origin' in data and data['origin'] in base_names:
                            if data['origin'] not in origin_files:
                                origin_files[data['origin']] = []
                            origin_files[data['origin']].append(file_path)
                except (json.JSONDecodeError, IOError) as e:
                    print(f"Errore durante la lettura di {file_path}: {e}")

    return origin_files

if __name__ == "__main__":
    # Leggi i nomi di base da riga di comando
    base_names = sys.argv[1:]
    
    if not base_names:
        print("Devi specificare almeno un nome base.")
        sys.exit(1)

    # Directory dove cercare i file JSON
    search_directory = '/home/eongaro/Desktop/Development/onecompliance/dynamo-tables/views'

    # Trova i file JSON che hanno 'origin' con i nomi base specificati
    origin_files = find_origin_files(base_names, search_directory)
    
    # Stampa i risultati
    if origin_files:
        for base_name, files in origin_files.items():
            print(f"I seguenti file hanno 'origin' come {base_name}:")
            for file in files:
                print(f"  - {file}")
    else:
        print("Nessun file trovato che abbia 'origin' con i nomi specificati.")
