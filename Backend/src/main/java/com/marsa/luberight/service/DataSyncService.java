package com.marsa.luberight.service;

import com.marsa.luberight.domain.LubricationPointSnapshot;
import com.marsa.luberight.domain.SyncMetadata;
import com.marsa.luberight.domain.CalenderSnapshot;
import com.marsa.luberight.domain.CalenderSnapshotId;
import com.marsa.luberight.dto.RemoteLubricationPointPayload;
import com.marsa.luberight.dto.SyncBatchRequest;
import com.marsa.luberight.dto.SyncIngestResponse;
import com.marsa.luberight.dto.SyncStateResponse;
import com.marsa.luberight.repository.CalenderSnapshotRepository;
import com.marsa.luberight.repository.LubricationPointRepository;
import com.marsa.luberight.repository.SyncMetadataRepository;
import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DataSyncService {

  private static final Logger log = LoggerFactory.getLogger(DataSyncService.class);
  private static final String SYNC_ID = "lubrication-sync";

  private final LubricationPointRepository snapshotRepository;
  private final SyncMetadataRepository metadataRepository;
  private final CalenderSnapshotRepository calenderSnapshotRepository;

  public DataSyncService(
      LubricationPointRepository snapshotRepository,
      SyncMetadataRepository metadataRepository,
      CalenderSnapshotRepository calenderSnapshotRepository) {
    this.snapshotRepository = snapshotRepository;
    this.metadataRepository = metadataRepository;
    this.calenderSnapshotRepository = calenderSnapshotRepository;
  }

  @PostConstruct
  @Transactional
  public void ensureMetadataRowExists() {
    metadataRepository.findById(SYNC_ID).orElseGet(() -> metadataRepository.save(new SyncMetadata(SYNC_ID)));
  }

  @Transactional
  public SyncStateResponse getSyncState() {
    SyncMetadata metadata =
        metadataRepository.findById(SYNC_ID).orElseGet(() -> new SyncMetadata(SYNC_ID));
    LocalDateTime lastSync = metadata.getLastSyncTimestamp();
    boolean needsInitialHistorySync = lastSync == null || calenderSnapshotRepository.count() == 0;

    return new SyncStateResponse(lastSync, needsInitialHistorySync);
  }

  @Transactional
  public SyncIngestResponse ingest(SyncBatchRequest request) {
    SyncMetadata metadata =
        metadataRepository
            .findById(SYNC_ID)
            .orElseGet(() -> metadataRepository.save(new SyncMetadata(SYNC_ID)));
    List<RemoteLubricationPointPayload> latestPayload =
        request == null ? Collections.emptyList() : nullSafe(request.latestSnapshots());
    List<RemoteLubricationPointPayload> calenderPayload =
        request == null ? Collections.emptyList() : nullSafe(request.calenderHistory());

    latestPayload.forEach(this::upsertSnapshot);
    calenderPayload.forEach(this::upsertCalender);
    updateLastSync(metadata, latestPayload, calenderPayload);

    if (metadata.getLastSyncTimestamp() == null && calenderPayload.isEmpty()) {
      log.warn("Sync batch did not include Calender rows; metadata timestamp was not advanced");
    }

    return new SyncIngestResponse(
        latestPayload.size(), calenderPayload.size(), metadata.getLastSyncTimestamp());
  }

  private void updateLastSync(
      SyncMetadata metadata,
      List<RemoteLubricationPointPayload> latestPayload,
      List<RemoteLubricationPointPayload> calenderPayload) {
    Optional<LocalDateTime> maxTimestamp =
        java.util.stream.Stream.concat(latestPayload.stream(), calenderPayload.stream())
            .map(RemoteLubricationPointPayload::timestamp)
            .filter(ts -> ts != null)
            .max(Comparator.naturalOrder());

    maxTimestamp.ifPresent(
        ts -> {
          metadata.setLastSyncTimestamp(ts);
          metadataRepository.save(metadata);
        });
  }

  private List<RemoteLubricationPointPayload> nullSafe(List<RemoteLubricationPointPayload> payload) {
    return payload == null ? Collections.emptyList() : payload;
  }

  private void upsertSnapshot(RemoteLubricationPointPayload response) {
    if (response.name() == null) {
      log.warn("Skipping entry with null name: {}", response);
      return;
    }

    LubricationPointSnapshot snapshot =
        snapshotRepository
            .findById(response.name())
            .orElseGet(() -> new LubricationPointSnapshot(response.name(), null, null, null, null));

    snapshot.setInterval(response.actualInterval());
    snapshot.setPlannedAmount(toBigDecimal(response.plannedAmount()));
    snapshot.setActualAmount(toBigDecimal(response.actualAmount()));
    snapshot.setTimestamp(response.timestamp());

    snapshotRepository.save(snapshot);
  }

  private void upsertCalender(RemoteLubricationPointPayload response) {
    if (response.name() == null || response.timestamp() == null) {
      return;
    }

    CalenderSnapshotId id = new CalenderSnapshotId(response.name(), response.timestamp());
    CalenderSnapshot calender =
        calenderSnapshotRepository
            .findById(id)
            .orElseGet(() -> new CalenderSnapshot(id, null, null, null, null));

    calender.setActualInterval(response.actualInterval());
    calender.setLubricator(response.lubricator());
    calender.setPlannedAmount(toBigDecimal(response.plannedAmount()));
    calender.setActualAmount(toBigDecimal(response.actualAmount()));

    calenderSnapshotRepository.save(calender);
  }

  private BigDecimal toBigDecimal(Double value) {
    return value == null ? null : BigDecimal.valueOf(value);
  }
}
