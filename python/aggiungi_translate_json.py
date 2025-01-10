import os
import json
import re

def process_json_file(input_file, log_file):
    added_keys = set()  # Per evitare duplicati nel log
    counter = 0  # Contatore per le etichette "translate" create

    def format_label(label, entry_key):
        label_clean = re.sub(r'[^a-zA-Z0-9_]', '', label.lower().replace(" ", "_"))
        entry_key_clean = re.sub(r'[^a-zA-Z0-9_]', '', entry_key.lower().replace(" ", "_"))

        label_numbers = re.findall(r'^[0-9]+', label_clean)
        entry_key_numbers = re.findall(r'^[0-9]+', entry_key_clean)

        label_clean = re.sub(r'^[0-9]+', '', label_clean)
        entry_key_clean = re.sub(r'^[0-9]+', '', entry_key_clean)

        if label_numbers:
            label_clean += '_' + '_'.join(label_numbers)
        if entry_key_numbers:
            entry_key_clean += '_' + '_'.join(entry_key_numbers)

        return f'{label_clean}_{entry_key_clean}'

    def correct_translation_key(translation_key):
        match = re.match(r'^(.*?):\s*"(.*)"\s*,$', translation_key)
        if match:
            key, value = match.groups()
            return f'{key.strip()}: "{value.strip()}",'
        return translation_key

    def add_translate_keys(obj, define_section, entry_key=None):
        nonlocal counter
        nonlocal modified

        if isinstance(obj, dict):
            current_entry_key = entry_key or obj.get('entryKey')

            if 'label' in obj and 'translate' not in obj and isinstance(obj['label'], str):
                base_label = obj['label']
                if base_label.strip().lower() not in ["", " ", "void"]:
                    formatted_label = format_label(base_label, current_entry_key)
                else:
                    formatted_label = None

            elif 'message' in obj and 'translate' not in obj and isinstance(obj['message'], str):
                base_label = obj['message']
                if base_label.strip().lower() not in ["", " ", "void"]:
                    formatted_label = format_label(base_label, current_entry_key)
                else:
                    formatted_label = None

            else:
                formatted_label = None

            if formatted_label is not None:
                translate_key = f"RESOURCES.{formatted_label}"
                obj['translate'] = translate_key
                translation_pair = f'{formatted_label}: "{base_label}",'
                translation_pair = correct_translation_key(translation_pair)
                if translation_pair not in added_keys:
                    added_keys.add(translation_pair)
                modified = True
                counter += 1

            for key, value in obj.items():
                add_translate_keys(value, define_section, current_entry_key)

        elif isinstance(obj, list):
            for item in obj:
                add_translate_keys(item, define_section, entry_key)

    with open(log_file, 'w', encoding='utf-8') as log:
        log.write('')

    try:
        with open(input_file, 'r', encoding='utf-8') as file:
            data = json.load(file)

        modified = False
        define_section = data.get('define', {})

        if "search_keys" in data:
            add_translate_keys(data["search_keys"], define_section, data.get('entryKey'))
        if "table_keys" in data:
            add_translate_keys(data["table_keys"], define_section, data.get('entryKey'))
        if "form_keys" in data:
            add_translate_keys(data["form_keys"], define_section, data.get('entryKey'))

        if modified:
            with open(input_file, 'w', encoding='utf-8') as file:
                json.dump(data, file, ensure_ascii=False, indent=4)

    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        print(f"Errore durante l'elaborazione del file {input_file}: {e}")

    with open(log_file, 'a', encoding='utf-8') as log:
        for key in sorted(added_keys):
            corrected_key = correct_translation_key(key)
            log.write(f"{corrected_key}\n")

    print(f"Traduzioni aggiunte: {counter}")

def update_it_file(log_file, ts_file):
    with open(ts_file, 'r+', encoding='utf-8') as f:
        content = f.read()

        # Trova la sezione RESOURCES
        resources_start = content.find("RESOURCES:")
        if resources_start == -1:
            print("Errore: Sezione RESOURCES non trovata in it.ts.")
            return

        resources_end = content.find("}", resources_start) + 1
        resources_content = content[resources_start:resources_end]

        # Rileva l'indentazione
        indentation_match = re.search(r'\n(\s+)\w+:', resources_content)
        indentation = indentation_match.group(1) if indentation_match else ' ' * 4

        # Leggi nuove traduzioni
        with open(log_file, 'r', encoding='utf-8') as log:
            new_translations = log.readlines()

        # Trova chiavi esistenti in RESOURCES
        existing_keys = set(re.findall(r'(\w+):\s*".+?"', resources_content))

        # Aggiungi solo nuove traduzioni
        added_entries = [
            line.strip()
            for line in new_translations
            if line.split(':', 1)[0].strip() not in existing_keys
        ]

        if added_entries:
            added_entries = sorted(added_entries)
            updated_resources = resources_content.rstrip().rstrip("}") + ",\n"
            updated_resources += "\n".join(f"{indentation}{entry}" for entry in added_entries)
            updated_resources += "\n}"

            content = content.replace(resources_content, updated_resources)

            # Aggiorna il file it.ts
            f.seek(0)
            f.write(content)
            f.truncate()

            print(f"Aggiornato it.ts con {len(added_entries)} nuove traduzioni.")
        else:
            print("Nessuna nuova traduzione da aggiungere.")

def main():
    # Usa la directory home dell'utente per costruire percorsi file
    home_dir = os.path.expanduser('~')

    # Definisci i percorsi relativi alla directory home
    views_path = os.path.join(home_dir, 'Development/onecompliance/dynamo-tables/views')
    log_file = os.path.join(home_dir, 'Development/onecompliance/python/file_new_translate.txt')
    ts_file = os.path.join(home_dir, 'Development/onecompliance/src/app/oc/i18n/it.ts')

    # Chiedere all'utente di inserire il nome del file
    file_name = input("Inserisci il nome del file JSON di input (es. 'file.json'): ")

    # Costruire il percorso assoluto del file
    input_file = os.path.join(views_path, file_name)

    # Verifica esistenza file
    if not os.path.isfile(input_file):
        print(f"Errore: il file '{input_file}' non è stato trovato.")
        return

    # Processa il file JSON
    process_json_file(input_file, log_file)

    # Aggiorna il file it.ts con le nuove traduzioni
    update_it_file(log_file, ts_file)

if __name__ == "__main__":
    main()
