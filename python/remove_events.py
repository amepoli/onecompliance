import json
import os

def remove_events_from_json(file_path):
    # Verifica che il file esista
    if not os.path.exists(file_path):
        print(f"Il file {file_path} non esiste.")
        return

    try:
        # Carica il JSON dal file
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)

        # Funzione ricorsiva per rimuovere inputEvents e outputEvents
        def remove_events(obj):
            if isinstance(obj, dict):
                # Rimuovi le chiavi inputEvents e outputEvents, se esistono
                obj.pop('inputEvents', None)
                obj.pop('outputEvents', None)
                # Ricorsione per ogni valore nel dizionario
                for key, value in obj.items():
                    remove_events(value)
            elif isinstance(obj, list):
                # Ricorsione per ogni elemento nella lista
                for item in obj:
                    remove_events(item)

        # Rimuovi gli eventi nel JSON caricato
        remove_events(data)

        # Sovrascrive il file JSON con i cambiamenti
        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=4, ensure_ascii=False)
        
        print(f"Eventi rimossi con successo da {file_path}")
    
    except Exception as e:
        print(f"Errore durante l'elaborazione del file: {e}")

# Specifica il percorso del file JSON
file_path = '/home/apoli/Development/onecompliance/dynamo-tables/views/domande_risposte.json'
remove_events_from_json(file_path)
