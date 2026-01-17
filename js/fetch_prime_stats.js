const fs = require('fs');

const teamIds = {
    "prime":   "116908", 
    "spark":   "208694",
    "ember":   "211165",
    "nova":    "203447",
    "abyss":   "204924",
    "night":   "212047",
    "freezer": "131594"
};

async function getTeamStats(teamName, id) {
    try {
        const response = await fetch(`https://primebot.me/api/v1/team/${id}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        const wins = data.wins || 0;
        const losses = data.losses || 0;

        return {
            division: data.division_name || "N/A",
            rank: data.position || "--",
            games: wins + losses,
            wins: wins,
            losses: losses,
            points: (wins * 3) // Standard PL Points
        };
    } catch (e) {
        console.error(`❌ Error fetching ${teamName}:`, e.message);
        return null;
    }
}

async function start() {
    let results = {};
    for (const [name, id] of Object.entries(teamIds)) {
        const stats = await getTeamStats(name, id);
        if (stats) results[name] = stats;
    }
    fs.writeFileSync('prime_stats.json', JSON.stringify(results, null, 2));
    console.log("🎉 prime_stats.json updated.");
}

start();