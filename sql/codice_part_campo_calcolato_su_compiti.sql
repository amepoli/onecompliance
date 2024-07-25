DROP TRIGGER IF EXISTS add_codice_part ON entrasp.compiti;
ALTER TABLE entrasp.compiti DROP COLUMN codice_part;
ALTER TABLE entrasp.compiti
ADD COLUMN codice_part character varying GENERATED ALWAYS AS (entrasp.codice_part_from_azienda(codice_azienda)) STORED;