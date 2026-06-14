// Guest list (to be populated)
let guestList = [
    { name: 'Jean Paul El Murr', invitees: 1 },
    { name: 'Vanessa', invitees: 1 },
    { name: 'Family Member 1', invitees: 2 },
    { name: 'Family Member 2', invitees: 3 },
    { name: 'Friend 1', invitees: 2 },
    { name: 'Friend 2', invitees: 1 }
];

let rsvpData = {};

// Initialize music player
document.addEventListener('DOMContentLoaded', () => {
    // ensure page starts at top (avoid restored scroll)
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const musicToggle = document.getElementById('musicToggle');
    const backgroundMusic = document.getElementById('backgroundMusic');
    const navToggle = document.getElementById('navToggle');
    const navbar = document.querySelector('.navbar');

    // Music player functionality
    if (musicToggle && backgroundMusic) {
        musicToggle.addEventListener('click', () => {
            if (backgroundMusic.paused) {
                backgroundMusic.play();
                musicToggle.textContent = 'Music Playing';
                musicToggle.style.opacity = '0.8';
            } else {
                backgroundMusic.pause();
                musicToggle.textContent = 'Play Music';
                musicToggle.style.opacity = '1';
            }
        });
    }

    // Mobile nav toggle
    if (navToggle && navbar) {
        navToggle.addEventListener('click', () => {
            navbar.classList.toggle('nav-open');
        });
    }

    // Smooth scroll for all in-page anchors (handles offset for fixed navbar)
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href || href === '#') return;
            if (href.startsWith('#')) {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const topOffset = document.querySelector('.navbar')?.offsetHeight || 0;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - topOffset - 16;
                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                    // close mobile nav if open
                    navbar.classList.remove('nav-open');
                }
            }
        });
    });
});

// Check if guest is invited
function checkGuest() {
    const guestInput = document.getElementById('guestInput').value.trim();
    const resultDiv = document.getElementById('guestResult');

    if (!guestInput) {
        resultDiv.textContent = 'Please enter your name';
        resultDiv.classList.remove('found', 'not-found');
        return;
    }

    const foundGuest = guestList.find(guest => 
        guest.name.toLowerCase() === guestInput.toLowerCase()
    );

    if (foundGuest) {
        resultDiv.classList.remove('not-found');
        resultDiv.classList.add('found');
        resultDiv.innerHTML = `
            <div style="padding: 1rem;">
                <strong>Welcome, ${foundGuest.name}!</strong><br>
                <small>You have ${foundGuest.invitees} ${foundGuest.invitees === 1 ? 'seat' : 'seats'}</small>
            </div>
        `;
    } else {
        resultDiv.classList.remove('found');
        resultDiv.classList.add('not-found');
        resultDiv.innerHTML = `
            <div style="padding: 1rem;">
                <strong>Not Found</strong><br>
                <small>We don't have your name on the guest list. Please contact us!</small>
            </div>
        `;
    }
}

// RSVP Response
function rsvpResponse(response) {
    const messageDiv = document.getElementById('rsvpMessage');
    const guestName = document.getElementById('guestInput').value.trim();

    if (!guestName) {
        messageDiv.textContent = 'Please check your invitation first.';
        messageDiv.style.color = '#bfa85b';
        return;
    }

    const foundGuest = guestList.find(guest => 
        guest.name.toLowerCase() === guestName.toLowerCase()
    );

    if (!foundGuest) {
        messageDiv.textContent = 'Please enter a valid name from the guest list.';
        messageDiv.style.color = '#bfa85b';
        return;
    }

    rsvpData[guestName] = response;

    if (response === 'yes') {
        messageDiv.innerHTML = `
            <div style="padding: 1rem; font-weight: bold;">
                Thank you for confirming!<br>
                <small>We can't wait to celebrate with you and your ${foundGuest.invitees} ${foundGuest.invitees === 1 ? 'guest' : 'guests'}.</small>
            </div>
        `;
        messageDiv.style.color = '#2c3e50';
    } else {
        messageDiv.innerHTML = `
            <div style="padding: 1rem; font-weight: bold;">
                We understand<br>
                <small>We'll miss you at the celebration.</small>
            </div>
        `;
        messageDiv.style.color = '#666666';
    }

    // Clear input after RSVP
    setTimeout(() => {
        document.getElementById('guestInput').value = '';
    }, 1000);
}

// Function to populate guest list
function setGuestList(guests) {
    guestList = guests;
}

// Allow Enter key to check guest
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('guestInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkGuest();
    });
});