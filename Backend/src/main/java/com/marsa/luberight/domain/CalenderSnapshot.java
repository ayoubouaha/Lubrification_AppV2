package com.marsa.luberight.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "calender_snapshot")
public class CalenderSnapshot {

  @Id
  @Column(name = "source_index", nullable = false)
  private Integer sourceIndex;

  @Column(name = "name", nullable = false)
  private String name;

  @Column(name = "actual_date")
  private LocalDate actualDate;

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
      Integer sourceIndex,
      String name,
      LocalDate actualDate,
      Integer actualInterval,
      String lubricator,
      BigDecimal plannedAmount,
      BigDecimal actualAmount) {
    this.sourceIndex = sourceIndex;
    this.name = name;
    this.actualDate = actualDate;
    this.actualInterval = actualInterval;
    this.lubricator = lubricator;
    this.plannedAmount = plannedAmount;
    this.actualAmount = actualAmount;
  }

  public Integer getSourceIndex() {
    return sourceIndex;
  }

  public String getName() {
    return name;
  }

  public LocalDate getActualDate() {
    return actualDate;
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

  public void setName(String name) {
    this.name = name;
  }

  public void setActualDate(LocalDate actualDate) {
    this.actualDate = actualDate;
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
