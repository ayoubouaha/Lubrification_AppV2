package com.marsa.luberight.dto;

import java.time.LocalDateTime;

public record RemoteLubricationPointPayload(
    String name,
    Integer interval,
    Integer actualInterval,
    String lubricator,
    Double plannedAmount,
    Double actualAmount,
    LocalDateTime timestamp) {}
