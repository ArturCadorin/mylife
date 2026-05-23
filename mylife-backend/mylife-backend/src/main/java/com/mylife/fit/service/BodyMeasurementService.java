package com.mylife.fit.service;

import com.mylife.core.domain.entity.User;
import com.mylife.core.exception.BusinessException;
import com.mylife.core.repository.UserRepository;
import com.mylife.fit.domain.entity.BodyMeasurement;
import com.mylife.fit.dto.request.BodyMeasurementRequest;
import com.mylife.fit.dto.response.BodyMeasurementResponse;
import com.mylife.fit.repository.BodyMeasurementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BodyMeasurementService {

    private final BodyMeasurementRepository measurementRepository;
    private final UserRepository userRepository;

    @Transactional
    public BodyMeasurementResponse create(BodyMeasurementRequest request, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        BodyMeasurement m = BodyMeasurement.builder()
                .user(user)
                .date(request.getDate())
                .weightKg(request.getWeightKg())
                .bodyFatPercentage(request.getBodyFatPercentage())
                .muscleMassKg(request.getMuscleMassKg())
                .waistCm(request.getWaistCm())
                .chestCm(request.getChestCm())
                .hipsCm(request.getHipsCm())
                .leftArmCm(request.getLeftArmCm())
                .rightArmCm(request.getRightArmCm())
                .leftThighCm(request.getLeftThighCm())
                .rightThighCm(request.getRightThighCm())
                .note(request.getNote())
                .build();
        return toResponse(measurementRepository.save(m));
    }

    @Transactional(readOnly = true)
    public Page<BodyMeasurementResponse> findAll(User authenticatedUser, Pageable pageable) {
        User user = reloadUser(authenticatedUser);
        return measurementRepository.findByUser(user, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public BodyMeasurementResponse findById(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        BodyMeasurement m = findOrThrow(id);
        validateOwnership(user, m);
        return toResponse(m);
    }

    @Transactional
    public void delete(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        BodyMeasurement m = findOrThrow(id);
        validateOwnership(user, m);
        measurementRepository.delete(m);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User reloadUser(User authenticatedUser) {
        return userRepository.findById(authenticatedUser.getId())
                .orElseThrow(() -> new BusinessException("Usuário não encontrado.", HttpStatus.NOT_FOUND));
    }

    private BodyMeasurement findOrThrow(Long id) {
        return measurementRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Medida não encontrada.", HttpStatus.NOT_FOUND));
    }

    private void validateOwnership(User user, BodyMeasurement m) {
        if (!m.getUser().getId().equals(user.getId())) {
            throw new BusinessException("Acesso negado a esta medida.", HttpStatus.FORBIDDEN);
        }
    }

    private BodyMeasurementResponse toResponse(BodyMeasurement m) {
        return BodyMeasurementResponse.builder()
                .id(m.getId())
                .userId(m.getUser().getId())
                .date(m.getDate())
                .weightKg(m.getWeightKg())
                .bodyFatPercentage(m.getBodyFatPercentage())
                .muscleMassKg(m.getMuscleMassKg())
                .waistCm(m.getWaistCm())
                .chestCm(m.getChestCm())
                .hipsCm(m.getHipsCm())
                .leftArmCm(m.getLeftArmCm())
                .rightArmCm(m.getRightArmCm())
                .leftThighCm(m.getLeftThighCm())
                .rightThighCm(m.getRightThighCm())
                .note(m.getNote())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
