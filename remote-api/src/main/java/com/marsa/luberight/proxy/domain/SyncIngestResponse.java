package com.marsa.luberight.proxy.domain;

import java.time.LocalDateTime;

public record SyncIngestResponse(
    int latestSnapshotCount, int calenderHistoryCount, LocalDateTime lastSyncTimestamp) {}
