package com.marsa.luberight.repository;

import java.time.LocalDate;

/** One (date, graisseur) group with its event count, used to build the execution-date selectors. */
public interface ExecutionDateGroupView {
  LocalDate getActualDate();

  String getLubricator();

  int getEventCount();
}
