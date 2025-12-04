package com.pizzastore.userservice.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "admins")
public class Admin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int adminId;

    @Column(name = "admin_name")
    private String adminName;

    @Column(name = "admin_username", unique = true)
    private String adminUsername;

    @Column(name = "admin_password")
    private String adminPassword;

    private String status; // ACTIVE or INACTIVE

    // Constructors
    public Admin() {}

    public Admin(String adminName, String adminUsername, String adminPassword) {
        this.adminName = adminName;
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
        this.status = "ACTIVE";
    }

    // Getters and Setters
    public int getAdminId() { return adminId; }
    public void setAdminId(int adminId) { this.adminId = adminId; }

    public String getAdminName() { return adminName; }
    public void setAdminName(String adminName) { this.adminName = adminName; }

    public String getAdminUsername() { return adminUsername; }
    public void setAdminUsername(String adminUsername) { this.adminUsername = adminUsername; }

    public String getAdminPassword() { return adminPassword; }
    public void setAdminPassword(String adminPassword) { this.adminPassword = adminPassword; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}