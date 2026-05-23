package com.mylife.core.service;

import com.mylife.core.domain.entity.User;
import com.mylife.core.dto.request.ChangePasswordRequest;
import com.mylife.core.dto.request.LoginRequest;
import com.mylife.core.dto.request.RegisterRequest;
import com.mylife.core.dto.request.UpdateProfileRequest;
import com.mylife.core.dto.response.AuthResponse;
import com.mylife.core.exception.BusinessException;
import com.mylife.core.repository.UserRepository;
import com.mylife.core.security.JwtService;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("E-mail já cadastrado.", HttpStatus.CONFLICT);
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .products(request.getProducts())
                .build();

        user = userRepository.save(user);
        return toAuthResponse(user, jwtService.generateToken(user));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // authenticate() valida as credenciais; o principal retornado é uma entidade
        // carregada em sessão interna do DaoAuthenticationProvider (já fechada ao retornar).
        // Recarregamos o usuário dentro desta transação para garantir acesso às coleções lazy.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException("Usuário não encontrado.", HttpStatus.NOT_FOUND));

        return toAuthResponse(user, jwtService.generateToken(user));
    }

    @Transactional
    public AuthResponse updateProfile(UpdateProfileRequest request, User currentUser) {
        currentUser.setName(request.getName());
        User saved = userRepository.save(currentUser);
        return toAuthResponse(saved, jwtService.generateToken(saved));
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request, User currentUser) {
        if (!passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPasswordHash())) {
            throw new BusinessException("Senha atual incorreta.", HttpStatus.BAD_REQUEST);
        }
        currentUser.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(currentUser);
    }

    private AuthResponse toAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                // Copia para HashSet simples: força o lazy load dentro da transação
                // e evita LazyInitializationException na serialização Jackson
                .products(new HashSet<>(user.getProducts()))
                .build();
    }
}
