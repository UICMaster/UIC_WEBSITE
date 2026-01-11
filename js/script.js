function openTeam(evt, teamName) {
    // 1. Get all elements with class="team-content" and hide them
    var teamContents = document.getElementsByClassName("team-content");
    for (var i = 0; i < teamContents.length; i++) {
        teamContents[i].classList.remove("active");
    }

    // 2. Get all buttons with class="tab-btn" and remove the class "active"
    var tabLinks = document.getElementsByClassName("tab-btn");
    for (var i = 0; i < tabLinks.length; i++) {
        tabLinks[i].classList.remove("active");
    }

    // 3. Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(teamName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

function toggleMenu() {
    // Select all the elements we need to change
    const hamburger = document.querySelector('.hamburger');
    const overlay = document.querySelector('.mobile-menu-overlay');
    const panel = document.querySelector('.mobile-nav-panel');
    
    // Toggle the 'active' class on ALL of them
    hamburger.classList.toggle('active'); // Triggers the X animation
    overlay.classList.toggle('active');   // Shows the dark background
    panel.classList.toggle('active');     // Slides the menu in
}

/* --- STATS COUNTER ANIMATION --- */
const statsSection = document.querySelector('.stats-section');
const statNumbers = [
    { id: 'stat-matches', endValue: 142, suffix: '' },
    { id: 'stat-wr', endValue: 68, suffix: '%' },
    { id: 'stat-players', endValue: 30, suffix: '+' },
    { id: 'stat-cups', endValue: 12, suffix: '' } // Ensure you added this ID in HTML
];

let started = false; // Ensure animation only runs once

function startCounting() {
    if (started) return; // Stop if already ran
    started = true;

    statNumbers.forEach(stat => {
        const element = document.getElementById(stat.id);
        if (!element) return; // Skip if ID not found

        let startValue = 0;
        let duration = 2000; // 2 seconds
        let startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            
            // Calculate current number
            element.innerText = Math.floor(progress * stat.endValue) + stat.suffix;

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        }
        
        window.requestAnimationFrame(step);
    });
}

// Trigger animation when Stats Section is visible
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        startCounting();
    }
}, { threshold: 0.5 }); // Start when 50% of section is visible

if (statsSection) {
    observer.observe(statsSection);
}

/* --- PWA SERVICE WORKER REGISTRATION --- */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}