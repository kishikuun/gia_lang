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
// SPIRIT ORB & REALM LOGIC (Copilot-Style Chatbox)
// ============================================
const spiritOrb = document.getElementById('spirit-orb');
const spiritRealm = document.getElementById('spirit-realm-overlay');
const closeSpiritRealm = document.getElementById('close-spirit-realm');
const spiritInput = document.getElementById('spirit-input');
const spiritSendBtn = document.getElementById('spirit-send-btn');
const spiritTooltip = document.getElementById('spirit-tooltip');
const spiritChatMessages = document.getElementById('spirit-chat-messages');
const spiritTypingIndicator = document.getElementById('spirit-typing-indicator');
const spiritChatBackdrop = document.getElementById('spirit-chat-backdrop');
const spiritClearChat = document.getElementById('spirit-clear-chat');

let spiritChatHistory = [];
let isSpiritThinking = false;

// --- GLITCH DECODE ENGINE ---
const GLITCH_CHARS = '₫ᵬꝉ₢ₓ₦ₔ₡₱₲₰₸₽₹⁂⁕⁜⁑⁃⁐⁓∀∂∃∅∆∇∈∉∋∎∏∑∗∘∙√∝∞∠∡∢∧∨∩∪∫∬∭∮∯∰∱∲∳≈≠≡≤≥⊂⊃⊄⊆⊇⊕⊗⊘⊙⊚⊛⊜⊝⊞⊟⊠⊡⊢⊣⊤⊥⊦⊧';

function getRandomGlitchChar() {
    return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
}

function generateScrambledText(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += getRandomGlitchChar();
    }
    return result;
}

/**
 * Glitch Decode Animation
 * 1. Shows fully scrambled text (same length as final answer)
 * 2. One by one, each character "decodes" from scrambled -> real character
 * 3. Each character flickers through several random chars before settling
 */
function glitchDecodeText(bubbleEl, finalText, onComplete) {
    const textLength = finalText.length;
    let currentChars = [];
    
    // Initialize all characters as scrambled
    for (let i = 0; i < textLength; i++) {
        currentChars.push({
            final: finalText[i],
            current: finalText[i] === ' ' ? ' ' : getRandomGlitchChar(),
            decoded: finalText[i] === ' ' || finalText[i] === '\n'
        });
    }
    
    // Render initial scrambled state
    renderGlitchState(bubbleEl, currentChars);
    
    // Start decoding character by character
    let decodeIndex = 0;
    const decodeSpeed = Math.max(15, Math.min(40, 2000 / textLength)); // Adaptive speed
    
    function decodeNext() {
        if (decodeIndex >= textLength) {
            // All decoded - render final clean text
            const textContent = bubbleEl.querySelector('.spirit-glitch-text');
            if (textContent) {
                textContent.textContent = finalText;
                textContent.classList.remove('glitching');
                textContent.classList.add('decoded-complete');
            }
            if (onComplete) onComplete();
            return;
        }
        
        // Skip spaces and newlines
        if (currentChars[decodeIndex].decoded) {
            decodeIndex++;
            decodeNext();
            return;
        }
        
        // Flicker effect: cycle through 3-5 random chars before settling
        let flickerCount = 0;
        const maxFlickers = 3 + Math.floor(Math.random() * 3);
        const currentIdx = decodeIndex;
        
        const flickerInterval = setInterval(() => {
            flickerCount++;
            if (flickerCount < maxFlickers) {
                currentChars[currentIdx].current = getRandomGlitchChar();
                renderGlitchState(bubbleEl, currentChars);
            } else {
                clearInterval(flickerInterval);
                currentChars[currentIdx].current = currentChars[currentIdx].final;
                currentChars[currentIdx].decoded = true;
                renderGlitchState(bubbleEl, currentChars);
            }
        }, 25);
        
        decodeIndex++;
        setTimeout(decodeNext, decodeSpeed);
    }
    
    // Small delay before starting decode
    setTimeout(decodeNext, 400);
}

function renderGlitchState(bubbleEl, chars) {
    const textEl = bubbleEl.querySelector('.spirit-glitch-text');
    if (!textEl) return;
    
    let html = '';
    for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        if (ch.final === ' ') {
            html += ' ';
        } else if (ch.final === '\n') {
            html += '<br>';
        } else if (ch.decoded) {
            html += `<span class="spirit-glitch-char decoded">${ch.current}</span>`;
        } else {
            html += `<span class="spirit-glitch-char scrambled">${ch.current}</span>`;
        }
    }
    textEl.innerHTML = html;
}

// --- CHAT UI FUNCTIONS ---
function getTimeString() {
    const now = new Date();
    return now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function appendMessage(role, content, useGlitch = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `spirit-msg spirit-msg-${role}`;
    
    const timeStr = getTimeString();
    
    if (role === 'ai') {
        msgDiv.innerHTML = `
            <div class="spirit-avatar-small">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
                    <circle cx="12" cy="12" r="2" />
                </svg>
            </div>
            <div class="spirit-msg-bubble">
                <div class="spirit-glitch-text${useGlitch ? ' glitching' : ''}">${useGlitch ? '' : content}</div>
                <span class="msg-time">${timeStr}</span>
            </div>
        `;
    } else {
        msgDiv.innerHTML = `
            <div class="spirit-msg-bubble">
                <div>${content}</div>
                <span class="msg-time">${timeStr}</span>
            </div>
        `;
    }
    
    spiritChatMessages.appendChild(msgDiv);
    scrollChatToBottom();
    return msgDiv;
}

function scrollChatToBottom() {
    requestAnimationFrame(() => {
        spiritChatMessages.scrollTop = spiritChatMessages.scrollHeight;
    });
}

function showTypingIndicator() {
    if (spiritTypingIndicator) {
        spiritTypingIndicator.classList.remove('hidden');
        scrollChatToBottom();
    }
}

function hideTypingIndicator() {
    if (spiritTypingIndicator) {
        spiritTypingIndicator.classList.add('hidden');
    }
}

// --- TOGGLE CHAT PANEL ---
function toggleSpiritRealm() {
    if (!spiritRealm) return;
    const isHidden = spiritRealm.classList.contains('hidden');
    if (isHidden) {
        if (magicAudio) {
            magicAudio.currentTime = 0;
            magicAudio.play().catch(e => console.log(e));
        }
        spiritRealm.classList.remove('hidden');
        if (spiritTooltip) spiritTooltip.classList.remove('show');
        
        // Focus input
        setTimeout(() => {
            if (spiritInput) spiritInput.focus();
        }, 400);
        
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
if (spiritChatBackdrop) spiritChatBackdrop.addEventListener('click', toggleSpiritRealm);

// --- CLEAR CHAT ---
if (spiritClearChat) {
    spiritClearChat.addEventListener('click', () => {
        spiritChatHistory = [];
        // Remove all messages except the date divider
        const messages = spiritChatMessages.querySelectorAll('.spirit-msg');
        messages.forEach(m => m.remove());
    });
}

// --- TEXTAREA AUTO-RESIZE & SEND BUTTON STATE ---
if (spiritInput) {
    spiritInput.addEventListener('input', () => {
        // Auto-resize
        spiritInput.style.height = 'auto';
        spiritInput.style.height = Math.min(spiritInput.scrollHeight, 120) + 'px';
        
        // Toggle send button state
        if (spiritSendBtn) {
            spiritSendBtn.disabled = !spiritInput.value.trim();
        }
    });
}

// --- SPIRIT AI CALL (with Glitch Decode) ---
async function callSpiritAI(systemPromptOverride = null) {
    isSpiritThinking = true;
    showTypingIndicator();
    
    if (spiritSendBtn) spiritSendBtn.disabled = true;

    try {
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
        hideTypingIndicator();
        
        if (res.ok) {
            const aiResponse = data.response;
            const actions = data.actions || [];
            
            spiritChatHistory.push({ role: 'model', content: aiResponse });
            
            // Show tooltip if chat panel is closed
            if (spiritRealm && spiritRealm.classList.contains('hidden') && spiritTooltip) {
                spiritTooltip.textContent = aiResponse;
                spiritTooltip.classList.add('show');
                setTimeout(() => spiritTooltip.classList.remove('show'), 8000);
            }
            
            // Add AI message with glitch decode animation
            const msgEl = appendMessage('ai', '', true);
            const bubbleEl = msgEl.querySelector('.spirit-msg-bubble');
            
            glitchDecodeText(bubbleEl, aiResponse, () => {
                if (actions && actions.length > 0) processActions(actions);
                scrollChatToBottom();
            });
        } else {
            appendMessage('ai', 'Hồn thiêng chưa kịp hồi đáp. Hãy thử lại.');
        }
    } catch (err) {
        hideTypingIndicator();
        appendMessage('ai', 'Lỗi kết nối tới bản làng thiêng.');
    } finally {
        isSpiritThinking = false;
        if (spiritSendBtn && spiritInput) {
            spiritSendBtn.disabled = !spiritInput.value.trim();
        }
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
            // Chèn vào campfire với hiệu ứng glitch decode mượt mà
            if (typeof appendCampfireMsg === 'function') {
                const msgEl = appendCampfireMsg('ai', '', true);
                if (msgEl) {
                    const bubbleEl = msgEl.querySelector('.campfire-msg-bubble');
                    glitchDecodeText(bubbleEl, data.response, () => {
                        if (campfireHistory) campfireHistory.scrollTop = campfireHistory.scrollHeight;
                    });
                }
            }
        }
    } catch (err) {
        console.error("Lỗi gọi greeting", err);
    }
}

// --- SEND MESSAGE ---
if (spiritSendBtn && spiritInput) {
    spiritSendBtn.addEventListener('click', handleSpiritMessage);
    spiritInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSpiritMessage();
        }
    });
}

async function handleSpiritMessage() {
    const text = spiritInput.value.trim();
    if (!text || isSpiritThinking) return;
    
    // Reset textarea
    spiritInput.value = '';
    spiritInput.style.height = 'auto';
    if (spiritSendBtn) spiritSendBtn.disabled = true;
    
    // Add user message bubble
    appendMessage('user', text);
    
    spiritChatHistory.push({ role: "user", content: text });
    await callSpiritAI();
}


// ========================================================
// CAMPFIRE CHAT LOGIC (Đêm Hội Lửa Trại - Glitch Decode)
// ========================================================
const campfireInput = document.getElementById('campfire-input');
const campfireSendBtn = document.getElementById('campfire-send-btn');
const campfireHistory = document.getElementById('campfire-history');
const campfireTypingIndicator = document.getElementById('campfire-typing-indicator');
const campfireClearBtn = document.getElementById('campfire-clear-btn');

function appendCampfireMsg(role, content, useGlitch = false) {
    if (!campfireHistory) return null;
    const msgDiv = document.createElement('div');
    msgDiv.className = `campfire-msg campfire-msg-${role}`;
    const timeStr = getTimeString();

    if (role === 'ai') {
        msgDiv.innerHTML = `
            <div class="campfire-avatar-small" title="Già Làng">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="18" height="18">
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
                    <circle cx="12" cy="12" r="2.5" />
                    <path d="M12 8v1M12 15v1M8 12h1M15 12h1" stroke-linecap="round" />
                </svg>
            </div>
            <div class="campfire-msg-bubble">
                <div class="campfire-msg-header">
                    <span class="campfire-msg-sender">Già Làng</span>
                </div>
                <div class="spirit-glitch-text${useGlitch ? ' glitching' : ''}">${useGlitch ? '' : content}</div>
                <span class="msg-time">${timeStr}</span>
            </div>
        `;
    } else {
        msgDiv.innerHTML = `
            <div class="campfire-msg-bubble">
                <div class="campfire-msg-text">${content}</div>
                <span class="msg-time">${timeStr}</span>
            </div>
        `;
    }

    campfireHistory.appendChild(msgDiv);
    campfireHistory.scrollTop = campfireHistory.scrollHeight;
    return msgDiv;
}

function showCampfireTyping() {
    if (campfireTypingIndicator) {
        campfireTypingIndicator.classList.remove('hidden');
        if (campfireHistory) campfireHistory.scrollTop = campfireHistory.scrollHeight;
    }
}

function hideCampfireTyping() {
    if (campfireTypingIndicator) {
        campfireTypingIndicator.classList.add('hidden');
    }
}

async function handleCampfireMessage() {
    if (!campfireInput) return;
    const text = campfireInput.value.trim();
    if (!text || isSpiritThinking) return;
    
    isSpiritThinking = true;
    appendCampfireMsg('user', text);
    campfireInput.value = '';
    if (campfireSendBtn) campfireSendBtn.disabled = true;
    
    // Đồng bộ vào mảng chat của Spirit
    spiritChatHistory.push({ role: "user", content: text });
    showCampfireTyping();

    try {
        const res = await fetch('/api/interact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_message: `[Bên bếp lửa trại] ${text}`,
                chat_history: spiritChatHistory.slice(0, -1),
                context_product: null
            })
        });
        
        const data = await res.json();
        hideCampfireTyping();
        
        if (res.ok) {
            const aiResponse = data.response;
            const actions = data.actions || [];
            spiritChatHistory.push({ role: 'model', content: aiResponse });
            
            // Glitch Decode Animation for Campfire
            const msgEl = appendCampfireMsg('ai', '', true);
            if (msgEl) {
                const bubbleEl = msgEl.querySelector('.campfire-msg-bubble');
                glitchDecodeText(bubbleEl, aiResponse, () => {
                    if (actions && actions.length > 0) processActions(actions);
                    if (campfireHistory) campfireHistory.scrollTop = campfireHistory.scrollHeight;
                });
            }
        } else {
            appendCampfireMsg('ai', 'Già thoáng mệt, chưa nghe rõ cháu nói. Cháu nói lại với Già nhé!');
        }
    } catch (err) {
        hideCampfireTyping();
        appendCampfireMsg('ai', 'Gió núi thổi tắt lửa, kết nối gián đoạn rồi cháu ạ.');
    } finally {
        isSpiritThinking = false;
        if (campfireSendBtn) campfireSendBtn.disabled = false;
        if (campfireInput) campfireInput.focus();
    }
}

// Bind Campfire Input Events
if (campfireSendBtn) campfireSendBtn.addEventListener('click', handleCampfireMessage);
if (campfireInput) {
    campfireInput.addEventListener('keydown', (e) => { 
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCampfireMessage();
        }
    });
}

// Bind Campfire Prompt Chips
document.querySelectorAll('.campfire-section .prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt') || chip.textContent.trim();
        if (campfireInput) {
            campfireInput.value = prompt;
            handleCampfireMessage();
        }
    });
});

// Bind Clear / Reset Chat
if (campfireClearBtn) {
    campfireClearBtn.addEventListener('click', () => {
        if (campfireHistory) {
            campfireHistory.innerHTML = '';
            spiritChatHistory = [];
            const greeting = "Khà khà, cháu đã ngồi lại bên bếp lửa rồi đấy ư! Uống với Già ngụm trà nóng rồi kể Già nghe có tâm sự chi nào?";
            const msgEl = appendCampfireMsg('ai', '', true);
            if (msgEl) {
                const bubbleEl = msgEl.querySelector('.campfire-msg-bubble');
                glitchDecodeText(bubbleEl, greeting, () => {
                    if (campfireHistory) campfireHistory.scrollTop = campfireHistory.scrollHeight;
                });
            }
        }
    });
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
            appendMessage('ai', `🛒 Đã thêm ${quantity} phần ${mockName}`);
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

// ============================================
// PRODUCT PURCHASE MODAL SYSTEM (GIAO DIỆN MUA HÀNG CHI TIẾT)
// ============================================
const PRODUCTS_DB = {
    vai_tho_cam: {
        id: 'vai_tho_cam',
        shortName: 'Vải Thổ Cẩm',
        name: 'Vải Thổ Cẩm Dệt Tay Tây Nguyên - Hoa Văn Cổ Truyền Nghệ Nhân Gia Rai',
        badge: '✦ Tinh Hoa Buôn Làng',
        rating: '4.9',
        reviewCount: '7,5k',
        soldCount: '1,2k',
        originalPrice: 420000,
        discountText: '-17% GIẢM',
        vouchers: ['Giảm 25.000₫', 'Giảm 50.000₫', 'Mã Làng Giảm 10%'],
        shipping: 'Vận chuyển toàn quốc (Giao nhanh 2 - 4 ngày)',
        shippingSub: 'Miễn phí vận chuyển cho đơn hàng từ 500.000₫',
        guarantee: 'Già Làng Bảo Chứng • 100% Thủ công bản địa • Đổi trả miễn phí 7 ngày',
        variationLabel: 'Họa Tiết:',
        stock: 38,
        mainImage: '/assets/images/vai_tho_cam.jpg',
        gallery: [
            '/assets/images/vai_tho_cam.jpg',
            '/assets/images/vai_tho_cam_tui_balo.jpg',
            '/assets/images/vai_tho_cam_hoa_van_ede.jpg',
            '/assets/images/vai_tho_cam_cho_phien.jpg',
            '/assets/images/vai_tho_cam_trang_phuc.jpg'
        ],
        variations: [
            { id: 'vtc_1', name: 'C01 Thổ Cẩm Đa Sắc Bản Làng', price: 350000, img: '/assets/images/vai_tho_cam.jpg' },
            { id: 'vtc_2', name: 'C02 Túi & Balo Họa Tiết Quả Trám', price: 380000, img: '/assets/images/vai_tho_cam_tui_balo.jpg' },
            { id: 'vtc_3', name: 'C03 Họa Tiết Sọc Dải Ê Đê', price: 350000, img: '/assets/images/vai_tho_cam_hoa_van_ede.jpg' },
            { id: 'vtc_4', name: 'C04 Khăn Choàng Chợ Phiên Truyền Thống', price: 365000, img: '/assets/images/vai_tho_cam_cho_phien.jpg' },
            { id: 'vtc_5', name: 'C05 Áo & Khăn Thắt Lưng Lễ Hội', price: 290000, img: '/assets/images/vai_tho_cam_trang_phuc.jpg' },
            { id: 'vtc_6', name: 'C06 Tấm Đắp Đại Ngàn Thượng Hạng', price: 480000, img: '/assets/images/vai_tho_cam.jpg' }
        ]
    },
    ruou_can: {
        id: 'ruou_can',
        shortName: 'Rượu Cần Men Lá',
        name: 'Rượu Cần Men Lá Rừng Tây Nguyên - Ủ Chum Gốm Đất Nung Thượng Hạng',
        badge: '✦ Men Rừng Say Nồng',
        rating: '5.0',
        reviewCount: '6,2k',
        soldCount: '2,8k',
        originalPrice: 330000,
        discountText: '-15% GIẢM',
        vouchers: ['Giảm 20.000₫', 'Tặng 2 Cần Hút Trúc', 'Freeship Đơn 500k'],
        shipping: 'Đóng kiện bọc gỗ chống vỡ 100% (Giao nhanh 2 - 3 ngày)',
        shippingSub: 'Miễn phí vận chuyển cho đơn hàng từ 500.000₫',
        guarantee: 'Men cây rừng thảo dược 100% • Không đau đầu • Đổi mới ngay nếu vỡ',
        variationLabel: 'Dung Tích Chum:',
        stock: 45,
        mainImage: '/assets/images/ruou_can.jpg',
        gallery: [
            '/assets/images/ruou_can.jpg',
            '/assets/images/ruou_can_uong_hoi.jpg',
            '/assets/images/ruou_can_che_tay_nguyen.jpg',
            '/assets/images/ruou_can_nha_dai_ede.jpg',
            '/assets/images/ruou_can_che_co.jpg'
        ],
        variations: [
            { id: 'rc_1', name: 'Chum Gốm 2 Lít (Kèm 2 cần trúc)', price: 280000, img: '/assets/images/ruou_can.jpg' },
            { id: 'rc_2', name: 'Ché Rượu Đất Nung 4 Lít (Ủ men lá)', price: 380000, img: '/assets/images/ruou_can_che_tay_nguyen.jpg' },
            { id: 'rc_3', name: 'Chum Rượu Lễ Hội Buôn Làng 6 Lít', price: 490000, img: '/assets/images/ruou_can_uong_hoi.jpg' },
            { id: 'rc_4', name: 'Ché Cổ Truyền Thống 8 Lít (VIP)', price: 580000, img: '/assets/images/ruou_can_nha_dai_ede.jpg' }
        ]
    },
    gui_dan: {
        id: 'gui_dan',
        shortName: 'Gùi Đan Mây Tre',
        name: 'Gùi Đan Mây Tre Rừng Tự Nhiên - Nghệ Thuật Đan Lát Thủ Công Gia Rai',
        badge: '✦ Kiệt Tác Đan Lát',
        rating: '4.8',
        reviewCount: '3,8k',
        soldCount: '950',
        originalPrice: 150000,
        discountText: '-20% GIẢM',
        vouchers: ['Giảm 15.000₫', 'Giảm 30.000₫', 'Mã Làng Giảm 10%'],
        shipping: 'Bọc mút xốp chống móp gãy (Giao nhanh 2 - 4 ngày)',
        shippingSub: 'Miễn phí vận chuyển cho đơn hàng từ 500.000₫',
        guarantee: 'Tre mây ngâm sấy tự nhiên chống mọt • Bảo hành đan kết 12 tháng',
        variationLabel: 'Kích Cỡ Gùi:',
        stock: 19,
        mainImage: '/assets/images/gui_dan.jpg',
        gallery: [
            '/assets/images/gui_dan.jpg',
            '/assets/images/gui_dan_may_tre_quai.jpg',
            '/assets/images/gui_dan_xong_khoi.jpg',
            '/assets/images/gui_dan_can_canh_nan.jpg',
            '/assets/images/gui_dan_bao_tang_daklak.jpg'
        ],
        variations: [
            { id: 'gd_1', name: 'Cỡ Nhỏ 25cm (Trang trí / Đựng đồ)', price: 120000, img: '/assets/images/gui_dan.jpg' },
            { id: 'gd_2', name: 'Cỡ Vừa 40cm (Đeo vai/dã ngoại)', price: 190000, img: '/assets/images/gui_dan_may_tre_quai.jpg' },
            { id: 'gd_3', name: 'Cỡ Đại 55cm Gác Bếp Hun Khói', price: 260000, img: '/assets/images/gui_dan_xong_khoi.jpg' },
            { id: 'gd_4', name: 'Bản Đan Mắt Cáo Thủ Công Tinh Xảo', price: 290000, img: '/assets/images/gui_dan_can_canh_nan.jpg' }
        ]
    },
    bun_song_than: {
        id: 'bun_song_than',
        shortName: 'Bún Song Thằn',
        name: 'Bún Song Thằn An Thái - Tinh Hoa 100% Đậu Xanh Nguyên Chất Tiến Vua',
        badge: '👑 Đặc Sản Tiến Vua',
        rating: '5.0',
        reviewCount: '12,4k',
        soldCount: '5,6k',
        originalPrice: 180000,
        discountText: '-17% GIẢM',
        vouchers: ['Giảm 20.000₫', 'Giảm 50.000₫', 'Tặng Cẩm Nang Nấu'],
        shipping: 'Hộp cứng cao cấp bảo vệ sợi bún (Giao nhanh 2 - 3 ngày)',
        shippingSub: 'Miễn phí vận chuyển cho đơn hàng từ 500.000₫',
        guarantee: '100% Hạt đậu xanh hảo hạng • Giòn dai không hóa chất • Hoàn tiền nếu pha bột',
        variationLabel: 'Quy Cách Đóng Gói:',
        stock: 52,
        mainImage: '/assets/images/bun_song_than.jpg',
        gallery: [
            '/assets/images/bun_song_than.jpg',
            '/assets/images/bun_song_than_hop_450g.jpg',
            '/assets/images/bun_song_than_dac_san.jpg',
            '/assets/images/bun_song_than_soi_dau_xanh.jpg',
            '/assets/images/bun_song_than_dong_goi.jpg'
        ],
        variations: [
            { id: 'bst_1', name: 'Hộp 450g Chuẩn OCOP An Thái (2 Vắt)', price: 150000, img: '/assets/images/bun_song_than_hop_450g.jpg' },
            { id: 'bst_2', name: 'Set Quà Biếu Đặc Sản Bình Định 1kg', price: 280000, img: '/assets/images/bun_song_than_dac_san.jpg' },
            { id: 'bst_3', name: 'Khay Mẹt Bún Đậu Xanh Thượng Hạng', price: 450000, img: '/assets/images/bun_song_than_soi_dau_xanh.jpg' }
        ]
    }
};

let currentModalProduct = null;
let currentModalVariation = null;
let modalQuantity = 1;
let isModalLiked = false;

window.openProductModal = function(productId) {
    const product = PRODUCTS_DB[productId] || PRODUCTS_DB['vai_tho_cam'];
    currentModalProduct = product;
    modalQuantity = 1;
    isModalLiked = false;

    const modalEl = document.getElementById('product-purchase-modal');
    if (!modalEl) return;

    // Badge & Title
    const badgeEl = document.getElementById('modal-heritage-badge');
    if (badgeEl) badgeEl.textContent = product.badge;
    const titleEl = document.getElementById('modal-product-title');
    if (titleEl) titleEl.textContent = product.name;

    // Ratings & stats
    const ratingScoreEl = document.getElementById('modal-rating-score');
    if (ratingScoreEl) ratingScoreEl.textContent = product.rating;
    const reviewCountEl = document.getElementById('modal-review-count');
    if (reviewCountEl) reviewCountEl.textContent = product.reviewCount;
    const soldCountEl = document.getElementById('modal-sold-count');
    if (soldCountEl) soldCountEl.textContent = product.soldCount;

    // Main Image
    const mainImgEl = document.getElementById('modal-main-img');
    if (mainImgEl) {
        mainImgEl.src = product.mainImage;
        mainImgEl.alt = product.name;
    }

    // Thumbnails
    const thumbListEl = document.getElementById('modal-thumb-list');
    if (thumbListEl) {
        thumbListEl.innerHTML = '';
        product.gallery.forEach((imgUrl, idx) => {
            const thumbDiv = document.createElement('div');
            thumbDiv.className = `thumb-item ${idx === 0 ? 'active' : ''}`;
            thumbDiv.innerHTML = `<img src="${imgUrl}" alt="${product.shortName} thumb ${idx+1}" onerror="this.src='${product.mainImage}'">`;
            thumbDiv.addEventListener('mouseenter', () => selectModalThumb(imgUrl, thumbDiv));
            thumbDiv.addEventListener('click', () => selectModalThumb(imgUrl, thumbDiv));
            thumbListEl.appendChild(thumbDiv);
        });
    }

    // Vouchers
    const voucherListEl = document.getElementById('modal-voucher-list');
    if (voucherListEl) {
        voucherListEl.innerHTML = '';
        product.vouchers.forEach((v, idx) => {
            const vSpan = document.createElement('span');
            vSpan.className = `voucher-ticket ${idx === product.vouchers.length - 1 ? 'highlight' : ''}`;
            vSpan.innerHTML = `<span class="v-cutout"></span><span class="v-text">${v}</span>`;
            vSpan.title = 'Nhấn để lưu ưu đãi này';
            vSpan.onclick = () => {
                vSpan.classList.add('applied');
                showProductToast(`✨ Đã áp dụng ưu đãi: ${v}`);
            };
            voucherListEl.appendChild(vSpan);
        });
    }

    // Shipping & Guarantee dynamic content
    const shipEl = document.getElementById('modal-shipping-text');
    if (shipEl && product.shipping) shipEl.textContent = product.shipping;
    const shipSubEl = document.getElementById('modal-shipping-sub');
    if (shipSubEl && product.shippingSub) shipSubEl.textContent = product.shippingSub;
    const guarEl = document.getElementById('modal-guarantee-text');
    if (guarEl && product.guarantee) guarEl.textContent = product.guarantee;

    // Variation label
    const varLabelEl = document.getElementById('modal-variation-label');
    if (varLabelEl) varLabelEl.textContent = product.variationLabel || 'Phân Loại:';

    // Variations
    const varContainerEl = document.getElementById('modal-variations-container');
    const selNameEl = document.getElementById('modal-selected-var-name');
    if (varContainerEl) {
        varContainerEl.innerHTML = '';
        product.variations.forEach((v, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `var-card-btn ${idx === 0 ? 'selected' : ''}`;
            btn.innerHTML = `
                <div class="var-card-thumb-wrap">
                    <img src="${v.img}" class="var-card-thumb" alt="${v.name}" onerror="this.src='${product.mainImage}'">
                </div>
                <div class="var-card-content">
                    <span class="var-card-name">${v.name}</span>
                    <span class="var-card-price">${v.price.toLocaleString()}₫</span>
                </div>
                <span class="var-check-badge">✓</span>
            `;
            btn.onclick = () => selectModalVariation(v, btn);
            varContainerEl.appendChild(btn);
            if (idx === 0) {
                currentModalVariation = v;
                if (selNameEl) selNameEl.textContent = v.name;
            }
        });
    }

    // Quantity & Stock
    const qtyInput = document.getElementById('modal-qty-input');
    if (qtyInput) qtyInput.value = '1';
    const stockEl = document.getElementById('modal-stock-text');
    if (stockEl) stockEl.textContent = `còn ${product.stock} sản phẩm sẵn có`;

    // Price
    updateModalPriceDisplay();

    // Reset like button
    const likeBtn = document.getElementById('modal-like-btn');
    if (likeBtn) likeBtn.classList.remove('liked');

    // Reset scroll of modal container to top
    const modalContainer = modalEl.querySelector('.product-modal-container');
    if (modalContainer) {
        modalContainer.scrollTop = 0;
        modalContainer.scrollLeft = 0;
    }

    // Open modal & pause lenis
    modalEl.classList.add('active');
    modalEl.setAttribute('aria-hidden', 'false');
    if (typeof lenis !== 'undefined' && lenis && lenis.stop) {
        lenis.stop();
    }
};

window.closeProductModal = function() {
    const modalEl = document.getElementById('product-purchase-modal');
    if (!modalEl) return;
    modalEl.classList.remove('active');
    modalEl.setAttribute('aria-hidden', 'true');
    if (typeof lenis !== 'undefined' && lenis && lenis.start) {
        lenis.start();
    }
};

function selectModalThumb(imgUrl, thumbElement) {
    const mainImgEl = document.getElementById('modal-main-img');
    if (mainImgEl) {
        mainImgEl.style.opacity = '0.4';
        mainImgEl.style.transform = 'scale(0.98)';
        setTimeout(() => {
            mainImgEl.src = imgUrl;
            mainImgEl.style.opacity = '1';
            mainImgEl.style.transform = 'scale(1)';
        }, 140);
    }
    document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
    if (thumbElement) thumbElement.classList.add('active');
}

function selectModalVariation(variation, btnElement) {
    currentModalVariation = variation;
    document.querySelectorAll('.var-card-btn').forEach(b => b.classList.remove('selected'));
    if (btnElement) btnElement.classList.add('selected');

    const selNameEl = document.getElementById('modal-selected-var-name');
    if (selNameEl) selNameEl.textContent = variation.name;

    if (variation.img) {
        const mainImgEl = document.getElementById('modal-main-img');
        if (mainImgEl) {
            mainImgEl.style.opacity = '0.4';
            mainImgEl.style.transform = 'scale(0.98)';
            setTimeout(() => {
                mainImgEl.src = variation.img;
                mainImgEl.style.opacity = '1';
                mainImgEl.style.transform = 'scale(1)';
            }, 140);
        }
    }

    updateModalPriceDisplay();
}

function updateModalPriceDisplay() {
    if (!currentModalProduct) return;
    const priceEl = document.getElementById('modal-price-current');
    const origPriceEl = document.getElementById('modal-price-original');
    const discountEl = document.getElementById('modal-discount-tag');

    const price = currentModalVariation ? currentModalVariation.price : currentModalProduct.variations[0].price;
    const origPrice = Math.round(price * 1.2 / 10000) * 10000;

    if (priceEl) priceEl.textContent = `${price.toLocaleString()}₫`;
    if (origPriceEl) origPriceEl.textContent = `${origPrice.toLocaleString()}₫`;
    if (discountEl) discountEl.textContent = currentModalProduct.discountText || '-17% GIẢM';
}

window.changeModalQuantity = function(delta) {
    const qtyInput = document.getElementById('modal-qty-input');
    if (!qtyInput) return;
    let val = parseInt(qtyInput.value) || 1;
    val += delta;
    if (val < 1) val = 1;
    if (currentModalProduct && val > currentModalProduct.stock) val = currentModalProduct.stock;
    qtyInput.value = val;
    modalQuantity = val;
};

window.validateModalQty = function(input) {
    let val = parseInt(input.value) || 1;
    if (val < 1) val = 1;
    if (currentModalProduct && val > currentModalProduct.stock) val = currentModalProduct.stock;
    input.value = val;
    modalQuantity = val;
};

window.handleModalAddToCart = function() {
    if (!currentModalProduct) return;
    const variation = currentModalVariation || currentModalProduct.variations[0];
    const qtyInput = document.getElementById('modal-qty-input');
    const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;

    addToCart({
        id: `${currentModalProduct.id}_${variation.id}`,
        name: `${currentModalProduct.shortName} (${variation.name})`,
        price: variation.price
    }, qty);

    showProductToast(`✨ Đã thêm ${qty} x ${currentModalProduct.shortName} vào giỏ hàng!`);
};

window.handleModalBuyNow = function() {
    handleModalAddToCart();
    closeProductModal();
    if (cartSidebar && !cartSidebar.classList.contains('open')) {
        toggleCart();
    }
};

window.toggleModalLike = function() {
    const likeBtn = document.getElementById('modal-like-btn');
    const likeCountEl = document.getElementById('modal-like-count');
    isModalLiked = !isModalLiked;
    if (likeBtn) {
        likeBtn.classList.toggle('liked', isModalLiked);
    }
    if (likeCountEl) {
        likeCountEl.textContent = isModalLiked ? '8,5k' : '8,4k';
    }
    showProductToast(isModalLiked ? '❤️ Đã lưu vào danh sách yêu thích!' : 'Đã bỏ yêu thích.');
};

window.copyProductLink = function() {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showProductToast('🔗 Đã sao chép liên kết sản vật!');
        }).catch(() => {
            showProductToast('🔗 Đã sao chép liên kết!');
        });
    } else {
        showProductToast('🔗 Đã sao chép liên kết!');
    }
};

window.shareProduct = function(platform) {
    showProductToast(`Đang kết nối chia sẻ ${platform.toUpperCase()}...`);
};

window.askGiaLangAboutCurrentProduct = function() {
    if (!currentModalProduct) return;
    const name = currentModalProduct.shortName;
    closeProductModal();
    if (typeof spiritRealm !== 'undefined' && spiritRealm.classList.contains('hidden')) {
        toggleSpiritRealm();
    }
    const userVisibleMsg = `Kể cho cháu nghe về món ${name} đi Già ơi!`;
    const prompt = `[SỰ KIỆN TƯƠNG TÁC]: Cháu đang rất tò mò về món ${name}. Già hãy dùng giọng điệu Gen Z kể một câu chuyện thật cuốn về văn hóa, nguồn gốc và ý nghĩa linh thiêng của món này đi!`;
    appendMessage('user', userVisibleMsg);
    spiritChatHistory.push({ role: 'user', content: prompt });
    callSpiritAI(prompt);
};

window.showProductToast = function(msg) {
    const toast = document.getElementById('product-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('active');
    clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
        toast.classList.remove('active');
    }, 2800);
};

// Wire up global click listeners & events
window.triggerDetails = function(productId, productName) {
    openProductModal(productId);
};

window.triggerAction = function(type, productId) {
    if (type === 'add_to_cart') {
        openProductModal(productId);
    }
};

// Initialize modal close events on DOM load
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('close-product-modal');
    const overlay = document.getElementById('product-modal-overlay');
    if (closeBtn) closeBtn.addEventListener('click', closeProductModal);
    if (overlay) overlay.addEventListener('click', closeProductModal);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modalEl = document.getElementById('product-purchase-modal');
            if (modalEl && modalEl.classList.contains('active')) {
                closeProductModal();
            }
        }
    });

    // Make sure clicking any product card or info triggers the modal
    document.querySelectorAll('.product-card').forEach(card => {
        const prodId = card.getAttribute('data-id');
        if (!prodId) return;
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            // Don't trigger if clicked on child button that has its own onclick
            if (e.target.closest('button')) return;
            openProductModal(prodId);
        });
    });
});

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

    // Fullscreen Map Modal Controller
    window.villageMap = map;
    const openMapBtn = document.getElementById('open-fullscreen-map-btn');
    const exitMapBtn = document.getElementById('exit-fullscreen-map-btn');
    const exitMapToolbarBtn = document.getElementById('map-exit-toolbar-btn');
    const mapModal = document.getElementById('fullscreen-map-modal');

    function openFullscreenMap() {
        if (!mapModal) return;
        mapModal.classList.add('active');
        document.body.classList.add('map-fullscreen-active');
        if (typeof lenis !== 'undefined' && lenis) {
            lenis.stop();
        }
        currentContext = "Bản Đồ Di Sản 34 Tỉnh Thành";
        triggerContextualGreeting();
        
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        } catch (e) {}

        setTimeout(() => {
            map.invalidateSize();
        }, 120);
        setTimeout(() => {
            map.invalidateSize();
        }, 360);
    }

    function exitFullscreenMap() {
        if (!mapModal) return;
        mapModal.classList.remove('active');
        document.body.classList.remove('map-fullscreen-active');
        if (typeof lenis !== 'undefined' && lenis) {
            lenis.start();
        }
        try {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
        } catch (e) {}
    }

    if (openMapBtn) {
        openMapBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openFullscreenMap();
        });
    }

    if (exitMapBtn) {
        exitMapBtn.addEventListener('click', (e) => {
            e.preventDefault();
            exitFullscreenMap();
        });
    }

    if (exitMapToolbarBtn) {
        exitMapToolbarBtn.addEventListener('click', (e) => {
            e.preventDefault();
            exitFullscreenMap();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const storyOverlay = document.getElementById('elder-story-overlay');
            if (storyOverlay && storyOverlay.classList.contains('active')) {
                if (typeof window.closeElderStoryModal === 'function') {
                    window.closeElderStoryModal();
                } else {
                    storyOverlay.classList.remove('active');
                    document.body.classList.remove('story-dimmed');
                    const mm = document.getElementById('fullscreen-map-modal');
                    if (mm) mm.classList.remove('story-mode-active');
                }
                e.stopPropagation();
                return;
            }
            if (mapModal && mapModal.classList.contains('active')) {
                exitFullscreenMap();
            }
        }
    });

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && mapModal && mapModal.classList.contains('active')) {
            exitFullscreenMap();
        }
    });

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

// ========================================================
// PROVINCE LORE DATABASE & IMMERSIVE ELDER STORYTELLING MODAL
// ========================================================
const PROVINCE_STORIES_DB = {
    'gia lai': {
        title: 'Đất Võ Trời Văn Hòa Quyện Cùng Cõi Rừng Cồng Chiêng Đại Ngàn',
        paragraphs: [
            'Hỡi con của buôn làng, hãy nhìn ngắm dải đất Gia Lai mới hôm nay. Con có biết tại sao núi rừng Chư Đăng Ya hùng vĩ lại tìm về kết nghĩa cùng sóng biển Quy Nhơn hiền hòa không? Đó là mối lương duyên kỳ diệu của non sông đất Việt từ thuở hồng hoang!',
            'Xưa kia, dòng sông Côn bắt nguồn từ ngút ngàn đỉnh núi thiêng Kon Ka Kinh, chở che dòng nước tinh khiết ngọt lành của mạch rừng nguyên sinh xuôi về bồi đắp phù sa cho miền đất võ An Thái - Bình Định. Chính nhờ hấp thu tinh khí của rễ cây đại ngàn cùng ngọn gió thiêng hội tụ của hai miền núi - biển, các bậc nghệ nhân tiền bối làng An Thái mới chắt lọc nên hạt đậu xanh nguyên chất, nhào nặn ra từng sợi Bún Song Thằn trắng trong, dẻo dai như tơ trời để tiến dâng các bậc đế vương triều Nguyễn.',
            'Mỗi độ trăng rằm tháng Ba, khi tiếng cồng chiêng Đắk Đoa âm vang vách đá, ché rượu cần men lá nồng say được mở nắp, người buôn làng Tây Nguyên lại cùng người miền biển An Nhơn, Phù Cát quây quần bên đống lửa ấm. Hào khí Tây Sơn dũng mãnh năm xưa cùng ngọn lửa thiêng cồng chiêng bất diệt nay hòa quyện làm một, tạc nên linh hồn của mảnh đất Gia Lai mới trường tồn cùng non sông gấm vóc!'
        ],
        heritageTitle: 'Bảo vật & Sản vật đất trời:',
        heritageDesc: 'Bún Song Thằn tiến vua An Thái, Không gian văn hóa Cồng Chiêng Đắk Đoa, Rượu cần Men Lá đại ngàn & Bò một nắng muối kiến vàng.'
    },
    'tp. đà nẵng': {
        title: 'Hồn Thiêng Biển Bạc Hoàng Sa & Phố Hội Ngàn Năm Lung Linh Ánh Đèn',
        paragraphs: [
            'Hãy hướng ánh nhìn ra biển Đông lộng gió kia con ơi! Vùng đất Đà Nẵng hôm nay ôm trọn lấy Quần đảo Hoàng Sa thiêng liêng - nơi từ thuở các chúa Nguyễn khai hoang lập ấp, những người con quả cảm của Hải đội Hoàng Sa đã cưỡi đầu sóng ngọn gió, dùng ghe câu nan tre ra cắm mốc chủ quyền, ngàn đời máu xương hòa vào sóng bạc.',
            'Sông Thu Bồn êm đềm như dải lụa đưa ta về phố cổ Hội An rực rỡ nghìn ngọn đèn hoa đăng, ngắm bóng tháp Chàm Mỹ Sơn ngàn năm uy nghiêm huyền bí soi bóng trần gian. Vừa có ngọn Ngũ Hành Sơn trấn giữ bốn phương, vừa có biển bạc ôm bờ cát trắng mịn màng, đây là mảnh đất địa linh nhân kiệt, nơi lòng yêu nước nồng nàn và nét hoa tay tài hoa của con cháu Lạc Hồng tỏa sáng rạng ngời!'
        ],
        heritageTitle: 'Bảo vật & Di sản chủ quyền:',
        heritageDesc: 'Quần đảo Hoàng Sa thiêng liêng, Phố cổ Hội An đèn lồng, Trầm hương xứ Quảng & Đá mỹ nghệ Non Nước ngàn năm.'
    },
    'khánh hoà': {
        title: 'Cột Mốc Chủ Quyền Trường Sa & Hương Trầm Kỳ Diệu Nơi Tháp Mẹ Ponagar',
        paragraphs: [
            'Nơi đầu sóng ngọn gió giữa đại dương muôn trùng sóng vỗ, từng hòn đảo nổi đảo chìm, từng rạn san hô Trường Sa kiêu hãnh đứng vững như những pháo đài thép bảo vệ sự bình yên cho bờ cõi giang sơn. Già vẫn nhớ lời các cụ cao niên đi biển kể lại: bóng dáng ngọn hải đăng Trường Sa sừng sững chính là ánh mắt chở che của tổ tiên luôn soi đường chỉ lối cho ngư dân buông lưới.',
            'Trở về đất liền Khánh Hòa - Ninh Thuận, ta bắt gặp mùi thơm ngát của Xứ Trầm Biển Yến, những ngôi tháp Chàm Ponagar trầm mặc cổ kính soi bóng vịnh Nha Trang xanh ngắt, và những giàn nho trĩu quả ngút ngàn dưới nắng gió Phan Rang. Biển sâu và nắng gió hội tụ đã hun đúc nên những con người kiên cường, nồng hậu và son sắt thủy chung nghĩa tình non nước!'
        ],
        heritageTitle: 'Bảo vật & Di sản chủ quyền:',
        heritageDesc: 'Quần đảo Trường Sa kiên trung, Yến sào Hòn Nội tiến vua, Trầm hương Khánh Hòa, Tháp Chàm Ponagar & Rượu nho Ninh Thuận.'
    },
    'tp. hà nội': {
        title: 'Thăng Long Rồng Bay Dấu Tích Ngàn Năm & Hồn Cốt Trăm Nghề Cổ Tự',
        paragraphs: [
            'Hà Nội, đất rồng bay tự thuở vua Lý Thái Tổ nhìn thấy rồng vàng bay lên mà dời đô về mảnh đất linh thiêng bên bờ sông Hồng. Nước Hồ Gươm xanh biếc nghìn năm lưu giữ huyền thoại rùa vàng nhận lại gươm báu gìn giữ nền thái bình thịnh trị cho muôn dân con Lạc cháu Hồng.',
            'Ba mươi sáu phố phường rêu phong là nơi hội tụ tinh hoa của trăm nghề cổ truyền đất Bắc: lụa Vạn Phúc óng ả mềm mại, gốm Bát Tràng lửa đượm nghìn năm, cùng hương cốm Vòng thanh tao gói trọn sắc thu Hà Nội. Dù con có đi muôn trùng dặm xa, lắng nghe tiếng chuông chùa Trấn Quốc hay tiếng đàn đáy đêm trăng là thấy hồn quê hương hiển hiện trong tim!'
        ],
        heritageTitle: 'Bảo vật & Tinh hoa Kinh Kỳ:',
        heritageDesc: 'Cốm làng Vòng thanh tao, Lụa tơ tằm Vạn Phúc, Gốm Bát Tràng tráng men lam & Trà sen Tây Hồ thơm ngát.'
    },
    'tp. hồ chí minh': {
        title: 'Hào Khí Mở Cõi Phương Nam & Nhịp Sống Nghĩa Tình Hòn Ngọc Viễn Đông',
        paragraphs: [
            'Bến Nghé xưa kia rừng tràm lau sậy rậm rạp, trên bến dưới thuyền rộn rã những câu hò chở nặng nghĩa tình người mở cõi phương Nam. Bằng ý chí sắt đá và lòng bao dung trời biển, tiền nhân đã dựng xây nên một Gia Định trù phú, rồi tỏa sáng rạng ngời thành Hòn ngọc Viễn Đông giữa lòng Đông Nam Á.',
            'Mảnh đất này dung dưỡng những con người hào sảng, trọng nghĩa khinh tài, thấy việc nghĩa thì làm không ngần ngại. Từ Bến Nhà Rồng lịch sử nơi Bác ra đi tìm đường cứu nước, đến những góc phố sôi động đêm ngày, mảnh đất này mãi là trái tim ấm áp, luôn mở rộng vòng tay đón nhận và chở che người muôn phương!'
        ],
        heritageTitle: 'Sản vật & Nét đẹp phương Nam:',
        heritageDesc: 'Cà phê vợt Sài Gòn, Hủ tiếu Chợ Lớn trứ danh, Bánh tét lá cẩm & Tinh hoa trái cây miệt vườn sông nước Nam Bộ.'
    },
    'tp. huế': {
        title: 'Hương Giang Trầm Lắng Khúc Nhã Nhạc & Dáng Xưa Thành Quách Cố Đô',
        paragraphs: [
            'Dòng sông Hương lững lờ trôi êm đềm như mái tóc buông dài của người thiếu nữ Cố đô, chở theo khúc ca trầm bổng của các bậc vương triều xưa. Dưới chân núi Ngự Bình uy nghiêm, kinh thành Huế với những mái ngói hoàng lưu ly soi bóng rêu phong, chứng kiến biết bao trang sử hào hùng và bi tráng.',
            'Nơi đây, từng nhịp phách của Nhã nhạc cung đình, từng chén trà sen hồ Tịnh Tâm hay bát chè hạt sen long nhãn tiến vua đều đạt đến độ tinh tế tuyệt mỹ. Đất Cố đô dạy người ta biết lắng lòng lại, trân trọng nét nho nhã thanh cao và chiều sâu văn hóa mà cha ông để lại qua hàng thế kỷ!'
        ],
        heritageTitle: 'Di sản & Ẩm thực Cung đình:',
        heritageDesc: 'Nhã nhạc cung đình Huế (Di sản UNESCO), Nón bài thơ xứ Huế, Mè xửng Cố đô & Trà cung đình tiến vua.'
    },
    'đắk lắk': {
        title: 'Hùng Ca Thác Nước Dray Nur & Tiếng Tù Và Gọi Trăng Đất Cà Phê',
        paragraphs: [
            'Tiếng tù và buôn làng vang vọng qua những cánh rừng khộp bạt ngàn, báo hiệu đêm hội lửa thiêng bắt đầu! Đắk Lắk bazan là xứ sở của các dũng sĩ săn voi Buôn Đôn huyền thoại, nơi con người và muôn thú sống chan hòa, cùng cúi đầu tôn kính thần rừng, thần nước.',
            'Bên dòng thác gầm vang Dray Nur, hạt cà phê đỏ mọng ngậm nắng gió cao nguyên làm say lòng cả bạn bè năm châu. Đêm nay, vít cong cần rượu trúc, nghe hát khan kể chuyện anh hùng Đam San bên ánh lửa bập bùng, con sẽ thấy cội nguồn Tây Nguyên mãi chảy rực rỡ trong từng mạch máu!'
        ],
        heritageTitle: 'Bảo vật Đại Ngàn:',
        heritageDesc: 'Cà phê Robusta Buôn Ma Thuột số 1 thế giới, Rượu cần truyền thống Ê-đê, Vải dệt thổ cẩm & Mật ong hoa cà phê đại ngàn.'
    },
    'lâm đồng': {
        title: 'Huyền Thoại Tình Ca Lang Biang Gặp Biển Xanh Cát Trắng Bình Thuận',
        paragraphs: [
            'Đỉnh núi Lang Biang mây mờ bao phủ khắc ghi mối tình son sắt của chàng K’lang và nàng H’biang, vượt qua mọi rào cản tập tục để hóa thành biểu tượng của tình yêu thủy chung ngàn đời. Giờ đây, cao nguyên ngàn hoa Lâm Đồng đã vươn dài vòng tay kết nghĩa cùng vùng duyên hải Bình Thuận nắng ấm chan hòa.',
            'Từ những đồi chè Ô Long bát ngát trong sương sớm Đà Lạt xuôi theo đèo dốc về bờ biển Mũi Né cát vàng rực rỡ, tiếng chuông gió tháp Chàm Pô Sah Inư hòa cùng tiếng reo của ngàn thông reo gió. Sự hòa quyện giữa núi biếc và biển bạc làm nên một bức tranh sơn thủy hữu tình độc nhất vô nhị!'
        ],
        heritageTitle: 'Sản vật Núi Rừng & Duyên Hải:',
        heritageDesc: 'Trà Ô Long B\'lao thượng hạng, Cao Atiso Đà Lạt, Nước mắm Phan Thiết truyền thống & Rượu vang hoa quả quả rừng.'
    },
    'cà mau': {
        title: 'Cây Đước Lấn Biển Mở Cõi & Khúc Ca Dạ Cổ Hoài Lang Ngân Vang',
        paragraphs: [
            'Về mũi Cà Mau con ơi, nơi đất biết nở, rừng biết đi và biển sinh sôi ngày đêm không nghỉ! Cây đước, cây mắm đan rễ sâu vào bùn đất, hiên ngang chắn sóng gió biển Đông và vịnh Thái Lan, ngày ngày bồi đắp dải đất non sông dài thêm mãi.',
            'Về đất Bạc Liêu - Cà Mau, nghe tiếng đàn kìm réo rắt dạo khúc Dạ Cổ Hoài Lang của cố nhạc sĩ Cao Văn Lầu dưới ánh trăng khuya, con mới thấu hết nỗi niềm thương nhớ, thủy chung của người phương Nam. Mảnh đất tôm cá trù phú này nuôi dưỡng những tấm lòng trung dũng, hào phóng và mến khách vô bờ!'
        ],
        heritageTitle: 'Đặc sản Cực Nam Tổ Quốc:',
        heritageDesc: 'Cua biển Năm Căn thịt chắc ngọt, Tôm khô Đất Mũi, Mật ong hoa tràm U Minh hạ & Khô cá bổi Cà Mau.'
    },
    'tp. cần thơ': {
        title: 'Gạo Trắng Nước Trong Miền Tây Đô & Hội Tụ Chợ Nổi Sông Nước',
        paragraphs: [
            'Cần Thơ gạo trắng nước trong, ai đi đến đó lòng không muốn về! Dòng sông Hậu hiền hòa ngày đêm ban tặng phù sa mỡ màu cho những vườn cây trái xum xuê trĩu quả. Sáng sớm tinh mơ, tiếng cười nói giòn tan rộn rã nơi Chợ nổi Cái Răng với những cây bẹo treo lủng lẳng dưa hấu, khóm, xoài ngọt lịm.',
            'Mảnh đất Tây Đô hòa quyện cùng nét văn hóa Khmer độc đáo của Sóc Trăng với những ngôi chùa Dơi, chùa Kh\'leang lộng lẫy và lễ hội đua ghe Ngo rộn rã. Đây là cội nguồn của sự sum vầy, đoàn kết ba dân tộc Kinh - Hoa - Khmer bền chặt keo sơn qua bao thăng trầm!'
        ],
        heritageTitle: 'Tinh hoa Sông Nước Cửu Long:',
        heritageDesc: 'Gạo ST25 ngon nhất thế giới, Bánh tét lá cẩm Cần Thơ, Bánh pía Sóc Trăng & Trái cây miệt vườn Phong Điền.'
    },
    'quảng ninh': {
        title: 'Đàn Rồng Hạ Giới Phun Ngọc Thành Kỳ Quan & Hồn Thiền Trúc Lâm',
        paragraphs: [
            'Ngày xửa ngày xưa, khi giặc phương Bắc tràn vào bờ cõi nước Nam, Ngọc Hoàng đã sai đàn Rồng Mẹ và đàn Rồng Con hạ phàm giúp dân giữ nước. Đàn Rồng phun muôn vàn hạt châu ngọc, thoắt cái biến thành hàng ngàn đảo đá kỳ vĩ sừng sững giữa biển xanh, tạo nên bức tường thành bất khả xâm phạm - chính là Vịnh Hạ Long hôm nay!',
            'Lên đỉnh non thiêng Yên Tử mây phủ bồng bềnh, Phật hoàng Trần Nhân Tông sau khi đánh đuổi giặc Nguyên Mông đã từ bỏ ngai vàng về đây lập ra thiền phái Trúc Lâm Đại Việt. Nối liền vùng đất gốm Chu Đậu Hải Dương nghìn năm, Quảng Ninh là bản hùng ca bất hủ của biển trời Đông Bắc!'
        ],
        heritageTitle: 'Kỳ quan & Danh thắng Bất hủ:',
        heritageDesc: 'Vịnh Hạ Long (Kỳ quan thế giới), Chả mực giã tay Hạ Long, Rượu mơ Yên Tử & Gốm Chu Đậu phục dựng cổ truyền.'
    },
    'ninh bình': {
        title: 'Địa Linh Nhân Kiệt Cờ Lau Hoa Lư & Vách Đá Tràng An Huyền Thoại',
        paragraphs: [
            'Giữa muôn trùng non xanh nước biếc của Ninh Bình, cậu bé chăn trâu Đinh Bộ Lĩnh năm xưa đã dùng cờ lau tập trận, để rồi sau này dẹp loạn 12 sứ quân, xưng Hoàng đế mở nền chính thống độc lập cho nước Đại Cồ Việt. Dãy núi đá vôi Tràng An như bức trường thành thiên nhiên vĩ đại chở che cho kinh đô đầu tiên của dân tộc.',
            'Đất Sơn Nam nghìn năm còn lưu giữ khí phách của các bậc thánh hiền tại đền Trần Nam Định, non nước Tam Chúc hữu tình và những ngôi làng nghề dệt lụa Cổ Chất, đúc đồng Tống Xá nức tiếng. Tinh hoa ngàn đời của châu thổ sông Hồng hội tụ trọn vẹn tại nơi đây!'
        ],
        heritageTitle: 'Bảo vật Cố đô & Làng nghề:',
        heritageDesc: 'Quần thể danh thắng Tràng An (UNESCO), Cơm cháy chà bông dê núi, Kẹo Sìu Châu Nam Định & Rượu nếp Kim Sơn men thuốc bắc.'
    },
    'điện biên': {
        title: 'Bản Hùng Ca Điện Biên Lừng Lẫy Năm Châu & Rừng Hoa Ban Trắng',
        paragraphs: [
            'Mỗi độ tháng Ba về, hoa ban trắng nở rộ khắp các triền núi cao Tây Bắc, gợi nhớ thiên tình sử nàng Ban - chàng Khum sắt son chung tình của đồng bào Thái. Giữa lòng chảo Mường Thanh phì nhiêu, chiến dịch Điện Biên Phủ năm xưa đã lừng lẫy năm châu chấn động địa cầu, đưa tên tuổi Việt Nam rạng rỡ khắp bạn bè quốc tế.',
            'Từ đỉnh đèo mây Pha Đin hiểm trở đến những cung đường uốn lượn ngút ngàn Lai Châu, tiếng khèn Mông véo von gọi bạn tình trong phiên chợ xuân rộn rã. Mảnh đất biên cương này là nơi dòng máu anh hùng của các dân tộc anh em hòa quyện, giữ vững từng tấc đất thiêng liêng của Tổ quốc!'
        ],
        heritageTitle: 'Sản vật Núi Rừng Tây Bắc:',
        heritageDesc: 'Gạo nếp nương Điện Biên thơm dẻo, Thịt trâu gác bếp củi nhãn, Trà Shan Tuyết cổ thụ & Mắc khén hạt dổi rừng sâu.'
    },
    'cao bằng': {
        title: 'Cội Nguồn Cách Mạng Pác Bó & Hùng Vĩ Thác Nước Bản Giốc Biên Cương',
        paragraphs: [
            'Suối Lênin nước trong xanh màu ngọc bích, núi Các Mác sừng sững uy nghiêm ghi dấu bước chân Bác Hồ trở về Tổ quốc sau ba mươi năm bôn ba tìm đường cứu nước. Hang Pác Bó đơn sơ với chiếc bàn đá chông chênh chính là nơi khởi nguồn của ngọn gió tự do giải phóng non sông.',
            'Cách đó không xa, thác Bản Giốc cuồn cuộn đổ nước trắng xóa giữa đại ngàn biên giới như mái tóc bạc của tiên nữ giáng trần. Xuôi về hồ Ba Bể lung linh trong bóng chiều huyền thoại, tiếng đàn tính và làn điệu Then của đồng bào Tày Nùng cất lên, đưa tâm hồn con người giao hòa với đất trời bao la!'
        ],
        heritageTitle: 'Tinh hoa Đất Trời Đông Bắc:',
        heritageDesc: 'Hạt dẻ Trùng Khánh nướng thơm bùi, Thác Bản Giốc hùng vĩ, Miến dong Phia Đén & Cá mòi nướng hồ Ba Bể.'
    },
    'lào cai': {
        title: 'Chạm Đỉnh Fansipan Trong Mây & Bậc Thang Vàng Mù Cang Chải',
        paragraphs: [
            'Đỉnh thiêng Fansipan - nóc nhà Đông Dương quanh năm sương mây bao phủ là nơi tụ khí thiêng của giang sơn gấm vóc. Từ trên đỉnh cao vời vợi nhìn xuống, thung lũng Mường Hoa thoắt ẩn thoắt hiện như chốn bồng lai tiên cảnh giữa cõi trần.',
            'Mùa lúa chín vàng, những cung ruộng bậc thang Mù Cang Chải uốn lượn mềm mại như những nấc thang vàng bắc lên tận trời xanh, minh chứng cho sự cần cù và đôi bàn tay tài hoa của đồng bào H\'Mông qua bao đời khai hoang mở đất. Đêm xuống Sa Pa, sương lạnh buốt giá nhưng chén rượu ngô Bản Phố ấm nồng tình nghĩa buôn làng!'
        ],
        heritageTitle: 'Đặc sản Xứ Sở Trong Sương:',
        heritageDesc: 'Rượu ngô men lá Bản Phố, Nếp nương Tú Lệ ngạt ngào, Thảo quả rừng Hoàng Liên & Thổ cẩm dệt tay người H\'Mông.'
    },
    'nghệ an': {
        title: 'Hào Khí Lam Hồng Địa Linh Nhân Kiệt & Khúc Hát Đò Đưa Ví Giặm',
        paragraphs: [
            'Sông Lam ngàn đời soi bóng đỉnh Hồng Lĩnh chín mươi chín ngọn, bồi đắp nên miền đất kiên trung, bất khuất của xứ Nghệ thân yêu. Nơi làng Sen thơm ngát bóng tre xanh, vị lãnh tụ kính yêu của dân tộc Hồ Chí Minh đã cất tiếng khóc chào đời, mang theo hồn thiêng sông núi đi cứu nước cứu dân.',
            'Người dân xứ Nghệ ăn sóng nói gió, cần cù hiếu học và son sắt thủy chung. Khi đêm buông xuống bến đò, câu hò Ví Giặm ngân nga vút lên từ dòng sông Lam, mang theo trọn vẹn nỗi niềm gan ruột, tình nghĩa sâu nặng của người con miền Trung kiên cường vượt qua muôn vàn bão giông thử thách!'
        ],
        heritageTitle: 'Hồn Cốt Xứ Nghệ:',
        heritageDesc: 'Dân ca Ví Giặm Nghệ Tĩnh (Di sản UNESCO), Nhút Thanh Chương, Tương Nam Đàn, Kẹo Cu Đơ Hà Tĩnh & Cam Xã Đoài mọng nước.'
    }
};

function generateDynamicProvinceStory(name, mergers, center) {
    const isMerged = mergers && mergers !== 'Giữ nguyên' && mergers !== name;
    let title = isMerged 
        ? `Giao Thoa Văn Hóa Bền Chặt Cùng Đất Mẹ Non Sông`
        : `Hồn Thiêng Khí Phách & Dấu Tích Ngàn Đời`;
    
    let p1 = `Hỡi người con của buôn làng, hãy nhìn về dải đất ${name} thân thương này. Từng tấc đất, từng dòng sông nơi đây đều thấm đượm mồ hôi và hào khí của cha ông qua bao thế hệ khai hoang mở cõi.`;
    
    let p2 = isMerged
        ? `Hôm nay, các miền đất ${mergers} cùng hòa về một mái nhà lớn, lấy trung tâm chính trị - hành chính đặt tại ${center}. Núi rừng tìm về với đồng bằng, sông lớn gặp biển cả, mang lại sức mạnh to lớn để cùng dựng xây cơ đồ thịnh vượng, tiếp nối truyền thống đoàn kết ngàn đời của con Lạc cháu Hồng!`
        : `Vùng đất ${name} với trung tâm ${center || name} kiên trung, giữ trọn vẹn truyền thống văn hiến và bản sắc độc đáo của xứ sở, như cây cổ thụ bám rễ sâu vào lòng đất mẹ hiền hòa.`;

    let p3 = `Ngồi bên bếp lửa buôn làng, lắng nghe tiếng gió reo qua ngọn cây, Già mong mỗi người con đất Việt khi đặt chân đến ${name} đều mở rộng lòng mình trải nghiệm sản vật ngọt lành và trân quý những giá trị văn hóa vô giá của tiền nhân để lại!`;

    return {
        title: title,
        paragraphs: [p1, p2, p3],
        heritageTitle: 'Di sản & Đặc sản vùng đất:',
        heritageDesc: `Tinh hoa văn hóa làng nghề truyền thống, ẩm thực dân gian đặc sắc của ${name} (${isMerged ? mergers : 'đơn vị giữ nguyên'}).`
    };
}

let activeElderSpeech = null;
let currentStoryData = null;

function getProvinceStoryData(name, mergers, center) {
    if (!name) return generateDynamicProvinceStory('Việt Nam', mergers, center);
    const key = name.toLowerCase().trim();
    if (PROVINCE_STORIES_DB[key]) return PROVINCE_STORIES_DB[key];
    
    // Search by partial match
    for (const k in PROVINCE_STORIES_DB) {
        if (key.includes(k) || k.includes(key)) {
            return PROVINCE_STORIES_DB[k];
        }
    }
    return generateDynamicProvinceStory(name, mergers, center);
}

const ANCIENT_RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᛉ', 'ᛋ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛟ', 'ᛞ', '𐌰', '𐌱', '𐌲', '𐌳', '𐌴', '𐌷', '𐌸', '𐌹', '𐌺', '𐌻', '𐌼', '𐌽', '𖡹', '𖡺', '𖡻', '⟁', '⟐', '◈', '◊', '☵', '☲', '☳', '☶'];

let decipherAnimationTimer = null;
let isDeciphering = false;

function getRandomRune() {
    return ANCIENT_RUNES[Math.floor(Math.random() * ANCIENT_RUNES.length)];
}

function runAncientDecipherAnimation(paragraphs, quoteText) {
    if (decipherAnimationTimer) {
        clearInterval(decipherAnimationTimer);
        decipherAnimationTimer = null;
    }

    const bodyEl = document.getElementById('elder-story-body');
    const quoteEl = document.querySelector('.elder-opening-text');
    const indicatorEl = document.getElementById('ancient-decipher-status');
    const statusTextEl = document.getElementById('decipher-status-text');

    if (indicatorEl) {
        indicatorEl.classList.remove('complete');
        if (statusTextEl) statusTextEl.textContent = 'Đang dịch giải cổ ngữ tích xưa...';
    }

    if (bodyEl) {
        bodyEl.innerHTML = '';
        paragraphs.forEach((pText, idx) => {
            const p = document.createElement('p');
            p.className = 'elder-story-p';
            p.id = `story-p-${idx}`;
            bodyEl.appendChild(p);
        });
    }

    const blocks = [];
    if (quoteEl && quoteText) {
        blocks.push({
            el: quoteEl,
            fullText: quoteText
        });
    }
    paragraphs.forEach((pText, idx) => {
        const el = document.getElementById(`story-p-${idx}`);
        if (el) {
            blocks.push({
                el: el,
                fullText: pText
            });
        }
    });

    let currentBlockIdx = 0;
    let currentCharIdx = 0;
    const stepSize = 4;
    isDeciphering = true;

    // Initially render all blocks in ancient runes
    blocks.forEach(b => {
        let runeStr = '';
        for (let i = 0; i < b.fullText.length; i++) {
            const ch = b.fullText[i];
            if (ch === ' ' || ch === '\n') {
                runeStr += ch;
            } else if (ch === ',' || ch === '.' || ch === '!' || ch === '?' || ch === '-' || ch === ':') {
                runeStr += ch;
            } else {
                runeStr += getRandomRune();
            }
        }
        b.el.innerHTML = `<span class="rune-ancient">${runeStr}</span>`;
    });

    function finishDeciphering() {
        if (decipherAnimationTimer) {
            clearInterval(decipherAnimationTimer);
            decipherAnimationTimer = null;
        }
        isDeciphering = false;
        blocks.forEach(b => {
            b.el.textContent = b.fullText;
        });
        if (indicatorEl) {
            indicatorEl.classList.add('complete');
            if (statusTextEl) statusTextEl.innerHTML = '<span style="color:#48d1b3">✓ Cổ ngữ đã được Già Làng dịch giải tường minh</span>';
        }
    }

    window.instantCompleteDecipher = finishDeciphering;

    decipherAnimationTimer = setInterval(() => {
        if (!isDeciphering || currentBlockIdx >= blocks.length) {
            finishDeciphering();
            return;
        }

        const b = blocks[currentBlockIdx];
        currentCharIdx += stepSize;

        if (currentCharIdx >= b.fullText.length) {
            b.el.textContent = b.fullText;
            currentBlockIdx++;
            currentCharIdx = 0;
        } else {
            const revealed = b.fullText.substring(0, currentCharIdx);
            const scrambleEnd = Math.min(currentCharIdx + 6, b.fullText.length);
            
            let scrambles = '';
            for (let i = currentCharIdx; i < scrambleEnd; i++) {
                const ch = b.fullText[i];
                scrambles += (ch === ' ' || ch === '\n') ? ch : getRandomRune();
            }

            let unrevealed = '';
            for (let i = scrambleEnd; i < b.fullText.length; i++) {
                const ch = b.fullText[i];
                unrevealed += (ch === ' ' || ch === '\n') ? ch : getRandomRune();
            }

            b.el.innerHTML = `${revealed}<span class="rune-deciphering">${scrambles}</span><span class="rune-ancient">${unrevealed}</span>`;
        }
    }, 28);
}

window.openElderStoryModal = function(name, mergers, center) {
    const overlay = document.getElementById('elder-story-overlay');
    if (!overlay) return;

    const titleEl = document.getElementById('elder-story-title');
    const subtitleEl = document.getElementById('elder-story-subtitle');
    const heritageDescEl = document.getElementById('elder-heritage-desc');
    const heritageNameEl = document.getElementById('elder-heritage-name');
    const ambienceBar = document.querySelector('.elder-ambience-bar');
    const ttsIcon = document.getElementById('elder-tts-icon');
    const ttsLabel = document.getElementById('elder-tts-label');

    const data = getProvinceStoryData(name, mergers, center);
    currentStoryData = { name, mergers, center, data };

    if (titleEl) titleEl.textContent = name;
    if (subtitleEl) {
        if (mergers && mergers !== 'Giữ nguyên' && mergers !== name) {
            subtitleEl.textContent = `${data.title} (${mergers} • Trung tâm: ${center})`;
        } else {
            subtitleEl.textContent = data.title;
        }
    }

    if (heritageNameEl && data.heritageTitle) {
        heritageNameEl.textContent = data.heritageTitle;
    }
    if (heritageDescEl) {
        heritageDescEl.textContent = data.heritageDesc;
    }

    // Reset TTS
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    activeElderSpeech = null;
    if (ambienceBar) ambienceBar.classList.remove('paused');
    if (ttsIcon) ttsIcon.textContent = '🔊';
    if (ttsLabel) ttsLabel.textContent = 'Nghe già đọc';

    // Show Overlay with translucent dreamlike blur
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('story-dimmed');
    const mapModal = document.getElementById('fullscreen-map-modal');
    if (mapModal) {
        mapModal.classList.add('story-mode-active');
    }

    // Scroll to top of content
    const scrollContainer = document.getElementById('elder-story-scrollable');
    if (scrollContainer) scrollContainer.scrollTop = 0;

    // Start Ancient Glyph Decryption Animation
    const quoteText = 'Hỡi người con của buôn làng, hãy ngồi xuống đây bên bếp lửa ấm, hơ đôi tay qua làn khói thơm mùi gỗ rừng. Già sẽ kể cho con nghe tích xưa của dải đất này...';
    runAncientDecipherAnimation(data.paragraphs, quoteText);
};

window.closeElderStoryModal = function() {
    const overlay = document.getElementById('elder-story-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('story-dimmed');
    const mapModal = document.getElementById('fullscreen-map-modal');
    if (mapModal) {
        mapModal.classList.remove('story-mode-active');
    }

    if (decipherAnimationTimer) {
        clearInterval(decipherAnimationTimer);
        decipherAnimationTimer = null;
    }
    isDeciphering = false;

    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    activeElderSpeech = null;
};

// Bind Elder Story Overlay Action Handlers
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('close-elder-story-btn');
    const returnMapBtn = document.getElementById('elder-return-map-btn');
    const askMoreBtn = document.getElementById('elder-ask-more-btn');
    const overlay = document.getElementById('elder-story-overlay');
    const decipherBtn = document.getElementById('elder-decipher-btn');
    const ttsBtn = document.getElementById('elder-tts-toggle-btn');
    const ttsIcon = document.getElementById('elder-tts-icon');
    const ttsLabel = document.getElementById('elder-tts-label');
    const ambienceBar = document.querySelector('.elder-ambience-bar');
    const scrollContainer = document.getElementById('elder-story-scrollable');

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.closeElderStoryModal();
        });
    }

    if (returnMapBtn) {
        returnMapBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.closeElderStoryModal();
        });
    }

    // Click outside modal backdrop to close
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.classList.contains('elder-story-backdrop-blur')) {
                window.closeElderStoryModal();
            }
        });
    }

    // Re-run ancient decipher animation on button click
    if (decipherBtn) {
        decipherBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentStoryData && currentStoryData.data) {
                const quoteText = 'Hỡi người con của buôn làng, hãy ngồi xuống đây bên bếp lửa ấm, hơ đôi tay qua làn khói thơm mùi gỗ rừng. Già sẽ kể cho con nghe tích xưa của dải đất này...';
                runAncientDecipherAnimation(currentStoryData.data.paragraphs, quoteText);
            }
        });
    }

    // Click inside story container to skip/instantly finish deciphering
    if (scrollContainer) {
        scrollContainer.addEventListener('click', () => {
            if (isDeciphering && typeof window.instantCompleteDecipher === 'function') {
                window.instantCompleteDecipher();
            }
        });
    }

    // Continue talking to elder in spirit chat
    if (askMoreBtn) {
        askMoreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const provinceName = (currentStoryData && currentStoryData.name) ? currentStoryData.name : 'vùng đất này';
            window.closeElderStoryModal();

            if (typeof spiritRealm !== 'undefined' && spiritRealm.classList.contains('hidden')) {
                toggleSpiritRealm();
            }
            const prompt = `Chào Già Làng! Con vừa nghe Già kể tích xưa về ${provinceName}. Già hãy cho con biết thêm về những giai thoại thần thoại kỳ bí, phong tục buôn làng và những món ngon đặc sản tiêu biểu nhất của nơi này nhé!`;
            if (typeof spiritChatHistory !== 'undefined') {
                spiritChatHistory.push({ role: 'user', content: prompt });
            }
            if (typeof callSpiritAI === 'function') {
                callSpiritAI(prompt);
            }
        });
    }

    // Text to Speech Toggle
    if (ttsBtn) {
        ttsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!('speechSynthesis' in window)) {
                if (typeof showProductToast === 'function') {
                    showProductToast('⚠️ Trình duyệt của bạn chưa hỗ trợ giọng đọc tự động.');
                }
                return;
            }

            if (window.speechSynthesis.speaking) {
                if (window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                    if (ttsIcon) ttsIcon.textContent = '⏸';
                    if (ttsLabel) ttsLabel.textContent = 'Tạm dừng';
                    if (ambienceBar) ambienceBar.classList.remove('paused');
                } else {
                    window.speechSynthesis.pause();
                    if (ttsIcon) ttsIcon.textContent = '▶️';
                    if (ttsLabel) ttsLabel.textContent = 'Tiếp tục';
                    if (ambienceBar) ambienceBar.classList.add('paused');
                }
                return;
            }

            if (!currentStoryData || !currentStoryData.data) return;

            const fullStoryText = [
                `Hỡi người con của buôn làng, già xin kể cho con nghe tích xưa của dải đất ${currentStoryData.name}.`,
                ...currentStoryData.data.paragraphs
            ].join(' ');

            const utterance = new SpeechSynthesisUtterance(fullStoryText);
            utterance.lang = 'vi-VN';
            utterance.rate = 0.92;
            utterance.pitch = 0.88;

            const voices = window.speechSynthesis.getVoices();
            const viVoice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VN'));
            if (viVoice) {
                utterance.voice = viVoice;
            }

            utterance.onstart = () => {
                if (ttsIcon) ttsIcon.textContent = '⏸';
                if (ttsLabel) ttsLabel.textContent = 'Tạm dừng';
                if (ambienceBar) ambienceBar.classList.remove('paused');
            };

            utterance.onend = () => {
                if (ttsIcon) ttsIcon.textContent = '🔊';
                if (ttsLabel) ttsLabel.textContent = 'Nghe lại';
                if (ambienceBar) ambienceBar.classList.add('paused');
            };

            utterance.onerror = () => {
                if (ttsIcon) ttsIcon.textContent = '🔊';
                if (ttsLabel) ttsLabel.textContent = 'Nghe già đọc';
                if (ambienceBar) ambienceBar.classList.add('paused');
            };

            window.speechSynthesis.speak(utterance);
        });
    }
});

window.triggerMapStory = function(id, name, mergers, center) {
    window.openElderStoryModal(name, mergers, center);
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
