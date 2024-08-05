import os
import json
import re

def process_json_files(directory, log_file):
    added_keys = set()  # Utilizzare un set per evitare duplicati
    counter = 0

    def format_label(label):
        # Rimuovere caratteri speciali e sostituire spazi con underscore
        label_clean = re.sub(r'[^a-zA-Z0-9_]', '', label.lower().replace(" ", "_"))
        # Se l'etichetta inizia con un numero, spostare i numeri alla fine
        while re.match(r'^[0-9]', label_clean):
            label_clean = re.sub(r'^[0-9]+', '', label_clean) + re.findall(r'^[0-9]+', label_clean)[0]
        return label_clean

    def add_translate_keys(obj, entry_key=None, path='', in_sub_tables=False, parent_entry_key=None):
        nonlocal counter
        nonlocal modified

        if isinstance(obj, dict):
            if obj.get('icon') == 'more_vert':
                pass
            else:
                current_entry_key = parent_entry_key if in_sub_tables else entry_key or obj.get('entryKey')

                if 'label' in obj and 'translate' not in obj and isinstance(obj['label'], str):
                    base_label = obj['label']
                    combined_label = f"{base_label}_{current_entry_key}" if current_entry_key else base_label
                    formatted_label = format_label(combined_label)
                    if formatted_label:
                        translate_key = f"RESOURCES.{formatted_label}"
                        obj['translate'] = translate_key
                        added_keys.add(f'{formatted_label}: "{base_label}",')
                        modified = True
                        counter += 1
                elif 'message' in obj and 'translate' not in obj and isinstance(obj['message'], str):
                    base_label = obj['message']
                    combined_label = f"{base_label}_{current_entry_key}" if current_entry_key else base_label
                    formatted_label = format_label(combined_label)
                    if formatted_label:
                        translate_key = f"RESOURCES.{formatted_label}"
                        obj['translate'] = translate_key
                        added_keys.add(f'{formatted_label}: "{base_label}",')
                        modified = True
                        counter += 1

                for key, value in obj.items():
                    new_path = f"{path}.{key}" if path else key
                    add_translate_keys(value, entry_key if not in_sub_tables else obj.get('entryKey'), new_path, in_sub_tables, parent_entry_key=current_entry_key if in_sub_tables else None)

        elif isinstance(obj, list):
            for idx, item in enumerate(obj):
                new_path = f"{path}[{idx}]"
                add_translate_keys(item, entry_key, new_path, in_sub_tables, parent_entry_key)

    # Inizializzare il file di log vuoto
    with open(log_file, 'w', encoding='utf-8') as log:
        log.write("")

    for filename in os.listdir(directory):
        if filename.endswith(".json"):
            filepath = os.path.join(directory, filename)

            try:
                with open(filepath, 'r', encoding='utf-8') as file:
                    data = json.load(file)

                modified = False

                if "search_keys" in data:
                    add_translate_keys(data["search_keys"], data.get('entryKey'))
                if "table_keys" in data:
                    add_translate_keys(data["table_keys"], data.get('entryKey'))
                if "form_keys" in data:
                    add_translate_keys(data["form_keys"], data.get('entryKey'))
                if "subTables" in data:
                    add_translate_keys(data["subTables"], data.get('entryKey'), in_sub_tables=True)

                if modified:
                    with open(filepath, 'w', encoding='utf-8') as file:
                        json.dump(data, file, ensure_ascii=False, indent=4)

            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                print(f"Error processing file {filename}: {e}")

    with open(log_file, 'a', encoding='utf-8') as log:
        for key in sorted(added_keys):
            formatted_key = key.lower().split(':')[0]
            value = key.split(':')[1]
            log.write(f"{formatted_key}: {value}\n")

    print("Translation aggiunte: " + str(counter))

# Esempio di utilizzo
directory_path = '/home/gcrozzolin/Development/onecompliance/dynamo-tables/views'  # Sostituisci con il percorso della tua directory
log_file_path = '/home/gcrozzolin/Development/onecompliance/python/file_new_translate.txt'  # Sostituisci con il percorso del file di log
process_json_files(directory_path, log_file_path)
