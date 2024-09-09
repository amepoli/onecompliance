import os
import json
import shutil
import re

def copy_file(src, dst):
    shutil.copyfile(src, dst)

def read_json_files(path):
    json_data = []
    for filename in os.listdir(path):
        if filename.endswith(".json"):
            with open(os.path.join(path, filename), 'r', encoding='utf-8') as file:
                json_data.append((filename, json.load(file)))
    return json_data

def extract_resources_keys(file_it_path):
    with open(file_it_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # Trova la sezione RESOURCES
    resources_section_match = re.search(
        r'RESOURCES\s*:\s*\{(.*?)}\s*,\s*VIEWS', content, re.DOTALL
    )
    if not resources_section_match:
        raise ValueError("Section RESOURCES not found in the file")

    resources_content = resources_section_match.group(1)

    # Estrai coppie chiave-valore dalla sezione RESOURCES
    pattern = re.compile(r'(\w+)\s*:\s*"(.*?)"[,}]', re.DOTALL)
    matches = pattern.findall(resources_content)
    
    # Crea un dizionario di chiavi e traduzioni
    resources_dict = {key: value for key, value in matches}
    
    return resources_dict

def extract_define_section(json_data):
    define_dict = {}
    
    for _, data in json_data:
        if 'define' in data and isinstance(data['define'], dict):
            define_dict.update(data['define'])
    
    return define_dict

def resolve_label(label, define_dict):
    # Se la label inizia con "$P{", estrae la parte tra parentesi graffe
    if label.startswith("$P{") and label.endswith("}"):
        param_key = label[3:-1]
        # Cerca la chiave estratta all'interno della sezione "define"
        return define_dict.get(param_key, label)
    return label

def remove_invalid_translations(json_data, resources_dict, define_dict):
    modifications_count = 0

    def recursive_update(data):
        nonlocal modifications_count
        if isinstance(data, dict):
            if "translate" in data and isinstance(data["translate"], str):
                translate_key = data["translate"].replace("RESOURCES.", "")
                if "label" in data and isinstance(data["label"], str):
                    original_label = data["label"]
                    # Controlla se la label inizia con "$P{"
                    if original_label.startswith("$P{"):
                        # Risolvi la label usando la sottochiave dalla sezione define
                        resolved_label = resolve_label(original_label, define_dict)
                        correct_translation = resources_dict.get(translate_key)
                    else:
                        # Se la label non inizia con "$P{", cancella il campo translate
                        correct_translation = resources_dict.get(translate_key)
                        if correct_translation and original_label != correct_translation:
                            print(f"Rimozione per chiave: {translate_key} (Label: {original_label}, Traduzione: {correct_translation})")  # Debug
                            del data["translate"]
                            modifications_count += 1
            for key, value in list(data.items()):
                recursive_update(value)
        elif isinstance(data, list):
            for item in data:
                recursive_update(item)
                
    for filename, data in json_data:
        recursive_update(data)
        with open(os.path.join(views_path, filename), 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=4, ensure_ascii=False)

    return modifications_count

def main():
    # Copia il contenuto di "it.ts" in "file_it.txt"
    copy_file(it_ts_path, file_it_path)

    # Estrai le chiavi di RESOURCES e le loro traduzioni dal file di testo
    resources_dict = extract_resources_keys(file_it_path)

    # Leggi i file JSON e estrai le definizioni da "define"
    json_data = read_json_files(views_path)
    define_dict = extract_define_section(json_data)

    # Rimuovi le traduzioni non valide dai JSON e conta le modifiche
    modifications_count = remove_invalid_translations(json_data, resources_dict, define_dict)

    # Stampa l'output sul terminale
    print(f"Numero di traduzioni rimosse dai JSON: {modifications_count}")

if __name__ == "__main__":

    # Usa la directory home dell'utente per costruire percorsi file
    home_dir = os.path.expanduser('~')

    # Definisci i percorsi relativi alla directory home
    views_path = os.path.join(home_dir, 'Development/onecompliance/dynamo-tables/views')
    it_ts_path = os.path.join(home_dir, 'Development/onecompliance/src/app/oc/i18n/it.ts')
    file_it_path = os.path.join(home_dir, 'Development/onecompliance/python/file_it.txt')

    main()
