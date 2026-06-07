package com.marsa.luberight.web;

import com.marsa.luberight.dto.ExecutionDateResponse;
import com.marsa.luberight.service.ExecutionDateService;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/execution-dates")
public class ExecutionDateController {

  private final ExecutionDateService executionDateService;

  public ExecutionDateController(ExecutionDateService executionDateService) {
    this.executionDateService = executionDateService;
  }

  @GetMapping
  public ResponseEntity<List<ExecutionDateResponse>> listExecutionDates() {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.noStore().mustRevalidate())
        .header("Pragma", "no-cache")
        .header("Expires", "0")
        .body(executionDateService.listExecutionDates());
  }
}
