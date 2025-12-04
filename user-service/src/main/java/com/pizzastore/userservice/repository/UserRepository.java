package com.pizzastore.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.pizzastore.userservice.entity.User;

public interface UserRepository extends JpaRepository<User, Integer> {
    // Find user by email for login
    User findByEmail(String email);
}