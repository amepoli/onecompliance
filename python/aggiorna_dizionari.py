import re

def replace_keys(file_new_translate, file_it, output_file):
    # Leggi il file delle traduzioni
    with open(file_new_translate, 'r', encoding='utf-8') as f:
        translate_dict = {}
        for line in f:
            line = line.strip()
            if ' - ' in line:
                old_key, new_key = line.split(' - ')
                translate_dict[old_key] = new_key
            else:
                print(f"Formato non valido nella linea: {line}")

    # Leggi il file it.txt
    with open(file_it, 'r', encoding='utf-8') as f:
        file_it_content = f.read()

    # Trova il paragrafo RESOURCES
    resources_pattern = re.compile(r'RESOURCES:\s*\{(.*?)\}', re.DOTALL)
    match = resources_pattern.search(file_it_content)
    if match:
        resources_content = match.group(1)

        # Sostituisci le chiavi vecchie con quelle nuove
        for old_key, new_key in translate_dict.items():
            old_pattern = re.compile(r'({}\s*:)'.format(re.escape(old_key)))
            resources_content = old_pattern.sub('{}:'.format(new_key), resources_content)

        # Ricostruisci il contenuto del file
        new_file_it_content = file_it_content[:match.start(1)] + resources_content + file_it_content[match.end(1):]

        # Salva il nuovo contenuto nel file di output
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(new_file_it_content)
    else:
        print("Il paragrafo RESOURCES non è stato trovato nel file.")

# Esegui il programma
replace_keys('file_new_translate.txt', 'file_it.txt', 'file_it_updated.txt')
