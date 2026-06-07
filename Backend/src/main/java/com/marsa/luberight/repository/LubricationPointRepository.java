package com.marsa.luberight.repository;

import com.marsa.luberight.domain.CalenderSnapshot;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Read-side projections over the {@code calender_snapshot} event history. This is the single cache
 * table: there is no separate "latest state" snapshot table — the latest state is derived here as
 * the most recent event per point.
 */
public interface LubricationPointRepository extends JpaRepository<CalenderSnapshot, Integer> {

  /**
   * Latest known state of a point: the most recent event (preferring rows that actually carry an
   * actual amount), with the planned amount / interval falling back to the latest non-null values.
   */
  @Query(
      value =
          """
          SELECT TOP (1)
            cal.name AS name,
            COALESCE(cal.actual_interval, baseline.actual_interval) AS interval,
            COALESCE(cal.planned_amount, baseline.planned_amount) AS plannedAmount,
            cal.actual_amount AS actualAmount,
            cal.actual_date AS actualDate,
            cal.lubricator AS lubricator
          FROM calender_snapshot cal
          OUTER APPLY (
            SELECT TOP (1)
              p.planned_amount,
              p.actual_interval
            FROM calender_snapshot p
            WHERE p.name = cal.name
              AND p.planned_amount IS NOT NULL
            ORDER BY p.actual_date DESC, p.source_index DESC
          ) AS baseline
          WHERE cal.name = :name
          ORDER BY
            CASE WHEN cal.actual_amount IS NULL THEN 1 ELSE 0 END,
            cal.actual_date DESC,
            cal.source_index DESC
          """,
      nativeQuery = true)
  Optional<LubricationPointView> findLatestByName(@Param("name") String name);

  /**
   * One row per known point for the exact execution date. When the point has an event on that date,
   * its actual amount/lubricator are returned; otherwise actualAmount is NULL (not lubricated that
   * date) while plannedAmount/interval still carry the point's latest known baseline. The roster of
   * points is the set of distinct names ever seen in the history.
   */
  @Query(
      value =
          """
          SELECT
            snap.name AS name,
            COALESCE(ev.actual_interval, baseline.actual_interval) AS interval,
            COALESCE(ev.planned_amount, baseline.planned_amount) AS plannedAmount,
            ev.actual_amount AS actualAmount,
            ev.actual_date AS actualDate,
            ev.lubricator AS lubricator
          FROM (SELECT DISTINCT name FROM calender_snapshot) snap
          OUTER APPLY (
            SELECT TOP (1)
              cal.actual_interval,
              cal.planned_amount,
              cal.actual_amount,
              cal.actual_date,
              cal.lubricator
            FROM calender_snapshot cal
            WHERE cal.name = snap.name
              AND cal.actual_date = :date
            ORDER BY
              CASE WHEN cal.actual_amount IS NULL THEN 1 ELSE 0 END,
              cal.source_index DESC
          ) AS ev
          OUTER APPLY (
            SELECT TOP (1)
              p.planned_amount,
              p.actual_interval
            FROM calender_snapshot p
            WHERE p.name = snap.name
              AND p.planned_amount IS NOT NULL
            ORDER BY p.actual_date DESC, p.source_index DESC
          ) AS baseline
          """,
      nativeQuery = true)
  List<LubricationPointView> findByDate(@Param("date") LocalDate date);

  /**
   * Same as {@link #findByDate(LocalDate)} but only considers events performed by the given
   * graisseur. Points lubricated by other graisseurs on that date fall through to NULL actuals
   * (rendered as "not done").
   */
  @Query(
      value =
          """
          SELECT
            snap.name AS name,
            COALESCE(ev.actual_interval, baseline.actual_interval) AS interval,
            COALESCE(ev.planned_amount, baseline.planned_amount) AS plannedAmount,
            ev.actual_amount AS actualAmount,
            ev.actual_date AS actualDate,
            ev.lubricator AS lubricator
          FROM (SELECT DISTINCT name FROM calender_snapshot) snap
          OUTER APPLY (
            SELECT TOP (1)
              cal.actual_interval,
              cal.planned_amount,
              cal.actual_amount,
              cal.actual_date,
              cal.lubricator
            FROM calender_snapshot cal
            WHERE cal.name = snap.name
              AND cal.actual_date = :date
              AND cal.lubricator = :graisseur
            ORDER BY
              CASE WHEN cal.actual_amount IS NULL THEN 1 ELSE 0 END,
              cal.source_index DESC
          ) AS ev
          OUTER APPLY (
            SELECT TOP (1)
              p.planned_amount,
              p.actual_interval
            FROM calender_snapshot p
            WHERE p.name = snap.name
              AND p.planned_amount IS NOT NULL
            ORDER BY p.actual_date DESC, p.source_index DESC
          ) AS baseline
          """,
      nativeQuery = true)
  List<LubricationPointView> findByDateAndLubricator(
      @Param("date") LocalDate date, @Param("graisseur") String graisseur);
}
