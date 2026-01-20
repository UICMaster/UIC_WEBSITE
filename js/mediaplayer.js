document.addEventListener('DOMContentLoaded', () => {

    const playlist = [
        { 
            title: "UIC HYMNE - 2025", 
            src: "assets/audio/ULTRA_INSTINCT_CREW_ORGA_HYMNE_2025.mp3",
            type: "audio",
            art: "",
            artist: "Ultra Instinct Crew"
        },
        { 
            title: "UIC HYMNE - 2026",    
            src: "assets/video/ULTRA_INSTINCT_CREW_ORGA_HYMNE_VIDEO_2026.webm",
            type: "video",
            art: "",
            artist: "Ultra Instinct Crew"
        },
        { 
            title: "UIC RHINO - DISSTRACK",    
            src: "assets/audio/ULTRA_INSTINCT_CREW_PLAYER_RHINO.mp3",
            type: "audio",
            art: "",
            artist: "Ultra Instinct Crew"
        },
        { 
            title: "UIC ANIME - 2025",    
            src: "assets/audio/ULTRA_INSTINCT_CREW_ORGA_ANIME_2025.mp3",
            type: "audio",
            art: "",
            artist: "Ultra Instinct Crew"
        },
        { 
            title: "UIC NIGHT - 2026",    
            src: "assets/audio/ULTRA_INSTINCT_CREW_TEAM_NIGHT_2026.mp3", 
            type: "audio",
            art: "",
            artist: "Ultra Instinct Crew"
        }
    ];

    class MediaController {
        constructor(playlist) {
            this.playlist = playlist;
            this.currentIndex = 0;
            this.isSystemLocked = true; 
            
            this.ui = {
                component: document.getElementById('media-component'),
                miniUi: document.getElementById('mini-ui'),
                engine: document.getElementById('media-engine'),
                art: document.getElementById('track-art'),
                fallbackViz: document.getElementById('fallback-visualizer'),
                
                unmuteOverlay: document.getElementById('overlay-unmute'),
                
                titleFull: document.getElementById('track-title-full'),
                titleMini: document.getElementById('mini-track-title'),
                timeDisplay: document.getElementById('track-time'),
                
                btnPlay: document.getElementById('cmd-play'),
                iconPlay: document.getElementById('icon-play'),
                iconPause: document.getElementById('icon-pause'),
                btnNext: document.getElementById('cmd-next'),
                btnPrev: document.getElementById('cmd-prev'),
                
                btnCollapse: document.getElementById('btn-collapse'),
                btnCinema: document.getElementById('btn-cinema-mode'),
                btnPlaylist: document.getElementById('cmd-playlist-toggle'),
                
                volumeSlider: document.getElementById('volume-slider'),
                progressContainer: document.getElementById('progress-container'),
                progressFill: document.getElementById('progress-fill'),
                drawer: document.getElementById('playlist-drawer'),
            };

            this.init();
        }

        init() {
            this.renderPlaylist();
            this.setupEventListeners();
            this.loadTrack(0);

            // Auto-start muted
            this.ui.engine.volume = 0; 
            this.ui.engine.muted = true;
            this.ui.engine.play().then(() => {
                this.updatePlayIcon(true);
            }).catch(() => {
                this.updatePlayIcon(false);
            });
        }

        loadTrack(index) {
            if (index < 0) index = this.playlist.length - 1;
            if (index >= this.playlist.length) index = 0;
            
            this.currentIndex = index;
            const track = this.playlist[index];

            this.ui.engine.src = track.src;
            this.ui.engine.load();

            // Visual Logic
            if (track.type === 'video') {
                this.ui.art.style.display = 'none';
                this.ui.fallbackViz.classList.add('hidden');
            } else {
                if (track.art && track.art !== "") {
                    this.ui.art.src = track.art;
                    this.ui.art.style.display = 'block';
                    this.ui.fallbackViz.classList.add('hidden');
                } else {
                    this.ui.art.style.display = 'none';
                    this.ui.fallbackViz.classList.remove('hidden');
                }
            }

            this.ui.titleFull.innerText = track.title;
            this.ui.titleMini.innerText = track.title;
            
            this.highlightPlaylistItem(index);
            this.updateMediaSession(track);
            
            if (!this.ui.engine.paused || !this.isSystemLocked) {
                this.ui.engine.play();
                this.updatePlayIcon(true);
            }
        }

        togglePlay() {
            if (this.ui.engine.paused) {
                this.ui.engine.play();
                this.updatePlayIcon(true);
                if (this.isSystemLocked) this.unlockSystem();
            } else {
                this.ui.engine.pause();
                this.updatePlayIcon(false);
            }
        }

        unlockSystem() {
            this.isSystemLocked = false;
            this.ui.engine.muted = false;
            this.ui.unmuteOverlay.classList.add('hidden');
            if(this.ui.engine.volume === 0) this.ui.engine.volume = 0.5;
            this.ui.volumeSlider.value = this.ui.engine.volume;
        }

        // CINEMA ZOOM (CSS Class Toggle)
        toggleCinemaZoom() {
            this.ui.component.classList.toggle('cinema-zoom');
        }

        updatePlayIcon(isPlaying) {
            if (isPlaying) {
                this.ui.iconPlay.classList.add('hidden');
                this.ui.iconPause.classList.remove('hidden');
            } else {
                this.ui.iconPlay.classList.remove('hidden');
                this.ui.iconPause.classList.add('hidden');
            }
        }

        formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }

        // MEDIA SESSION API (Full Integration)
        updateMediaSession(track) {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: track.title,
                    artist: track.artist || "Ultra Instinct Crew",
                    artwork: [
                        { src: track.art || 'assets/img/default_icon.png', sizes: '512x512', type: 'image/jpeg' }
                    ]
                });

                navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
                navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
                navigator.mediaSession.setActionHandler('previoustrack', () => this.loadTrack(this.currentIndex - 1));
                navigator.mediaSession.setActionHandler('nexttrack', () => this.loadTrack(this.currentIndex + 1));
                
                // Seek Handler
                navigator.mediaSession.setActionHandler('seekto', (details) => {
                    if (details.seekTime && this.ui.engine.duration) {
                        this.ui.engine.currentTime = details.seekTime;
                    }
                });
            }
        }

        setupEventListeners() {
            this.ui.btnPlay.addEventListener('click', () => this.togglePlay());
            this.ui.btnNext.addEventListener('click', () => this.loadTrack(this.currentIndex + 1));
            this.ui.btnPrev.addEventListener('click', () => this.loadTrack(this.currentIndex - 1));
            this.ui.unmuteOverlay.addEventListener('click', () => this.unlockSystem());

            // Expand / Collapse
            this.ui.btnCollapse.addEventListener('click', () => {
                this.ui.component.classList.add('collapsed');
                this.ui.component.classList.remove('cinema-zoom'); // Reset zoom on collapse
                this.ui.drawer.classList.remove('open');
            });
            this.ui.miniUi.addEventListener('click', () => {
                this.ui.component.classList.remove('collapsed');
            });

            // Cinema Mode (Zoom)
            this.ui.btnCinema.addEventListener('click', () => this.toggleCinemaZoom());

            // Playlist
            this.ui.btnPlaylist.addEventListener('click', () => {
                this.ui.drawer.classList.toggle('open');
            });

            this.ui.volumeSlider.addEventListener('input', (e) => {
                this.ui.engine.volume = e.target.value;
                if(this.ui.engine.muted && e.target.value > 0) this.unlockSystem();
            });

            this.ui.engine.addEventListener('timeupdate', () => {
                if (this.ui.engine.duration) {
                    const percent = (this.ui.engine.currentTime / this.ui.engine.duration) * 100;
                    this.ui.progressFill.style.width = percent + "%";
                    this.ui.timeDisplay.innerText = this.formatTime(this.ui.engine.currentTime);
                }
            });

            this.ui.progressContainer.addEventListener('click', (e) => {
                const rect = this.ui.progressContainer.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const width = rect.width;
                if (this.ui.engine.duration) {
                    this.ui.engine.currentTime = (clickX / width) * this.ui.engine.duration;
                }
            });
            
            this.ui.engine.addEventListener('ended', () => this.loadTrack(this.currentIndex + 1));
        }

        renderPlaylist() {
            this.ui.drawer.innerHTML = '';
            this.playlist.forEach((track, idx) => {
                const el = document.createElement('div');
                el.className = 'playlist-item';
                el.innerText = `${idx + 1}. ${track.title}`;
                el.addEventListener('click', () => this.loadTrack(idx));
                this.ui.drawer.appendChild(el);
            });
        }

        highlightPlaylistItem(index) {
            const items = this.ui.drawer.querySelectorAll('.playlist-item');
            items.forEach(item => item.classList.remove('active'));
            if (items[index]) items[index].classList.add('active');
        }
    }

    const myPlayer = new MediaController(playlist);
});