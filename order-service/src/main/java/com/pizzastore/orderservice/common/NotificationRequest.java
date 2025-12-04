package com.pizzastore.orderservice.common;

public class NotificationRequest {
    private String userEmail;
    private String message;
    private String subject;

    // Getters and Setters
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
}