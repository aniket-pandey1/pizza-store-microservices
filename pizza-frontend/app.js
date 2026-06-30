// FIX: Use configurable URLs from config.js
const USER_SERVICE_URL = (window.PIZZA_CONFIG && window.PIZZA_CONFIG.USER_SERVICE_URL) || 'http://localhost:8081/users';
const ADMIN_BASE_URL = (window.PIZZA_CONFIG && window.PIZZA_CONFIG.ADMIN_BASE_URL) || 'http://localhost:8082/admin';
const ORDER_SERVICE_URL = (window.PIZZA_CONFIG && window.PIZZA_CONFIG.ORDER_SERVICE_URL) || 'http://localhost:8083/orders';
const ORDER_MGMT_URL = ORDER_SERVICE_URL;

let currentUser = null;
let cart = [];
let allMenuItems = [];

// === VIEW TOGGLES ===
document.getElementById('show-register').addEventListener('click', (e) => { e.preventDefault(); document.getElementById('login-form').style.display = 'none'; document.getElementById('register-container').style.display = 'block'; });
document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); document.getElementById('login-form').style.display = 'block'; document.getElementById('register-container').style.display = 'none'; });
document.getElementById('show-admin-login').addEventListener('click', (e) => { e.preventDefault(); document.getElementById('auth-view').style.display = 'none'; document.getElementById('admin-login-view').style.display = 'block'; });
document.getElementById('show-user-login').addEventListener('click', (e) => { e.preventDefault(); document.getElementById('admin-login-view').style.display = 'none'; document.getElementById('auth-view').style.display = 'block'; });

// FIX: Added logout functionality
function handleLogout() {
    currentUser = null; cart = []; allMenuItems = [];
    document.getElementById('logout-btn').style.display = 'none';
    document.getElementById('content-container').innerHTML = '';
    location.reload();
}

// === AUTHENTICATION ===
async function handleLogin(username, password) {
    try {
        const response = await fetch(`${USER_SERVICE_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
        if (response.ok) {
            const responseData = await response.json();
            const userResponse = await fetch(`${USER_SERVICE_URL}/detail/${username}`);
            const userData = await userResponse.json();
            currentUser = { username, role: responseData.role, userId: userData.userId, token: responseData.token };
            alert(`Login successful! Welcome, ${username}.`);
            document.getElementById('auth-view').style.display = 'none';
            document.getElementById('admin-login-view').style.display = 'none';
            document.getElementById('logout-btn').style.display = 'inline-block';
            if (responseData.role === 'ADMIN') { renderAdminView(); } else { renderCustomerView(); }
        } else { alert('Login failed: ' + await response.text()); }
    } catch (error) { console.error('Login Error:', error); alert('Could not connect to the User Service.'); }
}

document.getElementById('login-form').addEventListener('submit', async (e) => { e.preventDefault(); await handleLogin(document.getElementById('login-username').value, document.getElementById('login-password').value); });
document.getElementById('admin-login-form').addEventListener('submit', async (e) => { e.preventDefault(); await handleLogin(document.getElementById('admin-login-username').value, document.getElementById('admin-login-password').value); });

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const userData = { username: document.getElementById('reg-username').value, email: document.getElementById('reg-email').value, password: document.getElementById('reg-password').value, fullName: document.getElementById('reg-fullname').value, phone: document.getElementById('reg-phone').value };
    try {
        const response = await fetch(`${USER_SERVICE_URL}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userData) });
        if (response.ok) { alert('Registration successful! Please log in.'); document.getElementById('show-login').click(); }
        else { alert('Registration failed: ' + await response.text()); }
    } catch (error) { alert('Could not connect to the server.'); }
});

// === CUSTOMER VIEW ===
function renderCustomerView() {
    allMenuItems = []; // FIX: Clear cache on view render
    document.getElementById('content-container').innerHTML = `
        <div id="customer-view">
            <h2>Pizza Menu & Sides</h2>
            <button onclick="renderCustomerOrders()" style="margin-bottom: 15px;">View My Orders</button>
            <div id="controls">
                <label for="filter-veg">Filter:</label>
                <select id="filter-veg"><option value="all">All</option><option value="veg">Veg Only</option><option value="nonveg">Non-Veg Only</option></select>
                <label for="sort-price">Sort:</label>
                <select id="sort-price"><option value="default">Default</option><option value="low_to_high">Price Low to High</option></select>
            </div>
            <div id="menu-list" class="menu-grid"></div>
            <hr>
            <h3>🛒 Your Cart (<span id="cart-count">${cart.length}</span> items)</h3>
            <div id="cart-items">No items added yet.</div>
            <p>Total: $<span id="cart-total">0.00</span></p>
            <button id="place-order-btn">Place Order</button>
        </div>`;
    document.getElementById('filter-veg').addEventListener('change', fetchAndRenderMenu);
    document.getElementById('sort-price').addEventListener('change', fetchAndRenderMenu);
    document.getElementById('place-order-btn').addEventListener('click', placeOrder);
    fetchAndRenderMenu();
}

async function renderCustomerOrders() {
    document.getElementById('content-container').innerHTML = '<h3>Your Order History</h3><div id="user-orders">Loading orders...</div><p><a href="#" onclick="renderCustomerView()">Back to Menu</a></p>';
    const ordersDiv = document.getElementById('user-orders');
    if (!currentUser || !currentUser.userId) { ordersDiv.innerHTML = '<p style="color: red;">Please log in.</p>'; return; }
    try {
        const response = await fetch(`${ORDER_SERVICE_URL}/user/${currentUser.userId}`);
        if (!response.ok) throw new Error('Failed to fetch orders.');
        const orders = await response.json();
        if (orders.length === 0) { ordersDiv.innerHTML = '<p>You have no past orders.</p>'; return; }
        ordersDiv.innerHTML = orders.map(order => `
            <div style="border: 1px solid #ccc; margin-bottom: 10px; padding: 10px;">
                <strong>Order ID: ${order.orderId}</strong> (Total: $${parseFloat(order.totalAmount).toFixed(2)})<br>
                Status: <strong>${order.orderStatus}</strong> | Payment: ${order.paymentStatus}<br>
                ${order.orderStatus === 'PLACED' ? `<button onclick="cancelOrderFromUserDashboard(${order.orderId})" style="background-color: #ff4d4d; color: white;">Cancel Order</button>` : ''}
            </div>`).join('');
    } catch (error) { ordersDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`; }
}

async function cancelOrderFromUserDashboard(orderId) {
    if (!confirm(`Cancel Order ID ${orderId}?`)) return;
    try {
        const response = await fetch(`${ORDER_SERVICE_URL}/cancel/${orderId}`, { method: 'PUT' });
        if (response.ok) { alert(`Order ${orderId} cancelled.`); renderCustomerOrders(); } else { alert('Cancellation failed: ' + await response.text()); }
    } catch (error) { alert('Could not connect to Order Service.'); }
}

async function fetchAndRenderMenu() {
    const menuListDiv = document.getElementById('menu-list');
    menuListDiv.innerHTML = 'Loading menu...';
    if (allMenuItems.length === 0) {
        try { const r = await fetch(`${ADMIN_BASE_URL}/all`); if (!r.ok) throw new Error('Failed'); allMenuItems = await r.json(); }
        catch (e) { menuListDiv.innerHTML = 'Error loading menu.'; return; }
    }
    let items = [...allMenuItems];
    const f = document.getElementById('filter-veg').value;
    if (f === 'veg') items = items.filter(i => i.isVeg === true);
    else if (f === 'nonveg') items = items.filter(i => i.isVeg === false);
    if (document.getElementById('sort-price').value === 'low_to_high') items.sort((a, b) => a.basePrice - b.basePrice);
    menuListDiv.innerHTML = items.map(item => `
        <div class="menu-item">
            <h4>${item.name} (${item.category})</h4>
            <p>${item.description || ''}</p>
            <p><strong>Price: $${parseFloat(item.basePrice).toFixed(2)}</strong></p>
            <button onclick="addToCart(${item.menuId}, '${item.name.replace(/'/g, "\\'")}', ${item.basePrice})">Add to Cart</button>
        </div>`).join('');
}

// === CART ===
function addToCart(menuId, name, price) { const e = cart.find(i => i.menuId === menuId); if (e) e.qty++; else cart.push({ menuId, name, price, qty: 1 }); renderCart(); }
function removeFromCart(index) { cart.splice(index, 1); renderCart(); }
function renderCart() {
    const d = document.getElementById('cart-items'), t = document.getElementById('cart-total'), c = document.getElementById('cart-count');
    if (cart.length === 0) { d.innerHTML = 'No items added yet.'; t.textContent = '0.00'; c.textContent = '0'; return; }
    let total = 0;
    d.innerHTML = cart.map((item, i) => { const it = item.price * item.qty; total += it; return `<div>${item.name} x ${item.qty} ($${it.toFixed(2)}) <button onclick="removeFromCart(${i})">Remove</button></div>`; }).join('');
    t.textContent = total.toFixed(2); c.textContent = cart.length;
}

// === CHECKOUT & PAYMENT ===
async function placeOrder() {
    if (!currentUser || !currentUser.userId) { alert('You must be logged in.'); return; }
    if (cart.length === 0) { alert('Cart is empty!'); return; }
    try {
        const r = await fetch(`${ORDER_SERVICE_URL}/place`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.userId, items: cart.map(i => ({ menuId: i.menuId, qty: i.qty, price: i.price })) }) });
        if (r.ok) { const d = await r.json(); renderPaymentSelection(d.orderId, d.totalAmount, d.paymentModes); }
        else { alert('Order failed: ' + await r.text()); }
    } catch (e) { alert('Could not connect to Order Service.'); }
}

function renderPaymentSelection(orderId, totalAmount, modes) {
    const total = parseFloat(totalAmount).toFixed(2);
    document.getElementById('content-container').innerHTML = `
        <div id="payment-view">
            <h2>💰 Confirm Payment</h2>
            <p>Order ID: <strong>${orderId}</strong></p>
            <h3>Total: $${total}</h3>
            <p>Select payment method:</p>
            <div id="payment-error" style="color: red; margin-bottom: 10px;"></div>
            <div style="margin-top: 20px;">
                ${modes.map(m => `<button onclick="processPayment('${orderId}', '${total}', '${m}')" style="margin: 5px; padding: 10px; background-color: ${m === 'COD' ? '#007bff' : '#28a745'}; color: white; border:none; cursor:pointer;">Pay with ${m}</button>`).join('')}
            </div>
            <p style="margin-top: 20px;"><a href="#" onclick="renderCustomerView()">Cancel & Back to Menu</a></p>
        </div>`;
}

async function processPayment(orderId, totalAmount, paymentMode) {
    const errorDiv = document.getElementById('payment-error');
    errorDiv.style.color = 'blue'; errorDiv.textContent = `Processing ${paymentMode} payment...`;
    try {
        const r = await fetch(`${ORDER_SERVICE_URL}/confirm-payment/${orderId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentMode }) });
        if (r.ok) { alert(`✅ Order ${orderId} paid via ${paymentMode}!`); cart = []; renderCustomerView(); }
        else { errorDiv.style.color = 'red'; errorDiv.textContent = '❌ Payment Failed: ' + await r.text(); }
    } catch (e) { errorDiv.style.color = 'red'; errorDiv.textContent = '❌ Network error.'; }
}

// === ADMIN VIEW ===
function renderAdminView() {
    document.getElementById('content-container').innerHTML = `
        <div id="admin-view">
            <h2>Admin Dashboard: ${currentUser.username}</h2>
            <div id="admin-nav">
                <button onclick="renderMenuManagement()">Menu Management</button>
                <button onclick="renderOrderManagement()">Order Management</button>
                <button onclick="renderRevenueView()">View Revenue</button>
                <button onclick="renderUserManagement()">User Management</button>
            </div>
            <div id="admin-content"><p>Welcome! Click an option above.</p></div>
        </div>`;
    renderRevenueView();
}

async function renderRevenueView() {
    const d = document.getElementById('admin-content');
    if (!d) return;
    d.innerHTML = '<h3>💰 Revenue</h3><p>Calculating...</p>';
    try { const r = await fetch(`${ADMIN_BASE_URL}/revenue`); if (!r.ok) throw new Error('Failed'); const rev = await r.json(); d.innerHTML = `<h3>💰 Total Paid Revenue:</h3><p style="font-size: 2em; color: green;">$${parseFloat(rev).toFixed(2)}</p>`; }
    catch (e) { d.innerHTML = `<h3>💰 Revenue</h3><p style="color: red;">Error: ${e.message}</p>`; }
}

async function renderOrderManagement() {
    const d = document.getElementById('admin-content'); d.innerHTML = '<h3>📦 Orders</h3><p>Loading...</p>';
    try {
        const r = await fetch(`${ORDER_MGMT_URL}/all`); if (!r.ok) throw new Error('Failed'); const orders = await r.json();
        d.innerHTML = `<h3>Orders</h3><table border="1" style="width:100%"><thead><tr><th>ID</th><th>User</th><th>Total</th><th>Status</th><th>Payment</th><th>Actions</th></tr></thead><tbody>
            ${orders.map(o => `<tr><td>${o.orderId}</td><td>${o.userId}</td><td>$${parseFloat(o.totalAmount).toFixed(2)}</td><td>${o.orderStatus}</td><td>${o.paymentStatus}</td><td>
                ${o.orderStatus === 'PLACED' ? `<button onclick="updateOrderStatus(${o.orderId}, 'accept')">Accept</button>` : ''}
                ${o.orderStatus === 'PLACED' || o.orderStatus === 'ACCEPTED' ? `<button onclick="updateOrderStatus(${o.orderId}, 'cancel')" style="background-color:#ff4d4d;color:white;">Cancel</button>` : ''}
            </td></tr>`).join('')}</tbody></table>`;
    } catch (e) { d.innerHTML = `<p style="color:red;">Error: ${e.message}</p>`; }
}

async function updateOrderStatus(orderId, action) {
    const ep = action === 'accept' ? `/accept/${orderId}` : `/cancel/${orderId}`;
    try { const r = await fetch(`${ORDER_MGMT_URL}${ep}`, { method: 'PUT' }); if (r.ok) { alert(`Order ${orderId} ${action}ed.`); renderOrderManagement(); } else { alert(await r.text()); } }
    catch (e) { alert('Connection error.'); }
}

// === MENU MANAGEMENT ===
function renderMenuManagement() {
    const d = document.getElementById('admin-content');
    d.innerHTML = `<h3>🍕 Menu Management</h3><h4>Add New Item</h4>
        <form id="add-menu-form"><input type="text" id="menu-name" placeholder="Name" required><input type="text" id="menu-category" placeholder="Category" required>
        <input type="number" id="menu-price" placeholder="Price" required step="0.01"><input type="text" id="menu-desc" placeholder="Description">
        <label><input type="checkbox" id="menu-isveg"> Vegetarian?</label><br><button type="submit">Add Item</button></form>
        <hr><h4>Existing Items</h4><div id="existing-menu-list">Loading...</div><div id="update-form-container"></div>`;
    document.getElementById('add-menu-form').addEventListener('submit', handleAddMenuItem);
    fetchExistingMenuAdmin();
}

async function handleAddMenuItem(e) {
    e.preventDefault();
    const item = { name: document.getElementById('menu-name').value, category: document.getElementById('menu-category').value, basePrice: parseFloat(document.getElementById('menu-price').value), description: document.getElementById('menu-desc').value, isVeg: document.getElementById('menu-isveg').checked, available: true };
    try { const r = await fetch(`${ADMIN_BASE_URL}/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }); if (r.ok) { alert('Item added!'); document.getElementById('add-menu-form').reset(); allMenuItems = []; fetchExistingMenuAdmin(); } else { alert('Failed: ' + await r.text()); } }
    catch (e) { alert('Connection error.'); }
}

async function fetchExistingMenuAdmin() {
    const d = document.getElementById('existing-menu-list'); d.innerHTML = 'Loading...';
    try { const r = await fetch(`${ADMIN_BASE_URL}/all`); const items = await r.json(); allMenuItems = items;
        d.innerHTML = items.map(i => `<div style="border-bottom:1px dashed #ccc;padding:5px 0;">[ID:${i.menuId}] <strong>${i.name}</strong> ($${parseFloat(i.basePrice).toFixed(2)}) <button onclick="showUpdateForm(${i.menuId})">Update</button> <button onclick="deleteMenuItem(${i.menuId})">Delete</button></div>`).join('');
    } catch (e) { d.innerHTML = '<p style="color:red;">Failed to load menu.</p>'; }
}

async function deleteMenuItem(menuId) {
    if (!confirm('Delete this item?')) return;
    try { const r = await fetch(`${ADMIN_BASE_URL}/delete/${menuId}`, { method: 'DELETE' }); if (r.ok) { alert('Deleted.'); allMenuItems = []; fetchExistingMenuAdmin(); } else { alert('Failed.'); } }
    catch (e) { alert('Connection error.'); }
}

function showUpdateForm(menuId) {
    const item = allMenuItems.find(i => i.menuId === menuId); if (!item) return;
    document.getElementById('update-form-container').innerHTML = `<div style="border:1px solid #ff9800;padding:15px;margin-top:15px;"><h4>✏️ Edit: ${item.name}</h4>
        <form id="update-menu-form"><input type="hidden" id="update-menu-id" value="${menuId}">
        <input type="text" id="update-menu-name" value="${item.name}" required><br><input type="text" id="update-menu-category" value="${item.category}" required><br>
        <input type="number" id="update-menu-price" value="${item.basePrice}" required step="0.01"><br><textarea id="update-menu-desc">${item.description || ''}</textarea><br>
        <button type="submit">Save</button> <button type="button" onclick="document.getElementById('update-form-container').innerHTML=''">Cancel</button></form></div>`;
    document.getElementById('update-menu-form').addEventListener('submit', handleUpdateMenuItem);
}

async function handleUpdateMenuItem(e) {
    e.preventDefault(); const id = document.getElementById('update-menu-id').value;
    const d = { name: document.getElementById('update-menu-name').value, category: document.getElementById('update-menu-category').value, basePrice: parseFloat(document.getElementById('update-menu-price').value), description: document.getElementById('update-menu-desc').value };
    try { const r = await fetch(`${ADMIN_BASE_URL}/update/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }); if (r.ok) { alert('Updated!'); document.getElementById('update-form-container').innerHTML = ''; allMenuItems = []; fetchExistingMenuAdmin(); } else { alert('Failed.'); } }
    catch (e) { alert('Connection error.'); }
}

// === USER MANAGEMENT ===
async function renderUserManagement() {
    const d = document.getElementById('admin-content'); d.innerHTML = '<h3>👥 Users</h3><div id="user-list">Loading...</div>';
    try { const r = await fetch(`${ADMIN_BASE_URL}/users/all`); if (!r.ok) throw new Error('Failed'); const users = await r.json();
        d.innerHTML = `<h3>👥 Users (${users.length})</h3><table border="1" style="width:100%;text-align:left;"><thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead><tbody>
            ${users.map(u => `<tr><td>${u.userId}</td><td>${u.username}</td><td>${u.email}</td><td>${u.role}</td><td><button onclick="showUserUpdateForm(${u.userId})">Edit</button> <button onclick="deleteUser(${u.userId})" style="background-color:#ff4d4d;color:white;">Delete</button></td></tr>`).join('')}
        </tbody></table><div id="user-update-container" style="margin-top:20px;"></div>`;
    } catch (e) { d.innerHTML = `<p style="color:red;">Error: ${e.message}</p>`; }
}

async function deleteUser(userId) {
    if (!confirm(`Delete User ${userId}?`)) return;
    try { const r = await fetch(`${ADMIN_BASE_URL}/users/delete/${userId}`, { method: 'DELETE' }); if (r.ok) { alert('Deleted.'); renderUserManagement(); } else { alert('Failed.'); } }
    catch (e) { alert('Connection error.'); }
}

function showUserUpdateForm(userId) {
    fetch(`${USER_SERVICE_URL}/detail/id/${userId}`).then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); }).then(user => {
        document.getElementById('user-update-container').innerHTML = `<div style="border:1px solid #ff9800;padding:15px;"><h4>✏️ Edit: ${user.username}</h4>
            <form id="user-update-form"><input type="hidden" id="user-update-id" value="${userId}">
            <input type="text" id="user-update-username" value="${user.username}" required><br>
            <input type="email" id="user-update-email" value="${user.email}" required><br>
            <input type="text" id="user-update-fullname" value="${user.fullName || ''}" placeholder="Full Name"><br>
            <input type="text" id="user-update-phone" value="${user.phone || ''}" placeholder="Phone"><br>
            <select id="user-update-role"><option value="CUSTOMER" ${user.role==='CUSTOMER'?'selected':''}>CUSTOMER</option><option value="ADMIN" ${user.role==='ADMIN'?'selected':''}>ADMIN</option></select><br>
            <button type="submit">Save</button> <button type="button" onclick="document.getElementById('user-update-container').innerHTML=''">Cancel</button></form></div>`;
        document.getElementById('user-update-form').addEventListener('submit', handleUserUpdate);
    }).catch(e => alert('Could not load user data.'));
}

async function handleUserUpdate(e) {
    e.preventDefault(); const id = document.getElementById('user-update-id').value;
    const d = { userId: id, username: document.getElementById('user-update-username').value, email: document.getElementById('user-update-email').value, fullName: document.getElementById('user-update-fullname').value, phone: document.getElementById('user-update-phone').value, role: document.getElementById('user-update-role').value };
    try { const r = await fetch(`${ADMIN_BASE_URL}/users/update/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }); if (r.ok) { alert('Updated!'); document.getElementById('user-update-container').innerHTML = ''; renderUserManagement(); } else { alert('Failed.'); } }
    catch (e) { alert('Connection error.'); }
}

window.onload = () => { console.log('Frontend loaded. Ensure all microservices are running.'); };