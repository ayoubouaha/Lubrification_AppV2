package com.marsa.luberight.proxy.domain;

import java.time.LocalDate;

public record SyncIngestResponse(int calenderHistoryCount, LocalDate lastSyncDate) {}
