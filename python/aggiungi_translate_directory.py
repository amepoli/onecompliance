import os
import json
import re

def process_json_files(directory, log_file):
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
            entry_key_clean += '_' + '_join(entry_key_numbers)'

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

                    if base_label.strip().lower() in ["", " ", "void"]:
                        formatted_label = "void"
                    else:
                        formatted_label = format_label(base_label, current_entry_key)

                elif 'message' in obj and 'translate' not in obj and isinstance(obj['message'], str):
                    base_label = obj['message']
                    if base_label.startswith('$P{'):
                        base_label = get_define_translation(base_label, define_section)

                    if base_label.strip().lower() in ["", " ", "void"]:
                        formatted_label = "void"
                    else:
                        formatted_label = format_label(base_label, current_entry_key)

                else:
                    formatted_label = None

                if formatted_label is not None:
                    translate_key = f"RESOURCES.{formatted_label}"
                    obj['translate'] = translate_key
                    translation_pair = f'{formatted_label}: "{base_label if formatted_label != "void" else ""}",'
                    translation_pair = correct_translation_key(translation_pair)
                    if translation_pair not in added_keys:
                        added_keys.add(translation_pair)
                    modified = True  # Assicurarsi che modified sia impostato su True quando si aggiunge una nuova chiave di traduzione
                    counter += 1  # Incrementa il contatore per ogni "translate" aggiunto

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

                if base_label.strip().lower() in ["", " ", "void"]:
                    formatted_label = "void"
                else:
                    formatted_label = format_label(base_label, current_entry_key)

            elif 'message' in obj and 'translate' not in obj and isinstance(obj['message'], str):
                base_label = obj['message']
                if base_label.startswith('$P{'):
                    base_label = get_define_translation(base_label, define_section)

                if base_label.strip().lower() in ["", " ", "void"]:
                    formatted_label = "void"
                else:
                    formatted_label = format_label(base_label, current_entry_key)

            else:
                formatted_label = None

            if formatted_label is not None:
                translate_key = f"RESOURCES.{formatted_label}"
                obj['translate'] = translate_key
                translation_pair = f'{formatted_label}: "{base_label if formatted_label != "void" else ""}",'
                translation_pair = correct_translation_key(translation_pair)
                if translation_pair not in added_keys:
                    added_keys.add(translation_pair)
                modified = True  # Assicurarsi che modified sia impostato su True quando si aggiunge una nuova chiave di traduzione
                counter += 1  # Incrementa il contatore per ogni "translate" aggiunto

            for key, value in obj.items():
                add_translate_keys_subtables(value, define_section, current_entry_key)

        elif isinstance(obj, list):
            for item in obj:
                add_translate_keys_subtables(item, define_section, parent_entry_key)

    # Creazione del file di log vuoto
    with open(log_file, 'w', encoding='utf-8') as log:
        log.write('')

    for filename in os.listdir(directory):
        if filename.endswith(".json"):
            filepath = os.path.join(directory, filename)

            try:
                with open(filepath, 'r', encoding='utf-8') as file:
                    data = json.load(file)

                modified = False
                define_section = data.get('define', {})

                # Processa le diverse sezioni del file JSON
                if "search_keys" in data:
                    add_translate_keys(data["search_keys"], define_section, data.get('entryKey'))
                if "table_keys" in data:
                    add_translate_keys(data["table_keys"], define_section, data.get('entryKey'))
                if "form_keys" in data:
                    add_translate_keys(data["form_keys"], define_section, data.get('entryKey'))
                if "subTables" in data:
                    for sub_table in data["subTables"]:
                        add_translate_keys_subtables(sub_table, define_section, sub_table.get('entryKey'))

                # Salva il file JSON solo se è stato modificato
                if modified:
                    with open(filepath, 'w', encoding='utf-8') as file:
                        json.dump(data, file, ensure_ascii=False, indent=4)

            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                print(f"Errore durante l'elaborazione del file {filename}: {e}")
                # Continua l'esecuzione anche in caso di errore

    # Scrivi solo le nuove traduzioni nel file di log
    with open(log_file, 'a', encoding='utf-8') as log:
        for key in sorted(added_keys):
            corrected_key = correct_translation_key(key)
            log.write(f"{corrected_key}\n")

    print("Traduzioni aggiunte: " + str(counter))

def extract_resources_section(file_content):
    stack = []
    resources_start = file_content.find("RESOURCES:")
    if resources_start == -1:
        return None

    content = file_content[resources_start:]
    in_quotes = False
    resources_content = ""
    i = 0

    while i < len(content):
        char = content[i]
        if char == '"' and (i == 0 or content[i - 1] != '\\'):
            in_quotes = not in_quotes
        elif char == '{' and not in_quotes:
            stack.append(char)
        elif char == '}' and not in_quotes:
            if stack:
                stack.pop()
            if not stack:
                resources_content = content[:i + 1]
                break
        i += 1
    
    return resources_content if stack == [] else None

def detect_indentation(resources_content):
    match = re.search(r'\n(\s+)\w+:', resources_content)
    if match:
        return match.group(1)
    return ' ' * 12  # Default a 12 spazi se non trovato

def ensure_trailing_commas(resources_content, indentation):
    lines = resources_content.split('\n')
    updated_lines = []
    inside_resources = False

    for line in lines:
        stripped_line = line.strip()
        if '{' in stripped_line:
            inside_resources = True
        elif '}' in stripped_line:
            inside_resources = False
        
        if inside_resources and ':' in stripped_line and not stripped_line.endswith(',') and re.search(r':\s*".*"$', stripped_line):
            # Assicura una virgola finale sulle linee con coppie chiave-valore
            updated_lines.append(f'{indentation}{stripped_line},')
        else:
            updated_lines.append(line)
    
    return '\n'.join(updated_lines)

def update_resources_section(resources_content, new_translations, indentation):
    # Estrai le chiavi già presenti nella sezione RESOURCES
    existing_keys = set(re.findall(r'(\w+):\s*".+?"', resources_content))

    added_count = 0
    new_entries = []

    for line in new_translations:
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip()

            if key == "void":
                print("Chiave 'void' ignorata.")
                continue

            if key in existing_keys:
                print(f"Chiave '{key}' già presente. Non viene aggiunta.")
            else:
                print(f"Chiave '{key}' non trovata. Viene aggiunta.")
                new_entries.append(f'{indentation}{key}: {value}')
                existing_keys.add(key)  # Aggiungi la nuova chiave al set per evitare duplicati

    if new_entries:
        # Assicurati che tutte le coppie chiave-valore abbiano una virgola finale
        resources_content = ensure_trailing_commas(resources_content.rstrip().rstrip('}'), indentation)
        # Aggiungi le nuove chiavi
        resources_content = resources_content.rstrip()
        if not resources_content.endswith('\n'):
            resources_content += '\n'
        resources_content += '\n'.join(new_entries) + '\n}'
        # Riordina alfabeticamente le chiavi
        resources_content = sort_resources(resources_content, indentation)

    return resources_content, len(new_entries)

def sort_resources(resources_content, indentation):
    lines = resources_content.split('\n')
    inside_resources = False
    resource_entries = []
    result = []

    for line in lines:
        if '{' in line:
            inside_resources = True
            result.append(line)
            continue
        if '}' in line:
            inside_resources = False
            continue

        if inside_resources and ':' in line:
            stripped_line = line.strip()
            if stripped_line:
                resource_entries.append(stripped_line)

    # Ordina le chiavi ignorando la parte dopo il ":"
    resource_entries.sort(key=lambda x: x.split(':', 1)[0].strip())

    # Riaggiungi l'indentazione
    resource_entries = [f'{indentation}{line}' for line in resource_entries]

    # Ricostruisci la sezione RESOURCES mantenendo il formato corretto
    result.append('\n'.join(resource_entries))
    result.append('}')

    return '\n'.join(result)

def main():
    # Usa la directory home dell'utente per costruire percorsi file
    home_dir = os.path.expanduser('~')

    # Definisci i percorsi relativi alla directory home
    directory_path = os.path.join(home_dir, 'Development/onecompliance/dynamo-tables/views')
    log_file_path = os.path.join(home_dir, 'Development/onecompliance/python/file_new_translate.txt')
    ts_file = os.path.join(home_dir, 'Development/onecompliance/src/app/oc/i18n/it.ts')
    file_it_path = os.path.join(home_dir, 'Development/onecompliance/python/file_it.txt')

    # Processo per creare nuove traduzioni dai file JSON
    process_json_files(directory_path, log_file_path)

    # Leggi il contenuto di it.ts
    with open(ts_file, 'r', encoding='utf-8') as f:
        ts_content = f.read()

    # Copia il contenuto di it.ts in file_it.txt
    with open(file_it_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)

    # Ora lavoriamo con file_it.txt
    with open(file_it_path, 'r+', encoding='utf-8') as f:
        file_it_content = f.read()

        # Estrai la sezione RESOURCES da file_it.txt
        resources_content = extract_resources_section(file_it_content)
        if not resources_content:
            print("Errore: non è stata trovata la sezione RESOURCES.")
            return

        # Determina la corretta tabulazione
        indentation = detect_indentation(resources_content)

        # Leggi le nuove traduzioni
        with open(log_file_path, 'r', encoding='utf-8') as ft:
            new_translations = ft.readlines()

        # Aggiorna la sezione RESOURCES con le nuove traduzioni
        updated_resources_content, added_count = update_resources_section(resources_content, new_translations, indentation)

        if updated_resources_content != resources_content:
            # Sostituisci la vecchia sezione RESOURCES con quella aggiornata in file_it.txt
            updated_content = file_it_content.replace(resources_content, updated_resources_content)
            
            # Sovrascrivi il contenuto aggiornato in file_it.txt
            f.seek(0)
            f.write(updated_content)
            f.truncate()

            # Copia il contenuto aggiornato di file_it.txt di nuovo in it.ts
            with open(ts_file, 'w', encoding='utf-8') as ft:
                ft.write(updated_content)
            
            print(f"Numero di traduzioni aggiunte: {added_count}")
        else:
            print("Nessuna traduzione aggiunta.")

if __name__ == "__main__":
    main()
