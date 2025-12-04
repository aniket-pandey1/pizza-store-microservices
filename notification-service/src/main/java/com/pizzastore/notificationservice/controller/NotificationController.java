package com.pizzastore.notificationservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notification")
public class NotificationController {

    @Autowired
    private JavaMailSender mailSender;

    @PostMapping("/send")
    public String sendEmail(@RequestBody EmailRequest request) {
        // 1. Log the attempt
        System.out.println("------------------------------------------------");
        System.out.println("ATTEMPTING TO SEND EMAIL...");
        System.out.println("TO: " + request.getTo());
        System.out.println("SUBJECT: " + request.getSubject());
        System.out.println("------------------------------------------------");
        
        try {
            // 2. Prepare the Email
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(request.getTo());
            message.setSubject(request.getSubject());
            message.setText(request.getBody());
            
            // 3. Send it (This requires correct application.properties)
            mailSender.send(message);
            
            System.out.println("SUCCESS: Email sent to " + request.getTo());
            return "Email Sent Successfully!";
            
        } catch (Exception e) {
            // 4. Handle Errors (Wrong password, Connection issues)
            System.err.println("FAILURE: Could not send email.");
            System.err.println("ERROR: " + e.getMessage());
            return "Failed to send email: " + e.getMessage();
        }
    }
}

// DTO Class
class EmailRequest {
    private String to;
    private String subject;
    private String body;

    // Getters and Setters
    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
}