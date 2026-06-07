-- Tables for local cache (no changes to existing source tables)
-- Reference copy of Backend/src/main/resources/schema.sql (which is the one
-- auto-run on startup). Logic is keyed off ActualDate; calender_snapshot is the
-- single cache table, keyed by the source Calender [Index] (source_index). The
-- "latest state" of a point is derived from calender_snapshot (most recent
-- event), so there is no separate lubrication_point_snapshot table.

-- Drop the legacy lubrication_point_snapshot table for existing installs.
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'lubrication_point_snapshot' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  DROP TABLE dbo.lubrication_point_snapshot;
END

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'calender_snapshot' AND schema_id = SCHEMA_ID('dbo'))
  AND NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.calender_snapshot') AND name = 'source_index'
  )
BEGIN
  DROP TABLE dbo.calender_snapshot;
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'calender_snapshot' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE dbo.calender_snapshot (
    source_index INT NOT NULL PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    actual_date DATE NULL,
    actual_interval INT NULL,
    lubricator NVARCHAR(255) NULL,
    planned_amount DECIMAL(19, 2) NULL,
    actual_amount DECIMAL(19, 2) NULL
  );
  CREATE INDEX idx_calender_snapshot_actual_date ON dbo.calender_snapshot (actual_date);
  CREATE INDEX idx_calender_snapshot_name_date ON dbo.calender_snapshot (name, actual_date);
END

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'sync_metadata' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE dbo.sync_metadata (
    id NVARCHAR(255) NOT NULL PRIMARY KEY,
    last_sync_timestamp DATE NULL,
    last_synced_at DATETIME2 NULL
  );
END

-- Wall-clock time of the last sync run (system time), independent of the data date.
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'sync_metadata' AND schema_id = SCHEMA_ID('dbo'))
  AND NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.sync_metadata') AND name = 'last_synced_at'
  )
BEGIN
  ALTER TABLE dbo.sync_metadata ADD last_synced_at DATETIME2 NULL;
END
