// LENIS INIT (Smooth Scrolling)
let lenis;
if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.2, smooth: true });
    function raf(time) { if (lenis) lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
}

// Kết nối Lenis với ScrollTrigger của GSAP
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

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
        try {
            window.scrollTo(0, 0);
            if (typeof lenis !== 'undefined' && lenis) lenis.scrollTo(0, {immediate: true});
        } catch (err) {
            console.error(err);
        }
        
        welcomeScreen.style.opacity = '0';
        setTimeout(() => {
            welcomeScreen.style.display = 'none';
        }, 800);
        
        try {
            if (ambientAudio) {
                ambientAudio.volume = 0.4;
                ambientAudio.play().catch(e => console.log("Audio play blocked", e));
            }
            if (typeof startAllSounds === 'function') {
                startAllSounds();
            }
        } catch (e) {
            console.log("Audio error", e);
        }
        
        // Gọi AI chào ngay khi vừa load xong
        if (typeof triggerInitialGreeting === 'function') {
            triggerInitialGreeting();
        }
    });
}

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
                start: () => "top -" + Math.round(window.innerHeight * 0.18),
                scrub: 1,
                end: () => "+=" + (horizontalContainer.scrollWidth * 0.6)
            }
        });
    }

    // CONTEXT OBSERVER (For Spirit Orb & Tooltip)
    ScrollTrigger.create({ trigger: '#hero', start: 'top 50%', onEnter: () => { currentContext = "Trang Chủ"; triggerContextualGreeting(); }, onEnterBack: () => { currentContext = "Trang Chủ"; } });
    ScrollTrigger.create({ trigger: '#masterpiece', start: 'top 50%', onEnter: () => { currentContext = "Bún Song Thằn"; triggerContextualGreeting(); }, onEnterBack: () => { currentContext = "Bún Song Thằn"; } });
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
            const mockName = prodId === 'bun_song_than' ? 'Bún Song Thằn' : prodId;
            
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
        const mockName = productId === 'bun_song_than' ? 'Bún Song Thằn' : productId;
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

// ========================================================
// MAP INITIALIZATION (BẢN ĐỒ VIỆT NAM 34 TỈNH THÀNH SAU SÁP NHẬP)
// ========================================================
const mapElement = document.getElementById('village-map');
let vietnamGeoJsonLayer = null;
let provinceLayersMap = {};
let allFeaturesData = [];

if (mapElement && typeof L !== 'undefined') {
    // Center Vietnam overview
    const defaultCenter = [16.2, 107.5];
    const defaultZoom = 6;
    const map = L.map('village-map', {
        zoomControl: true,
        scrollWheelZoom: true
    }).setView(defaultCenter, defaultZoom);

    // BASEMAP LAYERS
    // 1. Satellite Imagery (No old labels or borders! Pure geographic nature)
    const satelliteTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Earthstar Geographics | Đề án 34 Tỉnh Thành',
        maxZoom: 16
    });

    // 2. Dark Gray Base
    const darkTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ | Đề án 34 Tỉnh Thành',
        maxZoom: 16
    });

    // Default to Satellite so NO old provincial borders/names from tiles appear!
    satelliteTile.addTo(map);
    let isSatellite = true;

    // Map Style Toggle Button
    const styleToggleBtn = document.getElementById('map-style-toggle');
    if (styleToggleBtn) {
        styleToggleBtn.addEventListener('click', () => {
            if (isSatellite) {
                map.removeLayer(satelliteTile);
                darkTile.addTo(map);
                if (vietnamGeoJsonLayer) vietnamGeoJsonLayer.bringToFront();
                styleToggleBtn.innerHTML = '🗺️ Bản đồ tối';
                isSatellite = false;
            } else {
                map.removeLayer(darkTile);
                satelliteTile.addTo(map);
                if (vietnamGeoJsonLayer) vietnamGeoJsonLayer.bringToFront();
                styleToggleBtn.innerHTML = '🛰️ Vệ tinh';
                isSatellite = true;
            }
        });
    }

    // Custom gold marker icon for Heritage locations
    const goldIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
        className: 'map-marker-icon'
    });

    // Color definitions (Vibrant & prominent for clear distinction)
    function getProvinceStyle(feature) {
        const p = feature.properties;
        const isGiaLai = p.don_vi_moi === 'Gia Lai';
        const isMerged = !p.is_giu_nguyen;

        if (isGiaLai) {
            return {
                fillColor: '#ff2222',
                weight: 3.5,
                opacity: 1,
                color: '#ff4d4d',
                dashArray: '',
                fillOpacity: 0.52
            };
        } else if (isMerged) {
            return {
                fillColor: '#d4af37',
                weight: 2.2,
                opacity: 1,
                color: '#ffd700',
                dashArray: '',
                fillOpacity: 0.38
            };
        } else {
            return {
                fillColor: '#00b4d8',
                weight: 2.2,
                opacity: 1,
                color: '#00e5ff',
                dashArray: '',
                fillOpacity: 0.32
            };
        }
    }

    // Detail card elements
    const card = document.getElementById('province-detail-card');
    const cardCloseBtn = document.getElementById('close-province-card');
    const cardStt = document.getElementById('card-stt');
    const cardName = document.getElementById('card-name');
    const cardTag = document.getElementById('card-status-tag');
    const cardMergers = document.getElementById('card-mergers');
    const cardCenter = document.getElementById('card-center');
    const cardScale = document.getElementById('card-scale');
    const cardArea = document.getElementById('card-area');
    const cardPop = document.getElementById('card-population');
    const cardHeritage = document.getElementById('card-heritage-box');
    const cardStoryBtn = document.getElementById('card-story-btn');
    const provinceSelect = document.getElementById('map-province-select');

    let currentSelectedProvince = null;

    if (cardCloseBtn) {
        cardCloseBtn.addEventListener('click', () => {
            if (card) card.classList.add('hidden');
            resetLayersStyle();
        });
    }

    function showProvinceCard(p) {
        if (!card) return;
        currentSelectedProvince = p;
        const sttStr = (p.stt_bang < 10 ? '0' : '') + p.stt_bang;
        cardStt.textContent = `STT: ${sttStr} / 34`;
        cardName.textContent = p.don_vi_moi;
        
        if (p.is_giu_nguyen) {
            cardTag.textContent = 'Đơn vị giữ nguyên';
            cardTag.className = 'card-tag tag-kept';
        } else {
            cardTag.textContent = 'Sáp nhập mới';
            cardTag.className = 'card-tag tag-merged';
        }

        cardMergers.textContent = p.cac_don_vi_sap_nhap;
        cardCenter.textContent = p.trung_tam_hanh_chinh;
        cardScale.textContent = p.quy_mo || 'Đang cập nhật';
        cardArea.textContent = p.dtich_km2 ? Number(p.dtich_km2).toLocaleString('vi-VN') + ' km²' : '--';
        cardPop.textContent = p.dan_so ? Number(p.dan_so).toLocaleString('vi-VN') + ' người' : '--';

        if (p.don_vi_moi === 'Gia Lai') {
            cardHeritage.style.display = 'block';
            cardHeritage.innerHTML = '<strong>Đất Tổ Di Sản:</strong> Sáp nhập <strong>Gia Lai + Bình Định</strong> (Trung tâm tại Bình Định). Nơi khai sinh <em>Bún Song Thằn tiến vua</em> An Thái, kết nối cùng cồng chiêng, rượu cần đại ngàn hùng vĩ!';
        } else if (p.don_vi_moi.includes('Đà Nẵng')) {
            cardHeritage.style.display = 'block';
            cardHeritage.innerHTML = '<strong>Chủ quyền & Di sản:</strong> Sáp nhập Quảng Nam + Đà Nẵng, bao gồm trọn vẹn <strong>Quần đảo Hoàng Sa</strong> thiêng liêng cùng phố cổ Hội An, thánh địa Mỹ Sơn.';
        } else if (p.don_vi_moi.includes('Khánh Hoà')) {
            cardHeritage.style.display = 'block';
            cardHeritage.innerHTML = '<strong>Chủ quyền & Di sản:</strong> Sáp nhập Khánh Hòa + Ninh Thuận, bao gồm trọn vẹn <strong>Quần đảo Trường Sa</strong> cùng tháp Chàm Ponagar và vịnh biển ngọc ngà.';
        } else {
            cardHeritage.style.display = 'block';
            cardHeritage.innerHTML = `<strong>Đặc trưng vùng đất:</strong> Trung tâm chính trị - hành chính đặt tại <strong>${p.trung_tam_hanh_chinh}</strong>. Hãy nghe Già Làng kể tích xưa về vùng đất này!`;
        }

        cardStoryBtn.onclick = () => {
            triggerMapStory(p.stt_bang, p.don_vi_moi, p.cac_don_vi_sap_nhap, p.trung_tam_hanh_chinh);
        };

        card.classList.remove('hidden');
    }

    function resetLayersStyle() {
        if (!vietnamGeoJsonLayer) return;
        vietnamGeoJsonLayer.eachLayer(layer => {
            vietnamGeoJsonLayer.resetStyle(layer);
        });
    }

    function highlightProvince(layer) {
        layer.setStyle({
            weight: 4,
            color: '#ffffff',
            fillOpacity: 0.7,
            dashArray: ''
        });
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    }

    // Zoom safely into province
    function zoomToProvince(p, layer) {
        if (p.center_lat && p.center_lng) {
            // For provinces with far islands (Đà Nẵng, Khánh Hòa), center on mainland
            if (p.don_vi_moi.includes('Đà Nẵng') || p.don_vi_moi.includes('Khánh Hoà')) {
                map.flyTo([p.center_lat, p.center_lng], 8, { duration: 1.5 });
            } else {
                map.flyToBounds(layer.getBounds(), { padding: [50, 50], duration: 1.5 });
            }
        } else {
            map.flyToBounds(layer.getBounds(), { padding: [50, 50], duration: 1.5 });
        }
    }

    // Load Vietnam 34 Provinces GeoJSON with Cache Buster
    fetch('/assets/vietnam_34_provinces.geojson?t=' + Date.now())
        .then(res => {
            if (!res.ok) throw new Error('Không thể tải dữ liệu bản đồ: ' + res.status);
            return res.json();
        })
        .then(geoData => {
            allFeaturesData = geoData.features.sort((a, b) => (a.properties.stt_bang || 0) - (b.properties.stt_bang || 0));

            // Populate Dropdown
            if (provinceSelect) {
                provinceSelect.innerHTML = '<option value="">-- Chọn tỉnh thành (34 tỉnh) --</option>';
                allFeaturesData.forEach(f => {
                    const p = f.properties;
                    const opt = document.createElement('option');
                    opt.value = p.stt_bang;
                    const sttStr = (p.stt_bang < 10 ? '0' : '') + p.stt_bang;
                    opt.textContent = `[${sttStr}] ${p.don_vi_moi} (${p.cac_don_vi_sap_nhap})`;
                    provinceSelect.appendChild(opt);
                });

                provinceSelect.addEventListener('change', (e) => {
                    const selectedStt = parseInt(e.target.value);
                    if (!selectedStt) {
                        map.flyTo(defaultCenter, defaultZoom, { duration: 1.5 });
                        if (card) card.classList.add('hidden');
                        resetLayersStyle();
                        return;
                    }
                    const targetLayer = provinceLayersMap[selectedStt];
                    if (targetLayer) {
                        resetLayersStyle();
                        highlightProvince(targetLayer);
                        const p = targetLayer.feature.properties;
                        zoomToProvince(p, targetLayer);
                        showProvinceCard(p);
                    }
                });
            }

            // Render GeoJSON Layer (Chỉ xuất hiện ô thông tin khi di chuột tới từng khu vực)
            vietnamGeoJsonLayer = L.geoJSON(geoData, {
                style: getProvinceStyle,
                onEachFeature: (feature, layer) => {
                    const p = feature.properties;
                    provinceLayersMap[p.stt_bang] = layer;

                    // Hover Tooltip: CHỈ XUẤT HIỆN KHI RÊ CHUỘT VÀO KHU VỰC ĐÓ
                    const isGiaLai = p.don_vi_moi === 'Gia Lai';
                    const tooltipContent = `
                        <div class="hover-province-badge ${p.is_giu_nguyen ? 'badge-kept' : 'badge-merged'} ${isGiaLai ? 'badge-gialai' : ''}">
                            <div class="hover-header">
                                <span class="hover-stt">STT: ${(p.stt_bang < 10 ? '0' : '') + p.stt_bang}</span>
                                <span class="hover-tag">${p.is_giu_nguyen ? 'Giữ nguyên' : 'Sáp nhập mới'}</span>
                            </div>
                            <div class="hover-title">${p.don_vi_moi}</div>
                            <div class="hover-merger">${!p.is_giu_nguyen ? 'Hợp nhất: <strong>' + p.cac_don_vi_sap_nhap + '</strong>' : 'Đơn vị hành chính giữ nguyên'}</div>
                            <div class="hover-center">Trung tâm HC: <strong>${p.trung_tam_hanh_chinh}</strong></div>
                            <div class="hover-hint">👉 Nhấp chuột để xem chi tiết & nghe Già Làng kể tích xưa</div>
                        </div>
                    `;
                    layer.bindTooltip(tooltipContent, {
                        className: 'province-hover-tooltip',
                        sticky: true,
                        direction: 'top',
                        offset: [0, -12]
                    });

                    // Event listeners
                    layer.on({
                        mouseover: (e) => {
                            if (currentSelectedProvince && currentSelectedProvince.stt_bang === p.stt_bang) return;
                            const target = e.target;
                            target.setStyle({
                                weight: 3.5,
                                color: '#ffffff',
                                fillOpacity: 0.65
                            });
                        },
                        mouseout: (e) => {
                            if (currentSelectedProvince && currentSelectedProvince.stt_bang === p.stt_bang) return;
                            vietnamGeoJsonLayer.resetStyle(e.target);
                        },
                        click: (e) => {
                            resetLayersStyle();
                            highlightProvince(layer);
                            zoomToProvince(p, layer);
                            showProvinceCard(p);
                            if (provinceSelect) provinceSelect.value = p.stt_bang;
                        }
                    });
                }
            }).addTo(map);

            // Filter Buttons Logic
            const filterBtns = document.querySelectorAll('.map-filter-btn');
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    const filterType = btn.getAttribute('data-filter');
                    if (filterType === 'all') {
                        vietnamGeoJsonLayer.eachLayer(l => {
                            l.setStyle(getProvinceStyle(l.feature));
                        });
                        map.flyTo(defaultCenter, defaultZoom, { duration: 1.5 });
                    } else if (filterType === 'merged') {
                        vietnamGeoJsonLayer.eachLayer(l => {
                            if (!l.feature.properties.is_giu_nguyen) {
                                l.setStyle(getProvinceStyle(l.feature));
                            } else {
                                l.setStyle({ fillOpacity: 0.05, opacity: 0.2 });
                            }
                        });
                        map.flyTo(defaultCenter, defaultZoom, { duration: 1.5 });
                    } else if (filterType === 'kept') {
                        vietnamGeoJsonLayer.eachLayer(l => {
                            if (l.feature.properties.is_giu_nguyen) {
                                l.setStyle(getProvinceStyle(l.feature));
                            } else {
                                l.setStyle({ fillOpacity: 0.05, opacity: 0.2 });
                            }
                        });
                        map.flyTo(defaultCenter, defaultZoom, { duration: 1.5 });
                    } else if (filterType === 'heritage') {
                        // Focus on Gia Lai (merger of Gia Lai + Binh Dinh)
                        const giaLaiLayer = Object.values(provinceLayersMap).find(l => l.feature.properties.don_vi_moi === 'Gia Lai');
                        if (giaLaiLayer) {
                            resetLayersStyle();
                            highlightProvince(giaLaiLayer);
                            zoomToProvince(giaLaiLayer.feature.properties, giaLaiLayer);
                            showProvinceCard(giaLaiLayer.feature.properties);
                            if (provinceSelect) provinceSelect.value = giaLaiLayer.feature.properties.stt_bang;
                        }
                    }
                });
            });

            // Reset Map Button
            const resetBtn = document.getElementById('map-reset-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    map.flyTo(defaultCenter, defaultZoom, { duration: 1.5 });
                    if (card) card.classList.add('hidden');
                    if (provinceSelect) provinceSelect.value = '';
                    currentSelectedProvince = null;
                    resetLayersStyle();
                    filterBtns.forEach(b => b.classList.remove('active'));
                    const allBtn = document.querySelector('.map-filter-btn[data-filter="all"]');
                    if (allBtn) allBtn.classList.add('active');
                });
            }
        })
        .catch(err => {
            console.error('Lỗi nạp bản đồ 34 tỉnh:', err);
        });

    // ========================================================
    // SOVEREIGNTY MARKERS (QUẦN ĐẢO HOÀNG SA & TRƯỜNG SA)
    // ========================================================
    const hoangSaBadge = L.divIcon({
        className: 'island-sovereignty-badge',
        html: '<span class="flag">🇻🇳</span> <strong>Quần đảo Hoàng Sa</strong><br><small style="color:#f0c850;">(TP. Đà Nẵng)</small>',
        iconSize: [160, 36],
        iconAnchor: [80, 18]
    });
    L.marker([16.5, 112.0], { icon: hoangSaBadge }).addTo(map)
        .bindTooltip("<b>Quần đảo Hoàng Sa</b><br>Đơn vị hành chính thuộc TP. Đà Nẵng", { direction: 'top' });

    const truongSaBadge = L.divIcon({
        className: 'island-sovereignty-badge',
        html: '<span class="flag">🇻🇳</span> <strong>Quần đảo Trường Sa</strong><br><small style="color:#f0c850;">(Tỉnh Khánh Hoà)</small>',
        iconSize: [160, 36],
        iconAnchor: [80, 18]
    });
    L.marker([8.8, 112.5], { icon: truongSaBadge }).addTo(map)
        .bindTooltip("<b>Quần đảo Trường Sa</b><br>Đơn vị hành chính thuộc Tỉnh Khánh Hoà", { direction: 'top' });

    // ========================================================
    // BUON LANG HERITAGE POINTS (GIA LAI - BÌNH ĐỊNH)
    // ========================================================
    const heritageLocations = [
        { id: 'bun_song_than', name: 'Làng Bún An Thái (Bình Định - Gia Lai)', lat: 13.9, lng: 108.8, desc: 'Nơi khai sinh món Bún Song Thằn tiến vua (nay thuộc tỉnh Gia Lai sau sáp nhập).' },
        { id: 'vai_tho_cam', name: 'Làng Dệt Thổ Cẩm Pleiku', lat: 13.98, lng: 108.0, desc: 'Nơi tiếng khung cửi lách cách ngày đêm của người Ba Na, Jrai.' },
        { id: 'ruou_can', name: 'Làng Rượu Cần Men Lá', lat: 14.3, lng: 108.0, desc: 'Nơi men lá nồng say hương rừng đại ngàn Tây Nguyên.' }
    ];

    heritageLocations.forEach(loc => {
        const marker = L.marker([loc.lat, loc.lng], { icon: goldIcon }).addTo(map);
        marker.bindPopup(`
            <div style="font-family:'Inter',sans-serif; text-align:center;">
                <b style="color:var(--gold); font-size:0.95rem;">${loc.name}</b>
                <p style="font-size:0.8rem; margin:6px 0; color:#ddd;">${loc.desc}</p>
                <button onclick="triggerMapStory('${loc.id}', '${loc.name}')" style="margin-top:6px; background:var(--gold); border:none; padding:6px 14px; color:#000; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.85rem;">Nghe Chuyện</button>
            </div>
        `);
    });

    ScrollTrigger.create({ 
        trigger: '#map-realm', 
        start: 'top 50%', 
        onEnter: () => { currentContext = "Bản Đồ Di Sản 34 Tỉnh Thành"; triggerContextualGreeting(); }, 
        onEnterBack: () => { currentContext = "Bản Đồ Di Sản 34 Tỉnh Thành"; } 
    });
}

window.triggerMapStory = function(id, name, mergers, center) {
    if (typeof spiritRealm !== 'undefined' && spiritRealm.classList.contains('hidden')) {
        toggleSpiritRealm();
    }
    
    let prompt = `[SỰ KIỆN TƯƠNG TÁC BẢN ĐỒ]: Khách vừa chọn vùng đất ${name} trên bản đồ Việt Nam mới. `;
    if (mergers && mergers !== 'Giữ nguyên') {
        prompt += `Tỉnh này được hợp nhất từ ${mergers}, với trung tâm chính trị - hành chính đặt tại ${center}. `;
    }
    if (name.includes('Gia Lai')) {
        prompt += `Đây chính là tỉnh Gia Lai mới sau khi sáp nhập cùng Bình Định (trung tâm tại Bình Định)! Nơi vừa có đại ngàn Tây Nguyên (cồng chiêng, rượu cần) vừa có xứ Nẫu Bình Định - cái nôi của món Bún Song Thằn An Thái tiến vua ngàn năm nức tiếng! Già hãy hào hứng kể chuyện và nhắc khách trải nghiệm ngay Bún Song Thằn nhé!`;
    } else {
        prompt += `Già hãy kể một câu chuyện thần thoại hoặc giai thoại văn hóa - ẩm thực thật lôi cuốn, mặn mòi, dí dỏm về vùng đất này và nhắc họ hãy trải nghiệm thử sản vật của buôn làng.`;
    }

    if (typeof spiritChatHistory !== 'undefined') {
        spiritChatHistory.push({ role: 'user', content: prompt });
    }
    if (typeof callSpiritAI === 'function') {
        callSpiritAI(prompt);
    }
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

// ========================================================
// AMBIENT SOUND MIXER CONTROLLER
// ========================================================
const soundMixerBtn = document.getElementById('sound-mixer-btn');
const soundPanel = document.getElementById('sound-panel');
const closeSoundPanelBtn = document.getElementById('close-sound-panel');
const soundPanelOverlay = document.getElementById('sound-panel-overlay');
const soundMasterToggle = document.getElementById('sound-master-toggle');
const soundMasterIcon = document.getElementById('sound-master-icon');
const soundMasterText = document.getElementById('sound-master-text');

const soundTracks = {
    'cong-chieng': {
        audio: document.getElementById('ambient-cong-chieng'),
        slider: document.getElementById('slider-cong-chieng'),
        label: document.getElementById('vol-label-cong-chieng'),
        muteBtn: document.getElementById('mute-cong-chieng'),
        defaultVol: 40,
        lastVol: 40,
        isMuted: false
    },
    'tieng-suoi': {
        audio: document.getElementById('ambient-tieng-suoi'),
        slider: document.getElementById('slider-tieng-suoi'),
        label: document.getElementById('vol-label-tieng-suoi'),
        muteBtn: document.getElementById('mute-tieng-suoi'),
        defaultVol: 50,
        lastVol: 50,
        isMuted: false
    },
    'tieng-chim': {
        audio: document.getElementById('ambient-tieng-chim'),
        slider: document.getElementById('slider-tieng-chim'),
        label: document.getElementById('vol-label-tieng-chim'),
        muteBtn: document.getElementById('mute-tieng-chim'),
        defaultVol: 45,
        lastVol: 45,
        isMuted: false
    },
    'tieng-lua': {
        audio: document.getElementById('ambient-tieng-lua'),
        slider: document.getElementById('slider-tieng-lua'),
        label: document.getElementById('vol-label-tieng-lua'),
        muteBtn: document.getElementById('mute-tieng-lua'),
        defaultVol: 60,
        lastVol: 60,
        isMuted: false
    }
};

let isMasterPlaying = false;

function toggleSoundPanel() {
    if (!soundPanel) return;
    const isOpen = soundPanel.classList.contains('open');
    if (isOpen) {
        soundPanel.classList.remove('open');
        if (soundPanelOverlay) soundPanelOverlay.classList.remove('open');
    } else {
        soundPanel.classList.add('open');
        if (soundPanelOverlay) soundPanelOverlay.classList.add('open');
    }
}

if (soundMixerBtn) soundMixerBtn.addEventListener('click', toggleSoundPanel);
if (closeSoundPanelBtn) closeSoundPanelBtn.addEventListener('click', toggleSoundPanel);
if (soundPanelOverlay) soundPanelOverlay.addEventListener('click', toggleSoundPanel);

function startAllSounds() {
    isMasterPlaying = true;
    Object.keys(soundTracks).forEach(key => {
        const item = soundTracks[key];
        if (item.audio && !item.isMuted) {
            const vol = parseInt(item.slider.value, 10) / 100;
            item.audio.volume = vol;
            item.audio.play().catch(e => console.log("Audio play error:", key, e));
        }
    });
    updateMasterUI();
}

function stopAllSounds() {
    isMasterPlaying = false;
    Object.keys(soundTracks).forEach(key => {
        const item = soundTracks[key];
        if (item.audio) {
            item.audio.pause();
        }
    });
    updateMasterUI();
}

function toggleMasterSounds() {
    if (isMasterPlaying) {
        stopAllSounds();
    } else {
        startAllSounds();
    }
}

if (soundMasterToggle) {
    soundMasterToggle.addEventListener('click', toggleMasterSounds);
}

function updateMasterUI() {
    if (!soundMasterToggle) return;
    if (isMasterPlaying) {
        soundMasterToggle.classList.add('active');
        if (soundMasterIcon) soundMasterIcon.textContent = '⏸️';
        if (soundMasterText) soundMasterText.textContent = 'Tạm Dừng Tất Cả';
        if (soundMixerBtn) soundMixerBtn.classList.add('playing');
    } else {
        soundMasterToggle.classList.remove('active');
        if (soundMasterIcon) soundMasterIcon.textContent = '🔊';
        if (soundMasterText) soundMasterText.textContent = 'Bật Toàn Bộ Âm Thanh';
        if (soundMixerBtn) soundMixerBtn.classList.remove('playing');
    }
}

// Setup slider and mute button events for each track
Object.keys(soundTracks).forEach(key => {
    const item = soundTracks[key];
    if (item.slider) {
        const initialVol = parseInt(item.slider.value, 10);
        if (item.label) item.label.textContent = initialVol + '%';
        if (item.audio) item.audio.volume = initialVol / 100;

        item.slider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            if (item.label) item.label.textContent = val + '%';
            if (item.audio) {
                item.audio.volume = val / 100;
                if (val > 0) {
                    item.isMuted = false;
                    if (item.muteBtn) {
                        item.muteBtn.textContent = '🔊';
                        item.muteBtn.classList.remove('muted');
                    }
                    if (isMasterPlaying && item.audio.paused) {
                        item.audio.play().catch(err => console.log(err));
                    }
                } else {
                    item.isMuted = true;
                    if (item.muteBtn) {
                        item.muteBtn.textContent = '🔇';
                        item.muteBtn.classList.add('muted');
                    }
                }
            }
        });
    }

    if (item.muteBtn) {
        item.muteBtn.addEventListener('click', () => {
            if (item.isMuted) {
                item.isMuted = false;
                const restoreVal = item.lastVol > 0 ? item.lastVol : 40;
                if (item.slider) item.slider.value = restoreVal;
                if (item.label) item.label.textContent = restoreVal + '%';
                if (item.audio) {
                    item.audio.volume = restoreVal / 100;
                    if (isMasterPlaying) item.audio.play().catch(e => console.log(e));
                }
                item.muteBtn.textContent = '🔊';
                item.muteBtn.classList.remove('muted');
            } else {
                item.lastVol = parseInt(item.slider.value, 10) || 40;
                item.isMuted = true;
                if (item.slider) item.slider.value = 0;
                if (item.label) item.label.textContent = '0%';
                if (item.audio) {
                    item.audio.volume = 0;
                }
                item.muteBtn.textContent = '🔇';
                item.muteBtn.classList.add('muted');
            }
        });
    }
});
