package com.mylife.fit.repository;

import com.mylife.core.domain.entity.User;
import com.mylife.fit.domain.entity.BodyMeasurement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BodyMeasurementRepository extends JpaRepository<BodyMeasurement, Long> {
    Page<BodyMeasurement> findByUser(User user, Pageable pageable);
}
