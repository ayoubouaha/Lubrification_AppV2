package com.marsa.luberight.proxy.service;

import com.marsa.luberight.proxy.domain.LubricationPointResponse;
import com.marsa.luberight.proxy.repository.LubricationPointRepository;
import com.marsa.luberight.proxy.repository.LubricationPointView;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class LubricationPointService {

  private final LubricationPointRepository repository;

  public LubricationPointService(LubricationPointRepository repository) {
    this.repository = repository;
  }

  public List<LubricationPointResponse> fetchCalenderHistory(LocalDate updatedAfter) {
    return repository.findCalenderHistory(updatedAfter).stream()
        .map(this::mapToResponse)
        .toList();
  }

  private LubricationPointResponse mapToResponse(LubricationPointView view) {
    return new LubricationPointResponse(
        view.getName(),
        view.getSourceIndex(),
        view.getInterval(),
        view.getActualInterval(),
        view.getLubricator(),
        toDouble(view.getPlannedAmount()),
        toDouble(view.getActualAmount()),
        view.getActualDate());
  }

  private Double toDouble(BigDecimal value) {
    return value == null ? null : value.doubleValue();
  }
}
