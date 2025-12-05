package com.pizzastore.userservice.repository;

import com.pizzastore.userservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    
    // Custom query methods (Spring Data JPA generates the SQL for you)
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
}