package com.marsa.luberight.dto;

import java.time.LocalDateTime;

public record SyncIngestResponse(
    int latestSnapshotCount, int calenderHistoryCount, LocalDateTime lastSyncTimestamp) {}
