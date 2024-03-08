-- Trigger: after_employers

-- DROP TRIGGER IF EXISTS after_employers ON entrasp.employers;

CREATE OR REPLACE TRIGGER after_employers
    AFTER INSERT OR UPDATE 
    ON entrasp.employers
    FOR EACH ROW
    EXECUTE FUNCTION entrasp.update_users();