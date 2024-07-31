import re
import shutil

def copy_ts_to_txt(ts_file_path, txt_file_path):
    # Copia il contenuto del file TypeScript nel file di testo
    shutil.copyfile(ts_file_path, txt_file_path)

def update_first_file_with_missing_keys(file1_path, file2_path):
    # Leggi le chiavi dal primo file di testo
    with open(file1_path, 'r') as file1:
        content1 = file1.read()
        resources_match = re.search(r'RESOURCES:\s*\{(.*?)\}', content1, re.DOTALL)
        
        if resources_match:
            lines1 = resources_match.group(1).strip().splitlines()
            keys1 = {}
            for line in lines1:
                match = re.match(r'\s*(\w+):\s*"([^"]*)",?', line)
                if match:
                    key, value = match.groups()
                    keys1[key] = value
        else:
            keys1 = {}

    # Leggi le chiavi dal secondo file di testo
    with open(file2_path, 'r') as file2:
        keys2 = {}
        for line in file2.read().splitlines():
            match = re.match(r'(\w+):\s*"([^"]*)"', line.strip())
            if match:
                key, value = match.groups()
                keys2[key] = value

    # Trova le chiavi mancanti nel primo file di testo
    missing_keys = {k: v for k, v in keys2.items() if k not in keys1}

    # Unisci le chiavi del primo file con le chiavi mancanti
    updated_keys = keys1.copy()
    for key, value in missing_keys.items():
        updated_keys[key] = value

    # Ordina le chiavi alfabeticamente ignorando gli spazi iniziali
    sorted_keys = sorted(updated_keys.keys(), key=lambda k: k.strip().lower())

    # Costruisci il contenuto aggiornato di RESOURCES
    resources_content = "RESOURCES: {\n"
    for key in sorted_keys:
        value = updated_keys[key]
        resources_content += f'    {key}: "{value}",\n'
    resources_content += "}"

    # Sostituisci il contenuto di RESOURCES nel primo file di testo
    new_content = re.sub(r'RESOURCES:\s*\{(.*?)\}', resources_content, content1, flags=re.DOTALL)

    # Scrivi il nuovo contenuto nel primo file di testo
    with open(file1_path, 'w') as file1:
        file1.write(new_content)

    # Conta e stampa le chiavi aggiunte
    added_keys_count = len(missing_keys)
    if added_keys_count > 0:
        for key in missing_keys.keys():
            print(f"Added key '{key}'")
    print(f"Total translations added: {added_keys_count}")

def copy_txt_to_ts(txt_file_path, ts_file_path):
    # Copia il contenuto del file di testo nel file TypeScript
    shutil.copyfile(txt_file_path, ts_file_path)

# Percorsi dei file di testo e TypeScript
ts_file_path = '/home/gcrozzolin/Development/onecompliance/src/app/oc/i18n/it.ts'  # Sostituire con il percorso reale del file TypeScript
txt_file1_path = '/home/gcrozzolin/Development/onecompliance/python/file_it.txt'  # Percorso del primo file di testo
txt_file2_path = '/home/gcrozzolin/Development/onecompliance/python/new_translate.txt'  # Percorso del file di testo da cui prendere le nuove traduzioni

# Copia il contenuto del file TypeScript nel primo file di testo
copy_ts_to_txt(ts_file_path, txt_file1_path)

# Aggiorna il primo file di testo con le chiavi mancanti
update_first_file_with_missing_keys(txt_file1_path, txt_file2_path)

# Copia il contenuto del primo file di testo nel file TypeScript
copy_txt_to_ts(txt_file1_path, ts_file_path)
