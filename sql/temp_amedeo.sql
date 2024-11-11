select ans.codice_azienda, mt.id_modello_test, ans.id_sondaggio, mt.descrizione, qc.processo, 
	entrasp.argomenti_descr_breve_no_id(ac.id_argomento_tipo_norma) as norma, 
	entrasp.anagrafiche_cognnome(cnt.codice_part, cnt.id_cliente) as ragione_sociale, 
	giornate_uomo_scontate,
	giornate_uomo_sorveglianza,
	cnt.id_contratto,
	(select string_agg(soc.citta||', '||soc.indirizzo, '; ') from entrasp.sedi_operative_questionari soc 
	where soc.id_questionario=qc.id_questionario and soc.codice_azienda=qc.codice_azienda)as sedi, 
	(select string_agg(entrasp.argomenti_descr_breve_no_id(unnest), '; ') from unnest(ac.id_argomento_settore))as settore, 
	string_agg(entrasp.anagrafiche_cognnome(ans.codice_part, ans.id_anagrafica)||' ('||entrasp.argomenti_descr_breve_no_id(id_argomento_liv_competenza)||')', '; ') as auditors 
	from entrasp.anagrafiche_sondaggi ans
	inner join entrasp.sondaggi snd
	on ans.codice_azienda=snd.codice_azienda and ans.id_sondaggio=snd.id_sondaggio
	inner join entrasp.modelli_test mt
	on snd.codice_azienda=mt.codice_azienda and snd.id_modello_test=mt.id_modello_test
	inner join entrasp.argomenti_argomenti amt
	on mt.id_argomento=amt.id_argomento_son
	inner join entrasp.contratti cnt
	on snd.codice_azienda=cnt.codice_azienda and snd.id_contratto=cnt.id_contratto
	inner join entrasp.articoli_contratti ac
	on cnt.codice_azienda=ac.codice_azienda and cnt.id_contratto=ac.id_contratto
	inner join entrasp.questionari_certificazione qc
	on cnt.codice_azienda=qc.codice_azienda and cnt.id_contratto=qc.id_contratto
	where amt.id_argomento_father=ac.id_argomento_tipo_norma
	and ans.codice_azienda='ASACERT' and ans.id_sondaggio=69  
	group by sedi, ans.codice_azienda, ans.id_sondaggio, mt.id_modello_test, mt.descrizione, 
	qc.processo, giornate_uomo_scontate,
	giornate_uomo_sorveglianza,
	cnt.id_contratto, 
	cnt.codice_part, cnt.id_cliente, ac.id_argomento_settore, ac.id_argomento_tipo_norma
	order by ans.codice_azienda, cnt.id_cliente, mt.id_modello_test, mt.id_modello_test 