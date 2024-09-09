import os
import json
import re
import shutil

def copy_ts_to_txt(ts_file, txt_file):
    shutil.copyfile(ts_file, txt_file)

def load_key_value_pairs(txt_file):
    key_value_pairs = {}
    with open(txt_file, 'r', encoding='utf-8') as file:
        for line in file:
            if ':' in line:
                key, value = line.split(':', 1)
                key_value_pairs[key.strip()] = value.strip()
    return key_value_pairs

def clean_json_files(directory, key_value_pairs):
    total_keys_removed = 0

    for filename in os.listdir(directory):
        if filename.endswith(".json"):
            filepath = os.path.join(directory, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as file:
                    data = json.load(file)

                def remove_invalid_translations(obj):
                    removed_keys = 0
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
                            removed_keys += 1
                            obj.pop(key)
                        for key, value in obj.items():
                            removed_keys += remove_invalid_translations(value)
                    elif isinstance(obj, list):
                        for item in obj:
                            removed_keys += remove_invalid_translations(item)
                    return removed_keys

                removed_keys = remove_invalid_translations(data)
                total_keys_removed += removed_keys

                # Salva il JSON modificato nel file
                with open(filepath, 'w', encoding='utf-8') as file:
                    json.dump(data, file, ensure_ascii=False, indent=4)

            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                print(f"Error processing file {filename}: {e}")

    if total_keys_removed > 0:
        print(f"Total keys removed: {total_keys_removed}")
    else:
        print("No phantom translation removed")

# Usa la directory home dell'utente per costruire percorsi file
home_dir = os.path.expanduser('~')

# Definisci i percorsi relativi alla directory home
directory_path = os.path.join(home_dir, 'Development/onecompliance/dynamo-tables/views')
ts_file_path = os.path.join(home_dir, 'Development/onecompliance/src/app/oc/i18n/it.ts')
key_value_file_path = os.path.join(home_dir, 'Development/onecompliance/python/file_it.txt')

# Copia il contenuto di it.ts in file_it.txt
copy_ts_to_txt(ts_file_path, key_value_file_path)

# Carica le coppie chiave-valore
key_value_pairs = load_key_value_pairs(key_value_file_path)

# Pulisce i file JSON nella directory
clean_json_files(directory_path, key_value_pairs)
