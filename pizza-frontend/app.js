const USER_SERVICE_URL = 'http://localhost:8081/users';
const ADMIN_BASE_URL = 'http://localhost:8082/admin'; // Base URL for admin endpoints
const ORDER_SERVICE_URL = 'http://localhost:8083/orders'; 

let currentUser = null; 
let cart = []; 
let allMenuItems = []; 

// =========================================================================
//                  *** VIEW TOGGLES ***
// =========================================================================

// Show Register View
document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-container').style.display = 'block';
});

// Show User Login View
document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-container').style.display = 'none';
});

// Toggle to show Admin Login
document.getElementById('show-admin-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('auth-view').style.display = 'none';
    document.getElementById('admin-login-view').style.display = 'block';
});

// Toggle back to User Login
document.getElementById('show-user-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('admin-login-view').style.display = 'none';
    document.getElementById('auth-view').style.display = 'block';
});


// =========================================================================
//                  *** AUTHENTICATION LOGIC ***
// =========================================================================

// --- Generalized Login Function ---
async function handleLogin(username, password) {
    const loginData = { username, password };

    try {
        const response = await fetch(`${USER_SERVICE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

        if (response.ok) {
            // FIX 1: Parse the JSON response from the backend (contains token, role, username)
            const responseData = await response.json(); 
            const userRole = responseData.role;
            const token = responseData.token; 
            
            // Fetch user detail using the username to get the necessary userId 
            const userResponse = await fetch(`${USER_SERVICE_URL}/detail/${username}`); 
            const userData = await userResponse.json(); // Contains userId
            
            currentUser = { 
                username: username, 
                role: userRole, 
                userId: userData.userId, 
                token: token // JWT token is stored
            }; 
            
            alert(`Login successful! Welcome, ${username}.`);
            
            document.getElementById('auth-view').style.display = 'none';
            document.getElementById('admin-login-view').style.display = 'none';
            
            if (userRole === 'ADMIN') {
                renderAdminView();
            } else {
                renderCustomerView();
            }
        } else {
            const errorText = await response.text();
            alert('Login failed: ' + errorText);
        }
    } catch (error) {
        console.error('Network Error:', error);
        alert('Could not connect to the User Service.');
    }
}


// --- 1. Customer/User Login Handler ---
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    await handleLogin(username, password);
});

// --- 2. Admin Login Handler ---
document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('admin-login-username').value;
    const password = document.getElementById('admin-login-password').value;
    await handleLogin(username, password);
});


// --- Registration Logic (Unchanged) ---
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const fullName = document.getElementById('reg-fullname').value;
    const phone = document.getElementById('reg-phone').value;

    const userData = { username, email, password, fullName, phone };

    try {
        const response = await fetch(`${USER_SERVICE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            alert('Registration successful! Please log in. NOTE: Password is now hashed.');
            document.getElementById('show-login').click(); 
        } else {
            alert('Registration failed: ' + await response.text());
        }
    } catch (error) {
        console.error('Network Error:', error);
        alert('Could not connect to the server.');
    }
});


// =========================================================================
//                  *** CUSTOMER VIEW LOGIC (FINAL) ***
// =========================================================================

function renderCustomerView() {
    document.getElementById('content-container').innerHTML = `
        <div id="customer-view">
            <h2>Pizza Menu & Sides</h2>
            <button onclick="renderCustomerOrders()" style="margin-bottom: 15px;">View My Orders</button>
            <div id="controls">
                <label for="filter-veg">Filter:</label>
                <select id="filter-veg">
                    <option value="all">All</option>
                    <option value="veg">Veg Only</option>
                    <option value="nonveg">Non-Veg Only</option>
                </select>

                <label for="sort-price">Sort:</label>
                <select id="sort-price">
                    <option value="default">Default</option>
                    <option value="low_to_high">Price Low to High</option>
                </select>
            </div>

            <div id="menu-list" class="menu-grid"></div>

            <hr>

            <h3>🛒 Your Cart (<span id="cart-count">${cart.length}</span> items)</h3>
            <div id="cart-items">No items added yet.</div>
            <p>Total: $<span id="cart-total">0.00</span></p>
            <button id="place-order-btn">Place Order</button>
        </div>
    `;

    document.getElementById('filter-veg').addEventListener('change', fetchAndRenderMenu);
    document.getElementById('sort-price').addEventListener('change', fetchAndRenderMenu);
    document.getElementById('place-order-btn').addEventListener('click', placeOrder);

    fetchAndRenderMenu();
}

// --- Customer Order History View ---
async function renderCustomerOrders() {
    const contentDiv = document.getElementById('content-container');
    contentDiv.innerHTML = '<h3>Your Order History</h3><div id="user-orders">Loading orders...</div><p><a href="#" onclick="renderCustomerView()">Back to Menu</a></p>';
    
    const ordersDiv = document.getElementById('user-orders');
    if (!currentUser || !currentUser.userId) {
        ordersDiv.innerHTML = '<p style="color: red;">Please log in to view your orders.</p>';
        return;
    }

    try {
        // Calls: /orders/user/{userId}
        const response = await fetch(`${ORDER_SERVICE_URL}/user/${currentUser.userId}`);
        if (!response.ok) throw new Error('Failed to fetch user orders.');
        const orders = await response.json();

        if (orders.length === 0) {
            ordersDiv.innerHTML = '<p>You have no past orders.</p>';
            return;
        }

        ordersDiv.innerHTML = orders.map(order => `
            <div style="border: 1px solid #ccc; margin-bottom: 10px; padding: 10px;">
                <strong>Order ID: ${order.orderId}</strong> (Total: $${order.totalAmount.toFixed(2)})<br>
                Status: **${order.orderStatus}** | Payment Status: ${order.paymentStatus}<br>
                
                ${order.orderStatus === 'PLACED' ? 
                    `<button onclick="cancelOrderFromUserDashboard(${order.orderId})" style="margin-left: 15px; background-color: #ff4d4d; color: white;">Cancel Order</button>` : ''
                }
            </div>
        `).join('');

    } catch (error) {
        ordersDiv.innerHTML = `<p style="color: red;">Error loading orders: ${error.message}</p>`;
        console.error(error);
    }
}

// --- User-Initiated Cancel Logic (Deducts Revenue) ---
async function cancelOrderFromUserDashboard(orderId) {
    if (!confirm(`Are you sure you want to cancel Order ID ${orderId}? This will trigger a refund and subtract revenue.`)) return;

    try {
        // Calls: /orders/cancel/{orderId}
        const response = await fetch(`${ORDER_SERVICE_URL}/cancel/${orderId}`, { method: 'PUT' });

        if (response.ok) {
            alert(`Order ${orderId} was successfully CANCELLED and revenue subtracted.`);
            renderCustomerOrders(); // Refresh the order list
            // Optionally, refresh Admin revenue view if an admin is currently logged in:
            if (currentUser && currentUser.role === 'ADMIN') {
                 renderRevenueView(); 
            }
        } else {
            alert(`Cancellation failed: ${await response.text()}`);
        }
    } catch (error) {
        alert('Could not connect to Order Service.');
    }
}

async function fetchAndRenderMenu() {
    const menuListDiv = document.getElementById('menu-list');
    menuListDiv.innerHTML = 'Loading menu...';
    
    if (allMenuItems.length === 0) {
        try {
            const response = await fetch(`${ADMIN_BASE_URL}/all`);
            if (!response.ok) throw new Error('Failed to fetch menu.');
            allMenuItems = await response.json();
        } catch (error) {
            menuListDiv.innerHTML = 'Error loading menu items.';
            console.error(error);
            return;
        }
    }

    let itemsToRender = [...allMenuItems]; 

    const filterValue = document.getElementById('filter-veg').value;
    if (filterValue === 'veg') {
        itemsToRender = itemsToRender.filter(item => item.isVeg === true);
    } else if (filterValue === 'nonveg') {
        itemsToRender = itemsToRender.filter(item => item.isVeg === false);
    }

    const sortValue = document.getElementById('sort-price').value;
    if (sortValue === 'low_to_high') {
        itemsToRender.sort((a, b) => a.basePrice - b.basePrice);
    }

    menuListDiv.innerHTML = itemsToRender.map(item => `
        <div class="menu-item">
            <h4>${item.name} (${item.category})</h4>
            <p>${item.description}</p>
            <p><strong>Price: $${item.basePrice.toFixed(2)}</strong></p>
            <button onclick="addToCart(${item.menuId}, '${item.name}', ${item.basePrice})">Add to Cart</button>
        </div>
    `).join('');
}


// --- Cart Management Functions (Unchanged) ---

function addToCart(menuId, name, price) {
    const existingItem = cart.find(item => item.menuId === menuId);

    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({
            menuId: menuId,
            name: name,
            price: price,
            qty: 1
        });
    }

    renderCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

function renderCart() {
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    const cartCountSpan = document.getElementById('cart-count');

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = 'No items added yet.';
        cartTotalSpan.textContent = '0.00';
        cartCountSpan.textContent = '0';
        return;
    }

    let total = 0;
    cartItemsDiv.innerHTML = cart.map((item, index) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        return `
            <div>
                ${item.name} x ${item.qty} ($${itemTotal.toFixed(2)}) 
                <button onclick="removeFromCart(${index})">Remove</button>
            </div>
        `;
    }).join('');

    cartTotalSpan.textContent = total.toFixed(2);
    cartCountSpan.textContent = cart.length;
}


// --- Checkout Logic (Unchanged) ---

async function placeOrder() {
    if (!currentUser || !currentUser.userId) {
        alert("Error: You must be logged in to place an order.");
        return;
    }
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const orderItems = cart.map(item => ({
        menuId: item.menuId,
        qty: item.qty,
        price: item.price 
    }));

    const orderRequest = {
        userId: currentUser.userId,
        items: orderItems
    };

    try {
        const response = await fetch(`${ORDER_SERVICE_URL}/place`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderRequest)
        });

        if (response.ok) {
            const orderData = await response.json();
            alert(`🎉 Order Placed Successfully! Your Order ID is ${orderData.orderId}. Check your email!`);
            
            cart = [];
            renderCart();

        } else {
            alert('Order placement failed: ' + await response.text());
        }
    } catch (error) {
        alert('Could not connect to the Order Service for checkout.');
    }
}


// =========================================================================
//                      *** ADMIN VIEW LOGIC ***
// =========================================================================

const ORDER_MGMT_URL = 'http://localhost:8083/orders'; 

function renderAdminView() {
    document.getElementById('content-container').innerHTML = `
        <div id="admin-view">
            <h2>Admin Dashboard: ${currentUser.username} (${currentUser.role})</h2>
            <p>Select a management view:</p>
            <div id="admin-nav">
                <button onclick="renderMenuManagement()">Menu Management (CRUD)</button>
                <button onclick="renderOrderManagement()">Order Management</button>
                <button onclick="renderRevenueView()">View Total Revenue</button>
                <button onclick="renderUserManagement()">User Management (CRUD)</button> <!-- NEW BUTTON -->
            </div>
            <div id="admin-content">
                <p>Welcome to the dashboard. Click an option above.</p>
            </div>
        </div>
    `;
    renderRevenueView(); 
}

// 1. REVENUE VIEW (Refreshed after cancellation/acceptance)
async function renderRevenueView() {
    const adminContentDiv = document.getElementById('admin-content');
    adminContentDiv.innerHTML = '<h3>💰 Shop Revenue</h3><p>Calculating total paid revenue...</p>';

    try {
        const response = await fetch(`${ADMIN_BASE_URL}/revenue`);
        if (!response.ok) throw new Error('Failed to fetch revenue.');
        
        const revenue = await response.json(); 
        adminContentDiv.innerHTML = `
            <h3>💰 Total Paid Revenue:</h3>
            <p style="font-size: 2em; color: green;">$${parseFloat(revenue).toFixed(2)}</p>
            <p>This total reflects orders marked as 'PAID' (or subtracted by 'REFUNDED').</p>
        `;
    } catch (error) {
        adminContentDiv.innerHTML = `<h3>💰 Shop Revenue</h3><p style="color: red;">Error loading revenue: ${error.message}</p>`;
        console.error('Revenue Error:', error);
    }
}

// 2. ORDER MANAGEMENT VIEW 
async function renderOrderManagement() {
    const adminContentDiv = document.getElementById('admin-content');
    adminContentDiv.innerHTML = '<h3>📦 Order Management</h3><p>Loading recent orders...</p>';

    try {
        // Fetch all orders
        const response = await fetch(`${ORDER_MGMT_URL}/all`); 
        if (!response.ok) throw new Error('Failed to fetch orders.');

        const orders = await response.json();

        adminContentDiv.innerHTML = `
            <h3>Active Orders</h3>
            ${orders.length === 0 ? '<p>No orders found.</p>' : ''}
            <table border="1" style="width: 100%;">
                <thead>
                    <tr><th>ID</th><th>User ID</th><th>Total</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td>${order.orderId}</td>
                            <td>${order.userId}</td>
                            <td>$${order.totalAmount.toFixed(2)}</td>
                            <td>${order.orderStatus}</td>
                            <td>
                                ${order.orderStatus === 'PLACED' ? 
                                    `<button onclick="updateOrderStatus(${order.orderId}, 'accept')">Accept</button>` : ''
                                }
                                ${order.orderStatus === 'PLACED' || order.orderStatus === 'ACCEPTED' ? 
                                    `<button onclick="updateOrderStatus(${order.orderId}, 'cancel')" style="background-color: #ff4d4d; color: white;">Cancel</button>` : ''
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        adminContentDiv.innerHTML = `<h3>Order Management</h3><p style="color: red;">Error loading orders: ${error.message}</p>`;
        console.error('Order Mgmt Error:', error);
    }
}

async function updateOrderStatus(orderId, action) {
    const endpoint = action === 'accept' ? `/accept/${orderId}` : `/cancel/${orderId}`;
    try {
        const response = await fetch(`${ORDER_MGMT_URL}${endpoint}`, { method: 'PUT' });

        if (response.ok) {
            alert(`Order ${orderId} ${action === 'accept' ? 'Accepted' : 'Cancelled'} successfully.`);
            renderOrderManagement(); // Refresh the order list
            renderRevenueView(); // Refresh revenue after cancellation/acceptance
        } else {
            alert(`Failed to update order status: ${await response.text()}`);
        }
    } catch (error) {
        alert('Could not connect to Order Service.');
    }
}


// 3. MENU MANAGEMENT VIEW 
function renderMenuManagement() {
    const adminContentDiv = document.getElementById('admin-content');
    adminContentDiv.innerHTML = `
        <h3>🍕 Menu Management</h3>
        <h4>Add New Item</h4>
        <form id="add-menu-form">
            <input type="text" id="menu-name" placeholder="Name" required>
            <input type="text" id="menu-category" placeholder="Category (Pizza/Sides)" required>
            <input type="number" id="menu-price" placeholder="Base Price" required step="0.01">
            <input type="text" id="menu-desc" placeholder="Description">
            <label><input type="checkbox" id="menu-isveg"> Is Vegetarian?</label><br>
            <button type="submit">Add Item to Menu</button>
        </form>
        <hr>
        <h4>Existing Menu Items</h4>
        <div id="existing-menu-list">Loading...</div>
        <div id="update-form-container"></div>
    `;

    document.getElementById('add-menu-form').addEventListener('submit', handleAddMenuItem);
    fetchExistingMenuAdmin();
}

async function handleAddMenuItem(e) {
    e.preventDefault();
    const item = {
        name: document.getElementById('menu-name').value,
        category: document.getElementById('menu-category').value,
        basePrice: parseFloat(document.getElementById('menu-price').value),
        description: document.getElementById('menu-desc').value,
        isVeg: document.getElementById('menu-isveg').checked,
        available: true
    };

    try {
        const response = await fetch(`${ADMIN_BASE_URL}/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });

        if (response.ok) {
            alert('Item added successfully!');
            document.getElementById('add-menu-form').reset();
            allMenuItems = []; // Invalidate customer menu cache
            fetchExistingMenuAdmin(); 
        } else {
            alert('Failed to add item: ' + await response.text());
        }
    } catch (error) {
        alert('Could not connect to Admin Service.');
    }
}

async function fetchExistingMenuAdmin() {
    const existingListDiv = document.getElementById('existing-menu-list');
    existingListDiv.innerHTML = 'Loading...';
    try {
        const response = await fetch(`${ADMIN_BASE_URL}/all`);
        const items = await response.json();
        allMenuItems = items; 

        existingListDiv.innerHTML = items.map(item => `
            <div style="border-bottom: 1px dashed #ccc; padding: 5px 0;">
                [ID: ${item.menuId}] 
                <strong>${item.name}</strong> ($${item.basePrice.toFixed(2)}) 
                
                <button onclick="showUpdateForm(${item.menuId})">Update</button>
                <button onclick="deleteMenuItem(${item.menuId})">Delete</button>
            </div>
        `).join('');
    } catch (error) {
        existingListDiv.innerHTML = '<p style="color: red;">Failed to load existing menu.</p>';
    }
}

async function deleteMenuItem(menuId) {
    if (!confirm(`Are you sure you want to delete this item?`)) return;
    
    try {
        const response = await fetch(`${ADMIN_BASE_URL}/delete/${menuId}`, { method: 'DELETE' });
        if (response.ok) {
            alert('Item deleted.');
            allMenuItems = []; // Invalidate customer menu cache
            fetchExistingMenuAdmin(); 
        } else {
            alert('Deletion failed: ' + await response.text());
        }
    } catch (error) {
        alert('Could not connect to Admin Service.');
    }
}

// --- CRUD FUNCTION: SHOW UPDATE FORM ---
function showUpdateForm(menuId) {
    const item = allMenuItems.find(i => i.menuId === menuId);
    if (!item) return;

    document.getElementById('update-form-container').innerHTML = `
        <div style="border: 1px solid #ff9800; padding: 15px; margin-top: 15px;">
            <h4>✏️ Editing Item: ${item.name} (ID: ${menuId})</h4>
            <form id="update-menu-form">
                <input type="hidden" id="update-menu-id" value="${menuId}">
                <input type="text" id="update-menu-name" value="${item.name}" required><br>
                <input type="text" id="update-menu-category" value="${item.category}" required><br>
                <input type="number" id="update-menu-price" value="${item.basePrice}" required step="0.01"><br>
                <textarea id="update-menu-desc">${item.description || ''}</textarea><br>
                <button type="submit">Save Changes</button>
                <button type="button" onclick="document.getElementById('update-form-container').innerHTML=''">Cancel</button>
            </form>
        </div>
    `;

    document.getElementById('update-menu-form').addEventListener('submit', handleUpdateMenuItem);
}

// --- CRUD FUNCTION: HANDLE UPDATE API CALL ---
async function handleUpdateMenuItem(e) {
    e.preventDefault();
    const id = document.getElementById('update-menu-id').value;
    const updatedDetails = {
        name: document.getElementById('update-menu-name').value,
        category: document.getElementById('update-menu-category').value,
        basePrice: parseFloat(document.getElementById('update-menu-price').value),
        description: document.getElementById('update-menu-desc').value,
    };

    try {
        const response = await fetch(`${ADMIN_BASE_URL}/update/${id}`, { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedDetails)
        });

        if (response.ok) {
            alert('Item updated successfully!');
            document.getElementById('update-form-container').innerHTML = ''; 
            allMenuItems = []; 
            fetchExistingMenuAdmin(); 
        } else {
            alert('Failed to update item: ' + await response.text());
        }
    } catch (error) {
        alert('Could not connect to Admin Service.');
    }
}

// ----------------------------------------------------
// --- NEW: ADMIN USER MANAGEMENT FRONTEND LOGIC ---
// ----------------------------------------------------

async function renderUserManagement() {
    const adminContentDiv = document.getElementById('admin-content');
    adminContentDiv.innerHTML = '<h3>👥 User Management (CRUD)</h3><div id="user-list">Loading users...</div>';

    try {
        // Calls Admin Service client endpoint: /admin/users/all
        const response = await fetch(`${ADMIN_BASE_URL}/users/all`); 
        if (!response.ok) throw new Error('Failed to fetch users.');

        const users = await response.json();
        
        adminContentDiv.innerHTML = `
            <h3>👥 User Management (Total: ${users.length})</h3>
            <div id="user-list">
                <table border="1" style="width: 100%; text-align: left;">
                    <thead>
                        <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${user.userId}</td>
                                <td>${user.username}</td>
                                <td>${user.email}</td>
                                <td><span id="role-${user.userId}">${user.role}</span></td>
                                <td>
                                    <button onclick="showUserUpdateForm(${user.userId})">Edit</button>
                                    <button onclick="deleteUser(${user.userId})" style="background-color: #ff4d4d; color: white;">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div id="user-update-container" style="margin-top: 20px;"></div>
        `;
    } catch (error) {
        adminContentDiv.innerHTML = `<h3>User Management</h3><p style="color: red;">Error loading users: ${error.message}</p>`;
        console.error('User Mgmt Error:', error);
    }
}

async function deleteUser(userId) {
    if (!confirm(`Are you sure you want to delete User ID ${userId}?`)) return;

    try {
        // Calls Admin Service client endpoint: /admin/users/delete/{userId}
        const response = await fetch(`${ADMIN_BASE_URL}/users/delete/${userId}`, { method: 'DELETE' });
        
        if (response.ok) {
            alert(`User ${userId} deleted successfully.`);
            renderUserManagement(); // Refresh list
        } else {
            alert('Deletion failed: ' + await response.text());
        }
    } catch (error) {
        alert('Could not connect to Admin Service.');
    }
}

function showUserUpdateForm(userId) {
    // FIX: Use the correct User Service endpoint to fetch by ID
    fetch(`${USER_SERVICE_URL}/detail/id/${userId}`) 
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch user details.');
            return res.json();
        })
        .then(user => {
            document.getElementById('user-update-container').innerHTML = `
                <div style="border: 1px solid #ff9800; padding: 15px;">
                    <h4>✏️ Editing User: ${user.username} (ID: ${userId})</h4>
                    <form id="user-update-form">
                        <input type="hidden" id="user-update-id" value="${userId}">
                        <input type="text" id="user-update-username" value="${user.username}" placeholder="Username" required><br>
                        <input type="email" id="user-update-email" value="${user.email}" placeholder="Email" required><br>
                        <input type="text" id="user-update-fullname" value="${user.fullName || ''}" placeholder="Full Name"><br>
                        <input type="text" id="user-update-phone" value="${user.phone || ''}" placeholder="Phone"><br>
                        <select id="user-update-role" required>
                            <option value="CUSTOMER" ${user.role === 'CUSTOMER' ? 'selected' : ''}>CUSTOMER</option>
                            <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
                        </select><br>
                        <button type="submit">Save User Changes</button>
                        <button type="button" onclick="document.getElementById('user-update-container').innerHTML=''">Cancel</button>
                    </form>
                </div>
            `;
            document.getElementById('user-update-form').addEventListener('submit', handleUserUpdate);
        })
        .catch(error => alert("Could not load user data for editing."));
}

async function handleUserUpdate(e) {
    e.preventDefault();
    const id = document.getElementById('user-update-id').value;
    const updatedDetails = {
        userId: id,
        username: document.getElementById('user-update-username').value,
        email: document.getElementById('user-update-email').value,
        fullName: document.getElementById('user-update-fullname').value,
        phone: document.getElementById('user-update-phone').value,
        role: document.getElementById('user-update-role').value,
    };

    try {
        // Calls Admin Service client endpoint: /admin/users/update/{userId}
        const response = await fetch(`${ADMIN_BASE_URL}/users/update/${id}`, { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedDetails)
        });

        if (response.ok) {
            alert('User updated successfully!');
            document.getElementById('user-update-container').innerHTML = '';
            renderUserManagement(); // Refresh list
        } else {
            alert('Update failed: ' + await response.text());
        }
    } catch (error) {
        alert('Could not connect to Admin Service.');
    }
}


// Ensure Microservices are running before attempting login/register
window.onload = () => {
    console.log('Frontend loaded. Ensure all microservices are running: 8761, 8081-8084.');
}