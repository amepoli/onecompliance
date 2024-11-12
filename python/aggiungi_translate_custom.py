import os
import re

def process_ts_files(directory, log_file):
    added_keys = set()
    added_count = 0
    modified_count = 0
    removed_count = 0

    def format_label(file_name, label):
        file_name_clean = re.sub(r'[^a-zA-Z0-9_]', '_', file_name.lower())
        label_clean = re.sub(r'[^a-zA-Z0-9_]', '', label.lower().replace(" ", "_"))
        return f'{file_name_clean}_{label_clean}'

    def add_translate_to_file(filepath):
        nonlocal added_count, modified_count, removed_count
        modified = False
        file_name = os.path.basename(filepath).replace('.component.ts', '')

        with open(filepath, 'r+', encoding='utf-8') as file:
            content = file.readlines()
            new_content = []
            i = 0

            while i < len(content):
                line = content[i]
                label_match = re.match(r'(\s*)label:\s*"(.*?)"\s*,', line)
                translate_match = re.match(r'\s*translate:\s*"(.*?)"\s*,', line)

                if label_match:
                    indent = label_match.group(1)
                    label_value = label_match.group(2).strip()

                    if label_value in {"", " ", "void"}:
                        translate_key = "void"
                    else:
                        translate_key = format_label(file_name, label_value)
                    
                    translate_line = f'{indent}translate: "RESOURCES.{translate_key}",\n'
                    new_content.append(line)

                    if i + 1 < len(content) and re.match(r'\s*translate:\s*"(.*?)"\s*,', content[i + 1]):
                        existing_translate = re.match(r'\s*translate:\s*"(.*?)"\s*,', content[i + 1])
                        if existing_translate.group(1) != f"RESOURCES.{translate_key}":
                            new_content.append(translate_line)
                            modified_count += 1
                            modified = True
                        else:
                            new_content.append(content[i + 1])
                        i += 1
                    else:
                        new_content.append(translate_line)
                        added_keys.add(f'{translate_key}: "{label_value}"')
                        added_count += 1
                        modified = True

                elif translate_match:
                    removed_count += 1
                    modified = True

                else:
                    new_content.append(line)

                i += 1

            if modified:
                file.seek(0)
                file.writelines(new_content)
                file.truncate()

    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.component.ts'):
                filepath = os.path.join(root, file)
                add_translate_to_file(filepath)

    with open(log_file, 'w', encoding='utf-8') as log:
        for key in sorted(added_keys):
            log.write(f'{key},\n')

    print("Proprietà 'translate' aggiunte:", added_count)
    print("Proprietà 'translate' modificate:", modified_count)
    print("Proprietà 'translate' rimosse:", removed_count)

def extract_resources_section(file_content):
    resources_start = file_content.find("RESOURCES:")
    if resources_start == -1:
        return None

    content = file_content[resources_start:]
    stack = []
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
    
    return "RESOURCES:" + resources_content if stack == [] else None

def detect_indentation(resources_content):
    match = re.search(r'\n(\s+)\w+:', resources_content)
    return match.group(1) if match else ' ' * 12

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
            updated_lines.append(f'{indentation}{stripped_line},')
        else:
            updated_lines.append(line)
    
    return '\n'.join(updated_lines)

def update_resources_section(resources_content, new_translations, indentation):
    existing_keys = set(re.findall(r'(\w+):\s*".+?"', resources_content))

    new_entries = []
    for line in new_translations:
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip()

            # Aggiungi la nuova coppia solo se la chiave non esiste già
            if key not in existing_keys:
                new_entries.append(f'{indentation}{key}: {value}')

    if new_entries:
        # Assicura che ogni coppia chiave-valore esistente termini con una virgola
        resources_content = ensure_trailing_commas(resources_content.rstrip().rstrip('}'), indentation)
        
        # Aggiungi le nuove coppie chiave-valore e chiudi la sezione
        resources_content = resources_content.rstrip()
        if not resources_content.endswith('\n'):
            resources_content += '\n'
        resources_content += '\n'.join(new_entries) + '\n}'
        
        # Riordina alfabeticamente tutte le chiavi nella sezione RESOURCES
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
            resource_entries.append(line.strip())

    resource_entries.sort(key=lambda x: x.split(':', 1)[0].strip())
    resource_entries = [f'{indentation}{line}' for line in resource_entries]
    result.extend(resource_entries)
    result.append('}')

    return '\n'.join(result)

def main():
    home_dir = os.path.expanduser('~')
    
    directory_path = os.path.join(home_dir, 'Development/onecompliance/src/app/oc/custom-components')
    log_file_path = os.path.join(home_dir, 'Development/onecompliance/python/file_new_translate.txt')
    ts_file = os.path.join(home_dir, 'Development/onecompliance/src/app/oc/i18n/it.ts')
    file_it_path = os.path.join(home_dir, 'Development/onecompliance/python/file_it.txt')

    # Passo 1: Copia it.ts su file_it.txt
    with open(ts_file, 'r', encoding='utf-8') as f:
        ts_content = f.read()

    with open(file_it_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)

    # Passo 2: Aggiunge le traduzioni ai file .component.ts e crea il log delle nuove chiavi
    process_ts_files(directory_path, log_file_path)

    # Passo 3: Aggiunge le nuove traduzioni da file_new_translate a file_it.txt
    with open(file_it_path, 'r+', encoding='utf-8') as f:
        file_it_content = f.read()

        # Estrai la sezione RESOURCES
        resources_content = extract_resources_section(file_it_content)
        if not resources_content:
            print("Errore: non è stata trovata la sezione RESOURCES.")
            return

        # Determina l'indentazione per il formato
        indentation = detect_indentation(resources_content)

        # Leggi le nuove traduzioni da file_new_translate
        with open(log_file_path, 'r', encoding='utf-8') as ft:
            new_translations = [line.replace("RESOURCES.", "").strip(",\n") for line in ft.readlines()]

        # Aggiorna la sezione RESOURCES aggiungendo solo le chiavi mancanti in ordine alfabetico
        updated_resources_content, added_count = update_resources_section(resources_content, new_translations, indentation)

        if updated_resources_content != resources_content:
            # Sostituisci la sezione RESOURCES aggiornata in file_it_content
            updated_content = file_it_content.replace(resources_content, updated_resources_content)
            f.seek(0)
            f.write(updated_content)
            f.truncate()

    # Passo 4: Copia file_it.txt su it.ts
    with open(file_it_path, 'r', encoding='utf-8') as f:
        final_content = f.read()

    with open(ts_file, 'w', encoding='utf-8') as ft:
        ft.write(final_content)

    print(f"Aggiornamento completato con successo. Numero di traduzioni aggiunte: {added_count}")

if __name__ == "__main__":
    main()
