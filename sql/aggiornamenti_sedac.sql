INSERT INTO entrasp.cpl_trattamenti_dati_categorie(
	codice_azienda, id_trattamento_dati, id_argomento_categoria, tipo)
SELECT 
    'SEDAC' AS codice_azienda,
    id_trattamento_dati,
    id_argomento,
	'misure_tecniche'
FROM 
    entrasp.cpl_trattamenti_dati
CROSS JOIN 
    (VALUES 
        (940), (1172), (2315), (3491), (4066), (4070), 
        (4076), (4105), (4106), (4170), (48945), (48947), (52994)
    ) AS argomenti(id_argomento)
WHERE 
    codice_azienda = 'SEDAC';


	select id_trattamento_Dati, tipo, cd.codice_azienda, id_argomento_categoria
	from entrasp.cpl_trattamenti_dati_categorie cd 
	where cd.id_trattamento_dati=28 and cd.codice_azienda='SEDAC' 
	and tipo='misure_tecniche'
	order by tipo, id_argomento_categoria



WITH CTE AS (
    SELECT 
        codice_azienda,
        id_trattamento_dati,
        id_argomento_categoria,
        tipo,
        note,
        ROW_NUMBER() OVER (
            PARTITION BY codice_azienda, id_trattamento_dati, id_argomento_categoria, tipo
            ORDER BY note NULLS LAST
        ) AS row_num
    FROM 
        entrasp.cpl_trattamenti_dati_categorie
		where codice_azienda='SEDAC'
)
DELETE FROM entrasp.cpl_trattamenti_dati_categorie
WHERE (codice_azienda, id_trattamento_dati, id_argomento_categoria, tipo) IN (
    SELECT codice_azienda, id_trattamento_dati, id_argomento_categoria, tipo
    FROM CTE
    WHERE row_num > 1 and codice_azienda='SEDAC'
) and codice_azienda='SEDAC';


delete from entrasp.cpl_trattamenti_Dati_categorie
where codice_azienda='SEDAC' and tipo!='misure_tecniche' 
and id_argomento_categoria in(940, 1172, 2315, 3491, 4066, 4070, 4076, 4105, 4106, 4170,  48945, 48947, 52994)


select *, entrasp.argomenti_descr(id_argomento_categoria) 
from entrasp.cpl_trattamenti_Dati_categorie
where codice_azienda='SEDAC' and tipo='misure_tecniche'
and id_argomento_categoria in(48945, 4076, 2315)


update entrasp.cpl_trattamenti_Dati_categorie
set note=$$L’accesso ai PC in uso il software è protetto da credenziali (user name e password) personalizzate per ogni utente
Ulteriormente l’accesso ai diversi software in uso è protetto da credenziali (user name e password) personalizzate per ogni utente: le password sono composte da almento 8 carattei alfa numerici.$$
where codice_azienda='SEDAC' and tipo='misure_tecniche'
and id_argomento_categoria in(48945, 4076, 2315)

update entrasp.cpl_trattamenti_Dati_categorie
set note=$$Gli utenti trattamento i dati sulla base del principio di necessità. Per utenti con profili di autorizzazioni più estesi è previsto un processo di autorizzazione da parte della direzione$$
where codice_azienda='SEDAC' and tipo='misure_tecniche'
and id_argomento_categoria in(4070, 4066)


update entrasp.cpl_trattamenti_Dati_categorie
set note=$$i dati personali non possono più essere attribuiti a un interessato specifico senza l'utilizzo di informazioni aggiuntive, a condizione che tali informazioni aggiuntive siano conservate separatamente e soggette a misure tecniche e organizzative intese a
garantire che tali dati personali non siano attribuiti a una persona fisica identificata o identificabile$$
where codice_azienda='SEDAC' and tipo='misure_tecniche'
and id_argomento_categoria in(940)


update entrasp.cpl_trattamenti_Dati_categorie
set note=$$I dati conservati e/o trasmessi sono sottoposti a tecniche di cifratura$$
where codice_azienda='SEDAC' and tipo='misure_tecniche'
and id_argomento_categoria in(1172)


update entrasp.cpl_trattamenti_Dati_categorie
set note=$$Si effettua il backup di tutti i dati almeno settimanalmente.$$
where codice_azienda='SEDAC' and tipo='misure_tecniche'
and id_argomento_categoria in(4106)


update entrasp.cpl_trattamenti_Dati_categorie
set note=$$Si effettuano penetration test per verificare la sicurezza dei dati.$$
where codice_azienda='SEDAC' and tipo='misure_tecniche'
and id_argomento_categoria in(3491)

update entrasp.cpl_trattamenti_Dati_categorie
set note=$$È in funzione su ogni postazione un antivirus munito di licenza e con l’aggiornamento automatico attivato. Si eseguono scansioni antivirus periodiche dei sistemi in automatico e non disattivabili dagli utenti. È attivo un firewall (fisico e/o software)$$
where codice_azienda='SEDAC' and tipo='misure_tecniche'
and id_argomento_categoria in(4105)

update entrasp.cpl_trattamenti_Dati_categorie
set note=$$Il pc è protetto da un gruppo di continuità.$$
where codice_azienda='SEDAC' and tipo='misure_tecniche'
and id_argomento_categoria in(4170, 48947)

update entrasp.cpl_trattamenti_Dati_categorie
set note=$$Si effettuano periodiche prove di ripristino di tutti i dati. I dati eventualmente andati persi per qualsiasi ragione sono ripristinabili da backup in massimo 7 giorni $$
where codice_azienda='SEDAC' and tipo='misure_tecniche'
and id_argomento_categoria in(52994)