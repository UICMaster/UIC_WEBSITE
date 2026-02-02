async function loadPrimeStats() {
    const container = document.getElementById('stats-telemetry-list');
    if (!container) return;

    try {
        const response = await fetch('./prime_stats.json?t=' + Date.now());
        if (!response.ok) throw new Error("Offline");
        const data = await response.json();
        
        const teams = ["prime", "spark", "ember", "nova", "abyss", "night", "freezer"];
        container.innerHTML = ''; 

        teams.forEach(key => {
            const s = data[key];
            if (s) {
                // 1. Next Match HTML
                let nextMatchHTML = '';
                if (s.next_match) {
                    const dateObj = new Date(s.next_match.date);
                    const dateStr = dateObj.toLocaleDateString('de-DE', { weekday: 'short' }) + 
                                  " " + dateObj.toLocaleTimeString('de-DE', { hour: '2-digit', minute:'2-digit' });
                    
                    nextMatchHTML = `
                        <div class="next-match-badge">
                            <span class="nm-label">NEXT</span>
                            <span class="nm-vs">vs ${s.next_match.tag}</span>
                            <span class="nm-time">// ${dateStr}</span>
                        </div>
                    `;
                }

                // 2. Roster HTML
                const rosterHTML = s.roster.map(p => `
                    <div class="player-card ${p.is_captain ? 'captain' : ''}">
                        <span class="p-name">${p.summoner}</span>
                        <span class="p-role">${p.is_captain ? 'CAPTAIN' : 'MEMBER'}</span>
                    </div>
                `).join('');

                // 3. Win Rate Color
                const wrColor = s.win_rate >= 50 ? "var(--primary)" : "#fff";

                // 4. THE ROW HTML
                const itemHTML = `
                    <div class="stats-wrapper" id="team-${key}">
                        <div class="stats-row" onclick="toggleStats('${key}')">
                            
                            <div class="stats-rank-box">
                                <span class="rank-label">WIN RATE</span>
                                <span class="rank-number" style="color:${wrColor}">${s.win_rate}%</span>
                            </div>

                            <div class="stats-info">
                                <div style="display:flex; align-items:center; flex-wrap:wrap;">
                                    <h4>UIC ${key.toUpperCase()}</h4>
                                    ${nextMatchHTML}
                                </div>
                                <span class="stats-div-tag">// ${s.division}</span>
                            </div>

                            <div class="stats-data-group">
                                <div class="data-point">
                                    <span class="label">GAMES</span>
                                    <span class="value">${s.games}</span>
                                </div>
                                <div class="data-point">
                                    <span class="label">WINS</span>
                                    <span class="value" style="color:#4ade80;">${s.wins}</span>
                                </div>
                                <div class="data-point">
                                    <span class="label">PTS</span>
                                    <span class="value pts-highlight">${s.points}</span>
                                </div>
                            </div>

                            <div class="stats-expand-btn">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </div>

                        <div class="stats-bay">
                            <div class="stats-bay-content">
                                <h5 style="grid-column:1/-1; margin:0 0 10px 0; color:#888; font-size:0.7rem;">ACTIVE ROSTER</h5>
                                ${rosterHTML}
                            </div>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', itemHTML);
            }
        });

    } catch (e) {
        console.error("Stats Error:", e);
    }
}

// 5. GLOBAL TOGGLE FUNCTION
window.toggleStats = function(key) {
    const wrapper = document.getElementById(`team-${key}`);
    if (wrapper) {
        wrapper.classList.toggle('active');
    }
}

document.addEventListener('DOMContentLoaded', loadPrimeStats);