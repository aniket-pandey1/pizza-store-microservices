package com.pizzastore.notificationservice.controller;

public class NotificationDTO {
    private String email;
    private String message;

    // Manual Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}