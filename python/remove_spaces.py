import re

def process_text(input_text):
    # Rimuovi gli "a capo" e sostituisci le tabulazioni con spazi
    text_no_newlines_tabs = input_text.replace('\n', ' ').replace('\t', ' ')
    # Riduci tutti gli spazi multipli ad un solo spazio
    text_single_space = re.sub(' +', ' ', text_no_newlines_tabs)
    return text_single_space

# Leggi il testo da un file di input
with open('input.txt', 'r', encoding='utf-8') as file:
    input_text = file.read()

# Elabora il testo
processed_text = process_text(input_text)

# Salva il testo elaborato in un file di output
with open('output.txt', 'w', encoding='utf-8') as file:
    file.write(processed_text)

print("Elaborazione completata.")

## python remove_spaces.py