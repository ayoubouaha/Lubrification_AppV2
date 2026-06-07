-- Tables for local cache (no changes to existing source tables)
-- Auto-run on backend startup via spring.sql.init (see application.properties).
-- Blocks are separated by ';;' (spring.sql.init.separator) so each T-SQL
-- IF...BEGIN...END batch is sent whole. Keep in sync with
-- Backend/sql/local_cache_tables.sql.
--
-- calender_snapshot is the single cache table: it holds the full event history
-- keyed by the source Calender [Index] (source_index). The "latest state" of a
-- point is derived from it (most recent event) instead of being stored in a
-- separate snapshot table.

-- Drop the legacy lubrication_point_snapshot table for existing installs: the
-- latest state is now derived from calender_snapshot, so this table is unused.
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'lubrication_point_snapshot' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  DROP TABLE dbo.lubrication_point_snapshot;
END
;;

-- Migrate calender_snapshot to the source-index keyed model. The old table was
-- keyed by (name, timestamp_value); the new one is keyed by source_index (the
-- source Calender [Index]) and carries actual_date. Drop the legacy table so it
-- is recreated below; the next full sync repopulates all history.
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'calender_snapshot' AND schema_id = SCHEMA_ID('dbo'))
  AND NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.calender_snapshot') AND name = 'source_index'
  )
BEGIN
  DROP TABLE dbo.calender_snapshot;
END
;;

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
END
;;

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'calender_snapshot' AND schema_id = SCHEMA_ID('dbo'))
  AND NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'idx_calender_snapshot_actual_date' AND object_id = OBJECT_ID('dbo.calender_snapshot')
  )
BEGIN
  CREATE INDEX idx_calender_snapshot_actual_date ON dbo.calender_snapshot (actual_date);
END
;;

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'calender_snapshot' AND schema_id = SCHEMA_ID('dbo'))
  AND NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'idx_calender_snapshot_name_date' AND object_id = OBJECT_ID('dbo.calender_snapshot')
  )
BEGIN
  CREATE INDEX idx_calender_snapshot_name_date ON dbo.calender_snapshot (name, actual_date);
END
;;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'sync_metadata' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
  CREATE TABLE dbo.sync_metadata (
    id NVARCHAR(255) NOT NULL PRIMARY KEY,
    last_sync_timestamp DATE NULL
  );
END
;;

-- The watermark is now a date (max ActualDate). Convert the legacy DATETIME2
-- column to DATE for existing installs.
IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.sync_metadata')
      AND name = 'last_sync_timestamp'
      AND system_type_id <> TYPE_ID('date')
  )
BEGIN
  ALTER TABLE dbo.sync_metadata ALTER COLUMN last_sync_timestamp DATE NULL;
END
;;

-- Wall-clock time of the last sync run (system time), independent of the data date. Used by the
-- dashboard's data-freshness indicator.
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'sync_metadata' AND schema_id = SCHEMA_ID('dbo'))
  AND NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.sync_metadata') AND name = 'last_synced_at'
  )
BEGIN
  ALTER TABLE dbo.sync_metadata ADD last_synced_at DATETIME2 NULL;
END
;;
