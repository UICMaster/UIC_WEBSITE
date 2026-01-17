const fs = require('fs');
const path = require('path');

const teams = {
    "prime":   "116908", 
    "spark":   "208694",
    "ember":   "211165",
    "nova":    "203447",
    "abyss":   "204924",
    "night":   "212047",
    "freezer": "131594"
};

async function getPrimeStats(teamName, id) {
    try {
        // Note the trailing slash - some APIs require it
        const response = await fetch(`https://primebot.me/api/v1/teams/${id}/`);
        if (!response.ok) {
            console.error(`⚠️ ${teamName} (${id}) returned status: ${response.status}`);
            return null;
        }
        const data = await response.json();
        
        // Calculate wins/losses from matches
        let wins = 0;
        let losses = 0;
        if (data.matches && data.matches.length > 0) {
            data.matches.forEach(m => {
                if (m.result === "win") wins++;
                if (m.result === "loss") losses++;
            });
        }

        // Map API fields to our expected structure
        // If division is null (off-season), we use "TBD"
        return {
            division: data.division || "DIV ?",
            rank: data.position || "0", 
            games: wins + losses,
            wins: wins,
            losses: losses,
            points: wins * 3
        };
    } catch (e) {
        console.error(`❌ Fetch error for ${teamName}:`, e.message);
        return null;
    }
}

async function start() {
    console.log("🚀 HUD SYNC STARTING...");
    let results = {};

    for (const [name, id] of Object.entries(teams)) {
        const stats = await getPrimeStats(name, id);
        if (stats) {
            results[name] = stats;
            console.log(`✅ ${name.toUpperCase()} synced.`);
        }
    }

    // Check if we actually got data
    if (Object.keys(results).length === 0) {
        console.error("⛔ ERROR: No data was retrieved. File will not be updated.");
        return;
    }

    // Force path to project root (one level up from /js)
    const filePath = path.join(__dirname, '../prime_stats.json');
    
    try {
        fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
        console.log(`\n🎉 SUCCESS: Data written to ${filePath}`);
        console.log("Preview of data:", JSON.stringify(results).substring(0, 100) + "...");
    } catch (err) {
        console.error("❌ File System Error:", err.message);
    }
}

start();