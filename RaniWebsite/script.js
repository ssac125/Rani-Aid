// LocalStorage Pseudo-Backend Database Definition
if (!localStorage.getItem('rani_assets')) {
    localStorage.setItem('rani_assets', JSON.stringify([
        { id: 1, name: "Cyber Beast", category: "sprite", url: "assists/sprites/CyberBeast.gif", rarity: "epic", creatorCode: "isacxisac@gmail.com" },
        { id: 2, name: "The Giant", category: "sprite", url: "assists/sprites/theGiant.gif", rarity: "legendary", creatorCode: "isacxisac@gmail.com" },
        { id: 3, name: "Stone Beast", category: "sprite", url: "assists/sprites/StoneBeast.gif", rarity: "rare", creatorCode: "isacxisac@gmail.com" },
        { id: 4, name: "The Witch", category: "sprite", url: "assists/sprites/TheWitch.gif", rarity: "epic", creatorCode: "isacxisac@gmail.com" },
        { id: 5, name: "Blue Storm", category: "effect", url: "assists/effects/Blue%20storm.gif", rarity: "legendary", creatorCode: "isacxisac@gmail.com" },
        { id: 6, name: "Energy Explode", category: "effect", url: "assists/effects/Energy%20explode.gif", rarity: "rare", creatorCode: "isacxisac@gmail.com" },
        { id: 7, name: "Respawn", category: "effect", url: "assists/effects/Respwan%20.gif", rarity: "epic", creatorCode: "isacxisac@gmail.com" }
    ]));
}

if (!localStorage.getItem('rani_users')) {
    localStorage.setItem('rani_users', JSON.stringify([
        { email: "isacxisac@gmail.com", password: "admin", role: "owner", lastActive: Date.now() }
    ]));
}

if (!localStorage.getItem('rani_messages')) {
    // Schema: { id, sender, receiver, type, url, text, timestamp, status: 'PENDING' | 'ACTIVE' | 'REJECTED' }
    localStorage.setItem('rani_messages', JSON.stringify([]));
}

if (!localStorage.getItem('rani_vip_codes')) {
    localStorage.setItem('rani_vip_codes', JSON.stringify(["isaac1ftw"]));
}

// Variables
let currentUser = JSON.parse(sessionStorage.getItem('current_user')) || null;
let isSignupMode = false;
let activeChatClient = null;
let currentServiceItem = null;

const pingOnlineStatus = () => {
    if(!currentUser) return;
    const users = JSON.parse(localStorage.getItem('rani_users')) || [];
    const idx = users.findIndex(u => u.email === currentUser.email);
    if(idx > -1) {
        users[idx].lastActive = Date.now();
        localStorage.setItem('rani_users', JSON.stringify(users));
        currentUser.lastActive = users[idx].lastActive;
        sessionStorage.setItem('current_user', JSON.stringify(currentUser));
        
        // Notify badge updating & admin panels
        checkPendingRequests();
        if(currentUser.role === 'owner') window.loadAdminMonitor();
    }
};
setInterval(pingOnlineStatus, 10000);
pingOnlineStatus();

// Setup GUI
const loadAssets = () => {
    const assets = JSON.parse(localStorage.getItem('rani_assets'));
    const spritesTrack = document.getElementById('sprites-track');
    const effectsTrack = document.getElementById('effects-track');
    
    if(spritesTrack) spritesTrack.innerHTML = '';
    if(effectsTrack) effectsTrack.innerHTML = '';

    assets.forEach(asset => {
        const cardHtml = `
            <div class="asset-card rng-${asset.rarity}">
                <div class="asset-preview">
                    <img src="${asset.url}" alt="${asset.name}">
                </div>
                <div class="asset-info">
                    <h3>${asset.name}</h3>
                    <div style="margin: 10px 0;">
                        <span style="text-transform:uppercase; font-size:0.7rem; color:#aaa; font-weight:bold;">Quality Rating: ${asset.rarity}</span>
                    </div>
                    <button class="buy-btn" onclick='window.openServiceModal(${JSON.stringify(asset)})'>Ask for Service</button>
                    <p style="font-size:0.6rem; color:#666; margin-top:5px;">Created by VIP</p>
                </div>
            </div>
        `;
        if (asset.category === 'sprite' && spritesTrack) spritesTrack.innerHTML += cardHtml;
        else if (effectsTrack) effectsTrack.innerHTML += cardHtml;
    });
};

const updateUI = () => {
    const loginBtn = document.getElementById('btn-login-modal');
    const userProfile = document.getElementById('user-profile');
    if (currentUser && userProfile) {
        if(loginBtn) loginBtn.style.display = 'none';
        userProfile.classList.remove('hidden');
        document.getElementById('user-email-display').textContent = currentUser.email.split('@')[0];
        
        const badge = document.getElementById('role-badge');
        const vipIcon = document.getElementById('global-vip-badge');
        const floatTrigger = document.getElementById('vip-floating-trigger');
        
        badge.textContent = currentUser.role.toUpperCase();
        if (currentUser.role === 'owner' || currentUser.role === 'vip') {
            if (currentUser.role === 'owner') {
                badge.style.background = 'linear-gradient(45deg, #f093fb, #f5576c)';
                document.getElementById('nav-monitor').classList.remove('hidden'); // Owner specific
            } else {
                badge.style.background = 'linear-gradient(45deg, #f6d365, #fda085)';
            }
            vipIcon.classList.remove('hidden');
            floatTrigger.classList.remove('hidden');
            document.getElementById('nav-vip').classList.remove('hidden');
        } else {
            badge.style.background = '#555';
            vipIcon.classList.add('hidden');
            floatTrigger.classList.add('hidden');
            const ibx = document.getElementById('vip-inbox-window'); if(ibx) ibx.classList.add('hidden');
        }

        document.getElementById('nav-inbox').classList.remove('hidden'); // Regular clients also see Station
        checkPendingRequests();
    } else {
        if(loginBtn) loginBtn.style.display = 'block';
        if(userProfile) userProfile.classList.add('hidden');
        const v = document.getElementById('nav-vip'); if(v) v.classList.add('hidden');
        const i = document.getElementById('nav-inbox'); if(i) i.classList.add('hidden');
        const m = document.getElementById('nav-monitor'); if(m) m.classList.add('hidden');
        document.getElementById('vip-floating-trigger').classList.add('hidden');
        document.getElementById('vip-inbox-window').classList.add('hidden');
    }
};

const switchTab = (tabId) => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`.nav-item[data-tab="${tabId}"]`)?.classList.add('active');
    const content = document.getElementById(tabId);
    if(content) content.classList.add('active');

    const bg = document.getElementById('global-bg');
    if(tabId === 'home') bg.classList.remove('blurred');
    else bg.classList.add('blurred');

    if(tabId === 'inbox') window.loadServiceStation();
    if(tabId === 'monitor') window.loadAdminMonitor();
};

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
});

document.querySelectorAll('.slider-container').forEach(c => {
    const track = c.querySelector('.slider-track');
    const p = c.querySelector('.prev-btn');
    const n = c.querySelector('.next-btn');
    if(p) p.addEventListener('click', () => track.scrollBy({ left: -300, behavior: 'smooth'}));
    if(n) n.addEventListener('click', () => track.scrollBy({ left: 300, behavior: 'smooth'}));
});

// VIP Activation
const activateBtn = document.getElementById('btn-activate-vip');
if(activateBtn) {
    activateBtn.addEventListener('click', () => {
        if(!currentUser) return alert("Sign In first!");
        const code = document.getElementById('license-input').value.trim();
        const codes = JSON.parse(localStorage.getItem('rani_vip_codes'));
        const msg = document.getElementById('vip-status-msg');
        
        if(codes.includes(code)) {
            currentUser.role = "vip";
            sessionStorage.setItem('current_user', JSON.stringify(currentUser));
            const users = JSON.parse(localStorage.getItem('rani_users'));
            const idx = users.findIndex(u => u.email === currentUser.email);
            if(idx > -1) { users[idx].role = 'vip'; localStorage.setItem('rani_users', JSON.stringify(users)); }
            msg.textContent = "VIP PASSKEY GRANTED! You are now a Creator."; msg.style.color="#00ff88";
            updateUI();
        } else {
            msg.textContent = "Invalid VIP Passkey."; msg.style.color="#ff4444";
        }
    });
}

// Authentication
if(document.getElementById('btn-login-modal')) document.getElementById('btn-login-modal').addEventListener('click', () => document.getElementById('auth-modal').style.display = 'flex');
if(document.querySelector('#auth-modal .close-modal')) document.querySelector('#auth-modal .close-modal').addEventListener('click', () => document.getElementById('auth-modal').style.display = 'none');

if(document.getElementById('auth-toggle')) {
    document.getElementById('auth-toggle').addEventListener('click', () => {
        isSignupMode = !isSignupMode;
        document.getElementById('auth-modal-title').innerHTML = isSignupMode ? "Sign <span>Up</span>" : "Sign <span>In</span>";
        document.getElementById('auth-submit-btn').textContent = isSignupMode ? "Register" : "Login";
        document.getElementById('auth-toggle').textContent = isSignupMode ? "Sign In" : "Sign up";
    });
}

if(document.getElementById('auth-form')) {
    document.getElementById('auth-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const em = document.getElementById('auth-email').value;
        const pw = document.getElementById('auth-password').value;
        const users = JSON.parse(localStorage.getItem('rani_users'));
        const err = document.getElementById('auth-error');

        if(isSignupMode) {
            if(users.find(u => u.email === em)) { err.textContent = "Email used."; return; }
            currentUser = { email: em, password: pw, role: "user", lastActive: Date.now() };
            users.push(currentUser);
            localStorage.setItem('rani_users', JSON.stringify(users));
        } else {
            const f = users.find(u => u.email === em && u.password === pw);
            if(!f) { err.textContent = "Invalid details."; return; }
            currentUser = f;
        }

        sessionStorage.setItem('current_user', JSON.stringify(currentUser));
        document.getElementById('auth-modal').style.display = 'none';
        updateUI();
        pingOnlineStatus();
    });
}

if(document.getElementById('btn-logout')) {
    document.getElementById('btn-logout').addEventListener('click', () => {
        sessionStorage.removeItem('current_user');
        currentUser = null;
        updateUI();
        window.location.reload();
    });
}

// "Ask for Service" -> Jump Modal Logic
window.openServiceModal = (item) => {
    if(!currentUser) return alert("Please Sign In first so creators can reach you!");
    currentServiceItem = item;
    document.getElementById('service-modal').style.display = 'flex';
};
if(document.getElementById('close-service')) document.getElementById('close-service').addEventListener('click', () => document.getElementById('service-modal').style.display = 'none');

document.getElementById('btn-next-jump')?.addEventListener('click', () => {
    document.getElementById('service-modal').style.display = 'none';
    const jm = document.getElementById('vip-jump-modal');
    jm.style.display = 'flex';
    
    // Populate Grid
    const users = JSON.parse(localStorage.getItem('rani_users'));
    const assets = JSON.parse(localStorage.getItem('rani_assets'));
    const vips = users.filter(u => u.role === 'vip' || u.role === 'owner');
    
    const grid = document.getElementById('vip-grid-list');
    grid.innerHTML = vips.map(v => {
        const isOnline = (Date.now() - v.lastActive) < 60000;
        const timeDiff = Math.floor((Date.now() - v.lastActive) / 60000);
        const lastSeenStr = isOnline ? "Online Now" : (timeDiff > 1440 ? "Offline" : `Active ${timeDiff}m ago`);
        const dotClass = isOnline ? '' : 'offline';
        
        // Get up to 3 of their works
        const vWorks = assets.filter(a => a.creatorCode === v.email).slice(0,3);
        const imagesHtml = vWorks.map(w => `<img src="${w.url}" class="vcard-img" title="${w.name}">`).join('');

        return `
            <div class="vip-creator-card" onclick="window.sendJumpRequest('${v.email}')">
                <div class="vip-card-avatar">
                   ${v.email.charAt(0).toUpperCase()}
                   <div class="vcard-dot ${dotClass}"></div>
                </div>
                <div class="vcard-email">${v.email.split('@')[0]} <i class="ph-fill ph-check-circle" style="color:#00ff88;"></i></div>
                <div class="vcard-status">${lastSeenStr}</div>
                <div class="vcard-works">${imagesHtml || '<span style="color:#666;font-size:0.8rem;">No portfolio yet</span>'}</div>
                <button class="buy-btn" style="margin-top:15px; padding:0.5rem; background:#fff; color:var(--accent);">Choose Creator</button>
            </div>
        `;
    }).join('');
});
if(document.getElementById('close-jump')) document.getElementById('close-jump').addEventListener('click', () => document.getElementById('vip-jump-modal').style.display = 'none');

window.sendJumpRequest = (targetVipEmail) => {
    document.getElementById('vip-jump-modal').style.display = 'none';
    
    // Create PENDING request message
    const msgId = 'req_' + Date.now();
    saveMsg({ 
        id: msgId,
        sender: currentUser.email, 
        receiver: targetVipEmail, 
        type: 'text', 
        text: `[SERVICE REQUEST] Looking to commission a service based on: "${currentServiceItem ? currentServiceItem.name : 'your portfolio'}".`, 
        timestamp: Date.now(),
        status: 'PENDING'
    });
    
    alert("Request has been sent. Please wait until they reply...");
    activeChatClient = targetVipEmail;
    switchTab('inbox'); // Send client to service station to wait
};

// Admin Addons Base64 Upload
document.getElementById('upload-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if(!currentUser || (currentUser.role !== 'vip' && currentUser.role !== 'owner')) return alert("Not authorized.");
    const fileInput = document.getElementById('upload-file');
    if(!fileInput.files || !fileInput.files[0]) return alert("Please select a file.");
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(evt) {
        const base64Str = evt.target.result;
        const newAsset = {
            id: Date.now(),
            name: document.getElementById('upload-name').value,
            category: document.getElementById('upload-category').value,
            url: base64Str,
            rarity: document.getElementById('upload-rarity').value,
            quality: document.getElementById('upload-quality').value,
            creatorCode: currentUser.email 
        };
        const assets = JSON.parse(localStorage.getItem('rani_assets'));
        assets.push(newAsset);
        localStorage.setItem('rani_assets', JSON.stringify(assets));
        
        alert("Portfolio Item Published!");
        e.target.reset();
        loadAssets();
    };
    reader.readAsDataURL(file);
});


// ---------------------------------------------------------------------------------
// Admin Monitor logic
// ---------------------------------------------------------------------------------
window.loadAdminMonitor = () => {
    if(!currentUser || currentUser.role !== 'owner') return;
    const users = JSON.parse(localStorage.getItem('rani_users') || '[]');
    const grid = document.getElementById('client-monitor-list');
    if(!grid) return;
    
    grid.innerHTML = users.map(u => {
        if(u.email === currentUser.email) return ''; // exclude self
        const isOnline = (Date.now() - u.lastActive) < 60000;
        const timeDiff = Math.floor((Date.now() - u.lastActive) / 60000);
        const lastSeenStr = isOnline ? "Online Now" : (timeDiff > 1440 ? "Offline" : `Active ${timeDiff}m ago`);
        const dotClass = isOnline ? '' : 'offline';
        return `
            <div class="vip-creator-card" style="border-color:${isOnline ? '#3ba55c' : 'rgba(255,255,255,0.1)'};">
                <div class="vip-card-avatar">
                   ${u.email.charAt(0).toUpperCase()}
                   <div class="vcard-dot ${dotClass}"></div>
                </div>
                <div class="vcard-email">${u.email.split('@')[0]}</div>
                <div class="vcard-status">${lastSeenStr}</div>
                <span class="role-badge">${u.role.toUpperCase()}</span>
            </div>
        `;
    }).join('');
};


// ---------------------------------------------------------------------------------
// Service Station & Inbox Logic (Request Queue + Accept/Reject)
// ---------------------------------------------------------------------------------

const checkPendingRequests = () => {
    if(!currentUser) return;
    const msgList = JSON.parse(localStorage.getItem('rani_messages') || '[]');
    // Only check if we are receiver and status is pending
    const pending = msgList.filter(m => m.receiver === currentUser.email && m.status === 'PENDING');
    
    const floatBadge = document.querySelector('.notification-badge');
    if(floatBadge) {
        if(pending.length > 0) floatBadge.classList.remove('hidden');
        else floatBadge.classList.add('hidden');
    }
};

window.loadServiceStation = () => {
    if(!currentUser) return;
    const msgList = JSON.parse(localStorage.getItem('rani_messages') || '[]');
    const users = JSON.parse(localStorage.getItem('rani_users') || '[]');
    
    // Load Pending Requests into Queue (If We are VIP/Owner)
    const pendingList = msgList.filter(m => m.receiver === currentUser.email && m.status === 'PENDING');
    let queueHTML = '';
    
    if (currentUser.role === 'vip' || currentUser.role === 'owner') {
        const uniqueSenders = [...new Set(pendingList.map(p => p.sender))];
        uniqueSenders.forEach(senderEmail => {
            const reqItem = pendingList.find(p => p.sender === senderEmail);
            queueHTML += `
                <div style="background:rgba(20,20,25,0.8); border:1px solid #444; border-radius:8px; padding:10px; margin-bottom:10px;">
                    <p style="font-weight:bold; font-size:0.8rem; color:#fff;">${senderEmail.split('@')[0]} sent a request</p>
                    <p style="font-size:0.75rem; color:#aaa; margin:5px 0;">"${reqItem.text}"</p>
                    <div style="display:flex; gap:10px; margin-top:10px;">
                        <button class="ss-queue-btn" onclick="window.handleRequest('${senderEmail}', 'ACCEPT')">ACCEPT</button>
                        <button class="ss-queue-btn reject" onclick="window.handleRequest('${senderEmail}', 'REJECT')">REJECT</button>
                    </div>
                </div>
            `;
        });
    }

    if(queueHTML === '') queueHTML = '<div style="padding:10px; color:#555; text-align:center;">No requests in queue.</div>';
    document.getElementById('ss-queue-list').innerHTML = queueHTML;

    // Load Active Client Selection in far left Server Bar
    let contacts = new Set();
    msgList.forEach(m => {
        if(m.status === 'ACTIVE') {
            if(m.sender === currentUser.email) contacts.add(m.receiver);
            if(m.receiver === currentUser.email) contacts.add(m.sender);
        }
    });

    const clientArr = Array.from(contacts);
    let navHTML = '';
    clientArr.forEach(c => {
        const userObj = users.find(u => u.email === c);
        const uEmail = c.split('@')[0];
        const isOnline = userObj ? (Date.now() - userObj.lastActive) < 60000 : false;
        navHTML += `
            <div class="ss-dm-btn" title="${uEmail}" onclick="window.selectSsClient('${c}')" style="${c===activeChatClient?'border-radius:16px;':''}">
                <div style="font-weight:bold;font-size:1.2rem; color:#fff;">${uEmail.charAt(0).toUpperCase()}</div>
                ${isOnline ? '<div class="online-dot"></div>' : ''}
            </div>
        `;
    });
    document.getElementById('ss-client-list').innerHTML = navHTML;

    // Render active chat
    renderChatCore('station');
};

window.handleRequest = (senderEmail, action) => {
    let msgList = JSON.parse(localStorage.getItem('rani_messages') || '[]');
    if(action === 'ACCEPT') {
        msgList.forEach(m => {
            if(m.sender === senderEmail && m.receiver === currentUser.email && m.status === 'PENDING') {
                m.status = 'ACTIVE';
            }
        });
        localStorage.setItem('rani_messages', JSON.stringify(msgList));
        activeChatClient = senderEmail;
        // Broadcast automated acceptance
        saveMsg({sender: currentUser.email, receiver: senderEmail, type:'text', text:'I have accepted your request! Let us discuss the details.', timestamp: Date.now(), status:'ACTIVE'});
    } else {
        // Rejecting simply deletes the pending request
        msgList = msgList.filter(m => !(m.sender === senderEmail && m.receiver === currentUser.email && m.status === 'PENDING'));
        localStorage.setItem('rani_messages', JSON.stringify(msgList));
    }
    
    window.loadServiceStation();
    window.loadVIPInbox();
    pingOnlineStatus();
};

window.selectSsClient = (email) => {
    activeChatClient = email;
    window.loadServiceStation();
    window.loadVIPInbox();
};

const renderChatCore = (targetPrefix) => { // 'station' or 'floating'
    const msgList = JSON.parse(localStorage.getItem('rani_messages') || '[]');
    let box;
    if(targetPrefix === 'station') box = document.getElementById('station-messages');
    else box = document.getElementById('floating-messages');
    if(!box) return;

    if (activeChatClient) {
        if(targetPrefix==='station') document.getElementById('station-title').textContent = activeChatClient.split('@')[0];
        
        // Find if request is still PENDING
        const pendingForMe = msgList.find(m => m.sender === activeChatClient && m.receiver === currentUser.email && m.status === 'PENDING');
        const pendingForThem = msgList.find(m => m.sender === currentUser.email && m.receiver === activeChatClient && m.status === 'PENDING');
        
        const inputArea = targetPrefix === 'station' ? document.getElementById('station-input-area') : document.getElementById('floating-input').parentElement.parentElement;
        
        if (pendingForMe || pendingForThem) {
            box.innerHTML = `<div class="ss-empty-state">Request is PENDING. You must Accept the request to start chatting.</div>`;
            if(inputArea) inputArea.style.opacity = '0.5';
            if(inputArea) inputArea.style.pointerEvents = 'none';
        } else {
            if(inputArea) inputArea.style.opacity = '1';
            if(inputArea) inputArea.style.pointerEvents = 'auto';

            const convo = msgList.filter(m => 
                (m.sender === activeChatClient && m.receiver === currentUser.email) || 
                (m.receiver === activeChatClient && m.sender === currentUser.email)
            ).filter(m => m.status === 'ACTIVE');

            // Construct Bubbles
            if(targetPrefix === 'station') {
                box.innerHTML = convo.map(m => {
                    const tE = m.sender.split('@')[0]; let contentHtml = '';
                    if(m.type === 'text') contentHtml = `<p class="dc-msg-text">${m.text}</p>`;
                    else if(m.type === 'image') contentHtml = `<img src="${m.url}" class="dc-msg-img" onclick="window.open(this.src)">`;
                    else if(m.type === 'audio') contentHtml = `<div class="dc-msg-audio"><i class="ph-bold ph-play-circle" style="font-size:1.5rem; color:#fff;"></i> <span>Voice message (0:12)</span></div>`;
                    return `
                        <div class="dc-msg-box">
                            <div class="dc-msg-avatar">${tE.charAt(0).toUpperCase()}</div>
                            <div class="dc-msg-content">
                                <div class="dc-msg-header"><span class="dc-msg-name">${tE}</span><span class="dc-msg-time">${new Date(m.timestamp).toLocaleTimeString()}</span></div>
                                ${contentHtml}
                            </div>
                        </div>`;
                }).join('');
            } else {
                // Floating Inbox Bubbles
                box.innerHTML = convo.map(m => {
                    const isMe = m.sender === currentUser.email;
                    let contentHtml = '';
                    if(m.type === 'text') contentHtml = m.text;
                    else if(m.type === 'image') contentHtml = `<img src="${m.url}" style="max-width:150px; border-radius:8px;">`;
                    else if(m.type === 'audio') contentHtml = `<i class="ph-bold ph-music-notes"></i> Voice Memo`;
                    return `<div class="msg-bubble ${isMe ? 'owner' : 'client'}">${contentHtml}</div>`;
                }).join('');
            }
        }
    } else {
        if(targetPrefix==='station') document.getElementById('station-title').textContent = "Select a Thread";
        box.innerHTML = `<div class="ss-empty-state">No thread selected. Start working.</div>`;
    }
    box.scrollTop = box.scrollHeight;
};

// Messaging Inputs Combine
document.getElementById('station-form')?.addEventListener('submit', (e) => handleDbInput(e, 'station-input'));
document.getElementById('floating-form')?.addEventListener('submit', (e) => handleDbInput(e, 'floating-input'));

const handleDbInput = (e, inputId) => {
    e.preventDefault();
    const inpTag = document.getElementById(inputId);
    const inp = inpTag.value.trim();
    if(!inp || !activeChatClient) return;
    saveMsg({ sender: currentUser.email, receiver: activeChatClient, type: 'text', text: inp, timestamp: Date.now(), status: 'ACTIVE' });
    inpTag.value = "";
};

const saveMsg = (msgObj) => {
    const list = JSON.parse(localStorage.getItem('rani_messages'));
    list.push(msgObj);
    localStorage.setItem('rani_messages', JSON.stringify(list));
    window.loadServiceStation();
    if (document.getElementById('vip-inbox-window') && !document.getElementById('vip-inbox-window').classList.contains('hidden')) {
        window.loadVIPInbox();
    }
};

// VIP Floating Inbox Logic (Draggable mechanics)
const floatTrig = document.getElementById('vip-floating-trigger');
const vipWin = document.getElementById('vip-inbox-window');
const vipHead = document.getElementById('vip-inbox-header');

if(floatTrig) {
    floatTrig.addEventListener('click', () => {
        vipWin.classList.remove('hidden');
        window.loadVIPInbox();
    });
}
document.getElementById('close-vip-inbox')?.addEventListener('click', () => vipWin.classList.add('hidden'));

window.dockInbox = (pos) => {
    vipWin.style.top = '0px';
    vipWin.style.height = '100vh';
    vipWin.style.borderRadius = '0';
    if(pos==='left') { vipWin.style.left = '0px'; vipWin.style.right = 'auto'; }
    if(pos==='right'){ vipWin.style.right = '0px'; vipWin.style.left = 'auto'; }
};

// Dragging Math
if(vipHead) {
    let isDragging = false, startX, startY, startLeft, startTop;
    vipHead.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX; startY = e.clientY;
        const rect = vipWin.getBoundingClientRect();
        startLeft = rect.left; startTop = rect.top;
        vipWin.style.right = 'auto'; // Break CSS right positioning so left overrides
        vipWin.style.bottom = 'auto';
        vipWin.style.height = '500px'; // Unsnap if docked
        vipWin.style.borderRadius = '16px';
    });
    document.addEventListener('mousemove', (e) => {
        if(!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        vipWin.style.left = startLeft + dx + 'px';
        vipWin.style.top = startTop + dy + 'px';
    });
    document.addEventListener('mouseup', () => { isDragging = false; });
}

window.loadVIPInbox = () => {
    if(!currentUser || (currentUser.role !== 'vip' && currentUser.role !== 'owner')) return;
    const msgList = JSON.parse(localStorage.getItem('rani_messages') || '[]');
    const users = JSON.parse(localStorage.getItem('rani_users') || '[]');
    
    let contacts = new Set();
    msgList.filter(m => m.status === 'ACTIVE').forEach(m => {
        if(m.sender === currentUser.email) contacts.add(m.receiver);
        if(m.receiver === currentUser.email) contacts.add(m.sender);
    });

    const clientArr = Array.from(contacts);
    let navHTML = '';
    clientArr.forEach(c => {
        const userObj = users.find(u => u.email === c);
        const uEmail = c.split('@')[0];
        const isOnline = userObj ? (Date.now() - userObj.lastActive) < 60000 : false;
        const isActiveClass = (c === activeChatClient) ? 'active' : '';
        navHTML += `
            <div class="inbox-dm-item ${isActiveClass}" onclick="window.selectSsClient('${c}')">
                <div class="ss-dm-avatar" style="width:40px;height:40px;flex-shrink:0;">
                    ${uEmail.charAt(0).toUpperCase()}
                    ${isOnline ? '<div class="online-dot" style="position:absolute;bottom:0;right:0;width:10px;height:10px;background:#3ba55c;border-radius:50%;"></div>':''}
                </div>
                <div style="color:#fff;font-weight:bold;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${uEmail}</div>
            </div>
        `;
    });
    document.getElementById('floating-dm-list').innerHTML = navHTML || `<p style="text-align:center;padding:10px;color:#666;">No active DMs.</p>`;
    renderChatCore('floating');
    checkPendingRequests();
};

// Inbox specific files and voices
const ibxPic = document.getElementById('floating-btn-pic');
const ibxFile = document.getElementById('floating-file');
const ibxVoice = document.getElementById('floating-btn-voice');

if(ibxPic && ibxFile) {
    ibxPic.addEventListener('click', () => ibxFile.click());
    ibxFile.addEventListener('change', (e) => {
        if(!e.target.files[0] || !activeChatClient) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            saveMsg({ sender: currentUser.email, receiver: activeChatClient, type: 'image', url: evt.target.result, timestamp: Date.now(), status:'ACTIVE' });
        };
        reader.readAsDataURL(e.target.files[0]);
    });
}
if(ibxVoice) {
    let rec = false;
    ibxVoice.addEventListener('click', () => {
        if(!activeChatClient || rec) return;
        rec = true; ibxVoice.style.color = "#ff4444";
        setTimeout(() => {
            saveMsg({ sender: currentUser.email, receiver: activeChatClient, type: 'audio', timestamp: Date.now(), status:'ACTIVE' });
            ibxVoice.style.color = "#a0a0b0"; rec = false;
        }, 1500);
    });
}


// Shared File Upload for Service Station
const btnPic = document.getElementById('db-btn-pic');
const fileInp = document.getElementById('db-file-upload');
if(btnPic && fileInp) {
    btnPic.addEventListener('click', () => fileInp.click());
    fileInp.addEventListener('change', (e) => {
        if(!e.target.files[0] || !activeChatClient) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            saveMsg({ sender: currentUser.email, receiver: activeChatClient, type: 'image', url: evt.target.result, timestamp: Date.now(), status:'ACTIVE' });
        };
        reader.readAsDataURL(e.target.files[0]);
    });
}

// Setup
loadAssets();
updateUI();
