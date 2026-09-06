// LENIS INIT (Smooth Scrolling)
const lenis = new Lenis({ duration: 1.2, smooth: true });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// Kết nối Lenis với ScrollTrigger của GSAP
gsap.registerPlugin(ScrollTrigger);

let currentContext = "Trang chủ";

// NAVBAR SCROLL EFFECT
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
});

// ============================================
// WELCOME SCREEN & AUDIO LOGIC
// ============================================
const welcomeScreen = document.getElementById('welcome-screen');
const enterBtn = document.getElementById('enter-village-btn');
const ambientAudio = document.getElementById('ambient-audio');
const magicAudio = document.getElementById('magic-chime-audio');

if (enterBtn && welcomeScreen) {
    enterBtn.addEventListener('click', () => {
        window.scrollTo(0,0);
        if (typeof lenis !== 'undefined') lenis.scrollTo(0, {immediate: true});
        
        welcomeScreen.style.opacity = '0';
        setTimeout(() => welcomeScreen.style.display = 'none', 1000);
        
        if (ambientAudio) {
            ambientAudio.volume = 0.4;
            ambientAudio.play().catch(e => console.log("Audio play blocked", e));
        }
        
        // Gọi AI chào ngay khi vừa load xong
        triggerInitialGreeting();
    });
}

// GSAP ANIMATIONS & SCROLLYTELLING
document.addEventListener('DOMContentLoaded', () => {
    // Hero Parallax
    gsap.to('.hero-bg', { y: '20%', ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-content', { y: '30%', opacity: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });

    // Masterpiece (Bún Song Thần) Parallax
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
                end: () => "+=" + (horizontalContainer.scrollWidth * 0.6)
            }
        });
    }

    // CONTEXT OBSERVER (For Spirit Orb & Tooltip)
    ScrollTrigger.create({ trigger: '#hero', start: 'top 50%', onEnter: () => { currentContext = "Trang Chủ"; triggerContextualGreeting(); }, onEnterBack: () => { currentContext = "Trang Chủ"; } });
    ScrollTrigger.create({ trigger: '#masterpiece', start: 'top 50%', onEnter: () => { currentContext = "Bún Song Thần"; triggerContextualGreeting(); }, onEnterBack: () => { currentContext = "Bún Song Thần"; } });
    ScrollTrigger.create({ trigger: '#village', start: 'top 50%', onEnter: () => { currentContext = "Sản vật làng: Thổ Cẩm, Rượu Cần, Gùi"; triggerContextualGreeting(); }, onEnterBack: () => { currentContext = "Sản vật làng"; } });
    ScrollTrigger.create({ trigger: '#campfire', start: 'top 50%', onEnter: () => { currentContext = "Lửa trại"; triggerContextualGreeting(); }, onEnterBack: () => { currentContext = "Lửa trại"; } });

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
// SPIRIT ORB & REALM LOGIC (The Omnipresent Guide)
// ============================================
const spiritOrb = document.getElementById('spirit-orb');
const spiritRealm = document.getElementById('spirit-realm-overlay');
const closeSpiritRealm = document.getElementById('close-spirit-realm');
const spiritMessage = document.getElementById('spirit-message');
const spiritInput = document.getElementById('spirit-input');
const spiritSendBtn = document.getElementById('spirit-send-btn');
const spiritTooltip = document.getElementById('spirit-tooltip'); // Mini tooltip

let spiritChatHistory = [];
let isSpiritThinking = false;

function toggleSpiritRealm() {
    if (!spiritRealm) return;
    const isHidden = spiritRealm.classList.contains('hidden');
    if (isHidden) {
        if (magicAudio) {
            magicAudio.currentTime = 0;
            magicAudio.play().catch(e => console.log(e));
        }
        spiritRealm.classList.remove('hidden');
        if (spiritTooltip) spiritTooltip.classList.remove('show'); // Hide tooltip when opening realm
        
        // Auto-greet based on context if chat is somewhat empty
        if (spiritChatHistory.length < 2) {
            triggerContextualGreeting();
        }
    } else {
        spiritRealm.classList.add('hidden');
    }
}

if (spiritOrb) spiritOrb.addEventListener('click', toggleSpiritRealm);
if (closeSpiritRealm) closeSpiritRealm.addEventListener('click', toggleSpiritRealm);

function typeSpiritResponse(content, onComplete) {
    let i = 0;
    spiritMessage.innerHTML = '';
    function type() {
        if (i < content.length) {
            spiritMessage.innerHTML += content.charAt(i);
            i++;
            setTimeout(type, 20);
        } else {
            if(onComplete) onComplete();
        }
    }
    type();
}

async function callSpiritAI(systemPromptOverride = null) {
    isSpiritThinking = true;
    spiritMessage.innerHTML = 'Già Làng đang cảm nhận hơi thở của đại ngàn...';

    try {
        // We append current context to help AI know where the user is
        const recentMessage = spiritChatHistory[spiritChatHistory.length - 1];
        let payloadMessage = recentMessage ? recentMessage.content : "";
        if (systemPromptOverride) {
            payloadMessage = systemPromptOverride;
        }

        const res = await fetch('/api/interact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_message: `[Ngữ cảnh: Người dùng đang xem phần "${currentContext}"] ${payloadMessage}`,
                chat_history: spiritChatHistory.slice(0, -1),
                context_product: null
            })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            const aiResponse = data.response;
            const actions = data.actions || [];
            
            spiritChatHistory.push({ role: 'model', content: aiResponse });
            
            // Nếu Spirit Realm đang đóng, hiện Tooltip nhỏ bên ngoài
            if (spiritRealm && spiritRealm.classList.contains('hidden') && spiritTooltip) {
                spiritTooltip.textContent = aiResponse;
                spiritTooltip.classList.add('show');
                setTimeout(() => spiritTooltip.classList.remove('show'), 8000);
            }
            
            typeSpiritResponse(aiResponse, () => {
                if (actions && actions.length > 0) processActions(actions);
            });
        } else {
            spiritMessage.innerHTML = 'Hồn thiêng chưa kịp hồi đáp. Hãy thử lại.';
        }
    } catch (err) {
        spiritMessage.innerHTML = 'Lỗi kết nối tới bản làng thiêng.';
    } finally {
        isSpiritThinking = false;
    }
}

async function triggerContextualGreeting() {
    const prompt = `Già hãy thả thính khách bằng 1 câu thật ngắn, mặn mòi, lôi cuốn liên quan đến "${currentContext}". Chú ý: Cực kỳ ngắn, dưới 15 chữ để hiện vừa bong bóng chat mini!`;
    spiritChatHistory.push({ role: 'user', content: prompt });
    await callSpiritAI(prompt);
}

// Khởi tạo cuộc trò chuyện ban đầu (dùng cho Campfire hoặc ẩn)
async function triggerInitialGreeting() {
    try {
        const res = await fetch('/api/interact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_message: "", chat_history: [], context_product: null, is_initial_greeting: true })
        });
        const data = await res.json();
        if (res.ok) {
            spiritChatHistory.push({ role: 'model', content: data.response });
            // Cũng chèn vào campfire nếu có
            if (typeof appendCampfireMsg === 'function') {
                appendCampfireMsg('ai', data.response);
            }
        }
    } catch (err) {
        console.error("Lỗi gọi greeting", err);
    }
}

if (spiritSendBtn && spiritInput) {
    spiritSendBtn.addEventListener('click', handleSpiritMessage);
    spiritInput.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') handleSpiritMessage(); 
    });
}

async function handleSpiritMessage() {
    const text = spiritInput.value.trim();
    if (!text || isSpiritThinking) return;
    
    spiritInput.value = '';
    spiritChatHistory.push({ role: "user", content: text });
    await callSpiritAI();
}


// ============================================
// OLD CAMPFIRE CHAT LOGIC (Fallback)
// ============================================
const campfireInput = document.getElementById('campfire-input');
const campfireSendBtn = document.getElementById('campfire-send-btn');
const campfireHistory = document.getElementById('campfire-history');

if(campfireSendBtn) campfireSendBtn.addEventListener('click', handleCampfireMessage);
if(campfireInput) {
    campfireInput.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') handleCampfireMessage(); 
    });
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

async function handleCampfireMessage() {
    const text = campfireInput.value.trim();
    if (!text || isSpiritThinking) return;
    
    appendCampfireMsg('user', text);
    campfireInput.value = '';
    
    // Đồng bộ vào mảng chat của Spirit
    spiritChatHistory.push({ role: "user", content: text });
    
    const tempDiv = appendCampfireMsg('ai', 'Già đang nhấp ngụm trà...');
    if(tempDiv) tempDiv.style.opacity = '0.5';

    try {
        const res = await fetch('/api/interact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_message: text,
                chat_history: spiritChatHistory.slice(0, -1)
            })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            const aiResponse = data.response;
            spiritChatHistory.push({ role: 'model', content: aiResponse });
            
            if(tempDiv) {
                tempDiv.style.opacity = '1';
                tempDiv.innerHTML = aiResponse; // Simple inject for campfire
                campfireHistory.scrollTop = campfireHistory.scrollHeight;
            }
        }
    } catch (err) {
        if(tempDiv) tempDiv.innerHTML = 'Lỗi kết nối.';
    }
}


// Xử lý các Function Calls trả về từ AI
function processActions(actions) {
    actions.forEach(action => {
        if (action.type === 'add_to_cart') {
            const prodId = action.payload.product_id;
            const quantity = action.payload.quantity || 1;
            
            // Lấy tạm giá mock
            const mockPrice = prodId === 'bun_song_than' ? 150000 : 100000;
            const mockName = prodId === 'bun_song_than' ? 'Bún Song Thần' : prodId;
            
            addToCart({ id: prodId, name: mockName, price: mockPrice }, quantity);
            
            // Hiện thông báo trong Spirit Realm
            const notif = document.createElement('p');
            notif.style.color = '#fff';
            notif.style.fontSize = '1rem';
            notif.textContent = `🛒 Đã thêm ${quantity} phần ${mockName}`;
            spiritMessage.appendChild(notif);
        }
        else if (action.type === 'highlight_product') {
            const prodId = action.payload.product_id;
            const card = document.querySelector(`.product-card[data-id="${prodId}"]`);
            if (card || prodId === 'bun_song_than') {
                toggleSpiritRealm(); // close orb overlay
                const target = prodId === 'bun_song_than' ? '#masterpiece' : card;
                lenis.scrollTo(target, { offset: -100, duration: 1.5 });
            }
        }
        else if (action.type === 'play_sound') {
            const soundType = action.payload.sound_type;
            const audioEl = document.getElementById(`audio-${soundType}`);
            if (audioEl) {
                audioEl.currentTime = 0;
                audioEl.volume = 0.8;
                audioEl.play().catch(e => console.log(e));
            }
        }
    });
}

window.triggerDetails = function(productId, productName) {
    // If not open, open it
    if (spiritRealm.classList.contains('hidden')) {
        toggleSpiritRealm();
    }
    
    const prompt = `[SỰ KIỆN TƯƠNG TÁC]: Khách vừa bấm xem chi tiết món ${productName}. Thay vì hiển thị bảng nhàm chán, Già hãy dùng giọng điệu Gen Z kể một câu chuyện thật cuốn về văn hóa đằng sau món này. Nhớ doạ vui một chút là không mua thì phí phạm lắm, gạ chốt đơn liền!`;
    spiritChatHistory.push({ role: 'user', content: prompt });
    callSpiritAI(prompt);
};

window.triggerAction = function(type, productId) {
    if (type === 'add_to_cart') {
        const mockPrice = productId === 'bun_song_than' ? 150000 : 100000;
        const mockName = productId === 'bun_song_than' ? 'Bún Song Thần' : productId;
        addToCart({ id: productId, name: mockName, price: mockPrice }, 1);
        
        if (!cartSidebar.classList.contains('open')) {
            toggleCart();
        }
    }
};

// ============================================
// CART SYSTEM (Sidebar UI)
// ============================================
let cart = [];
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

    });

    // Terraink-like Dark Matter style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Custom gold marker icon
    const goldIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
        className: 'map-marker-icon'
    });

    const locations = [
        { id: 'bun_song_than', name: 'Làng Bún An Thái', lat: 13.9, lng: 108.8, desc: 'Nơi khai sinh món Bún Song Thần tiến vua.' },
        { id: 'vai_tho_cam', name: 'Làng Dệt Thổ Cẩm', lat: 13.98, lng: 108.0, desc: 'Nơi tiếng khung cửi lách cách ngày đêm.' },
        { id: 'ruou_can', name: 'Làng Rượu Cần', lat: 14.3, lng: 108.0, desc: 'Nơi men lá nồng say hương rừng đại ngàn.' }
    ];

    locations.forEach(loc => {
        const marker = L.marker([loc.lat, loc.lng], {icon: goldIcon}).addTo(map);
        
        // Bind a simple tooltip
        marker.bindPopup(`<b>${loc.name}</b><br><button onclick="triggerMapStory('${loc.id}', '${loc.name}')" style="margin-top:10px; background:var(--gold); border:none; padding:5px 10px; color:#000; border-radius:4px; cursor:pointer; font-weight:bold;">Nghe Chuyện</button>`);
        
        marker.on('click', () => {
            map.flyTo([loc.lat, loc.lng], 12, {
                animate: true,
                duration: 2
            });
        });
    });

    ScrollTrigger.create({ trigger: '#map-realm', start: 'top 50%', onEnter: () => { currentContext = "Bản Đồ Di Sản"; triggerContextualGreeting(); }, onEnterBack: () => { currentContext = "Bản Đồ Di Sản"; } });
}

window.triggerMapStory = function(id, name) {
    if (spiritRealm.classList.contains('hidden')) {
        toggleSpiritRealm();
    }
    const prompt = `[SỰ KIỆN TƯƠNG TÁC BẢN ĐỒ]: Khách vừa chọn vùng đất ${name} trên bản đồ. Già hãy kể 1 câu chuyện thần thoại thật lôi cuốn về vùng đất này và nhắc họ hãy trải nghiệm thử sản vật nơi đây. Mặn mòi lên nhé!`;
    spiritChatHistory.push({ role: 'user', content: prompt });
    callSpiritAI(prompt);
};

window.triggerProactiveAI = function(id, name) {
    if (window.currentHoverId === id) return;
    window.currentHoverId = id;
    
    if (window.hoverTimer) clearTimeout(window.hoverTimer);
    
    window.hoverTimer = setTimeout(() => {
        const prompt = `[SỰ KIỆN TƯƠNG TÁC]: Khách đang ngắm món ${name} khá lâu (trên 3s). Già hãy chủ động nói 1 câu mặn mòi, dí dỏm để gạ khách mua món này đi! Nhớ là thật ngắn gọn dưới 20 chữ.`;
        if(typeof spiritChatHistory !== 'undefined') {
            spiritChatHistory.push({ role: 'user', content: prompt });
            callSpiritAI(prompt);
        }
    }, 3000);
};

window.cancelProactiveAI = function(id) {
    if (window.currentHoverId === id) {
        window.currentHoverId = null;
        if (window.hoverTimer) clearTimeout(window.hoverTimer);
    }
};
