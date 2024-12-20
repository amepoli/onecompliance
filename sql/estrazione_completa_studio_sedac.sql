select td.id_trattamento_dati, td.titolo as trattamento_dati, td.descrizione, td.flag_trattamento_conto_terzi, td.termini_ultimi_cancellazione, entrasp.argomenti_descr_breve_no_id(td.id_argomento_conferimento) as tipo_conferimento, 
string_agg(entrasp.argomenti_descr_breve_no_id(tdc.id_argomento_categoria), '; ') as categorie_interessati,   
string_agg(entrasp.argomenti_descr_breve_no_id(tdcd.id_argomento_categoria), '; ') as categorie_destinatari,   
string_agg(entrasp.argomenti_descr_breve_no_id(tdf.id_argomento_finalita)||' ('||entrasp.finalita_e_basi_giuridiche_from_trattamento_dati(td.codice_azienda, td.id_trattamento_dati, tdf.id_argomento_finalita)||')', ';') as finalita_trattamento, 
string_agg(distinct entrasp.anagrafiche_cognnome(tdr.codice_part, tdr.id_responsabile), '; ') as responsabili,
string_agg(entrasp.anagrafiche_cognnome(tdt.codice_part, tdt.id_titolare_esterno), '; ') as titolari
from entrasp.cpl_trattamenti_dati td  
left join entrasp.cpl_trattamenti_dati_categorie tdc 
on td.codice_azienda=tdc.codice_azienda and td.id_trattamento_dati=tdc.id_trattamento_dati
and ( tdc.tipo is null or tdc.tipo='categorie_interessati')
left join entrasp.cpl_trattamenti_dati_categorie tdcd 
on td.codice_azienda=tdcd.codice_azienda and td.id_trattamento_dati=tdcd.id_trattamento_dati
and (tdcd.tipo is null or tdcd.tipo='categorie_destinatari')
left join entrasp.cpl_trattamenti_dati_responsabili tdr 
on td.codice_azienda=tdr.codice_azienda and td.id_trattamento_dati=tdr.id_trattamento_dati
left join entrasp.cpl_trattamenti_dati_titolari_esterni tdt 
on td.codice_azienda=tdt.codice_azienda and td.id_trattamento_dati=tdt.id_trattamento_dati
left join entrasp.cpl_trattamenti_dati_finalita tdf on td.codice_azienda=tdf.codice_azienda and td.id_trattamento_dati=tdf.id_trattamento_dati 
where td.codice_azienda='SEDAC' 
group by td.id_trattamento_dati, td.id_argomento_conferimento, td.titolo, td.descrizione, td.flag_trattamento_conto_terzi, td.termini_ultimi_cancellazione
order by td.id_trattamento_dati;

-- query per estrazione definitiva

with misure_sicurezza_values as (
    select unnest(array[
	$$Lo studio deve essere dotato di uno o più  amministratore di sistema - di provata esperienza - con nomina conferita in forma scritta$$, 
	$$Ogni PC deve essere protetto da credenziali (id e password)$$, 
	$$I sofware impiegati per gli adempimenti dei clienti  devono prevedere che l'accesso sia subordinato all'inserimento di credenziali$$, 
	$$Le password devono essere di almento 8 caratteri$$, $$Le password non devono contenere nomi propri o date di nascita o codici fiscali$$, 
	$$Ogni password deve scadere dopo 3 mesi dalla sua creazione. $$, $$Ogni password non può essere riutilizzata prima di 3 volte$$, 
	$$Ogni user ID deve essere associata univocamente ad un utente$$, $$In caso di interruzione del rapporto di lavoro le credenziali devono essere disattivate$$, 
	$$Ogni PC deve prevedere che il salvashermo si attivi entro 5 minuti e si riattivi con password$$, 
	$$Ogni utente può utilizzare esclusivametne i dati per cui è autorizzato all'uso$$, 
	$$Almeno annualmente verificare la sussistenza in capo all’utente delle condizioni per la conservazione dei profili di autorizzazione$$, 
	$$Lo studio deve sempre essere in possesso di un antivirus munito di licenza e con l’aggiornamento automatico attivato e di un firewall (fisico e/o software)$$, 
	$$Prevedere scansioni antivirus periodiche dei sistemi in automatico $$, $$I software devono essere aggiornati almeno annualmente$$, 
	$$Lo studio deve essere sempre dotato di un gruppo di continuità funzionante$$, $$Effettuare il backup di tutti i dati  con cadenza giornalierà o almeno settimanalmente$$, 
	$$Il sistema informativo deve consentire che i dati siano ripristinabili da backup in massimo 7 giorni in caso di loro perdita $$, 
	$$Ridurre al minimo l'utilizzo di documenti cartacei contenenti Dati Personali$$, $$Evitare di stampare file digitali contenenti Dati Personali $$, 
	$$I documenti cartacei contenenti Dati Personali la cui finalità di trattamento non sia conclusa, devono essere conservati in archivi il cui accesso sia protetto da chiave$$, 
	$$Evitare di lasciare incustoditi documenti cartacei contenenti Dati Personali$$

]) as misura_sicurezza
)
select 
    td.id_trattamento_dati, 
    td.titolo as trattamento_dati, 
    td.descrizione, 
    td.flag_trattamento_conto_terzi, 
    td.termini_ultimi_cancellazione, 
    entrasp.argomenti_descr_breve_no_id(td.id_argomento_conferimento) as tipo_conferimento, 
    string_agg(entrasp.argomenti_descr_breve_no_id(tdc.id_argomento_categoria), '; ') as categorie_interessati, 
    string_agg(entrasp.argomenti_descr_breve_no_id(tdcd.id_argomento_categoria), '; ') as categorie_destinatari, 
    string_agg(
        entrasp.argomenti_descr_breve_no_id(tdf.id_argomento_finalita) || 
        ' (' || 
        entrasp.finalita_e_basi_giuridiche_from_trattamento_dati(td.codice_azienda, td.id_trattamento_dati, tdf.id_argomento_finalita) || ')', 
        ';'
    ) as finalita_trattamento, 
    string_agg(distinct entrasp.anagrafiche_cognnome(tdr.codice_part, tdr.id_responsabile), '; ') as responsabili, 
    string_agg(entrasp.anagrafiche_cognnome(tdt.codice_part, tdt.id_titolare_esterno), '; ') as titolari,
    msv.misura_sicurezza
from 
    entrasp.cpl_trattamenti_dati td
left join 
    entrasp.cpl_trattamenti_dati_categorie tdc 
on 
    td.codice_azienda = tdc.codice_azienda 
    and td.id_trattamento_dati = tdc.id_trattamento_dati
    and (tdc.tipo is null or tdc.tipo = 'categorie_interessati')
left join 
    entrasp.cpl_trattamenti_dati_categorie tdcd 
on 
    td.codice_azienda = tdcd.codice_azienda 
    and td.id_trattamento_dati = tdcd.id_trattamento_dati
    and (tdcd.tipo is null or tdcd.tipo = 'categorie_destinatari')
left join 
    entrasp.cpl_trattamenti_dati_responsabili tdr 
on 
    td.codice_azienda = tdr.codice_azienda 
    and td.id_trattamento_dati = tdr.id_trattamento_dati
left join 
    entrasp.cpl_trattamenti_dati_titolari_esterni tdt 
on 
    td.codice_azienda = tdt.codice_azienda 
    and td.id_trattamento_dati = tdt.id_trattamento_dati
left join 
    entrasp.cpl_trattamenti_dati_finalita tdf 
on 
    td.codice_azienda = tdf.codice_azienda 
    and td.id_trattamento_dati = tdf.id_trattamento_dati
cross join 
    misure_sicurezza_values msv -- Cross join con la tabella dei valori
where 
    td.codice_azienda = 'SEDAC'
group by 
    td.id_trattamento_dati, 
    td.id_argomento_conferimento, 
    td.titolo, 
    td.descrizione, 
    td.flag_trattamento_conto_terzi, 
    td.termini_ultimi_cancellazione, 
    msv.misura_sicurezza
order by 
    td.id_trattamento_dati, 
    msv.misura_sicurezza;



