package com.mylife.finance.repository;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.finance.domain.entity.RecurrencePendingNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecurrencePendingNotificationRepository extends JpaRepository<RecurrencePendingNotification, Long> {

    Page<RecurrencePendingNotification> findByFamilyGroupAndConfirmedFalse(FamilyGroup familyGroup, Pageable pageable);
    Page<RecurrencePendingNotification> findByOwnerAndConfirmedFalse(User owner, Pageable pageable);
}
