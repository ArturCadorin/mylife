package com.mylife.finance.service;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.core.domain.enums.Role;
import com.mylife.core.exception.BusinessException;
import com.mylife.core.repository.UserRepository;
import com.mylife.finance.domain.entity.Account;
import com.mylife.finance.domain.entity.WishListItem;
import com.mylife.finance.domain.enums.WishListStatus;
import com.mylife.finance.dto.request.PurchaseRequest;
import com.mylife.finance.dto.request.WishListItemRequest;
import com.mylife.finance.dto.request.WishListItemUpdateRequest;
import com.mylife.finance.dto.response.WishListItemResponse;
import com.mylife.finance.domain.enums.TransactionCategory;
import com.mylife.finance.domain.enums.TransactionType;
import com.mylife.finance.dto.request.TransactionRequest;
import com.mylife.finance.dto.response.TransactionResponse;
import com.mylife.finance.repository.AccountRepository;
import com.mylife.finance.repository.WishListItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class WishListService {

    private static final DateTimeFormatter YEAR_MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    private final WishListItemRepository wishListItemRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final TransactionService transactionService;

    @Transactional
    public WishListItemResponse create(WishListItemRequest request, User authenticatedUser) {
        User owner = reloadUser(authenticatedUser);
        FamilyGroup familyGroup = requireFamilyGroup(owner);
        Account linkedAccount = resolveLinkedAccount(request.getLinkedAccountId(), familyGroup);

        WishListItem item = WishListItem.builder()
                .name(request.getName())
                .description(request.getDescription())
                .estimatedPrice(request.getEstimatedPrice())
                .category(request.getCategory())
                .priority(request.getPriority())
                .estimatedMonth(parseYearMonth(request.getEstimatedMonth()))
                .linkedAccount(linkedAccount)
                .owner(owner)
                .familyGroup(familyGroup)
                .build();

        return toResponse(wishListItemRepository.save(item));
    }

    @Transactional(readOnly = true)
    public Page<WishListItemResponse> findAll(User authenticatedUser, WishListStatus status, Pageable pageable) {
        User user = reloadUser(authenticatedUser);
        FamilyGroup familyGroup = requireFamilyGroup(user);

        if (user.getRole() == Role.OWNER) {
            return status != null
                    ? wishListItemRepository.findByFamilyGroupAndStatus(familyGroup, status, pageable).map(this::toResponse)
                    : wishListItemRepository.findByFamilyGroup(familyGroup, pageable).map(this::toResponse);
        }
        return status != null
                ? wishListItemRepository.findByOwnerAndStatus(user, status, pageable).map(this::toResponse)
                : wishListItemRepository.findByOwner(user, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public WishListItemResponse findById(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        WishListItem item = findItemOrThrow(id);
        validateAccess(user, item);
        return toResponse(item);
    }

    @Transactional
    public WishListItemResponse update(Long id, WishListItemUpdateRequest request, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        WishListItem item = findItemOrThrow(id);
        validateAccess(user, item);
        requirePending(item, "atualizar");

        FamilyGroup familyGroup = requireFamilyGroup(user);
        Account linkedAccount = resolveLinkedAccount(request.getLinkedAccountId(), familyGroup);

        item.setName(request.getName());
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        if (request.getEstimatedPrice() != null) item.setEstimatedPrice(request.getEstimatedPrice());
        if (request.getCategory() != null) item.setCategory(request.getCategory());
        if (request.getPriority() != null) item.setPriority(request.getPriority());
        if (request.getEstimatedMonth() != null) item.setEstimatedMonth(parseYearMonth(request.getEstimatedMonth()));
        item.setLinkedAccount(linkedAccount);

        return toResponse(wishListItemRepository.save(item));
    }

    @Transactional
    public WishListItemResponse markAsPurchased(Long id, PurchaseRequest request, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        WishListItem item = findItemOrThrow(id);
        validateAccess(user, item);
        requirePending(item, "marcar como comprado");

        FamilyGroup familyGroup = requireFamilyGroup(user);
        Account linkedAccount = resolveLinkedAccount(request.getLinkedAccountId(), familyGroup);

        item.setStatus(WishListStatus.PURCHASED);
        item.setPurchasedAt(LocalDate.now());
        item.setLinkedAccount(linkedAccount);

        if (linkedAccount != null) {
            TransactionRequest txRequest = new TransactionRequest();
            txRequest.setType(TransactionType.EXPENSE);
            txRequest.setCategory(TransactionCategory.OTHER_EXPENSE);
            txRequest.setAmount(item.getEstimatedPrice());
            txRequest.setDescription("Compra: " + item.getName());
            txRequest.setDate(LocalDate.now());
            txRequest.setAccountId(linkedAccount.getId());
            txRequest.setNote(request.getNote());
            TransactionResponse tx = transactionService.create(txRequest, authenticatedUser);
            item.setLinkedTransactionId(tx.getId());
        }

        return toResponse(wishListItemRepository.save(item));
    }

    @Transactional
    public WishListItemResponse markAsCancelled(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        WishListItem item = findItemOrThrow(id);
        validateAccess(user, item);
        requirePending(item, "cancelar");

        item.setStatus(WishListStatus.CANCELLED);
        return toResponse(wishListItemRepository.save(item));
    }

    @Transactional
    public void delete(Long id, User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        WishListItem item = findItemOrThrow(id);
        validateAccess(user, item);
        // Exclusão permitida para qualquer status (PENDING, CANCELLED, PURCHASED)
        wishListItemRepository.delete(item);
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
                    "Usuário não pertence a um grupo familiar. Crie ou entre em um grupo para gerenciar a lista de desejos.",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }
        return fg;
    }

    private WishListItem findItemOrThrow(Long id) {
        return wishListItemRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Item não encontrado.", HttpStatus.NOT_FOUND));
    }

    private void validateAccess(User user, WishListItem item) {
        FamilyGroup familyGroup = requireFamilyGroup(user);
        if (!item.getFamilyGroup().getId().equals(familyGroup.getId())) {
            throw new BusinessException("Acesso negado a este item.", HttpStatus.FORBIDDEN);
        }
        if (user.getRole() == Role.MEMBER && !item.getOwner().getId().equals(user.getId())) {
            throw new BusinessException("Acesso negado a este item.", HttpStatus.FORBIDDEN);
        }
    }

    private void requirePending(WishListItem item, String acao) {
        if (item.getStatus() != WishListStatus.PENDING) {
            throw new BusinessException(
                    "Não é possível " + acao + " um item com status " + item.getStatus() + ".",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }

    private Account resolveLinkedAccount(Long linkedAccountId, FamilyGroup familyGroup) {
        if (linkedAccountId == null) return null;
        Account account = accountRepository.findById(linkedAccountId)
                .orElseThrow(() -> new BusinessException("Conta vinculada não encontrada.", HttpStatus.NOT_FOUND));
        if (!account.getFamilyGroup().getId().equals(familyGroup.getId())) {
            throw new BusinessException("Conta vinculada não pertence ao grupo familiar.", HttpStatus.FORBIDDEN);
        }
        return account;
    }

    private YearMonth parseYearMonth(String value) {
        try {
            return YearMonth.parse(value, YEAR_MONTH_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new BusinessException(
                    "Mês inválido: " + value + ". Use o formato yyyy-MM (ex: 2025-06).",
                    HttpStatus.BAD_REQUEST);
        }
    }

    private WishListItemResponse toResponse(WishListItem item) {
        return WishListItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .estimatedPrice(item.getEstimatedPrice())
                .category(item.getCategory())
                .priority(item.getPriority())
                .estimatedMonth(item.getEstimatedMonth().format(YEAR_MONTH_FORMATTER))
                .status(item.getStatus())
                .purchasedAt(item.getPurchasedAt())
                .linkedAccountId(item.getLinkedAccount() != null ? item.getLinkedAccount().getId() : null)
                .linkedAccountName(item.getLinkedAccount() != null ? item.getLinkedAccount().getName() : null)
                .linkedTransactionId(item.getLinkedTransactionId())
                .ownerId(item.getOwner().getId())
                .ownerName(item.getOwner().getName())
                .daysUntilEstimatedMonth(ChronoUnit.DAYS.between(LocalDate.now(), item.getEstimatedMonth().atDay(1)))
                .createdAt(item.getCreatedAt())
                .build();
    }
}
