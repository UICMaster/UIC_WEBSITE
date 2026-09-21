function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
}

let primeDataCache = null;

// Dynamically compute stats from the Golden JSON data lake
function computeTeamStats(matches) {
    let mapWins = 0, mapLosses = 0, totalPoints = 0, sWins = 0, sLosses = 0;
    let formHistory = [];
    let lastMatch = null;
    let upcomingMatches = [];
    
    const now = new Date();
    const validTypes = ['league', 'playoff'];
    
    const sorted = [...(matches || [])].sort((a, b) => new Date(a.begin) - new Date(b.begin));

    sorted.forEach(m => {
        if (!validTypes.includes(m.match_type)) return;
        const mDate = new Date(m.begin);

        // Past Matches (Results)
        if (m.result && mDate < now) {
            const [us, them] = m.result.split(':').map(Number);
            if (!isNaN(us)) {
                mapWins += us; mapLosses += them;
                if (us === 2 && them === 0) totalPoints += 3;
                else if (us === 2 && them === 1) totalPoints += 2;
                else if (us === 1 && them === 2) totalPoints += 1;

                if (us > them) { formHistory.push('W'); sWins++; } 
                else { formHistory.push('L'); sLosses++; }

                lastMatch = {
                    result: us > them ? "SIEG" : "NIEDERLAGE",
                    score: `${us} - ${them}`,
                    enemy: m.enemy_team?.team_tag || "OPP",
                    date: m.begin
                };
            }
        }
        
        // Upcoming Matches
        if (!m.result && mDate > now) {
            upcomingMatches.push(m);
        }
    });

    const games = sWins + sLosses;
    return {
        wins: mapWins,
        losses: mapLosses,
        points: totalPoints,
        games: games,
        seriesWins: sWins,
        win_rate: games > 0 ? Math.round((sWins / games) * 100) : 0,
        form: formHistory.slice(-5),
        lastMatch: lastMatch,
        allUpcoming: upcomingMatches // Pass full schedule to UI
    };
}

async function loadPrimeStats() {
    try {
        const response = await fetch(`./data/prime_stats.json?t=${Date.now()}`);
        if (!response.ok) throw new Error("Golden JSON Missing");
        const rawData = await response.json();
        
        let gMatches = 0, gSeriesWins = 0, gPlayers = new Set();
        let allGlobalUpcoming = [];
        
        primeDataCache = { teams: {} };

        for (const [key, teamData] of Object.entries(rawData)) {
            if (!teamData.api_meta) continue;

            const computed = computeTeamStats(teamData.matches);
            
            primeDataCache.teams[key] = {
                team_link: teamData.api_meta.prime_league_link,
                logo: teamData.api_meta.logo_url,
                // Inherit the Division from your local JSON (tier)
                meta: { name: teamData.api_meta.name, div: teamData.tier || 'DIV // TBD' },
                stats: computed,
                last_match: computed.lastMatch
            };

            gMatches += computed.games;
            gSeriesWins += computed.seriesWins;
            teamData.roster.forEach(p => gPlayers.add(p.gameName));
            
            computed.allUpcoming.forEach(m => {
                allGlobalUpcoming.push({
                    team_key: key.toUpperCase(),
                    date: m.begin,
                    confirmed: m.confirmed,
                    enemy: m.enemy_team?.team_tag || "TBD",
                    link: m.prime_league_link
                });
            });
        }

        primeDataCache.global = {
            matches: gMatches,
            wr: gMatches > 0 ? Math.round((gSeriesWins / gMatches) * 100) : 0,
            players: gPlayers.size,
            radar: allGlobalUpcoming.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 8)
        };

        // UI Updates
        document.getElementById('stat-matches').innerText = primeDataCache.global.matches;
        document.getElementById('stat-wr').innerText = primeDataCache.global.wr + '%';
        document.getElementById('stat-players').innerText = primeDataCache.global.players;

        const tabsContainer = document.getElementById('stats-team-tabs');
        const teamsOrder = Object.keys(primeDataCache.teams);
        
        let tabsHTML = `<button class="matrix-btn active" data-team="GLOBAL">[ ORGANISATION ]</button>`;
        tabsHTML += teamsOrder.map(key => `<button class="matrix-btn" data-team="${key}">UIC ${key.toUpperCase()}</button>`).join('');
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
        document.getElementById('telemetry-output').innerHTML = `<div class="terminal-loader" style="color: #ff0055;">> VERBINDUNGSFEHLER ZUM DATA LAKE</div>`;
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
        // Mask time if unconfirmed
        const timeStr = m.confirmed 
            ? `<span style="color: #00ff88;">${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} UHR</span>` 
            : `<span style="color: #ffaa00; font-size: 0.7rem;">TIME TBD</span>`;

        return `
            <div class="radar-row ${!m.confirmed ? 'unconfirmed-row' : ''}" style="opacity: ${m.confirmed ? '1' : '0.6'};">
                <div class="r-date"><span>${dateStr}</span> ${timeStr}</div>
                <div class="r-matchup"><span style="color: var(--text-muted);">UIC ${m.team_key}</span> VS ${escapeHTML(m.enemy)}</div>
                <a href="${m.link}" target="_blank" class="btn-obsidian-ghost" style="padding: 5px 15px; font-size: 0.6rem;">${m.confirmed ? 'ZUM MATCH ↗' : 'SCHEDULING ↗'}</a>
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

    const formBlocks = Array(5).fill('empty').map((_, i) => {
        const result = t.stats.form[i];
        if (result === 'W') return `<div class="form-block w">S</div>`;
        if (result === 'L') return `<div class="form-block l">N</div>`;
        return `<div class="form-block empty">-</div>`;
    }).join('');

    // Build Schedule Matrix for up to 3 upcoming matches
    let upcomingScheduleHTML = '<div style="color: var(--text-muted); font-size: 0.8rem;">AKTUELL KEINE SPIELE GEPLANT</div>';
    
    if (t.stats.allUpcoming && t.stats.allUpcoming.length > 0) {
        const nextThree = t.stats.allUpcoming.slice(0, 3);
        
        upcomingScheduleHTML = `<div style="display: flex; flex-direction: column; gap: 10px;">` + nextThree.map(m => {
            const d = new Date(m.begin);
            const dateStr = d.toLocaleDateString('de-DE');
            
            // Generate Roster Chips if enemy lineup is available
            let enemyRosterChips = '';
            if (m.enemy_lineup && m.enemy_lineup.length > 0) {
                enemyRosterChips = `
                    <div class="enemy-roster-grid" style="margin-top: 8px;">
                        ${m.enemy_lineup.map(player => `<div class="enemy-chip">${escapeHTML(player.summoner_name)}</div>`).join('')}
                    </div>
                `;
            }
            
            if (m.confirmed) {
                return `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; background: rgba(0, 255, 136, 0.05); border: 1px solid rgba(0, 255, 136, 0.2); padding: 10px 15px; border-radius: 4px;">
                        <div>
                            <div style="font-size: 0.6rem; color: #00ff88; margin-bottom: 2px;">✓ MATCH BESTÄTIGT</div>
                            <div style="font-family: var(--font-head); font-size: 1.2rem; color: #fff;">VS ${escapeHTML(m.enemy_team?.team_tag || "TBD")}</div>
                            ${enemyRosterChips}
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                            <div style="text-align: right;">
                                <div style="font-size: 0.8rem; color: #fff;">${dateStr}</div>
                                <div style="font-size: 0.9rem; color: #00ff88; font-weight: bold;">${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} UHR</div>
                            </div>
                            <a href="${m.prime_league_link}" target="_blank" class="btn-obsidian-ghost" style="padding: 4px 12px; font-size: 0.6rem; border-color: var(--secondary);">ZUM SPIEL ↗</a>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 170, 0, 0.05); border: 1px dashed rgba(255, 170, 0, 0.3); padding: 10px 15px; border-radius: 4px; opacity: 0.8;">
                        <div>
                            <div style="font-size: 0.6rem; color: #ffaa00; margin-bottom: 2px;">⚠️ DEFAULT DATUM (NICHT BESTÄTIGT)</div>
                            <div style="font-family: var(--font-head); font-size: 1rem; color: #ddd;">VS ${escapeHTML(m.enemy_team?.team_tag || "TBD")}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 0.8rem; color: var(--text-muted);">KW Orientierung</div>
                            <div style="font-size: 0.8rem; color: #ffaa00;">${dateStr} // TIME TBD</div>
                        </div>
                    </div>
                `;
            }
        }).join('') + `</div>`;
    }

    outputArea.innerHTML = `
        <div class="data-grid">
            <div class="wire-card span-full" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--primary);">
                <a href="${t.team_link}" target="_blank" class="team-link-wrapper">
                    <img src="${t.logo || 'assets/placeholder.png'}" onerror="this.onerror=null;this.src='assets/placeholder.png';" style="width: 50px; height: 50px; border-radius: 4px; filter: grayscale(50%); border: 1px solid rgba(255,255,255,0.1);">
                    <div>
                        <div style="font-family: var(--font-head); font-size: 1.2rem; color: #fff;">UIC ${teamKey.toUpperCase()} <span style="font-size: 0.8rem; color: var(--text-muted);">↗</span></div>
                        <div style="font-size: 0.7rem; color: var(--primary); letter-spacing: 2px;">${t.meta.div}</div>
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
                <div class="wire-header"><span style="color: var(--secondary);">[ GEPLANTE SPIELE ]</span> <span>HORIZONT</span></div>
                ${upcomingScheduleHTML}
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', loadPrimeStats);
