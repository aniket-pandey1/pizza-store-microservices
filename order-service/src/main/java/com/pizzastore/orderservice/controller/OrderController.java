package com.pizzastore.orderservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.pizzastore.orderservice.entity.Bill;
import com.pizzastore.orderservice.entity.Order;
import com.pizzastore.orderservice.repository.BillRepository;
import com.pizzastore.orderservice.repository.OrderRepository;
import com.pizzastore.orderservice.service.OrderService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/order")
public class OrderController {

    @Autowired
    private OrderService orderService; // Use Service for complex logic

    @Autowired
    private OrderRepository orderRepository; // Use Repo for simple reads/updates

    @Autowired
    private BillRepository billRepository;

    // 1. Place Order (Delegates to Service -> Saves Order & Bill + Sends Email)
    @PostMapping("/place")
    public String placeOrder(@RequestBody Order order) {
        return orderService.placeOrder(order);
    }

    // 2. Get All Orders (NEW: For Admin "View Only" Page)
    @GetMapping("/all")
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    // 3. My Orders (Delegates to Service)
    @GetMapping("/myorders/{email}")
    public List<Order> getMyOrders(@PathVariable String email) {
        return orderService.getOrdersByUser(email);
    }

    // 4. View Bill
    @GetMapping("/bill/{orderId}")
    public Bill getBill(@PathVariable int orderId) {
        return billRepository.findByOrderId(orderId);
    }

    // 5. Get Revenue
    @GetMapping("/revenue")
    public Double getRevenue() {
        return billRepository.getTotalRevenue();
    }

    // 6. Cancel Order
    @PutMapping("/cancel/{id}")
    public String cancelOrder(@PathVariable int id) {
        Optional<Order> orderOpt = orderRepository.findById(id);
        
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            
            if ("Placed".equals(order.getStatus())) {
                order.setStatus("Cancelled");
                orderRepository.save(order);

                // Delete the Bill so Revenue decreases
                Bill bill = billRepository.findByOrderId(id);
                if (bill != null) {
                    billRepository.delete(bill);
                }

                return "Order Cancelled Successfully. Amount refunded.";
            } else {
                return "Cannot cancel. Order is already " + order.getStatus();
            }
        }
        return "Order not found";
    }
}