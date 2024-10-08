SCRIPT DA COPIARE
Considera il file excel allegato che descrive la struttura degli oggetti del database postgres che ti chiedo di analizzare. 
Per ogni riga mi indica: 
a) nella colonna data_base_name il data base di riferimento, 
b) nella colonna schema_name lo schema di riferimento, 
c) nella colonna object_type il tipo di oggettto; 
d) nella colonna object_name il nome dell'oggetto; 
e) nella colonna script il codice che ha creato l'oggetto; 
f) nella colonna triggering_event, per i soli trigger le condizioni a cui avviene l'evento (peraltro ti chiedo di far riferimento alla colonna script che è più completa e precisa)



SELECT * FROM get_db_structure(
    'oencompliance',                         -- Database
    'entrasp',        -- Schemi
    'sondaggi,  sondaggi_somministrati, risposte, compiti' 
);
