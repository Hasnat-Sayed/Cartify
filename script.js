// Global Variables
let products = [];
let reviews = [];
let filteredProducts = [];
let cart = [];
let userBalance = 1000;
let currentBannerIndex = 0;
let currentReviewIndex = 0;
let discountPercent = 0;


// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    fetchProducts();
    loadReviews();
    startBannerAutoSlide();
    startReviewAutoSlide();
    updateBalance();
    setupAllEventListeners();
});

// Setup All Event Listeners (NO DUPLICATES)
function setupAllEventListeners() {
    // Mobile Menu Toggle
    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
        document.getElementById('mobileMenu').classList.toggle('hidden');
    });

    // Cart Modal - Desktop
    document.getElementById('cartBtn').addEventListener('click', () => {
        document.getElementById('cartModal').classList.remove('hidden');
    });

    // Cart Modal - Mobile
    document.getElementById('cartBtnMobile').addEventListener('click', () => {
        document.getElementById('cartModal').classList.remove('hidden');
        document.getElementById('mobileMenu').classList.add('hidden');
    });

    // Close Cart
    document.getElementById('closeCart').addEventListener('click', () => {
        document.getElementById('cartModal').classList.add('hidden');
    });

    // Navigation - Desktop
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active-link'));
            e.target.classList.add('active-link');
            const target = e.target.getAttribute('href');
            document.querySelector(target).scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Navigation - Mobile
    document.querySelectorAll('.nav-link-mobile').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-link-mobile').forEach(l => l.classList.remove('active-link'));
            e.target.classList.add('active-link');
            const target = e.target.getAttribute('href');
            document.querySelector(target).scrollIntoView({ behavior: 'smooth' });
            document.getElementById('mobileMenu').classList.add('hidden');
        });
    });

    // Search and Filter
    document.getElementById('sortFilter').addEventListener('change', filterProducts);

    //banner button events
    document.getElementById('nextBtn').addEventListener('click', () => {
        currentBannerIndex = (currentBannerIndex + 1) % 4;
        updateBannerPosition();
    });

    document.getElementById('prevBtn').addEventListener('click', () => {
        currentBannerIndex = (currentBannerIndex - 1 + 4) % 4;
        updateBannerPosition();
    });

    // Review Controls
    document.getElementById('nextReview').addEventListener('click', () => {
        currentReviewIndex = (currentReviewIndex + 1) % reviews.length;
        updateReviewPosition();
    });

    document.getElementById('prevReview').addEventListener('click', () => {
        currentReviewIndex = (currentReviewIndex - 1 + reviews.length) % reviews.length;
        updateReviewPosition();
    });

    // Coupon
    document.getElementById('applyCoupon').addEventListener('click', () => {
        const coupon = document.getElementById('couponInput').value.toUpperCase();
        const message = document.getElementById('couponMessage');

        if (coupon === 'SMART10') {
            discountPercent = 10;
            message.textContent = 'Coupon applied! 10% discount';
            message.className = 'text-sm mt-2 text-green-600';
            calculateTotal();
        } else if (coupon === '') {
            message.textContent = 'Please enter a coupon code';
            message.className = 'text-sm mt-2 text-gray-600';
        } else {
            message.textContent = 'Invalid coupon code';
            message.className = 'text-sm mt-2 text-red-600';
        }
    });

    // Add Money
    document.getElementById('addMoney').addEventListener('click', () => {
        userBalance += 1000;
        updateBalance();
        calculateTotal();
        showNotification('1000 BDT added to your balance!');
    });

    // Checkout
    document.getElementById('checkout').addEventListener('click', () => {
        const total = parseFloat(document.getElementById('total').textContent);
        if (cart.length === 0) {
            showNotification('Your cart is empty!', 'error');
            return;
        }
        if (total > userBalance) {
            showNotification('Insufficient balance! Please add money to your account.', 'error');
            return;
        }
        userBalance -= total;
        updateBalance();
        cart = [];
        discountPercent = 0;
        document.getElementById('couponInput').value = '';
        document.getElementById('couponMessage').textContent = '';
        updateCart();
        document.getElementById('cartModal').classList.add('hidden');
        showNotification('Order placed successfully! Amount deducted from your balance.');
    });
}

// Fetch Products from API
async function fetchProducts() {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        products = await response.json();
        filteredProducts = [...products];
        renderProducts();
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}


//render filtered / all products
function renderProducts() {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';

    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:-translate-y-2 transition duration-400 hover:shadow-2xl';
        card.innerHTML = `
                    <img src="${product.image}" alt="${product.title}" class="w-full h-48 object-contain p-4">
                    <div class="p-4 border-t-1 border-gray-300 ">
                        <h3 class="font-semibold text-lg h-14 overflow-hidden">${product.title}</h3>
                        <div class="flex items-center justify-between my-2">
                            <span class="font-medium text-gray-600">⭐Rating: ${product.rating.rate}</span>
                            <span class=" text-gray-600 ml-2">Reviews: ${product.rating.count}</span>
                        </div>
                        <p class="text-2xl font-bold text-pink-600 mb-4">${product.price} BDT</p>
                        <button onclick="addToCart(${product.id})" class="w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 font-bold cursor-pointer">
                            Add to Cart
                        </button>
                    </div>
                `;
        container.appendChild(card);
    });
}

// Add to Cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCart();
    showNotification('Product added to cart!');
}

// Update Cart
function updateCart() {
    updateCartCount();

    const cartItems = document.getElementById('cartItems');
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-center text-gray-500 py-8">Your cart is empty</p>';
    } else {
        cartItems.innerHTML = cart.map(item => `
                    <div class="cart-item flex items-center gap-4 border-b pb-4" data-product-id="${item.id}">
                        <img src="${item.image}" alt="${item.title}" class="w-20 h-20 object-contain">
                        <div class="flex-1">
                            <h4 class="font-semibold">${item.title.substring(0, 40)}...</h4>
                            <p class="text-blue-600 font-bold">${item.price} BDT</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="updateQuantity(${item.id}, -1)" class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">-</button>
                            <span class="font-semibold quantity-display">${item.quantity}</span>
                            <button onclick="updateQuantity(${item.id}, 1)" class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">+</button>
                        </div>
                        <button onclick="removeFromCart(${item.id})" class="text-red-600 font-bold hover:text-red-800">✕</button>
                    </div>
                `).join('');
    }

    calculateTotal();
}

// Update Quantity
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            const quantityElements = document.querySelectorAll(`[data-product-id="${productId}"] .quantity-display`);
            quantityElements.forEach(el => el.textContent = item.quantity);
            updateCartCount();
            calculateTotal();
        }
    }
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

// Calculate Total
function calculateTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCharge = subtotal > 0 ? 50 : 0;
    const shippingCost = subtotal > 500 ? 0 : 30;
    const discount = subtotal * (discountPercent / 100);
    const total = subtotal + deliveryCharge + shippingCost - discount;

    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('deliveryCharge').textContent = deliveryCharge;
    document.getElementById('shippingCost').textContent = shippingCost;
    document.getElementById('discount').textContent = discount.toFixed(2);
    document.getElementById('total').textContent = total.toFixed(2);
}

// Update Balance Display
function updateBalance() {
    document.getElementById('userBalance').textContent = userBalance.toFixed(2);
    document.getElementById('userBalanceMobile').textContent = userBalance.toFixed(2);
}

// Update Cart Count
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
    document.getElementById('cartCountMobile').textContent = count;
}

//filter products
function filterProducts() {
    const sort = document.getElementById('sortFilter').value;
    //sorting
    if (sort === 'default') {
        filterProducts.sort((a, b) => a.id - b.id);
    }
    else if (sort === 'lowToHigh') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sort === 'highToLow') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
        filteredProducts.sort((a, b) => b.rating.rate - a.rating.rate);
    }

    renderProducts();
}

//banner sliding functions
function startBannerAutoSlide() {
    setInterval(() => {
        currentBannerIndex = (currentBannerIndex + 1) % 4;
        updateBannerPosition();
    }, 4000);
}

function updateBannerPosition() {
    const container = document.getElementById('bannerContainer');
    container.style.transform = `translateX(-${currentBannerIndex * 100}%)`;
}

// fetch reviews
async function loadReviews() {
    try {
        const review = await fetch('reviews.json');
        reviews = await review.json();
        renderReviews();
    } catch (error) {
        console.error('Error fetching Reviews:', error);
    }
}
//render reviews
function renderReviews() {
    const container = document.getElementById('reviewsContainer');
    container.innerHTML = reviews.map(review => `
                <div class="min-w-full md:min-w-[50%] lg:min-w-[33.333%] px-4 my-2">
                    <div class="bg-white p-6 rounded-xl shadow-md ring-2 ring-pink-300">
                        <div class="flex items-center mb-4">
                            <div class="w-12 h-12 rounded-full overflow-hidden">
                                <img src="${review.image}"  class="w-full h-full object-cover" alt="${review.name}">
                            </div>
                            <div class="ml-4">
                                <h4 class="font-semibold text-pink-500">${review.name}</h4>
                                <p class="text-sm text-gray-500">${review.date}</p>
                            </div>
                        </div>
                        <div class="text-yellow-500 mb-2">${'⭐'.repeat(review.rating)}</div>
                        <p>${review.comment}</p>
                    </div>
                </div>
            `).join('');
}

function startReviewAutoSlide() {
    setInterval(() => {
        const maxIndex = reviews.length - 3;
        currentReviewIndex = (currentReviewIndex + 1) % (maxIndex + 1);
        updateReviewPosition();
    }, 3000);
}

function updateReviewPosition() {
    const container = document.getElementById('reviewsContainer');
    container.style.transform = `translateX(-${currentReviewIndex * (100 / 3)}%)`;
}

// Notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 700);
}