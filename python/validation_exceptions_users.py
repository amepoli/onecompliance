import os
import json

# Specifica la directory da controllare
directory_path = '/home/apoli/Development/onecompliance/dynamo-tables/users'

# Specifica i nomi delle chiavi che la tabella DynamoDB richiede (modifica secondo la tua tabella)
required_keys = ["email", "name",  "language",
  "lastname",
  "userid",
  "username"
 ]

def check_json_structure(file_path):
    missing_keys = []  # Lista per tenere traccia delle chiavi mancanti
    try:
        with open(file_path, 'r') as file:
            data = json.load(file)
        
        # Verifica se le chiavi richieste sono presenti nel JSON
        if isinstance(data, dict):
            # Verifica la presenza delle chiavi richieste nel dizionario principale
            for key in required_keys:
                if key not in data:
                    missing_keys.append(key)
                # Aggiungi ulteriori controlli se necessario per il tipo di valore
                # Altrimenti, considera tutti i valori validi
        else:
            return False, ["Struttura JSON non valida: non è un dizionario"]

        if missing_keys:
            return False, missing_keys  # Restituisce False e le chiavi mancanti se ci sono errori
        else:
            return True, []  # Nessun errore, restituisce una lista vuota
    except json.JSONDecodeError as e:
        return False, [f"Errore di parsing JSON: {e}"]
    except Exception as e:
        return False, [f"Errore sconosciuto: {e}"]  # Dettagli aggiuntivi per l'errore sconosciuto

# Lista per raccogliere i file JSON con errori e chiavi mancanti
files_with_errors = []

# Itera su tutti i file nella directory
for filename in os.listdir(directory_path):
    if filename.endswith(".json"):
        file_path = os.path.join(directory_path, filename)
        # Verifica la struttura del file JSON
        is_valid, missing_keys = check_json_structure(file_path)
        if not is_valid and missing_keys:  # Cambiato per verificare l'iterabilità di missing_keys
            files_with_errors.append(f"{filename} ({', '.join(missing_keys)})")

# Risultato finale
if files_with_errors:
    print("I seguenti file JSON contengono errori:")
    for error_file in files_with_errors:
        print(f"- {error_file}")
else:
    print("Tutti i file JSON nella directory sono validi.")
