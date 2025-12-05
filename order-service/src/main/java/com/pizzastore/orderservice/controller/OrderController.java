package com.pizzastore.orderservice.controller;

import com.pizzastore.orderservice.dto.OrderRequestDTO;
import com.pizzastore.orderservice.entity.Order;
import com.pizzastore.orderservice.entity.OrderItem;
import com.pizzastore.orderservice.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
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

    // Helper method to send notifications (improves code cleanliness)
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

    // 1. PLACE ORDER
    @PostMapping("/place")
    public ResponseEntity<?> placeOrder(@RequestBody OrderRequestDTO request) {
        Order order = new Order();
        order.setUserId(request.getUserId());
        order.setOrderStatus("PLACED");
        order.setPaymentStatus("PAID"); // Assumes instant payment success
        
        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderRequestDTO.OrderItemRequest itemReq : request.getItems()) {
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
        
        // --- Send Order Confirmation ---
        String confirmationMessage = "Order Placed Successfully! Order ID: " + savedOrder.getOrderId() + ". Total Amount: $" + savedOrder.getTotalAmount();
        sendNotification("aniketpandeyji1221@gmail.com", "Order Confirmation", confirmationMessage);
        
        return ResponseEntity.ok(savedOrder);
    }

    // 2. GET USER ORDERS
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Order>> getUserOrders(@PathVariable Integer userId) {
        return ResponseEntity.ok(orderRepository.findByUserId(userId));
    }
    
    // 3. CANCEL ORDER (UPDATED: Revenue Subtraction and Notification)
    @PutMapping("/cancel/{orderId}")
    public ResponseEntity<?> cancelOrder(@PathVariable Integer orderId) {
        Optional<Order> optionalOrder = orderRepository.findById(orderId);
        
        if (optionalOrder.isPresent()) {
            Order order = optionalOrder.get();
            
            // Prevent cancellation if already accepted, delivered, or cancelled
            if (order.getOrderStatus().equals("ACCEPTED") || order.getOrderStatus().equals("DELIVERED") || order.getOrderStatus().equals("CANCELLED")) {
                 return ResponseEntity.badRequest().body("Order cannot be cancelled in status: " + order.getOrderStatus());
            }

            // 1. Update Status
            order.setOrderStatus("CANCELLED");
            
            // 2. Subtract Revenue (by setting payment status to REFUNDED)
            order.setPaymentStatus("REFUNDED"); 

            orderRepository.save(order);
            
            // 3. Send Notification 
            String refundMessage = "Your Order ID " + orderId + " has been CANCELLED. A refund of $" + order.getTotalAmount() + " is being processed.";
            sendNotification("aniketpandeyji1221@gmail.com", "Order Cancelled & Refunded", refundMessage);
            
            return ResponseEntity.ok("Order Cancelled and Revenue Subtracted");
        }
        return ResponseEntity.status(404).body("Order not found");
    }

    // 4. ACCEPT ORDER (UPDATED: Notification)
    @PutMapping("/accept/{orderId}")
    public ResponseEntity<?> acceptOrder(@PathVariable Integer orderId) {
        Optional<Order> optionalOrder = orderRepository.findById(orderId);
        
        if (optionalOrder.isPresent()) {
            Order order = optionalOrder.get();
            
            if (order.getOrderStatus().equals("PLACED")) {
                order.setOrderStatus("ACCEPTED"); // Or "PREPARING"
                orderRepository.save(order);
                
                // Send Notification
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