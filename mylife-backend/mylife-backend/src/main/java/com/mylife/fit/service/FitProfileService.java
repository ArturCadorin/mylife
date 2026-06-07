package com.mylife.fit.service;

import com.mylife.core.domain.entity.User;
import com.mylife.core.exception.BusinessException;
import com.mylife.core.repository.UserRepository;
import com.mylife.fit.domain.entity.FitProfile;
import com.mylife.fit.dto.request.FitProfileRequest;
import com.mylife.fit.dto.response.FitProfileResponse;
import com.mylife.fit.repository.FitProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FitProfileService {

    private final FitProfileRepository fitProfileRepository;
    private final UserRepository userRepository;

    @Transactional
    public FitProfileResponse getOrCreate(User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        FitProfile profile = fitProfileRepository.findByUser(user)
                .orElseGet(() -> fitProfileRepository.save(
                        FitProfile.builder().user(user).build()));
        return toResponse(profile);
    }

    @Transactional
    public FitProfileResponse upsert(FitProfileRequest request, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        FitProfile profile = fitProfileRepository.findByUser(user)
                .orElse(FitProfile.builder().user(user).build());

        profile.setHeightCm(request.getHeightCm());
        profile.setWeightKg(request.getWeightKg());
        profile.setTargetWeightKg(request.getTargetWeightKg());
        profile.setBirthDate(request.getBirthDate());
        profile.setBiologicalSex(request.getBiologicalSex());
        profile.setActivityLevel(request.getActivityLevel());

        return toResponse(fitProfileRepository.save(profile));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User reloadUser(User authenticatedUser) {
        return userRepository.findById(authenticatedUser.getId())
                .orElseThrow(() -> new BusinessException("Usuário não encontrado.", HttpStatus.NOT_FOUND));
    }

    private FitProfileResponse toResponse(FitProfile p) {
        return FitProfileResponse.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .userName(p.getUser().getName())
                .heightCm(p.getHeightCm())
                .weightKg(p.getWeightKg())
                .targetWeightKg(p.getTargetWeightKg())
                .birthDate(p.getBirthDate())
                .age(p.getAge())
                .biologicalSex(p.getBiologicalSex())
                .activityLevel(p.getActivityLevel())
                .bmi(p.getBmi())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
