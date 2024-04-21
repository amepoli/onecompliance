
select  ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione, 
	ri.id_indicatore,  entrasp.calcola_ind_pers(ri.id_indicatore, snd.codice_azienda, snd.id_sondaggio, ss.id_somministrazione)
from entrasp.sondaggi_somministrati ss
inner join entrasp.sondaggi snd on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio=snd.id_sondaggio
inner join entrasp.modelli_test mt on snd.codice_azienda=mt.codice_azienda and snd.id_modello_test=mt.id_modello_test
inner join entrasp.argomenti_report ar on mt.id_argomento=ar.id_argomento
inner join entrasp.indicatori_report ri on ar.id_report=ri.id_report
	where snd.codice_azienda='FININTSGR' and snd.id_sondaggio=5810 and ss.id_somministrazione=5781

select id_indicatore, sql_indicatore
from entrasp.indicatori
where id_indicatore=261
/*
select  ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione, ri.id_indicatore
from entrasp.sondaggi_somministrati ss
inner join entrasp.sondaggi snd on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio=snd.id_sondaggio
inner join entrasp.modelli_test mt on snd.codice_azienda=mt.codice_azienda and snd.id_modello_test=mt.id_modello_test
inner join entrasp.argomenti_report ar on mt.id_argomento=ar.id_argomento
inner join entrasp.indicatori_report ri on ar.id_report=ri.id_report
	where snd.codice_azienda='FININTSGR' and snd.id_sondaggio=5810 and ss.id_somministrazione=5781
*/
/*
select  ss.codice_azienda, ss.id_sondaggio, ss.id_somministrazione --, ri.id_indicatore
from entrasp.sondaggi_somministrati ss
inner join entrasp.sondaggi snd on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio=snd.id_sondaggio
--inner join entrasp.modelli_test mt on snd.codice_azienda=mt.codice_azienda and snd.id_modello_test=mt.id_modello_test
-- inner join entrasp.argomenti_report ar on mt.id_argomento=ar.id_argomento
-- inner join entrasp.indicatori_report ri on ar.id_report=ri.id_report
	where snd.codice_azienda='FININTSGR' and snd.id_sondaggio=5810 and snd.id_somministrazione=5781
*/


