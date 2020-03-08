


-- SEQUENCE: aws.s10

-- DROP SEQUENCE aws.s10;

CREATE SEQUENCE entrasp.s10
    INCREMENT 10
    START 990
    MINVALUE 10
    MAXVALUE 1000000
    CACHE 1;

COMMENT ON SEQUENCE entrasp.s10
    IS 'Sequenza che parte da 10 arriva ad 1.000.000 per incrementi di 10';
-- Table: entrasp.tabelle

-- DROP TABLE entrasp.tabelle;

CREATE TABLE entrasp.tabelle
(
    nome_tabella character varying(50) COLLATE pg_catalog."default" NOT NULL,
    ordinamento integer DEFAULT nextval('entrasp.s10'::regclass),
    CONSTRAINT tabelle_pkey PRIMARY KEY (nome_tabella)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE entrasp.tabelle
    OWNER to postgres;

-- Index: tabelle_ord

-- DROP INDEX entrasp.tabelle_ord;

CREATE UNIQUE INDEX tabelle_ord
    ON entrasp.tabelle USING btree
    (ordinamento ASC NULLS LAST)
    TABLESPACE pg_default;
	
	
-- FUNCTION: entrasp.grc_tabella_ca_cp_nulla(text)

-- DROP FUNCTION entrasp.grc_tabella_ca_cp_nulla(text);

CREATE OR REPLACE FUNCTION entrasp.grc_tabella_ca_cp_nulla(
	nometabella text)
    RETURNS character varying
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE 
AS $BODY$ 

declare Rec RECORD; stringa varchar(50); ca integer; cp integer;  ca_cp varchar(50);
begin

for Rec in SELECT column_name from entrasp.grc_campi_tabelle where table_name=NomeTabella and column_name in('codice_azienda', 'codice_part') loop
 stringa:=concat(stringa, rec.column_name);
end loop;  

ca:=position('codice_azienda' in stringa);
cp:= position('codice_part' in stringa);

if ca=0 and cp=0 then
 ca_cp:='niente';
end if;

If ca>0 then 
 ca_cp:='codice_azienda';
end if;
 
if ca=0 and cp>0 then
 ca_cp:='codice_part';
end if;

return ca_cp;
end;

$BODY$;

ALTER FUNCTION entrasp.grc_tabella_ca_cp_nulla(text)
    OWNER TO postgres;


-- FUNCTION: entrasp.grc_esporta_tabelle(character varying, character varying)

-- DROP FUNCTION entrasp.grc_esporta_tabelle(character varying, character varying);

CREATE OR REPLACE FUNCTION entrasp.grc_esporta_tabelle(
	"CodiceAzienda" character varying,
	"CodicePartizione" character varying)
    RETURNS void
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE 
AS $BODY$
declare Rec RECORD; tabella varchar(50); ca_cp varchar(50);
BEGIN
for Rec in SELECT grc_tabelle_ca_cp.table_name, grc_tabelle_ca_cp.ca_cp from entrasp.grc_tabelle_ca_cp loop
	tabella:= Rec.table_name;
	ca_cp:=rec.ca_cp;
	if ca_cp='codice_azienda' then
		EXECUTE format('COPY (select * FROM entrasp.%s WHERE %I=%L) TO ''C:\Users\Public\Export\%s.csv'' delimiter'';'' csv header;', tabella, ca_cp, $1, tabella);
		--EXECUTE format('COPY entrasp.agenda TO ''C:\Users\Public\Export\%s.csv''', tabella, ca_cp, $1, tabella);
		else
		EXECUTE format('COPY (select * FROM entrasp.%s WHERE %I=%L) TO ''C:\Users\Public\Export\%s.csv'' delimiter'';'' csv header;', tabella, ca_cp, $2, tabella);		
	end if;
end loop;
END; $BODY$;

ALTER FUNCTION entrasp.grc_esporta_tabelle(character varying, character varying)
    OWNER TO postgres;

-- FUNCTION: entrasp.grc_importa_tabelle(character varying)

-- DROP FUNCTION entrasp.grc_importa_tabelle(character varying);

CREATE OR REPLACE FUNCTION entrasp.grc_importa_tabelle(
	"NomeAzienda" character varying)
    RETURNS character varying
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE 
AS $BODY$
declare Rec RECORD; tabella varchar(50); ca_cp varchar(50); elencocampi character varying; stringaCancellazione character varying; stringaCopy character varying;
BEGIN
--UPDATE entrasp.anagrafiche_id SET codice_part= 'ELIMINAMI' WHERE codice_part=$1;
--DELETE FROM entrasp.partizioni where codice_part=$1;
for Rec in SELECT grc_tabelle_ca_cp.table_name, grc_tabelle_ca_cp.ca_cp, grc_tabelle_ca_cp.elencocampi from entrasp.grc_tabelle_ca_cp order by entrasp.grc_tabelle_ca_cp.ordinamento desc loop
	tabella:= Rec.table_name;
	ca_cp:=rec.ca_cp;
	elencocampi:=rec.elencocampi;
	
	if tabella='procedure_aziendali' then
		delete from entrasp.procedure_aziendali where codice_azienda=$1 or codice_part=$1;
		stringaCancellazione:=concat(stringaCancellazione, format('DELETE FROM entrasp.procedure_aziendali WHERE codice_azienda=%L or codice_part=%L;', $1, $1));
	else
		EXECUTE format('DELETE FROM entrasp.%s WHERE %I=%L;', tabella, ca_cp, $1);
		stringaCancellazione:=concat(stringaCancellazione, format('DELETE FROM entrasp.%s WHERE %I=%L;', tabella, ca_cp, $1));
	end if;
end loop;

for Rec in SELECT grc_tabelle_ca_cp.table_name, grc_tabelle_ca_cp.ca_cp, grc_tabelle_ca_cp.elencocampi from entrasp.grc_tabelle_ca_cp order by entrasp.grc_tabelle_ca_cp.ordinamento asc loop
	tabella:= Rec.table_name;
	ca_cp:=rec.ca_cp;
	elencocampi:=rec.elencocampi;
	EXECUTE format('COPY entrasp.%s(%s) FROM ''C:\Users\Amedeo\OneDrive\MigrazioneGRC\DB\export\%s.csv'' delimiter'';'' csv header;', tabella, elencocampi, tabella);
	stringaCopy:=concat(stringaCopy, format('COPY entrasp.%s(%s) FROM ''C:\Users\Amedeo\OneDrive\MigrazioneGRC\DB\export\%s.csv'' delimiter'';'' csv header;', tabella, elencocampi, tabella));
end loop;

return concat(stringaCancellazione, stringaCopy);
END; $BODY$;

ALTER FUNCTION entrasp.grc_importa_tabelle(character varying)
    OWNER TO postgres;






-- FUNCTION: entrasp.grc_listacampiditabella(text)

-- DROP FUNCTION entrasp.grc_listacampiditabella(text);

CREATE OR REPLACE FUNCTION entrasp.grc_listacampiditabella(
	nometabella text)
    RETURNS character varying
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE 
AS $BODY$
declare Rec RECORD;
declare stringa character varying;
begin
for Rec in SELECT column_name from entrasp.grc_campi_tabelle where table_name=NomeTabella loop
 stringa:=concat(stringa, ', ', rec.column_name);
 
end loop;  
stringa:=right(stringa,length(stringa)-2);
return stringa;
--raise notice '%', stringa;
end;
$BODY$;

ALTER FUNCTION entrasp.grc_listacampiditabella(text)
    OWNER TO postgres;



-- FUNCTION: entrasp.grc_listacampiditabella_non_pk(text)

-- DROP FUNCTION entrasp.grc_listacampiditabella_non_pk(text);

CREATE OR REPLACE FUNCTION entrasp.grc_listacampiditabella_non_pk(
	nometabella text)
    RETURNS character varying
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE 
AS $BODY$
declare Rec RECORD;
declare stringa character varying;
begin
for Rec in SELECT column_name from entrasp.grc_campi_tabelle_NON_pk where table_name=NomeTabella loop
 stringa:=concat(stringa, ', ', rec.column_name);
 
end loop;  
stringa:=right(stringa,length(stringa)-2);
return stringa;
--raise notice '%', stringa;
end;
$BODY$;

ALTER FUNCTION entrasp.grc_listacampiditabella_non_pk(text)
    OWNER TO postgres;


-- FUNCTION: entrasp.grc_listacampiditabella_pk(text)

-- DROP FUNCTION entrasp.grc_listacampiditabella_pk(text);

CREATE OR REPLACE FUNCTION entrasp.grc_listacampiditabella_pk(
	nometabella text)
    RETURNS character varying
    LANGUAGE 'plpgsql'

    COST 100
    VOLATILE 
AS $BODY$
declare Rec RECORD;
declare stringa character varying;
begin
for Rec in SELECT column_name from entrasp.grc_campi_tabelle_pk where table_name=NomeTabella loop
 stringa:=concat(stringa, ', ', rec.column_name);
 
end loop;  
stringa:=right(stringa,length(stringa)-2);
return stringa;
--raise notice '%', stringa;
end;
$BODY$;

ALTER FUNCTION entrasp.grc_listacampiditabella_pk(text)
    OWNER TO postgres;



-- View: entrasp.grc_tabelle

-- DROP VIEW entrasp.grc_tabelle;

CREATE OR REPLACE VIEW entrasp.grc_tabelle
 AS
 SELECT tables.table_catalog,
    tables.table_schema,
    tables.table_name,
    tables.table_type,
    tables.self_referencing_column_name,
    tables.reference_generation,
    tables.user_defined_type_catalog,
    tables.user_defined_type_schema,
    tables.user_defined_type_name,
    tables.is_insertable_into,
    tables.is_typed,
    tables.commit_action
   FROM information_schema.tables
  WHERE tables.table_schema::text = 'entrasp'::text AND tables.table_type::text = 'BASE TABLE'::text;

ALTER TABLE entrasp.grc_tabelle
    OWNER TO postgres;



-- View: entrasp.grc_tabelle_ca_cp

-- DROP VIEW entrasp.grc_tabelle_ca_cp;

CREATE OR REPLACE VIEW entrasp.grc_tabelle_ca_cp
 AS
 SELECT grc_tabelle.table_name,
    tabelle.ordinamento,
    entrasp.grc_tabella_ca_cp_nulla(grc_tabelle.table_name::text) AS ca_cp,
    entrasp.grc_listacampiditabella(grc_tabelle.table_name::text) AS elencocampi,
    entrasp.grc_listacampiditabella_pk(grc_tabelle.table_name::text) AS elencocampi_pk,
    entrasp.grc_listacampiditabella_non_pk(grc_tabelle.table_name::text) AS elencocampi_non_pk
   FROM entrasp.grc_tabelle,
    entrasp.tabelle
  WHERE entrasp.grc_tabella_ca_cp_nulla(grc_tabelle.table_name::text)::text <> ''::text AND grc_tabelle.table_name::text = tabelle.nome_tabella::text
  ORDER BY tabelle.ordinamento;

ALTER TABLE entrasp.grc_tabelle_ca_cp
    OWNER TO postgres;

