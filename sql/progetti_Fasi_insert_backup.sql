-- FUNCTION: entrasp.progetti_fasi_insert(character varying, character varying, numeric, character varying, numeric, character, character varying, numeric, character varying, date, numeric, numeric, character varying, character, timestamp without time zone, character, numeric)

-- DROP FUNCTION IF EXISTS entrasp.progetti_fasi_insert(character varying, character varying, numeric, character varying, numeric, character, character varying, numeric, character varying, date, numeric, numeric, character varying, character, timestamp without time zone, character, numeric);

CREATE OR REPLACE FUNCTION entrasp.progetti_fasi_insert(
	codiceazienda character varying,
	titolo_ character varying,
	idprogetto numeric,
	codiceattivita character varying DEFAULT ''::character varying,
	attivitavr numeric DEFAULT NULL::numeric,
	stato character DEFAULT 'S'::bpchar,
	codicepart character varying DEFAULT ''::character varying,
	idcliente numeric DEFAULT NULL::numeric,
	tipi_risorsa_previsti character varying DEFAULT ''::character varying,
	data_inserimento date DEFAULT CURRENT_DATE,
	id_cliente_sede numeric DEFAULT NULL::numeric,
	id_articolo numeric DEFAULT NULL::numeric,
	codice_variante character varying DEFAULT ''::character varying,
	flag_template character DEFAULT '0'::bpchar,
	ts_last_state timestamp without time zone DEFAULT CURRENT_DATE,
	flag_fatturato character DEFAULT '0'::bpchar,
	id_fattura numeric DEFAULT NULL::numeric)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
 
declare Rec record; maxi numeric; objectname varchar; objectdescription varchar; _objectkey varchar; nome_sequenza text; sequenza_progetti character varying(200); sequenza_progetti_fasi character varying(200); codiceazienda_seq character varying(150); idsondaggio integer; codiceprogetto varchar; maxidfase integer; 
primo_inserimento boolean; maxattivitavr numeric; codicepart varchar;

begin

perform entrasp.progetti_fasi_order(codice_azienda, id_progetto, id_fase)
		from entrasp.progetti_fasi
	where id_progetto=idprogetto
			and codice_azienda=codiceazienda;
			
update entrasp.progetti_fasi
			set codice=entrasp.calculate_progetto_fase_codice(codice_azienda, id_progetto, id_fase)
	where codice_azienda=codiceazienda
			and id_progetto=idprogetto;

if attivitavr is null then
	select max(attivita_vr) from entrasp.attivita 
	where codice_azienda=codiceazienda and codice_attivita=codiceattivita
	into attivitavr;
end if;

select case when count(id_fase)>0 then false else true end 
from entrasp.progetti_fasi where codice_azienda=codiceazienda and id_progetto=idprogetto into primo_inserimento; -- TRUE
--raise notice 'idprogetto: %', idprogetto;
if idprogetto is not null then
	SELECT codice_part FROM entrasp.aziende WHERE codice_azienda=codiceazienda INTO codicepart;
	--sequenza_progetti:='entrasp.id_progetti';
	select coalesce(max(id_fase)::integer,1) from entrasp.progetti_fasi 
	where codice_azienda=codiceazienda into maxidfase; 
	
	sequenza_progetti_fasi:='entrasp.id_progetti_fasi';
	
	perform setval(sequenza_progetti_fasi, maxidfase);
	
	select codice_progetto from entrasp.progetti where codice_azienda=codiceazienda and id_progetto=idprogetto into codiceprogetto;
	-- EXECUTE format('select nextval(%s) into idprogetto;', sequenza_progetti);

	--select max(id_progetto) from entrasp.progetti pr where pr.codice_azienda=codiceazienda into idprogetto;
	--SELECT setval(sequenza_progetti, idprogetto, true) into idprogetto;  
	--select nextval(sequenza_progetti) into idprogetto;

	-- if id_tipo_progetto is null then
		--select pr.id_tipo_progetto from entrasp.cfg_mod_progetti pr where pr.codice_azienda=codiceazienda into id_tipo_progetto;
	--end if;

	--codiceprogetto:=coalesce(codice_progetto,'');

	--if codiceprogetto='' then
	--	select (max(pr.codice_progetto::numeric)+1)::varchar   from entrasp.progetti pr where pr.codice_azienda=codiceazienda and textregexeq(pr.codice_progetto,'^[[:digit:]]+(\.[[:digit:]]+)?$')=true  into codiceprogetto;
	--	codiceprogetto:=coalesce(codiceprogetto,'1');
	
		-- RAISE NOTICE 'Codice progetto(%)', codiceprogetto;
	-- end if;

	--INSERT INTO entrasp.progetti(
	--	codice_azienda, id_progetto,  codice_progetto, ., stato, id_tipo_progetto, codice_part, id_cliente, tipi_risorsa_previsti, data_inserimento, id_cliente_sede, id_articolo, codice_variante, codice_attivita, flag_template, ts_last_state, flag_fatturato, id_fattura)
	--	VALUES (codiceazienda, idprogetto, codiceprogetto, titolo, stato, id_tipo_progetto, codicepart, idcliente, tipi_risorsa_previsti, data_inserimento, id_cliente_sede, id_articolo, codice_variante, flag_template, ts_last_state, flag_fatturato, id_fattura);

	FOR Rec IN (
				SELECT att.descrizione, att.codice_attivita, att.attivita_vr, att.id_modello_test, mt.titolo as tit_mt  
				FROM entrasp.attivita att 
				LEFT JOIN entrasp.modelli_test mt ON att.codice_azienda=mt.codice_azienda AND att.id_modello_test=mt.id_modello_test
				WHERE att.codice_azienda=codiceazienda AND entrasp.grc_codice_attivita_parent(att.codice_azienda, att.codice_attivita, att.attivita_vr)=codiceattivita 
				AND att.codice_attivita_parent IS NOT null 	AND att.attivita_vr=attivitavr
				AND att.codice_attivita||'-'||att.codice_azienda NOT IN (SELECT pf.codice_attivita||'-'||pf.codice_azienda 
																		 FROM entrasp.progetti_fasi pf 
																		 WHERE pf.id_progetto=idprogetto  AND codice_azienda=codiceazienda)
				ORDER BY att.codice_attivita_parent ASC, att.ordinamento ASC
				)
	
	LOOP
	
--	  raise notice 'ci siamo';
		if idcliente is not null then
			objectname:='anagraficheId';
			_objectkey:=codiceazienda||'|'||idcliente;
			select entrasp.anagrafiche_vr_dati_identificativi((select codice_part from entrasp.aziende where codice_azienda=codiceazienda), idcliente) into objectdescription;
		end if;
		idsondaggio=null;

		if Rec.id_modello_test is not null then
--		raise notice 'tit_mt:%', Rec.tit_mt;
	--		raise notice 'titolo_:%', titolo_;
		--	raise notice 'titolo_sondaggio:%', substring(coalesce(Rec.tit_mt,'')||'('||coalesce(titolo_,'')||')', 1, 239);	
--	raise notice 'sondaggio_insert';
			select entrasp.sondaggio_insert(codiceazienda, substring(coalesce(Rec.tit_mt,'')||' ('||coalesce(titolo_,'')||')', 1, 239) , Rec.id_modello_test, (select max(mvr.id_modello_test_vr) from entrasp.modelli_test_vr mvr where mvr.codice_azienda=codiceazienda and mvr.id_modello_test=Rec.id_modello_test), coalesce(data_inserimento, current_date), true, null::numeric, documentazione_necessaria, descrizione, idcliente, id_centro_gest, false) from entrasp.modelli_test mt where mt.codice_azienda=codiceazienda and mt.id_modello_test=Rec.id_modello_test into idsondaggio;
			raise notice 'update entrasp.sondaggi';
			update entrasp.sondaggi set codice_part=(select codice_part from entrasp.aziende where codice_azienda=codiceazienda) where codice_azienda=codiceazienda and id_sondaggio=idsondaggio;
		--	raise notice 'objectname: %', objectname;
		--	raise notice 'id_modello_test: %', Rec.id_modello_test;
--		raise notice 'INSERISCO VERIFICA';
			
			INSERT INTO entrasp.sondaggi_somministrati (codice_azienda, codice_part, id_sondaggio, id_somministrazione, id_anagrafica, object_name, object_key, object_description) 
			values (codiceazienda, codicepart, idsondaggio , (SELECT coalesce(max(id_somministrazione),0) +1 FROM entrasp.sondaggi_somministrati where codice_azienda=codiceazienda), idcliente, objectname, _objectkey, (select sp.objectdescription from entrasp.survey_population(codiceazienda, idsondaggio::integer, '|') sp where sp.objectkey=_objectkey));

			--perform entrasp.sondaggio_somministrato_insert(codiceazienda, idsondaggio::numeric, NULL, idcliente, objectname, _objectkey, coalesce(data_inserimento, current_date)) ;
		end if;
/*
			raise notice 'id_sondaggio:%', idsondaggio;
			raise notice 'id_progetto:%', idprogetto;
			raise notice 'codice_attivita: %', Rec.codice_attivita;
			raise notice 'codice_progetto: %', codiceprogetto;
*/

--		raise notice 'INSERT INTO entrasp.progetti_fasi';
		INSERT INTO entrasp.progetti_fasi(
		codice, codice_azienda, id_fase, 
			id_progetto, titolo, tipo_fase, 
			stato, qta, codice_attivita, attivita_vr, id_sondaggio, ordinamento)
		select codiceprogetto||'.'||ordinamento, 
			   codice_azienda, 
				nextval(sequenza_progetti_fasi), 
				idprogetto,	descrizione, tipo_fase, 
				'P', 0, Rec.codice_attivita, Rec.attivita_vr, idsondaggio, ordinamento 
		from entrasp.attivita where codice_azienda=codiceazienda and codice_attivita=Rec.codice_attivita 
		and attivita_vr=Rec.attivita_vr
		on conflict do nothing;
	
--		raise notice 'update entrasp.progetti_fasi pf';
		if primo_inserimento then
			update entrasp.progetti_fasi pf set 
			id_fase_sup=pf2.id_fase
			from entrasp.attivita att, entrasp.progetti_fasi pf2
			where pf.codice_attivita=att.codice_attivita and pf.codice_azienda=att.codice_azienda and pf.attivita_vr=att.attivita_vr
			and att.codice_attivita_parent=pf2.codice_attivita and att.codice_azienda=pf2.codice_azienda and att.attivita_vr=pf2.attivita_vr
			and pf.id_progetto=pf2.id_progetto and pf.codice_azienda=pf2.codice_azienda and pf.id_progetto=idprogetto and pf.codice_azienda=codiceazienda;
		end if;

	end loop;  
end if;
--return idprogetto;

-- con il comando che segue aggiono le date previste dei sondaggi previsti sulla base della data di avvio del progetto 
--e del parametro  gg_scadenza_da_avvio_progetto settato nella fase associata a cuascun progetto 
	update entrasp.sondaggi snd
	set data_prevista=prg.data_inserimento+ att.gg_scadenza_da_avvio_progetto*interval '1 day'
	from entrasp.progetti prg, entrasp.progetti_fasi pf, entrasp.attivita att
	where pf.codice_attivita=att.codice_attivita and pf.codice_azienda=att.codice_azienda and pf.attivita_vr=att.attivita_vr
	and prg.id_progetto=pf.id_progetto and prg.codice_azienda=pf.codice_azienda
	and pf.id_sondaggio=snd.id_sondaggio and pf.codice_azienda=snd.codice_azienda
	and att.gg_scadenza_da_avvio_progetto is not null
	and prg.id_progetto=idprogetto and prg.codice_azienda=codiceazienda;

-- aggiorna codici alla fine ... per due volte di seguito gli stessi comandi. Non so perchè ma funziona così.

perform entrasp.progetti_fasi_order(codice_azienda, id_progetto, id_fase) from entrasp.progetti_fasi 
where id_progetto=idprogetto and codice_azienda=codiceazienda; 

update entrasp.progetti_fasi set codice=entrasp.calculate_progetto_fase_codice(codice_azienda, id_progetto, id_fase) 
where codice_azienda=codiceazienda and id_progetto=idprogetto;

perform entrasp.progetti_fasi_order(codice_azienda, id_progetto, id_fase) from entrasp.progetti_fasi 
where id_progetto=idprogetto and codice_azienda=codiceazienda; 

update entrasp.progetti_fasi set codice=entrasp.calculate_progetto_fase_codice(codice_azienda, id_progetto, id_fase) 
where codice_azienda=codiceazienda and id_progetto=idprogetto;

update entrasp.progetti set stato='S'
where codice_azienda=codiceazienda and id_progetto=idprogetto;

end
 
$BODY$;

ALTER FUNCTION entrasp.progetti_fasi_insert(character varying, character varying, numeric, character varying, numeric, character, character varying, numeric, character varying, date, numeric, numeric, character varying, character, timestamp without time zone, character, numeric)
    OWNER TO postgres;
