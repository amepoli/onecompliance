#mi estrate tutti i nomi delle keys della proprietà table keys. 
#Questa funzione mi serve se ho una predefined select table con un asterisco (e.g. select * from entrasp.consuntivazioni) 
# e la voglio sostituire con i soli campi delle table keys per non appesantire la query.

import json

def estrai_chiavi_da_json(file_input):
    # Carica il file JSON
    with open(file_input, 'r') as file:
        dati = json.load(file)

    # Inizializza una lista per raccogliere le chiavi
    chiavi = []

    # Controlla se esiste la proprietà "table_keys"
    if "table_keys" in dati:
        # Itera su ogni elemento all'interno di "table_keys"
        for elemento in dati["table_keys"]:
            # Verifica la presenza della proprietà "key"
            if "key" in elemento:
                # Se esiste "queryFunct", formatta come "queryFunct as key"
                if "queryFunct" in elemento:
                    chiavi.append(f'{elemento["queryFunct"]} as {elemento["key"]}')
                else:
                    # Altrimenti aggiungi solo il valore della chiave "key"
                    chiavi.append(elemento["key"])

    # Restituisce le chiavi separate da virgola
    return ",".join(chiavi)


# Esempio di utilizzo della funzione
file_input = '/home/apoli/Development/onecompliance/dynamo-tables/views/presidi.json'
risultato = estrai_chiavi_da_json(file_input)
print(risultato)
