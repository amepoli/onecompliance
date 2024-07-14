DROP TRIGGER IF EXISTS add_codice_part ON entrasp.progetti;
ALTER TABLE entrasp.progetti DROP COLUMN codice_part;
ALTER TABLE entrasp.progetti
ADD COLUMN codice_part character varying GENERATED ALWAYS AS (entrasp.codice_part_from_azienda(codice_azienda)) STORED;