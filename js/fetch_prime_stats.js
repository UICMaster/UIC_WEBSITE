const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../prime_stats.json');

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
        
        // --- NEW LOGIC START ---
        let wins = 0;
        let losses = 0;
        let draws = 0; // Added draws just in case

        if (data.matches && Array.isArray(data.matches)) {
            data.matches.forEach(m => {
                // Check if result exists (e.g., "2:0")
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
            });
        }

        // Calculate Points: Win=3, Draw=1 (Standard League logic)
        // If your league uses different points, adjust here.
        const points = (wins * 3) + (draws * 1);

        return {
            division: data.division || "TBD", // Handle null division
            rank: data.position || "-",       // Handle missing rank
            games: wins + losses + draws,
            wins: wins,
            losses: losses,
            draws: draws,
            points: points,
            last_updated: new Date().toISOString()
        };
        // --- NEW LOGIC END ---

    } catch (e) {
        console.error(`❌ [${teamName.toUpperCase()}] Network Error:`, e.message);
        return null;
    }
}

async function start() {
    console.log("🚀 HUD SYNC: Starting Prime League Telemetry...");
    
    let currentData = {};
    if (fs.existsSync(JSON_PATH)) {
        try {
            currentData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
        } catch (e) {
            console.error("⚠️ Corrupt JSON found. Starting fresh.");
        }
    }

    const updates = await Promise.all(
        Object.entries(teams).map(async ([name, id]) => {
            const stats = await getPrimeStats(name, id);
            return { name, stats };
        })
    );

    let changesCount = 0;

    updates.forEach(({ name, stats }) => {
        if (stats) {
            currentData[name] = stats;
            changesCount++;
            console.log(`✅ [${name.toUpperCase()}] Synced. (W/L: ${stats.wins}/${stats.losses})`);
        } else {
            if (currentData[name]) {
                console.log(`⚠️ [${name.toUpperCase()}] Update failed. Preserving cache.`);
            } else {
                console.error(`⛔ [${name.toUpperCase()}] Update failed & no cache!`);
            }
        }
    });

    if (changesCount > 0) {
        try {
            fs.writeFileSync(JSON_PATH, JSON.stringify(currentData, null, 2));
            console.log(`\n🎉 SUCCESS: Updated telemetry for ${changesCount} teams.`);
        } catch (err) {
            console.error("❌ File Write Error:", err.message);
            process.exit(1);
        }
    } else {
        console.log("\n🤷 No new data retrieved. File unchanged.");
    }
}

start();