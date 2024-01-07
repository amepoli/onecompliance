import json

def converti_in_json(file_input, file_output):
    data = {}

    with open(file_input, 'r', encoding='utf-8') as file:
        for line in file:
            line = line.strip()
            if line:
                print(f"Elaborazione della riga: {line}")  # Stampa di debug
                try:
                    key, value = line.split(': ')
                    data[key.strip()] = value.strip("'")
                    data[key.strip()] = value.strip("',")
                except ValueError as e:
                    print(f"Errore durante l'elaborazione della riga: {line}")
                    print(e)

    with open(file_output, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=4, ensure_ascii=False)

# Percorso del file di input e output
file_input = '/home/apoli/Development/onecompliance/python/elenco_translate.txt'  # Sostituisci con il percorso reale
file_output = '/home/apoli/Development/onecompliance/python/elenco_translate.json'  # Sostituisci con il percorso desiderato

# Chiamare la funzione per convertire il file
converti_in_json(file_input, file_output)
