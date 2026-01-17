const fs = require('fs');

// REPLACE THE IDs with your actual Prime League Team IDs
const teams = {
    "prime":   "116908", 
    "spark":   "208694",
    "ember":   "211165",
    "nova":    "203447",
    "abyss":   "204924",
    "night":   "212047",
    "freezer": "131594"
};

async function getPrimeStats(teamId) {
    try {
        const response = await fetch(`https://primebot.me/api/v1/team/${teamId}`);
        const data = await response.json();
        
        // PrimeBot API typically returns standing data in a 'match' or 'team' object
        // We extract the essentials: Rank, Wins, Losses, Division
        return {
            division: data.division_name || "N/A",
            rank: data.position || "--",
            games: (data.wins + data.losses) || 0,
            wins: data.wins || 0,
            losses: data.losses || 0,
            points: (data.wins * 3) // Standard Prime League points logic
        };
    } catch (e) {
        console.error(`Error fetching Prime ID ${teamId}:`, e.message);
        return null;
    }
}

async function start() {
    console.log("🚀 Syncing Prime League Standings...");
    let results = {};

    for (const [name, id] of Object.entries(teams)) {
        const stats = await getPrimeStats(id);
        if (stats) {
            results[name] = stats;
            console.log(`✅ ${name.toUpperCase()} data retrieved.`);
        }
    }

    fs.writeFileSync('prime_stats.json', JSON.stringify(results, null, 2));
    console.log("🎉 prime_stats.json updated.");
}

start();