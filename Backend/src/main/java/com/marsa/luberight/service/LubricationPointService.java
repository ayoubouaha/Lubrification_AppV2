package com.marsa.luberight.service;

import com.marsa.luberight.dto.LubricationPointResponse;
import com.marsa.luberight.exception.ResourceNotFoundException;
import com.marsa.luberight.repository.LubricationPointRepository;
import com.marsa.luberight.repository.LubricationPointView;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class LubricationPointService {

  /** Source amounts are stored scaled x1000 (mg); the UI shows grams. */
  private static final BigDecimal AMOUNT_DIVISOR = BigDecimal.valueOf(1000);

  private final LubricationPointRepository repository;

  public LubricationPointService(LubricationPointRepository repository) {
    this.repository = repository;
  }

  public LubricationPointResponse findLatestByName(String name) {
    LubricationPointView view =
        repository
            .findLatestByName(name)
            .orElseThrow(
                () -> new ResourceNotFoundException("No lubrication data found for point: " + name));

    return toResponse(view);
  }

  /**
   * Returns one row per known point for the given execution date. When {@code graisseur} is set,
   * only that graisseur's events are considered; other points fall through to "not done".
   */
  public List<LubricationPointResponse> findByDate(LocalDate date, String graisseur) {
    List<LubricationPointView> views =
        (graisseur == null || graisseur.isBlank())
            ? repository.findByDate(date)
            : repository.findByDateAndLubricator(date, graisseur);
    return views.stream().map(this::toResponse).toList();
  }

  private LubricationPointResponse toResponse(LubricationPointView view) {
    return new LubricationPointResponse(
        view.getName(),
        view.getInterval(),
        normalizeAmount(view.getPlannedAmount()),
        normalizeAmount(view.getActualAmount()),
        view.getActualDate(),
        view.getLubricator());
  }

  /** Convert raw source amount (x1000) to grams. */
  private Double normalizeAmount(BigDecimal amount) {
    if (amount == null) {
      return null;
    }

    return amount.divide(AMOUNT_DIVISOR, 3, RoundingMode.HALF_UP).doubleValue();
  }
}
