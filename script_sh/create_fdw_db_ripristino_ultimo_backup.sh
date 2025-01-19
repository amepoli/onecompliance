#!/bin/bash

# Legge i dettagli del database
DB_ENDPOINT=`cat /home/ec2-user/db_endpoint.donotremove`
UTF_ENCODER=`jq -r '.UTF_ENCODER' lambda_names.json`
DBF_TO_CSV_CONVERTER=`jq -r '.DBF_TO_CSV_CONVERTER' lambda_names.json`
BACKUP_FILE="/home/ec2-user/sftp/customers/backups/gorico_prod-2_last.backup"

# Calcola il nome del database basato sulla data del giorno precedente
DB_NAME="ripristino_per_test"
SCHEMA_NAME="$DB_NAME"

# Crea uno schema con lo stesso nome del database appena creato nel database "onecompliance"
psql -h $DB_ENDPOINT -U postgres -d onecompliance -c "CREATE SCHEMA IF NOT EXISTS $SCHEMA_NAME;"

# Crea il server FDW per il database appena creato
psql -h $DB_ENDPOINT -U postgres -d onecompliance -c "
    CREATE SERVER IF NOT EXISTS $DB_NAME
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

psql -h $DB_ENDPOINT -U postgres -d onecompliance -c "
    DROP USER MAPPING FOR postgres SERVER $DB_NAME;
"

psql -h $DB_ENDPOINT -U postgres -d onecompliance -c "
    CREATE USER MAPPING FOR postgres 
    SERVER $DB_NAME
    OPTIONS (user 'postgres', password 'run2thehills');
"

psql -h $DB_ENDPOINT -U postgres -d onecompliance -c "
    IMPORT FOREIGN SCHEMA entrasp 
    FROM SERVER $DB_NAME
    INTO $DB_NAME;
"

done
