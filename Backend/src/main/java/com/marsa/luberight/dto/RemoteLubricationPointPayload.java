package com.marsa.luberight.dto;

import java.time.LocalDate;

public record RemoteLubricationPointPayload(
    String name,
    Integer sourceIndex,
    Integer interval,
    Integer actualInterval,
    String lubricator,
    Double plannedAmount,
    Double actualAmount,
    LocalDate actualDate) {}
