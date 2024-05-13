select rs2.id_domanda, rs2.id_risposta, rs2.id_risposta_prev, rs2.codice_azienda, rs2.id_sondaggio, rs2.id_somministrazione, rs2.id_modello_test, rs2.id_modello_test_vr  from entrasp.risposte rs2
	where rs2.codice_azienda||rs2.id_sondaggio||rs2.id_somministrazione||rs2.id_modello_test||rs2.id_modello_test_vr||rs2.id_domanda
in(select rs.codice_azienda||rs.id_sondaggio||rs.id_somministrazione||rs.id_modello_test||rs.id_modello_test_vr||rs.id_domanda  
	from entrasp.risposte rs
	inner join entrasp.domande dm
	using (codice_azienda, id_modello_test, id_modello_test_vr, id_domanda)
where dm.id_tipo_domanda not in(2, 3)
	group by rs.id_sondaggio, rs.id_somministrazione, rs.codice_azienda, rs.id_modello_test, rs.id_modello_test_vr, rs.id_domanda
having count(rs.id_risposta) >1
)
order by rs2.codice_azienda, rs2.id_sondaggio, rs2.id_somministrazione, rs2.id_modello_test, rs2.id_modello_test_vr, rs2.id_domanda


select rs.codice_azienda, rs.id_sondaggio, rs.id_somministrazione, rs.id_modello_test, rs.id_modello_test_vr, rs.id_domanda, count(rs.id_risposta)  
	from entrasp.risposte rs
	inner join entrasp.domande dm
	using (codice_azienda, id_modello_test, id_modello_test_vr, id_domanda)
where dm.id_tipo_domanda!=2
	group by rs.id_sondaggio, rs.id_somministrazione, rs.codice_azienda, rs.id_modello_test, rs.id_modello_test_vr, rs.id_domanda
having count(rs.id_risposta) >1
order by rs.codice_azienda


select * from entrasp.risposte
where codice_azienda='INVESTIRE' and id_sondaggio=770 and id_somministrazione=1997;

select * from entrasp.risposte
where codice_azienda='INVESTIRE' and id_sondaggio=770 and id_somministrazione=1989

select entrasp.risposte_update_insert(codiceazienda=>'INVESTIRE'::varchar, 
	idmodellotest=>336::numeric, idrisposta=>null, 
	risposta_=>null::text, iddomanda=>1::numeric, 
	idrispostaprev=>(case when 1=7 then null::numeric else entrasp.evaluate_given_field_null('id_risposta_prev_radio', '92975')::numeric end), 
	idsondaggio=>770::numeric, 
	idsomministrazione=>1997::numeric, 
	punteggio_=>90.00::numeric, peso_=>coalesce(0, 0.00, null, null)::numeric, 
	note_=>entrasp.note_domanda(1, null, null, null), 
	idmodellotestvr=>1::numeric, punteggiorisposta=>null::numeric, rispostamultipla=>'[]'::varchar);

select entrasp.risposte_update_insert(codiceazienda=>'INVESTIRE'::varchar, idmodellotest=>336::numeric, idrisposta=>null::numeric, risposta_=>null::text, iddomanda=>1::numeric, idrispostaprev=>(case when 1=7 then null::numeric else entrasp.evaluate_given_field_null('id_risposta_prev_radio', '92975')::numeric end), idsondaggio=>770::numeric, idsomministrazione=>1997::numeric, punteggio_=>90.00::numeric, peso_=>coalesce(entrasp.evaluate_given_field_null('peso_oa', '0')::numeric, entrasp.evaluate_given_field_null('peso_rb', '0.00')::numeric, entrasp.evaluate_given_field_null('peso_mc', 'null')::numeric), note_=>entrasp.note_domanda(1, null, null, null), idmodellotestvr=>1::numeric, punteggiorisposta=>null::numeric, rispostamultipla=>'[]'::varchar);