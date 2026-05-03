function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
}

let primeDataCache = null;

async function loadPrimeStats() {
    try {
        // Cache Busting
        const response = await fetch(`./prime_stats.json?t=${Date.now()}`);
        if (!response.ok) throw new Error("JSON Missing");
        primeDataCache = await response.json();
        
        // 1. Populate Global Health
        if (primeDataCache.global) {
            document.getElementById('stat-matches').innerText = primeDataCache.global.matches;
            document.getElementById('stat-wr').innerText = primeDataCache.global.wr + '%';
            document.getElementById('stat-players').innerText = primeDataCache.global.players;
        }

        // 2. Build Sidebar Navigation
        const tabsContainer = document.getElementById('stats-team-tabs');
        const teamsOrder = primeDataCache.config?.teamsOrder || Object.keys(primeDataCache.teams);
        
        tabsContainer.innerHTML = teamsOrder.map((key, index) => {
            if (!primeDataCache.teams[key]) return '';
            return `<button class="stat-tab-btn ${index === 0 ? 'active' : ''}" data-team="${key}">UIC ${key}</button>`;
        }).join('');

        // 3. Render initial team
        if (teamsOrder.length > 0) renderTeamTelemetry(teamsOrder[0]);

        // 4. Event Delegation for Tabs
        tabsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('stat-tab-btn')) {
                document.querySelectorAll('.stat-tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                renderTeamTelemetry(e.target.dataset.team);
            }
        });

    } catch (e) { 
        console.error("Telemetry Sync Error:", e);
        document.getElementById('telemetry-output').innerHTML = `<div class="terminal-loader" style="color: #ff0055;">> ERROR: PRIME API OFFLINE</div>`;
    }
}

function renderTeamTelemetry(teamKey) {
    const t = primeDataCache.teams[teamKey];
    if (!t) return;

    const outputArea = document.getElementById('telemetry-output');
    
    // Add image fallback for broken Riot/Prime logos
    const logoImg = `<img src="${t.logo || 'assets/placeholder.png'}" onerror="this.onerror=null;this.src='assets/placeholder.png';" style="width: 80px; height: 80px; border-radius: 50%; border: 1px solid var(--primary); object-fit: cover;">`;

    outputArea.innerHTML = `
        <div class="telemetry-bento">
            
            <div class="t-card" style="display: flex; align-items: center; gap: 20px;">
                ${logoImg}
                <div>
                    <div class="t-card-header" style="margin-bottom: 5px;">${t.meta.div || 'DIVISION TBD'}</div>
                    <div class="t-points">${t.stats.points} <span>PKT</span></div>
                </div>
            </div>

            <div class="t-card">
                <div class="t-card-header">SEASON PERFORMANCE</div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 1.5rem; color: #fff; font-family: var(--font-head);">${t.stats.wins}W - ${t.stats.losses}L</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); letter-spacing: 1px;">MAP SCORE</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.5rem; color: var(--primary); font-family: var(--font-head);">${t.stats.win_rate}%</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); letter-spacing: 1px;">WIN RATE</div>
                    </div>
                </div>
            </div>

            <div class="t-card span-2" style="border-left: 2px solid ${t.last_match?.result === 'SIEG' ? '#00ff88' : '#ff0055'};">
                <div class="t-card-header">LETZTES MATCH ${t.last_match ? `// ${new Date(t.last_match.date).toLocaleDateString('de-DE')}` : ''}</div>
                ${t.last_match ? `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 1.2rem; color: #fff; font-family: var(--font-head);">VS ${escapeHTML(t.last_match.enemy)}</div>
                        <div style="font-size: 1.5rem; font-family: var(--font-head); color: ${t.last_match.result === 'SIEG' ? '#00ff88' : '#ff0055'};">${t.last_match.score}</div>
                    </div>
                ` : '<div style="color: var(--text-muted); font-size: 0.9rem;">Keine historischen Matchdaten verfügbar.</div>'}
            </div>

            <div class="t-card span-2">
                <div class="t-card-header">NÄCHSTES MATCH</div>
                ${t.next_match ? `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 1.2rem; color: #fff; font-family: var(--font-head);">VS ${escapeHTML(t.next_match.tag)}</div>
                        <a href="${t.next_match.link}" target="_blank" class="btn-obsidian-ghost" style="padding: 6px 15px; font-size: 0.7rem;">PRIME LEAGUE ↗</a>
                    </div>
                ` : '<div style="color: var(--text-muted); font-size: 0.9rem;">Aktuell kein Match angesetzt.</div>'}
            </div>

        </div>
    `;
}

document.addEventListener('DOMContentLoaded', loadPrimeStats);
