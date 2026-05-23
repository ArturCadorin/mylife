package com.mylife.core.service;

import com.mylife.core.domain.entity.FamilyGroup;
import com.mylife.core.domain.entity.User;
import com.mylife.core.domain.enums.Role;
import com.mylife.core.dto.request.FamilyGroupRequest;
import com.mylife.core.dto.response.FamilyGroupResponse;
import com.mylife.core.dto.response.UserSummaryResponse;
import com.mylife.core.exception.BusinessException;
import com.mylife.core.repository.FamilyGroupRepository;
import com.mylife.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FamilyGroupService {

    private static final int MAX_MEMBERS = 5;

    private final FamilyGroupRepository familyGroupRepository;
    private final UserRepository userRepository;

    @Transactional
    public FamilyGroupResponse create(FamilyGroupRequest request, User authenticatedUser) {
        User owner = reloadUser(authenticatedUser);

        if (owner.getFamilyGroup() != null) {
            throw new BusinessException("Usuário já pertence a um grupo familiar.", HttpStatus.CONFLICT);
        }

        FamilyGroup group = FamilyGroup.builder()
                .name(request.getName())
                .build();
        group = familyGroupRepository.save(group);

        owner.setFamilyGroup(group);
        group.getMembers().add(owner);
        userRepository.save(owner);

        return toResponse(group);
    }

    @Transactional(readOnly = true)
    public FamilyGroupResponse findById(Long id, User authenticatedUser) {
        User requester = reloadUser(authenticatedUser);
        FamilyGroup group = findGroupOrThrow(id);
        validateBelongsToGroup(requester, group);
        return toResponse(group);
    }

    @Transactional
    public FamilyGroupResponse addMember(Long groupId, String email, User authenticatedUser) {
        User owner = reloadUser(authenticatedUser);
        FamilyGroup group = findGroupOrThrow(groupId);
        validateIsOwnerOfGroup(owner, group);

        User newMember = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(
                        "Usuário não encontrado com o e-mail: " + email, HttpStatus.NOT_FOUND));

        if (newMember.getFamilyGroup() != null) {
            throw new BusinessException("Usuário já pertence a outro grupo familiar.", HttpStatus.CONFLICT);
        }

        if (group.getMembers().size() >= MAX_MEMBERS) {
            throw new BusinessException(
                    "O grupo familiar já atingiu o limite de " + MAX_MEMBERS + " membros.",
                    HttpStatus.UNPROCESSABLE_ENTITY);
        }

        newMember.setFamilyGroup(group);
        group.getMembers().add(newMember);
        userRepository.save(newMember);

        return toResponse(group);
    }

    @Transactional
    public FamilyGroupResponse removeMember(Long groupId, Long userId, User authenticatedUser) {
        User owner = reloadUser(authenticatedUser);
        FamilyGroup group = findGroupOrThrow(groupId);
        validateIsOwnerOfGroup(owner, group);

        if (owner.getId().equals(userId)) {
            throw new BusinessException("O OWNER não pode remover a si mesmo do grupo.", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        User member = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("Usuário não encontrado.", HttpStatus.NOT_FOUND));

        validateBelongsToGroup(member, group);

        member.setFamilyGroup(null);
        group.getMembers().removeIf(m -> m.getId().equals(member.getId()));
        userRepository.save(member);

        return toResponse(group);
    }

    @Transactional
    public FamilyGroupResponse update(Long id, FamilyGroupRequest request, User authenticatedUser) {
        User owner = reloadUser(authenticatedUser);
        FamilyGroup group = findGroupOrThrow(id);
        validateIsOwnerOfGroup(owner, group);

        group.setName(request.getName());
        familyGroupRepository.save(group);

        return toResponse(group);
    }

    @Transactional
    public void delete(Long id, User authenticatedUser) {
        User owner = reloadUser(authenticatedUser);
        FamilyGroup group = findGroupOrThrow(id);
        validateIsOwnerOfGroup(owner, group);

        // Copia a lista para evitar ConcurrentModificationException ao nullificar as referências
        List<User> members = new ArrayList<>(group.getMembers());
        members.forEach(m -> m.setFamilyGroup(null));
        userRepository.saveAll(members);

        familyGroupRepository.delete(group);
    }

    @Transactional(readOnly = true)
    public FamilyGroupResponse findMine(User authenticatedUser) {
        User user = reloadUser(authenticatedUser);
        if (user.getFamilyGroup() == null) {
            return null;
        }
        return toResponse(user.getFamilyGroup());
    }

    // --- Helpers ---

    private User reloadUser(User authenticatedUser) {
        return userRepository.findById(authenticatedUser.getId())
                .orElseThrow(() -> new BusinessException("Usuário não encontrado.", HttpStatus.NOT_FOUND));
    }

    private FamilyGroup findGroupOrThrow(Long id) {
        return familyGroupRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Grupo familiar não encontrado.", HttpStatus.NOT_FOUND));
    }

    private void validateIsOwnerOfGroup(User user, FamilyGroup group) {
        if (user.getRole() != Role.OWNER) {
            throw new BusinessException("Apenas OWNER pode realizar esta operação.", HttpStatus.FORBIDDEN);
        }
        if (user.getFamilyGroup() == null || !user.getFamilyGroup().getId().equals(group.getId())) {
            throw new BusinessException("Você não é o OWNER deste grupo.", HttpStatus.FORBIDDEN);
        }
    }

    private void validateBelongsToGroup(User user, FamilyGroup group) {
        if (user.getFamilyGroup() == null || !user.getFamilyGroup().getId().equals(group.getId())) {
            throw new BusinessException("Acesso negado a este grupo familiar.", HttpStatus.FORBIDDEN);
        }
    }

    private FamilyGroupResponse toResponse(FamilyGroup group) {
        List<UserSummaryResponse> members = group.getMembers().stream()
                .map(this::toUserSummary)
                .toList();
        return FamilyGroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .createdAt(group.getCreatedAt())
                .members(members)
                .build();
    }

    private UserSummaryResponse toUserSummary(User user) {
        return UserSummaryResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .products(new HashSet<>(user.getProducts()))
                .build();
    }
}
