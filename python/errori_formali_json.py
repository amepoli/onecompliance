import os
import json

def find_invalid_json_files(directory):
    invalid_files = []
    
    # Walk through all files in the directory and subdirectories
    for root, _, files in os.walk(directory):
        for filename in files:
            if filename.endswith(".json"):
                filepath = os.path.join(root, filename)
                
                # Open and try to read the JSON file
                try:
                    with open(filepath, 'r', encoding='utf-8') as file:
                        json.load(file)
                except json.JSONDecodeError as e:
                    invalid_files.append((filepath, str(e)))
    
    return invalid_files

# Example usage
directory_path = '/home/apoli/Development/onecompliance/dynamo-tables/users'
invalid_files = find_invalid_json_files(directory_path)

if invalid_files:
    print("Found invalid JSON files:")
    for filepath, error in invalid_files:
        print(f"File: {filepath}")
        print(f"Error: {error}\n")
else:
    print("No invalid JSON files found.")
