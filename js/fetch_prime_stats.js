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
        const response = await fetch(`https://primebot.me/api/v1/teams/${id}/`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        // Calculate stats from matches array
        let wins = 0;
        let losses = 0;
        
        if (data.matches && data.matches.length > 0) {
            data.matches.forEach(match => {
                if (match.result === "win") wins++;
                else if (match.result === "loss") losses++;
            });
        }

        return {
            division: data.division || "TBD", // API returned null in your example
            rank: data.position || "0",       // Use position if available
            games: wins + losses,
            wins: wins,
            losses: losses,
            points: wins * 3
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