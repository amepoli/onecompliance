import json
from pathlib import Path

def filter_predefined_queries(json_data):
    # Verifica che la chiave 'predefinedQueries' esista nel dizionario
    if 'predefinedQueries' not in json_data:
        return []

    filtered_queries = []
    
    # Itera su ciascun elemento in 'predefinedQueries'
    for query in json_data['predefinedQueries']:
        # Verifica se l'elemento ha le proprietà 'operation' e 'type'
        if 'operation' in query and 'type' in query:
            if query['operation'] in ['update', 'insert']:
                filtered_queries.append(query)
    
    return filtered_queries

def find_matching_json_files(directory_path):
    matching_files = []

    # Scandire tutti i file nella directory
    for file_path in Path(directory_path).rglob('*.json'):
        try:
            with open(file_path, 'r') as file:
                json_data = json.load(file)
                
                # Filtra le query secondo i criteri
                filtered_queries = filter_predefined_queries(json_data)
                
                if filtered_queries:
                    # Estrai la proprietà 'origin' se esiste
                    origin = json_data.get('origin', 'undefined')
                    # Aggiungi una tupla con il nome del file e il valore di 'origin'
                    matching_files.append((file_path.name, origin))
        except (FileNotFoundError, json.JSONDecodeError):
            # Ignora file che non possono essere aperti o che non sono JSON validi
            continue

    # Ordina i file per valore della proprietà 'origin'
    matching_files.sort(key=lambda x: x[1])
    
    return matching_files

# Esempio di utilizzo
def main(directory_path):
    matching_files = find_matching_json_files(directory_path)
    
    # Costruisci l'output con una nuova riga per ogni file
    if matching_files:
        result = '\n'.join([f"{file_name} (origin: {origin})" for file_name, origin in matching_files])
        print(result)
    else:
        print("Nessun file JSON trovato che soddisfi i criteri.")

# Esegui la funzione principale con il percorso della directory desiderata
main('/home/apoli/Development/onecompliance/dynamo-tables/views')
