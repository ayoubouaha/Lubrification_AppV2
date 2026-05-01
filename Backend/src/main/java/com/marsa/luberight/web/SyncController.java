package com.marsa.luberight.web;

import com.marsa.luberight.dto.SyncBatchRequest;
import com.marsa.luberight.dto.SyncIngestResponse;
import com.marsa.luberight.dto.SyncStateResponse;
import com.marsa.luberight.service.DataSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sync")
public class SyncController {

  private final DataSyncService dataSyncService;

  public SyncController(DataSyncService dataSyncService) {
    this.dataSyncService = dataSyncService;
  }

  @GetMapping("/state")
  public ResponseEntity<SyncStateResponse> getState() {
    return ResponseEntity.ok(dataSyncService.getSyncState());
  }

  @PostMapping("/batch")
  public ResponseEntity<SyncIngestResponse> ingest(@RequestBody SyncBatchRequest request) {
    return ResponseEntity.ok(dataSyncService.ingest(request));
  }
}
