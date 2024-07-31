import os
import json
import re
import shutil

def copy_file(src, dst):
    shutil.copyfile(src, dst)

def sanitize_label(label):
    # Rimuove i numeri solo se all'inizio della stringa
    sanitized_label = re.sub(r'^[0-9]+', '', label)
    # Rimuove i caratteri speciali
    sanitized_label = re.sub(r'[^\w\s]', '', sanitized_label)
    if len(sanitized_label) < len(label):
        sanitized_label += "_sc"
    # Sostituisce gli spazi con _
    sanitized_label = re.sub(r'\s+', '_', sanitized_label).strip('')
    return sanitized_label

def create_translate_key(label, entry_key):
    sanitized_label = sanitize_label(label)
    sanitized_entry_key = entry_key.lstrip()
    new_key = f"{sanitized_label}_{sanitized_entry_key}"
    if len(new_key) > 500:
        excess_length = len(new_key) - 500
        sanitized_label = sanitized_label[:-excess_length]
        new_key = f"{sanitized_label}_{sanitized_entry_key}"
    return new_key

def update_translate_keys(obj, entry_key=None, translations=None):
    if translations is None:
        translations = {}
    if isinstance(obj, dict):
        if 'subTables' in obj and isinstance(obj['subTables'], list):
            for sub_table in obj['subTables']:
                if 'translate' in sub_table and 'label' in sub_table:
                    sub_entry_key = sub_table.get('entryKey', entry_key)
                    new_key = create_translate_key(sub_table['label'], sub_entry_key)
                    translations[new_key] = sub_table['translate']
                    sub_table['translate'] = f"RESOURCES.{new_key}"
                update_translate_keys(sub_table, sub_table.get('entryKey', entry_key), translations)
        else:
            for key, value in obj.items():
                if key == 'translate' and isinstance(value, str):
                    if 'label' in obj:
                        new_key = create_translate_key(obj['label'], entry_key)
                        translations[new_key] = value
                        obj[key] = f"RESOURCES.{new_key}"
                else:
                    update_translate_keys(value, entry_key, translations)
    elif isinstance(obj, list):
        for item in obj:
            update_translate_keys(item, entry_key, translations)
    return translations

def update_keys_in_json(directory):
    all_translations = {}
    total_modifications = 0
    for filename in os.listdir(directory):
        if filename.endswith(".json"):
            filepath = os.path.join(directory, filename)
            with open(filepath, 'r', encoding='utf-8') as file:
                data = json.load(file)

            entry_key = data.get('entryKey', None)
            translations = update_translate_keys(data, entry_key)

            with open(filepath, 'w', encoding='utf-8') as file:
                json.dump(data, file, ensure_ascii=False, indent=4)

            all_translations.update(translations)
            total_modifications += len(translations)
    return all_translations, total_modifications

def update_translations_in_file(translations, file_path):
    with open(file_path, 'r+', encoding='utf-8') as file:
        content = file.read()
        # Cerca e aggiorna la sezione RESOURCES
        resources_match = re.search(r'RESOURCES\s*:\s*\{[^}]*\}', content, re.DOTALL)
        if resources_match:
            resources_content = resources_match.group(0)
            for key, value in translations.items():
                # Cerca e aggiorna le chiavi esistenti
                old_key_match = re.search(rf'{re.escape(key.split("_")[0])}\s*:\s*".*?"', resources_content)
                if old_key_match:
                    resources_content = resources_content.replace(old_key_match.group(0), f'{key}: "{value}"')
                else:
                    # Aggiungi nuove chiavi
                    resources_content = resources_content[:-1] + f', {key}: "{value}"' + resources_content[-1]
            # Aggiorna il contenuto del file con le nuove traduzioni
            content = content.replace(resources_match.group(0), resources_content)
            file.seek(0)
            file.write(content)
            file.truncate()

def copy_content(src, dst):
    shutil.copyfile(src, dst)

def main(views_path, ts_file_path, temp_file_path):
    copy_file(ts_file_path, temp_file_path)
    translations, total_modifications = update_keys_in_json(views_path)
    update_translations_in_file(translations, temp_file_path)
    copy_content(temp_file_path, ts_file_path)
    print(f"Finished updating JSON files in {views_path} and copied content to {ts_file_path}")
    print(f"Total translations modified: {total_modifications}")

views_path = '/home/gcrozzolin/Development/onecompliance/dynamo-tables/views'  # Sostituisci con il percorso della cartella views
ts_file_path = '/home/gcrozzolin/Development/onecompliance/src/app/oc/i18n/it.ts'  # Sostituisci con il percorso del file it.ts
temp_file_path = '/home/gcrozzolin/Development/onecompliance/python/file_it.txt'  # Sostituisci con il percorso del file file_it.txt

main(views_path, ts_file_path, temp_file_path)
