package com.pizzastore.notificationservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/notification")
public class NotificationController {

    @Autowired
    private JavaMailSender javaMailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @PostMapping("/send")
    public String sendNotification(@RequestBody NotificationDTO notificationRequest) {
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            
            // 1. Set Sender
            mailMessage.setFrom(fromEmail);
            
            // 2. Set Recipient 
            mailMessage.setTo(notificationRequest.getEmail());
            
            // 3. FIX: Use subject from DTO instead of hardcoded value
            String subject = notificationRequest.getSubject();
            if (subject == null || subject.isEmpty()) {
                subject = "PizzaStore Order Confirmation";
            }
            mailMessage.setSubject(subject);
            mailMessage.setText(notificationRequest.getMessage());

            // 4. Send Email
            javaMailSender.send(mailMessage);

            System.out.println("EMAIL SENT SUCCESSFULLY TO: " + notificationRequest.getEmail());
            return "Email Sent Successfully";
            
        } catch (Exception e) {
            e.printStackTrace();
            return "Error sending email: " + e.getMessage();
        }
    }
}