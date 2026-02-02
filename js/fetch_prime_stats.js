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
        
        if (!response.ok) return null;
        
        const data = await response.json();
        const now = new Date();
        
        // 1. STATS LOGIC
        let wins = 0, losses = 0, draws = 0;
        let nextMatch = null;

        if (data.matches && Array.isArray(data.matches)) {
            // Sort to find the correct next match
            const sortedMatches = data.matches.sort((a, b) => new Date(a.begin) - new Date(b.begin));

            sortedMatches.forEach(m => {
                const matchDate = new Date(m.begin);
                
                // A. Calculate Stats (League Only + Past Games)
                if (m.match_type === 'league' && m.result && matchDate < now) {
                    if (m.result.includes(':')) {
                        const parts = m.result.split(':');
                        const myScore = parseInt(parts[0], 10);
                        const enemyScore = parseInt(parts[1], 10);
                        if (!isNaN(myScore)) {
                            if (myScore > enemyScore) wins++;
                            else if (myScore < enemyScore) losses++;
                            else draws++;
                        }
                    }
                }

                // B. Find Next Match (Future)
                if (!nextMatch && matchDate > now) {
                    nextMatch = {
                        opponent: m.enemy_team ? m.enemy_team.name : "TBD",
                        tag: m.enemy_team ? m.enemy_team.team_tag : "???",
                        date: m.begin
                    };
                }
            });
        }

        const totalGames = wins + losses + draws;
        const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

        // 2. ROSTER LOGIC
        const roster = data.players ? data.players.map(p => ({
            name: p.name,
            summoner: p.summoner_name.split('#')[0],
            is_captain: p.is_leader
        })) : [];

        // RETURN FLATTENED OBJECT (Fixes "Undefined" issue)
        return {
            division: data.division || "TBD",
            games: totalGames,
            wins: wins,
            losses: losses,
            draws: draws,
            points: (wins * 3) + draws,
            win_rate: winRate,
            next_match: nextMatch,
            roster: roster,
            last_updated: now.toISOString()
        };

    } catch (e) {
        console.error(`❌ [${teamName}] Error:`, e.message);
        return null;
    }
}

async function start() {
    console.log("🚀 HUD SYNC: Upgrading Telemetry...");
    let currentData = {};
    
    if (fs.existsSync(JSON_PATH)) {
        try { currentData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8')); } catch (e) {}
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
            console.log(`✅ [${name.toUpperCase()}] Synced.`);
        }
    });

    if (changesCount > 0) {
        fs.writeFileSync(JSON_PATH, JSON.stringify(currentData, null, 2));
        console.log(`\n🎉 SUCCESS: Saved ${changesCount} teams.`);
    }
}

start();