import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBOQ9qY92O_cAPyLrH2_pNjpBbzveZdVdY",
  authDomain: "graduate-web-linhhdn.firebaseapp.com",
  projectId: "graduate-web-linhhdn",
  storageBucket: "graduate-web-linhhdn.firebasestorage.app",
  messagingSenderId: "346370092633",
  appId: "1:346370092633:web:3bb592f35760968f0c4b48",
  measurementId: "G-BXCTNX3S8H"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const wishesCol = collection(db, "wishes");

document.addEventListener('DOMContentLoaded', () => {
    // 1. Intersection Observer for Scroll Reveal
    const fadeElements = document.querySelectorAll('.fade-up');
    
    const appearOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };
    
    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);
    
    fadeElements.forEach(el => appearOnScroll.observe(el));

    // 2. Interactive Envelope Opening Logic
    const envelopeOverlay = document.getElementById('envelope-overlay');
    const envelopeTrigger = document.getElementById('open-envelope-trigger');
    let hasOpened = false;

    if (envelopeTrigger && envelopeOverlay) {
        envelopeTrigger.addEventListener('click', () => {
            if (hasOpened) return;
            hasOpened = true;

            // Trigger Envelope opening animation
            envelopeTrigger.classList.add('opening');

            // Play background music automatically upon opening
            if (bgMusic) {
                bgMusic.volume = 0.5;
                bgMusic.play().then(() => {
                    isPlaying = true;
                    if (musicPlayer) musicPlayer.classList.add('playing');
                }).catch(e => console.log("Music play blocked:", e));
            }

            // Confetti explosion effect
            createElegantConfetti();

            // After envelope opening animation finishes, fade out overlay
            setTimeout(() => {
                envelopeOverlay.classList.add('hide-envelope');
                
                // Trigger reveal for hero elements
                const heroElements = document.querySelectorAll('.hero .fade-up');
                heroElements.forEach(el => el.classList.add('visible'));
            }, 900);
        });
    }

    // 3. Background Music Logic
    const musicPlayer = document.getElementById('music-toggle');
    const bgMusic = document.getElementById('bg-music');
    let isPlaying = false;
    
    // Auto-play attempt on first interaction with the document (browsers block autoplay without interaction)
    const startAudioOnFirstInteraction = () => {
        if (!isPlaying) {
            bgMusic.volume = 0.5; // Soft volume
            bgMusic.play().then(() => {
                isPlaying = true;
                musicPlayer.classList.add('playing');
            }).catch(e => console.log("Autoplay blocked. User needs to click play manually."));
        }
        document.removeEventListener('click', startAudioOnFirstInteraction);
        document.removeEventListener('scroll', startAudioOnFirstInteraction);
    };

    document.addEventListener('click', startAudioOnFirstInteraction, { once: true });
    document.addEventListener('scroll', startAudioOnFirstInteraction, { once: true });

    // Manual toggle
    musicPlayer.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent triggering the document click again
        if (isPlaying) {
            bgMusic.pause();
            musicPlayer.classList.remove('playing');
            isPlaying = false;
        } else {
            bgMusic.volume = 0.5;
            bgMusic.play();
            musicPlayer.classList.add('playing');
            isPlaying = true;
        }
    });

    // 3. Guestbook Logic (Firebase Firestore)
    const wishForm = document.getElementById('wish-form');
    const wishesList = document.getElementById('wishes-list');
    const wishesCountEl = document.getElementById('wishes-count');
    
    let allWishes = [];

    // Emoji Selector Logic
    const emojiBtns = document.querySelectorAll('.emoji-btn');
    let selectedEmojis = ['🎓']; // Default

    emojiBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const emoji = btn.dataset.emoji;
            if (btn.classList.contains('active')) {
                // Cannot deselect if it's the only one
                if (selectedEmojis.length > 1) {
                    btn.classList.remove('active');
                    selectedEmojis = selectedEmojis.filter(e => e !== emoji);
                }
            } else {
                if (selectedEmojis.length < 3) { // limit to 3 max
                    btn.classList.add('active');
                    selectedEmojis.push(emoji);
                } else {
                    // Remove first added to add new
                    const firstEmoji = selectedEmojis.shift();
                    const firstBtn = document.querySelector(`.emoji-btn[data-emoji="${firstEmoji}"]`);
                    if(firstBtn) firstBtn.classList.remove('active');
                    btn.classList.add('active');
                    selectedEmojis.push(emoji);
                }
            }
        });
    });

    function getInitials(name) {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    function timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return "Vừa xong";
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        
        return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    }

    function formatFullDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) + ' • ' + date.toLocaleDateString('vi-VN');
    }

    const REACTION_TYPES = {
        like: '👍',
        love: '❤️',
        haha: '😂',
        wow: '😮',
        sad: '😢',
        angry: '😡'
    };

    function getReactionSummary(reactions) {
        if (!reactions) return { count: 0, icons: [] };
        let total = 0;
        const icons = [];
        const sorted = Object.entries(reactions)
            .filter(([_, count]) => count > 0)
            .sort((a, b) => b[1] - a[1]);
        
        sorted.forEach(([type, count]) => {
            total += count;
            if (icons.length < 3) icons.push(REACTION_TYPES[type]);
        });
        return { count: total, icons };
    }

    window.handleReaction = async (wishId, type) => {
        const localReactions = JSON.parse(localStorage.getItem('ngoclinh_reactions') || '{}');
        const oldReaction = localReactions[wishId];
        
        const isRemoving = oldReaction === type;
        
        const wishIndex = allWishes.findIndex(w => w.id === wishId);
        if (wishIndex !== -1) {
            if (!allWishes[wishIndex].reactions) allWishes[wishIndex].reactions = {};
            if (oldReaction) {
                allWishes[wishIndex].reactions[oldReaction]--;
            }
            if (!isRemoving) {
                allWishes[wishIndex].reactions[type] = (allWishes[wishIndex].reactions[type] || 0) + 1;
            }
            renderWishesList();
        }

        if (isRemoving) {
            delete localReactions[wishId];
        } else {
            localReactions[wishId] = type;
        }
        localStorage.setItem('ngoclinh_reactions', JSON.stringify(localReactions));

        try {
            const wishRef = doc(db, "wishes", wishId);
            const updates = {};
            if (oldReaction) {
                updates[`reactions.${oldReaction}`] = increment(-1);
            }
            if (!isRemoving) {
                updates[`reactions.${type}`] = increment(1);
            }
            await updateDoc(wishRef, updates);
        } catch (error) {
            console.error("Error updating reaction:", error);
        }
    };

    function renderWishesList() {
        wishesList.innerHTML = '';
        if (wishesCountEl) wishesCountEl.textContent = `${allWishes.length} Lời chúc`;
        
        if (allWishes.length === 0) {
            wishesList.innerHTML = '<p style="text-align:center; color:var(--clr-text-secondary); padding: 40px 0;">Hãy là người đầu tiên gửi lời chúc nhé! ✨</p>';
            return;
        }

        allWishes.forEach(wish => {
            const wishEl = document.createElement('div');
            wishEl.className = 'wish-item';
            
            const localReactions = JSON.parse(localStorage.getItem('ngoclinh_reactions') || '{}');
            const userReaction = localReactions[wish.id];
            const summary = getReactionSummary(wish.reactions);
            
            let iconsHtml = '';
            summary.icons.forEach(icon => {
                iconsHtml += `<span>${icon}</span>`;
            });

            const countsHtml = summary.count > 0 ? `
                <div class="reaction-counts">
                    <div class="top-icons">${iconsHtml}</div>
                    <span>${summary.count}</span>
                </div>
            ` : '';

            const btnText = userReaction ? 'Đã thả' : 'Thích';
            const activeClass = userReaction ? 'active' : '';
            const btnIcon = userReaction ? REACTION_TYPES[userReaction] : '🤍';

            const emojisDisplay = (wish.emojis || []).join(' ');

            wishEl.innerHTML = `
                <div class="wish-header">
                    <div class="wish-avatar">${getInitials(wish.name)}</div>
                    <div class="wish-author-info">
                        <span class="wish-author">${escapeHTML(wish.name)}</span>
                        <div class="wish-time">
                            🕒 ${formatFullDate(wish.time)} (${timeAgo(wish.time)})
                        </div>
                    </div>
                    <div class="wish-selected-emojis">${emojisDisplay}</div>
                </div>
                <div class="wish-content">
                    "${escapeHTML(wish.message).replace(/\n/g, '<br>')}"
                </div>
                <div class="wish-actions">
                    <div class="reaction-btn-wrapper">
                        <button class="reaction-trigger ${activeClass}">
                            <span>${btnIcon}</span>
                            <span>${btnText}</span>
                        </button>
                        <div class="reaction-box">
                            <span class="reaction-icon" onclick="handleReaction('${wish.id}', 'like')" title="Thích">👍</span>
                            <span class="reaction-icon" onclick="handleReaction('${wish.id}', 'love')" title="Yêu thích">❤️</span>
                            <span class="reaction-icon" onclick="handleReaction('${wish.id}', 'haha')" title="Haha">😂</span>
                            <span class="reaction-icon" onclick="handleReaction('${wish.id}', 'wow')" title="Wow">😮</span>
                            <span class="reaction-icon" onclick="handleReaction('${wish.id}', 'sad')" title="Buồn">😢</span>
                            <span class="reaction-icon" onclick="handleReaction('${wish.id}', 'angry')" title="Phẫn nộ">😡</span>
                        </div>
                    </div>
                    ${countsHtml}
                </div>
            `;
            wishesList.appendChild(wishEl);
        });
    }

    // Real-time listener from Firestore
    wishesList.innerHTML = '<p style="text-align:center; color:var(--clr-text-secondary); padding: 40px 0;">Đang tải lời chúc... 💌</p>';
    const q = query(wishesCol, orderBy("time", "desc"));
    
    onSnapshot(q, (snapshot) => {
        allWishes = [];
        snapshot.forEach((doc) => {
            allWishes.push({ id: doc.id, ...doc.data() });
        });
        renderWishesList();
    }, (error) => {
        console.error("Lỗi khi tải lời chúc từ Firebase: ", error);
        wishesList.innerHTML = '<p style="text-align:center; color:#D67D89; padding: 40px 0;">Chưa thể kết nối máy chủ Firebase. Bạn vui lòng thử lại sau nhé!</p>';
    });

    wishForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nameInput = document.getElementById('sender-name');
        const messageInput = document.getElementById('message');
        const submitBtn = wishForm.querySelector('.btn-submit-wish');
        const originalBtnContent = submitBtn.innerHTML;
        
        const name = nameInput.value.trim();
        const message = messageInput.value.trim();
        
        if (!name || !message) return;

        // Loading state
        submitBtn.innerHTML = '<span>Đang gửi...</span>';
        submitBtn.style.opacity = '0.7';
        submitBtn.disabled = true;

        try {
            await addDoc(wishesCol, {
                name: name,
                message: message,
                emojis: selectedEmojis,
                time: new Date().toISOString()
            });

            wishForm.reset();
            
            // Success state
            submitBtn.innerHTML = '<span>Gửi thành công! 🎉</span>';
            submitBtn.style.opacity = '1';
            submitBtn.style.background = '#8A3B49'; // darker rose
            
            createElegantConfetti();

            setTimeout(() => {
                submitBtn.innerHTML = originalBtnContent;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
            }, 3000);
            
        } catch (error) {
            console.error("Lỗi khi gửi lời chúc: ", error);
            submitBtn.innerHTML = '<span>Lỗi kết nối! Thử lại</span>';
            submitBtn.style.opacity = '1';
            setTimeout(() => {
                submitBtn.innerHTML = originalBtnContent;
                submitBtn.disabled = false;
            }, 3000);
        }
    });

    function escapeHTML(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    // 4. Elegant Confetti (Rose Gold / Pastel colors)
    function createElegantConfetti() {
        const colors = ['#D67D89', '#D4AF37', '#FAF5F5', '#E8D5D8']; // Rose gold, gold, white, blush
        for (let i = 0; i < 60; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = Math.random() > 0.5 ? '8px' : '12px';
            confetti.style.height = Math.random() > 0.5 ? '8px' : '12px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            confetti.style.top = '-10px';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.opacity = Math.random() + 0.6;
            confetti.style.zIndex = '9999';
            confetti.style.pointerEvents = 'none';
            document.body.appendChild(confetti);

            const duration = Math.random() * 2 + 2; // 2-4s
            confetti.animate([
                { transform: `translate3d(0, 0, 0) rotate(0deg)`, opacity: 1 },
                { transform: `translate3d(${Math.random()*150 - 75}px, 100vh, 0) rotate(${Math.random()*720}deg)`, opacity: 0 }
            ], {
                duration: duration * 1000,
                easing: 'cubic-bezier(.37,0,.63,1)',
                fill: 'forwards'
            });

            setTimeout(() => confetti.remove(), duration * 1000);
        }
    }

    // 5. Countdown Timer Logic
    const targetDate = new Date('2026-09-26T09:30:00+07:00').getTime();
    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minutesEl = document.getElementById('cd-minutes');
    const secondsEl = document.getElementById('cd-seconds');
    const statusEl = document.getElementById('countdown-status');

    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference <= 0) {
            if (daysEl) daysEl.textContent = '00';
            if (hoursEl) hoursEl.textContent = '00';
            if (minutesEl) minutesEl.textContent = '00';
            if (secondsEl) secondsEl.textContent = '00';
            if (statusEl) statusEl.textContent = '🎉 Giây phút tốt nghiệp rực rỡ đã đến! Chúc mừng tân cử nhân! 🎓✨';
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
        if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);

    // 6. Navigation Bar Scrollspy Logic
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('main > header, main > section');

    function updateActiveNavLink() {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 140; // Offset for floating navbar

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        if (currentSectionId) {
            navItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('href') === `#${currentSectionId}`) {
                    item.classList.add('active');
                }
            });
        }
    }

    window.addEventListener('scroll', updateActiveNavLink, { passive: true });
});
