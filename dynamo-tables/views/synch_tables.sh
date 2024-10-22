#!/bin/bash

# synch_tables.sh
# Script per confrontare file JSON locali con elementi in una tabella DynamoDB
# Mostra:
# 1. File JSON presenti in locale, ma non su DynamoDB
# 2. Elementi presenti su DynamoDB, ma non in locale
# 3. Numero di file diversi in ciascuna categoria

# Funzione per mostrare l'uso corretto dello script
usage() {
    echo "Usage: $0 <target_environment>"
    echo "Example: $0 gorico_prod"
    exit 1
}

# Verifica che sia stato fornito l'argomento necessario
if [ $# -lt 1 ]; then
    usage
fi

TARGET_ENV=$1
CONFIG_FILE="../../${TARGET_ENV}.json"

# Verifica che il file di configurazione esista
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Errore: Il file di configurazione $CONFIG_FILE non esiste!"
    exit 1
fi

# Estrai il nome della tabella e la chiave principale usando jq
TABLENAME=$(jq -r ".dynamoTables.views.tableName" "$CONFIG_FILE")
if [ -z "$TABLENAME" ] || [ "$TABLENAME" == "null" ]; then
    echo "Errore: Impossibile estrarre 'tableName' dal file di configurazione."
    exit 1
fi

MAINKEY=$(jq -r ".dynamoTables.views.mainKey" "$CONFIG_FILE")
if [ -z "$MAINKEY" ] || [ "$MAINKEY" == "null" ]; then
    echo "Errore: Impossibile estrarre 'mainKey' dal file di configurazione."
    exit 1
fi

echo "Configurazione caricata:"
echo "  Ambiente target: $TARGET_ENV"
echo "  Tabella DynamoDB: $TABLENAME"
echo "  Chiave principale: $MAINKEY"
echo "========================================"

# Recupera tutte le chiavi dalla tabella DynamoDB
echo "Recupero delle chiavi dalla tabella DynamoDB '$TABLENAME'..."

dynamo_keys=()
LAST_EVALUATED_KEY_JSON="null"

while true; do
    if [ "$LAST_EVALUATED_KEY_JSON" == "null" ]; then
        SCAN_CMD=(aws dynamodb scan --table-name "$TABLENAME" --projection-expression "$MAINKEY" --output json)
    else
        SCAN_CMD=(aws dynamodb scan --table-name "$TABLENAME" --projection-expression "$MAINKEY" --exclusive-start-key "$LAST_EVALUATED_KEY_JSON" --output json)
    fi

    SCAN_OUTPUT=$("${SCAN_CMD[@]}")
    if [ $? -ne 0 ]; then
        echo "Errore: Impossibile eseguire lo scan sulla tabella DynamoDB."
        exit 1
    fi

    # Estrai le chiavi dal risultato dello scan
    keys_from_scan=$(echo "$SCAN_OUTPUT" | jq -r ".Items[].${MAINKEY}.S")
    dynamo_keys+=($keys_from_scan)

    # Ottieni il LastEvaluatedKey per gestire la paginazione
    LAST_EVALUATED_KEY_JSON=$(echo "$SCAN_OUTPUT" | jq -c ".LastEvaluatedKey")
    
    # Termina il ciclo se non ci sono più pagine
    if [ "$LAST_EVALUATED_KEY_JSON" == "null" ]; then
        break
    fi
done

echo "Totale elementi in DynamoDB: ${#dynamo_keys[@]}"
echo "========================================"

# Recupera tutte le chiavi dai file JSON locali
echo "Recupero dei file JSON locali..."

json_keys=()
for f in *.json; do
    if [ -f "$f" ]; then
        key="${f%.json}"
        json_keys+=("$key")
    fi
done

echo "Totale file JSON locali: ${#json_keys[@]}"
echo "========================================"

# Trova i file presenti in locale ma non in DynamoDB
local_not_in_dynamo=()
for key in "${json_keys[@]}"; do
    if [[ ! " ${dynamo_keys[@]} " =~ " ${key} " ]]; then
        local_not_in_dynamo+=("$key.json")
    fi
done

# Trova gli elementi presenti in DynamoDB ma non in locale
dynamo_not_in_local=()
for key in "${dynamo_keys[@]}"; do
    if [[ ! " ${json_keys[@]} " =~ " ${key} " ]]; then
        dynamo_not_in_local+=("$key")
    fi
done

# Stampa i risultati
echo "========================================"
echo "File presenti in locale, ma non in DynamoDB:"
if [ ${#local_not_in_dynamo[@]} -eq 0 ]; then
    echo "Nessun file in questa categoria."
else
    for file in "${local_not_in_dynamo[@]}"; do
        echo "$file"
    done
    echo "Totale: ${#local_not_in_dynamo[@]} file"
fi

echo "========================================"
echo "Elementi presenti in DynamoDB, ma non in locale:"
if [ ${#dynamo_not_in_local[@]} -eq 0 ]; then
    echo "Nessun elemento in questa categoria."
else
    for key in "${dynamo_not_in_local[@]}"; do
        echo "$key"
    done
    echo "Totale: ${#dynamo_not_in_local[@]} elementi"
fi
echo "========================================"
