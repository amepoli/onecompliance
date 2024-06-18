-- FUNCTION: entrasp.grc_punteggio_risposte_somministrazione(character varying, numeric)

--DA VERIFICARE

DROP FUNCTION IF EXISTS entrasp.grc_punteggio_risposte_somministrazione(character varying, numeric);

CREATE OR REPLACE FUNCTION entrasp.grc_punteggio_risposte_somministrazione(
	codiceaz character varying,
	idsomministrazione numeric,
	idsondaggio numeric default null::numeric)
    RETURNS TABLE(codiceazienda character varying, id_somministrazione numeric, punteggio numeric, punteggiomax numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    immutable PARALLEL SAFE
    ROWS 1000

AS $BODY$
declare  idmodellotest numeric(12,0); idmodellotestvr numeric(12,0);somma numeric;  
punteggio_max numeric; riduz_denominatore_na numeric;
begin 

if idsondaggio is null then
	select id_sondaggio
	from entrasp.sondaggi_somministrati
	where codice_azienda=codiceaz and id_somministrazione=idsomministrazione
	into idsondaggio limit 1;
end if;

--raise notice 'idsondaggio: %', idsondaggio;

return query(select codiceaz, idsomministrazione, round(sum(rp.peso*rp.punteggio)/100,2), 
	round(sum(rp.punteggio)-sum(rp.punteggio*rp.flag_non_applicabile::integer/100),2) 
	from entrasp.risposte rp where  
entrasp.domanda_active(rp.codice_azienda, rp.id_modello_test, rp.id_modello_test_vr, 
	rp.id_domanda, rp.id_somministrazione, rp.id_sondaggio)=1 
and rp.codice_azienda=codiceaz and rp.id_somministrazione=idsomministrazione 
	and rp.id_sondaggio=idsondaggio);

end ;
$BODY$;

ALTER FUNCTION entrasp.grc_punteggio_risposte_somministrazione(character varying, numeric, numeric)
    OWNER TO postgres;

select * from entrasp.grc_punteggio_risposte_somministrazione('FININTSGR', 7203, 7302)
