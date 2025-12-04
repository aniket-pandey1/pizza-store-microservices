package com.pizzastore.paymentservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.pizzastore.paymentservice.entity.Payment;
import com.pizzastore.paymentservice.repository.PaymentRepository;

@RestController
@RequestMapping("/payment")
//@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST})
public class PaymentController {

    @Autowired
    private PaymentRepository paymentRepository;

    // 1. Process a Payment
    @PostMapping("/doPay")
    public Payment doPayment(@RequestBody Payment payment) {
        // In a real app, we would talk to a Bank API here.
        // For simulation, we assume it's always successful.
        payment.setStatus("SUCCESS");
        return paymentRepository.save(payment);
    }

    // 2. Get Payment Details for an Order
    @GetMapping("/{orderId}")
    public Payment getPaymentDetails(@PathVariable int orderId) {
        return paymentRepository.findByOrderId(orderId);
    }
}