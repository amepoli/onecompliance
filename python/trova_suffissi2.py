import json
import os

def trova_e_aggiungi_suffissi(directory_path, elenco_suffissi_path):
    elenco_suffissi = {}

    # Caricare l'elenco esistente dei suffissi, se esiste
    if os.path.exists(elenco_suffissi_path):
        with open(elenco_suffissi_path, 'r', encoding='utf-8') as file:
            elenco_suffissi = json.load(file)

    # Scansione di tutti i file JSON nella directory
    for filename in os.listdir(directory_path):
        if filename.endswith(".json"):
            file_path = os.path.join(directory_path, filename)
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
                for key in ['form_keys', 'table_keys']:
                    if key in data:
                        for item in data[key]:
                            if "translate" in item and item["translate"].startswith("RESOURCES."):
                                suffisso = item["translate"][len("RESOURCES."):]
                                if suffisso not in elenco_suffissi:
                                    elenco_suffissi[suffisso] = item.get("label", "Valore di default")

    # Salvare l'elenco aggiornato dei suffissi
    with open(elenco_suffissi_path, 'w', encoding='utf-8') as file:
        json.dump(elenco_suffissi, file, indent=4, ensure_ascii=False)

# Percorsi dei file (da sostituire con i tuoi percorsi reali)
directory_path = "/home/apoli/Development/onecompliance/dynamo-tables/views"
elenco_suffissi_path = "/home/apoli/Development/onecompliance/python/elenco_translate.json"

trova_e_aggiungi_suffissi(directory_path, elenco_suffissi_path)
