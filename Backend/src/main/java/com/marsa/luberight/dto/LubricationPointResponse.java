package com.marsa.luberight.dto;

import java.time.LocalDate;

public record LubricationPointResponse(
    String name,
    Integer interval,
    Double plannedAmount,
    Double actualAmount,
    LocalDate actualDate,
    String lubricator) {}
