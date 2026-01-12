/* =========================================
   TEAM TAB SWITCHER
   ========================================= */
function openTeam(evt, teamName) {
    // 1. Hide all elements with class="team-grid"
    var teamGrids = document.getElementsByClassName("team-grid");
    for (var i = 0; i < teamGrids.length; i++) {
        teamGrids[i].classList.remove("active");
    }

    // 2. Remove "active" class from all tab buttons
    var tabLinks = document.getElementsByClassName("tab-btn");
    for (var i = 0; i < tabLinks.length; i++) {
        tabLinks[i].classList.remove("active");
    }

    // 3. Show the current team, and make the clicked button active
    document.getElementById(teamName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

// Close mobile menu when a link is clicked
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        document.getElementById('nav-toggle').checked = false;
    });
});

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