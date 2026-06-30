package com.pizzastore.monolith.controller;

import com.pizzastore.monolith.entity.Menu;
import com.pizzastore.monolith.repository.MenuRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

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
    private RestTemplate restTemplate;

    // FIX: Use configurable URL instead of hardcoded localhost
    @Value("${user.service.url:http://localhost:8081}")
    private String userServiceUrl;

    private String getUserServiceBase() {
        return userServiceUrl + "/users";
    }

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

    @Autowired
    private com.pizzastore.monolith.repository.UserRepository userRepository;

    // ----------------------------------------------------
    // --- ADMIN USER MANAGEMENT CLIENT ENDPOINTS (CRUD) ---
    // ----------------------------------------------------

    // 6. ADMIN: VIEW ALL USERS
    @GetMapping("/users/all")
    public ResponseEntity<List<com.pizzastore.monolith.entity.User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // 7. ADMIN: DELETE USER
    @DeleteMapping("/users/delete/{userId}")
    public ResponseEntity<String> deleteUser(@PathVariable Integer userId) {
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.status(404).body("User not found");
        }
        userRepository.deleteById(userId);
        return ResponseEntity.ok("User deleted successfully");
    }

    // 8. ADMIN: UPDATE USER/ROLE
    @PutMapping("/users/update/{userId}")
    public ResponseEntity<String> updateUser(@PathVariable Integer userId, @RequestBody com.pizzastore.monolith.entity.User userDetails) {
        Optional<com.pizzastore.monolith.entity.User> existingUserOpt = userRepository.findById(userId);
        if (!existingUserOpt.isPresent()) {
            return ResponseEntity.status(404).body("User not found");
        }
        com.pizzastore.monolith.entity.User existingUser = existingUserOpt.get();

        if (userDetails.getFullName() != null) existingUser.setFullName(userDetails.getFullName());
        if (userDetails.getPhone() != null) existingUser.setPhone(userDetails.getPhone());
        if (userDetails.getRole() != null) existingUser.setRole(userDetails.getRole());
        if (userDetails.getUsername() != null) existingUser.setUsername(userDetails.getUsername());
        if (userDetails.getEmail() != null) existingUser.setEmail(userDetails.getEmail());

        userRepository.save(existingUser);
        return ResponseEntity.ok("User updated successfully");
    }
}
