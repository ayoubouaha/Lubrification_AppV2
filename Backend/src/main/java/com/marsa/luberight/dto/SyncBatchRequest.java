package com.marsa.luberight.dto;

import java.util.List;

public record SyncBatchRequest(
    List<RemoteLubricationPointPayload> latestSnapshots,
    List<RemoteLubricationPointPayload> calenderHistory) {}
