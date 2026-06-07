package com.mylife.finance.service;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.core.domain.enums.Role;
import com.mylife.core.repository.UserRepository;
import com.mylife.finance.domain.entity.Account;
import com.mylife.finance.domain.entity.Savings;
import com.mylife.finance.domain.entity.Transaction;
import com.mylife.finance.domain.enums.*;
import com.mylife.finance.dto.response.report.*;
import com.mylife.finance.repository.AccountRepository;
import com.mylife.finance.repository.InvestmentRepository;
import com.mylife.finance.repository.InvoiceRepository;
import com.mylife.finance.repository.SavingsRepository;
import com.mylife.finance.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock private TransactionRepository transactionRepository;
    @Mock private InvoiceRepository invoiceRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private SavingsRepository savingsRepository;
    @Mock private InvestmentRepository investmentRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private ReportService reportService;

    private FamilyGroup familyGroup;
    private User owner;
    private User member;
    private Account account;

    @BeforeEach
    void setUp() {
        familyGroup = FamilyGroup.builder().id(1L).name("Família").build();

        owner = User.builder()
                .id(1L).name("Owner").email("owner@test.com")
                .role(Role.OWNER).familyGroup(familyGroup)
                .build();

        member = User.builder()
                .id(2L).name("Member").email("member@test.com")
                .role(Role.MEMBER).familyGroup(familyGroup)
                .build();

        account = Account.builder()
                .id(10L).name("Conta Corrente").bankName("Banco X")
                .type(AccountType.CHECKING).balance(new BigDecimal("5000.00"))
                .currency("BRL").owner(owner).familyGroup(familyGroup)
                .active(true).createdAt(LocalDateTime.now())
                .build();
    }

    // ── getMonthlySummary ──────────────────────────────────────────────────────

    @Test
    void getMonthlySummary_owner_shouldAggregateGroupTotals() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(transactionRepository.sumByFamilyGroupAndTypeAndDateBetween(
                eq(familyGroup), eq(TransactionType.INCOME), any(), any()))
                .thenReturn(new BigDecimal("3000.00"));
        when(transactionRepository.sumByFamilyGroupAndTypeAndDateBetween(
                eq(familyGroup), eq(TransactionType.EXPENSE), any(), any()))
                .thenReturn(new BigDecimal("1500.00"));
        when(transactionRepository.sumByFamilyGroupAndTypeAndCategoryAndDateBetween(
                eq(familyGroup), eq(TransactionType.EXPENSE), eq(TransactionCategory.CREDIT_CARD), any(), any()))
                .thenReturn(new BigDecimal("500.00"));

        MonthlySummaryResponse result = reportService.getMonthlySummary("2026-05", owner);

        assertThat(result.getReferenceMonth()).isEqualTo("2026-05");
        assertThat(result.getTotalIncome()).isEqualByComparingTo("3000.00");
        // totalExpense = allExpense(1500) - ccSpending(500) = 1000
        assertThat(result.getTotalExpense()).isEqualByComparingTo("1000.00");
        // balance = income(3000) - directExpense(1000) = 2000
        assertThat(result.getBalance()).isEqualByComparingTo("2000.00");
        assertThat(result.getTotalCreditCardSpending()).isEqualByComparingTo("500.00");
        // netBalance = balance(2000) - cc(500) = 1500
        assertThat(result.getNetBalance()).isEqualByComparingTo("1500.00");
    }

    @Test
    void getMonthlySummary_member_shouldUseOwnerScopedQueries() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(member));
        when(transactionRepository.sumByOwnerAndTypeAndDateBetween(
                eq(member), eq(TransactionType.INCOME), any(), any()))
                .thenReturn(new BigDecimal("2000.00"));
        when(transactionRepository.sumByOwnerAndTypeAndDateBetween(
                eq(member), eq(TransactionType.EXPENSE), any(), any()))
                .thenReturn(new BigDecimal("800.00"));
        when(transactionRepository.sumByOwnerAndTypeAndCategoryAndDateBetween(
                eq(member), eq(TransactionType.EXPENSE), eq(TransactionCategory.CREDIT_CARD), any(), any()))
                .thenReturn(BigDecimal.ZERO);

        MonthlySummaryResponse result = reportService.getMonthlySummary("2026-05", member);

        assertThat(result.getTotalIncome()).isEqualByComparingTo("2000.00");
        assertThat(result.getTotalExpense()).isEqualByComparingTo("800.00");
        assertThat(result.getBalance()).isEqualByComparingTo("1200.00");
        assertThat(result.getNetBalance()).isEqualByComparingTo("1200.00");
    }

    // ── getCategorySummary ─────────────────────────────────────────────────────

    @Test
    void getCategorySummary_shouldReturnCategoriesWithPercentage() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        List<Object[]> rows = List.of(
                new Object[]{TransactionCategory.FOOD, new BigDecimal("600.00"), 3L},
                new Object[]{TransactionCategory.TRANSPORT, new BigDecimal("400.00"), 2L}
        );
        when(transactionRepository.findCategoryTotalsForFamilyGroup(
                eq(familyGroup), eq(TransactionType.EXPENSE), any(), any()))
                .thenReturn(rows);

        List<CategorySummaryResponse> result =
                reportService.getCategorySummary("2026-05", TransactionType.EXPENSE, owner);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getCategory()).isEqualTo(TransactionCategory.FOOD);
        assertThat(result.get(0).getTotalAmount()).isEqualByComparingTo("600.00");
        assertThat(result.get(0).getTransactionCount()).isEqualTo(3L);
        assertThat(result.get(0).getPercentageOfTotal()).isEqualByComparingTo("60.00");
        assertThat(result.get(1).getPercentageOfTotal()).isEqualByComparingTo("40.00");
    }

    @Test
    void getCategorySummary_noTransactions_shouldReturnEmptyList() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(transactionRepository.findCategoryTotalsForFamilyGroup(
                any(), any(), any(), any()))
                .thenReturn(List.of());

        List<CategorySummaryResponse> result =
                reportService.getCategorySummary("2026-05", TransactionType.EXPENSE, owner);

        assertThat(result).isEmpty();
    }

    // ── getAccountBalanceEvolution ─────────────────────────────────────────────

    @Test
    void getAccountBalanceEvolution_shouldBuildRunningBalance() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(accountRepository.findById(10L)).thenReturn(Optional.of(account));

        // Use a past month so to.isBefore(today) = true and the "after" queries are invoked
        LocalDate apr1 = LocalDate.of(2026, 4, 1);
        LocalDate apr30 = LocalDate.of(2026, 4, 30);

        // account.balance = 5000 (current); after apr30 there were no flows
        when(transactionRepository.sumByAccountAndTypeAfterDate(
                eq(account), eq(TransactionType.INCOME), eq(apr30)))
                .thenReturn(BigDecimal.ZERO);
        when(transactionRepository.sumByAccountAndTypeAfterDate(
                eq(account), eq(TransactionType.EXPENSE), eq(apr30)))
                .thenReturn(BigDecimal.ZERO);

        // Two days with activity
        List<Object[]> dailyFlows = List.of(
                new Object[]{apr1, TransactionType.INCOME, new BigDecimal("1000.00")},
                new Object[]{apr1, TransactionType.EXPENSE, new BigDecimal("200.00")},
                new Object[]{LocalDate.of(2026, 4, 15), TransactionType.EXPENSE, new BigDecimal("300.00")}
        );
        when(transactionRepository.findDailyFlowByAccount(eq(account), eq(apr1), eq(apr30)))
                .thenReturn(dailyFlows);

        AccountBalanceEvolutionResponse result =
                reportService.getAccountBalanceEvolution(10L, apr1, apr30, owner);

        assertThat(result.getAccountId()).isEqualTo(10L);
        assertThat(result.getEntries()).hasSize(2);

        // netInRange = (1000 - 200) + (0 - 300) = 500
        // balanceAtEnd = 5000 - 0 + 0 = 5000
        // startBalance = 5000 - 500 = 4500
        // after apr1: 4500 + 1000 - 200 = 5300
        BalanceEntryResponse firstEntry = result.getEntries().get(0);
        assertThat(firstEntry.getDate()).isEqualTo(apr1);
        assertThat(firstEntry.getBalance()).isEqualByComparingTo("5300.00");

        // after apr15: 5300 - 300 = 5000
        BalanceEntryResponse secondEntry = result.getEntries().get(1);
        assertThat(secondEntry.getBalance()).isEqualByComparingTo("5000.00");
    }

    // ── getMonthlyComparison ───────────────────────────────────────────────────

    @Test
    void getMonthlyComparison_shouldComputeVariations() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        // current month (2026-05)
        when(transactionRepository.sumByFamilyGroupAndTypeAndDateBetween(
                eq(familyGroup), eq(TransactionType.INCOME),
                eq(LocalDate.of(2026, 5, 1)), eq(LocalDate.of(2026, 5, 31))))
                .thenReturn(new BigDecimal("3000.00"));
        when(transactionRepository.sumByFamilyGroupAndTypeAndDateBetween(
                eq(familyGroup), eq(TransactionType.EXPENSE),
                eq(LocalDate.of(2026, 5, 1)), eq(LocalDate.of(2026, 5, 31))))
                .thenReturn(new BigDecimal("1000.00"));
        // previous month (2026-04)
        when(transactionRepository.sumByFamilyGroupAndTypeAndDateBetween(
                eq(familyGroup), eq(TransactionType.INCOME),
                eq(LocalDate.of(2026, 4, 1)), eq(LocalDate.of(2026, 4, 30))))
                .thenReturn(new BigDecimal("2000.00"));
        when(transactionRepository.sumByFamilyGroupAndTypeAndDateBetween(
                eq(familyGroup), eq(TransactionType.EXPENSE),
                eq(LocalDate.of(2026, 4, 1)), eq(LocalDate.of(2026, 4, 30))))
                .thenReturn(new BigDecimal("800.00"));

        MonthlyComparisonResponse result = reportService.getMonthlyComparison("2026-05", owner);

        assertThat(result.getCurrentMonth()).isEqualTo("2026-05");
        assertThat(result.getPreviousMonth()).isEqualTo("2026-04");
        // incomeVariation = ((3000 - 2000) / 2000) * 100 = 50%
        assertThat(result.getIncomeVariation()).isEqualByComparingTo("50.00");
        // expenseVariation = ((1000 - 800) / 800) * 100 = 25%
        assertThat(result.getExpenseVariation()).isEqualByComparingTo("25.00");
        // currBalance = 2000, prevBalance = 1200 → variation = (2000-1200)/1200*100 = 66.67%
        assertThat(result.getBalanceVariation()).isEqualByComparingTo("66.67");
    }

    // ── getRecurrenceProjection ────────────────────────────────────────────────

    @Test
    void getRecurrenceProjection_shouldReturnActiveRecurrences() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));

        Transaction recurring = Transaction.builder()
                .id(100L).description("Aluguel").amount(new BigDecimal("1200.00"))
                .type(TransactionType.EXPENSE).category(TransactionCategory.HOME)
                .recurrenceType(RecurrenceType.AUTOMATIC)
                .recurrenceFrequency(RecurrenceFrequency.MONTHLY)
                .nextOccurrenceDate(LocalDate.of(2026, 6, 1))
                .account(account).owner(owner).familyGroup(familyGroup)
                .build();

        when(transactionRepository.findActiveRecurrencesByFamilyGroup(
                eq(familyGroup), anyList()))
                .thenReturn(List.of(recurring));

        LocalDate from = LocalDate.of(2026, 6, 1);
        LocalDate to   = LocalDate.of(2026, 6, 30);
        List<RecurrenceProjectionResponse> result = reportService.getRecurrenceProjection(owner, from, to);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getDescription()).isEqualTo("Aluguel");
        assertThat(result.get(0).getAmount()).isEqualByComparingTo("1200.00");
        assertThat(result.get(0).getExpectedDate()).isEqualTo(LocalDate.of(2026, 6, 1));
        assertThat(result.get(0).getRecurrenceFrequency()).isEqualTo(RecurrenceFrequency.MONTHLY);
        assertThat(result.get(0).getAccountName()).isEqualTo("Conta Corrente");
    }

    // ── getFinancialOverview ───────────────────────────────────────────────────

    @Test
    void getFinancialOverview_owner_shouldSumAllActiveAccounts() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));

        Account account2 = Account.builder()
                .id(11L).name("Poupança").bankName("Banco Y")
                .type(AccountType.SAVINGS).balance(new BigDecimal("2000.00"))
                .currency("BRL").owner(member).familyGroup(familyGroup)
                .active(true).createdAt(LocalDateTime.now())
                .build();

        when(accountRepository.findAllByFamilyGroupAndActiveTrue(familyGroup))
                .thenReturn(List.of(account, account2));
        when(savingsRepository.findAllByFamilyGroup(familyGroup))
                .thenReturn(List.of());
        when(invoiceRepository.sumDebtByFamilyGroupAndStatuses(eq(familyGroup), anyList()))
                .thenReturn(new BigDecimal("300.00"));
        when(investmentRepository.sumCurrentValueByFamilyGroup(1L))
                .thenReturn(BigDecimal.ZERO);

        FinancialOverviewResponse result = reportService.getFinancialOverview(owner);

        // totalBalance = 5000 + 2000 = 7000
        assertThat(result.getTotalBalanceAllAccounts()).isEqualByComparingTo("7000.00");
        assertThat(result.getTotalSavings()).isEqualByComparingTo("0.00");
        assertThat(result.getTotalCreditCardDebt()).isEqualByComparingTo("300.00");
        // netWorth = 7000 + 0 + 0 - 300 = 6700
        assertThat(result.getNetWorth()).isEqualByComparingTo("6700.00");
        assertThat(result.getAccountSummaries()).hasSize(2);
    }

    @Test
    void getFinancialOverview_withSavings_shouldIncludeInNetWorth() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(accountRepository.findAllByFamilyGroupAndActiveTrue(familyGroup))
                .thenReturn(List.of(account));

        Savings savings = Savings.builder()
                .id(20L).name("Reserva").currentAmount(new BigDecimal("10000.00"))
                .cdiRate(new BigDecimal("100")).currentCdiValue(new BigDecimal("10.50"))
                .owner(owner).familyGroup(familyGroup)
                .createdAt(LocalDateTime.now())
                .build();

        when(savingsRepository.findAllByFamilyGroup(familyGroup))
                .thenReturn(List.of(savings));
        when(invoiceRepository.sumDebtByFamilyGroupAndStatuses(eq(familyGroup), anyList()))
                .thenReturn(BigDecimal.ZERO);
        when(investmentRepository.sumCurrentValueByFamilyGroup(1L))
                .thenReturn(BigDecimal.ZERO);

        FinancialOverviewResponse result = reportService.getFinancialOverview(owner);

        assertThat(result.getTotalSavings()).isEqualByComparingTo("10000.00");
        // netWorth = 5000 + 10000 + 0 - 0 = 15000
        assertThat(result.getNetWorth()).isEqualByComparingTo("15000.00");
        assertThat(result.getSavingsSummaries()).hasSize(1);
    }
}
