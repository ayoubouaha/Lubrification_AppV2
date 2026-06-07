package com.marsa.luberight.proxy.domain;

import java.util.List;

public record SyncBatchRequest(List<LubricationPointResponse> calenderHistory) {}
