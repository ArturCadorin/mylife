package com.mylife.fit.dto.response;

import com.mylife.fit.domain.enums.WorkoutType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
public class WorkoutSummaryResponse {

    /** Total de treinos completados no mês atual */
    private long totalWorkoutsThisMonth;

    /** Total de treinos completados no mês anterior */
    private long totalWorkoutsLastMonth;

    /** Total de minutos treinados no mês atual */
    private long totalMinutesThisMonth;

    /** Total de calorias queimadas no mês atual */
    private long totalCaloriesThisMonth;

    /** Distância total percorrida no mês atual (km) */
    private BigDecimal totalDistanceKmThisMonth;

    /** Maior sequência de dias com treino no mês atual */
    private int currentStreak;

    /** Treinos completados por tipo no mês atual */
    private Map<WorkoutType, Long> byType;

    /** Próximo treino planejado */
    private WorkoutResponse nextPlanned;
}
