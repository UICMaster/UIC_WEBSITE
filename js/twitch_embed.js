document.addEventListener("DOMContentLoaded", function() {
    const loadBtn = document.getElementById("load-twitch-btn");
    const container = document.getElementById("twitch-embed");

    // Prüfen ob die Elemente existieren
    if (loadBtn && container) {
        loadBtn.addEventListener("click", function() {
            
            // 1. Overlay entfernen
            container.innerHTML = ""; 
            
            // 2. Klasse für Styling anpassen (optional, falls nötig)
            container.classList.remove("twitch-placeholder");

            // 3. Twitch Player laden
            new Twitch.Embed("twitch-embed", {
                width: "100%",
                height: 500,
                channel: "ultrainstinctcrew",
                layout: "video", 
                autoplay: true, // Jetzt darf es autostarten, weil User geklickt hat
                muted: false,
                parent: ["ultrainstinctcrew.com", "uicmaster.github.io"] // BEIDE Domains wichtig für GitHub Pages!
            });
        });
    }
});