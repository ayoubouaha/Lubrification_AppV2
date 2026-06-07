package com.marsa.luberight.proxy.repository;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface LubricationPointView {
  String getName();

  Integer getSourceIndex();

  Integer getInterval();

  Integer getActualInterval();

  String getLubricator();

  BigDecimal getPlannedAmount();

  BigDecimal getActualAmount();

  LocalDate getActualDate();
}
