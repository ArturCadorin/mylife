package com.mylife.finance.service;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.core.domain.enums.Role;
import com.mylife.core.exception.BusinessException;
import com.mylife.core.repository.UserRepository;
import com.mylife.finance.domain.entity.Account;
import com.mylife.finance.domain.entity.RecurrencePendingNotification;
import com.mylife.finance.domain.entity.Transaction;
import com.mylife.finance.domain.enums.*;
import com.mylife.finance.dto.request.ConfirmRecurrenceRequest;
import com.mylife.finance.dto.request.TransactionRequest;
import com.mylife.finance.dto.request.TransactionUpdateRequest;
import com.mylife.finance.dto.response.TransactionResponse;
import com.mylife.finance.repository.AccountRepository;
import com.mylife.finance.repository.RecurrencePendingNotificationRepository;
import com.mylife.finance.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock private TransactionRepository transactionRepository;
    @Mock private RecurrencePendingNotificationRepository notificationRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private TransactionService transactionService;

    private FamilyGroup familyGroup;
    private User owner;
    private User member;
    private Account account;
    private Transaction transaction;

    @BeforeEach
    void setUp() {
        familyGroup = FamilyGroup.builder().id(1L).name("Família Teste").build();

        owner = User.builder()
                .id(1L).name("Proprietário").email("owner@test.com")
                .role(Role.OWNER).familyGroup(familyGroup).build();

        member = User.builder()
                .id(2L).name("Membro").email("member@test.com")
                .role(Role.MEMBER).familyGroup(familyGroup).build();

        account = Account.builder()
                .id(1L).name("Conta Corrente").bankName("Banco X")
                .type(AccountType.CHECKING).balance(new BigDecimal("1000.00"))
                .currency("BRL").owner(owner).familyGroup(familyGroup).active(true)
                .build();

        transaction = Transaction.builder()
                .id(1L).account(account).owner(owner).familyGroup(familyGroup)
                .type(TransactionType.INCOME).category(TransactionCategory.SALARY)
                .amount(new BigDecimal("500.00")).date(LocalDate.now())
                .recurrenceType(RecurrenceType.NONE).recurrenceCurrentCount(0)
                .pending(false).createdAt(LocalDateTime.now())
                .build();
    }

    // --- create ---

    @Test
    void create_shouldAddToBalance_whenIncome() {
        TransactionRequest request = buildRequest(TransactionType.INCOME, TransactionCategory.SALARY, "500.00");

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);

        TransactionResponse response = transactionService.create(request, owner);

        assertThat(account.getBalance()).isEqualByComparingTo("1500.00");
        verify(accountRepository).save(account);
        assertThat(response.getType()).isEqualTo(TransactionType.INCOME);
    }

    @Test
    void create_shouldSubtractFromBalance_whenExpense() {
        Transaction expense = Transaction.builder()
                .id(2L).account(account).owner(owner).familyGroup(familyGroup)
                .type(TransactionType.EXPENSE).category(TransactionCategory.FOOD)
                .amount(new BigDecimal("200.00")).date(LocalDate.now())
                .recurrenceType(RecurrenceType.NONE).recurrenceCurrentCount(0)
                .pending(false).createdAt(LocalDateTime.now()).build();

        TransactionRequest request = buildRequest(TransactionType.EXPENSE, TransactionCategory.FOOD, "200.00");

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
        when(transactionRepository.save(any(Transaction.class))).thenReturn(expense);

        transactionService.create(request, owner);

        assertThat(account.getBalance()).isEqualByComparingTo("800.00");
        verify(accountRepository).save(account);
    }

    @Test
    void create_shouldNotUpdateBalance_whenAutomatic() {
        Transaction parent = Transaction.builder()
                .id(3L).account(account).owner(owner).familyGroup(familyGroup)
                .type(TransactionType.EXPENSE).category(TransactionCategory.SUBSCRIPTIONS)
                .amount(new BigDecimal("50.00")).date(LocalDate.now())
                .recurrenceType(RecurrenceType.AUTOMATIC).recurrenceFrequency(RecurrenceFrequency.MONTHLY)
                .recurrenceCurrentCount(0).nextOccurrenceDate(LocalDate.now())
                .pending(false).createdAt(LocalDateTime.now()).build();

        TransactionRequest request = buildRequest(TransactionType.EXPENSE, TransactionCategory.SUBSCRIPTIONS, "50.00");
        request.setRecurrenceType(RecurrenceType.AUTOMATIC);
        request.setRecurrenceFrequency(RecurrenceFrequency.MONTHLY);

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
        when(transactionRepository.save(any(Transaction.class))).thenReturn(parent);

        transactionService.create(request, owner);

        assertThat(account.getBalance()).isEqualByComparingTo("1000.00");
        verify(accountRepository, never()).save(any());
    }

    @Test
    void create_shouldThrow_whenRecurrenceFrequencyMissing() {
        TransactionRequest request = buildRequest(TransactionType.INCOME, TransactionCategory.SALARY, "500.00");
        request.setRecurrenceType(RecurrenceType.MANUAL);

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));

        assertThatThrownBy(() -> transactionService.create(request, owner))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Frequência")
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void create_shouldThrow_whenAccountInactive() {
        account.setActive(false);
        TransactionRequest request = buildRequest(TransactionType.INCOME, TransactionCategory.SALARY, "500.00");

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));

        assertThatThrownBy(() -> transactionService.create(request, owner))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("inativa")
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @Test
    void create_shouldThrow_whenMemberUsesOwnersAccount() {
        Account ownerAccount = Account.builder()
                .id(1L).name("Conta do Owner").owner(owner)
                .familyGroup(familyGroup).active(true).balance(BigDecimal.ZERO)
                .build();

        TransactionRequest request = buildRequest(TransactionType.EXPENSE, TransactionCategory.FOOD, "100.00");

        when(userRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(ownerAccount));

        assertThatThrownBy(() -> transactionService.create(request, member))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    // --- findAll ---

    @Test
    void findAll_asOwner_noFilters_shouldReturnAllFamilyTransactions() {
        PageRequest pageable = PageRequest.of(0, 20);
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(transactionRepository.findByFamilyGroup(familyGroup, pageable))
                .thenReturn(new PageImpl<>(List.of(transaction)));

        Page<TransactionResponse> result = transactionService.findAll(owner, null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(transactionRepository).findByFamilyGroup(familyGroup, pageable);
    }

    @Test
    void findAll_asMember_noFilters_shouldReturnOwnTransactions() {
        PageRequest pageable = PageRequest.of(0, 20);
        when(userRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(transactionRepository.findByOwner(member, pageable))
                .thenReturn(new PageImpl<>(List.of(transaction)));

        Page<TransactionResponse> result = transactionService.findAll(member, null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(transactionRepository).findByOwner(member, pageable);
        verify(transactionRepository, never()).findByFamilyGroup(any(), any());
    }

    @Test
    void findAll_asOwner_withTypeFilter_shouldUseTypedQuery() {
        PageRequest pageable = PageRequest.of(0, 20);
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(transactionRepository.findByFamilyGroupAndType(familyGroup, TransactionType.INCOME, pageable))
                .thenReturn(new PageImpl<>(List.of(transaction)));

        Page<TransactionResponse> result = transactionService.findAll(owner, TransactionType.INCOME, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(transactionRepository).findByFamilyGroupAndType(familyGroup, TransactionType.INCOME, pageable);
    }

    // --- findById ---

    @Test
    void findById_shouldReturn_whenOwnerAccesses() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(transaction));

        TransactionResponse response = transactionService.findById(1L, owner);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getType()).isEqualTo(TransactionType.INCOME);
    }

    @Test
    void findById_shouldThrow_whenDifferentFamilyGroup() {
        FamilyGroup otherGroup = FamilyGroup.builder().id(99L).name("Outro").build();
        Transaction otherTx = Transaction.builder()
                .id(99L).account(account).owner(owner).familyGroup(otherGroup)
                .type(TransactionType.INCOME).category(TransactionCategory.SALARY)
                .amount(BigDecimal.TEN).date(LocalDate.now())
                .recurrenceType(RecurrenceType.NONE).recurrenceCurrentCount(0)
                .createdAt(LocalDateTime.now()).build();

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(transactionRepository.findById(99L)).thenReturn(Optional.of(otherTx));

        assertThatThrownBy(() -> transactionService.findById(99L, owner))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void findById_shouldThrow_whenMemberAccessesOthersTransaction() {
        Transaction ownerTx = Transaction.builder()
                .id(1L).account(account).owner(owner).familyGroup(familyGroup)
                .type(TransactionType.INCOME).category(TransactionCategory.SALARY)
                .amount(BigDecimal.TEN).date(LocalDate.now())
                .recurrenceType(RecurrenceType.NONE).recurrenceCurrentCount(0)
                .createdAt(LocalDateTime.now()).build();

        when(userRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(ownerTx));

        assertThatThrownBy(() -> transactionService.findById(1L, member))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    // --- update ---

    @Test
    void update_shouldRevertOldAndApplyNewBalance_whenAmountChanges() {
        // Account starts at 1500 (already reflects original 500 INCOME deposit)
        account.setBalance(new BigDecimal("1500.00"));

        TransactionUpdateRequest request = new TransactionUpdateRequest();
        request.setType(TransactionType.INCOME);
        request.setCategory(TransactionCategory.FREELANCE);
        request.setAmount(new BigDecimal("800.00"));
        request.setDate(LocalDate.now());
        request.setAccountId(1L);

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(transaction));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
        when(transactionRepository.save(transaction)).thenReturn(transaction);

        transactionService.update(1L, request, owner);

        // Revert 500 INCOME: 1500 - 500 = 1000; apply 800 INCOME: 1000 + 800 = 1800
        assertThat(account.getBalance()).isEqualByComparingTo("1800.00");
        verify(accountRepository, times(2)).save(account);
    }

    @Test
    void update_shouldThrow_whenTransactionIsRecurringParent() {
        Transaction parent = Transaction.builder()
                .id(1L).account(account).owner(owner).familyGroup(familyGroup)
                .type(TransactionType.EXPENSE).category(TransactionCategory.SUBSCRIPTIONS)
                .amount(new BigDecimal("50.00")).date(LocalDate.now())
                .recurrenceType(RecurrenceType.AUTOMATIC).recurrenceFrequency(RecurrenceFrequency.MONTHLY)
                .recurrenceCurrentCount(0).parentTransaction(null)
                .pending(false).createdAt(LocalDateTime.now()).build();

        TransactionUpdateRequest request = new TransactionUpdateRequest();
        request.setType(TransactionType.EXPENSE);
        request.setCategory(TransactionCategory.SUBSCRIPTIONS);
        request.setAmount(new BigDecimal("60.00"));
        request.setDate(LocalDate.now());
        request.setAccountId(1L);

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(parent));

        assertThatThrownBy(() -> transactionService.update(1L, request, owner))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("recorrente")
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);

        verify(accountRepository, never()).save(any());
    }

    // --- delete ---

    @Test
    void delete_shouldRevertBalance_whenNonRecurring() {
        account.setBalance(new BigDecimal("1500.00"));

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(transaction));

        transactionService.delete(1L, owner);

        // Revert 500 INCOME: 1500 - 500 = 1000
        assertThat(account.getBalance()).isEqualByComparingTo("1000.00");
        verify(accountRepository).save(account);
        verify(transactionRepository).delete(transaction);
    }

    @Test
    void delete_shouldNotRevertBalance_whenRecurringParent() {
        Transaction parent = Transaction.builder()
                .id(1L).account(account).owner(owner).familyGroup(familyGroup)
                .type(TransactionType.EXPENSE).category(TransactionCategory.SUBSCRIPTIONS)
                .amount(new BigDecimal("50.00")).date(LocalDate.now())
                .recurrenceType(RecurrenceType.AUTOMATIC).recurrenceFrequency(RecurrenceFrequency.MONTHLY)
                .recurrenceCurrentCount(2).parentTransaction(null)
                .pending(false).createdAt(LocalDateTime.now()).build();

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(parent));

        transactionService.delete(1L, owner);

        // Balance stays the same — recurring parent never affected it
        assertThat(account.getBalance()).isEqualByComparingTo("1000.00");
        verify(accountRepository, never()).save(any());
        verify(transactionRepository).delete(parent);
    }

    // --- confirmRecurrence ---

    @Test
    void confirmRecurrence_shouldCreateTransactionAndUpdateBalance() {
        Transaction parent = Transaction.builder()
                .id(10L).account(account).owner(owner).familyGroup(familyGroup)
                .type(TransactionType.EXPENSE).category(TransactionCategory.SUBSCRIPTIONS)
                .amount(new BigDecimal("100.00")).date(LocalDate.now().minusMonths(1))
                .recurrenceType(RecurrenceType.MANUAL).recurrenceFrequency(RecurrenceFrequency.MONTHLY)
                .recurrenceCurrentCount(0).nextOccurrenceDate(LocalDate.now())
                .pending(false).createdAt(LocalDateTime.now().minusMonths(1)).build();

        RecurrencePendingNotification notification = RecurrencePendingNotification.builder()
                .id(5L).parentTransaction(parent).scheduledDate(LocalDate.now())
                .owner(owner).familyGroup(familyGroup).confirmed(false)
                .createdAt(LocalDateTime.now()).build();

        Transaction child = Transaction.builder()
                .id(11L).account(account).owner(owner).familyGroup(familyGroup)
                .type(TransactionType.EXPENSE).category(TransactionCategory.SUBSCRIPTIONS)
                .amount(new BigDecimal("100.00")).date(LocalDate.now())
                .recurrenceType(RecurrenceType.NONE).parentTransaction(parent)
                .recurrenceCurrentCount(0).pending(false).createdAt(LocalDateTime.now()).build();

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(notificationRepository.findById(5L)).thenReturn(Optional.of(notification));
        when(transactionRepository.save(any(Transaction.class))).thenReturn(child);
        when(transactionRepository.save(parent)).thenReturn(parent);
        when(notificationRepository.save(notification)).thenReturn(notification);

        TransactionResponse response = transactionService.confirmRecurrence(5L, new ConfirmRecurrenceRequest(), owner);

        assertThat(account.getBalance()).isEqualByComparingTo("900.00"); // 1000 - 100
        assertThat(parent.getRecurrenceCurrentCount()).isEqualTo(1);
        assertThat(notification.isConfirmed()).isTrue();
        assertThat(notification.getGeneratedTransactionId()).isEqualTo(11L);
        verify(accountRepository).save(account);
        assertThat(response.getId()).isEqualTo(11L);
    }

    @Test
    void confirmRecurrence_shouldThrow_whenAlreadyConfirmed() {
        Transaction parent = Transaction.builder()
                .id(10L).account(account).owner(owner).familyGroup(familyGroup)
                .type(TransactionType.EXPENSE).category(TransactionCategory.FOOD)
                .amount(new BigDecimal("50.00")).date(LocalDate.now())
                .recurrenceType(RecurrenceType.MANUAL).recurrenceCurrentCount(1)
                .pending(false).createdAt(LocalDateTime.now()).build();

        RecurrencePendingNotification notification = RecurrencePendingNotification.builder()
                .id(5L).parentTransaction(parent).scheduledDate(LocalDate.now())
                .owner(owner).familyGroup(familyGroup).confirmed(true)
                .confirmedAt(LocalDateTime.now()).generatedTransactionId(11L)
                .createdAt(LocalDateTime.now()).build();

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(notificationRepository.findById(5L)).thenReturn(Optional.of(notification));

        assertThatThrownBy(() -> transactionService.confirmRecurrence(5L, new ConfirmRecurrenceRequest(), owner))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("já foi confirmada")
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);

        verify(transactionRepository, never()).save(any());
        verify(accountRepository, never()).save(any());
    }

    // --- Helper ---

    private TransactionRequest buildRequest(TransactionType type, TransactionCategory category, String amount) {
        TransactionRequest req = new TransactionRequest();
        req.setType(type);
        req.setCategory(category);
        req.setAmount(new BigDecimal(amount));
        req.setDate(LocalDate.now());
        req.setAccountId(1L);
        return req;
    }
}
