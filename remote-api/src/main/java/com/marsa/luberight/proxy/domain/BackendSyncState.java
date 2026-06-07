package com.marsa.luberight.proxy.domain;

import java.time.LocalDate;

public record BackendSyncState(LocalDate lastSyncDate, boolean initialHistorySyncRequired) {}
