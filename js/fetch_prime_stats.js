const fs = require('fs');
const path = require('path');

// Defined path relative to this script
const JSON_PATH = path.join(__dirname, '../prime_stats.json');

// Your Teams
const teams = {
    "prime":   "116908", 
    "spark":   "208694",
    "ember":   "211165",
    "nova":    "203447",
    "abyss":   "204924",
    "night":   "212047",
    "freezer": "203146"
};

async function getPrimeStats(teamName, id) {
    try {
        const response = await fetch(`https://primebot.me/api/v1/teams/${id}/`, {
            headers: { 'User-Agent': 'HUD-Sync-Bot/1.0' }
        });
        
        if (!response.ok) {
            console.warn(`⚠️ [${teamName.toUpperCase()}] API Error: ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        
        let wins = 0;
        let losses = 0;
        let draws = 0;

        // --- SCHEMA BASED LOGIC ---
        if (data.matches && Array.isArray(data.matches)) {
            data.matches.forEach(m => {
                
                // FILTER: Only count "league" matches (Ignore 'group'/calibration)
                // If you want to count EVERYTHING, remove this "if" check.
                if (m.match_type === 'league') {

                    // Check if result is valid string (e.g. "2:0")
                    if (m.result && typeof m.result === 'string' && m.result.includes(':')) {
                        const parts = m.result.split(':');
                        const myScore = parseInt(parts[0], 10);
                        const enemyScore = parseInt(parts[1], 10);

                        if (!isNaN(myScore) && !isNaN(enemyScore)) {
                            if (myScore > enemyScore) wins++;
                            else if (myScore < enemyScore) losses++;
                            else draws++; // 1:1 is a draw
                        }
                    }
                }
            });
        }

        return {
            division: data.division || "TBD", // Schema allows null
            
            // Schema confirms 'position' does not exist in TeamDetail. 
            // We return "-" so the frontend displays a placeholder.
            rank: "-", 
            
            games: wins + losses + draws,
            wins: wins,
            losses: losses,
            draws: draws,
            points: (wins * 3) + (draws * 1),
            last_updated: new Date().toISOString()
        };

    } catch (e) {
        console.error(`❌ [${teamName.toUpperCase()}] Network Error:`, e.message);
        return null;
    }
}

async function start() {
    console.log("🚀 HUD SYNC: Starting Prime League Telemetry...");
    
    // 1. Read Old Data
    let currentData = {};
    if (fs.existsSync(JSON_PATH)) {
        try {
            currentData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
        } catch (e) {
            console.error("⚠️ Corrupt JSON. Starting fresh.");
        }
    }

    // 2. Fetch All
    const updates = await Promise.all(
        Object.entries(teams).map(async ([name, id]) => {
            const stats = await getPrimeStats(name, id);
            return { name, stats };
        })
    );

    let changesCount = 0;

    // 3. Merge
    updates.forEach(({ name, stats }) => {
        if (stats) {
            currentData[name] = stats;
            changesCount++;
            console.log(`✅ [${name.toUpperCase()}] Synced. (W/L: ${stats.wins}/${stats.losses})`);
        } else {
            // Failure Fallback
            if (currentData[name]) {
                console.log(`⚠️ [${name.toUpperCase()}] Failed. Keeping cached data.`);
            } else {
                console.error(`⛔ [${name.toUpperCase()}] Failed & no cache!`);
            }
        }
    });

    // 4. Save
    if (changesCount > 0) {
        try {
            fs.writeFileSync(JSON_PATH, JSON.stringify(currentData, null, 2));
            console.log(`\n🎉 SUCCESS: Data saved to ${JSON_PATH}`);
        } catch (err) {
            console.error("❌ Write Error:", err.message);
            process.exit(1);
        }
    } else {
        console.log("\n🤷 No new data.");
    }
}

start();