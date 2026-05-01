package com.marsa.luberight.proxy.service;

import com.marsa.luberight.proxy.domain.BackendSyncState;
import com.marsa.luberight.proxy.domain.LubricationPointResponse;
import com.marsa.luberight.proxy.domain.SyncBatchRequest;
import com.marsa.luberight.proxy.domain.SyncIngestResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class ScheduledSyncService {

  private static final Logger log = LoggerFactory.getLogger(ScheduledSyncService.class);

  private final LubricationPointService lubricationPointService;
  private final BackendSyncClient backendSyncClient;
  private final AtomicBoolean syncRunning = new AtomicBoolean(false);

  public ScheduledSyncService(
      LubricationPointService lubricationPointService, BackendSyncClient backendSyncClient) {
    this.lubricationPointService = lubricationPointService;
    this.backendSyncClient = backendSyncClient;
  }

  @EventListener(ApplicationReadyEvent.class)
  public void syncOnStartup() {
    synchronize("startup");
  }

  @Scheduled(
      fixedDelayString = "${remote.sync.interval-ms:10800000}",
      initialDelayString = "${remote.sync.interval-ms:10800000}")
  public void scheduledSync() {
    synchronize("scheduled");
  }

  private void synchronize(String trigger) {
    if (!syncRunning.compareAndSet(false, true)) {
      log.info("Skipping {} synchronization because another sync is already running", trigger);
      return;
    }

    try {
      BackendSyncState state = backendSyncClient.getState();
      LocalDateTime updatedAfter =
          state != null && !state.initialHistorySyncRequired() ? state.lastSyncTimestamp() : null;

      List<LubricationPointResponse> latestSnapshots = lubricationPointService.fetch(updatedAfter);
      List<LubricationPointResponse> calenderHistory =
          lubricationPointService.fetchCalenderHistory(updatedAfter);

      if (latestSnapshots.isEmpty() && calenderHistory.isEmpty()) {
        log.info("{} synchronization found no new data", trigger);
        return;
      }

      SyncIngestResponse response =
          backendSyncClient.sendBatch(new SyncBatchRequest(latestSnapshots, calenderHistory));
      log.info(
          "{} synchronization sent {} latest snapshots and {} Calender rows; backend lastSync={}",
          trigger,
          response.latestSnapshotCount(),
          response.calenderHistoryCount(),
          response.lastSyncTimestamp());
    } catch (Exception ex) {
      log.error("{} synchronization failed", trigger, ex);
    } finally {
      syncRunning.set(false);
    }
  }
}
