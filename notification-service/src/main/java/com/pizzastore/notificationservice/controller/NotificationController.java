package com.pizzastore.notificationservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notification")
public class NotificationController {

    @Autowired
    private JavaMailSender javaMailSender;

    @PostMapping("/send")
    public String sendNotification(@RequestBody NotificationDTO notificationRequest) {
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            
            // 1. Set Sender
            mailMessage.setFrom("aniketpandeyji1221@gmail.com");
            
            // 2. Set Recipient 
            // (Make sure the email in the request is valid, or hardcode your own for testing)
            mailMessage.setTo(notificationRequest.getEmail());
            
            // 3. Set Subject and Body
            mailMessage.setSubject("PizzaStore Order Confirmation");
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