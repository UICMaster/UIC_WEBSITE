document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIGURATION ---
    const playlist = [
        { title: "UIC HYMNE - 2025", src: "assets/audio/ULTRA_INSTINCT_CREW_AUDIO_2025.mp3" },
        { title: "UIC HYMNE - 2026", src: "assets/audio/ULTRA_INSTINCT_CREW_AUDIO_2026.mp3" }
    ];

    // --- 2. UI ELEMENTS ---
    const audioEngine = document.getElementById('audio-engine');
    const deck         = document.getElementById('command-deck');
    const trigger      = document.getElementById('deck-trigger');
    const progressContainer = document.getElementById('deck-progress-bar');
    const progressFill = document.getElementById('deck-progress-fill');
    const visualizer   = document.getElementById('visualizer');
    
    const trackMini    = document.getElementById('deck-track-mini');
    const trackFull    = document.getElementById('deck-track-full');
    const statusText   = document.getElementById('deck-status-text');
    
    const btnPlay      = document.getElementById('cmd-play');
    const iconPlay     = document.getElementById('icon-play');
    const iconPause    = document.getElementById('icon-pause');
    const btnMute      = document.getElementById('cmd-mute-toggle');

    // --- 3. STATE ---
    let currentIdx = 0;
    let isUnlocked = false; // Tracks if user has interacted to allow sound

    // --- 4. CORE FUNCTIONS ---

    function loadTrack(index) {
        // Wrap index
        if (index < 0) index = playlist.length - 1;
        if (index >= playlist.length) index = 0;
        
        currentIdx = index;
        const track = playlist[index];
        
        audioEngine.src = track.src;
        trackMini.textContent = track.title;
        trackFull.textContent = track.title;
        
        // Reset progress UI
        progressFill.style.width = "0%";
    }

    function togglePlayback() {
        if (audioEngine.paused) {
            audioEngine.play().catch(e => console.warn("Playback blocked: Need user interaction."));
            updateUI(true);
        } else {
            audioEngine.pause();
            updateUI(false);
        }
    }

    function updateUI(isPlaying) {
        // Toggle Play/Pause Icons
        iconPlay.classList.toggle('hidden', isPlaying);
        iconPause.classList.toggle('hidden', !isPlaying);
        
        // Visualizer Animation Control
        if (visualizer) {
            visualizer.style.animationPlayState = isPlaying ? 'running' : 'paused';
            visualizer.querySelectorAll('.vis-bar').forEach(bar => {
                bar.style.animationPlayState = isPlaying ? 'running' : 'paused';
            });
        }
    }

    function setMuteState(muted) {
        audioEngine.muted = muted;
        if (!muted) {
            isUnlocked = true;
            statusText.textContent = "AUDIO LÄUFT";
            statusText.classList.remove('blink-warning');
            statusText.style.color = "var(--primary)";
            btnMute.textContent = "AUDIO STUMMEN";
            btnMute.classList.add('unlocked');
        } else {
            statusText.textContent = "AUDIO STUMM";
            statusText.classList.add('blink-warning');
            statusText.style.color = "";
            btnMute.textContent = "VERSTUMMUNG AUFHEBEN";
            btnMute.classList.remove('unlocked');
        }
    }

    // --- 5. INTERACTIVE EVENTS ---

    // Toggle Deck Expansion
    trigger.addEventListener('click', () => {
        deck.classList.toggle('collapsed');
        const isExpanded = !deck.classList.contains('collapsed');
        trigger.setAttribute('aria-expanded', isExpanded);
    });

    // Master Play Button
    btnPlay.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isUnlocked) setMuteState(false);
        togglePlayback();
    });

    // Mute/Unlock Button
    btnMute.addEventListener('click', (e) => {
        e.stopPropagation();
        setMuteState(!audioEngine.muted);
        if (!audioEngine.muted && audioEngine.paused) togglePlayback();
    });

    // Next/Prev
    document.getElementById('cmd-next').addEventListener('click', () => {
        loadTrack(currentIdx + 1);
        audioEngine.play();
        updateUI(true);
    });

    document.getElementById('cmd-prev').addEventListener('click', () => {
        loadTrack(currentIdx - 1);
        audioEngine.play();
        updateUI(true);
    });

    // Progress Bar: Update
    audioEngine.addEventListener('timeupdate', () => {
        if (audioEngine.duration) {
            const percent = (audioEngine.currentTime / audioEngine.duration) * 100;
            progressFill.style.width = `${percent}%`;
        }
    });

    // Progress Bar: Scrubbing (Click to skip)
    progressContainer.addEventListener('click', (e) => {
        const width = progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = audioEngine.duration;
        if (duration) {
            audioEngine.currentTime = (clickX / width) * duration;
        }
    });

    // Auto-advance
    audioEngine.addEventListener('ended', () => {
        loadTrack(currentIdx + 1);
        audioEngine.play();
    });

    // --- 6. INITIALIZATION ---
    function init() {
        loadTrack(0);
        audioEngine.volume = 0.5;
        
        // Start muted to comply with Autoplay Policies
        audioEngine.muted = true; 
        
        const autoPlayPromise = audioEngine.play();
        if (autoPlayPromise !== undefined) {
            autoPlayPromise.then(() => {
                updateUI(true); // Visualizer starts moving, but silent
            }).catch(() => {
                updateUI(false); // Fully blocked, wait for click
            });
        }
    }

    init();
});