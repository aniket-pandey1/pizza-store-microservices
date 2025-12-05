package com.pizzastore.orderservice.dto;

import java.util.List;

public class OrderRequestDTO {
    private Integer userId;
    private List<OrderItemRequest> items;

    // --- MANUAL GETTERS & SETTERS ---
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }

    // Inner static class for items
    public static class OrderItemRequest {
        private Integer menuId;
        private Integer qty;
        private Double price; // passing price from frontend for simplicity

        public Integer getMenuId() { return menuId; }
        public void setMenuId(Integer menuId) { this.menuId = menuId; }
        public Integer getQty() { return qty; }
        public void setQty(Integer qty) { this.qty = qty; }
        public Double getPrice() { return price; }
        public void setPrice(Double price) { this.price = price; }
    }
}