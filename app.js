/* ================================================
   LUMITOP STORE – App JavaScript
   Cart, Gallery, Checkout & Razorpay Integration
   ================================================ */

(function () {
    'use strict';

    // ── Configuration ──
    const CONFIG = {
        product: {
            name: 'LUMITOP™ Sunset Projection LED Lamp',
            price: 549,
            comparePrice: 1499,
            currency: 'INR',
            image: 'images/product-1.jpg',
            variants: ['Sunset Orange', 'Rainbow RGB', 'Golden Warm', 'Purple Haze']
        },
        razorpay: {
            key: 'rzp_test_XXXXXXXXXXXXXXX', // Replace with your Razorpay Key ID
            company: 'Lumitop Store',
            logo: '',
            color: '#FF4500'
        },
        shopify: {
            domain: 'mavis-1773032239.myshopify.com', 
            useRedirect: false // Set to true to redirect checkout directly to Shopify
        },
        gemini: {
            apiKey: 'AIzaSyBD645eE2e7tEAjMsSPF2h9cp85kHqUitA' // User needs to provide this
        }
    };

    // ── State ──
    let cart = JSON.parse(localStorage.getItem('lumitop_cart') || '[]');
    let currentSlide = 0;
    const totalSlides = 5;
    let touchStartX = 0;
    let touchEndX = 0;

    // ── DOM Elements ──
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const els = {
        hamburger: $('#hamburger-btn'),
        mobileNav: $('#mobile-nav'),
        mobileNavClose: $('#mobile-nav-close'),
        overlay: $('#overlay'),
        cartToggle: $('#cart-toggle-btn'),
        cartCount: $('#cart-count'),
        cartDrawer: $('#cart-drawer'),
        cartDrawerClose: $('#cart-drawer-close'),
        cartDrawerBody: $('#cart-drawer-body'),
        cartEmpty: $('#cart-empty'),
        cartItems: $('#cart-items'),
        cartDrawerFooter: $('#cart-drawer-footer'),
        cartSubtotal: $('#cart-subtotal-amount'),
        cartContinue: $('#cart-continue-shopping'),
        checkoutBtn: $('#checkout-btn'),
        checkoutModal: $('#checkout-modal'),
        checkoutClose: $('#checkout-close'),
        checkoutForm: $('#checkout-form'),
        checkoutSummary: $('#checkout-summary'),
        checkoutSubtotal: $('#checkout-subtotal'),
        checkoutTotal: $('#checkout-total-amount'),
        placeOrderBtn: $('#place-order-btn'),
        successModal: $('#success-modal'),
        successClose: $('#success-close-btn'),
        orderIdDisplay: $('#order-id-display'),
        gallerySlides: $$('.gallery-slide'),
        galleryDots: $$('.gallery-dot'),
        galleryThumbs: $$('.gallery-thumb'),
        galleryPrev: $('#gallery-prev'),
        galleryNext: $('#gallery-next'),
        galleryMain: $('#gallery-main'),
        colorSwatches: $$('.color-swatch'),
        selectedColorName: $('#selected-color-name'),
        qtyMinus: $('#qty-minus'),
        qtyPlus: $('#qty-plus'),
        qtyInput: $('#qty-input'),
        addToCartBtn: $('#add-to-cart-btn'),
        buyNowBtn: $('#buy-now-btn'),
        stickyAtc: $('#sticky-atc'),
        stickyAddToCart: $('#sticky-add-to-cart'),
        newsletterForm: $('#newsletter-form'),
        paymentMethods: $$('.payment-method'),
        chatbotWidget: $('#chatbot-widget'),
        chatbotWindow: $('#chatbot-window'),
        chatbotFab: $('#chatbot-fab'),
        chatbotClose: $('#chatbot-close'),
        chatbotMessages: $('#chatbot-messages'),
        chatbotInput: $('#chatbot-input'),
        chatbotSend: $('#chatbot-send'),
        fabIconChat: $('.fab-icon-chat'),
        fabIconClose: $('.fab-icon-close')
    };

    // ── Initialize ──
    function init() {
        updateCartUI();
        bindEvents();
        initStickyAtc();
        initScrollReveal();
        initChatbot();
    }

    // ── Event Bindings ──
    function bindEvents() {
        // Mobile Nav
        els.hamburger.addEventListener('click', openMobileNav);
        els.mobileNavClose.addEventListener('click', closeMobileNav);
        els.overlay.addEventListener('click', closeAll);

        // Mobile Nav Links
        $$('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                closeMobileNav();
            });
        });

        // Cart Drawer
        els.cartToggle.addEventListener('click', openCartDrawer);
        els.cartDrawerClose.addEventListener('click', closeCartDrawer);
        els.cartContinue.addEventListener('click', (e) => {
            e.preventDefault();
            closeCartDrawer();
        });

        // Gallery
        els.galleryPrev.addEventListener('click', () => changeSlide(currentSlide - 1));
        els.galleryNext.addEventListener('click', () => changeSlide(currentSlide + 1));
        els.galleryDots.forEach(dot => {
            dot.addEventListener('click', () => changeSlide(parseInt(dot.dataset.index)));
        });
        els.galleryThumbs.forEach(thumb => {
            thumb.addEventListener('click', () => changeSlide(parseInt(thumb.dataset.index)));
        });

        // Touch swipe for gallery
        els.galleryMain.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        els.galleryMain.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        // Color Swatches
        els.colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                els.colorSwatches.forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                els.selectedColorName.textContent = swatch.dataset.color;
            });
        });

        // Quantity
        els.qtyMinus.addEventListener('click', () => {
            const val = parseInt(els.qtyInput.value);
            if (val > 1) els.qtyInput.value = val - 1;
        });
        els.qtyPlus.addEventListener('click', () => {
            const val = parseInt(els.qtyInput.value);
            if (val < 10) els.qtyInput.value = val + 1;
        });

        // Add to Cart
        els.addToCartBtn.addEventListener('click', addToCart);
        els.stickyAddToCart.addEventListener('click', addToCart);

        // Buy Now
        els.buyNowBtn.addEventListener('click', () => {
            addToCart();
            setTimeout(() => {
                closeCartDrawer();
                openCheckoutModal();
            }, 300);
        });

        // Checkout
        els.checkoutBtn.addEventListener('click', () => {
            if (CONFIG.shopify.useRedirect) {
                // Direct integration redirect to Shopify Cart
                window.location.href = `https://${CONFIG.shopify.domain}/`;
            } else {
                closeCartDrawer();
                openCheckoutModal();
            }
        });
        els.checkoutClose.addEventListener('click', closeCheckoutModal);
        els.checkoutForm.addEventListener('submit', handleCheckout);

        // Payment method switching
        els.paymentMethods.forEach(method => {
            method.addEventListener('click', () => {
                els.paymentMethods.forEach(m => m.classList.remove('active'));
                method.classList.add('active');
                method.querySelector('input').checked = true;
            });
        });

        // Success
        els.successClose.addEventListener('click', () => {
            els.successModal.classList.remove('open');
            document.body.classList.remove('no-scroll');
        });

        // Newsletter
        els.newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('✓ Subscribed successfully!');
            els.newsletterForm.reset();
        });

        // Auto-play gallery
        setInterval(() => {
            if (!document.hidden) {
                changeSlide((currentSlide + 1) % totalSlides);
            }
        }, 5000);
    }

    // ── Mobile Nav ──
    function openMobileNav() {
        els.mobileNav.classList.add('open');
        els.overlay.classList.add('visible');
        els.hamburger.classList.add('active');
        document.body.classList.add('no-scroll');
    }

    function closeMobileNav() {
        els.mobileNav.classList.remove('open');
        els.overlay.classList.remove('visible');
        els.hamburger.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }

    // ── Cart Drawer ──
    function openCartDrawer() {
        els.cartDrawer.classList.add('open');
        els.overlay.classList.add('visible');
        document.body.classList.add('no-scroll');
    }

    function closeCartDrawer() {
        els.cartDrawer.classList.remove('open');
        els.overlay.classList.remove('visible');
        document.body.classList.remove('no-scroll');
    }

    function closeAll() {
        closeMobileNav();
        closeCartDrawer();
    }

    // ── Gallery ──
    function changeSlide(index) {
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;

        els.gallerySlides.forEach(slide => slide.classList.remove('active'));
        els.galleryDots.forEach(dot => dot.classList.remove('active'));
        els.galleryThumbs.forEach(thumb => thumb.classList.remove('active'));

        els.gallerySlides[index].classList.add('active');
        els.galleryDots[index].classList.add('active');
        els.galleryThumbs[index].classList.add('active');

        // Scroll thumb into view
        els.galleryThumbs[index].scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest'
        });

        currentSlide = index;
    }

    function handleSwipe() {
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                changeSlide(currentSlide + 1);
            } else {
                changeSlide(currentSlide - 1);
            }
        }
    }

    // ── Cart Management ──
    function addToCart() {
        const selectedColor = document.querySelector('.color-swatch.active').dataset.color;
        const quantity = parseInt(els.qtyInput.value);

        // Check if item with same color already exists
        const existingIndex = cart.findIndex(item => item.color === selectedColor);
        if (existingIndex > -1) {
            cart[existingIndex].quantity += quantity;
        } else {
            cart.push({
                id: Date.now(),
                name: CONFIG.product.name,
                price: CONFIG.product.price,
                comparePrice: CONFIG.product.comparePrice,
                color: selectedColor,
                quantity: quantity,
                image: CONFIG.product.image
            });
        }

        saveCart();
        updateCartUI();
        openCartDrawer();
        showToast('✓ Added to cart!');

        // Animate cart count
        els.cartCount.style.transform = 'scale(1.4)';
        setTimeout(() => { els.cartCount.style.transform = 'scale(1)'; }, 200);
    }

    function removeFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        saveCart();
        updateCartUI();
    }

    function updateCartItemQty(id, delta) {
        const item = cart.find(item => item.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                removeFromCart(id);
                return;
            }
            saveCart();
            updateCartUI();
        }
    }

    function saveCart() {
        localStorage.setItem('lumitop_cart', JSON.stringify(cart));
    }

    function getCartTotal() {
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }

    function getCartCount() {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    function updateCartUI() {
        const count = getCartCount();
        const total = getCartTotal();

        // Update cart count badge
        els.cartCount.textContent = count;
        if (count > 0) {
            els.cartCount.classList.add('visible');
        } else {
            els.cartCount.classList.remove('visible');
        }

        // Toggle empty/items state
        if (count === 0) {
            els.cartEmpty.style.display = 'flex';
            els.cartItems.innerHTML = '';
            els.cartDrawerFooter.style.display = 'none';
        } else {
            els.cartEmpty.style.display = 'none';
            els.cartDrawerFooter.style.display = 'block';
            renderCartItems();
        }

        // Update subtotal
        els.cartSubtotal.textContent = formatPrice(total);
    }

    function renderCartItems() {
        els.cartItems.innerHTML = cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-variant">${item.color}</div>
                    <div class="cart-item-bottom">
                        <div class="cart-item-qty">
                            <button onclick="window._lumitop.updateQty(${item.id}, -1)" aria-label="Decrease">−</button>
                            <span>${item.quantity}</span>
                            <button onclick="window._lumitop.updateQty(${item.id}, 1)" aria-label="Increase">+</button>
                        </div>
                        <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
                    </div>
                    <button class="cart-item-remove" onclick="window._lumitop.remove(${item.id})">Remove</button>
                </div>
            </div>
        `).join('');
    }

    // Expose cart functions globally for inline handlers
    window._lumitop = {
        updateQty: updateCartItemQty,
        remove: removeFromCart
    };

    // ── Checkout ──
    function openCheckoutModal() {
        renderCheckoutSummary();
        els.checkoutModal.classList.add('open');
        document.body.classList.add('no-scroll');
    }

    function closeCheckoutModal() {
        els.checkoutModal.classList.remove('open');
        document.body.classList.remove('no-scroll');
    }

    function renderCheckoutSummary() {
        const total = getCartTotal();
        els.checkoutSummary.innerHTML = cart.map(item => `
            <div class="checkout-summary-item">
                <img src="${item.image}" alt="${item.name}" class="checkout-summary-img">
                <div class="checkout-summary-info">
                    <div class="checkout-summary-title">${item.name}</div>
                    <div class="checkout-summary-meta">${item.color} × ${item.quantity}</div>
                </div>
                <div class="checkout-summary-price">${formatPrice(item.price * item.quantity)}</div>
            </div>
        `).join('');

        els.checkoutSubtotal.textContent = formatPrice(total);
        els.checkoutTotal.textContent = formatPrice(total);
    }

    function handleCheckout(e) {
        e.preventDefault();

        const formData = {
            name: $('#checkout-name').value.trim(),
            email: $('#checkout-email').value.trim(),
            phone: $('#checkout-phone').value.trim(),
            address: $('#checkout-address').value.trim(),
            city: $('#checkout-city').value.trim(),
            pincode: $('#checkout-pincode').value.trim(),
            state: $('#checkout-state').value.trim()
        };

        // Validate
        if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.pincode || !formData.state) {
            showToast('⚠ Please fill in all required fields');
            return;
        }

        if (formData.phone.length !== 10) {
            showToast('⚠ Please enter a valid 10-digit phone number');
            return;
        }

        if (formData.pincode.length !== 6) {
            showToast('⚠ Please enter a valid 6-digit pincode');
            return;
        }

        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

        if (paymentMethod === 'razorpay') {
            initiateRazorpayPayment(formData);
        } else {
            // COD order
            placeOrder(formData, 'COD', null);
        }
    }

    function initiateRazorpayPayment(formData) {
        const total = getCartTotal();

        const options = {
            key: CONFIG.razorpay.key,
            amount: total * 100, // Razorpay expects amount in paise
            currency: CONFIG.product.currency,
            name: CONFIG.razorpay.company,
            description: cart.map(item => `${item.name} (${item.color}) ×${item.quantity}`).join(', '),
            image: CONFIG.razorpay.logo,
            handler: function (response) {
                placeOrder(formData, 'Razorpay', response.razorpay_payment_id);
            },
            prefill: {
                name: formData.name,
                email: formData.email,
                contact: formData.phone
            },
            notes: {
                address: formData.address,
                city: formData.city,
                pincode: formData.pincode,
                state: formData.state
            },
            theme: {
                color: CONFIG.razorpay.color
            },
            modal: {
                ondismiss: function () {
                    showToast('Payment cancelled');
                }
            }
        };

        try {
            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function (response) {
                showToast('⚠ Payment failed. Please try again.');
                console.error('Payment failed:', response.error);
            });
            rzp.open();
        } catch (error) {
            console.error('Razorpay error:', error);
            showToast('⚠ Payment gateway error. Using demo mode.');
            // Demo mode: simulate successful payment
            setTimeout(() => {
                placeOrder(formData, 'Demo Payment', 'DEMO_' + Date.now());
            }, 500);
        }
    }

    function placeOrder(formData, paymentMethod, paymentId) {
        const orderId = 'LMT-' + Date.now().toString(36).toUpperCase();

        const orderData = {
            orderId,
            ...formData,
            paymentMethod,
            paymentId,
            items: [...cart],
            total: getCartTotal(),
            timestamp: new Date().toISOString()
        };

        // Save order to localStorage
        const orders = JSON.parse(localStorage.getItem('lumitop_orders') || '[]');
        orders.push(orderData);
        localStorage.setItem('lumitop_orders', JSON.stringify(orders));

        // Log order to console (for demo)
        console.log('Order placed:', orderData);

        // Clear cart
        cart = [];
        saveCart();
        updateCartUI();

        // Close checkout and show success
        closeCheckoutModal();
        els.checkoutForm.reset();

        els.orderIdDisplay.textContent = `Order ID: ${orderId}`;
        els.successModal.classList.add('open');
        document.body.classList.add('no-scroll');
    }

    // ── Sticky Add to Cart ──
    function initStickyAtc() {
        const productActions = $('.product-actions');
        if (!productActions) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    els.stickyAtc.classList.remove('visible');
                } else {
                    els.stickyAtc.classList.add('visible');
                }
            },
            { threshold: 0, rootMargin: '-100px 0px 0px 0px' }
        );

        observer.observe(productActions);
    }

    // ── Toast ──
    function showToast(message) {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // ── Helpers ──
    function formatPrice(amount) {
        return '₹' + amount.toLocaleString('en-IN');
    }

    // ── Smooth scroll for anchor links ──
    $$('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ── Scroll Reveal ──
    function initScrollReveal() {
        const revealElements = document.querySelectorAll('[data-reveal]');
        if (!revealElements.length) return;

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    revealObserver.unobserve(entry.target); // Only reveal once
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

        revealElements.forEach(el => revealObserver.observe(el));
    }

    // ── Chatbot Integration (Gemini) ──
    function initChatbot() {
        if (!els.chatbotWidget) return;

        let isChatOpen = false;

        function toggleChat() {
            isChatOpen = !isChatOpen;
            if (isChatOpen) {
                els.chatbotWindow.classList.add('open');
                els.fabIconChat.style.display = 'none';
                els.fabIconClose.style.display = 'block';
                els.chatbotInput.focus();
            } else {
                els.chatbotWindow.classList.remove('open');
                els.fabIconChat.style.display = 'block';
                els.fabIconClose.style.display = 'none';
            }
        }

        els.chatbotFab.addEventListener('click', toggleChat);
        els.chatbotClose.addEventListener('click', toggleChat);

        async function sendMessage() {
            const text = els.chatbotInput.value.trim();
            if (!text) return;

            // Add user message
            addChatMessage(text, 'user');
            els.chatbotInput.value = '';

            if (CONFIG.gemini.apiKey === 'YOUR_GEMINI_API_KEY') {
                setTimeout(() => {
                    addChatMessage("Hey there! 😊 Lumi here. My AI brain is currently sleeping because I need a Gemini API Key to talk to you. <br><br>Please grab a free key from <a href='https://aistudio.google.com/app/apikey' target='_blank' style='color:var(--color-accent);text-decoration:underline;'>Google AI Studio</a> and paste it into <strong>app.js (line 30)</strong> where it says `apiKey: 'YOUR_KEY_HERE'`.", 'bot');
                }, 500);
                return;
            }

            // Show typing indicator
            const typingId = 'typing-' + Date.now();
            addChatMessage('...', 'bot', typingId);

            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${CONFIG.gemini.apiKey}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            role: 'user',
                            parts: [{ 
                                text: `You are Lumi, a highly empathetic and friendly human customer support representative for our premium store. We sell the 'LUMITOP Sunset Projection LED Lamp'.
Rule 1: NEVER say you are an AI, bot, or virtual assistant. Act exactly like a real human texting a customer (casual, friendly, use emojis, empathetic).
Rule 2: Keep replies short, conversational, and punchy. Don't write long essays.
Rule 3: The lamp costs ₹549 (on sale from ₹1,499).
Rule 4: Shipping is Free and Cash on Delivery (COD) is available anywhere in India.
Rule 5: The lamp has 4 variants: Sunset Orange, Rainbow RGB, Golden Warm, Purple Haze.
Customer says: "${text}"` 
                            }]
                        }]
                    })
                });

                const data = await response.json();
                removeChatMessage(typingId);

                if (data && data.candidates && data.candidates[0].content) {
                    const botReply = data.candidates[0].content.parts[0].text;
                    addChatMessage(botReply, 'bot');
                } else if (data && data.error) {
                    console.log('Gemini API Exhausted or Error:', data.error.message);
                    addChatMessage("I'm currently helping so many customers right now that my brain is full! 😅 Please leave your email or WhatsApp number and my human team will get right back to you!", 'bot');
                } else {
                    addChatMessage("I'm sorry, I couldn't process that right now. Could you rephrase?", 'bot');
                }
            } catch (error) {
                console.error('Gemini API Error:', error);
                removeChatMessage(typingId);
                addChatMessage("Network error connecting to AI. Please try again.", 'bot');
            }
        }

        els.chatbotSend.addEventListener('click', sendMessage);
        els.chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    function addChatMessage(text, sender, id = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;
        if (id) msgDiv.id = id;
        
        // Simple markdown boldness parsing
        msgDiv.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        
        els.chatbotMessages.appendChild(msgDiv);
        els.chatbotMessages.scrollTop = els.chatbotMessages.scrollHeight;
    }

    function removeChatMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // ── Init on DOM ready ──
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
