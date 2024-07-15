import json
import os

# Funzione per aggiungere la chiave 'translate' a un singolo file JSON
def aggiungi_translate(file_path, resource_prefix):
    try:
        # Apre e legge il file JSON
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
    except json.JSONDecodeError as e:
        print(f"Errore nel decodificare il file JSON {file_path}: {e}")
        return []  # Ritorna una lista vuota in caso di errore

    added_elements = []  # Lista per tracciare gli elementi aggiunti

    # Processa sia 'form_keys' sia 'table_keys'
    for key in ['form_keys', 'table_keys','addElementSettings']:
        if key in data:
            # Itera su ogni elemento nella lista associata alla chiave
            for element in data[key]:
                # Controlla se l'elemento ha una chiave 'key' e non ha già una chiave 'translate'
                if 'key' in element and 'translate' not in element:
                    # Aggiunge la chiave 'translate'
                    element['translate'] = resource_prefix + element['key']
                    added_elements.append(element['key'])  # Aggiunge la chiave alla lista degli elementi aggiunti

    # Scrive i cambiamenti nel file JSON
    with open(file_path, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=4, ensure_ascii=False)
    
    return added_elements

# Funzione per aggiungere la chiave 'translate' a tutti i file JSON in una directory specificata e controllare le chiavi aggiunte
def aggiungi_translate_directory_e_controlla(directory_path, resource_prefix="RESOURCES."):
    added_elements_total = []

    for filename in os.listdir(directory_path):
        if filename.endswith(".json"):
            file_path = os.path.join(directory_path, filename)
            added_elements = aggiungi_translate(file_path, resource_prefix)
            added_elements_total.extend(added_elements)

    # Legge il file it.ts per ottenere tutte le traduzioni esistenti
    with open('/home/alpoli/Developement/onecompliance/src/app/oc/i18n/it.ts', 'r', encoding='utf-8') as it_file:  # Sostituisci con il percorso reale del file it.ts
        it_data = it_file.read()

    # Controlla gli elementi aggiunti che non esistono nel file it.ts
    non_existing_elements = [el for el in added_elements_total if resource_prefix + el not in it_data]

    print("Elementi aggiunti che non esistono in it.ts:")
    for element in non_existing_elements:
        print(element)

# Usare un percorso ipotetico per l'esempio
directory_path = '/home/alpoli/Developement/onecompliance/dynamo-tables/views' # Sostituisci con il percorso reale della tua directory

aggiungi_translate_directory_e_controlla(directory_path)