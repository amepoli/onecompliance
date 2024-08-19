import json
import os
import sys

# !! INSERIRE PROPRIA DIRECTORY !!
DIRECTORY_PATH = '/home/eongaro/Desktop/Development/onecompliance/dynamo-tables/views'

def add_message_block_to_json(file_path, label):
  
    with open(file_path, 'r') as file:
        data = json.load(file)
    
    
    if "messages" in data:
        for message in data["messages"]:
            if (message.get("viewType") == "form" and
                message.get("formMessageType") == "delete" and
                message["message"]["title"].startswith("Cancellazione")):
                raise ValueError(f"Errore: Il blocco 'messages' è già presente nel file {file_path}")
    
    
    new_message_block = {
        "messages": [
            {
                "viewType": "form",
                "formMessageType": "delete",
                "message": {
                    "title": f"Cancellazione {label}",
                    "text": f"Sei sicuro di voler cancellare {label}?"
                }
            }
        ]
    }
    
   
    data.update(new_message_block)
    
    
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4, ensure_ascii=False)

def main(search_term):
    
    if not os.path.isdir(DIRECTORY_PATH):
        print(f"Errore: La directory {DIRECTORY_PATH} non esiste.")
        sys.exit(1)

    
    for filename in os.listdir(DIRECTORY_PATH):
        if filename.endswith(".json") and search_term in filename:
            file_path = os.path.join(DIRECTORY_PATH, filename)
            label = os.path.splitext(filename)[0]
            try:
                add_message_block_to_json(file_path, label)
                print(f"Blocco 'messages' aggiunto a {filename}")
            except ValueError as e:
                print(e)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Scrivere sul terminale: python3 aggiungi_messages.py <search_term>")
        sys.exit(1)
    
    search_term = sys.argv[1]
    
    main(search_term)
