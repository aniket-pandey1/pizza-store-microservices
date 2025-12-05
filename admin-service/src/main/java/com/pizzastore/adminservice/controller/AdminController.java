package com.pizzastore.adminservice.controller;

import com.pizzastore.adminservice.entity.Menu;
import com.pizzastore.adminservice.repository.MenuRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate; // NEW IMPORT

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/admin") 
public class AdminController {

    @Autowired
    private MenuRepository menuRepository;
    
    @Autowired
    private RestTemplate restTemplate; // Inject RestTemplate

    // 1. ADD Item to Menu 
    @PostMapping("/add")
    public ResponseEntity<?> addMenu(@RequestBody Menu menu) {
        Menu savedMenu = menuRepository.save(menu);
        return ResponseEntity.ok(savedMenu);
    }

    // 2. VIEW All Menu Items
    @GetMapping("/all")
    public ResponseEntity<List<Menu>> getAllMenu() {
        return ResponseEntity.ok(menuRepository.findAll());
    }

    // 3. UPDATE Menu Item
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateMenu(@PathVariable Integer id, @RequestBody Menu menuDetails) {
        Optional<Menu> optionalMenu = menuRepository.findById(id);

        if (optionalMenu.isPresent()) {
            Menu existingMenu = optionalMenu.get();
            // ... update logic ...
            existingMenu.setName(menuDetails.getName());
            existingMenu.setCategory(menuDetails.getCategory());
            existingMenu.setBasePrice(menuDetails.getBasePrice());
            existingMenu.setDescription(menuDetails.getDescription());
            existingMenu.setIsVeg(menuDetails.getIsVeg());
            existingMenu.setImageUrl(menuDetails.getImageUrl());
            
            menuRepository.save(existingMenu);
            return ResponseEntity.ok("Menu updated successfully");
        }
        return ResponseEntity.status(404).body("Item not found");
    }

    // 4. DELETE Menu Item
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteMenu(@PathVariable Integer id) {
        if (menuRepository.existsById(id)) {
            menuRepository.deleteById(id);
            return ResponseEntity.ok("Item deleted successfully");
        }
        return ResponseEntity.status(404).body("Item not found");
    }

    // 5. GET SHOP REVENUE
    @GetMapping("/revenue")
    public ResponseEntity<BigDecimal> getShopRevenue() {
        BigDecimal revenue = menuRepository.calculateTotalRevenue();
        return ResponseEntity.ok(revenue);
    }

    // ----------------------------------------------------
    // --- ADMIN USER MANAGEMENT CLIENT ENDPOINTS (CRUD) ---
    // ----------------------------------------------------

    private static final String USER_SERVICE_BASE = "http://localhost:8081/users";
    
    // 6. ADMIN: VIEW ALL USERS
    @GetMapping("/users/all")
    public ResponseEntity<List<Object>> getAllUsers() {
        // Calls User Service (8081)
        ResponseEntity<Object[]> response = restTemplate.getForEntity(USER_SERVICE_BASE + "/all", Object[].class);
        return ResponseEntity.ok(Arrays.asList(response.getBody()));
    }

    // 7. ADMIN: DELETE USER
    @DeleteMapping("/users/delete/{userId}")
    public ResponseEntity<String> deleteUser(@PathVariable Integer userId) {
        // Calls User Service (8081)
        restTemplate.delete(USER_SERVICE_BASE + "/delete/" + userId);
        return ResponseEntity.ok("User deleted successfully");
    }

    // 8. ADMIN: UPDATE USER/ROLE
    @PutMapping("/users/update/{userId}")
    public ResponseEntity<String> updateUser(@PathVariable Integer userId, @RequestBody Object userDetails) {
        // Calls User Service (8081)
        restTemplate.put(USER_SERVICE_BASE + "/update/" + userId, userDetails);
        return ResponseEntity.ok("User updated successfully");
    }
}