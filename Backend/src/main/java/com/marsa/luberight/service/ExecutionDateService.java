package com.marsa.luberight.service;

import com.marsa.luberight.dto.ExecutionDateResponse;
import com.marsa.luberight.dto.GraisseurOption;
import com.marsa.luberight.repository.CalenderSnapshotRepository;
import com.marsa.luberight.repository.ExecutionDateGroupView;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

/**
 * Lists the distinct execution dates (ActualDate values) present in the cache, each with the
 * graisseurs that worked on that date. Drives the dashboard's "Date Exécutée" + "Graisseur"
 * selectors: the user picks one exact date, then optionally narrows to a single graisseur.
 */
@Service
public class ExecutionDateService {

  private static final DateTimeFormatter LABEL_FORMAT = DateTimeFormatter.ofPattern("dd-MM-yyyy");

  private final CalenderSnapshotRepository calenderSnapshotRepository;

  public ExecutionDateService(CalenderSnapshotRepository calenderSnapshotRepository) {
    this.calenderSnapshotRepository = calenderSnapshotRepository;
  }

  /** Returns the distinct execution dates, most recent first. */
  public List<ExecutionDateResponse> listExecutionDates() {
    List<ExecutionDateGroupView> groups = calenderSnapshotRepository.findExecutionDateGroups();

    // Group rows by date, preserving the repository's newest-first ordering.
    Map<LocalDate, Aggregate> byDate = new LinkedHashMap<>();
    for (ExecutionDateGroupView group : groups) {
      LocalDate date = group.getActualDate();
      if (date == null) {
        continue;
      }
      Aggregate aggregate = byDate.computeIfAbsent(date, key -> new Aggregate());
      aggregate.totalEventCount += group.getEventCount();
      // Rows with no lubricator still count toward the total but carry no graisseur option.
      if (group.getLubricator() != null && !group.getLubricator().isBlank()) {
        aggregate.graisseurs.add(new GraisseurOption(group.getLubricator(), group.getEventCount()));
      }
    }

    List<ExecutionDateResponse> result = new ArrayList<>();
    byDate.forEach(
        (date, aggregate) -> {
          aggregate.graisseurs.sort((a, b) -> Integer.compare(b.eventCount(), a.eventCount()));
          result.add(
              new ExecutionDateResponse(
                  date.toString(),
                  date.format(LABEL_FORMAT),
                  aggregate.totalEventCount,
                  aggregate.graisseurs));
        });
    return result;
  }

  private static final class Aggregate {
    private int totalEventCount;
    private final List<GraisseurOption> graisseurs = new ArrayList<>();
  }
}
