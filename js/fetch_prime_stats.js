const fs = require('fs');
const path = require('path');

// Constants
const DATA_FILE = 'prime_stats.json';
// Ensure we write to the root directory regardless of where this script runs
const JSON_PATH = path.resolve(process.cwd(), DATA_FILE);

const TEAMS = {
    "prime":   "116908", 
    "spark":   "208694",
    "ember":   "211165",
    "nova":    "203447",
    "abyss":   "204924",
    "night":   "212047",
    "freezer": "203146"
};

const HEADERS = { 'User-Agent': 'HUD-Sync-Bot/1.0' };

// ... (Your existing constants and headers)

async function getPrimeStats(teamName, id) {
    try {
        const response = await fetch(`https://primebot.me/api/v1/teams/${id}/`, { headers: HEADERS });
        if (!response.ok) return null;
        
        const data = await response.json();
        const now = new Date();
        
        let wins = 0, losses = 0, draws = 0;
        let nextMatch = null;

        if (data.matches && Array.isArray(data.matches)) {
            const sortedMatches = data.matches.sort((a, b) => new Date(a.begin) - new Date(b.begin));

            sortedMatches.forEach(m => {
                const matchDate = new Date(m.begin);
                
                // Past Games Logic
                if (m.match_type === 'league' && m.result && matchDate < now) {
                    const [scoreA, scoreB] = m.result.split(':').map(Number);
                    if (!isNaN(scoreA) && !isNaN(scoreB)) {
                        if (scoreA > scoreB) wins++;
                        else if (scoreA < scoreB) losses++;
                        else draws++;
                    }
                }

                // Next Match Logic - NOW WITH LINKS
                if (!nextMatch && matchDate > now) {
                    nextMatch = {
                        opponent: m.enemy_team ? m.enemy_team.name : "TBD",
                        tag: m.enemy_team ? m.enemy_team.team_tag : "???",
                        logo: m.enemy_team ? m.enemy_team.logo_url : null,
                        date: m.begin,
                        link: m.prime_league_link // New: Specific Match Link
                    };
                }
            });
        }

        const totalGames = wins + losses + draws;
        const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

        return {
            id: id,
            name: data.name,
            logo: data.logo_url, // New: Team Logo
            team_link: data.prime_league_link, // New: Prime League Profile
            division: data.division || "Placement",
            games: totalGames,
            wins,
            losses,
            draws,
            points: (wins * 3) + draws,
            win_rate: winRate,
            next_match: nextMatch,
            roster: data.players ? data.players.map(p => ({
                name: p.name,
                summoner: p.summoner_name ? p.summoner_name.split('#')[0] : "Unknown",
                is_captain: p.is_leader
            })) : [],
            last_updated: now.toISOString()
        };
    } catch (e) {
        console.error(`❌ [${teamName}] Failure:`, e.message);
        return null;
    }
}
// ... (Rest of your start function)

async function start() {
    console.log(`🚀 HUD SYNC: Starting... Target: ${JSON_PATH}`);
    
    // Load existing data to preserve teams if API fails
    let currentData = {};
    if (fs.existsSync(JSON_PATH)) {
        try { currentData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8')); } catch (e) {
            console.warn("⚠️ Corrupt JSON found, starting fresh.");
        }
    }

    let successCount = 0;

    // Sequential loop to prevent Rate Limiting
    for (const [key, id] of Object.entries(TEAMS)) {
        const stats = await getPrimeStats(key, id);
        if (stats) {
            currentData[key] = stats;
            successCount++;
            console.log(`✅ [${key.toUpperCase()}] Synced.`);
        }
        // Tiny delay between requests
        await new Promise(r => setTimeout(r, 200)); 
    }

    if (successCount > 0) {
        fs.writeFileSync(JSON_PATH, JSON.stringify(currentData, null, 2));
        console.log(`\n🎉 SUCCESS: Database updated with ${successCount} teams.`);
    } else {
        console.log("\n⚠️ NO CHANGES: API might be down.");
    }
}

start();