document.addEventListener("DOMContentLoaded", function() {
    // --- CONFIGURATION ---
    const config = {
        buttonId: "load-twitch-btn",
        containerId: "twitch-embed",
        channel: "ultrainstinctcrew",
        // Valid domains for Twitch Parent policy (add localhost for testing if needed)
        parents: ["ultrainstinctcrew.com", "uicmaster.github.io"],
        storageKey: "twitch-consent-given"
    };

    const loadBtn = document.getElementById(config.buttonId);
    const container = document.getElementById(config.containerId);

    // 1. Helper: Dynamically load Twitch Script
    function loadTwitchLib(callback) {
        // If script is already there, just run callback
        if (window.Twitch && window.Twitch.Embed) {
            callback();
            return;
        }
        
        // Create script tag
        const script = document.createElement("script");
        script.setAttribute("src", "https://embed.twitch.tv/embed/v1.js");
        script.onload = callback; // Run callback when loaded
        document.body.appendChild(script);
    }

    // 2. Helper: Build the Player
    function renderPlayer() {
        if (!container) return;

        // Clear the overlay text/button
        container.innerHTML = "";
        
        // Remove the placeholder styling (background/border)
        // Note: min-height in CSS keeps the size stable
        container.classList.remove("twitch-placeholder");

        // Initialize Twitch
        new Twitch.Embed(config.containerId, {
            width: "100%",
            height: "100%", // Fills the CSS min-height
            channel: config.channel,
            layout: "video", 
            autoplay: true, // Auto-plays only AFTER user explicitly clicked "Start"
            muted: false,
            parent: config.parents
        });
    }

    // 3. Main Action
    function activateTwitch() {
        // Save consent to Session (clears when browser closes)
        sessionStorage.setItem(config.storageKey, "true");
        
        // Load Lib -> Then Render
        loadTwitchLib(renderPlayer);
    }

    // --- LOGIC ---
    
    // A. Check if user already allowed it in this session
    if (sessionStorage.getItem(config.storageKey) === "true") {
        activateTwitch();
    }

    // B. Wait for click
    if (loadBtn) {
        loadBtn.addEventListener("click", function(e) {
            e.preventDefault();
            activateTwitch();
        });
    }
});