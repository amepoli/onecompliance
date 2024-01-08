def load_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read().splitlines()

def extract_keys(file_content):
    keys = set()
    for line in file_content:
        key = line.split(':')[0].strip()
        keys.add(key)
    return keys

# Carica i file
file_eng_content = load_file('file_eng.txt')
file_it_content = load_file('file_it.txt')

# Estrai le chiavi (identificatori unici) dai contenuti dei file
eng_keys = extract_keys(file_eng_content)
it_keys = extract_keys(file_it_content)

# Trova gli elementi unici in file_it.txt
unique_it_keys = it_keys - eng_keys

# Stampa gli elementi unici
print("Elementi unici in 'file_it.txt' non presenti in 'file_eng.txt':")
for key in unique_it_keys:
    print(key)

# Salva gli elementi unici in un nuovo file (opzionale)
with open('unique_items.txt', 'w', encoding='utf-8') as file:
    for key in unique_it_keys:
        file.write(f"{key}\n")
