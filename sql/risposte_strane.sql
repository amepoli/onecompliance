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