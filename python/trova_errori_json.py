import os
import json

# Percorso della directory contenente i file JSON
json_directory_path = "/home/apoli/Development/onecompliance/dynamo-tables/views"

# Percorso del file che contiene l'elenco dei suffissi
elenco_file_path = "/home/apoli/Development/onecompliance/python/elenco_translate.json"

# Leggere l'elenco esistente dei suffissi dal file
def leggi_elenco_suffissi(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)

# Funzione per aggiornare l'elenco dei suffissi
def aggiorna_suffissi(json_directory_path, elenco_file_path):
    suffissi_esistenti = leggi_elenco_suffissi(elenco_file_path)

    # Scansione di tutti i file JSON nella directory
    for filename in os.listdir(json_directory_path):
          if filename.endswith(".json"):
            print(f"Elaborazione dell file: {filename}")  # Stampa di debug
            file_path = os.path.join(json_directory_path, filename)       
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
                # Cerca tutti gli elementi con la proprietà "translate" che inizia con "RESOURCES."
                for key, value in data.items():
                    if isinstance(value, dict):
                        for sub_key, sub_value in value.items():
                            if isinstance(sub_value, str) and sub_value.startswith("RESOURCES."):
                                suffisso = sub_value[len("RESOURCES."):]
                                if suffisso not in suffissi_esistenti:
                                    suffissi_esistenti[suffisso] = 'XXX'

    # Salvare l'elenco aggiornato nel file
    with open(elenco_file_path, 'w', encoding='utf-8') as file:
        json.dump(suffissi_esistenti, file, indent=4, ensure_ascii=False)

# Esegui la funzione per aggiornare l'elenco dei suffissi
aggiorna_suffissi(json_directory_path, elenco_file_path)


