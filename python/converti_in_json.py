import json

def converti_in_json(file_input, file_output):
    # Dizionario per memorizzare le coppie chiave-valore
    data = {}

    # Leggere il file di input
    with open(file_input, 'r', encoding='utf-8') as file:
        for line in file:
            # Rimuovere spazi bianchi e andare a capo
            line = line.strip()
            # Dividere la linea in chiave e valore
            if line:
                key, value = line.split(': ')
                data[key.strip()] = value.strip("'")

    # Scrivere il dizionario in un file JSON
    with open(file_output, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=4, ensure_ascii=False)

# Percorso del file di input e output
file_input = '/home/apoli/Development/onecompliance/python/elenco_translate.txt'  # Sostituisci con il percorso reale
file_output = '/home/apoli/Development/onecompliance/python/elenco_trasnlate.json'  # Sostituisci con il percorso desiderato

# Chiamare la funzione per convertire il file
converti_in_json(file_input, file_output)
