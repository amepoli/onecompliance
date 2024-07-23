import json
import re

def load_json_from_ts(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            match = re.search(r'RESOURCES:\s*(\{.*?\})', content, re.DOTALL)
            if match:
                json_str = match.group(1)
                # Converti le chiavi non quotate in chiavi quotate
                json_str = re.sub(r'(\w+):', r'"\1":', json_str)
                return json.loads(json_str), content
            else:
                print(f"Could not find RESOURCES in file {file_path}")
                return {}, content
    except (json.JSONDecodeError, UnicodeDecodeError, AttributeError) as e:
        print(f"Error loading file {file_path}: {e}")
        return {}, ""

def save_json_to_ts(file_path, data, original_content):
    try:
        json_str = json.dumps(data, ensure_ascii=False, indent=4)
        # Converti le chiavi quotate in chiavi non quotate per mantenere il formato TypeScript
        json_str = re.sub(r'"(\w+)":', r'\1:', json_str)
        new_content = re.sub(r'RESOURCES:\s*\{.*?\}', f'RESOURCES: {json_str}', original_content, flags=re.DOTALL)
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(new_content)
    except IOError as e:
        print(f"Error saving file {file_path}: {e}")

def load_new_keys(file_path):
    new_keys = {}
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            for line in file:
                match = re.match(r'(\w+)\s*:\s*"(.*)"\s*,?', line.strip())
                if match:
                    key, value = match.groups()
                    new_keys[key] = value
    except IOError as e:
        print(f"Error loading file {file_path}: {e}")
    return new_keys

def merge_translation_keys(existing_file, new_keys_file):
    # Carica il file TypeScript esistente e le nuove chiavi dal file di testo
    existing_data, original_content = load_json_from_ts(existing_file)
    new_keys = load_new_keys(new_keys_file)

    # Ottieni le chiavi esistenti e nuove sotto RESOURCES
    existing_keys = existing_data
    
    # Aggiungi le nuove chiavi se non esistono già
    for key, value in new_keys.items():
        if key not in existing_keys:
            existing_keys[key] = value

    # Ordina le chiavi alfabeticamente
    sorted_keys = dict(sorted(existing_keys.items()))

    # Aggiorna i dati esistenti con le chiavi ordinate
    existing_data = sorted_keys

    # Salva il file TypeScript esistente con le nuove chiavi
    save_json_to_ts(existing_file, {"RESOURCES": existing_data}, original_content)

# Esempio di utilizzo
existing_file_path = '/home/alpoli/Developement/onecompliance/src/app/oc/i18n/it.ts'  # Sostituisci con il percorso del file esistente
new_keys_file_path = '/home/alpoli/Developement/onecompliance/python/file_new_translate.txt'  # Sostituisci con il percorso del file con le nuove chiavi

merge_translation_keys(existing_file_path, new_keys_file_path)