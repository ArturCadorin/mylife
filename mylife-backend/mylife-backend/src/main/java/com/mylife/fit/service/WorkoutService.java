package com.mylife.fit.service;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.core.domain.enums.Role;
import com.mylife.core.exception.BusinessException;
import com.mylife.core.repository.UserRepository;
import com.mylife.fit.domain.entity.Workout;
import com.mylife.fit.domain.entity.WorkoutExercise;
import com.mylife.fit.domain.enums.WorkoutStatus;
import com.mylife.fit.domain.enums.WorkoutType;
import com.mylife.fit.dto.request.WorkoutExerciseRequest;
import com.mylife.fit.dto.request.WorkoutRequest;
import com.mylife.fit.dto.request.WorkoutUpdateRequest;
import com.mylife.fit.dto.response.WorkoutExerciseResponse;
import com.mylife.fit.dto.response.WorkoutResponse;
import com.mylife.fit.dto.response.WorkoutSummaryResponse;
import com.mylife.fit.repository.WorkoutExerciseRepository;
import com.mylife.fit.repository.WorkoutRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkoutService {

    private final WorkoutRepository workoutRepository;
    private final WorkoutExerciseRepository exerciseRepository;
    private final UserRepository userRepository;

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @Transactional
    public WorkoutResponse create(WorkoutRequest request, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup fg = requireFamilyGroup(user);

        Workout workout = Workout.builder()
                .name(request.getName())
                .type(request.getType())
                .date(request.getDate())
                .startTime(request.getStartTime())
                .durationMinutes(request.getDurationMinutes())
                .caloriesBurned(request.getCaloriesBurned())
                .heartRateAvg(request.getHeartRateAvg())
                .distanceKm(request.getDistanceKm())
                .pace(request.getPace())
                .note(request.getNote())
                .status(WorkoutStatus.PLANNED)
                .owner(user)
                .familyGroup(fg)
                .build();

        workout = workoutRepository.save(workout);

        if (request.getExercises() != null && !request.getExercises().isEmpty()) {
            final Workout savedWorkout = workout;
            List<WorkoutExercise> exercises = buildExercises(request.getExercises(), savedWorkout);
            exerciseRepository.saveAll(exercises);
            workout.getExercises().addAll(exercises);
        }

        return toResponse(workout);
    }

    @Transactional(readOnly = true)
    public Page<WorkoutResponse> findAll(User authenticatedUser,
                                          WorkoutType type,
                                          WorkoutStatus status,
                                          LocalDate from,
                                          LocalDate to,
                                          Pageable pageable) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup fg = requireFamilyGroup(user);

        boolean isOwner = user.getRole() == Role.OWNER;
        Page<Workout> page;

        if (type != null || status != null || from != null || to != null) {
            page = isOwner
                    ? workoutRepository.findByFamilyGroupFiltered(fg, type, status, from, to, pageable)
                    : workoutRepository.findByOwnerFiltered(user, type, status, from, to, pageable);
        } else {
            page = isOwner
                    ? workoutRepository.findByFamilyGroup(fg, pageable)
                    : workoutRepository.findByOwner(user, pageable);
        }

        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public WorkoutResponse findById(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Workout workout = findOrThrow(id);
        validateAccess(user, workout);
        return toResponse(workout);
    }

    @Transactional
    public WorkoutResponse update(Long id, WorkoutUpdateRequest request, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Workout workout = findOrThrow(id);
        validateAccess(user, workout);

        workout.setName(request.getName());
        workout.setType(request.getType());
        workout.setDate(request.getDate());
        workout.setStartTime(request.getStartTime());
        workout.setDurationMinutes(request.getDurationMinutes());
        workout.setCaloriesBurned(request.getCaloriesBurned());
        workout.setHeartRateAvg(request.getHeartRateAvg());
        workout.setDistanceKm(request.getDistanceKm());
        workout.setPace(request.getPace());
        workout.setNote(request.getNote());
        workout.setStatus(request.getStatus());

        return toResponse(workoutRepository.save(workout));
    }

    @Transactional
    public WorkoutResponse complete(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Workout workout = findOrThrow(id);
        validateAccess(user, workout);

        if (workout.getStatus() == WorkoutStatus.COMPLETED) {
            throw new BusinessException("Treino já está marcado como concluído.", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        workout.setStatus(WorkoutStatus.COMPLETED);
        return toResponse(workoutRepository.save(workout));
    }

    @Transactional
    public WorkoutResponse skip(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Workout workout = findOrThrow(id);
        validateAccess(user, workout);

        if (workout.getStatus() == WorkoutStatus.COMPLETED) {
            throw new BusinessException("Não é possível pular um treino já concluído.", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        workout.setStatus(WorkoutStatus.SKIPPED);
        return toResponse(workoutRepository.save(workout));
    }

    @Transactional
    public void delete(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Workout workout = findOrThrow(id);
        validateAccess(user, workout);
        workoutRepository.delete(workout);
    }

    // ── Exercises ─────────────────────────────────────────────────────────────

    @Transactional
    public WorkoutExerciseResponse addExercise(Long workoutId,
                                                WorkoutExerciseRequest request,
                                                User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Workout workout = findOrThrow(workoutId);
        validateAccess(user, workout);

        WorkoutExercise exercise = buildExercise(request, workout);
        return toExerciseResponse(exerciseRepository.save(exercise));
    }

    @Transactional
    public WorkoutExerciseResponse updateExercise(Long workoutId, Long exerciseId,
                                                   WorkoutExerciseRequest request,
                                                   User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Workout workout = findOrThrow(workoutId);
        validateAccess(user, workout);

        WorkoutExercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new BusinessException("Exercício não encontrado.", HttpStatus.NOT_FOUND));

        if (!exercise.getWorkout().getId().equals(workoutId)) {
            throw new BusinessException("Exercício não pertence a este treino.", HttpStatus.FORBIDDEN);
        }

        exercise.setName(request.getName());
        exercise.setSets(request.getSets());
        exercise.setReps(request.getReps());
        exercise.setWeightKg(request.getWeightKg());
        exercise.setDurationSeconds(request.getDurationSeconds());
        exercise.setRestSeconds(request.getRestSeconds());
        exercise.setNote(request.getNote());
        if (request.getExerciseOrder() != null) {
            exercise.setExerciseOrder(request.getExerciseOrder());
        }

        return toExerciseResponse(exerciseRepository.save(exercise));
    }

    @Transactional
    public void deleteExercise(Long workoutId, Long exerciseId, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Workout workout = findOrThrow(workoutId);
        validateAccess(user, workout);

        WorkoutExercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new BusinessException("Exercício não encontrado.", HttpStatus.NOT_FOUND));

        if (!exercise.getWorkout().getId().equals(workoutId)) {
            throw new BusinessException("Exercício não pertence a este treino.", HttpStatus.FORBIDDEN);
        }

        exerciseRepository.delete(exercise);
    }

    // ── Summary ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public WorkoutSummaryResponse getSummary(User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup fg = requireFamilyGroup(user);
        boolean isOwner = user.getRole() == Role.OWNER;

        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());
        LocalDate startOfLastMonth = startOfMonth.minusMonths(1);
        LocalDate endOfLastMonth = startOfMonth.minusDays(1);

        List<Workout> thisMonth = isOwner
                ? workoutRepository.findByFamilyGroupAndStatusAndDateBetween(fg, WorkoutStatus.COMPLETED, startOfMonth, endOfMonth)
                : workoutRepository.findByOwnerAndStatusAndDateBetween(user, WorkoutStatus.COMPLETED, startOfMonth, endOfMonth);

        List<Workout> lastMonth = isOwner
                ? workoutRepository.findByFamilyGroupAndStatusAndDateBetween(fg, WorkoutStatus.COMPLETED, startOfLastMonth, endOfLastMonth)
                : workoutRepository.findByOwnerAndStatusAndDateBetween(user, WorkoutStatus.COMPLETED, startOfLastMonth, endOfLastMonth);

        long totalMinutes = thisMonth.stream()
                .filter(w -> w.getDurationMinutes() != null)
                .mapToLong(Workout::getDurationMinutes)
                .sum();

        long totalCalories = thisMonth.stream()
                .filter(w -> w.getCaloriesBurned() != null)
                .mapToLong(Workout::getCaloriesBurned)
                .sum();

        BigDecimal totalDistance = thisMonth.stream()
                .filter(w -> w.getDistanceKm() != null)
                .map(Workout::getDistanceKm)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<WorkoutType, Long> byType = thisMonth.stream()
                .collect(Collectors.groupingBy(Workout::getType, Collectors.counting()));

        int streak = calcStreak(thisMonth, now);

        // Próximo treino planejado
        WorkoutResponse nextPlanned = null;
        List<Workout> planned = isOwner
                ? workoutRepository.findByFamilyGroupFiltered(fg, null, WorkoutStatus.PLANNED, now, null,
                        org.springframework.data.domain.PageRequest.of(0, 1,
                                org.springframework.data.domain.Sort.by("date").ascending()))
                  .getContent()
                : workoutRepository.findByOwnerFiltered(user, null, WorkoutStatus.PLANNED, now, null,
                        org.springframework.data.domain.PageRequest.of(0, 1,
                                org.springframework.data.domain.Sort.by("date").ascending()))
                  .getContent();

        if (!planned.isEmpty()) {
            nextPlanned = toResponse(planned.get(0));
        }

        return WorkoutSummaryResponse.builder()
                .totalWorkoutsThisMonth(thisMonth.size())
                .totalWorkoutsLastMonth(lastMonth.size())
                .totalMinutesThisMonth(totalMinutes)
                .totalCaloriesThisMonth(totalCalories)
                .totalDistanceKmThisMonth(totalDistance)
                .currentStreak(streak)
                .byType(byType)
                .nextPlanned(nextPlanned)
                .build();
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private WorkoutResponse toResponse(Workout w) {
        List<WorkoutExerciseResponse> exercises = w.getExercises().stream()
                .map(this::toExerciseResponse)
                .toList();

        return WorkoutResponse.builder()
                .id(w.getId())
                .name(w.getName())
                .type(w.getType())
                .typeLabel(typeLabel(w.getType()))
                .date(w.getDate())
                .startTime(w.getStartTime())
                .durationMinutes(w.getDurationMinutes())
                .status(w.getStatus())
                .caloriesBurned(w.getCaloriesBurned())
                .heartRateAvg(w.getHeartRateAvg())
                .distanceKm(w.getDistanceKm())
                .pace(w.getPace())
                .note(w.getNote())
                .exercises(exercises)
                .ownerId(w.getOwner().getId())
                .ownerName(w.getOwner().getName())
                .createdAt(w.getCreatedAt())
                .updatedAt(w.getUpdatedAt())
                .build();
    }

    private WorkoutExerciseResponse toExerciseResponse(WorkoutExercise e) {
        return WorkoutExerciseResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .sets(e.getSets())
                .reps(e.getReps())
                .weightKg(e.getWeightKg())
                .durationSeconds(e.getDurationSeconds())
                .restSeconds(e.getRestSeconds())
                .exerciseOrder(e.getExerciseOrder())
                .note(e.getNote())
                .build();
    }

    private String typeLabel(WorkoutType type) {
        return switch (type) {
            case GYM -> "Academia";
            case RUNNING -> "Corrida";
            case CYCLING -> "Ciclismo";
            case SWIMMING -> "Natação";
            case WALKING -> "Caminhada";
            case YOGA -> "Yoga";
            case HIIT -> "HIIT";
            case FUNCTIONAL -> "Funcional";
            case OTHER -> "Outro";
        };
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private User reloadUser(User authenticatedUser) {
        return userRepository.findById(authenticatedUser.getId())
                .orElseThrow(() -> new BusinessException("Usuário não encontrado.", HttpStatus.NOT_FOUND));
    }

    private FamilyGroup requireFamilyGroup(User user) {
        FamilyGroup fg = user.getFamilyGroup();
        if (fg == null) {
            throw new BusinessException(
                    "Usuário não pertence a um grupo familiar. Crie ou entre em um grupo para gerenciar treinos.",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }
        return fg;
    }

    private Workout findOrThrow(Long id) {
        return workoutRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Treino não encontrado.", HttpStatus.NOT_FOUND));
    }

    private void validateAccess(User user, Workout workout) {
        FamilyGroup fg = requireFamilyGroup(user);
        if (!workout.getFamilyGroup().getId().equals(fg.getId())) {
            throw new BusinessException("Acesso negado a este treino.", HttpStatus.FORBIDDEN);
        }
        if (user.getRole() == Role.MEMBER && !workout.getOwner().getId().equals(user.getId())) {
            throw new BusinessException("Acesso negado a este treino.", HttpStatus.FORBIDDEN);
        }
    }

    private List<WorkoutExercise> buildExercises(List<WorkoutExerciseRequest> requests, Workout workout) {
        List<WorkoutExercise> result = new ArrayList<>();
        for (int i = 0; i < requests.size(); i++) {
            WorkoutExerciseRequest r = requests.get(i);
            WorkoutExercise e = buildExercise(r, workout);
            if (r.getExerciseOrder() == null) {
                e.setExerciseOrder(i);
            }
            result.add(e);
        }
        return result;
    }

    private WorkoutExercise buildExercise(WorkoutExerciseRequest r, Workout workout) {
        return WorkoutExercise.builder()
                .workout(workout)
                .name(r.getName())
                .sets(r.getSets())
                .reps(r.getReps())
                .weightKg(r.getWeightKg())
                .durationSeconds(r.getDurationSeconds())
                .restSeconds(r.getRestSeconds())
                .exerciseOrder(r.getExerciseOrder() != null ? r.getExerciseOrder() : 0)
                .note(r.getNote())
                .build();
    }

    private int calcStreak(List<Workout> completedThisMonth, LocalDate today) {
        if (completedThisMonth.isEmpty()) return 0;
        Set<LocalDate> days = completedThisMonth.stream()
                .map(Workout::getDate)
                .collect(Collectors.toSet());

        int streak = 0;
        LocalDate cursor = days.contains(today) ? today : today.minusDays(1);
        while (days.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }
}
