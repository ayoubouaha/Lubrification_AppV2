package com.marsa.luberight.proxy.domain;

import java.time.LocalDateTime;

public record BackendSyncState(LocalDateTime lastSyncTimestamp, boolean initialHistorySyncRequired) {}
