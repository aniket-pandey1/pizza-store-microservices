package com.pizzastore.userservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.pizzastore.userservice.entity.Admin;

public interface AdminRepository extends JpaRepository<Admin, Integer> {
    // Find admin by username for Login
    Admin findByAdminUsername(String adminUsername);
}