async function loadPrimeStats() {
    try {
        const res = await fetch('./prime_stats.json?t=' + Date.now());
        if (!res.ok) throw new Error("File Load Error");
        const data = await res.json();

        const teams = ["prime", "spark", "ember", "nova", "abyss", "night", "freezer"];
        const container = document.getElementById('stats-telemetry-list');
        
        if (!container) return;
        container.innerHTML = ''; // Clear loader

        teams.forEach(key => {
            const s = data[key];
            if (s) {
                const row = `
                    <div class="stats-row">
                        <div class="stats-rank-box">
                            <span class="rank-label">RANG</span>
                            <span class="rank-number">${s.rank.toString().padStart(2, '0')}</span>
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
                                <span class="label text-primary">SIEGE</span>
                                <span class="value">${s.wins}</span>
                            </div>
                            <div class="data-point">
                                <span class="label text-secondary">NIEDERLAGEN</span>
                                <span class="value">${s.losses}</span>
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
        console.error("Stats Sync Failed:", e);
    }
}

document.addEventListener('DOMContentLoaded', loadPrimeStats);