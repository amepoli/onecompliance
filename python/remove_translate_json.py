import json
import os

def remove_translate_properties(json_data):
    if isinstance(json_data, dict):
        new_dict = {}
        removed_properties = []
        for k, v in json_data.items():
            if k == "translate":
                removed_properties.append((k, v))
            else:
                cleaned_value, sub_removed = remove_translate_properties(v)
                new_dict[k] = cleaned_value
                removed_properties.extend(sub_removed)
        return new_dict, removed_properties
    elif isinstance(json_data, list):
        new_list = []
        removed_properties = []
        for item in json_data:
            cleaned_item, sub_removed = remove_translate_properties(item)
            new_list.append(cleaned_item)
            removed_properties.extend(sub_removed)
        return new_list, removed_properties
    else:
        return json_data, []

def main():
    # Usa la directory home dell'utente per costruire percorsi file
    home_dir = os.path.expanduser('~')

    # Definisci i percorsi relativi alla directory home
    views_path = os.path.join(home_dir, 'Development/onecompliance/dynamo-tables/views')

    # Chiedere all'utente di inserire il nome del file
    file_name = input("Inserisci il nome del file JSON di input (es. 'file.json'): ")

    # Costruire il percorso assoluto del file
    input_file = os.path.join(views_path, file_name)

    try:
        with open(input_file, 'r', encoding='utf-8') as file:
            data = json.load(file)

        cleaned_data, removed_properties = remove_translate_properties(data)

        # Scrivere i dati puliti nello stesso file
        with open(input_file, 'w', encoding='utf-8') as file:
            json.dump(cleaned_data, file, ensure_ascii=False, indent=4)

        for prop, label in removed_properties:
            print(f"Rimossa: {prop} con etichetta: {label}")
        print(f"Proprietà 'translate' rimosse: {len(removed_properties)}")
    except FileNotFoundError:
        print(f"Errore: il file '{input_file}' non è stato trovato.")
    except json.JSONDecodeError:
        print(f"Errore: il file '{input_file}' non contiene un JSON valido.")
    except Exception as e:
        print(f"Errore inatteso: {e}")

if __name__ == "__main__":
    main()
