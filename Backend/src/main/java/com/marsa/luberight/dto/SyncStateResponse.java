package com.marsa.luberight.dto;

import java.time.LocalDateTime;

public record SyncStateResponse(LocalDateTime lastSyncTimestamp, boolean initialHistorySyncRequired) {}
