package com.mylife.finance.repository;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.finance.domain.entity.CreditCard;
import com.mylife.finance.domain.entity.Invoice;
import com.mylife.finance.domain.enums.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;


public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByCreditCardAndReferenceMonth(CreditCard creditCard, YearMonth referenceMonth);

    Page<Invoice> findByCreditCardAndStatus(CreditCard creditCard, InvoiceStatus status, Pageable pageable);

    Page<Invoice> findByCreditCard(CreditCard creditCard, Pageable pageable);

    boolean existsByCreditCardAndStatusIn(CreditCard creditCard, List<InvoiceStatus> statuses);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i " +
           "WHERE i.creditCard = :card AND i.status <> :status")
    BigDecimal sumByCardAndStatusNot(@Param("card") CreditCard card,
                                     @Param("status") InvoiceStatus status);

    // Reports: total credit card debt for the overview
    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i " +
           "WHERE i.creditCard.familyGroup = :fg AND i.status IN :statuses")
    BigDecimal sumDebtByFamilyGroupAndStatuses(@Param("fg") FamilyGroup fg,
                                               @Param("statuses") List<InvoiceStatus> statuses);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i " +
           "WHERE i.creditCard.owner = :owner AND i.status IN :statuses")
    BigDecimal sumDebtByOwnerAndStatuses(@Param("owner") User owner,
                                         @Param("statuses") List<InvoiceStatus> statuses);

    List<Invoice> findByCreditCardOrderByReferenceMonthDesc(CreditCard creditCard);

    // Finance reset — bulk delete by card list (bypasses JPA cache issues)
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM Invoice i WHERE i.creditCard IN :cards")
    void deleteAllByCreditCardIn(@Param("cards") List<CreditCard> cards);

    // Simulator: invoices due in a given date range (unpaid)
    @Query("SELECT i FROM Invoice i JOIN FETCH i.creditCard " +
           "WHERE i.creditCard.familyGroup = :fg " +
           "AND i.dueDate BETWEEN :from AND :to " +
           "AND i.status IN :statuses " +
           "ORDER BY i.dueDate ASC")
    List<Invoice> findDueByFamilyGroupAndDateRange(@Param("fg") FamilyGroup fg,
                                                   @Param("from") LocalDate from,
                                                   @Param("to") LocalDate to,
                                                   @Param("statuses") List<InvoiceStatus> statuses);

    @Query("SELECT i FROM Invoice i JOIN FETCH i.creditCard " +
           "WHERE i.creditCard.owner = :owner " +
           "AND i.dueDate BETWEEN :from AND :to " +
           "AND i.status IN :statuses " +
           "ORDER BY i.dueDate ASC")
    List<Invoice> findDueByOwnerAndDateRange(@Param("owner") User owner,
                                             @Param("from") LocalDate from,
                                             @Param("to") LocalDate to,
                                             @Param("statuses") List<InvoiceStatus> statuses);

    // Finance reset
    List<Invoice> findAllByCreditCardIn(List<CreditCard> creditCards);
}
