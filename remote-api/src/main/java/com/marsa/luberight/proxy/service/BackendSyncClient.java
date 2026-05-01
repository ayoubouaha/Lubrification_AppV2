package com.marsa.luberight.proxy.service;

import com.marsa.luberight.proxy.domain.BackendSyncState;
import com.marsa.luberight.proxy.domain.SyncBatchRequest;
import com.marsa.luberight.proxy.domain.SyncIngestResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class BackendSyncClient {

  private final RestClient restClient;

  public BackendSyncClient(
      RestClient.Builder restClientBuilder,
      @Value("${backend.api.base-url}") String backendApiBaseUrl) {
    this.restClient = restClientBuilder.baseUrl(backendApiBaseUrl).build();
  }

  public BackendSyncState getState() {
    return restClient.get().uri("/api/sync/state").retrieve().body(BackendSyncState.class);
  }

  public SyncIngestResponse sendBatch(SyncBatchRequest request) {
    return restClient
        .post()
        .uri("/api/sync/batch")
        .body(request)
        .retrieve()
        .body(SyncIngestResponse.class);
  }
}
