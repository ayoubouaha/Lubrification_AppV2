package com.marsa.luberight.dto;

import java.time.Instant;
import java.time.LocalDate;

public record SyncStateResponse(
    LocalDate lastSyncDate, Instant lastSyncedAt, boolean initialHistorySyncRequired) {}
