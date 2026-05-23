package com.mylife.finance.repository;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.finance.domain.entity.Account;
import com.mylife.finance.domain.entity.Transaction;
import com.mylife.finance.domain.enums.RecurrenceType;
import com.mylife.finance.domain.enums.TransactionCategory;
import com.mylife.finance.domain.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // OWNER queries
    Page<Transaction> findByFamilyGroup(FamilyGroup familyGroup, Pageable pageable);
    Page<Transaction> findByFamilyGroupAndType(FamilyGroup familyGroup, TransactionType type, Pageable pageable);
    Page<Transaction> findByFamilyGroupAndAccount(FamilyGroup familyGroup, Account account, Pageable pageable);
    Page<Transaction> findByFamilyGroupAndTypeAndAccount(FamilyGroup familyGroup, TransactionType type, Account account, Pageable pageable);

    // MEMBER queries
    Page<Transaction> findByOwner(User owner, Pageable pageable);
    Page<Transaction> findByOwnerAndType(User owner, TransactionType type, Pageable pageable);
    Page<Transaction> findByOwnerAndAccount(User owner, Account account, Pageable pageable);
    Page<Transaction> findByOwnerAndTypeAndAccount(User owner, TransactionType type, Account account, Pageable pageable);

    // Scheduler: parent recurring transactions due for processing
    @Query("SELECT t.id FROM Transaction t " +
           "WHERE t.recurrenceType IN :types " +
           "AND t.nextOccurrenceDate <= :date " +
           "AND t.parentTransaction IS NULL " +
           "AND t.pending = false")
    List<Long> findDueRecurringTransactionIds(@Param("types") List<RecurrenceType> types,
                                              @Param("date") LocalDate date);

    // Reports: monthly sums by type
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.familyGroup = :fg AND t.type = :type " +
           "AND t.date BETWEEN :from AND :to AND t.pending = false")
    BigDecimal sumByFamilyGroupAndTypeAndDateBetween(@Param("fg") FamilyGroup fg,
                                                     @Param("type") TransactionType type,
                                                     @Param("from") LocalDate from,
                                                     @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.owner = :owner AND t.type = :type " +
           "AND t.date BETWEEN :from AND :to AND t.pending = false")
    BigDecimal sumByOwnerAndTypeAndDateBetween(@Param("owner") User owner,
                                               @Param("type") TransactionType type,
                                               @Param("from") LocalDate from,
                                               @Param("to") LocalDate to);

    // Reports: monthly sums by type + category (e.g. credit card spending)
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.familyGroup = :fg AND t.type = :type AND t.category = :category " +
           "AND t.date BETWEEN :from AND :to AND t.pending = false")
    BigDecimal sumByFamilyGroupAndTypeAndCategoryAndDateBetween(@Param("fg") FamilyGroup fg,
                                                                @Param("type") TransactionType type,
                                                                @Param("category") TransactionCategory category,
                                                                @Param("from") LocalDate from,
                                                                @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.owner = :owner AND t.type = :type AND t.category = :category " +
           "AND t.date BETWEEN :from AND :to AND t.pending = false")
    BigDecimal sumByOwnerAndTypeAndCategoryAndDateBetween(@Param("owner") User owner,
                                                          @Param("type") TransactionType type,
                                                          @Param("category") TransactionCategory category,
                                                          @Param("from") LocalDate from,
                                                          @Param("to") LocalDate to);

    // Reports: category breakdown
    @Query("SELECT t.category, SUM(t.amount), COUNT(t) FROM Transaction t " +
           "WHERE t.familyGroup = :fg AND t.type = :type " +
           "AND t.date BETWEEN :from AND :to AND t.pending = false " +
           "GROUP BY t.category ORDER BY SUM(t.amount) DESC")
    List<Object[]> findCategoryTotalsForFamilyGroup(@Param("fg") FamilyGroup fg,
                                                    @Param("type") TransactionType type,
                                                    @Param("from") LocalDate from,
                                                    @Param("to") LocalDate to);

    @Query("SELECT t.category, SUM(t.amount), COUNT(t) FROM Transaction t " +
           "WHERE t.owner = :owner AND t.type = :type " +
           "AND t.date BETWEEN :from AND :to AND t.pending = false " +
           "GROUP BY t.category ORDER BY SUM(t.amount) DESC")
    List<Object[]> findCategoryTotalsForOwner(@Param("owner") User owner,
                                              @Param("type") TransactionType type,
                                              @Param("from") LocalDate from,
                                              @Param("to") LocalDate to);

    // Reports: account balance evolution — daily income/expense grouped by date
    @Query("SELECT t.date, t.type, SUM(t.amount) FROM Transaction t " +
           "WHERE t.account = :account AND t.date BETWEEN :from AND :to AND t.pending = false " +
           "GROUP BY t.date, t.type ORDER BY t.date ASC")
    List<Object[]> findDailyFlowByAccount(@Param("account") Account account,
                                          @Param("from") LocalDate from,
                                          @Param("to") LocalDate to);

    // Reports: sum of a transaction type after a given date (used to recompute balance at range end)
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.account = :account AND t.type = :type AND t.date > :after AND t.pending = false")
    BigDecimal sumByAccountAndTypeAfterDate(@Param("account") Account account,
                                            @Param("type") TransactionType type,
                                            @Param("after") LocalDate after);

    // Reports: active recurrences for projection
    @Query("SELECT t FROM Transaction t JOIN FETCH t.account " +
           "WHERE t.familyGroup = :fg AND t.recurrenceType IN :types " +
           "AND t.parentTransaction IS NULL AND t.pending = false AND t.nextOccurrenceDate IS NOT NULL")
    List<Transaction> findActiveRecurrencesByFamilyGroup(@Param("fg") FamilyGroup fg,
                                                         @Param("types") List<RecurrenceType> types);

    @Query("SELECT t FROM Transaction t JOIN FETCH t.account " +
           "WHERE t.owner = :owner AND t.recurrenceType IN :types " +
           "AND t.parentTransaction IS NULL AND t.pending = false AND t.nextOccurrenceDate IS NOT NULL")
    List<Transaction> findActiveRecurrencesByOwner(@Param("owner") User owner,
                                                   @Param("types") List<RecurrenceType> types);
}
