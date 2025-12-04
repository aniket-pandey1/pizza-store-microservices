package com.pizzastore.userservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.pizzastore.userservice.entity.Admin;
import com.pizzastore.userservice.repository.AdminRepository;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST})
public class AdminController {

    @Autowired
    private AdminRepository adminRepository;

    // 1. Add Admin (For initial setup)
    // URL: http://localhost:8081/admin/add
    @PostMapping("/add")
    public String addAdmin(@RequestBody Admin admin) {
        admin.setStatus("ACTIVE");
        adminRepository.save(admin);
        return "Admin added successfully!";
    }

    // 2. Admin Login
    // URL: http://localhost:8081/admin/login
    @PostMapping("/login")
    public String adminLogin(@RequestBody Admin loginData) {
        Admin admin = adminRepository.findByAdminUsername(loginData.getAdminUsername());

        if (admin != null && admin.getAdminPassword().equals(loginData.getAdminPassword())) {
            return "Admin Login Successful";
        } else {
            return "Invalid Admin Credentials";
        }
    }
}