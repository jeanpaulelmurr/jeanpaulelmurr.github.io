// Guest list (to be populated)
let guestList = [];

// Initialize music player
document.addEventListener('DOMContentLoaded', () => {
    const musicToggle = document.getElementById('musicToggle');
    const backgroundMusic = document.getElementById('backgroundMusic');

    musicToggle.addEventListener('click', () => {
        if (backgroundMusic.paused) {
            backgroundMusic.play();
            musicToggle.textContent = '🎵 Music Playing';
        } else {
            backgroundMusic.pause();
            musicToggle.textContent = '🎵 Play Music';
        }
    });

    // Auto-play on page load (optional - commented out for user preference)
    // backgroundMusic.play();
});

// Check if guest is invited
function checkGuest() {
    const guestInput = document.getElementById('guestInput').value.trim().toLowerCase();
    const resultDiv = document.getElementById('guestResult');

    if (!guestInput) {
        resultDiv.textContent = 'Please enter your name';
        resultDiv.classList.remove('found', 'not-found');
        return;
    }

    const foundGuest = guestList.find(guest => 
        guest.name.toLowerCase() === guestInput
    );

    if (foundGuest) {
        resultDiv.classList.remove('not-found');
        resultDiv.classList.add('found');
        resultDiv.innerHTML = `
            ✓ Welcome, ${foundGuest.name}!<br>
            <small>Number of invitees: ${foundGuest.invitees}</small>
        `;
    } else {
        resultDiv.classList.remove('found');
        resultDiv.classList.add('not-found');
        resultDiv.textContent = '✗ Sorry, we don\'t have your name on the guest list.';
    }
}

// RSVP Response
function rsvpResponse(response) {
    const messageDiv = document.getElementById('rsvpMessage');
    if (response === 'yes') {
        messageDiv.textContent = '✓ Thank you for confirming your attendance! We can\'t wait to celebrate with you!';
        messageDiv.style.color = '#28a745';
    } else {
        messageDiv.textContent = '✗ Thank you for letting us know. We\'ll miss you!';
        messageDiv.style.color = '#dc3545';
    }
}

// Function to populate guest list (call this when you have the list)
function setGuestList(guests) {
    guestList = guests;
}

// Example: setGuestList([
//     { name: 'John Doe', invitees: 2 },
//     { name: 'Jane Smith', invitees: 1 }
// ]);