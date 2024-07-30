import os
import json
import re

def process_json_files(directory, log_file):
    # Lista per raccogliere le chiavi aggiunte
    added_keys = []
    # Contatore per debugging
    counter = 0

    def format_label(label):
        label_clean = re.sub(r'[^a-zA-Z0-9_]', '', label.lower().replace(" ", "_"))
        formatted_label = re.sub(r'^[^a-zA-Z]+', '', label_clean)
        
        # Check if there are special characters or initial numbers
        has_special = bool(re.search(r'[^a-zA-Z0-9_]', label))
        starts_with_number = bool(re.match(r'^[0-9]', label))
        
        if has_special:
            formatted_label += "_sc"
        if starts_with_number:
            formatted_label += "_num"
        
        return formatted_label

    def to_title_case(label):
        if label == "void":
            return "Void"
        return " ".join(word.capitalize() for word in label.split("_"))

    def add_translate_keys(obj, key_prefix, path=''):
        nonlocal counter
        nonlocal modified
        if isinstance(obj, dict):
            if obj.get('icon') == 'more_vert':
                pass  # Ignora gli oggetti con "icon": "more_vert"
            else:
                if 'label' in obj and 'translate' not in obj and isinstance(obj['label'], str):
                    formatted_label = format_label(obj['label'])
                    if formatted_label:
                        translate_key = f"RESOURCES.{key_prefix}{formatted_label}"
                        obj['translate'] = translate_key
                        added_keys.append(f'{key_prefix}{formatted_label}: "{obj["label"]}",')
                        modified = True
                        counter += 1
                if 'message' in obj and 'translate' not in obj and isinstance(obj['message'], str):
                    formatted_label = format_label(obj['message'])
                    if formatted_label:
                        translate_key = f"RESOURCES.{key_prefix}{formatted_label}"
                        obj['translate'] = translate_key
                        added_keys.append(f'{key_prefix}{formatted_label}: "{obj["message"]}",')
                        modified = True
                        counter += 1
                if 'labelAdd' in obj and 'translateAdd' not in obj and isinstance(obj['labelAdd'], str):
                    formatted_label = format_label(obj['labelAdd'])
                    if formatted_label:
                        translate_key = f"RESOURCES.{key_prefix}{formatted_label}"
                        obj['translateAdd'] = translate_key
                        added_keys.append(f'{key_prefix}{formatted_label}: "{obj["labelAdd"]}",')
                        modified = True
                        counter += 1
                if 'labelQuickAdd' in obj and 'translateQuickAdd' not in obj and isinstance(obj['labelQuickAdd'], str):
                    formatted_label = format_label(obj['labelQuickAdd'])
                    if formatted_label:
                        translate_key = f"RESOURCES.{key_prefix}{formatted_label}"
                        obj['translateQuickAdd'] = translate_key
                        added_keys.append(f'{key_prefix}{formatted_label}: "{obj["labelQuickAdd"]}",')
                        modified = True
                        counter += 1

            for key, value in obj.items():
                new_path = f"{path}.{key}" if path else key
                add_translate_keys(value, key_prefix, new_path)

        elif isinstance(obj, list):
            for idx, item in enumerate(obj):
                new_path = f"{path}[{idx}]"
                add_translate_keys(item, key_prefix, new_path)

    for filename in os.listdir(directory):
        if filename.endswith(".json"):
            filepath = os.path.join(directory, filename)

            try:
                with open(filepath, 'r', encoding='utf-8') as file:
                    data = json.load(file)

                modified = False

                if "search_keys" in data:
                    add_translate_keys(data["search_keys"], "src_")
                if "table_keys" in data:
                    add_translate_keys(data["table_keys"], "tbl_")
                if "form_keys" in data:
                    add_translate_keys(data["form_keys"], "frm_")
                if "subTables" in data:
                    add_translate_keys(data["subTables"], "sbt_")

                if modified:
                    with open(filepath, 'w', encoding='utf-8') as file:
                        json.dump(data, file, ensure_ascii=False, indent=4)
                    print(f"Modified and saved file: {filename}")

            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                print(f"Error processing file {filename}: {e}")

    with open(log_file, 'w', encoding='utf-8') as log:
        for key in sorted(added_keys):
            formatted_key = key.lower().split(':')[0]
            value = key.split(':')[1]
            log.write(f"{formatted_key}: {value}\n")

    print("Translation aggiunte: " + str(counter))

# Esempio di utilizzo
directory_path = '/home/gcrozzolin/Development/onecompliance/dynamo-tables/views'  # Sostituisci con il percorso della tua directory
log_file_path = '/home/gcrozzolin/Development/onecompliance/python/file_new_translate.txt'  # Sostituisci con il percorso del file di log
process_json_files(directory_path, log_file_path)
