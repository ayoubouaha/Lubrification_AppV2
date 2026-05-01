package com.marsa.luberight.proxy.service;

import com.marsa.luberight.proxy.domain.BackendSyncState;
import com.marsa.luberight.proxy.domain.SyncBatchRequest;
import com.marsa.luberight.proxy.domain.SyncIngestResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class BackendSyncClient {

  private final RestClient restClient;

  public BackendSyncClient(
      RestClient.Builder restClientBuilder,
      @Value("${backend.api.base-url}") String backendApiBaseUrl,
      @Value("${backend.api.connect-timeout-ms:3000}") int connectTimeoutMs,
      @Value("${backend.api.read-timeout-ms:3000}") int readTimeoutMs) {
    SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
    requestFactory.setConnectTimeout(connectTimeoutMs);
    requestFactory.setReadTimeout(readTimeoutMs);
    this.restClient =
        restClientBuilder.baseUrl(backendApiBaseUrl).requestFactory(requestFactory).build();
  }

  public BackendSyncState getState() {
    try {
      return restClient.get().uri("/api/sync/state").retrieve().body(BackendSyncState.class);
    } catch (RestClientException ex) {
      throw new BackendUnavailableException("Backend is not reachable", ex);
    }
  }

  public SyncIngestResponse sendBatch(SyncBatchRequest request) {
    try {
      return restClient
          .post()
          .uri("/api/sync/batch")
          .body(request)
          .retrieve()
          .body(SyncIngestResponse.class);
    } catch (RestClientException ex) {
      throw new BackendUnavailableException("Backend is not reachable", ex);
    }
  }
}
