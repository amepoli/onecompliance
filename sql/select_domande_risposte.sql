-- FUNCTION: entrasp.select_domande_risposte(character varying, numeric, numeric, numeric, numeric[])
DROP FUNCTION IF EXISTS entrasp.select_domande_risposte(character varying, numeric, numeric, numeric);

CREATE OR REPLACE FUNCTION entrasp.select_domande_risposte(
	codiceaz character varying,
	idsondaggio numeric,
	idsomministrazione numeric,
	idsezione numeric DEFAULT null::numeric,
	elencotag numeric[] DEFAULT NULL::numeric[])
    RETURNS TABLE(codice_azienda character varying, id_domanda numeric, ordinamento numeric, id_tipo_domanda integer, id_domanda_rif numeric, id_risposta_prev_rif numeric, id_modello_test numeric, id_modello_test_vr numeric, descrizione text, note_domanda text, punteggio numeric, id_risultato numeric, id_risposta numeric, id_sondaggio numeric, id_somministrazione numeric, risposta text, risposta_date date, risposta_num numeric, id_risposta_prev_radio numeric, peso_rb numeric, peso_oa numeric, note_rb text, note_mc text, codice_colore_peso_rb_k character varying, codice_colore_peso_oa_k character varying, num_allegati bigint, id_sezione numeric, risposta_multipla numeric[], codice_compito character varying, flag_mostra_punteggi character, equal_notequal character varying, id_argomento_domanda numeric, id_anagrafica numeric, penalizzazione numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
 
 
declare idmodellotest numeric; idmodellotestvr numeric; 
begin 

	if elencotag[1] is not null then
		select array_agg(id_argomento_son)
		from entrasp.argomenti_argomenti aa
		where id_argomento_father=any(elencotag)
		into elencotag;

	--	raise notice 'elencotag: %', elencotag;
	end if;
	
	return query select distinct dm.codice_azienda, dm.id_domanda,dm.ordinamento, dm.id_tipo_domanda, dm.id_domanda_rif, 
	dm.id_risposta_prev_rif, dm.id_modello_test, dm.id_modello_test_vr, dm.descrizione, dm.note, dm.punteggio, 
	dm.id_risultato, rp.id_risposta, dm.id_sondaggio, 
	dm.id_somministrazione, rp.risposta, rp.risposta_date, rp.risposta_num, rp.id_risposta_prev as id_risposta_prev_radio, 
	dm.peso as peso_rb, coalesce(dm.peso,0) as peso_oa, rp.note as note_rb, rp2.note as note_mc, 
	dm.colore as codice_colore_peso_rb_k, dm.colore as codice_colore_peso_oa_k,  
	coalesce(rp.numero_allegati,0) as num_allegati, dm.id_sezione,
	case when dm.id_tipo_domanda=2 then array(select rp3.id_risposta_prev from entrasp.risposte rp3 
											  where rp3.codice_azienda=dm.codice_azienda 
											  and rp3.id_modello_test=dm.id_modello_test 
											  and rp3.id_modello_test_vr=dm.id_modello_test_vr 
											  and rp3.id_domanda=dm.id_domanda and rp3.id_sondaggio=dm.id_sondaggio 
											  and rp3.id_somministrazione=dm.id_somministrazione) else array[null::numeric] end, 
	cm.codice_compito, dm.flag_mostra_punteggi,
	case when dm.flag_non_viene_risposto then 'notEqualTo'::character varying else 'equalTo'::character varying end as equal_notEqual,
	 dm.id_argomento as id_argomento_domanda, 
	 case when dm.object_name = 'anagraficheId' then coalesce(nullif(split_part(dm.object_key,'|',2),'')::numeric, 
															   dm.id_anagrafica) else null end as id_anagrafica,
	 dm.penalizzazione
	from entrasp.select_domande_delle_risposte dm
	left join entrasp.compiti_rif_bo cm on cm.codice_azienda=dm.codice_azienda and cm.id_domanda=dm.id_domanda 
	and cm.id_sondaggio=dm.id_sondaggio and cm.id_somministrazione=dm.id_somministrazione 
	and cm.id_modello_test=dm.id_modello_test and cm.id_modello_test_vr=dm.id_modello_test_vr
	left join (select rs2.* from entrasp.domande dm2 inner join entrasp.risposte rs2 on dm2.codice_azienda=rs2.codice_azienda 
			   and dm2.id_modello_test=rs2.id_modello_test and dm2.id_modello_test_vr=rs2.id_modello_test_vr 
			   and dm2.id_domanda=rs2.id_domanda
			   where dm2.id_tipo_domanda!=2 and rs2.id_somministrazione=idsomministrazione 
			   and rs2.id_sondaggio=idsondaggio and rs2.codice_azienda=codiceaz) rp
	on dm.codice_azienda=rp.codice_azienda and dm.id_modello_test=rp.id_modello_test 
	and dm.id_modello_test_vr=rp.id_modello_test_vr and dm.id_domanda=rp.id_domanda 
	left join (select rs3.* from entrasp.domande dm2 inner join entrasp.risposte rs3 on dm2.codice_azienda=rs3.codice_azienda 
			   and dm2.id_modello_test=rs3.id_modello_test and dm2.id_modello_test_vr=rs3.id_modello_test_vr 
			   and dm2.id_domanda=rs3.id_domanda
			   where dm2.id_tipo_domanda=2 and rs3.id_somministrazione=idsomministrazione 
			   and rs3.id_sondaggio=idsondaggio and rs3.codice_azienda=codiceaz
			  and rs3.note is not null) rp2
	on dm.codice_azienda=rp2.codice_azienda and dm.id_modello_test=rp2.id_modello_test 
	and dm.id_modello_test_vr=rp2.id_modello_test_vr and dm.id_domanda=rp2.id_domanda 
	where dm.id_sondaggio=idsondaggio and dm.id_somministrazione=idsomministrazione and dm.codice_azienda=codiceaz 
	AND dm.flag_non_applicabile_domanda='0' and (idsezione is null or dm.id_sezione=idsezione)
	and (array_length(array_remove(elencotag, NULL), 1) IS NULL OR id_argomento = ANY(elencotag))
	order by dm.id_sezione, dm.ordinamento;  
end
 
 
$BODY$;

ALTER FUNCTION entrasp.select_domande_risposte(character varying, numeric, numeric, numeric, numeric[])
    OWNER TO postgres;

/*

select coalesce(array[null::integer], array[1,2])


select null=null
	
select nullif(array[null::integer], array[null::integer])


*/

/*
select * from entrasp.select_domande_risposte(
	'ASACERT',
	45,
	45,
	2,
	entrasp.trova_tag_contratti_progetto('ASACERT', 45))


select entrasp.trova_tag_contratti_progetto('ASACERT', 45)

*/


-- FUNCTION: entrasp.domanda_active(text, numeric, numeric, numeric, numeric)

DROP FUNCTION IF EXISTS entrasp.domanda_active(text, numeric, numeric, numeric, numeric);

CREATE OR REPLACE FUNCTION entrasp.domanda_active(
	codiceazienda text,
	idmodellotest numeric,
	idmodellotestvr numeric,
	iddomanda numeric,
	idsomministrazione numeric,
	idsondaggio numeric DEFAULT NULL::numeric)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    IMMUTABLE PARALLEL SAFE 
AS $BODY$
declare  active integer;  foreseen_answers  numeric(12,0) []; iddomandarif numeric(12,0); answers_array numeric[]; 
flagnonvienerisposto boolean; flagnonapplicabilesezione boolean; idargomento numeric; elencotag numeric[];

begin

raise notice '*** NUOVA DOMANDA***';

if idsondaggio is null then
	select id_sondaggio
	from entrasp.sondaggi_somministrati
	where codice_azienda=codiceazienda and id_somministrazione=idsomministrazione
	into idsondaggio;
end if;
--raise notice 'idsondaggio: %', idsondaggio;

select entrasp.trova_tag_contratti_progetto(codiceazienda, idsondaggio)
into elencotag;

if elencotag[1] is not null then
		select array_agg(id_argomento_son)
		from entrasp.argomenti_argomenti aa
		where id_argomento_father=any(elencotag)
		into elencotag;
	--	raise notice 'elencotag: %', elencotag;
end if;

raise notice 'elencotag: %', elencotag;

select array(select id_risposta_prev from entrasp.risposte 
             where codice_azienda=codiceazienda and id_somministrazione=idsomministrazione and id_domanda 
             in (select dm.id_domanda_rif from entrasp.domande dm where dm.codice_azienda=codiceazienda and dm.id_modello_test=idmodellotest 
                 and dm.id_modello_test_vr=idmodellotestvr and dm.id_domanda=iddomanda)) into answers_array;

select dm.id_domanda_rif, dm.flag_non_viene_risposto, coalesce(flag_non_applicabile_sezione::boolean, false), dm.id_argomento  
from entrasp.domande dm 
left join entrasp.domande_sezioni ds on
dm.codice_azienda=ds.codice_azienda and dm.id_modello_test=ds.id_modello_test and dm.id_modello_test_vr=ds.id_modello_test_vr and dm.id_sezione=ds.id_sezione
where dm.codice_azienda=codiceazienda and dm.id_modello_test=idmodellotest and  dm.id_modello_test_vr=idmodellotestvr and dm.id_domanda=iddomanda 
into iddomandarif, flagnonvienerisposto, flagnonapplicabilesezione, idargomento;

raise notice 'idargomento: %', idargomento;
--raise notice 'elencotag: %', elencotag;
raise notice  'array_length(array_remove(elencotag, NULL), 1): %', array_length(array_remove(elencotag, NULL), 1);
raise notice 'condizione: %', (array_length(array_remove(elencotag, NULL), 1) IS not NULL and idargomento != ALL(elencotag)); 
raise notice 'array_length(array_remove(elencotag, NULL), 1) IS not NULL: %', array_length(array_remove(elencotag, NULL), 1) IS not NULL;
raise notice 'idargomento != ALL(elencotag): %', idargomento != ALL(elencotag);

if flagnonapplicabilesezione=true 
	or (array_length(array_remove(elencotag, NULL), 1) IS not NULL and idargomento != ALL(elencotag)) then 
    active:=0;
    else
    if iddomandarif is NULL then
        active:=1;
        else
        foreseen_answers:= array(select id_risposta_prev_rif from entrasp.domande where codice_azienda=codiceazienda and id_modello_test=idmodellotest and  id_modello_test_vr=idmodellotestvr and id_domanda=iddomanda);
        if array_length(answers_array,1)>0 then 
    --		raise notice 'answer_array:%',answers_array;		
    --		raise notice 'foreseen_answers:%',foreseen_answers;		
                if flagnonvienerisposto=false then
                    if foreseen_answers<@answers_array then 
            --			raise notice 'caso A';
                        active:=1;
                        else
                        active:=0;
            --			raise notice 'caso B';
                    end if;
                    else
                    if foreseen_answers<@answers_array then 
            --			raise notice 'caso A';
                        active:=0;
                        else
                        active:=1;
            --			raise notice 'caso B';
                    end if;                                
                end if;
            else
                active:=0;
    --			raise notice 'caso C';
        end if;
    end if;
end if;

return active;
end
$BODY$;

ALTER FUNCTION entrasp.domanda_active(text, numeric, numeric, numeric, numeric, numeric)
    OWNER TO postgres;


--select entrasp.domanda_active('ASACERT', 15, 1, 6, 45);


select ss.codice_azienda, dm.id_domanda, dm.descrizione, snd.id_modello_test,  entrasp.domanda_active(snd.codice_azienda,
	snd.id_modello_test,
	snd.id_modello_test_vr,
	dm.id_domanda,
	ss.id_somministrazione)
from entrasp.sondaggi_somministrati ss
	inner join entrasp.sondaggi snd on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio=snd.id_sondaggio
	inner join entrasp.domande dm on snd.codice_azienda=dm.codice_azienda and snd.id_modello_test=dm.id_modello_test
where ss.id_somministrazione=45 and ss.codice_azienda='ASACERT' and dm.id_sezione=2;


-- 6, 7 attive, 9, 10, 12, 13 (per tag)
-- 8, 11 inattiva

-- FUNCTION: entrasp.grc_punteggio_risposte_somministrazione(character varying, numeric)

