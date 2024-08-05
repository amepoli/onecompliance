import json

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

def main(input_file):
    with open(input_file, 'r', encoding='utf-8') as file:
        data = json.load(file)
    
    cleaned_data, removed_properties = remove_translate_properties(data)
    
    with open(input_file, 'w', encoding='utf-8') as file:
        json.dump(cleaned_data, file, ensure_ascii=False, indent=4)
    
    for prop, label in removed_properties:
        print(f"Rimossa: {prop} con etichetta: {label}")
    print(f"Proprietà 'translate' rimosse: {len(removed_properties)}")

if __name__ == "__main__":
    input_file = '/home/apoli/Development/onecompliance/dynamo-tables/views/progetti_fasi.json'  # Inserisci il path del file di input
    main(input_file)
