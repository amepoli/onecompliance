import os
import json
import re

def read_json_files(path):
    json_files = []
    for filename in os.listdir(path):
        if filename.endswith(".json"):
            filepath = os.path.join(path, filename)
            with open(filepath, 'r', encoding='utf-8') as file:
                json_files.append((filepath, json.load(file)))
    return json_files

def extract_resources_keys(it_ts_path):
    with open(it_ts_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # Trova la sezione RESOURCES
    resources_section_match = re.search(
        r'RESOURCES\s*:\s*\{(.*?)}\s*,\s*VIEWS', content, re.DOTALL
    )
    if not resources_section_match:
        raise ValueError("Section RESOURCES not found in the file")

    resources_content = resources_section_match.group(1)

    # Estrai coppie chiave-valore dalla sezione RESOURCES
    pattern = re.compile(r'(\w+)\s*:\s*"(.*?)"[,}]')
    matches = pattern.findall(resources_content)
    
    # Crea un dizionario di chiavi e traduzioni
    resources_dict = {key: value for key, value in matches}
    
    return resources_dict

def extract_translate_labels(it_ts_path):
    with open(it_ts_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # Trova la sezione RESOURCES
    resources_section_match = re.search(
        r'RESOURCES\s*:\s*\{(.*?)}\s*,\s*VIEWS', content, re.DOTALL
    )
    if not resources_section_match:
        raise ValueError("Section RESOURCES not found in the file")

    resources_content = resources_section_match.group(1)

    # Estrai coppie chiave-valore dalla sezione RESOURCES
    pattern = re.compile(r'(\w+)\s*:\s*"(.*?)"[,}]')
    matches = pattern.findall(resources_content)
    
    # Crea un dizionario di chiavi e traduzioni
    translate_labels = {key: value for key, value in matches}
    
    return translate_labels

def update_json_files(json_files, labels_to_update):
    modifications_count = 0

    for filepath, data in json_files:
        def recursive_update(data):
            nonlocal modifications_count
            if isinstance(data, dict):
                for key, value in data.items():
                    if key == "translate" and isinstance(value, str) and value.startswith("RESOURCES."):
                        translate_key = value.replace("RESOURCES.", "")
                        if translate_key in labels_to_update:
                            if "label" in data and isinstance(data["label"], str):
                                old_label = data["label"]
                                new_label = labels_to_update[translate_key]
                                if old_label != new_label:
                                    data["label"] = new_label
                                    modifications_count += 1
                    else:
                        recursive_update(value)
            elif isinstance(data, list):
                for item in data:
                    recursive_update(item)

        recursive_update(data)

        with open(filepath, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=4, ensure_ascii=False)
    
    return modifications_count

def main():
    # Leggi i file JSON
    json_files = read_json_files(views_path)

    # Estrai le etichette di traduzione da it.ts
    labels_to_update = extract_resources_keys(it_ts_path)

    # Aggiorna i file JSON con le traduzioni
    modifications_count = update_json_files(json_files, labels_to_update)

    # Stampa l'output sul terminale
    print(f"Numero di label aggiornate: {modifications_count}")

if __name__ == "__main__":
    views_path = '/home/gcrozzolin/Development/onecompliance/dynamo-tables/views'
    it_ts_path = '/home/gcrozzolin/Development/onecompliance/src/app/oc/i18n/it.ts'

    main()
