package com.marsa.luberight.repository;

import com.marsa.luberight.domain.CalenderSnapshot;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CalenderSnapshotRepository
    extends JpaRepository<CalenderSnapshot, Integer> {

  /**
   * One row per (ActualDate, lubricator) pair with its event count, newest date first — used to
   * build the "Date Exécutée" + "Graisseur" selectors.
   */
  @Query(
      value =
          "SELECT actual_date AS actualDate, lubricator AS lubricator, COUNT(*) AS eventCount "
              + "FROM calender_snapshot WHERE actual_date IS NOT NULL "
              + "GROUP BY actual_date, lubricator ORDER BY actual_date DESC",
      nativeQuery = true)
  List<ExecutionDateGroupView> findExecutionDateGroups();
}
