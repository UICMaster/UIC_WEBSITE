const fs = require('fs');
const path = require('path');

// 1. Define File Path (Relative to this script)
const JSON_PATH = path.join(__dirname, '../prime_stats.json');

// 2. Define Teams (Name: Prime League ID)
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
            return null; // Return null to signal failure
        }
        
        const data = await response.json();
        
        // Calculate Wins/Losses
        let wins = 0;
        let losses = 0;
        if (data.matches && Array.isArray(data.matches)) {
            data.matches.forEach(m => {
                if (m.result === "win") wins++;
                if (m.result === "loss") losses++;
            });
        }

        return {
            division: data.division || "TBD",
            rank: data.position || "-", 
            games: wins + losses,
            wins: wins,
            losses: losses,
            points: wins * 3, // Assuming 3 points per win
            last_updated: new Date().toISOString()
        };
    } catch (e) {
        console.error(`❌ [${teamName.toUpperCase()}] Network Error:`, e.message);
        return null;
    }
}

async function start() {
    console.log("🚀 HUD SYNC: Starting Prime League Telemetry...");
    
    // 3. Load Existing Data (The Safety Net)
    let currentData = {};
    if (fs.existsSync(JSON_PATH)) {
        try {
            currentData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
        } catch (e) {
            console.error("⚠️ Corrupt JSON found. Starting fresh.");
        }
    }

    // 4. Parallel Fetching (Fast)
    const updates = await Promise.all(
        Object.entries(teams).map(async ([name, id]) => {
            const stats = await getPrimeStats(name, id);
            return { name, stats };
        })
    );

    let changesCount = 0;

    // 5. Merge Data
    updates.forEach(({ name, stats }) => {
        if (stats) {
            // Success: Update the data
            currentData[name] = stats;
            changesCount++;
            console.log(`✅ [${name.toUpperCase()}] Synced. (Rank: ${stats.rank})`);
        } else {
            // Failure: Keep the old data (if it exists)
            if (currentData[name]) {
                console.log(`⚠️ [${name.toUpperCase()}] Update failed. Preserving cached data.`);
            } else {
                console.error(`⛔ [${name.toUpperCase()}] Update failed & no cache!`);
            }
        }
    });

    // 6. Write to File
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