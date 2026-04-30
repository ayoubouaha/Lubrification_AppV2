package com.marsa.luberight.domain;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "calender_snapshot")
public class CalenderSnapshot {

  @EmbeddedId private CalenderSnapshotId id;

  @Column(name = "actual_interval")
  private Integer actualInterval;

  @Column(name = "lubricator")
  private String lubricator;

  @Column(name = "planned_amount")
  private BigDecimal plannedAmount;

  @Column(name = "actual_amount")
  private BigDecimal actualAmount;

  protected CalenderSnapshot() {}

  public CalenderSnapshot(
      CalenderSnapshotId id,
      Integer actualInterval,
      BigDecimal plannedAmount,
      BigDecimal actualAmount) {
    this(id, actualInterval, null, plannedAmount, actualAmount);
  }

  public CalenderSnapshot(
      CalenderSnapshotId id,
      Integer actualInterval,
      String lubricator,
      BigDecimal plannedAmount,
      BigDecimal actualAmount) {
    this.id = id;
    this.actualInterval = actualInterval;
    this.lubricator = lubricator;
    this.plannedAmount = plannedAmount;
    this.actualAmount = actualAmount;
  }

  public CalenderSnapshotId getId() {
    return id;
  }

  public Integer getActualInterval() {
    return actualInterval;
  }

  public String getLubricator() {
    return lubricator;
  }

  public BigDecimal getActualAmount() {
    return actualAmount;
  }

  public BigDecimal getPlannedAmount() {
    return plannedAmount;
  }

  public void setActualInterval(Integer actualInterval) {
    this.actualInterval = actualInterval;
  }

  public void setLubricator(String lubricator) {
    this.lubricator = lubricator;
  }

  public void setPlannedAmount(BigDecimal plannedAmount) {
    this.plannedAmount = plannedAmount;
  }

  public void setActualAmount(BigDecimal actualAmount) {
    this.actualAmount = actualAmount;
  }
}
