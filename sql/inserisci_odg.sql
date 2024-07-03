CREATE OR REPLACE FUNCTION entrasp.crea_odg_template(
	codiceazienda varchar,
	idtemplateodg numeric,
	idcontratto numeric,
	idtemplateriunioni numeric,
	idargomentosettori numeric[] DEFAULT NULL::numeric[],
	idanagrafica[] DEFAULT NULL::numeric[],
	durata numeric DEFAULT NULL::numeric,
	orainizio numeric DEFAULT NULL::numeric,
  datariunione timestamp DEFAULT ('now'::text)::date,
	idargomentofunzione numeric[] DEFAULT NULL::numeric[],
	cantiere_ text DEFAULT NULL::text,
	idargomentocontrollo numeric DEFAULT NULL::numeric,
	idodg numeric [] DEFAULT NULL::numeric[])
    RETURNS text
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
maxidodg numeric; idriunione numeric; codicepart varchar; titolo text;

select id_riunione from entrasp.riunioni where codice_azienda=codiceazienda and id_contratto=idcontratto into idriunione;


if idriunione is null then 
	select coalesce (max (id_riunione),0)+1
		from entrasp.riunioni where codice_azienda=codiceazienda into idriunione;
		
		insert into entrasp.riunioni(codice_azienda, id_riunione, codice_part, data_riunione, oggetto, id_contratto) 
		
		select codiceazienda,
							idriunione,
							datariunione,
							'Piano di Certificazione del contratto: '||entrasp.contratti_descr_completa(idcontratto, codiceazienda),
							idcontratto;

end if;			 
IF idodg is null then

				select coalesce (max(id_odg),0)+1 from entrasp.odg_riunioni
					where codice_azienda=codiceazienda and id_riunione=idriunione
					into maxidodg;


				IF idargomentosettori IS NOT NULL THEN
								FOR idargomentosettore IN SELECT unnest(idargomentosettori)
								LOOP
										INSERT INTO entrasp.odg_riunioni (
												codice_azienda,
												id_riunione,
												id_odg,
												ordinamento_odg,
												titolo,
												id_argomento_settore,
												durata,
												ora_inizio,
												ora_fine
												data_riunione,
												cantiere,
												id_argomento_controllo,
												id_argomento_funzione,
												id_templ_odg,
												id_templ_riunione
										)
				 select  
												codiceazienda,
												idriunione,
												maxidodg,
												1, 
												titolo, 
												idargomentosettore
												durata,
												orainizio,
												coalesce (ora_fine, orainizio+durata),
												datariunione,
												cantiere_,
												idargomentocontrollo,
												idargomentofunzione,
												idtemplateodg,
												idtemplateriunioni

						from entrasp.template_odg 
						where codice_azienda=codiceazienda 
						and id_templ_odg=idtemplateodg 
						and id_templ_riunioni=idtemplateriunioni;
						
        END LOOP;
    END IF;


$BODY$;

ALTER FUNCTION entrasp.crea_odg_template(varchar, numeric, numeric)
    OWNER TO postgres;
