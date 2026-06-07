package com.marsa.luberight.web;

import com.marsa.luberight.dto.LubricationPointResponse;
import com.marsa.luberight.service.LubricationPointService;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lubrication")
@Validated
public class LubricationPointController {

  private final LubricationPointService service;

  public LubricationPointController(LubricationPointService service) {
    this.service = service;
  }

  @GetMapping("/latest/{name}")
  public ResponseEntity<LubricationPointResponse> getLubricationPoint(
      @PathVariable @NotBlank String name) {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.noStore().mustRevalidate())
        .header("Pragma", "no-cache")
        .header("Expires", "0")
        .body(service.findLatestByName(name));
  }

  @GetMapping("/by-date")
  public ResponseEntity<List<LubricationPointResponse>> getLubricationByDate(
      @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
      @RequestParam(value = "graisseur", required = false) String graisseur) {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.noStore().mustRevalidate())
        .header("Pragma", "no-cache")
        .header("Expires", "0")
        .body(service.findByDate(date, graisseur));
  }
}
