package com.pizzastore.orderservice.dto;

import java.util.List;

public class CheckoutRequestDTO {
    private Integer userId;
    private List<OrderItemRequest> items;

    // Inner class for the items in the cart
    public static class OrderItemRequest {
        private Integer menuId;
        private Integer qty;
        private Double price; 

        public Integer getMenuId() { return menuId; }
        public void setMenuId(Integer menuId) { this.menuId = menuId; }
        public Integer getQty() { return qty; }
        public void setQty(Integer qty) { this.qty = qty; }
        public Double getPrice() { return price; }
        public void setPrice(Double price) { this.price = price; }
    }
    
    // Getters and Setters
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }
}