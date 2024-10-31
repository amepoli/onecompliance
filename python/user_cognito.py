import boto3
import os

# Configura il client per Cognito con il servizio e la regione corretti
client = boto3.client('cognito-idp', region_name='eu-central-1')

# ID del tuo user pool
user_pool_id = 'eu-central-1_pg3Vcup3R'

# Percorso relativo del file di output
output_file_path = os.path.join(os.getcwd(), 'user_cognito.txt')

# Funzione per verificare lo stato MFA, email, username, stato di conferma e gruppo di appartenenza per tutti gli utenti con paginazione
def get_mfa_status():
    paginator = client.get_paginator('list_users')
    page_iterator = paginator.paginate(UserPoolId=user_pool_id)

    # Apri il file di output in modalità scrittura
    with open(output_file_path, 'w') as file:
        # Itera attraverso le pagine degli utenti
        for page in page_iterator:
            # Itera attraverso gli utenti in ogni pagina e controlla lo stato MFA
            for user in page['Users']:
                username = user['Username']
                user_details = client.admin_get_user(UserPoolId=user_pool_id, Username=username)

                # Controlla lo stato MFA tramite UserMFASettingList e PreferredMfaSetting
                mfa_status = 'Enabled' if ('PreferredMfaSetting' in user_details and user_details['PreferredMfaSetting']) or ('MFAOptions' in user and user['MFAOptions']) else 'Disabled'
                
                # Inizializza variabili per email e stato di conferma
                email = ""
                confirmed_status = user_details['UserStatus']  # Stato di conferma dell'utente
                
                # Cerca email tra gli attributi dell'utente
                for attribute in user_details['UserAttributes']:
                    if attribute['Name'] == 'email':
                        email = attribute['Value']

                # Ottieni i gruppi di appartenenza dell'utente
                groups_response = client.admin_list_groups_for_user(UserPoolId=user_pool_id, Username=username)
                groups = [group['GroupName'] for group in groups_response['Groups']] if 'Groups' in groups_response else []
                group_list = ', '.join(groups) if groups else 'No groups'
                
                # Scrivi le informazioni dell'utente nel file
                file.write(f"Username: {username}, MFA Status: {mfa_status}, Email: {email}, Confirmed Status: {confirmed_status}, Groups: {group_list}\n")
    print("Done")

# Chiama la funzione
get_mfa_status()
