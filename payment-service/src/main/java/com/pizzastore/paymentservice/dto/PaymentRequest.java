package com.pizzastore.paymentservice.dto;

import java.math.BigDecimal;

public class PaymentRequest {
    private Integer orderId;
    private BigDecimal amount;
    private String paymentMode; // COD, Card, UPI
    private Integer userId;

    // --- MANUAL GETTERS AND SETTERS ---
    public Integer getOrderId() { return orderId; }
    public void setOrderId(Integer orderId) { this.orderId = orderId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
}