package com.mylife.finance.repository;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.finance.domain.entity.Investment;
import com.mylife.finance.domain.enums.InvestmentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface InvestmentRepository extends JpaRepository<Investment, Long> {

    List<Investment> findByFamilyGroupAndActiveTrue(FamilyGroup familyGroup);

    List<Investment> findByOwnerAndActiveTrue(User owner);

    List<Investment> findByFamilyGroupAndType(FamilyGroup familyGroup, InvestmentType type);

    List<Investment> findByOwnerAndType(User owner, InvestmentType type);

    @Query("SELECT COALESCE(SUM(i.currentValue), 0) FROM Investment i " +
           "WHERE i.familyGroup.id = :familyGroupId AND i.active = true")
    BigDecimal sumCurrentValueByFamilyGroup(@Param("familyGroupId") Long familyGroupId);

    @Query("SELECT COALESCE(SUM(i.currentValue), 0) FROM Investment i " +
           "WHERE i.owner.id = :ownerId AND i.active = true")
    BigDecimal sumCurrentValueByOwner(@Param("ownerId") Long ownerId);
}
