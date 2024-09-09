import re
import os

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
    return ' ' * 12  # Default to 12 spaces if not found

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
            # Ensure trailing comma on lines with key-value pairs
            updated_lines.append(f'{indentation}{stripped_line},')
        else:
            updated_lines.append(line)
    
    return '\n'.join(updated_lines)

def update_resources_section(resources_content, new_translations, indentation):
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
    ts_file = os.path.join(home_dir, 'Development/onecompliance/src/app/oc/i18n/it.ts')
    file_it_path = os.path.join(home_dir, 'Development/onecompliance/python/file_it.txt')
    new_translate_file = os.path.join(home_dir, 'Development/onecompliance/python/file_new_translate.txt')  # Percorso del file temporaneo

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
        with open(new_translate_file, 'r', encoding='utf-8') as ft:
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
