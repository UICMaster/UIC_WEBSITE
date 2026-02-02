/**
 * INSERT FETCH PRIME STATS
 * Populates #stats-telemetry-list with Prime League data.
 * Matches CSS: grid-template-columns: 100px 1fr auto;
 */

async function loadPrimeStats() {
    // 1. Target the specific container
    const container = document.getElementById('stats-telemetry-list');
    
    // Safety: Stop if container is missing (e.g. on a different page)
    if (!container) return;

    try {
        // 2. Fetch Data (with cache busting ?t=Timestamp)
        const response = await fetch('./prime_stats.json?t=' + Date.now());
        
        if (!response.ok) throw new Error("Telemetry Offline");
        
        const data = await response.json();
        
        // Define exact team order
        const teams = ["prime", "spark", "ember", "nova", "abyss", "night", "freezer"];
        
        // 3. Clear the "INITIALIZING_SYNC..." loader
        container.innerHTML = ''; 

        // 4. Generate Rows
        teams.forEach(key => {
            const s = data[key];
            
            // Only render if data exists
            if (s) {
                // Format Rank: "5" -> "05" for alignment
                const rankDisplay = (s.rank !== "-" && s.rank < 10) ? `0${s.rank}` : s.rank;

                // Create HTML (Matching your CSS Grid structure)
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
        // Visual Error Message
        container.innerHTML = `
            <div style="text-align:center; padding:20px; border:1px solid rgba(255,100,100,0.3); background:rgba(255,0,0,0.05);">
                <span style="color:#f87171; font-family:var(--font-head);">// CONNECTION_LOST</span>
            </div>
        `;
    }
}

// Execute when DOM is ready
document.addEventListener('DOMContentLoaded', loadPrimeStats);