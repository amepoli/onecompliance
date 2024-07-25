import os
import json
import re

def load_key_value_pairs(txt_file):
    key_value_pairs = {}
    with open(txt_file, 'r', encoding='utf-8') as file:
        for line in file:
            if ':' in line:
                key, value = line.split(':', 1)
                key_value_pairs[key.strip()] = value.strip()
    return key_value_pairs

def clean_json_files(directory, key_value_pairs):
    any_key_removed = False

    for filename in os.listdir(directory):
        if filename.endswith(".json"):
            filepath = os.path.join(directory, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as file:
                    data = json.load(file)

                def remove_invalid_translations(obj):
                    removed_keys = []
                    if isinstance(obj, dict):
                        keys_to_remove = []
                        for key in ['translate', 'translateAdd', 'translateQuickAdd']:
                            if key in obj and isinstance(obj[key], str):
                                translate_value = obj[key]
                                if translate_value.startswith("RESOURCES."):
                                    key_part = translate_value[len("RESOURCES."):]
                                    if key_part not in key_value_pairs:
                                        keys_to_remove.append(key)
                        for key in keys_to_remove:
                            removed_keys.append(key)
                            obj.pop(key)
                        for key, value in obj.items():
                            removed_keys.extend(remove_invalid_translations(value))
                    elif isinstance(obj, list):
                        for item in obj:
                            removed_keys.extend(remove_invalid_translations(item))
                    return removed_keys

                removed_keys = remove_invalid_translations(data)

                # Salva il JSON modificato nel file
                with open(filepath, 'w', encoding='utf-8') as file:
                    json.dump(data, file, ensure_ascii=False, indent=4)

                # Stampa le chiavi rimosse
                if removed_keys:
                    any_key_removed = True
                    for key in removed_keys:
                        print(f"Removed key '{key}' from file: {filename}")

            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                print(f"Error processing file {filename}: {e}")

    if not any_key_removed:
        print("No phantom key removed")

# Esempio di utilizzo
directory_path = '/home/gcrozzolin/Development/onecompliance/dynamo-tables/views'  # Sostituisci con il percorso della tua directory di file JSON
key_value_file_path = '/home/gcrozzolin/Development/onecompliance/python/it_copy.txt'  # Sostituisci con il percorso del file di coppie chiave-valore

key_value_pairs = load_key_value_pairs(key_value_file_path)
clean_json_files(directory_path, key_value_pairs)
