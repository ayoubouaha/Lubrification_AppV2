package com.marsa.luberight.service;

import com.marsa.luberight.domain.CalenderSnapshot;
import com.marsa.luberight.domain.SyncMetadata;
import com.marsa.luberight.dto.RemoteLubricationPointPayload;
import com.marsa.luberight.dto.SyncBatchRequest;
import com.marsa.luberight.dto.SyncIngestResponse;
import com.marsa.luberight.dto.SyncStateResponse;
import com.marsa.luberight.repository.CalenderSnapshotRepository;
import com.marsa.luberight.repository.SyncMetadataRepository;
import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Comparator;
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

  private final SyncMetadataRepository metadataRepository;
  private final CalenderSnapshotRepository calenderSnapshotRepository;

  public DataSyncService(
      SyncMetadataRepository metadataRepository,
      CalenderSnapshotRepository calenderSnapshotRepository) {
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
    LocalDate lastSync = metadata.getLastSyncDate();
    boolean needsInitialHistorySync = lastSync == null || calenderSnapshotRepository.count() == 0;

    return new SyncStateResponse(lastSync, metadata.getLastSyncedAt(), needsInitialHistorySync);
  }

  @Transactional
  public SyncIngestResponse ingest(SyncBatchRequest request) {
    SyncMetadata metadata =
        metadataRepository
            .findById(SYNC_ID)
            .orElseGet(() -> metadataRepository.save(new SyncMetadata(SYNC_ID)));
    List<RemoteLubricationPointPayload> calenderPayload =
        request == null ? Collections.emptyList() : nullSafe(request.calenderHistory());

    calenderPayload.forEach(this::upsertCalender);
    updateLastSync(metadata, calenderPayload);

    // Record the wall-clock time of this sync run, regardless of the data dates it carried.
    metadata.setLastSyncedAt(Instant.now());
    metadataRepository.save(metadata);

    if (metadata.getLastSyncDate() == null && calenderPayload.isEmpty()) {
      log.warn("Sync batch did not include Calender rows; metadata date was not advanced");
    }

    return new SyncIngestResponse(calenderPayload.size(), metadata.getLastSyncDate());
  }

  private void updateLastSync(
      SyncMetadata metadata, List<RemoteLubricationPointPayload> calenderPayload) {
    Optional<LocalDate> maxDate =
        calenderPayload.stream()
            .map(RemoteLubricationPointPayload::actualDate)
            .filter(date -> date != null)
            .max(Comparator.naturalOrder());

    maxDate.ifPresent(
        date -> {
          metadata.setLastSyncDate(date);
          metadataRepository.save(metadata);
        });
  }

  private List<RemoteLubricationPointPayload> nullSafe(List<RemoteLubricationPointPayload> payload) {
    return payload == null ? Collections.emptyList() : payload;
  }

  private void upsertCalender(RemoteLubricationPointPayload response) {
    if (response.sourceIndex() == null || response.name() == null || response.actualDate() == null) {
      return;
    }

    CalenderSnapshot calender =
        calenderSnapshotRepository
            .findById(response.sourceIndex())
            .orElseGet(
                () ->
                    new CalenderSnapshot(
                        response.sourceIndex(), response.name(), null, null, null, null, null));

    calender.setName(response.name());
    calender.setActualDate(response.actualDate());
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
