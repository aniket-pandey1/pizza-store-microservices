// FIX: Use configurable URLs from config.js
const USER_SERVICE_URL = (window.PIZZA_CONFIG && window.PIZZA_CONFIG.USER_SERVICE_URL) || 'http://localhost:8081/users';
const ADMIN_BASE_URL = (window.PIZZA_CONFIG && window.PIZZA_CONFIG.ADMIN_BASE_URL) || 'http://localhost:8082/admin';
const ORDER_SERVICE_URL = (window.PIZZA_CONFIG && window.PIZZA_CONFIG.ORDER_SERVICE_URL) || 'http://localhost:8083/orders';
const ORDER_MGMT_URL = ORDER_SERVICE_URL;

let currentUser = null;
let cart = [];
let allMenuItems = [];

// === VIEW TOGGLES ===
document.getElementById('show-register').addEventListener('click', (e) => { e.preventDefault(); document.getElementById('login-container').style.display = 'none'; document.getElementById('register-container').style.display = 'block'; });
document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); document.getElementById('login-container').style.display = 'block'; document.getElementById('register-container').style.display = 'none'; });
document.getElementById('show-admin-login').addEventListener('click', (e) => { e.preventDefault(); document.getElementById('auth-view').style.display = 'none'; document.getElementById('admin-login-view').style.display = 'block'; document.body.classList.add('admin-mode'); });
document.getElementById('show-user-login').addEventListener('click', (e) => { e.preventDefault(); document.getElementById('admin-login-view').style.display = 'none'; document.getElementById('auth-view').style.display = 'block'; document.body.classList.remove('admin-mode'); });

function handleLogout() {
    currentUser = null; cart = []; allMenuItems = [];
    document.getElementById('logout-btn').style.display = 'none';
    document.getElementById('content-container').innerHTML = '';
    document.body.classList.remove('admin-mode');
    location.reload();
}

// === AUTHENTICATION ===
async function handleLogin(username, password, expectedRole) {
    try {
        const response = await fetch(`${USER_SERVICE_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
        if (response.ok) {
            const responseData = await response.json();
            
            // STRICT ROLE ENFORCEMENT
            if (expectedRole && responseData.role !== expectedRole) {
                if (expectedRole === 'ADMIN') {
                    alert('Access Denied: You are not an Administrator. Please use the Customer login.');
                } else {
                    alert('Notice: You are an Administrator. Redirecting to the Admin Portal...');
                    document.getElementById('show-admin-login').click();
                }
                return;
            }

            const userResponse = await fetch(`${USER_SERVICE_URL}/detail/${username}`);
            const userData = await userResponse.json();
            currentUser = { username, role: responseData.role, userId: userData.userId, token: responseData.token };
            
            document.getElementById('auth-view').style.display = 'none';
            document.getElementById('admin-login-view').style.display = 'none';
            document.getElementById('logout-btn').style.display = 'inline-block';
            
            if (currentUser.role === 'ADMIN') {
                document.body.classList.add('admin-mode');
                renderAdminView();
            } else {
                renderCustomerView();
            }
        } else { alert('Login failed: ' + await response.text()); }
    } catch (error) { console.error('Login Error:', error); alert('Could not connect to the User Service.'); }
}

document.getElementById('login-form').addEventListener('submit', async (e) => { e.preventDefault(); await handleLogin(document.getElementById('login-username').value, document.getElementById('login-password').value, 'CUSTOMER'); });
document.getElementById('admin-login-form').addEventListener('submit', async (e) => { e.preventDefault(); await handleLogin(document.getElementById('admin-login-username').value, document.getElementById('admin-login-password').value, 'ADMIN'); });

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
    allMenuItems = [];
    document.getElementById('content-container').className = ''; // Remove auth styles
    document.getElementById('content-container').innerHTML = `
        <div class="customer-dashboard">
            <div class="menu-section">
                <div class="section-header">
                    <h2>Our Menu</h2>
                    <div class="controls">
                        <select id="filter-veg" class="form-control"><option value="all">All</option><option value="veg">Veg Only</option><option value="nonveg">Non-Veg Only</option></select>
                        <select id="sort-price" class="form-control"><option value="default">Default</option><option value="low_to_high">Price: Low to High</option></select>
                        <button onclick="renderCustomerOrders()" class="btn btn-outline">My Orders</button>
                    </div>
                </div>
                <div id="menu-list" class="menu-grid"></div>
            </div>
            <div class="cart-sidebar glass-panel">
                <h3>🛒 Your Cart <span class="badge" id="cart-count">${cart.length}</span></h3>
                <div id="cart-items" class="cart-items-container">No items added yet.</div>
                <div class="cart-summary">
                    <div class="total-row"><span>Total:</span> <strong>$<span id="cart-total">0.00</span></strong></div>
                    <button id="place-order-btn" class="btn btn-primary btn-block">Proceed to Checkout</button>
                </div>
            </div>
        </div>`;
    document.getElementById('filter-veg').addEventListener('change', fetchAndRenderMenu);
    document.getElementById('sort-price').addEventListener('change', fetchAndRenderMenu);
    document.getElementById('place-order-btn').addEventListener('click', placeOrder);
    fetchAndRenderMenu();
}

async function fetchAndRenderMenu() {
    const menuListDiv = document.getElementById('menu-list');
    menuListDiv.innerHTML = '<div class="loader">Loading menu...</div>';
    if (allMenuItems.length === 0) {
        try { const r = await fetch(`${ADMIN_BASE_URL}/all`); if (!r.ok) throw new Error('Failed'); allMenuItems = await r.json(); }
        catch (e) { menuListDiv.innerHTML = '<div class="error">Error loading menu.</div>'; return; }
    }
    let items = [...allMenuItems];
    const f = document.getElementById('filter-veg').value;
    if (f === 'veg') items = items.filter(i => i.isVeg === true);
    else if (f === 'nonveg') items = items.filter(i => i.isVeg === false);
    if (document.getElementById('sort-price').value === 'low_to_high') items.sort((a, b) => a.basePrice - b.basePrice);
    
    menuListDiv.innerHTML = items.map(item => `
        <div class="menu-card ${item.isVeg ? 'veg-border' : 'nonveg-border'}">
            <div class="card-content">
                <span class="badge ${item.isVeg ? 'badge-veg' : 'badge-danger'}">${item.category}</span>
                <h4>${item.name}</h4>
                <p class="desc">${item.description || 'Delicious freshly baked pizza.'}</p>
                <div class="card-footer">
                    <span class="price">$${parseFloat(item.basePrice).toFixed(2)}</span>
                    <button class="btn btn-primary btn-sm" onclick="addToCart(${item.menuId}, '${item.name.replace(/'/g, "\\'")}', ${item.basePrice})">Add +</button>
                </div>
            </div>
        </div>`).join('');
}

// === CART & PAYMENT ===
function addToCart(menuId, name, price) { const e = cart.find(i => i.menuId === menuId); if (e) e.qty++; else cart.push({ menuId, name, price, qty: 1 }); renderCart(); }
function removeFromCart(index) { cart.splice(index, 1); renderCart(); }
function renderCart() {
    const d = document.getElementById('cart-items'), t = document.getElementById('cart-total'), c = document.getElementById('cart-count');
    if (cart.length === 0) { d.innerHTML = '<p class="empty-cart">No items added yet.</p>'; t.textContent = '0.00'; c.textContent = '0'; return; }
    let total = 0;
    d.innerHTML = cart.map((item, i) => { const it = item.price * item.qty; total += it; return `<div class="cart-item"><div><strong>${item.name}</strong><br><small>$${item.price.toFixed(2)} x ${item.qty}</small></div><div>$${it.toFixed(2)} <button class="btn-remove" onclick="removeFromCart(${i})">×</button></div></div>`; }).join('');
    t.textContent = total.toFixed(2); c.textContent = cart.length;
}

async function placeOrder() {
    if (!currentUser || !currentUser.userId) { alert('You must be logged in.'); return; }
    if (cart.length === 0) { alert('Cart is empty!'); return; }
    document.getElementById('place-order-btn').innerText = 'Processing...';
    try {
        const r = await fetch(`${ORDER_SERVICE_URL}/place`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.userId, items: cart.map(i => ({ menuId: i.menuId, qty: i.qty, price: i.price })) }) });
        if (r.ok) { const d = await r.json(); renderPaymentSelection(d.orderId, d.totalAmount, d.paymentModes); }
        else { alert('Order failed: ' + await r.text()); document.getElementById('place-order-btn').innerText = 'Proceed to Checkout';}
    } catch (e) { alert('Could not connect to Order Service.'); document.getElementById('place-order-btn').innerText = 'Proceed to Checkout';}
}

function renderPaymentSelection(orderId, totalAmount, modes) {
    const total = parseFloat(totalAmount).toFixed(2);
    document.getElementById('content-container').innerHTML = `
        <div class="payment-view glass-panel">
            <h2>Secure Checkout</h2>
            <div class="order-summary-box">
                <p>Order Reference: <strong>#${orderId}</strong></p>
                <h3 class="grand-total">Total: $${total}</h3>
            </div>
            <p>Select your preferred payment method:</p>
            <div id="payment-error" class="error-msg"></div>
            <div class="payment-methods">
                ${modes.map(m => `<button class="btn btn-payment ${m === 'COD' ? 'btn-outline' : 'btn-primary'}" onclick="processPayment('${orderId}', '${total}', '${m}')">Pay with ${m}</button>`).join('')}
            </div>
            <button class="btn btn-link mt-4" onclick="renderCustomerView()">← Cancel & Back to Menu</button>
        </div>`;
}

async function processPayment(orderId, totalAmount, paymentMode) {
    const errorDiv = document.getElementById('payment-error');
    errorDiv.style.display = 'block'; errorDiv.style.color = 'blue'; errorDiv.textContent = `Processing ${paymentMode} payment securely...`;
    try {
        const r = await fetch(`${ORDER_SERVICE_URL}/confirm-payment/${orderId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentMode }) });
        if (r.ok) { alert(`🎉 Order #${orderId} confirmed successfully!`); cart = []; renderCustomerOrders(); }
        else { errorDiv.style.color = 'red'; errorDiv.textContent = '❌ Payment Failed: ' + await r.text(); }
    } catch (e) { errorDiv.style.color = 'red'; errorDiv.textContent = '❌ Network error.'; }
}

async function renderCustomerOrders() {
    document.getElementById('content-container').innerHTML = `<div class="customer-dashboard single-col"><div class="section-header"><h2>Your Order History</h2><button class="btn btn-outline" onclick="renderCustomerView()">Back to Menu</button></div><div id="user-orders" class="orders-grid"><div class="loader">Loading orders...</div></div></div>`;
    const ordersDiv = document.getElementById('user-orders');
    try {
        const response = await fetch(`${ORDER_SERVICE_URL}/user/${currentUser.userId}`);
        const orders = await response.json();
        if (orders.length === 0) { ordersDiv.innerHTML = '<p class="empty-state">You have no past orders.</p>'; return; }
        ordersDiv.innerHTML = orders.map(order => `
            <div class="order-card glass-panel">
                <div class="order-header">
                    <h4>Order #${order.orderId}</h4>
                    <span class="badge ${order.orderStatus === 'CANCELLED' ? 'badge-danger' : 'badge-primary'}">${order.orderStatus}</span>
                </div>
                <div class="order-body">
                    <p>Total: <strong>$${parseFloat(order.totalAmount).toFixed(2)}</strong></p>
                    <p>Payment: <span class="payment-status ${order.paymentStatus}">${order.paymentStatus}</span></p>
                </div>
                ${order.orderStatus === 'PLACED' ? `<button class="btn btn-danger btn-sm mt-3" onclick="cancelOrderFromUserDashboard(${order.orderId})">Cancel Order</button>` : ''}
            </div>`).join('');
    } catch (error) { ordersDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`; }
}

async function cancelOrderFromUserDashboard(orderId) {
    if (!confirm(`Are you sure you want to cancel Order #${orderId}?`)) return;
    try {
        const r = await fetch(`${ORDER_SERVICE_URL}/cancel/${orderId}`, { method: 'PUT' });
        if (r.ok) { alert(`Order #${orderId} cancelled.`); renderCustomerOrders(); } else { alert('Cancellation failed: ' + await r.text()); }
    } catch (e) { alert('Could not connect to Order Service.'); }
}


// === ADMIN VIEW ===
function renderAdminView() {
    document.getElementById('content-container').className = 'admin-layout';
    document.getElementById('content-container').innerHTML = `
        <aside class="admin-sidebar glass-panel">
            <div class="admin-profile">
                <div class="avatar">👨‍💼</div>
                <h3>${currentUser.username}</h3>
                <span class="badge badge-primary">Administrator</span>
            </div>
            <nav class="admin-nav-links">
                <button class="btn-nav active" onclick="renderRevenueView(); setActiveNav(this)">📊 Dashboard</button>
                <button class="btn-nav" onclick="renderOrderManagement(); setActiveNav(this)">📦 Orders</button>
                <button class="btn-nav" onclick="renderMenuManagement(); setActiveNav(this)">🍕 Menu Items</button>
                <button class="btn-nav" onclick="renderUserManagement(); setActiveNav(this)">👥 Users</button>
            </nav>
        </aside>
        <div id="admin-content" class="admin-main-content">
            <div class="loader">Loading dashboard...</div>
        </div>`;
    renderRevenueView();
}

function setActiveNav(btn) {
    document.querySelectorAll('.btn-nav').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

async function renderRevenueView() {
    const d = document.getElementById('admin-content'); if (!d) return;
    d.innerHTML = '<div class="admin-header"><h2>Dashboard Overview</h2></div><div class="dashboard-cards"><div class="stat-card glass-panel"><h3>Total Revenue</h3><div id="revenue-val" class="stat-value loader">...</div><p class="stat-desc">From all PAID orders</p></div></div>';
    try { 
        const r = await fetch(`${ADMIN_BASE_URL}/revenue`); 
        const rev = await r.json(); 
        document.getElementById('revenue-val').innerHTML = `$${parseFloat(rev).toFixed(2)}`;
        document.getElementById('revenue-val').classList.remove('loader');
        document.getElementById('revenue-val').classList.add('text-success');
    }
    catch (e) { document.getElementById('revenue-val').innerHTML = `Error`; }
}

async function renderOrderManagement() {
    const d = document.getElementById('admin-content'); d.innerHTML = '<div class="admin-header"><h2>Order Management</h2></div><div class="table-container glass-panel"><div class="loader">Loading...</div></div>';
    try {
        const r = await fetch(`${ORDER_MGMT_URL}/all`); const orders = await r.json();
        d.innerHTML = `<div class="admin-header"><h2>Order Management</h2></div>
        <div class="table-container glass-panel">
            <table class="admin-table">
                <thead><tr><th>Order ID</th><th>User ID</th><th>Amount</th><th>Status</th><th>Payment</th><th>Actions</th></tr></thead>
                <tbody>
                    ${orders.map(o => `<tr>
                        <td>#${o.orderId}</td><td>${o.userId}</td><td>$${parseFloat(o.totalAmount).toFixed(2)}</td>
                        <td><span class="badge ${o.orderStatus==='PLACED'?'badge-primary':(o.orderStatus==='CANCELLED'?'badge-danger':'badge-secondary')}">${o.orderStatus}</span></td>
                        <td><span class="payment-status ${o.paymentStatus}">${o.paymentStatus}</span></td>
                        <td class="action-cell">
                            ${o.orderStatus === 'PLACED' ? `<button class="btn btn-sm btn-primary" onclick="updateOrderStatus(${o.orderId}, 'accept')">Accept</button>` : ''}
                            ${o.orderStatus === 'PLACED' || o.orderStatus === 'ACCEPTED' ? `<button class="btn btn-sm btn-danger" onclick="updateOrderStatus(${o.orderId}, 'cancel')">Cancel</button>` : ''}
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    } catch (e) { d.innerHTML = `<p class="error">Error: ${e.message}</p>`; }
}

async function updateOrderStatus(orderId, action) {
    const ep = action === 'accept' ? `/accept/${orderId}` : `/cancel/${orderId}`;
    try { const r = await fetch(`${ORDER_MGMT_URL}${ep}`, { method: 'PUT' }); if (r.ok) { renderOrderManagement(); } else { alert(await r.text()); } }
    catch (e) { alert('Connection error.'); }
}

function renderMenuManagement() {
    const d = document.getElementById('admin-content');
    d.innerHTML = `<div class="admin-header"><h2>Menu Management</h2></div>
        <div class="admin-grid">
            <div class="glass-panel form-panel">
                <h3>Add New Item</h3>
                <form id="add-menu-form" class="modern-form">
                    <input type="text" id="menu-name" class="form-control" placeholder="Pizza Name" required>
                    <input type="text" id="menu-category" class="form-control" placeholder="Category (e.g., Pizza, Sides)" required>
                    <input type="number" id="menu-price" class="form-control" placeholder="Base Price ($)" required step="0.01">
                    <textarea id="menu-desc" class="form-control" placeholder="Description"></textarea>
                    <label class="checkbox-label"><input type="checkbox" id="menu-isveg"> Vegetarian</label>
                    <button type="submit" class="btn btn-primary btn-block">Add Item</button>
                </form>
            </div>
            <div class="glass-panel list-panel">
                <h3>Current Menu</h3>
                <div id="existing-menu-list" class="scroll-list"><div class="loader">Loading...</div></div>
            </div>
        </div>
        <div id="update-form-container"></div>`;
    document.getElementById('add-menu-form').addEventListener('submit', handleAddMenuItem);
    fetchExistingMenuAdmin();
}

async function handleAddMenuItem(e) {
    e.preventDefault();
    const item = { name: document.getElementById('menu-name').value, category: document.getElementById('menu-category').value, basePrice: parseFloat(document.getElementById('menu-price').value), description: document.getElementById('menu-desc').value, isVeg: document.getElementById('menu-isveg').checked, available: true };
    try { const r = await fetch(`${ADMIN_BASE_URL}/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) }); if (r.ok) { document.getElementById('add-menu-form').reset(); fetchExistingMenuAdmin(); } }
    catch (e) { alert('Connection error.'); }
}

async function fetchExistingMenuAdmin() {
    const d = document.getElementById('existing-menu-list'); d.innerHTML = '<div class="loader">Loading...</div>';
    try { const r = await fetch(`${ADMIN_BASE_URL}/all`); const items = await r.json(); allMenuItems = items;
        d.innerHTML = items.map(i => `
            <div class="list-item">
                <div class="item-info"><strong>${i.name}</strong> <span class="price">$${parseFloat(i.basePrice).toFixed(2)}</span></div>
                <div class="item-actions">
                    <button class="btn btn-sm btn-outline" onclick="showUpdateForm(${i.menuId})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMenuItem(${i.menuId})">Drop</button>
                </div>
            </div>`).join('');
    } catch (e) { d.innerHTML = '<p class="error">Failed to load menu.</p>'; }
}

async function deleteMenuItem(menuId) {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try { const r = await fetch(`${ADMIN_BASE_URL}/delete/${menuId}`, { method: 'DELETE' }); if (r.ok) { fetchExistingMenuAdmin(); } }
    catch (e) { alert('Connection error.'); }
}

function showUpdateForm(menuId) {
    const item = allMenuItems.find(i => i.menuId === menuId); if (!item) return;
    document.getElementById('update-form-container').innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content glass-panel">
                <h3>✏️ Edit: ${item.name}</h3>
                <form id="update-menu-form" class="modern-form">
                    <input type="hidden" id="update-menu-id" value="${menuId}">
                    <input type="text" id="update-menu-name" class="form-control" value="${item.name}" required>
                    <input type="text" id="update-menu-category" class="form-control" value="${item.category}" required>
                    <input type="number" id="update-menu-price" class="form-control" value="${item.basePrice}" required step="0.01">
                    <textarea id="update-menu-desc" class="form-control">${item.description || ''}</textarea>
                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                        <button type="button" class="btn btn-outline" onclick="document.getElementById('update-form-container').innerHTML=''">Cancel</button>
                    </div>
                </form>
            </div>
        </div>`;
    document.getElementById('update-menu-form').addEventListener('submit', handleUpdateMenuItem);
}

async function handleUpdateMenuItem(e) {
    e.preventDefault(); const id = document.getElementById('update-menu-id').value;
    const d = { name: document.getElementById('update-menu-name').value, category: document.getElementById('update-menu-category').value, basePrice: parseFloat(document.getElementById('update-menu-price').value), description: document.getElementById('update-menu-desc').value };
    try { const r = await fetch(`${ADMIN_BASE_URL}/update/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }); if (r.ok) { document.getElementById('update-form-container').innerHTML = ''; fetchExistingMenuAdmin(); } }
    catch (e) { alert('Connection error.'); }
}

// === USER MANAGEMENT ===
async function renderUserManagement() {
    const d = document.getElementById('admin-content'); d.innerHTML = '<div class="admin-header"><h2>User Directory</h2></div><div class="table-container glass-panel"><div class="loader">Loading...</div></div>';
    try { const r = await fetch(`${ADMIN_BASE_URL}/users/all`); const users = await r.json();
        d.innerHTML = `<div class="admin-header"><h2>User Directory <span class="badge badge-primary">${users.length}</span></h2></div>
        <div class="table-container glass-panel">
            <table class="admin-table">
                <thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
                <tbody>
                    ${users.map(u => `<tr>
                        <td>#${u.userId}</td><td><strong>${u.username}</strong></td><td>${u.email}</td>
                        <td><span class="badge ${u.role==='ADMIN'?'badge-danger':'badge-secondary'}">${u.role}</span></td>
                        <td class="action-cell">
                            <button class="btn btn-sm btn-outline" onclick="showUserUpdateForm(${u.userId})">Edit</button> 
                            <button class="btn btn-sm btn-danger" onclick="deleteUser(${u.userId})">Delete</button>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div><div id="user-update-container"></div>`;
    } catch (e) { d.innerHTML = `<p class="error">Error: ${e.message}</p>`; }
}

async function deleteUser(userId) {
    if (!confirm(`Permanently delete User #${userId}?`)) return;
    try { const r = await fetch(`${ADMIN_BASE_URL}/users/delete/${userId}`, { method: 'DELETE' }); if (r.ok) { renderUserManagement(); } }
    catch (e) { alert('Connection error.'); }
}

function showUserUpdateForm(userId) {
    fetch(`${USER_SERVICE_URL}/detail/id/${userId}`).then(r => r.json()).then(user => {
        document.getElementById('user-update-container').innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content glass-panel">
                <h3>✏️ Edit User: ${user.username}</h3>
                <form id="user-update-form" class="modern-form">
                    <input type="hidden" id="user-update-id" value="${userId}">
                    <input type="text" id="user-update-username" class="form-control" value="${user.username}" required>
                    <input type="email" id="user-update-email" class="form-control" value="${user.email}" required>
                    <input type="text" id="user-update-fullname" class="form-control" value="${user.fullName || ''}" placeholder="Full Name">
                    <input type="text" id="user-update-phone" class="form-control" value="${user.phone || ''}" placeholder="Phone">
                    <select id="user-update-role" class="form-control">
                        <option value="CUSTOMER" ${user.role==='CUSTOMER'?'selected':''}>CUSTOMER</option>
                        <option value="ADMIN" ${user.role==='ADMIN'?'selected':''}>ADMIN</option>
                    </select>
                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">Save Changes</button> 
                        <button type="button" class="btn btn-outline" onclick="document.getElementById('user-update-container').innerHTML=''">Cancel</button>
                    </div>
                </form>
            </div>
        </div>`;
        document.getElementById('user-update-form').addEventListener('submit', handleUserUpdate);
    });
}

async function handleUserUpdate(e) {
    e.preventDefault(); const id = document.getElementById('user-update-id').value;
    const d = { userId: id, username: document.getElementById('user-update-username').value, email: document.getElementById('user-update-email').value, fullName: document.getElementById('user-update-fullname').value, phone: document.getElementById('user-update-phone').value, role: document.getElementById('user-update-role').value };
    try { const r = await fetch(`${ADMIN_BASE_URL}/users/update/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }); if (r.ok) { document.getElementById('user-update-container').innerHTML = ''; renderUserManagement(); } }
    catch (e) { alert('Connection error.'); }
}