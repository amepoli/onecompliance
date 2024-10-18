import json
import os

def cerca_or_in_querycond(query_cond):
    """
    Verifica se una query contiene 'or' e se ha parentesi come primo e penultimo carattere.
    Aggiunge parentesi se non sono presenti.
    """
    # Verifica se 'or' è presente nella stringa queryCond
    if ' or ' in query_cond:
        # Verifica se la stringa inizia con '(' e termina con ')'
        if not (query_cond.strip().startswith('(') and query_cond.strip().endswith(')')):
            # Se non ci sono le parentesi, le aggiungiamo
            query_cond = f"({query_cond.strip()})"
            print(f"QueryCond modificata: {query_cond}")
        else:
            print(f"QueryCond già corretta: {query_cond}")
    return query_cond


def process_json_file(file_path):
    """
    Carica un file JSON e aggiorna le queryCond se necessario.
    """
    with open(file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)

    modified = False  # Flag per controllare se il file è stato modificato

    for field in data:
        if 'queryCond' in field:
            original_query_cond = field['queryCond']
            # Controlla se è necessario modificare la queryCond
            updated_query_cond = cerca_or_in_querycond(original_query_cond)
            if updated_query_cond != original_query_cond:
                field['queryCond'] = updated_query_cond
                modified = True

    # Se il file è stato modificato, sovrascrivilo con le modifiche
    if modified:
        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=4, ensure_ascii=False)
        print(f"File aggiornato: {file_path}")


def cerca_e_modifica_json(directory_path):
    """
    Cerca i file JSON nella directory e li processa per correggere le queryCond.
    """
    for filename in os.listdir(directory_path):
        if filename.endswith('.json'):
            file_path = os.path.join(directory_path, filename)
            print(f"Processando file: {file_path}")
            process_json_file(file_path)


# Esegui il programma specificando il percorso della directory dei file JSON
directory_path = 'Development/onecompliance/dynamo-tables/views/'
cerca_e_modifica_json(directory_path)
