#file in python per trovare nella directory /home/apoli/Development/onecompliance/dynamo-tables e relative sottodirectory eventuali file con la stessa entry key

import os
import json
from collections import defaultdict

def find_duplicate_entry_keys(directory):
    entry_keys = defaultdict(list)
    
    # Walk through all files in the directory and subdirectories
    for root, _, files in os.walk(directory):
        for filename in files:
            if filename.endswith(".json"):
                filepath = os.path.join(root, filename)
                
                # Open and read the JSON file
                with open(filepath, 'r', encoding='utf-8') as file:
                    try:
                        data = json.load(file)
                        
                        # Check if the data is a dictionary or a list
                        if isinstance(data, dict):
                            entry_key = data.get("entryKey")
                            if entry_key:
                                entry_keys[entry_key].append(filepath)
                        elif isinstance(data, list):
                            for item in data:
                                if isinstance(item, dict):
                                    entry_key = item.get("entryKey")
                                    if entry_key:
                                        entry_keys[entry_key].append(filepath)
                    except json.JSONDecodeError:
                        print(f"Error decoding JSON in file {filepath}")
    
    # Find duplicates
    duplicates = {key: files for key, files in entry_keys.items() if len(files) > 1}
    
    return duplicates

# Example usage
directory_path = '/home/apoli/Development/onecompliance/dynamo-tables'
duplicates = find_duplicate_entry_keys(directory_path)

if duplicates:
    print("Found duplicate entry keys in the following files:")
    for entry_key, files in duplicates.items():
        print(f"Entry Key: {entry_key}")
        for file in files:
            print(f" - {file}")
else:
    print("No duplicate entry keys found.")
