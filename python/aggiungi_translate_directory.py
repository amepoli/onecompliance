import json
import os

def aggiungi_translate_directory(directory_path, resource_prefix="RESOURCES."):
    for filename in os.listdir(directory_path):
        if filename.endswith(".json"):
            file_path = os.path.join(directory_path, filename)
            aggiungi_translate(file_path, resource_prefix)

def aggiungi_translate(file_path, resource_prefix):
    with open(file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)

    # Processare sia 'form_keys' sia 'table_keys'
    for key in ['form_keys', 'table_keys']:
        if key in data:
            for element in data[key]:
                if 'key' in element and 'translate' not in element:
                    element['translate'] = resource_prefix + element['key']

    with open(file_path, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=4, ensure_ascii=False)

# Usare un percorso ipotetico per l'esempio
directory_path = '/home/apoli/Development/onecompliance/dynamo-tables/views/' # Sostituisci con il percorso reale della tua directory

aggiungi_translate_directory(directory_path)



