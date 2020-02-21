


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
