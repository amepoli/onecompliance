import re

# Percorsi dei file
it_ts_path = '/home/gcrozzolin/Development/onecompliance/src/app/oc/i18n/it.ts'
file_it_txt_path = '/home/gcrozzolin/Development/onecompliance/python/file_it.txt'
file_new_translate_path = '/home/gcrozzolin/Development/onecompliance/python/file_new_translate.txt'
temp_resources_path = '/home/gcrozzolin/Development/onecompliance/python/file_resources.txt'

# Funzione per leggere il contenuto di un file
def read_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as file:
        return file.read()

# Funzione per scrivere il contenuto in un file
def write_file(filepath, content):
    with open(filepath, 'w', encoding='utf-8') as file:
        file.write(content)

# Funzione per estrarre la sezione RESOURCES considerando annidamenti e virgolette
def extract_resources(content):
    start_marker = 'RESOURCES: {'
    start_index = content.find(start_marker)
    if start_index == -1:
        raise ValueError("La sezione RESOURCES non è stata trovata nel file_it.txt")
    
    start_index += len(start_marker)
    brace_count = 1
    in_quotes = False
    end_index = start_index

    while brace_count > 0 and end_index < len(content):
        char = content[end_index]
        if char == '"' and (end_index == 0 or content[end_index - 1] != '\\'):
            in_quotes = not in_quotes
        elif not in_quotes:
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
        end_index += 1

    resources_content = content[start_index:end_index-1].strip()
    return resources_content

# Copia il contenuto di it.ts in file_it.txt
it_ts_content = read_file(it_ts_path)
write_file(file_it_txt_path, it_ts_content)

# Estrae la sezione RESOURCES da file_it.txt
file_it_txt_content = read_file(file_it_txt_path)
print("Contenuto di file_it_txt_content:")
print(file_it_txt_content[:100])  # Stampa i primi 100 caratteri per il debug

try:
    resources_content = extract_resources(file_it_txt_content)
    print("Contenuto di resources_content:")
    print(f'---\n{resources_content}\n---')  # Stampa il contenuto trovato
    if not resources_content:
        print("resources è vuoto")
except ValueError as e:
    print(e)
    raise

# Scrive il contenuto di RESOURCES in file_resources.txt
write_file(temp_resources_path, resources_content)
# Verifica la scrittura in file_resources.txt
temp_resources_content = read_file(temp_resources_path)
print("Contenuto scritto in file_resources.txt:")
print(temp_resources_content)

# Legge le nuove traduzioni da file_new_translate.txt
new_translations_content = read_file(file_new_translate_path)
print("Contenuto di new_translations_content:")
print(new_translations_content)

new_translations = dict(re.findall(r'"(.*?)":\s*"(.*?)"', new_translations_content))
print("Nuove traduzioni trovate:")
print(new_translations)

# Legge le traduzioni esistenti da file_resources.txt
existing_resources_content = read_file(temp_resources_path)
existing_translations = dict(re.findall(r'"(.*?)":\s*"(.*?)"', existing_resources_content))
print("Traduzioni esistenti trovate:")
print(existing_translations)

# Aggiunge le nuove traduzioni che non sono già presenti
added_count = 0
for key, value in new_translations.items():
    if key not in existing_translations:
        existing_translations[key] = value
        added_count += 1

# Riordina alfabeticamente le traduzioni
sorted_translations = dict(sorted(existing_translations.items()))

# Converte il dizionario ordinato in stringa formattata
sorted_resources_content = ',\n'.join([f'"{key}": "{value}"' for key, value in sorted_translations.items()])

# Scrive il contenuto ordinato in file_resources.txt
write_file(temp_resources_path, sorted_resources_content)
# Verifica la scrittura in file_resources.txt dopo l'ordinamento
temp_resources_content_sorted = read_file(temp_resources_path)
print("Contenuto ordinato scritto in file_resources.txt:")
print(temp_resources_content_sorted)

# Aggiorna il contenuto di RESOURCES in file_it.txt
updated_it_txt_content = file_it_txt_content.replace(
    f'RESOURCES: {{{resources_content}}}',
    f'RESOURCES: {{{sorted_resources_content}}}'
)
write_file(file_it_txt_path, updated_it_txt_content)
# Verifica l'aggiornamento in file_it.txt
updated_file_it_txt_content = read_file(file_it_txt_path)
print("Contenuto aggiornato in file_it.txt:")
print(updated_file_it_txt_content[:100])  # Stampa i primi 100 caratteri per il debug

# Copia il contenuto aggiornato di file_it.txt in it.ts
write_file(it_ts_path, updated_it_txt_content)
# Verifica la scrittura finale in it.ts
final_it_ts_content = read_file(it_ts_path)
print("Contenuto finale in it.ts:")
print(final_it_ts_content[:100])  # Stampa i primi 100 caratteri per il debug

print("Translation aggiunte: " + str(added_count))
