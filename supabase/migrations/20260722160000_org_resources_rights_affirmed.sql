-- Records the leader's rights affirmation for each Org Resource Library
-- upload as a stored, server-set timestamp -- not merely a client-side
-- gate. NOT NULL is deliberate: the database itself must make it
-- impossible for a resource row to exist without a recorded affirmation.
--
-- DEFAULT now() is added only so the ALTER succeeds against any existing
-- rows (there are none live -- see the pre-migration count in the session
-- log), then immediately dropped so every future INSERT must supply an
-- explicit value. upload-org-resource sets rights_affirmed_at itself
-- server-side; it is never accepted from the client.

ALTER TABLE org_resources
  ADD COLUMN rights_affirmed_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE org_resources
  ALTER COLUMN rights_affirmed_at DROP DEFAULT;
