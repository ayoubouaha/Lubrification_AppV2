package com.marsa.luberight.proxy.domain;

import java.time.LocalDate;

public record LubricationPointResponse(
    String name,
    Integer sourceIndex,
    Integer interval,
    Integer actualInterval,
    String lubricator,
    Double plannedAmount,
    Double actualAmount,
    LocalDate actualDate) {}
