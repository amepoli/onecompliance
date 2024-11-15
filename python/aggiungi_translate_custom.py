import os
import re

def process_file(file_path, log_file):
    added_keys = set()
    counter = 0  # Contatore per il numero di etichette "translate" create

    # Estrae il nome del file senza estensione e senza la parte dopo il primo punto
    file_name = os.path.basename(file_path).split('.')[0]
    file_prefix = file_name.replace('-', '_')

    def format_label(label):
        label_clean = re.sub(r'[^a-zA-Z0-9_]', '', label.lower().replace(" ", "_"))
        label_numbers = re.findall(r'^[0-9]+', label_clean)
        
        label_clean = re.sub(r'^[0-9]+', '', label_clean)

        if label_numbers:
            label_clean += '_' + '_'.join(label_numbers)

        return f'{file_prefix}_{label_clean}'

    def correct_translation_key(translation_key):
        match = re.match(r'^(.*?):\s*"(.*)"\s*,$', translation_key)
        if match:
            key, value = match.groups()
            corrected_key = f'{key.strip()}: "{value.strip()}",'
            return corrected_key
        else:
            return translation_key

    def add_translate_to_text(lines):
        nonlocal counter
        modified = False  # Dichiarata qui per questa funzione
        result_lines = []

        in_block_comment = False  # Flag per tracciare i commenti multi-linea

        for i, line in enumerate(lines):
            stripped_line = line.strip()

            # Verifica se la riga è l'inizio o la fine di un commento multi-linea
            if stripped_line.startswith("/*"):
                in_block_comment = True
            if stripped_line.endswith("*/"):
                in_block_comment = False
                result_lines.append(line.rstrip())
                continue

            # Salta la riga se è in un commento multi-linea o è una riga con commento singolo
            if in_block_comment or stripped_line.startswith("//"):
                result_lines.append(line.rstrip())
                continue

            label_match = re.search(r'(label|message)\s*:\s*"(.*?)"', line)
            translate_match = re.search(r'translate\s*:\s*".*?"', line)

            if label_match and not translate_match:
                label_key = label_match.group(1)
                label_value = label_match.group(2).strip()

                # Generazione della chiave di traduzione solo se label_value non è vuota o "void"
                if label_value.lower() not in ["", " ", "void"]:
                    formatted_label = format_label(label_value)
                    translate_key = f'RESOURCES.{formatted_label}'

                    # Rileva l'indentazione corrente
                    current_indent = re.match(r'^\s*', line).group(0)
                    translate_line = f'{current_indent}translate: "{translate_key}",'

                    # Aggiunge la virgola alla fine della riga corrente solo se non è già presente
                    if not line.rstrip().endswith(','):
                        result_lines.append(line.rstrip() + ',')
                    else:
                        result_lines.append(line.rstrip())

                    # Aggiunge la nuova riga con la chiave di traduzione
                    result_lines.append(translate_line)
                    modified = True

                    # Aggiunge la nuova chiave di traduzione al set
                    translation_pair = f'{formatted_label}: "{label_value}",'
                    if translation_pair not in added_keys:
                        added_keys.add(translation_pair)
                        counter += 1
                else:
                    result_lines.append(line.rstrip())
            else:
                result_lines.append(line.rstrip())

        return result_lines if modified else lines

    def process_as_text():
        # Legge il file come testo riga per riga
        with open(file_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()

        # Aggiunge le traduzioni alle righe rilevanti
        updated_lines = add_translate_to_text(lines)

        # Se ci sono modifiche, sovrascrive il file mantenendo l'indentazione originale
        if updated_lines != lines:
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write('\n'.join(updated_lines) + '\n')

    # Crea il file di log vuoto
    with open(log_file, 'w', encoding='utf-8') as log:
        log.write('')

    # Elabora il file come testo generico
    process_as_text()

    # Salva le nuove traduzioni nel file di log
    with open(log_file, 'a', encoding='utf-8') as log:
        for key in sorted(added_keys):
            corrected_key = correct_translation_key(key)
            log.write(f"{corrected_key}\n")

    print("Traduzioni aggiunte: " + str(counter))

def main():
    home_dir = os.path.expanduser('~')
    file_path = '/home/gcrozzolin/Development/onecompliance/src/app/oc/custom-components/domande-risposte/domande-risposte.component.ts'  # Specifica il file
    log_file_path = os.path.join(home_dir, 'Development/onecompliance/python/file_new_translate.txt')

    process_file(file_path, log_file_path)

if __name__ == "__main__":
    main()
