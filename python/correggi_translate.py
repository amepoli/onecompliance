import os
import re
import json
import shutil

def clean_string(s):
    label_clean = re.sub(r'[^a-zA-Z0-9_]', '', s.lower().replace(" ", "_"))
    label_numbers = re.findall(r'^[0-9]+', label_clean)
    label_clean = re.sub(r'^[0-9]+', '', label_clean)
    if label_numbers:
        label_clean += '_' + '_'.join(label_numbers)
    return label_clean

def generate_new_label(data, root_entry_key, current_path, full_json):
    label = data.get('label', data.get('message', ''))
    entry_key = data.get('entryKey', root_entry_key)
    
    if label.startswith("$P{") and label.endswith("}"):
        sottochiave = label[3:-1]
        define_section = full_json.get('define', {})
        
        if sottochiave in define_section:
            label = define_section[sottochiave]
            label = clean_string(label)
        else:
            print(f"Attenzione: sottochiave '{sottochiave}' non trovata nella sezione 'define'.")
    else:
        label = clean_string(label)
    
    clean_entry_key = clean_string(entry_key)
    new_label = f"RESOURCES.{label}_{clean_entry_key}"
    
    return new_label[:500]

def key_exists_in_file(file_path, key):
    """Controlla se una chiave esiste già nel file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        return f'{key}:' in content

def process_json(data, old_new_labels, root_entry_key, current_path, full_json, it_ts_path):
    modified = False
    if 'translate' in data:
        old_label = data['translate']
        if old_label != "RESOURCES.void":
            new_label = generate_new_label(data, root_entry_key, current_path, full_json)
            # Controlla se la nuova etichetta esiste già nel file it.ts
            if not key_exists_in_file(it_ts_path, new_label):
                if old_label != new_label:
                    old_new_labels.append((old_label, new_label))
                    data['translate'] = new_label
                    modified = True
            else:
                print(f"Chiave {new_label} esiste già, nessuna modifica applicata.")
    for key, value in data.items():
        if isinstance(value, dict):
            sub_modified, data[key] = process_json(value, old_new_labels, root_entry_key, current_path, full_json, it_ts_path)
            modified = modified or sub_modified
        elif isinstance(value, list):
            for i, item in enumerate(value):
                if isinstance(item, dict):
                    sub_modified, data[key][i] = process_json(item, old_new_labels, root_entry_key, current_path, full_json, it_ts_path)
                    modified = modified or sub_modified
    return modified, data

def replace_keys(file_new_translate, file_it, output_file):
    # Leggi il file con le nuove traduzioni
    translate_dict = {}
    with open(file_new_translate, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if ' - ' in line:
                old_key, new_key = line.split(' - ')
                translate_dict[old_key.strip()] = new_key.strip()
            else:
                print(f"Formato non valido nella linea: {line}")

    # Leggi il contenuto del file it.txt
    with open(file_it, 'r', encoding='utf-8') as f:
        file_it_content = f.read()

    # Trova la sezione RESOURCES
    resources_content = extract_resources_section(file_it_content)

    if resources_content:
        # Mantieni intatta la formattazione durante la sostituzione
        updated_lines = []
        for line in resources_content.splitlines():
            original_line = line
            for old_key, new_key in translate_dict.items():
                if f'{old_key}:' in line:
                    # Sostituisci solo la chiave, mantenendo intatti gli spazi e altri caratteri
                    if not key_exists_in_file(file_it, new_key):
                        line = re.sub(rf'\b{re.escape(old_key)}\b', new_key, line)
                    else:
                        print(f"Chiave {new_key} esiste già, nessuna modifica applicata.")
            updated_lines.append(line)

        # Assicurati di mantenere l'ultimo ritorno a capo senza aggiungere una graffa di chiusura
        new_resources_content = "\n".join(updated_lines)
        new_file_it_content = file_it_content.replace(resources_content, new_resources_content)

        # Scrivi il contenuto aggiornato nel file di output
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(new_file_it_content)

        print(f"Numero di voci aggiornate: {len(translate_dict)}")
    else:
        print("Il paragrafo RESOURCES non è stato trovato nel file.")

def extract_resources_section(file_content):
    start_pattern = re.compile(r'RESOURCES:\s*\{')
    start_match = start_pattern.search(file_content)
    if start_match:
        start_index = start_match.end()
        nested_level = 1
        end_index = start_index
        while end_index < len(file_content) and nested_level > 0:
            if file_content[end_index] == '{':
                nested_level += 1
            elif file_content[end_index] == '}':
                nested_level -= 1
            end_index += 1
        # Include anche la chiusura '}' e l'eventuale spazio bianco dopo
        return file_content[start_index:end_index].rstrip()
    return None

def remove_duplicates_and_sort_resources(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        file_content = file.read()
    
    resources_content = extract_resources_section(file_content)
    
    if resources_content:
        lines = resources_content.splitlines()
        
        seen = set()
        unique_lines = []
        for line in lines:
            if line.strip() not in seen:
                seen.add(line.strip())
                unique_lines.append(line)
        
        unique_lines.sort()
        
        new_resources_content = "\n".join(unique_lines)
        new_file_content = file_content.replace(extract_resources_section(file_content), new_resources_content)

        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(new_file_content)
    else:
        print("Il paragrafo RESOURCES non è stato trovato nel file.")

def process_files(views_path, it_ts_path, file_it_path, file_new_translate_path):
    with open(it_ts_path, 'r', encoding='utf-8') as it_ts_file:
        it_ts_content = it_ts_file.read()
    with open(file_it_path, 'w', encoding='utf-8') as file_it:
        file_it.write(it_ts_content)
    
    translate_modified = 0

    old_new_labels = []
    for root, _, files in os.walk(views_path):
        for file in files:
            if file.endswith('.json'):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as json_file:
                    data = json.load(json_file)
                    full_json = data
            
                entry_key = data.get('entryKey', '')
                modified = False
                if isinstance(data, dict):
                    modified, data = process_json(data, old_new_labels, entry_key, root, full_json, it_ts_path)
                
                if modified:
                    with open(file_path, 'w', encoding='utf-8') as json_file:
                        json.dump(data, json_file, indent=4, ensure_ascii=False)
    
    with open(file_new_translate_path, 'w', encoding='utf-8') as file_new_translate:
        for old_label, new_label in old_new_labels:
            old_label_clean = old_label.replace("RESOURCES.", "")
            new_label_clean = new_label.replace("RESOURCES.", "")
            file_new_translate.write(f"{old_label_clean} - {new_label_clean}\n")
            translate_modified += 1

    replace_keys(file_new_translate_path, file_it_path, file_it_path)
    
    remove_duplicates_and_sort_resources(file_it_path)
    
    with open(file_it_path, 'r', encoding='utf-8') as file_it:
        file_it_content = file_it.read()
    with open(it_ts_path, 'w', encoding='utf-8') as it_ts_file:
        it_ts_file.write(file_it_content)
    
    print(f"Proprietà \"translate\" modificate: {translate_modified}")

if __name__ == "__main__":
    # Usa la directory home dell'utente per costruire percorsi file
    home_dir = os.path.expanduser('~')

    # Definisci i percorsi relativi alla directory home
    views_path = os.path.join(home_dir, 'Development/onecompliance/dynamo-tables/views')
    it_ts_path = os.path.join(home_dir, 'Development/onecompliance/src/app/oc/i18n/it.ts')
    file_it_path = os.path.join(home_dir, 'Development/onecompliance/python/file_it.txt')
    file_new_translate_path = os.path.join(home_dir, 'Development/onecompliance/python/file_new_translate.txt')

    # Avvia il processo dei file
    process_files(views_path, it_ts_path, file_it_path, file_new_translate_path)
