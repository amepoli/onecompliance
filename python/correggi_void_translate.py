import os
import json

def process_json_files(directory_path):
    modified_files_count = 0  # Contatore dei file modificati

    # Itera su tutti i file nella directory specificata
    for filename in os.listdir(directory_path):
        # Verifica se il file è un file JSON
        if filename.endswith(".json"):
            file_path = os.path.join(directory_path, filename)
            
            # Legge il contenuto del file JSON
            with open(file_path, 'r', encoding='utf-8') as file:
                try:
                    data = json.load(file)
                except json.JSONDecodeError as e:
                    continue
            
            # Funzione ricorsiva per controllare e modificare le proprietà nei dati JSON
            def check_and_modify(item):
                modified = False  # Traccia se è avvenuta una modifica
                if isinstance(item, dict):
                    label = item.get("label")
                    message = item.get("message")

                    # Usa "message" se "label" non è presente o non valida
                    if label in [None, "", " ", "void"] and message not in [None, "", " ", "void"]:
                        label = message

                    if "translate" in item and item["translate"] != "RESOURCES.void" and label in [None, "", " ", "void"]:
                        item["translate"] = "RESOURCES.void"
                        modified = True

                    for value in item.values():
                        if isinstance(value, (dict, list)):
                            if check_and_modify(value):
                                modified = True
                elif isinstance(item, list):
                    for element in item:
                        if check_and_modify(element):
                            modified = True
                return modified

            # Verifica e modifica i dati nel file JSON
            modified = check_and_modify(data)
            
            # Scrive di nuovo i dati nel file JSON se sono stati modificati
            if modified:
                with open(file_path, 'w', encoding='utf-8') as file:
                    json.dump(data, file, ensure_ascii=False, indent=4)
                modified_files_count += 1

    # Stampa il numero di file modificati
    print(f"Numero di translate rese void: " + str(modified_files_count))

# Usa la directory home dell'utente per costruire percorsi file
home_dir = os.path.expanduser('~')

# Definisci i percorsi relativi alla directory home
directory_path = os.path.join(home_dir, 'Development/onecompliance/dynamo-tables/views')

process_json_files(directory_path)
