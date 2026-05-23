package com.mylife.finance.service;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.core.domain.enums.Role;
import com.mylife.core.exception.BusinessException;
import com.mylife.core.repository.UserRepository;
import com.mylife.finance.domain.entity.Account;
import com.mylife.finance.dto.request.AccountRequest;
import com.mylife.finance.dto.request.AccountUpdateRequest;
import com.mylife.finance.dto.response.AccountResponse;
import com.mylife.finance.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Transactional
    public AccountResponse create(AccountRequest request, User authenticatedUser) {
        User owner = reloadUser(authenticatedUser);
        FamilyGroup familyGroup = requireFamilyGroup(owner);

        Account account = Account.builder()
                .name(request.getName())
                .bankName(request.getBankName())
                .type(request.getType())
                .balance(request.getInitialBalance())
                .currency(request.getCurrency() != null ? request.getCurrency() : "BRL")
                .owner(owner)
                .familyGroup(familyGroup)
                .build();

        return toResponse(accountRepository.save(account));
    }

    @Transactional(readOnly = true)
    public Page<AccountResponse> findAll(User authenticatedUser, Pageable pageable) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup familyGroup = requireFamilyGroup(user);

        if (user.getRole() == Role.OWNER) {
            return accountRepository.findByFamilyGroup(familyGroup, pageable).map(this::toResponse);
        }
        return accountRepository.findByOwner(user, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public AccountResponse findById(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Account account = findAccountOrThrow(id);
        validateAccess(user, account);
        return toResponse(account);
    }

    @Transactional
    public AccountResponse update(Long id, AccountUpdateRequest request, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Account account = findAccountOrThrow(id);
        validateAccess(user, account);

        account.setName(request.getName());
        account.setBankName(request.getBankName());
        account.setType(request.getType());
        if (request.getCurrency() != null) {
            account.setCurrency(request.getCurrency());
        }

        return toResponse(accountRepository.save(account));
    }

    @Transactional
    public void deactivate(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Account account = findAccountOrThrow(id);
        validateAccess(user, account);

        account.setActive(false);
        accountRepository.save(account);
    }

    @Transactional
    public void delete(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        Account account = findAccountOrThrow(id);
        validateAccess(user, account);

        accountRepository.delete(account);
    }

    // --- Helpers ---

    private User reloadUser(User authenticatedUser) {
        return userRepository.findById(authenticatedUser.getId())
                .orElseThrow(() -> new BusinessException("Usuário não encontrado.", HttpStatus.NOT_FOUND));
    }

    private FamilyGroup requireFamilyGroup(User user) {
        FamilyGroup fg = user.getFamilyGroup();
        if (fg == null) {
            throw new BusinessException(
                    "Usuário não pertence a um grupo familiar. Crie ou entre em um grupo para gerenciar contas.",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }
        return fg;
    }

    private Account findAccountOrThrow(Long id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Conta não encontrada.", HttpStatus.NOT_FOUND));
    }

    private void validateAccess(User user, Account account) {
        FamilyGroup familyGroup = requireFamilyGroup(user);
        if (!account.getFamilyGroup().getId().equals(familyGroup.getId())) {
            throw new BusinessException("Acesso negado a esta conta.", HttpStatus.FORBIDDEN);
        }
        if (user.getRole() == Role.MEMBER && !account.getOwner().getId().equals(user.getId())) {
            throw new BusinessException("Acesso negado a esta conta.", HttpStatus.FORBIDDEN);
        }
    }

    private AccountResponse toResponse(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .name(account.getName())
                .bankName(account.getBankName())
                .type(account.getType())
                .balance(account.getBalance())
                .currency(account.getCurrency())
                .ownerId(account.getOwner().getId())
                .ownerName(account.getOwner().getName())
                .active(account.isActive())
                .createdAt(account.getCreatedAt())
                .build();
    }
}
