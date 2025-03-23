#!/bin/bash

# Legge i dettagli del database
DB_ENDPOINT=`cat /home/ec2-user/db_endpoint.donotremove`
UTF_ENCODER=`jq -r '.UTF_ENCODER' lambda_names.json`
DBF_TO_CSV_CONVERTER=`jq -r '.DBF_TO_CSV_CONVERTER' lambda_names.json`
BACKUP_FILE="/home/ec2-user/sftp/customers/backups/gorico_prod-1_last.backup"

# Calcola il nome del database basato sulla data del giorno precedente
DB_NAME="r$(date -d "yesterday" +%Y%m%d)"
SCHEMA_NAME="$DB_NAME"

# Verifica i permessi sul file di backup
if [ ! -r "$BACKUP_FILE" ]; then
  echo "Error: Permission denied or file not found - $BACKUP_FILE"
  exit 1
fi

# Crea il database
psql -h $DB_ENDPOINT -U postgres -c "CREATE DATABASE $DB_NAME;"

# Ripristina il file di backup nel database appena creato
# Include solo gli schemi 'entrasp' e 'imports' ed esclude i FOREIGN DATA WRAPPERS
pg_restore -h $DB_ENDPOINT -U postgres -d $DB_NAME --clean --no-owner $BACKUP_FILE

# Crea uno schema con lo stesso nome del database appena creato nel database "onecompliance"
psql -h $DB_ENDPOINT -U postgres -d onecompliance -c "CREATE SCHEMA IF NOT EXISTS $SCHEMA_NAME;"

# Crea il server FDW per il database appena creato
psql -h $DB_ENDPOINT -U postgres -d onecompliance -c "
    CREATE SERVER $DB_NAME
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host 'localhost', port '5432', dbname '$DB_NAME');
"

# Imposta il proprietario del server a postgres
psql -h $DB_ENDPOINT -U postgres -d onecompliance -c "
    ALTER SERVER $DB_NAME 
    OWNER TO postgres;
"
psql -h $DB_ENDPOINT -U postgres -d onecompliance -c "
    GRANT USAGE ON FOREIGN SERVER $DB_NAME TO postgres;
"
# Elimina database e FDW più vecchi di 7 giorni
for DB_TO_DELETE in $(psql -h $DB_ENDPOINT -U postgres -t -c "
    SELECT datname 
    FROM pg_database 
    WHERE datname ~ '^r[0-9]{8}$'  -- Filtra solo i database con formato rAAAAMMGG
      AND to_date(substring(datname from 2 for 8), 'YYYYMMDD') < (CURRENT_DATE - interval '7 days')
      AND to_date(substring(datname from 2 for 8), 'YYYYMMDD') > '2025-01-17';
"); do
  echo "Eliminazione del database: $DB_TO_DELETE"
  # Elimina il database
  psql -h $DB_ENDPOINT -U postgres -c "DROP DATABASE $DB_TO_DELETE;"
  
  echo "Eliminazione del Foreign Data Wrapper: $DB_TO_DELETE in onecompliance"
  # Elimina il corrispondente Foreign Data Wrapper in onecompliance
  psql -h $DB_ENDPOINT -U postgres -d onecompliance -c "
    DROP SERVER IF EXISTS $DB_TO_DELETE CASCADE;
  "
done
