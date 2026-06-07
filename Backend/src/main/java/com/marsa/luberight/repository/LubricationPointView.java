package com.marsa.luberight.repository;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface LubricationPointView {
  String getName();

  Integer getInterval();

  BigDecimal getPlannedAmount();

  BigDecimal getActualAmount();

  LocalDate getActualDate();

  String getLubricator();
}
