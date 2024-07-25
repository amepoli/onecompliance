import json

def aggiungi_translate(file_path, resource_prefix="RESOURCES."):
    # Leggere il file JSON
    with open(file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)

    # Controllare se 'form_keys' esiste nel JSON
    if 'form_keys' in data:
        for element in data['form_keys']:
            # Aggiungere 'translate' se non presente, usando il valore della key
            if 'key' in element and 'translate' not in element:
                element['translate'] = resource_prefix + element['key']

    # Salvare il file JSON modificato
    with open(file_path, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=4, ensure_ascii=False)

# Esempio di utilizzo della funzione
file_path = '/home/gcrozzolin/Development/onecompliance/dynamo-tables/views/tasks_con_translate.json' # Sostituisci con il percorso effettivo del tuo file JSON
aggiungi_translate(file_path)



