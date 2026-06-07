package com.marsa.luberight.dto;

import java.time.LocalDate;

public record SyncIngestResponse(int calenderHistoryCount, LocalDate lastSyncDate) {}
