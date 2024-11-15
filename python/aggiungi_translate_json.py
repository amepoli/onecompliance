import os
import json
import re

def process_json_file(file_path, log_file):
    added_keys = set()  # Utilizzare un set per evitare duplicati nel log
    counter = 0  # Contatore per il numero di etichette "translate" create

    def format_label(label, entry_key):
        label_clean = re.sub(r'[^a-zA-Z0-9_]', '', label.lower().replace(" ", "_"))
        entry_key_clean = re.sub(r'[^a-zA-Z0-9_]', '', entry_key.lower().replace(" ", "_"))

        label_numbers = re.findall(r'^[0-9]+', label_clean)
        entry_key_numbers = re.findall(r'^[0-9]+', entry_key_clean)

        label_clean = re.sub(r'^[0-9]+', '', label_clean)
        entry_key_clean = re.sub(r'^[0-9]+', '', entry_key_clean)

        if label_numbers:
            label_clean += '_' + '_'.join(label_numbers)
        if entry_key_numbers:
            entry_key_clean += '_' + '_'.join(entry_key_numbers)

        return f'{label_clean}_{entry_key_clean}'

    def correct_translation_key(translation_key):
        match = re.match(r'^(.*?):\s*"(.*)"\s*,$', translation_key)
        if match:
            key, value = match.groups()
            corrected_key = f'{key.strip()}: "{value.strip()}",'
            return corrected_key
        else:
            return translation_key

    def get_define_translation(label, define_section):
        pattern = r'\$P\{(.*?)\}'
        match = re.match(pattern, label)
        if match:
            sub_key = match.group(1)
            if define_section and sub_key in define_section:
                return define_section[sub_key]
        return label

    def add_translate_keys(obj, define_section, entry_key=None, path='', in_sub_tables=False, parent_entry_key=None):
        nonlocal counter
        nonlocal modified

        if isinstance(obj, dict):
            if obj.get('icon') == 'more_vert':
                pass
            else:
                current_entry_key = parent_entry_key if in_sub_tables else entry_key or obj.get('entryKey')

                if 'label' in obj and 'translate' not in obj and isinstance(obj['label'], str):
                    base_label = obj['label']
                    if base_label.startswith('$P{'):
                        base_label = get_define_translation(base_label, define_section)

                    if base_label.strip().lower() not in ["", " ", "void"]:
                        formatted_label = format_label(base_label, current_entry_key)
                    else:
                        formatted_label = None

                elif 'message' in obj and 'translate' not in obj and isinstance(obj['message'], str):
                    base_label = obj['message']
                    if base_label.startswith('$P{'):
                        base_label = get_define_translation(base_label, define_section)

                    if base_label.strip().lower() not in ["", " ", "void"]:
                        formatted_label = format_label(base_label, current_entry_key)
                    else:
                        formatted_label = None

                else:
                    formatted_label = None

                if formatted_label is not None:
                    translate_key = f"RESOURCES.{formatted_label}"
                    obj['translate'] = translate_key
                    translation_pair = f'{formatted_label}: "{base_label}",'
                    translation_pair = correct_translation_key(translation_pair)
                    if translation_pair not in added_keys:
                        added_keys.add(translation_pair)
                    modified = True
                    counter += 1

                for key, value in obj.items():
                    new_path = f"{path}.{key}" if path else key
                    add_translate_keys(value, define_section, entry_key if not in_sub_tables else obj.get('entryKey'), new_path, in_sub_tables, parent_entry_key=current_entry_key if in_sub_tables else None)

        elif isinstance(obj, list):
            for idx, item in enumerate(obj):
                new_path = f"{path}[{idx}]"
                add_translate_keys(item, define_section, entry_key, new_path, in_sub_tables, parent_entry_key)

    def add_translate_keys_subtables(obj, define_section, parent_entry_key):
        nonlocal counter
        nonlocal modified

        if isinstance(obj, dict):
            current_entry_key = obj.get('entryKey', parent_entry_key)

            if 'label' in obj and 'translate' not in obj and isinstance(obj['label'], str):
                base_label = obj['label']
                if base_label.startswith('$P{'):
                    base_label = get_define_translation(base_label, define_section)

                if base_label.strip().lower() not in ["", " ", "void"]:
                    formatted_label = format_label(base_label, current_entry_key)
                else:
                    formatted_label = None

            elif 'message' in obj and 'translate' not in obj and isinstance(obj['message'], str):
                base_label = obj['message']
                if base_label.startswith('$P{'):
                    base_label = get_define_translation(base_label, define_section)

                if base_label.strip().lower() not in ["", " ", "void"]:
                    formatted_label = format_label(base_label, current_entry_key)
                else:
                    formatted_label = None

            else:
                formatted_label = None

            if formatted_label is not None:
                translate_key = f"RESOURCES.{formatted_label}"
                obj['translate'] = translate_key
                translation_pair = f'{formatted_label}: "{base_label}",'
                translation_pair = correct_translation_key(translation_pair)
                if translation_pair not in added_keys:
                    added_keys.add(translation_pair)
                modified = True
                counter += 1

            for key, value in obj.items():
                add_translate_keys_subtables(value, define_section, current_entry_key)

        elif isinstance(obj, list):
            for item in obj:
                add_translate_keys_subtables(item, define_section, parent_entry_key)

    with open(log_file, 'w', encoding='utf-8') as log:
        log.write('')

    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)

        modified = False
        define_section = data.get('define', {})

        if "search_keys" in data:
            add_translate_keys(data["search_keys"], define_section, data.get('entryKey'))
        if "table_keys" in data:
            add_translate_keys(data["table_keys"], define_section, data.get('entryKey'))
        if "form_keys" in data:
            add_translate_keys(data["form_keys"], define_section, data.get('entryKey'))
        if "subTables" in data:
            for sub_table in data["subTables"]:
                add_translate_keys_subtables(sub_table, define_section, sub_table.get('entryKey'))

        if modified:
            with open(file_path, 'w', encoding='utf-8') as file:
                json.dump(data, file, ensure_ascii=False, indent=4)

    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        print(f"Errore durante l'elaborazione del file {file_path}: {e}")

    with open(log_file, 'a', encoding='utf-8') as log:
        for key in sorted(added_keys):
            corrected_key = correct_translation_key(key)
            log.write(f"{corrected_key}\n")

    print("Traduzioni aggiunte: " + str(counter))

def main():
    home_dir = os.path.expanduser('~')
    json_file = '/home/gcrozzolin/Development/onecompliance/dynamo-tables/views/profilazione_aml.json'  # Specifica il tuo file JSON
    log_file_path = os.path.join(home_dir, 'Development/onecompliance/python/file_new_translate.txt')

    process_json_file(json_file, log_file_path)
    
    # Resto del codice per aggiornare il file it.txt con nuove traduzioni...

if __name__ == "__main__":
    main()
