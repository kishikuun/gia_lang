// LENIS INIT (Smooth Scrolling)
const lenis = new Lenis({ duration: 1.2, smooth: true });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// Kết nối Lenis với ScrollTrigger của GSAP
gsap.registerPlugin(ScrollTrigger);

// NAVBAR SCROLL EFFECT
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
});

// GSAP ANIMATIONS & SCROLLYTELLING
document.addEventListener('DOMContentLoaded', () => {
    // Hero Parallax
    gsap.to('.hero-bg', { y: '20%', ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-content', { y: '30%', opacity: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });

    // Masterpiece (Bún Song Thằn) Parallax
    gsap.to('.masterpiece-bg', { y: '15%', ease: 'none', scrollTrigger: { trigger: '#masterpiece', start: 'top bottom', end: 'bottom top', scrub: true } });
    
    // Fade Up Elements
    gsap.utils.toArray('.text-fade-up').forEach(el => {
        gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' } });
    });

    // Horizontal Scroll for The Village Gallery
    const horizontalContainer = document.querySelector('.horizontal-items');
    if (horizontalContainer) {
        gsap.to(horizontalContainer, {
            x: () => -(horizontalContainer.scrollWidth - window.innerWidth + 100),
            ease: "none",
            scrollTrigger: {
                trigger: "#village",
                pin: true,
                scrub: 1,
                end: () => "+=" + horizontalContainer.scrollWidth
            }
        });
    }

    // NARRATOR LOGIC (Dynamic Typography)
    const narratorText = document.getElementById('narrator-text');
    function updateNarrator(text) {
        if (narratorText.textContent === text) return;
        gsap.to(narratorText, { opacity: 0, duration: 0.3, onComplete: () => {
            narratorText.textContent = text;
            if (text !== "") {
                gsap.to(narratorText, { opacity: 1, duration: 0.5 });
            }
        }});
    }

    // Trigger narrator lines based on scroll sections
    ScrollTrigger.create({
        trigger: '#hero',
        start: 'top 50%',
        onEnter: () => updateNarrator("Chào cháu, mừng cháu về với buôn làng."),
        onEnterBack: () => updateNarrator("Chào cháu, mừng cháu về với buôn làng.")
    });

    ScrollTrigger.create({
        trigger: '#masterpiece',
        start: 'top 50%',
        onEnter: () => updateNarrator("Cháu nhìn xem... Bún Song Thằn, tuyệt tác tiến Vua!"),
        onEnterBack: () => updateNarrator("Cháu nhìn xem... Bún Song Thằn, tuyệt tác tiến Vua!")
    });

    ScrollTrigger.create({
        trigger: '#village',
        start: 'top 50%',
        onEnter: () => updateNarrator("Làng ta còn nhiều của ngon vật lạ lắm..."),
        onEnterBack: () => updateNarrator("Làng ta còn nhiều của ngon vật lạ lắm...")
    });

    ScrollTrigger.create({
        trigger: '#campfire',
        start: 'top 50%',
        onEnter: () => updateNarrator(""), // Hide when in campfire chat
        onEnterBack: () => updateNarrator("")
    });

    // Gọi AI chào ngay khi vừa load xong
    triggerInitialGreeting();
    
    // 3D TILT EFFECT CHO SẢN PHẨM
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;
            
            gsap.to(card.querySelector('.h-item-img'), {
                rotationX: rotateX,
                rotationY: rotateY,
                transformPerspective: 1000,
                ease: "power1.out",
                duration: 0.5
            });
        });
        card.addEventListener('mouseleave', () => {
            gsap.to(card.querySelector('.h-item-img'), {
                rotationX: 0,
                rotationY: 0,
                ease: "power3.out",
                duration: 0.5
            });
        });
    });
});

// ============================================
// AI CAMPFIRE CHAT LOGIC (Replacing Modal)
// ============================================
const campfireInput = document.getElementById('campfire-input');
const campfireSendBtn = document.getElementById('campfire-send-btn');
const campfireHistory = document.getElementById('campfire-history');

let chatHistory = [];
let isAiThinking = false;
let cart = [];

// Khởi tạo cuộc trò chuyện ban đầu
async function triggerInitialGreeting() {
    try {
        const res = await fetch('/api/interact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_message: "", chat_history: [], context_product: null, is_initial_greeting: true })
        });
        const data = await res.json();
        if (res.ok) {
            chatHistory.push({ role: 'model', content: data.response });
            appendCampfireMsg('ai', data.response);
        }
    } catch (err) {
        console.error("Lỗi gọi greeting", err);
    }
}

campfireSendBtn.addEventListener('click', handleCampfireMessage);
if(campfireInput) {
    campfireInput.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') handleCampfireMessage(); 
    });
}

async function handleCampfireMessage() {
    const text = campfireInput.value.trim();
    if (!text || isAiThinking) return;
    
    appendCampfireMsg('user', text);
    campfireInput.value = '';
    
    chatHistory.push({ role: "user", content: text });
    await callCampfireAI();
}

function appendCampfireMsg(role, content) {
    if(!campfireHistory) return null;
    const div = document.createElement('div');
    div.className = role === 'user' ? 'msg-user' : 'msg-ai';
    div.textContent = content;
    campfireHistory.appendChild(div);
    campfireHistory.scrollTop = campfireHistory.scrollHeight;
    return div;
}

function typeAIResponse(content, targetDiv, onComplete) {
    let i = 0;
    targetDiv.innerHTML = '';
    function type() {
        if (i < content.length) {
            targetDiv.innerHTML += content.charAt(i);
            i++;
            if(campfireHistory) campfireHistory.scrollTop = campfireHistory.scrollHeight;
            setTimeout(type, 15);
        } else {
            if(onComplete) onComplete();
        }
    }
    type();
}

async function callCampfireAI() {
    isAiThinking = true;
    const tempDiv = appendCampfireMsg('ai', 'Già đang nhấp ngụm trà...');
    if(tempDiv) tempDiv.style.opacity = '0.5';

    try {
        const res = await fetch('/api/interact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_message: chatHistory[chatHistory.length - 1].content,
                chat_history: chatHistory.slice(0, -1),
                context_product: null
            })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            const aiResponse = data.response;
            const actions = data.actions || [];
            
            chatHistory.push({ role: 'model', content: aiResponse });
            if(tempDiv) tempDiv.style.opacity = '1';
            
            typeAIResponse(aiResponse, tempDiv, () => {
                // Xử lý action nếu có (add_to_cart, highlight_product)
                if (actions && actions.length > 0) processActions(actions);
            });
        } else {
            if(tempDiv) tempDiv.innerHTML = 'Già Làng đang bận đi nương...';
        }
    } catch (err) {
        if(tempDiv) tempDiv.innerHTML = 'Lỗi kết nối tới bản làng.';
    } finally {
        isAiThinking = false;
    }
}

// Xử lý các Function Calls trả về từ AI
function processActions(actions) {
    actions.forEach(action => {
        if (action.type === 'add_to_cart') {
            const prodId = action.payload.product_id;
            const quantity = action.payload.quantity || 1;
            
            // Lấy tạm giá mock, thực tế nên lấy từ backend hoặc data attributes
            const mockPrice = prodId === 'bun_song_than' ? 150000 : 100000;
            const mockName = prodId === 'bun_song_than' ? 'Bún Song Thằn' : prodId;
            
            addToCart({ id: prodId, name: mockName, price: mockPrice }, quantity);
            
            // Bắn thông báo ngay trong khung chat
            if(campfireHistory) {
                const notif = document.createElement('div');
                notif.style.color = 'var(--gold)';
                notif.style.fontSize = '0.9rem';
                notif.style.textAlign = 'center';
                notif.style.marginTop = '10px';
                notif.textContent = `🛒 Già đã bỏ ${quantity} phần ${mockName} vào gùi cho cháu rồi đó!`;
                campfireHistory.appendChild(notif);
                campfireHistory.scrollTop = campfireHistory.scrollHeight;
            }
        }
        else if (action.type === 'highlight_product') {
            const prodId = action.payload.product_id;
            const card = document.querySelector(`.product-card[data-id="${prodId}"]`);
            if (card || prodId === 'bun_song_than') {
                const target = prodId === 'bun_song_than' ? '#masterpiece' : card;
                lenis.scrollTo(target, { offset: -100, duration: 1.5 });
            }
        }
    });
}

// Global func để nút Bún Song Thằn gọi được
window.triggerAction = function(type, productId) {
    if (type === 'add_to_cart') {
        const mockPrice = productId === 'bun_song_than' ? 150000 : 100000;
        const mockName = productId === 'bun_song_than' ? 'Bún Song Thằn' : productId;
        addToCart({ id: productId, name: mockName, price: mockPrice }, 1);
        
        // Hiện sidebar giỏ hàng ngay lập tức
        if (!cartSidebar.classList.contains('open')) {
            toggleCart();
        }
    }
};

// ============================================
// CART SYSTEM (Sidebar UI)
// ============================================
const cartToggleBtn = document.getElementById('cart-toggle-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsList = document.getElementById('cart-items');
const cartTotalPrice = document.getElementById('cart-total-price');
const cartCount = document.getElementById('cart-count');

function toggleCart() {
    if(!cartSidebar) return;
    const isOpen = cartSidebar.classList.contains('open');
    if (isOpen) {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('open');
        lenis.start();
    } else {
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('open');
        lenis.stop();
    }
}

if(cartToggleBtn) cartToggleBtn.addEventListener('click', toggleCart);
if(closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
if(cartOverlay) cartOverlay.addEventListener('click', toggleCart);

function addToCart(product, quantity) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ ...product, quantity: quantity });
    }
    updateCartUI();
    
    if(cartCount) {
        gsap.fromTo(cartCount, 
            { scale: 1.5, backgroundColor: '#fff' },
            { scale: 1, backgroundColor: 'var(--gold)', duration: 0.5 }
        );
    }
}

function updateCartUI() {
    if(!cartItemsList) return;
    cartItemsList.innerHTML = '';
    let total = 0;
    let count = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        count += item.quantity;
        
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="cart-item-price">${item.price.toLocaleString()}đ x ${item.quantity}</div>
            </div>
            <button class="cart-item-remove" data-index="${index}">&times;</button>
        `;
        cartItemsList.appendChild(li);
    });
    
    if(cartTotalPrice) cartTotalPrice.textContent = total.toLocaleString();
    if(cartCount) cartCount.textContent = count;
    
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.getAttribute('data-index'));
            cart.splice(idx, 1);
            updateCartUI();
        });
    });
}
