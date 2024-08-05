import os
import re
import json

def clean_string(s):
    # Remove special characters except underscores and alphanumeric characters
    cleaned = re.sub(r'[^a-zA-Z0-9_]', '', s)
    return cleaned

def adjust_label(label):
    # Check if the label starts with a number
    if re.match(r'^\d', label):
        # Move the leading numbers to the end of the label, separated by an underscore
        match = re.match(r'^(\d+)(.*)', label)
        if match:
            number, rest = match.groups()
            return f"{rest}_{number}"
    return label

def process_files(views_path, it_ts_path, file_it_path, file_new_translate_path):
    # Step 1: Copy content of it.ts to file_it.txt
    with open(it_ts_path, 'r', encoding='utf-8') as it_ts_file:
        it_ts_content = it_ts_file.read()
    with open(file_it_path, 'w', encoding='utf-8') as file_it:
        file_it.write(it_ts_content)
    
    # Initialize counts
    translate_modified = 0

    # Step 2: Process all JSON files in the given path
    old_new_labels = []
    for root, _, files in os.walk(views_path):
        for file in files:
            if file.endswith('.json'):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as json_file:
                    data = json.load(json_file)
                
                entry_key = data.get('entryKey', '')
                modified = False
                if isinstance(data, dict):
                    modified, data = process_json(data, old_new_labels, entry_key, root)
                
                if modified:
                    with open(file_path, 'w', encoding='utf-8') as json_file:
                        json.dump(data, json_file, indent=4, ensure_ascii=False)
    
    # Step 3: Write old and new labels to file_new_translate.txt
    with open(file_new_translate_path, 'w', encoding='utf-8') as file_new_translate:
        for old_label, new_label in old_new_labels:
            old_label_clean = old_label.replace("RESOURCES.", "")
            new_label_clean = new_label.replace("RESOURCES.", "")
            file_new_translate.write(f"{old_label_clean} - {new_label_clean}\n")
            translate_modified += 1

    # Step 4: Replace old labels in file_it.txt
    replace_keys(file_new_translate_path, file_it_path, file_it_path)
    
    # Step 5: Remove duplicate entries and sort RESOURCES in file_it.txt
    remove_duplicates_and_sort_resources(file_it_path)
    
    # Step 6: Copy content of file_it.txt back to it.ts
    with open(file_it_path, 'r', encoding='utf-8') as file_it:
        file_it_content = file_it.read()
    with open(it_ts_path, 'w', encoding='utf-8') as it_ts_file:
        it_ts_file.write(file_it_content)
    
    # Output the number of translates modified
    print(f"Translates modified: {translate_modified}")

def process_json(data, old_new_labels, root_entry_key, current_path):
    modified = False
    if 'translate' in data:
        old_label = data['translate']
        new_label = generate_new_label(data, root_entry_key, current_path)
        if old_label != new_label:
            old_new_labels.append((old_label, new_label))
            data['translate'] = new_label
            modified = True
    for key, value in data.items():
        if isinstance(value, dict):
            sub_modified, data[key] = process_json(value, old_new_labels, root_entry_key, current_path)
            modified = modified or sub_modified
        elif isinstance(value, list):
            for i, item in enumerate(value):
                if isinstance(item, dict):
                    sub_modified, data[key][i] = process_json(item, old_new_labels, root_entry_key, current_path)
                    modified = modified or sub_modified
    return modified, data

def generate_new_label(data, root_entry_key, current_path):
    label = data.get('label', data.get('message', ''))
    entry_key = data.get('entryKey', root_entry_key)
    clean_label = adjust_label(clean_string(label))
    clean_entry_key = clean_string(entry_key)
    new_label = f"RESOURCES.{clean_label}_{clean_entry_key}"
    return new_label[:500]

def replace_keys(file_new_translate, file_it, output_file):
    # Leggi il file delle traduzioni
    with open(file_new_translate, 'r', encoding='utf-8') as f:
        translate_dict = {}
        for line in f:
            line = line.strip()
            if ' - ' in line:
                old_key, new_key = line.split(' - ')
                translate_dict[old_key] = new_key
            else:
                print(f"Formato non valido nella linea: {line}")

    # Leggi il file it.txt
    with open(file_it, 'r', encoding='utf-8') as f:
        file_it_content = f.read()

    # Trova il paragrafo RESOURCES
    resources_pattern = re.compile(r'RESOURCES:\s*\{(.*?)\}', re.DOTALL)
    match = resources_pattern.search(file_it_content)
    if match:
        resources_content = match.group(1)

        # Sostituisci le chiavi vecchie con quelle nuove
        for old_key, new_key in translate_dict.items():
            old_pattern = re.compile(r'({}\s*:)'.format(re.escape(old_key)))
            resources_content = old_pattern.sub('{}:'.format(new_key), resources_content)

        # Ricostruisci il contenuto del file
        new_file_it_content = file_it_content[:match.start(1)] + resources_content + file_it_content[match.end(1):]

        # Salva il nuovo contenuto nel file di output
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(new_file_it_content)
    else:
        print("Il paragrafo RESOURCES non è stato trovato nel file.")

def remove_duplicates_and_sort_resources(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        file_content = file.read()
    
    resources_pattern = re.compile(r'RESOURCES:\s*\{(.*?)\}', re.DOTALL)
    match = resources_pattern.search(file_content)
    
    if match:
        resources_content = match.group(1)
        lines = resources_content.splitlines()
        
        seen = set()
        unique_lines = []
        for line in lines:
            if line.strip() not in seen:
                seen.add(line.strip())
                unique_lines.append(line)
        
        unique_lines.sort()  # Sort lines alphabetically
        
        new_resources_content = "\n".join(unique_lines)
        new_file_content = file_content[:match.start(1)] + new_resources_content + file_content[match.end(1):]

        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(new_file_content)
    else:
        print("Il paragrafo RESOURCES non è stato trovato nel file.")

if __name__ == "__main__":
    views_path = '/home/gcrozzolin/Development/onecompliance/dynamo-tables/views'  # Sostituisci con il percorso della cartella views
    it_ts_path = '/home/gcrozzolin/Development/onecompliance/src/app/oc/i18n/it.ts'  # Sostituisci con il percorso del file it.ts
    file_it_path = '/home/gcrozzolin/Development/onecompliance/python/file_it.txt'  # Sostituisci con il percorso del file file_it.txt
    file_new_translate_path = '/home/gcrozzolin/Development/onecompliance/python/file_new_translate.txt'  # Sostituisci con il percorso del file file_new_translate.txt
    process_files(views_path, it_ts_path, file_it_path, file_new_translate_path)
