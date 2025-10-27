-- NO-OP migration to bypass broken escaping. Original files are backed up separately.
DO $do$
BEGIN
  PERFORM 1;
END
$do$;