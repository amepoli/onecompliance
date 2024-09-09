import os
import json
import shutil
import re

def read_json_files(path):
    json_data = []
    for filename in os.listdir(path):
        if filename.endswith(".json"):
            with open(os.path.join(path, filename), 'r', encoding='utf-8') as file:
                json_data.append(json.load(file))
    return json_data

def extract_translate_labels(json_data):
    translate_labels = set()
    def recursive_search(data):
        if isinstance(data, dict):
            for key, value in data.items():
                if key == "translate" and isinstance(value, str) and value.startswith("RESOURCES."):
                    translate_labels.add(value.replace("RESOURCES.", ""))
                else:
                    recursive_search(value)
        elif isinstance(data, list):
            for item in data:
                recursive_search(item)
                
    for data in json_data:
        recursive_search(data)
    
    return translate_labels

def copy_file(src, dst):
    shutil.copyfile(src, dst)

def clean_file_it(file_it_path, labels_to_keep):
    with open(file_it_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # Trova la sezione RESOURCES
    resources_section_match = re.search(
        r'(RESOURCES\s*:\s*\{)(.*?)(\}\s*,\s*VIEWS)', content, re.DOTALL
    )
    if not resources_section_match:
        raise ValueError("Section RESOURCES not found in the file")

    start_tag, resources_content, end_tag = resources_section_match.groups()

    # Estrai coppie chiave-valore dalla sezione RESOURCES
    pattern = re.compile(r'(\w+)\s*:\s*"(.*?)"[,}]')
    matches = pattern.findall(resources_content)

    # Filtra le coppie chiave-valore che non sono in labels_to_keep
    filtered_resources = [
        f'            {key}: "{value}"' for key, value in matches if key in labels_to_keep
    ]

    # Ordina le coppie chiave-valore alfabeticamente
    filtered_resources.sort()

    # Ricrea la sezione RESOURCES con la stessa indentazione originale
    if filtered_resources:
        cleaned_resources = ",\n".join(filtered_resources) + ","
    else:
        cleaned_resources = ""

    # Ricompone il nuovo contenuto rispettando la formattazione
    new_content = (
        f'{start_tag}\n'
        f'{cleaned_resources}\n'
        f'{end_tag}'
    )

    # Sostituisci il vecchio contenuto di RESOURCES con quello pulito
    new_content = content.replace(resources_section_match.group(0), new_content)

    with open(file_it_path, 'w', encoding='utf-8') as file:
        file.write(new_content)

    return len(matches) - len(filtered_resources)

def main():
    # Copia il contenuto di "it.ts" in "file_it.txt"
    copy_file(it_ts_path, file_it_path)

    # Leggi i file JSON e estrai le etichette di traduzione
    json_data = read_json_files(views_path)
    translate_labels = extract_translate_labels(json_data)

    # Scrivi le etichette di traduzione in "file_new_translate.txt"
    with open(file_new_translate_path, 'w', encoding='utf-8') as file:
        for label in translate_labels:
            file.write(label + "\n")

    # Leggi le etichette di traduzione da "file_new_translate.txt"
    with open(file_new_translate_path, 'r', encoding='utf-8') as file:
        labels_to_keep = set(file.read().splitlines())

    # Pulisci "file_it.txt"
    deleted_keys_count = clean_file_it(file_it_path, labels_to_keep)

    # Copia il "file_it.txt" pulito di nuovo in "it.ts"
    copy_file(file_it_path, it_ts_path)

    # Stampa l'output sul terminale
    print("Number of phantom keys deleted:", deleted_keys_count)

if __name__ == "__main__":

    # Usa la directory home dell'utente per costruire percorsi file
    home_dir = os.path.expanduser('~')

    # Definisci i percorsi relativi alla directory home
    views_path = os.path.join(home_dir, 'Development/onecompliance/dynamo-tables/views')
    it_ts_path = os.path.join(home_dir, 'Development/onecompliance/src/app/oc/i18n/it.ts')
    file_it_path = os.path.join(home_dir, 'Development/onecompliance/python/file_it.txt')
    file_new_translate_path = os.path.join(home_dir, 'Development/onecompliance/python/file_new_translate.txt')  # Percorso del file temporaneo

    main()
