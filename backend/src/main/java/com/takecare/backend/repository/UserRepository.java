package com.takecare.backend.repository;

import com.takecare.backend.model.User;
import com.takecare.backend.model.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);
    List<User> findAllByRoleAndEnabledTrueOrderByFirstNameAscLastNameAsc(Role role);
    boolean existsByEmailIgnoreCase(String email);
}