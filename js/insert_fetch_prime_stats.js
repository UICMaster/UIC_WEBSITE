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

// ... (Keep your escapeHTML helper)

async function loadPrimeStats() {
    const container = document.getElementById('stats-telemetry-list');
    if (!container) return;

    try {
        const response = await fetch(`./prime_stats.json?t=${Date.now()}`);
        const data = await response.json();
        const teamsOrder = ["prime", "spark", "ember", "nova", "abyss", "night", "freezer"];
        
        let fullHTML = '';

        teamsOrder.forEach(key => {
            const s = data[key];
            if (!s) return;

            // 1. Next Match Link Injection
            let nextMatchHTML = '';
            if (s.next_match) {
                const dateObj = new Date(s.next_match.date);
                const dateStr = dateObj.toLocaleDateString('de-DE', { weekday: 'short' }) + 
                                " " + dateObj.toLocaleTimeString('de-DE', { hour: '2-digit', minute:'2-digit' });
                
                nextMatchHTML = `
                    <a href="${s.next_match.link}" target="_blank" class="next-match-badge clickable">
                        <span class="nm-label">NEXT</span>
                        <span class="nm-vs">vs ${escapeHTML(s.next_match.tag)}</span>
                        <span class="nm-time">// ${dateStr}</span>
                    </a>
                `;
            }

            const rosterHTML = s.roster.map(p => `
                <div class="player-card ${p.is_captain ? 'captain' : ''}">
                    <span class="p-name">${escapeHTML(p.summoner)}</span>
                    <span class="p-role">${p.is_captain ? 'CAPTAIN' : 'MEMBER'}</span>
                </div>
            `).join('');

            const wrColor = s.win_rate >= 50 ? "var(--primary)" : "#fff";

            fullHTML += `
                <div class="stats-wrapper" id="team-${key}">
                    <div class="stats-row">
                        
                        <div class="stats-rank-box" onclick="toggleStats('${key}')">
                            <img src="${s.logo || 'assets/default-team.png'}" class="team-logo-img" alt="Logo">
                            <span class="rank-number" style="color:${wrColor}; font-size: 1rem;">${s.win_rate}%</span>
                        </div>

                        <div class="stats-info">
                            <div class="stats-header-group" onclick="toggleStats('${key}')">
                                <h4>UIC ${key.toUpperCase()}</h4>
                                ${nextMatchHTML}
                            </div>
                            <a href="${s.team_link}" target="_blank" class="stats-div-tag link-hover">
                                // ${escapeHTML(s.division)} <i class="external-icon">↗</i>
                            </a>
                        </div>

                        <div class="stats-data-group" onclick="toggleStats('${key}')">
                            <div class="data-point"><span class="label">GAMES</span><span class="value">${s.games}</span></div>
                            <div class="data-point"><span class="label">WINS</span><span class="value" style="color:var(--primary);">${s.wins}</span></div>
                            <div class="data-point"><span class="label">PTS</span><span class="value pts-highlight">${s.points}</span></div>
                        </div>

                        <div class="stats-expand-icon" onclick="toggleStats('${key}')">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                    </div>

                    <div class="stats-bay">
                        <div class="stats-bay-content">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                                <h5 class="roster-header" style="margin:0;">ACTIVE ROSTER</h5>
                                <a href="${s.team_link}" target="_blank" class="action-btn">VIEW FULL PROFILE</a>
                            </div>
                            <div class="roster-grid">
                                ${rosterHTML}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = fullHTML;
    } catch (e) { /* Error handling */ }
}

// Global Toggle Function
window.toggleStats = function(key) {
    const wrapper = document.getElementById(`team-${key}`);
    if (wrapper) {
        wrapper.classList.toggle('active');
    }
}

document.addEventListener('DOMContentLoaded', loadPrimeStats);