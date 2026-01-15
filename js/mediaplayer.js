document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIGURATION: YOUR PLAYLIST ---
    const playlist = [
        { 
            title: "UIC ANTHEM - 2025", 
            src: "assets/audio/ULTRA_INSTINCT_CREW_AUDIO_2025.mp3"
        },
        { 
            title: "UIC ANTHEM - 2026",    
            src: "assets/audio/ULTRA_INSTINCT_CREW_AUDIO_2026.mp3" 
        }
    ];

    // --- 2. UI ELEMENTS ---
    const audioEngine = document.getElementById('audio-engine');
    const deck = document.getElementById('command-deck');
    const trigger = document.getElementById('deck-trigger');
    
    const trackMini = document.getElementById('deck-track-mini');
    const trackFull = document.getElementById('deck-track-full');
    const statusText = document.getElementById('deck-status-text');
    
    const btnPlay = document.getElementById('cmd-play');
    const iconPlay = document.getElementById('icon-play');
    const iconPause = document.getElementById('icon-pause');
    
    const btnNext = document.getElementById('cmd-next');
    const btnPrev = document.getElementById('cmd-prev');
    const btnMute = document.getElementById('cmd-mute-toggle');
    const progress = document.getElementById('deck-progress-fill');

    // --- 3. STATE VARIABLES ---
    let currentIdx = 0;
    let isSystemLocked = true; // Browser default state is locked/muted

    // --- 4. FUNCTIONS ---

    function loadTrack(index) {
        // Ensure index wraps around correctly
        if (index < 0) index = playlist.length - 1;
        if (index >= playlist.length) index = 0;
        
        audioEngine.src = playlist[index].src;
        trackMini.innerText = playlist[index].title;
        trackFull.innerText = playlist[index].title;
        currentIdx = index;
    }

    function updateIcons(isPlaying) {
        if (isPlaying) {
            iconPlay.classList.add('hidden');
            iconPause.classList.remove('hidden');
        } else {
            iconPlay.classList.remove('hidden');
            iconPause.classList.add('hidden');
        }
    }

    // Handles the Mute/Unmute UI and Logic
    function setSystemState(locked) {
        isSystemLocked = locked;
        audioEngine.muted = locked;

        if (locked) {
            statusText.innerText = "AUDIO STUMM";
            statusText.classList.add('blink-warning');
            statusText.style.color = ""; // Reset color
            btnMute.innerText = "VERSTUMMUNG AUFHEBEN";
            btnMute.classList.remove('unlocked');
        } else {
            statusText.innerText = "AUDIO LÄUFT";
            statusText.classList.remove('blink-warning');
            statusText.style.color = "var(--primary)";
            btnMute.innerText = "AUDIO STUMMEN";
            btnMute.classList.add('unlocked');
        }
    }

    // --- 5. INITIALIZATION SEQUENCE ---
    function initAudio() {
        loadTrack(0);
        audioEngine.volume = 0.5; 
        audioEngine.muted = true; // Start muted to allow Autoplay
        
        // Try to play immediately
        let playPromise = audioEngine.play();

        if (playPromise !== undefined) {
            playPromise.then(_ => {
                // Audio is playing (but muted)
                updateIcons(true);
            }).catch(error => {
                // Auto-play blocked entirely
                console.log("Auto-play blocked. Waiting for user.");
                updateIcons(false);
            });
        }
    }

    // --- 6. EVENT LISTENERS ---

    // EXPAND & UNLOCK
    trigger.addEventListener('click', () => {
        deck.classList.toggle('collapsed');
    });

    // PLAY / PAUSE
    btnPlay.addEventListener('click', () => {
        if (audioEngine.paused) {
            audioEngine.play();
            updateIcons(true);
        } else {
            audioEngine.pause();
            updateIcons(false);
        }
        
        // Any interaction on the main button should unlock audio
        if (isSystemLocked) setSystemState(false);
    });

    // UNLOCK / MUTE BUTTON
    btnMute.addEventListener('click', () => {
        if (isSystemLocked) {
            setSystemState(false); // Unmute
            audioEngine.play(); // Ensure it plays
            updateIcons(true);
        } else {
            setSystemState(true); // Mute
        }
    });

    // NEXT
    btnNext.addEventListener('click', () => {
        loadTrack(currentIdx + 1);
        if (!isSystemLocked) audioEngine.play();
        updateIcons(!audioEngine.paused);
    });

    // PREV
    btnPrev.addEventListener('click', () => {
        loadTrack(currentIdx - 1);
        if (!isSystemLocked) audioEngine.play();
        updateIcons(!audioEngine.paused);
    });

    // PROGRESS BAR
    audioEngine.addEventListener('timeupdate', () => {
        if (audioEngine.duration) {
            const percent = (audioEngine.currentTime / audioEngine.duration) * 100;
            progress.style.width = percent + "%";
        }
    });

    // AUTO NEXT
    audioEngine.addEventListener('ended', () => {
        // 1. Load the next track (Math handled in loadTrack function)
        loadTrack(currentIdx + 1);
        
        // 2. Play immediately
        let playPromise = audioEngine.play();
        
        // 3. Ensure UI reflects "Playing" state
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                updateIcons(true);
            }).catch(error => {
                console.log("Auto-play blocked by browser.");
            });
        }
    });

    // --- START ---
    initAudio();

});