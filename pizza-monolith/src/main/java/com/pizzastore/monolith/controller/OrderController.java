package com.pizzastore.monolith.controller;

import com.pizzastore.monolith.dto.CheckoutRequestDTO;
import com.pizzastore.monolith.entity.Order;
import com.pizzastore.monolith.entity.OrderItem;
import com.pizzastore.monolith.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    // FIX: Use configurable URLs instead of hardcoded localhost
    @Value("${notification.service.url:http://localhost:8084}")
    private String notificationServiceUrl;

    @Value("${payment.service.url:http://localhost:8085}")
    private String paymentServiceUrl;

    @Value("${user.service.url:http://localhost:8081}")
    private String userServiceUrl;

    @Autowired
    private com.pizzastore.monolith.repository.UserRepository userRepository;
    
    @Autowired
    private com.pizzastore.monolith.controller.NotificationController notificationController;

    private String getUserEmail(Integer userId) {
        return userRepository.findById(userId)
                .map(com.pizzastore.monolith.entity.User::getEmail)
                .orElse(null);
    }

    // Helper method to send notifications natively
    private void sendNotification(String email, String subject, String message) {
        if (email == null || email.isEmpty()) {
            System.err.println("Skipping notification - no email address available");
            return;
        }
        try {
            com.pizzastore.monolith.controller.NotificationDTO dto = new com.pizzastore.monolith.controller.NotificationDTO();
            dto.setEmail(email);
            dto.setSubject(subject);
            dto.setMessage(message);
            notificationController.sendNotification(dto);
            System.out.println("Notification Request Sent natively: " + subject + " to " + email);
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

    // 7. CONFIRM PAYMENT (Step 2: Mocked Payment Processing)
    @PostMapping("/confirm-payment/{orderId}")
    public ResponseEntity<?> confirmPayment(@PathVariable Integer orderId, @RequestBody Map<String, String> paymentDetails) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        
        if (order.getOrderStatus().equals("CANCELLED")) {
            return ResponseEntity.badRequest().body("Order already cancelled.");
        }

        try {
            // Mocking a successful payment natively since there is no external gateway
            order.setOrderStatus("PLACED"); 
            order.setPaymentStatus("PAID"); 
            orderRepository.save(order);
            
            // Send Confirmation Email
            String userEmail = getUserEmail(order.getUserId());
            sendNotification(userEmail, 
                    "Order Confirmed & Paid", 
                    "Order #" + orderId + " placed successfully via " + paymentDetails.get("paymentMode") + 
                    ". Total: $" + order.getTotalAmount());

            return ResponseEntity.ok("Order placed and payment confirmed natively.");
        } catch (Exception e) {
             order.setPaymentStatus("FAILED");
             orderRepository.save(order);
             return ResponseEntity.status(503).body("Payment processing failed internally.");
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
            
            // 3. FIX: Send Notification to actual user
            String userEmail = getUserEmail(order.getUserId());
            String refundMessage = "Your Order ID " + orderId + " has been CANCELLED. A refund of $" + order.getTotalAmount() + " is being processed.";
            sendNotification(userEmail, "Order Cancelled & Refunded", refundMessage);
            
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
                
                // FIX: Send notification to actual user
                String userEmail = getUserEmail(order.getUserId());
                String acceptMessage = "Your Order ID " + orderId + " has been ACCEPTED and is now being prepared!";
                sendNotification(userEmail, "Order Status Update", acceptMessage);
                
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
