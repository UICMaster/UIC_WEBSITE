function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
}

let primeDataCache = null;

async function loadPrimeStats() {
    try {
        const response = await fetch(`./prime_stats.json?t=${Date.now()}`);
        if (!response.ok) throw new Error("JSON Missing");
        primeDataCache = await response.json();
        
        if (primeDataCache.global) {
            document.getElementById('stat-matches').innerText = primeDataCache.global.matches;
            document.getElementById('stat-wr').innerText = primeDataCache.global.wr + '%';
            document.getElementById('stat-players').innerText = primeDataCache.global.players;
        }

        const tabsContainer = document.getElementById('stats-team-tabs');
        const teamsOrder = primeDataCache.config?.teamsOrder || Object.keys(primeDataCache.teams);
        
        let tabsHTML = `<button class="matrix-btn active" data-team="GLOBAL">[ ORGANISATION ]</button>`;
        tabsHTML += teamsOrder.map((key) => {
            if (!primeDataCache.teams[key]) return '';
            return `<button class="matrix-btn" data-team="${key}">UIC ${key.toUpperCase()}</button>`;
        }).join('');
        
        tabsContainer.innerHTML = tabsHTML;

        renderGlobalRadar();

        tabsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('matrix-btn')) {
                document.querySelectorAll('.matrix-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const target = e.target.dataset.team;
                if (target === 'GLOBAL') {
                    renderGlobalRadar();
                } else {
                    renderTeamTelemetry(target);
                }
            }
        });

    } catch (e) { 
        console.error("Daten-Ladefehler:", e);
        document.getElementById('telemetry-output').innerHTML = `<div class="terminal-loader" style="color: #ff0055;">> VERBINDUNGSFEHLER ZUR PRIME API</div>`;
    }
}

function renderGlobalRadar() {
    const radarData = primeDataCache.global.radar || [];
    const outputArea = document.getElementById('telemetry-output');

    if (radarData.length === 0) {
        outputArea.innerHTML = `<div class="wire-card"><div style="color: var(--text-muted);">Keine anstehenden Spiele gefunden.</div></div>`;
        return;
    }

    const radarRows = radarData.map(m => {
        const d = new Date(m.date);
        const dateStr = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        const timeStr = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="radar-row">
                <div class="r-date"><span>${dateStr}</span><span style="color: #fff;">${timeStr} UHR</span></div>
                <div class="r-matchup"><span style="color: var(--text-muted);">UIC ${m.team_key}</span> VS ${escapeHTML(m.enemy)}</div>
                <a href="${m.link}" target="_blank" class="btn-obsidian-ghost" style="padding: 5px 15px; font-size: 0.6rem;">PRIME LEAGUE ↗</a>
            </div>
        `;
    }).join('');

    outputArea.innerHTML = `
        <div class="data-grid" style="grid-template-columns: 1fr;">
            <div class="wire-card">
                <div class="wire-header"><span style="color: var(--secondary);">[ ALLE TEAMS ]</span> <span>NÄCHSTE SPIELE</span></div>
                <div class="radar-list">
                    ${radarRows}
                </div>
            </div>
        </div>
    `;
}

function renderTeamTelemetry(teamKey) {
    const t = primeDataCache.teams[teamKey];
    if (!t) return;

    const outputArea = document.getElementById('telemetry-output');
    const totalMaps = t.stats.wins + t.stats.losses;
    const winRatio = totalMaps > 0 ? (t.stats.wins / totalMaps) * 100 : 0;
    const lossRatio = totalMaps > 0 ? (t.stats.losses / totalMaps) * 100 : 0;

    // Lokalisierung: 'W' -> 'S' (Sieg), 'L' -> 'N' (Niederlage)
    const formBlocks = Array(5).fill('empty').map((_, i) => {
        const result = t.stats.form[i];
        if (result === 'W') return `<div class="form-block w">S</div>`;
        if (result === 'L') return `<div class="form-block l">N</div>`;
        return `<div class="form-block empty">-</div>`;
    }).join('');

    let enemyScoutingHTML = '';
    if (t.next_match && t.next_match.enemy_roster && t.next_match.enemy_roster.length > 0) {
        enemyScoutingHTML = `
            <div style="font-size: 0.6rem; color: #ff0055; margin-top: 15px; letter-spacing: 1px;">GEGNERISCHES LINEUP</div>
            <div class="enemy-roster-grid">
                ${t.next_match.enemy_roster.map(player => `<div class="enemy-chip">${escapeHTML(player)}</div>`).join('')}
            </div>
        `;
    }

    outputArea.innerHTML = `
        <div class="data-grid">
            
            <div class="wire-card span-full" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--primary);">
                <a href="${t.team_link}" target="_blank" class="team-link-wrapper">
                    <img src="${t.logo || 'assets/placeholder.png'}" onerror="this.onerror=null;this.src='assets/placeholder.png';" style="width: 50px; height: 50px; border-radius: 4px; filter: grayscale(50%); border: 1px solid rgba(255,255,255,0.1);">
                    <div>
                        <div style="font-family: var(--font-head); font-size: 1.2rem; color: #fff;">UIC ${teamKey.toUpperCase()} <span style="font-size: 0.8rem; color: var(--text-muted);">↗</span></div>
                        <div style="font-size: 0.7rem; color: var(--primary); letter-spacing: 2px;">${t.meta.div || 'DIV // TBD'}</div>
                    </div>
                </a>
                <div style="text-align: right;">
                    <div style="font-family: var(--font-head); font-size: 2.5rem; color: var(--primary); line-height: 1; text-shadow: 0 0 15px rgba(0, 240, 255, 0.3);">${t.stats.points}</div>
                    <div style="font-size: 0.6rem; color: var(--text-muted); letter-spacing: 2px;">LIGA PUNKTE</div>
                </div>
            </div>

            <div class="wire-card" style="display: flex; gap: 20px; align-items: center;">
                <div style="flex-grow: 1;">
                    <div class="wire-header" style="margin-bottom: 10px;"><span>[ STATISTIKEN ]</span> <span>SAISON</span></div>
                    <div style="margin-bottom: 15px;">
                        <div class="hud-stat-row" style="border: none; padding: 0; margin: 0;">
                            <span class="hud-lbl">MAP-DIFFERENZ</span>
                            <span class="hud-val" style="font-size: 1rem;">${t.stats.wins}S - ${t.stats.losses}N</span>
                        </div>
                        <div class="momentum-track">
                            <div class="m-fill-w" style="width: ${winRatio}%;"></div>
                            <div class="m-fill-l" style="width: ${lossRatio}%;"></div>
                        </div>
                    </div>
                    <div class="hud-stat-row" style="border: none; padding-bottom: 0;">
                        <span class="hud-lbl">FORMKURVE</span>
                        <div class="form-array">${formBlocks}</div>
                    </div>
                </div>
                <div class="cyber-ring-wrapper">
                    <div class="cyber-ring-chart" style="--percentage: ${t.stats.win_rate}%;">
                        <span class="cyber-ring-val">${t.stats.win_rate}%</span>
                    </div>
                    <span style="font-size: 0.6rem; color: var(--primary); letter-spacing: 1px;">SIEGQUOTE</span>
                </div>
            </div>

            <div class="wire-card">
                <div class="wire-header"><span>[ LETZTES MATCH ]</span> <span>HISTORIE</span></div>
                ${t.last_match ? `
                    <div class="hud-stat-row">
                        <span class="hud-lbl">GEGNER</span>
                        <span class="hud-val" style="font-size: 1rem;">VS ${escapeHTML(t.last_match.enemy)}</span>
                    </div>
                    <div class="hud-stat-row" style="border: none; padding-bottom: 0;">
                        <span class="hud-lbl">ERGEBNIS</span>
                        <span class="hud-val" style="color: ${t.last_match.result === 'SIEG' ? '#00ff88' : '#ff0055'};">${t.last_match.result} <span style="color: #fff; font-size: 0.9rem;">[${t.last_match.score}]</span></span>
                    </div>
                    <div style="font-size: 0.6rem; color: var(--text-muted); margin-top: 10px; text-align: right;">DATUM // ${new Date(t.last_match.date).toLocaleDateString('de-DE')}</div>
                ` : '<div style="color: var(--text-muted); font-size: 0.8rem;">KEINE DATEN VERFÜGBAR</div>'}
            </div>

            <div class="wire-card span-full alert">
                <div class="wire-header"><span style="color: var(--secondary);">[ NÄCHSTES MATCH ]</span> <span>GEPLANT</span></div>
                ${t.next_match ? `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 15px;">
                        <div>
                            <div style="font-size: 0.7rem; color: var(--text-muted);">GEGNER BESTÄTIGT</div>
                            <div style="font-family: var(--font-head); font-size: 1.5rem; color: #fff;">VS ${escapeHTML(t.next_match.tag)}</div>
                            ${enemyScoutingHTML}
                        </div>
                        <a href="${t.next_match.link}" target="_blank" class="btn-obsidian-ghost" style="padding: 8px 20px; font-size: 0.7rem; border-color: var(--secondary); color: #fff; align-self: center;">
                            ZUM SPIEL ↗
                        </a>
                    </div>
                ` : '<div style="color: var(--text-muted); font-size: 0.8rem;">AKTUELL KEIN SPIEL GEPLANT</div>'}
            </div>

        </div>
    `;
}

document.addEventListener('DOMContentLoaded', loadPrimeStats);
