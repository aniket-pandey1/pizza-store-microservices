package com.pizzastore.paymentservice.controller;

import com.pizzastore.paymentservice.dto.PaymentRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/payments")
public class PaymentController {

    // Simulates processing a payment request
    @PostMapping("/process")
    public ResponseEntity<Map<String, String>> processPayment(@RequestBody PaymentRequest request) {
        Map<String, String> response = new HashMap<>();
        
        // --- Payment Simulation Logic ---
        
        // 1. CASH ON DELIVERY (COD) is always successful immediately
        if ("COD".equalsIgnoreCase(request.getPaymentMode())) {
            response.put("status", "SUCCESS");
            response.put("transactionId", "COD-" + request.getOrderId());
            response.put("message", "Cash on Delivery selected. Payment pending at door.");
            return ResponseEntity.ok(response);
        }
        
        // 2. ONLINE PAYMENT (Card/UPI) - We simulate a gateway that might fail
        // This helps you test "Payment Failed" scenarios in your project
        Random random = new Random();
        // 80% chance of success, 20% chance of failure (adjust as needed)
        boolean isSuccess = random.nextInt(10) > 2; 

        if (isSuccess) { 
            response.put("status", "SUCCESS");
            response.put("transactionId", "TXN-" + System.currentTimeMillis());
            response.put("message", request.getPaymentMode() + " payment processed successfully.");
            return ResponseEntity.ok(response);
        } else {
            response.put("status", "FAILED");
            response.put("transactionId", "N/A");
            response.put("message", "Payment failed due to gateway timeout.");
            // Return 400 Bad Request so the Order Service knows it failed
            return ResponseEntity.status(400).body(response); 
        }
    }
}