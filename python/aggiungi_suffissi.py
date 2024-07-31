import os
import json
import re
import shutil

def copy_file(src, dst):
    shutil.copyfile(src, dst)

def sanitize_label(label):
    # Rimuove caratteri speciali e aggiunge suffisso _sc se necessario
    sanitized_label = re.sub(r'[^\w\s]', '', label)
    if len(sanitized_label) < len(label):
        sanitized_label += "_sc"
    # Rimuove spazi aggiuntivi e sostituisce con _
    sanitized_label = re.sub(r'\s+', '_', sanitized_label).strip('_')
    return sanitized_label

def create_translate_key(key, label):
    sanitized_label = sanitize_label(label)
    new_key = f"{key}___{sanitized_label}"
    # Limite di 500 caratteri
    if len(new_key) > 500:
        new_key = new_key[:500]
    # Rimuovi eventuali numeri iniziali
    if new_key[0].isdigit():
        new_key = "_" + new_key
    return new_key

def update_translate_keys(obj, key_map):
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key == 'translate' and isinstance(value, str) and '.' in value:
                original_key = value.split('.', 1)[1]
                label = obj.get('label', '')
                new_key = create_translate_key(original_key, label)
                key_map[original_key] = new_key
                obj[key] = f"RESOURCES.{new_key}"
            else:
                update_translate_keys(value, key_map)
    elif isinstance(obj, list):
        for item in obj:
            update_translate_keys(item, key_map)

def update_keys_in_json(directory, key_map):
    for filename in os.listdir(directory):
        if filename.endswith(".json"):
            filepath = os.path.join(directory, filename)
            with open(filepath, 'r', encoding='utf-8') as file:
                data = json.load(file)

            update_translate_keys(data, key_map)

            with open(filepath, 'w', encoding='utf-8') as file:
                json.dump(data, file, ensure_ascii=False, indent=4)

def update_keys_in_file(txt_file, key_map):
    with open(txt_file, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    updated_lines = []
    for line in lines:
        match = re.match(r'(\w+):\s*"([^"]*)",?', line.strip())
        if match:
            key = match.group(1).strip()
            value = match.group(2).strip()
            if key in key_map:
                new_key = key_map[key]
                updated_lines.append(f'{new_key}: "{value}",\n')
            else:
                updated_lines.append(line)
        else:
            updated_lines.append(line)

    with open(txt_file, 'w', encoding='utf-8') as file:
        file.writelines(updated_lines)

def main(views_path, ts_file_path, temp_file_path):
    
    copy_file(ts_file_path, temp_file_path)
    
    
    key_map = {}
    update_keys_in_json(views_path, key_map)
    
    
    update_keys_in_file(temp_file_path, key_map)
    
   
    total_count = len(key_map)
    print(f"Total keys modified: {total_count}")


views_path = '/home/gcrozzolin/Development/onecompliance/dynamo-tables/views'  # !! Sostituisci con il percorso della cartella views
ts_file_path = '/home/gcrozzolin/Development/onecompliance/src/app/oc/i18n/it.ts'  # !! Sostituisci con il percorso del file it.ts
temp_file_path = '/home/gcrozzolin/Development/onecompliance/python/file_it.txt'  # !! Sostituisci con il percorso del file file_it.txt

main(views_path, ts_file_path, temp_file_path)
