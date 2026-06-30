package com.pizzastore.monolith.controller;

public class NotificationDTO {
    private String email;
    private String subject;  // FIX: Added missing subject field
    private String message;

    // Manual Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
