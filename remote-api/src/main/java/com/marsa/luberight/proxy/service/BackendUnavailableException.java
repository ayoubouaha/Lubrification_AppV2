package com.marsa.luberight.proxy.service;

public class BackendUnavailableException extends RuntimeException {

  public BackendUnavailableException(String message, Throwable cause) {
    super(message, cause);
  }
}
