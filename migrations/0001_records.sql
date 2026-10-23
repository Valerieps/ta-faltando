-- The server's copy of every synced record (ADR-007, ADR-008). One generic table: the record is
-- stored whole as JSON, so a new field in the app needs no migration here. `seq` is the server
-- sequence the devices pull by.
CREATE TABLE records (
  tbl TEXT NOT NULL,
  id TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by TEXT NOT NULL,
  deleted_at INTEGER,
  data TEXT NOT NULL,
  seq INTEGER NOT NULL,
  PRIMARY KEY (tbl, id)
);

CREATE UNIQUE INDEX records_seq ON records (seq);
