import os
import json
import re

def process_json_files(directory, log_file):
    # Lista per raccogliere le chiavi aggiunte
    added_keys = []

    # Funzione per rimuovere i caratteri speciali dalle chiavi
    def format_label(label):
        if label.strip():
            return re.sub(r'[^a-zA-Z0-9_]', '', label.lower().replace(" ", "_"))
        else:
            return "void"

    # Funzione per convertire le chiavi in formato title case
    def to_title_case(label):
        if label == "void":
            return "Void"
        return " ".join(word.capitalize() for word in label.split("_"))

    # Funzione ricorsiva per aggiungere le chiavi translate
    def add_translate_keys(obj, path=''):
        nonlocal modified
        if isinstance(obj, dict):
            # Salta le modifiche sull'oggetto se contiene "icon": "more_vert"
            if obj.get('icon') == 'more_vert':
                print(f"Skipping object with 'icon': 'more_vert' at path {path}")
            else:
                # Aggiungi la chiave translate se manca
                if 'label' in obj and 'translate' not in obj and isinstance(obj['label'], str):
                    formatted_label = format_label(obj['label'])
                    translate_key = f"RESOURCES.{formatted_label}"
                    obj['translate'] = translate_key
                    added_keys.append(f'{formatted_label}: "{to_title_case(formatted_label)}",')
                    modified = True
                if 'message' in obj and 'translate' not in obj and isinstance(obj['message'], str):
                    formatted_label = format_label(obj['message'])
                    translate_key = f"RESOURCES.{formatted_label}"
                    obj['translate'] = translate_key
                    added_keys.append(f'{formatted_label}: "{to_title_case(formatted_label)}",')
                    modified = True
                if 'labelAdd' in obj and 'translateAdd' not in obj and isinstance(obj['labelAdd'], str):
                    formatted_label = format_label(obj['labelAdd'])
                    translate_key = f"RESOURCES.{formatted_label}"
                    obj['translateAdd'] = translate_key
                    added_keys.append(f'{formatted_label}: "{to_title_case(formatted_label)}",')
                    modified = True
                if 'labelQuickAdd' in obj and 'translateQuickAdd' not in obj and isinstance(obj['labelQuickAdd'], str):
                    formatted_label = format_label(obj['labelQuickAdd'])
                    translate_key = f"RESOURCES.{formatted_label}"
                    obj['translateQuickAdd'] = translate_key
                    added_keys.append(f'{formatted_label}: "{to_title_case(formatted_label)}",')
                    modified = True

            # Ricorsione per gestire i dizionari annidati
            for key, value in obj.items():
                new_path = f"{path}.{key}" if path else key
                add_translate_keys(value, new_path)

        elif isinstance(obj, list):
            for idx, item in enumerate(obj):
                new_path = f"{path}[{idx}]"
                add_translate_keys(item, new_path)

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
