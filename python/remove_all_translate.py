import os
import json

def process_json_files(directory, log_file):
    removed_translations = set()  # Per registrare le traduzioni rimosse

    def is_outside_section(path):
        """
        Verifica se il percorso corrente non è all'interno delle sezioni 'search_keys', 'table_keys',
        'form_keys', o 'subTables'.
        """
        return path.split('.')[0] not in ['search_keys', 'table_keys', 'form_keys', 'subTables']

    def remove_free_translate(obj, path=''):
        """
        Funzione che rimuove le chiavi 'translate' che sono state create al di fuori delle sezioni indicate.
        """
        if isinstance(obj, dict):
            keys_to_remove = []
            for key, value in obj.items():
                # Se la chiave è 'translate' ed è fuori dalle sezioni indicate
                if key == 'translate' and is_outside_section(path):
                    keys_to_remove.append(key)
                else:
                    new_path = f"{path}.{key}" if path else key
                    remove_free_translate(value, new_path)

            for key in keys_to_remove:
                removed_translations.add(f"Rimosso translate per {path}")
                del obj[key]

        elif isinstance(obj, list):
            for idx, item in enumerate(obj):
                new_path = f"{path}[{idx}]"
                remove_free_translate(item, new_path)

    # Creazione del file di log vuoto
    with open(log_file, 'w', encoding='utf-8') as log:
        log.write('')

    # Scansione dei file nella directory
    for filename in os.listdir(directory):
        if filename.endswith(".json"):
            filepath = os.path.join(directory, filename)

            try:
                # Apertura del file JSON
                with open(filepath, 'r', encoding='utf-8') as file:
                    data = json.load(file)

                # Rimozione delle chiavi 'translate' fuori dalle sezioni consentite
                remove_free_translate(data)

                # Salva il file JSON modificato
                with open(filepath, 'w', encoding='utf-8') as file:
                    json.dump(data, file, ensure_ascii=False, indent=4)

            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                print(f"Errore durante l'elaborazione del file {filename}: {e}")
                continue

    # Scrivi il log delle traduzioni rimosse
    with open(log_file, 'a', encoding='utf-8') as log:
        for removed_key in sorted(removed_translations):
            log.write(f"{removed_key}\n")

    print(f"Rimosse {len(removed_translations)} traduzioni.")

def main():
    # Percorso della directory e del file di log
    directory_path = os.path.expanduser('~/Development/onecompliance/dynamo-tables/views')
    log_file_path = os.path.expanduser('~/Development/onecompliance/python/file_removed_translate.txt')

    # Processo per rimuovere le traduzioni
    process_json_files(directory_path, log_file_path)

if __name__ == "__main__":
    main()
