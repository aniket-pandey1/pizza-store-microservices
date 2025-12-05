package com.pizzastore.orderservice.controller;

import com.pizzastore.orderservice.dto.CheckoutRequestDTO; // Changed from OrderRequestDTO
import com.pizzastore.orderservice.entity.Order;
import com.pizzastore.orderservice.entity.OrderItem;
import com.pizzastore.orderservice.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private RestTemplate restTemplate;

    // Helper method to send notifications
    private void sendNotification(String email, String subject, String message) {
        try {
            String notificationUrl = "http://localhost:8084/notification/send";
            Map<String, String> emailRequest = new HashMap<>();
            emailRequest.put("email", email); 
            emailRequest.put("subject", subject);
            emailRequest.put("message", message);
            restTemplate.postForObject(notificationUrl, emailRequest, String.class);
            System.out.println("Notification Request Sent: " + subject);
        } catch (Exception e) {
            System.err.println("Failed to trigger notification for: " + subject + ". Error: " + e.getMessage());
        }
    }

    // 1. PLACE ORDER (Step 1: Save as PENDING and return ID for payment)
    @PostMapping("/place")
    public ResponseEntity<?> placeOrder(@RequestBody CheckoutRequestDTO request) {
        Order order = new Order();
        order.setUserId(request.getUserId());
        // NEW STATUSES
        order.setOrderStatus("PENDING_PAYMENT"); 
        order.setPaymentStatus("PENDING"); 
        
        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CheckoutRequestDTO.OrderItemRequest itemReq : request.getItems()) {
            OrderItem item = new OrderItem();
            item.setMenuId(itemReq.getMenuId());
            item.setQty(itemReq.getQty());
            item.setUnitPrice(BigDecimal.valueOf(itemReq.getPrice()));
            item.setOrder(order);
            
            BigDecimal lineTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQty()));
            item.setTotalPrice(lineTotal);
            
            total = total.add(lineTotal);
            orderItems.add(item);
        }

        order.setItems(orderItems);
        order.setTotalAmount(total);

        Order savedOrder = orderRepository.save(order);
        
        // Return details needed for the Payment Page
        Map<String, Object> response = new HashMap<>();
        response.put("orderId", savedOrder.getOrderId());
        response.put("totalAmount", savedOrder.getTotalAmount());
        response.put("paymentModes", Arrays.asList("Card", "UPI", "COD"));
        
        return ResponseEntity.ok(response);
    }

    // 7. CONFIRM PAYMENT (Step 2: Call Payment Service)
    @PostMapping("/confirm-payment/{orderId}")
    public ResponseEntity<?> confirmPayment(@PathVariable Integer orderId, @RequestBody Map<String, String> paymentDetails) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        
        if (order.getOrderStatus().equals("CANCELLED")) {
            return ResponseEntity.badRequest().body("Order already cancelled.");
        }

        // Prepare Payload for Payment Service (Port 8085)
        Map<String, Object> paymentRequest = new HashMap<>();
        paymentRequest.put("orderId", orderId);
        paymentRequest.put("amount", order.getTotalAmount());
        paymentRequest.put("paymentMode", paymentDetails.get("paymentMode"));
        paymentRequest.put("userId", order.getUserId());
        
        String paymentServiceUrl = "http://localhost:8085/payments/process";
        
        try {
            // Call Payment Microservice
            ResponseEntity<Map> response = restTemplate.postForEntity(paymentServiceUrl, paymentRequest, Map.class);
            Map<String, String> body = response.getBody();

            if (response.getStatusCode().is2xxSuccessful() && "SUCCESS".equals(body.get("status"))) {
                // Payment SUCCESS: Update Order
                order.setOrderStatus("PLACED"); 
                order.setPaymentStatus("PAID"); 
                orderRepository.save(order);
                
                // Send Confirmation Email
                sendNotification("aniketpandeyji1221@gmail.com", 
                        "Order Confirmed & Paid", 
                        "Order #" + orderId + " placed successfully via " + paymentDetails.get("paymentMode"));

                return ResponseEntity.ok("Order placed and payment confirmed.");
            } else {
                // Payment FAILED
                order.setPaymentStatus("FAILED");
                orderRepository.save(order);
                return ResponseEntity.status(400).body("Payment failed: " + body.get("message"));
            }

        } catch (Exception e) {
             order.setPaymentStatus("FAILED");
             orderRepository.save(order);
             // Handle 400 Bad Request from Payment Service (Simulated Failure)
             if (e.getMessage() != null && e.getMessage().contains("400")) {
                 return ResponseEntity.status(400).body("Payment failed. Please try COD or try again.");
             }
             return ResponseEntity.status(503).body("Payment gateway unavailable.");
        }
    }

    // 2. GET USER ORDERS
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Order>> getUserOrders(@PathVariable Integer userId) {
        return ResponseEntity.ok(orderRepository.findByUserId(userId));
    }
    
    // 3. CANCEL ORDER (Revenue Subtraction and Notification)
    @PutMapping("/cancel/{orderId}")
    public ResponseEntity<?> cancelOrder(@PathVariable Integer orderId) {
        Optional<Order> optionalOrder = orderRepository.findById(orderId);
        
        if (optionalOrder.isPresent()) {
            Order order = optionalOrder.get();
            
            if (order.getOrderStatus().equals("ACCEPTED") || order.getOrderStatus().equals("DELIVERED") || order.getOrderStatus().equals("CANCELLED")) {
                 return ResponseEntity.badRequest().body("Order cannot be cancelled in status: " + order.getOrderStatus());
            }

            // 1. Update Status
            order.setOrderStatus("CANCELLED");
            
            // 2. Subtract Revenue
            order.setPaymentStatus("REFUNDED"); 

            orderRepository.save(order);
            
            // 3. Send Notification
            String refundMessage = "Your Order ID " + orderId + " has been CANCELLED. A refund of $" + order.getTotalAmount() + " is being processed.";
            sendNotification("aniketpandeyji1221@gmail.com", "Order Cancelled & Refunded", refundMessage);
            
            return ResponseEntity.ok("Order Cancelled and Revenue Subtracted");
        }
        return ResponseEntity.status(404).body("Order not found");
    }

    // 4. ACCEPT ORDER (Notification)
    @PutMapping("/accept/{orderId}")
    public ResponseEntity<?> acceptOrder(@PathVariable Integer orderId) {
        Optional<Order> optionalOrder = orderRepository.findById(orderId);
        
        if (optionalOrder.isPresent()) {
            Order order = optionalOrder.get();
            
            // Only accept if status is PLACED (Payment Confirmed)
            if (order.getOrderStatus().equals("PLACED")) {
                order.setOrderStatus("ACCEPTED"); 
                orderRepository.save(order);
                
                String acceptMessage = "Your Order ID " + orderId + " has been ACCEPTED and is now being prepared!";
                sendNotification("aniketpandeyji1221@gmail.com", "Order Status Update", acceptMessage);
                
                return ResponseEntity.ok("Order Accepted and moved to preparation.");
            }
            return ResponseEntity.badRequest().body("Order cannot be accepted in its current status: " + order.getOrderStatus());
        }
        return ResponseEntity.status(404).body("Order not found");
    }

    // 5. GET ALL ORDERS (Admin Endpoint for Order Management)
    @GetMapping("/all")
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderRepository.findAll());
    }
}