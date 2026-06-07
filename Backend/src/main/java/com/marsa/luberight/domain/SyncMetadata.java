package com.marsa.luberight.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "sync_metadata")
public class SyncMetadata {

  @Id
  @Column(name = "id", nullable = false)
  private String id;

  @Column(name = "last_sync_timestamp")
  private LocalDate lastSyncDate;

  /** Wall-clock time of the last sync run (when a batch was ingested), independent of the data date. */
  @Column(name = "last_synced_at")
  private Instant lastSyncedAt;

  protected SyncMetadata() {}

  public SyncMetadata(String id) {
    this.id = id;
  }

  public String getId() {
    return id;
  }

  public LocalDate getLastSyncDate() {
    return lastSyncDate;
  }

  public void setLastSyncDate(LocalDate lastSyncDate) {
    this.lastSyncDate = lastSyncDate;
  }

  public Instant getLastSyncedAt() {
    return lastSyncedAt;
  }

  public void setLastSyncedAt(Instant lastSyncedAt) {
    this.lastSyncedAt = lastSyncedAt;
  }
}
