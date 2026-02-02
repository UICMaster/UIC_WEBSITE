async function loadPrimeStats() {
    const container = document.getElementById('stats-telemetry-list');
    if (!container) return;

    try {
        const response = await fetch('./prime_stats.json?t=' + Date.now());
        if (!response.ok) throw new Error("Telemetry Offline");
        const data = await response.json();
        
        const teams = ["prime", "spark", "ember", "nova", "abyss", "night", "freezer"];
        container.innerHTML = ''; 

        teams.forEach(key => {
            const s = data[key];
            if (s) {
                // Visual formatting for Rank
                // If Rank is "-" (missing), keep it as "-". 
                // If it's a number like 5, make it "05".
                let rankDisplay = s.rank;
                if (s.rank !== "-" && !isNaN(s.rank) && s.rank < 10) {
                    rankDisplay = `0${s.rank}`;
                }

                const row = `
                    <div class="stats-row" data-team="${key}">
                        <div class="stats-rank-box">
                            <span class="rank-label">RANG</span>
                            <span class="rank-number">${rankDisplay}</span>
                        </div>
                        
                        <div class="stats-info">
                            <h4>UIC ${key.toUpperCase()}</h4>
                            <span class="stats-div-tag">// ${s.division}</span>
                        </div>

                        <div class="stats-data-group">
                            <div class="data-point">
                                <span class="label">SPIELE</span>
                                <span class="value">${s.games}</span>
                            </div>
                            <div class="data-point">
                                <span class="label">SIEGE</span>
                                <span class="value" style="color:#4ade80;">${s.wins}</span>
                            </div>
                            <div class="data-point">
                                <span class="label">LOSE</span>
                                <span class="value" style="color:#f87171;">${s.losses}</span>
                            </div>
                            <div class="data-point">
                                <span class="label">PUNKTE</span>
                                <span class="value pts-highlight">${s.points}</span>
                            </div>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', row);
            }
        });

    } catch (e) {
        console.error("Stats Sync Error:", e);
        container.innerHTML = `
            <div style="text-align:center; padding:20px; border:1px solid #333; color:#f87171;">
                // DATA LINK SEVERED
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', loadPrimeStats);