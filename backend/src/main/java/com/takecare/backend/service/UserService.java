package com.takecare.backend.service;

import com.takecare.backend.dto.auth.UserResponse;
import com.takecare.backend.dto.user.UpdateUserProfileRequest;
import com.takecare.backend.model.User;
import com.takecare.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserResponse getCurrentUserProfile() {
        User currentUser = getCurrentUser();

        return mapToResponse(currentUser);
    }

    private User getCurrentUser() {
        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (
                authentication == null ||
                        !authentication.isAuthenticated()
        ) {
            throw new IllegalStateException(
                    "No authenticated user was found"
            );
        }

        String email = authentication.getName();

        return userRepository
                .findByEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Authenticated user was not found"
                        )
                );
    }

    private UserResponse mapToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole()
        );
    }

    @Transactional
    public UserResponse updateCurrentUserProfile(
            UpdateUserProfileRequest request
    ) {
        User currentUser = getCurrentUser();

        currentUser.setFirstName(request.getFirstName());
        currentUser.setLastName(request.getLastName());

        User updatedUser = userRepository.save(currentUser);

        return mapToResponse(updatedUser);
    }
}