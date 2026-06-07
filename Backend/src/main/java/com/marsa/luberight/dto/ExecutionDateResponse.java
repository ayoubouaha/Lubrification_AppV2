package com.marsa.luberight.dto;

import java.util.List;

/**
 * A distinct execution date (ActualDate) present in the cache, with the graisseurs that worked on
 * that date. Used to drive the "Date Exécutée" + "Graisseur" dashboard selectors.
 */
public record ExecutionDateResponse(
    String date, String label, int totalEventCount, List<GraisseurOption> graisseurs) {}
