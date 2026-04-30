package com.marsa.luberight.repository;

import com.marsa.luberight.domain.LubricationPointSnapshot;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LubricationPointRepository
    extends JpaRepository<LubricationPointSnapshot, String> {

  @Query(
      value =
          """
          SELECT
            snap.name AS name,
            snap.interval_value AS interval,
            COALESCE(snap.planned_amount, latestPlan.planned_amount) AS plannedAmount,
            snap.actual_amount AS actualAmount,
            snap.timestamp_value AS timestamp
          FROM lubrication_point_snapshot snap
          OUTER APPLY (
            SELECT TOP (1)
              cal.planned_amount
            FROM calender_snapshot cal
            WHERE cal.name = snap.name
              AND cal.planned_amount IS NOT NULL
            ORDER BY cal.timestamp_value DESC
          ) AS latestPlan
          WHERE snap.name = :name
          """,
      nativeQuery = true)
  Optional<LubricationPointView> findLatestByName(@Param("name") String name);
}
