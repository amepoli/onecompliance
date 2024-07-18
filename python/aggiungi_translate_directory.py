import os
import json

def process_json_files(directory, log_file):
    # Lista per raccogliere le chiavi aggiunte
    added_keys = []

    # Itera su tutti i file nella directory
    for filename in os.listdir(directory):
        if filename.endswith(".json"):
            filepath = os.path.join(directory, filename)
            
            try:
                # Apri e carica il file JSON
                with open(filepath, 'r', encoding='utf-8') as file:
                    data = json.load(file)
                
                # Modifica i dati aggiungendo la chiave translate se manca
                modified = False

                def format_label(label):
                    return label.lower().replace(" ", "_")

                def to_title_case(label):
                    return " ".join(word.capitalize() for word in label.split("_"))

                def add_translate_keys(obj):
                    nonlocal modified
                    for key, value in obj.items():
                        if isinstance(value, dict):
                            if 'translate' not in value:
                                if 'label' in value:
                                    translate_key = f"RESOURCES.{key.lower()}"
                                    value['translate'] = translate_key
                                    added_keys.append(f'{key.lower()}: "{to_title_case(key.lower())}",')
                                    modified = True
                                elif 'labelAdd' in value:
                                    formatted_label = format_label(value['labelAdd'])
                                    translate_key = f"RESOURCES.{formatted_label}"
                                    value['translate'] = translate_key
                                    added_keys.append(f'{formatted_label}: "{to_title_case(formatted_label)}",')
                                    modified = True
                                elif 'labelQuickAdd' in value:
                                    formatted_label = format_label(value['labelQuickAdd'])
                                    translate_key = f"RESOURCES.{formatted_label}"
                                    value['translate'] = translate_key
                                    added_keys.append(f'{formatted_label}: "{to_title_case(formatted_label)}",')
                                    modified = True
                            # Ricorsione per gestire i dizionari annidati
                            add_translate_keys(value)
                        elif isinstance(value, list):
                            for item in value:
                                if isinstance(item, dict):
                                    add_translate_keys(item)
                
                add_translate_keys(data)

                # Salva il JSON modificato di nuovo nel file se sono state fatte modifiche
                if modified:
                    with open(filepath, 'w', encoding='utf-8') as file:
                        json.dump(data, file, ensure_ascii=False, indent=4)
                    print(f"Modified and saved file: {filename}")  # Debug print
                else:
                    print(f"No modifications made to file: {filename}")  # Debug print

            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                print(f"Error processing file {filename}: {e}")

    # Scrivi le chiavi aggiunte nel file di log
    with open(log_file, 'w', encoding='utf-8') as log:
        for key in added_keys:
            log.write(f"{key}\n")

# Esempio di utilizzo
directory_path = '/home/alpoli/Developement/onecompliance/dynamo-tables/views'  # Sostituisci con il percorso della tua directory
log_file_path = '/home/alpoli/Developement/onecompliance/python/file_new_translate.txt'  # Sostituisci con il percorso del file di log
process_json_files(directory_path, log_file_path)
