package com.mylife.finance.repository;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.finance.domain.entity.Account;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountRepository extends JpaRepository<Account, Long> {

    Page<Account> findByFamilyGroup(FamilyGroup familyGroup, Pageable pageable);

    Page<Account> findByOwner(User owner, Pageable pageable);

    List<Account> findAllByFamilyGroupAndActiveTrue(FamilyGroup familyGroup);

    List<Account> findAllByOwnerAndActiveTrue(User owner);
}
