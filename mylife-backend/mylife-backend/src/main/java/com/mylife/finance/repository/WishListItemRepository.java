package com.mylife.finance.repository;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.finance.domain.entity.WishListItem;
import com.mylife.finance.domain.enums.WishListStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WishListItemRepository extends JpaRepository<WishListItem, Long> {

    Page<WishListItem> findByFamilyGroup(FamilyGroup familyGroup, Pageable pageable);

    Page<WishListItem> findByOwner(User owner, Pageable pageable);

    Page<WishListItem> findByFamilyGroupAndStatus(FamilyGroup familyGroup, WishListStatus status, Pageable pageable);

    Page<WishListItem> findByOwnerAndStatus(User owner, WishListStatus status, Pageable pageable);
}
