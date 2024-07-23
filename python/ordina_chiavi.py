def ordina_e_rimuovi_duplicate(input_file, output_file):
    try:
        # Leggi tutte le righe dal file di input
        with open(input_file, 'r', encoding='utf-8') as file:
            lines = file.readlines()

        # Dizionario per tracciare le righe uniche in base alla parte prima dei due punti
        unique_lines_dict = {}
        
        for line in lines:
            stripped_line = line.strip()
            key = stripped_line.split(':')[0] if ':' in stripped_line else stripped_line
            if key not in unique_lines_dict:
                unique_lines_dict[key] = stripped_line

        # Ottieni le righe uniche dal dizionario
        unique_lines = list(unique_lines_dict.values())

        # Ordina le righe alfabeticamente senza distinguere tra maiuscole e minuscole
        sorted_lines = sorted(unique_lines, key=lambda line: line.lower())

        # Scrivi le righe ordinate e uniche nel file di output
        with open(output_file, 'w', encoding='utf-8') as file:
            file.write('\n'.join(sorted_lines) + '\n')

        print(f"Le righe sono state ordinate, duplicate rimosse, e salvate in {output_file}")
    except Exception as e:
        print(f"Errore: {e}")

# Esempio di utilizzo
input_file_path = '/home/gcrozzolin/Development/onecompliance/python/file_new_translate.txt'  # Sostituisci con il percorso del tuo file di input
output_file_path = '/home/gcrozzolin/Development/onecompliance/python/chiavi_ordinate.txt'  # Sostituisci con il percorso del tuo file di output

ordina_e_rimuovi_duplicate(input_file_path, output_file_path)

