package com.pizzastore.userservice.controller;

import com.pizzastore.userservice.dto.LoginDTO;
import com.pizzastore.userservice.entity.User;
import com.pizzastore.userservice.repository.UserRepository;
import com.pizzastore.userservice.util.JwtUtil;
import com.pizzastore.userservice.exception.ResourceNotFoundException; // IMPORTANT: For Exception Handling
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder; 

    // 1. Register User (Security Implemented)
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already taken");
        }
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already registered");
        }
        
        // HASH THE PASSWORD BEFORE SAVING using BCrypt
        String hashedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(hashedPassword); 

        User savedUser = userRepository.save(user);
        return ResponseEntity.ok("User registered successfully. Username: " + savedUser.getUsername());
    }

    // 2. Login User (JWT Implemented)
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginDTO loginRequest) {
        Optional<User> userOptional = userRepository.findByUsername(loginRequest.getUsername());
        
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            
            // CHECK HASHED PASSWORD
            if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                
                String token = JwtUtil.generateToken(user.getUsername(), user.getRole());
                
                Map<String, String> response = new HashMap<>();
                response.put("token", token);
                response.put("role", user.getRole());
                response.put("username", user.getUsername());
                
                return ResponseEntity.ok(response);
            }
        }
        return ResponseEntity.status(401).body("Invalid Credentials");
    }
    
    // 3A. Get Profile by Username (Used after successful login)
    @GetMapping("/detail/{username}")
    public ResponseEntity<?> getUserByUsername(@PathVariable String username) {
        // Uses ResourceNotFoundException if user is not found
        User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        
        return ResponseEntity.ok(user);
    }
    
    // 3B. NEW: Get Profile by ID (Needed for Admin CRUD Update Form Fetch)
    @GetMapping("/detail/id/{userId}")
    public ResponseEntity<?> getUserById(@PathVariable Integer userId) {
        User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        
        return ResponseEntity.ok(user);
    }

    // --------------------------------------------------------
    // --- ADMIN USER MANAGEMENT BACKEND ENDPOINTS (CRUD) ---
    // --------------------------------------------------------
    
    // 4. ADMIN: VIEW ALL USERS (C-R-U-D: Read)
    @GetMapping("/all")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // 5. ADMIN: DELETE USER (C-R-U-D: Delete)
    @DeleteMapping("/delete/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer userId) {
        if (!userRepository.existsById(userId)) {
            // Throws ResourceNotFoundException if user is missing
            throw new ResourceNotFoundException("User not found with ID for deletion: " + userId);
        }
        userRepository.deleteById(userId);
        return ResponseEntity.ok("User deleted successfully");
    }
    
    // 6. ADMIN: UPDATE USER/ROLE (C-R-U-D: Update)
    @PutMapping("/update/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable Integer userId, @RequestBody User userDetails) {
        // Fetches user or throws ResourceNotFoundException
        User existingUser = userRepository.findById(userId)
                                          .orElseThrow(() -> new ResourceNotFoundException("User not found with ID for update: " + userId));

        // Update manageable fields only
        if (userDetails.getFullName() != null) existingUser.setFullName(userDetails.getFullName());
        if (userDetails.getPhone() != null) existingUser.setPhone(userDetails.getPhone());
        
        // CRITICAL: Update Role 
        if (userDetails.getRole() != null) existingUser.setRole(userDetails.getRole());

        // Update basic user details 
        if (userDetails.getUsername() != null) existingUser.setUsername(userDetails.getUsername());
        if (userDetails.getEmail() != null) existingUser.setEmail(userDetails.getEmail());


        userRepository.save(existingUser);
        return ResponseEntity.ok("User updated successfully");
    }
}