package com.mylife.fit.repository;

import com.mylife.core.domain.entity.User;
import com.mylife.fit.domain.entity.FitProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FitProfileRepository extends JpaRepository<FitProfile, Long> {
    Optional<FitProfile> findByUser(User user);
    boolean existsByUser(User user);
}
