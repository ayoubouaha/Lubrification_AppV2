package com.marsa.luberight.proxy.repository;

import com.marsa.luberight.proxy.domain.Admin;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LubricationPointRepository extends JpaRepository<Admin, Integer> {

  @Query(
      value =
          """
          SELECT
            adm.Name AS name,
            cal.[Index] AS sourceIndex,
            cal.ActualInterval AS [interval],
            cal.ActualInterval AS actualInterval,
            cal.Lubricator AS lubricator,
            cal.PlannedAmount AS plannedAmount,
            cal.ActualAmount AS actualAmount,
            cal.ActualDate AS actualDate
          FROM dbo.Calender cal
          INNER JOIN dbo.Admin adm ON adm.[Index] = cal.AdminIndex
          WHERE cal.ActualDate IS NOT NULL
            AND (:updatedAfter IS NULL OR cal.ActualDate > :updatedAfter)
          ORDER BY cal.ActualDate ASC, cal.[Index] ASC
          """,
      nativeQuery = true)
  List<LubricationPointView> findCalenderHistory(
      @Param("updatedAfter") LocalDate updatedAfter);
}
