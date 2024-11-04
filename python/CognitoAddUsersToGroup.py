import boto3

# Configura il client Cognito
client = boto3.client('cognito-idp', region_name='eu-central-1')

# ID del tuo user pool
user_pool_id = 'eu-central-1_pg3Vcup3R'

# Nome del gruppo a cui si desidera aggiungere gli utenti
group_name = 'NomeDelGruppo'

# Elenco di utenti da aggiungere al gruppo
user_list = ['username1', 'username2', 'username3']  # Sostituisci con gli username effettivi

# Funzione per aggiungere ciascun utente al gruppo specificato
def add_users_to_group(user_list, group_name):
    for username in user_list:
        try:
            # Aggiungi l'utente al gruppo
            client.admin_add_user_to_group(
                UserPoolId=user_pool_id,
                Username=username,
                GroupName=group_name
            )
            #   print(f"Utente {username} aggiunto al gruppo {group_name} con successo.")
        except client.exceptions.ResourceNotFoundException:
            print(f"Errore: l'utente {username} o il gruppo {group_name} non esiste.")
        except client.exceptions.UserNotFoundException:
            print(f"Errore: l'utente {username} non esiste nel pool di utenti.")
        except Exception as e:
            print(f"Errore sconosciuto per l'utente {username}: {e}")

# Esegui la funzione
add_users_to_group(user_list, group_name)