import os

def copy_file(src, dst):
    # Copia il contenuto di un file sorgente in un file di destinazione 
    with open(src, 'r', encoding='utf-8') as f_src:
        content = f_src.read()
    with open(dst, 'w', encoding='utf-8') as f_dst:
        f_dst.write(content)

def extract_resources_section(file_path):
    # Estrae la sezione RESOURCES da un file 
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    start_index = content.find('RESOURCES: {')
    if start_index == -1:
        raise ValueError("Sezione RESOURCES non trovata.")
    start_index += len('RESOURCES: {')

    bracket_count = 1
    end_index = start_index
    while bracket_count > 0 and end_index < len(content):
        if content[end_index] == '{':
            bracket_count += 1
        elif content[end_index] == '}':
            bracket_count -= 1
        end_index += 1

    if bracket_count != 0:
        raise ValueError("Parentesi graffe non corrispondenti nella sezione RESOURCES.")

    resources_content = content[start_index:end_index-1].strip()
    return resources_content

def write_resources_to_file(resources_content, file_path):
    # Scrive il contenuto della sezione RESOURCES in un file 
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(resources_content)

def sort_file(file_path):
    # Ordina alfabeticamente le righe di un file 
    with open(file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()
    lines.sort()
    with open(file_path, 'w', encoding='utf-8') as file:
        file.writelines(lines)

def merge_files(d_file_path, c_file_path):
    # Unisce il contenuto di due file, aggiungendo chiavi da C a D se non già presenti, mantenendo l'indentazione e l'ordine alfabetico 
    with open(d_file_path, 'r', encoding='utf-8') as d_file:
        d_lines = d_file.readlines()

    with open(c_file_path, 'r', encoding='utf-8') as c_file:
        c_lines = c_file.readlines()

    d_keys = {line.split(':')[0].strip() for line in d_lines}
    additions = 0
    for line in c_lines:
        key = line.split(':')[0].strip()
        if key not in d_keys:
            d_lines.append('    ' + line.strip() + '\n')  # Assicura l'indentazione corretta
            additions += 1

    d_lines.sort()
    with open(d_file_path, 'w', encoding='utf-8') as d_file:
        d_file.writelines(d_lines)
    
    print(f"Nuove translate aggiunte: {additions}")

def update_resources_in_file(b_file_path, resources_content):
    # Aggiorna la sezione RESOURCES in un file con nuovo contenuto 
    with open(b_file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    start_index = content.find('RESOURCES: {')
    if start_index == -1:
        raise ValueError("Sezione RESOURCES non trovata.")
    start_index += len('RESOURCES: {')

    bracket_count = 1
    end_index = start_index
    while bracket_count > 0 and end_index < len(content):
        if content[end_index] == '{':
            bracket_count += 1
        elif content[end_index] == '}':
            bracket_count -= 1
        end_index += 1

    if bracket_count != 0:
        raise ValueError("Parentesi graffe non corrispondenti nella sezione RESOURCES.")

    updated_content = (content[:start_index] + '\n' + resources_content + '\n' +
                       content[end_index-1:])
    with open(b_file_path, 'w', encoding='utf-8') as file:
        file.write(updated_content)

def main():
    file_a = '/home/gcrozzolin/Development/onecompliance/src/app/oc/i18n/it.ts'
    file_b = '/home/gcrozzolin/Development/onecompliance/python/file_it.txt'
    file_c = '/home/gcrozzolin/Development/onecompliance/python/file_new_translate.txt'
    file_d = '/home/gcrozzolin/Development/onecompliance/python/file_resources.txt'

    # Step 1: Copia il file A nel file B
    copy_file(file_a, file_b)

    # Step 2: Estrai la sezione RESOURCES da B e scrivila in D
    resources_content = extract_resources_section(file_b)
    write_resources_to_file(resources_content, file_d)

    # Step 3: Ordina il contenuto del file D alfabeticamente
    sort_file(file_d)

    # Step 4: Unisci il contenuto del file C nel file D
    merge_files(file_d, file_c)

    # Step 5: Aggiorna la sezione RESOURCES in B con il contenuto del file D
    with open(file_d, 'r', encoding='utf-8') as file:
        updated_resources_content = file.read()
    update_resources_in_file(file_b, updated_resources_content)

    # Step 6: Copia il file B nel file A
    copy_file(file_b, file_a)

if __name__ == "__main__":
    main()
