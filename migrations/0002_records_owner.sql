-- Each user's records are kept apart (ADR-011): `owner` is the lower-cased e-mail the login sent,
-- and it leads the key, so the same record id from two users never collides. SQLite cannot change
-- a primary key in place, so the table is rebuilt. Rows from before this migration get an empty
-- owner, to be assigned by hand, in the console, to the e-mail that wrote them (ADR-011).
CREATE TABLE records_new (
  owner TEXT NOT NULL,
  tbl TEXT NOT NULL,
  id TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by TEXT NOT NULL,
  deleted_at INTEGER,
  data TEXT NOT NULL,
  seq INTEGER NOT NULL,
  PRIMARY KEY (owner, tbl, id)
);

INSERT INTO records_new (owner, tbl, id, updated_at, updated_by, deleted_at, data, seq)
SELECT '', tbl, id, updated_at, updated_by, deleted_at, data, seq FROM records;

DROP TABLE records;
ALTER TABLE records_new RENAME TO records;

-- `seq` stays one counter for the whole table, and each user pulls their own records by it.
CREATE UNIQUE INDEX records_seq ON records (seq);
CREATE INDEX records_owner_seq ON records (owner, seq);
