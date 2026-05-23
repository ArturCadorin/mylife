package com.mylife.finance.service;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.core.domain.enums.Role;
import com.mylife.core.exception.BusinessException;
import com.mylife.core.repository.UserRepository;
import com.mylife.finance.domain.entity.Account;
import com.mylife.finance.domain.enums.AccountType;
import com.mylife.finance.dto.request.AccountRequest;
import com.mylife.finance.dto.request.AccountUpdateRequest;
import com.mylife.finance.dto.response.AccountResponse;
import com.mylife.finance.repository.AccountRepository;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AccountService accountService;

    private FamilyGroup familyGroup;
    private User owner;
    private User member;
    private Account account;

    @BeforeEach
    void setUp() {
        familyGroup = FamilyGroup.builder()
                .id(1L)
                .name("Família Teste")
                .build();

        owner = User.builder()
                .id(1L)
                .name("Proprietário")
                .email("owner@test.com")
                .role(Role.OWNER)
                .familyGroup(familyGroup)
                .build();

        member = User.builder()
                .id(2L)
                .name("Membro")
                .email("member@test.com")
                .role(Role.MEMBER)
                .familyGroup(familyGroup)
                .build();

        account = Account.builder()
                .id(1L)
                .name("Conta Corrente")
                .bankName("Nubank")
                .type(AccountType.CHECKING)
                .balance(new BigDecimal("500.00"))
                .currency("BRL")
                .owner(owner)
                .familyGroup(familyGroup)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void create_shouldSaveAndReturnAccount() {
        AccountRequest request = new AccountRequest();
        request.setName("Conta Corrente");
        request.setBankName("Nubank");
        request.setType(AccountType.CHECKING);
        request.setCurrency("BRL");
        request.setInitialBalance(new BigDecimal("500.00"));

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(accountRepository.save(any(Account.class))).thenReturn(account);

        AccountResponse response = accountService.create(request, owner);

        assertThat(response.getName()).isEqualTo("Conta Corrente");
        assertThat(response.getBalance()).isEqualByComparingTo("500.00");
        verify(accountRepository).save(any(Account.class));
    }

    @Test
    void create_shouldThrow_whenUserHasNoFamilyGroup() {
        User loner = User.builder()
                .id(3L).name("Solo").email("solo@test.com")
                .role(Role.MEMBER).familyGroup(null).build();
        when(userRepository.findById(3L)).thenReturn(Optional.of(loner));

        AccountRequest request = new AccountRequest();
        request.setName("Conta");
        request.setBankName("Banco");
        request.setType(AccountType.CASH);
        request.setInitialBalance(BigDecimal.ZERO);

        assertThatThrownBy(() -> accountService.create(request, loner))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("grupo familiar")
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @Test
    void findAll_asOwner_shouldReturnAllFamilyGroupAccounts() {
        PageRequest pageable = PageRequest.of(0, 20);
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(accountRepository.findByFamilyGroup(familyGroup, pageable))
                .thenReturn(new PageImpl<>(List.of(account)));

        Page<AccountResponse> result = accountService.findAll(owner, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(accountRepository).findByFamilyGroup(familyGroup, pageable);
        verify(accountRepository, never()).findByOwner(any(), any());
    }

    @Test
    void findAll_asMember_shouldReturnOnlyOwnAccounts() {
        PageRequest pageable = PageRequest.of(0, 20);
        when(userRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(accountRepository.findByOwner(member, pageable))
                .thenReturn(new PageImpl<>(List.of(account)));

        Page<AccountResponse> result = accountService.findAll(member, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(accountRepository).findByOwner(member, pageable);
        verify(accountRepository, never()).findByFamilyGroup(any(), any());
    }

    @Test
    void findById_shouldReturnAccount_whenOwnerAccessesAnyFamilyAccount() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));

        AccountResponse response = accountService.findById(1L, owner);

        assertThat(response.getId()).isEqualTo(1L);
    }

    @Test
    void findById_shouldThrow_whenAccountBelongsToDifferentFamilyGroup() {
        FamilyGroup otherGroup = FamilyGroup.builder().id(99L).name("Outro Grupo").build();
        Account otherAccount = Account.builder()
                .id(99L).familyGroup(otherGroup).owner(owner)
                .name("X").bankName("Y").type(AccountType.CASH)
                .balance(BigDecimal.ZERO).currency("BRL").active(true)
                .createdAt(LocalDateTime.now()).build();

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(accountRepository.findById(99L)).thenReturn(Optional.of(otherAccount));

        assertThatThrownBy(() -> accountService.findById(99L, owner))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void findById_shouldThrow_whenMemberAccessesOtherMembersAccount() {
        Account ownerAccount = Account.builder()
                .id(1L).familyGroup(familyGroup).owner(owner)
                .name("Conta do Owner").bankName("Banco").type(AccountType.CHECKING)
                .balance(BigDecimal.ZERO).currency("BRL").active(true)
                .createdAt(LocalDateTime.now()).build();

        when(userRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(ownerAccount));

        assertThatThrownBy(() -> accountService.findById(1L, member))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void update_shouldUpdateMutableFields() {
        AccountUpdateRequest request = new AccountUpdateRequest();
        request.setName("Conta Atualizada");
        request.setBankName("Itaú");
        request.setType(AccountType.SAVINGS);
        request.setCurrency("BRL");

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
        when(accountRepository.save(any(Account.class))).thenReturn(account);

        accountService.update(1L, request, owner);

        assertThat(account.getName()).isEqualTo("Conta Atualizada");
        assertThat(account.getBankName()).isEqualTo("Itaú");
        assertThat(account.getType()).isEqualTo(AccountType.SAVINGS);
        verify(accountRepository).save(account);
    }

    @Test
    void update_shouldNotChangeCurrency_whenCurrencyIsNull() {
        AccountUpdateRequest request = new AccountUpdateRequest();
        request.setName("Conta");
        request.setBankName("Banco");
        request.setType(AccountType.CHECKING);
        request.setCurrency(null);

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));
        when(accountRepository.save(any(Account.class))).thenReturn(account);

        accountService.update(1L, request, owner);

        assertThat(account.getCurrency()).isEqualTo("BRL");
    }

    @Test
    void deactivate_shouldSetActiveToFalse() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));

        accountService.deactivate(1L, owner);

        assertThat(account.isActive()).isFalse();
        verify(accountRepository).save(account);
    }

    @Test
    void delete_shouldCallRepositoryDelete() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(accountRepository.findById(1L)).thenReturn(Optional.of(account));

        accountService.delete(1L, owner);

        verify(accountRepository).delete(account);
    }

    @Test
    void delete_shouldThrow_whenAccountNotFound() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(accountRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountService.delete(99L, owner))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Conta não encontrada")
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
