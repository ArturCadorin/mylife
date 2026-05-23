package com.mylife.finance.service;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.core.domain.enums.Role;
import com.mylife.core.exception.BusinessException;
import com.mylife.core.repository.UserRepository;
import com.mylife.finance.domain.entity.WishListItem;
import com.mylife.finance.domain.enums.WishListCategory;
import com.mylife.finance.domain.enums.WishListPriority;
import com.mylife.finance.domain.enums.WishListStatus;
import com.mylife.finance.dto.request.PurchaseRequest;
import com.mylife.finance.dto.request.WishListItemRequest;
import com.mylife.finance.dto.request.WishListItemUpdateRequest;
import com.mylife.finance.dto.response.WishListItemResponse;
import com.mylife.finance.repository.AccountRepository;
import com.mylife.finance.repository.WishListItemRepository;
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
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WishListServiceTest {

    @Mock private WishListItemRepository wishListItemRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private WishListService wishListService;

    private FamilyGroup familyGroup;
    private User owner;
    private User member;
    private WishListItem item;
    private YearMonth futureMonth;

    @BeforeEach
    void setUp() {
        familyGroup = FamilyGroup.builder().id(1L).name("Família Teste").build();

        owner = User.builder()
                .id(1L).name("Proprietário").email("owner@test.com")
                .role(Role.OWNER).familyGroup(familyGroup).build();

        member = User.builder()
                .id(2L).name("Membro").email("member@test.com")
                .role(Role.MEMBER).familyGroup(familyGroup).build();

        futureMonth = YearMonth.now().plusMonths(3);

        item = WishListItem.builder()
                .id(1L)
                .name("Notebook")
                .estimatedPrice(new BigDecimal("4500.00"))
                .category(WishListCategory.ELECTRONICS)
                .priority(WishListPriority.HIGH)
                .estimatedMonth(futureMonth)
                .status(WishListStatus.PENDING)
                .owner(owner)
                .familyGroup(familyGroup)
                .createdAt(LocalDateTime.now())
                .build();
    }

    // --- create ---

    @Test
    void create_shouldSaveAndReturnItem() {
        WishListItemRequest request = new WishListItemRequest();
        request.setName("Notebook");
        request.setEstimatedPrice(new BigDecimal("4500.00"));
        request.setCategory(WishListCategory.ELECTRONICS);
        request.setPriority(WishListPriority.HIGH);
        request.setEstimatedMonth(futureMonth.toString());

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(wishListItemRepository.save(any(WishListItem.class))).thenReturn(item);

        WishListItemResponse response = wishListService.create(request, owner);

        assertThat(response.getName()).isEqualTo("Notebook");
        assertThat(response.getStatus()).isEqualTo(WishListStatus.PENDING);
        verify(wishListItemRepository).save(any(WishListItem.class));
    }

    @Test
    void create_shouldThrow_whenUserHasNoFamilyGroup() {
        User loner = User.builder().id(3L).name("Solo").email("solo@test.com")
                .role(Role.MEMBER).familyGroup(null).build();
        when(userRepository.findById(3L)).thenReturn(Optional.of(loner));

        WishListItemRequest request = new WishListItemRequest();
        request.setName("Item");
        request.setEstimatedPrice(BigDecimal.TEN);
        request.setCategory(WishListCategory.OTHER);
        request.setPriority(WishListPriority.LOW);
        request.setEstimatedMonth(futureMonth.toString());

        assertThatThrownBy(() -> wishListService.create(request, loner))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("grupo familiar")
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    // --- findAll ---

    @Test
    void findAll_asOwner_withoutStatusFilter_shouldReturnAllFamilyItems() {
        PageRequest pageable = PageRequest.of(0, 20);
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(wishListItemRepository.findByFamilyGroup(familyGroup, pageable))
                .thenReturn(new PageImpl<>(List.of(item)));

        Page<WishListItemResponse> result = wishListService.findAll(owner, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(wishListItemRepository).findByFamilyGroup(familyGroup, pageable);
        verify(wishListItemRepository, never()).findByFamilyGroupAndStatus(any(), any(), any());
    }

    @Test
    void findAll_asOwner_withStatusFilter_shouldUseFilteredQuery() {
        PageRequest pageable = PageRequest.of(0, 20);
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(wishListItemRepository.findByFamilyGroupAndStatus(familyGroup, WishListStatus.PENDING, pageable))
                .thenReturn(new PageImpl<>(List.of(item)));

        Page<WishListItemResponse> result = wishListService.findAll(owner, WishListStatus.PENDING, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(wishListItemRepository).findByFamilyGroupAndStatus(familyGroup, WishListStatus.PENDING, pageable);
    }

    @Test
    void findAll_asMember_withoutStatusFilter_shouldReturnOnlyOwnItems() {
        PageRequest pageable = PageRequest.of(0, 20);
        when(userRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(wishListItemRepository.findByOwner(member, pageable))
                .thenReturn(new PageImpl<>(List.of(item)));

        Page<WishListItemResponse> result = wishListService.findAll(member, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(wishListItemRepository).findByOwner(member, pageable);
        verify(wishListItemRepository, never()).findByFamilyGroup(any(), any());
    }

    // --- findById ---

    @Test
    void findById_shouldReturn_whenOwnerAccesses() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(wishListItemRepository.findById(1L)).thenReturn(Optional.of(item));

        WishListItemResponse response = wishListService.findById(1L, owner);

        assertThat(response.getId()).isEqualTo(1L);
    }

    @Test
    void findById_shouldThrow_whenItemBelongsToDifferentGroup() {
        FamilyGroup otherGroup = FamilyGroup.builder().id(99L).name("Outro").build();
        WishListItem otherItem = WishListItem.builder()
                .id(99L).name("X").estimatedPrice(BigDecimal.TEN)
                .category(WishListCategory.OTHER).priority(WishListPriority.LOW)
                .estimatedMonth(futureMonth).status(WishListStatus.PENDING)
                .owner(owner).familyGroup(otherGroup).createdAt(LocalDateTime.now()).build();

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(wishListItemRepository.findById(99L)).thenReturn(Optional.of(otherItem));

        assertThatThrownBy(() -> wishListService.findById(99L, owner))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void findById_shouldThrow_whenMemberAccessesOtherMembersItem() {
        WishListItem ownerItem = WishListItem.builder()
                .id(1L).name("Item do Owner").estimatedPrice(BigDecimal.TEN)
                .category(WishListCategory.OTHER).priority(WishListPriority.LOW)
                .estimatedMonth(futureMonth).status(WishListStatus.PENDING)
                .owner(owner).familyGroup(familyGroup).createdAt(LocalDateTime.now()).build();

        when(userRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(wishListItemRepository.findById(1L)).thenReturn(Optional.of(ownerItem));

        assertThatThrownBy(() -> wishListService.findById(1L, member))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    // --- update ---

    @Test
    void update_shouldUpdateFields_whenPending() {
        WishListItemUpdateRequest request = new WishListItemUpdateRequest();
        request.setName("Notebook Atualizado");
        request.setEstimatedPrice(new BigDecimal("5000.00"));
        request.setPriority(WishListPriority.MEDIUM);

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(wishListItemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(wishListItemRepository.save(item)).thenReturn(item);

        wishListService.update(1L, request, owner);

        assertThat(item.getName()).isEqualTo("Notebook Atualizado");
        assertThat(item.getEstimatedPrice()).isEqualByComparingTo("5000.00");
        assertThat(item.getPriority()).isEqualTo(WishListPriority.MEDIUM);
        verify(wishListItemRepository).save(item);
    }

    @Test
    void update_shouldThrow_whenNotPending() {
        item.setStatus(WishListStatus.PURCHASED);
        WishListItemUpdateRequest request = new WishListItemUpdateRequest();
        request.setName("Nome");

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(wishListItemRepository.findById(1L)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> wishListService.update(1L, request, owner))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PURCHASED")
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    // --- markAsPurchased ---

    @Test
    void markAsPurchased_shouldSetStatusAndPurchasedAt() {
        PurchaseRequest request = new PurchaseRequest();

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(wishListItemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(wishListItemRepository.save(item)).thenReturn(item);

        WishListItemResponse response = wishListService.markAsPurchased(1L, request, owner);

        assertThat(item.getStatus()).isEqualTo(WishListStatus.PURCHASED);
        assertThat(item.getPurchasedAt()).isEqualTo(LocalDate.now());
        assertThat(response.getStatus()).isEqualTo(WishListStatus.PURCHASED);
        verify(wishListItemRepository).save(item);
    }

    @Test
    void markAsPurchased_shouldThrow_whenNotPending() {
        item.setStatus(WishListStatus.CANCELLED);

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(wishListItemRepository.findById(1L)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> wishListService.markAsPurchased(1L, new PurchaseRequest(), owner))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("CANCELLED")
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);

        verify(wishListItemRepository, never()).save(any());
    }

    // --- markAsCancelled ---

    @Test
    void markAsCancelled_shouldSetStatusCancelled() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(wishListItemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(wishListItemRepository.save(item)).thenReturn(item);

        WishListItemResponse response = wishListService.markAsCancelled(1L, owner);

        assertThat(item.getStatus()).isEqualTo(WishListStatus.CANCELLED);
        assertThat(response.getStatus()).isEqualTo(WishListStatus.CANCELLED);
    }

    @Test
    void markAsCancelled_shouldThrow_whenNotPending() {
        item.setStatus(WishListStatus.PURCHASED);

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(wishListItemRepository.findById(1L)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> wishListService.markAsCancelled(1L, owner))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    // --- delete ---

    @Test
    void delete_shouldSucceed_whenPending() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(wishListItemRepository.findById(1L)).thenReturn(Optional.of(item));

        wishListService.delete(1L, owner);

        verify(wishListItemRepository).delete(item);
    }

    @Test
    void delete_shouldThrow_whenNotPending() {
        item.setStatus(WishListStatus.PURCHASED);

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(wishListItemRepository.findById(1L)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> wishListService.delete(1L, owner))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getStatus())
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);

        verify(wishListItemRepository, never()).delete(any());
    }

    // --- daysUntilEstimatedMonth ---

    @Test
    void response_shouldCalculateDaysUntilFutureMonth() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(wishListItemRepository.findById(1L)).thenReturn(Optional.of(item));

        WishListItemResponse response = wishListService.findById(1L, owner);

        long expected = ChronoUnit.DAYS.between(LocalDate.now(), futureMonth.atDay(1));
        assertThat(response.getDaysUntilEstimatedMonth()).isEqualTo(expected);
        assertThat(response.getDaysUntilEstimatedMonth()).isPositive();
    }

    @Test
    void response_shouldReturnNegativeDays_whenEstimatedMonthIsPast() {
        item.setEstimatedMonth(YearMonth.now().minusMonths(2));
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(wishListItemRepository.findById(1L)).thenReturn(Optional.of(item));

        WishListItemResponse response = wishListService.findById(1L, owner);

        assertThat(response.getDaysUntilEstimatedMonth()).isNegative();
    }
}
