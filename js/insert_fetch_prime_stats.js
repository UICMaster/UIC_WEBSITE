// Helper: Prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
}

async function loadPrimeStats() {
    const container = document.getElementById('stats-telemetry-list');
    if (!container) return;

    try {
        // Cache bust with timestamp
        const response = await fetch(`./prime_stats.json?t=${Date.now()}`);
        if (!response.ok) throw new Error("Database Offline");
        
        const data = await response.json();
        const teamsOrder = ["prime", "spark", "ember", "nova", "abyss", "night", "freezer"];
        
        let fullHTML = ''; // Build string in memory first

        teamsOrder.forEach(key => {
            const s = data[key];
            if (!s) return;

            // 1. Next Match Logic
            let nextMatchHTML = '';
            if (s.next_match) {
                const dateObj = new Date(s.next_match.date);
                const dateStr = dateObj.toLocaleDateString('de-DE', { weekday: 'short' }) + 
                                " " + 
                                dateObj.toLocaleTimeString('de-DE', { hour: '2-digit', minute:'2-digit' });
                
                nextMatchHTML = `
                    <div class="next-match-badge">
                        <span class="nm-label">NEXT</span>
                        <span class="nm-vs">vs ${escapeHTML(s.next_match.tag)}</span>
                        <span class="nm-time">// ${dateStr}</span>
                    </div>
                `;
            }

            // 2. Roster Logic
            const rosterHTML = s.roster.map(p => `
                <div class="player-card ${p.is_captain ? 'captain' : ''}">
                    <span class="p-name">${escapeHTML(p.summoner)}</span>
                    <span class="p-role">${p.is_captain ? 'CAPTAIN' : 'MEMBER'}</span>
                </div>
            `).join('');

            // 3. Visuals
            const wrColor = s.win_rate >= 50 ? "var(--accent-green, #4ade80)" : "#fff";
            const teamName = key.toUpperCase();

            // 4. Construct Row
            fullHTML += `
                <div class="stats-wrapper" id="team-${key}">
                    <div class="stats-row" onclick="toggleStats('${key}')" role="button" tabindex="0">
                        
                        <div class="stats-rank-box">
                            <span class="rank-label">WIN RATE</span>
                            <span class="rank-number" style="color:${wrColor}">${s.win_rate}%</span>
                        </div>

                        <div class="stats-info">
                            <div class="stats-header-group">
                                <h4>UIC ${teamName}</h4>
                                ${nextMatchHTML}
                            </div>
                            <span class="stats-div-tag">// ${escapeHTML(s.division)}</span>
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

                        <div class="stats-expand-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    <div class="stats-bay">
                        <div class="stats-bay-content">
                            <h5 class="roster-header">ACTIVE ROSTER</h5>
                            <div class="roster-grid">
                                ${rosterHTML}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = fullHTML;

    } catch (e) {
        console.error("Stats Error:", e);
        container.innerHTML = `<div class="error-msg">Telemetry Offline.</div>`;
    }
}

// Global Toggle Function
window.toggleStats = function(key) {
    const wrapper = document.getElementById(`team-${key}`);
    if (wrapper) {
        wrapper.classList.toggle('active');
    }
}

document.addEventListener('DOMContentLoaded', loadPrimeStats);