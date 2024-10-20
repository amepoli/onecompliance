SELECT * FROM entrasp.tipi_domande
ORDER BY id_tipo_domanda ASC 


select codice_azienda, id_modello_test, id_modello_Test_vr, id_domanda, descrizione, id_tipo_domanda from entrasp.domande
where codice_Azienda='DEMO' and id_modello_test=50

SELECT * FROM entrasp.risposte_previste
where codice_azienda='DEMO' and id_modello_test=50

SELECT entrasp.crea_json_verifica('DEMO',50,1, 235,255)


select codice_azienda, id_sondaggio from entrasp.sondaggi snd
inner join entrasp.domande dm
using (codice_azienda, id_modello_test, id_modello_test_vr)
where dm.id_tipo_domanda in (3, 5, 6, 7)
order by codice_azienda

1	"Radio button (risposta singola)"	
2	"Risposta multipla"	
3	"Risposta aperta"	
4	"Risposta tabellare"	
5	"Numero"	
6	"Data"	
7	"Combobox/ menù a tendina (risposta singola)"	