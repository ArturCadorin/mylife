package com.mylife.finance.service;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.core.domain.enums.Role;
import com.mylife.core.exception.BusinessException;
import com.mylife.core.repository.UserRepository;
import com.mylife.finance.domain.entity.Account;
import com.mylife.finance.domain.entity.Savings;
import com.mylife.finance.domain.entity.Transaction;
import com.mylife.finance.domain.enums.InvoiceStatus;
import com.mylife.finance.domain.enums.RecurrenceType;
import com.mylife.finance.domain.enums.TransactionCategory;
import com.mylife.finance.domain.enums.TransactionType;
import com.mylife.finance.dto.response.AccountResponse;
import com.mylife.finance.dto.response.SavingsResponse;
import com.mylife.finance.dto.response.report.*;
import com.mylife.finance.repository.AccountRepository;
import com.mylife.finance.repository.InvestmentRepository;
import com.mylife.finance.repository.InvoiceRepository;
import com.mylife.finance.repository.SavingsRepository;
import com.mylife.finance.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private static final DateTimeFormatter YEAR_MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    private final TransactionRepository transactionRepository;
    private final InvoiceRepository invoiceRepository;
    private final AccountRepository accountRepository;
    private final SavingsRepository savingsRepository;
    private final InvestmentRepository investmentRepository;
    private final UserRepository userRepository;

    // ── Monthly summary ────────────────────────────────────────────────────────

    public MonthlySummaryResponse getMonthlySummary(String yearMonthStr, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup fg = requireFamilyGroup(user);
        boolean isOwner = user.getRole() == Role.OWNER;

        YearMonth ym = parseYearMonth(yearMonthStr);
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();

        BigDecimal totalIncome;
        BigDecimal totalAllExpense;
        BigDecimal totalCreditCardSpending;

        if (isOwner) {
            totalIncome = transactionRepository.sumByFamilyGroupAndTypeAndDateBetween(fg, TransactionType.INCOME, from, to);
            totalAllExpense = transactionRepository.sumByFamilyGroupAndTypeAndDateBetween(fg, TransactionType.EXPENSE, from, to);
            totalCreditCardSpending = transactionRepository.sumByFamilyGroupAndTypeAndCategoryAndDateBetween(
                    fg, TransactionType.EXPENSE, TransactionCategory.CREDIT_CARD, from, to);
        } else {
            totalIncome = transactionRepository.sumByOwnerAndTypeAndDateBetween(user, TransactionType.INCOME, from, to);
            totalAllExpense = transactionRepository.sumByOwnerAndTypeAndDateBetween(user, TransactionType.EXPENSE, from, to);
            totalCreditCardSpending = transactionRepository.sumByOwnerAndTypeAndCategoryAndDateBetween(
                    user, TransactionType.EXPENSE, TransactionCategory.CREDIT_CARD, from, to);
        }

        BigDecimal totalExpense = totalAllExpense.subtract(totalCreditCardSpending);
        BigDecimal balance = totalIncome.subtract(totalExpense);
        BigDecimal netBalance = balance.subtract(totalCreditCardSpending);

        return MonthlySummaryResponse.builder()
                .referenceMonth(yearMonthStr)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .balance(balance)
                .totalCreditCardSpending(totalCreditCardSpending)
                .netBalance(netBalance)
                .build();
    }

    // ── Category breakdown ─────────────────────────────────────────────────────

    public List<CategorySummaryResponse> getCategorySummary(String yearMonthStr,
                                                             TransactionType type,
                                                             User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup fg = requireFamilyGroup(user);
        boolean isOwner = user.getRole() == Role.OWNER;

        YearMonth ym = parseYearMonth(yearMonthStr);
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();

        List<Object[]> rows = isOwner
                ? transactionRepository.findCategoryTotalsForFamilyGroup(fg, type, from, to)
                : transactionRepository.findCategoryTotalsForOwner(user, type, from, to);

        BigDecimal totalAmount = rows.stream()
                .map(r -> (BigDecimal) r[1])
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return rows.stream().map(r -> {
            TransactionCategory category = (TransactionCategory) r[0];
            BigDecimal amount = (BigDecimal) r[1];
            Long count = (Long) r[2];
            BigDecimal pct = totalAmount.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO
                    : amount.multiply(BigDecimal.valueOf(100)).divide(totalAmount, 2, RoundingMode.HALF_UP);
            return CategorySummaryResponse.builder()
                    .category(category)
                    .totalAmount(amount)
                    .transactionCount(count)
                    .percentageOfTotal(pct)
                    .build();
        }).toList();
    }

    // ── Account balance evolution ──────────────────────────────────────────────

    public AccountBalanceEvolutionResponse getAccountBalanceEvolution(Long accountId,
                                                                       LocalDate from,
                                                                       LocalDate to,
                                                                       User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup fg = requireFamilyGroup(user);

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new BusinessException("Conta não encontrada.", HttpStatus.NOT_FOUND));

        if (!account.getFamilyGroup().getId().equals(fg.getId())) {
            throw new BusinessException("Acesso negado a esta conta.", HttpStatus.FORBIDDEN);
        }
        if (user.getRole() == Role.MEMBER && !account.getOwner().getId().equals(user.getId())) {
            throw new BusinessException("Acesso negado a esta conta.", HttpStatus.FORBIDDEN);
        }

        // Build a map of date → [income, expense] from raw grouped rows
        List<Object[]> rawFlows = transactionRepository.findDailyFlowByAccount(account, from, to);
        Map<LocalDate, BigDecimal[]> dailyMap = new TreeMap<>();
        for (Object[] row : rawFlows) {
            LocalDate date = (LocalDate) row[0];
            TransactionType type = (TransactionType) row[1];
            BigDecimal amount = (BigDecimal) row[2];
            dailyMap.computeIfAbsent(date, d -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            if (type == TransactionType.INCOME) {
                dailyMap.get(date)[0] = dailyMap.get(date)[0].add(amount);
            } else {
                dailyMap.get(date)[1] = dailyMap.get(date)[1].add(amount);
            }
        }

        // Reconstruct balance at start of range:
        //   account.balance is current; subtract net flow that occurred after "to"
        LocalDate today = LocalDate.now();
        BigDecimal incomeAfter = to.isBefore(today)
                ? transactionRepository.sumByAccountAndTypeAfterDate(account, TransactionType.INCOME, to)
                : BigDecimal.ZERO;
        BigDecimal expenseAfter = to.isBefore(today)
                ? transactionRepository.sumByAccountAndTypeAfterDate(account, TransactionType.EXPENSE, to)
                : BigDecimal.ZERO;

        BigDecimal balanceAtEndOfRange = account.getBalance().subtract(incomeAfter).add(expenseAfter);

        BigDecimal netInRange = dailyMap.values().stream()
                .map(v -> v[0].subtract(v[1]))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal runningBalance = balanceAtEndOfRange.subtract(netInRange);

        // Build entries in chronological order
        List<BalanceEntryResponse> entries = new ArrayList<>();
        for (Map.Entry<LocalDate, BigDecimal[]> entry : dailyMap.entrySet()) {
            BigDecimal income = entry.getValue()[0];
            BigDecimal expense = entry.getValue()[1];
            runningBalance = runningBalance.add(income).subtract(expense);
            entries.add(BalanceEntryResponse.builder()
                    .date(entry.getKey())
                    .balance(runningBalance)
                    .totalIncome(income)
                    .totalExpense(expense)
                    .build());
        }

        return AccountBalanceEvolutionResponse.builder()
                .accountId(account.getId())
                .accountName(account.getName())
                .entries(entries)
                .build();
    }

    // ── Monthly comparison ─────────────────────────────────────────────────────

    public MonthlyComparisonResponse getMonthlyComparison(String yearMonthStr, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup fg = requireFamilyGroup(user);
        boolean isOwner = user.getRole() == Role.OWNER;

        YearMonth current = parseYearMonth(yearMonthStr);
        YearMonth previous = current.minusMonths(1);

        LocalDate cFrom = current.atDay(1), cTo = current.atEndOfMonth();
        LocalDate pFrom = previous.atDay(1), pTo = previous.atEndOfMonth();

        BigDecimal currIncome, prevIncome, currExpense, prevExpense;

        if (isOwner) {
            currIncome  = transactionRepository.sumByFamilyGroupAndTypeAndDateBetween(fg, TransactionType.INCOME,  cFrom, cTo);
            prevIncome  = transactionRepository.sumByFamilyGroupAndTypeAndDateBetween(fg, TransactionType.INCOME,  pFrom, pTo);
            currExpense = transactionRepository.sumByFamilyGroupAndTypeAndDateBetween(fg, TransactionType.EXPENSE, cFrom, cTo);
            prevExpense = transactionRepository.sumByFamilyGroupAndTypeAndDateBetween(fg, TransactionType.EXPENSE, pFrom, pTo);
        } else {
            currIncome  = transactionRepository.sumByOwnerAndTypeAndDateBetween(user, TransactionType.INCOME,  cFrom, cTo);
            prevIncome  = transactionRepository.sumByOwnerAndTypeAndDateBetween(user, TransactionType.INCOME,  pFrom, pTo);
            currExpense = transactionRepository.sumByOwnerAndTypeAndDateBetween(user, TransactionType.EXPENSE, cFrom, cTo);
            prevExpense = transactionRepository.sumByOwnerAndTypeAndDateBetween(user, TransactionType.EXPENSE, pFrom, pTo);
        }

        BigDecimal currBalance = currIncome.subtract(currExpense);
        BigDecimal prevBalance = prevIncome.subtract(prevExpense);

        return MonthlyComparisonResponse.builder()
                .currentMonth(current.format(YEAR_MONTH_FMT))
                .previousMonth(previous.format(YEAR_MONTH_FMT))
                .currentIncome(currIncome)
                .previousIncome(prevIncome)
                .incomeVariation(computeVariation(prevIncome, currIncome))
                .currentExpense(currExpense)
                .previousExpense(prevExpense)
                .expenseVariation(computeVariation(prevExpense, currExpense))
                .currentBalance(currBalance)
                .previousBalance(prevBalance)
                .balanceVariation(computeVariation(prevBalance, currBalance))
                .build();
    }

    // ── Recurrence projection ──────────────────────────────────────────────────

    public List<RecurrenceProjectionResponse> getRecurrenceProjection(User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup fg = requireFamilyGroup(user);
        boolean isOwner = user.getRole() == Role.OWNER;

        List<RecurrenceType> activeTypes = List.of(RecurrenceType.AUTOMATIC, RecurrenceType.MANUAL);

        List<Transaction> recurrences = isOwner
                ? transactionRepository.findActiveRecurrencesByFamilyGroup(fg, activeTypes)
                : transactionRepository.findActiveRecurrencesByOwner(user, activeTypes);

        return recurrences.stream().map(t -> RecurrenceProjectionResponse.builder()
                .description(t.getDescription())
                .amount(t.getAmount())
                .type(t.getType())
                .category(t.getCategory())
                .expectedDate(t.getNextOccurrenceDate())
                .recurrenceFrequency(t.getRecurrenceFrequency())
                .accountName(t.getAccount().getName())
                .build()).toList();
    }

    // ── Financial overview ─────────────────────────────────────────────────────

    public FinancialOverviewResponse getFinancialOverview(User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup fg = requireFamilyGroup(user);
        boolean isOwner = user.getRole() == Role.OWNER;

        List<Account> accounts = isOwner
                ? accountRepository.findAllByFamilyGroupAndActiveTrue(fg)
                : accountRepository.findAllByOwnerAndActiveTrue(user);

        List<Savings> allSavings = isOwner
                ? savingsRepository.findAllByFamilyGroup(fg)
                : savingsRepository.findAllByOwner(user);

        BigDecimal totalBalance = accounts.stream()
                .map(Account::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalSavings = allSavings.stream()
                .map(Savings::getCurrentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<InvoiceStatus> unpaidStatuses = List.of(InvoiceStatus.OPEN, InvoiceStatus.CLOSED);
        BigDecimal totalCreditCardDebt = isOwner
                ? invoiceRepository.sumDebtByFamilyGroupAndStatuses(fg, unpaidStatuses)
                : invoiceRepository.sumDebtByOwnerAndStatuses(user, unpaidStatuses);

        BigDecimal totalInvestments = isOwner
                ? investmentRepository.sumCurrentValueByFamilyGroup(fg.getId())
                : investmentRepository.sumCurrentValueByOwner(user.getId());

        BigDecimal netWorth = totalBalance.add(totalSavings).add(totalInvestments).subtract(totalCreditCardDebt);

        List<AccountResponse> accountSummaries = accounts.stream().map(a -> AccountResponse.builder()
                .id(a.getId())
                .name(a.getName())
                .bankName(a.getBankName())
                .type(a.getType())
                .balance(a.getBalance())
                .currency(a.getCurrency())
                .ownerId(a.getOwner().getId())
                .ownerName(a.getOwner().getName())
                .active(a.isActive())
                .createdAt(a.getCreatedAt())
                .build()).toList();

        List<SavingsResponse> savingsSummaries = allSavings.stream().map(s -> SavingsResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .description(s.getDescription())
                .targetAmount(s.getTargetAmount())
                .currentAmount(s.getCurrentAmount())
                .cdiRate(s.getCdiRate())
                .currentCdiValue(s.getCurrentCdiValue())
                .estimatedReturn(s.getEstimatedReturn())
                .linkedAccountId(s.getLinkedAccount() != null ? s.getLinkedAccount().getId() : null)
                .linkedAccountName(s.getLinkedAccount() != null ? s.getLinkedAccount().getName() : null)
                .ownerId(s.getOwner().getId())
                .ownerName(s.getOwner().getName())
                .build()).toList();

        return FinancialOverviewResponse.builder()
                .totalBalanceAllAccounts(totalBalance)
                .totalSavings(totalSavings)
                .totalInvestments(totalInvestments)
                .totalCreditCardDebt(totalCreditCardDebt)
                .netWorth(netWorth)
                .accountSummaries(accountSummaries)
                .savingsSummaries(savingsSummaries)
                .build();
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private BigDecimal computeVariation(BigDecimal previous, BigDecimal current) {
        if (previous.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return current.subtract(previous)
                .multiply(BigDecimal.valueOf(100))
                .divide(previous.abs(), 2, RoundingMode.HALF_UP);
    }

    private User reloadUser(User authenticatedUser) {
        return userRepository.findById(authenticatedUser.getId())
                .orElseThrow(() -> new BusinessException("Usuário não encontrado.", HttpStatus.NOT_FOUND));
    }

    private FamilyGroup requireFamilyGroup(User user) {
        FamilyGroup fg = user.getFamilyGroup();
        if (fg == null) {
            throw new BusinessException(
                    "Usuário não pertence a um grupo familiar.",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }
        return fg;
    }

    private YearMonth parseYearMonth(String value) {
        try {
            return YearMonth.parse(value, YEAR_MONTH_FMT);
        } catch (DateTimeParseException e) {
            throw new BusinessException(
                    "Mês inválido: " + value + ". Use o formato yyyy-MM (ex: 2026-05).",
                    HttpStatus.BAD_REQUEST);
        }
    }
}
