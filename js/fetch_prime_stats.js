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

async function getPrimeStats(teamName, id) {
    try {
        const response = await fetch(`https://primebot.me/api/v1/teams/${id}/`, { headers: HEADERS });
        if (!response.ok) {
            console.warn(`⚠️ [${teamName}] API Error: ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        const now = new Date();
        
        // 1. Stats Calculation
        let wins = 0, losses = 0, draws = 0;
        let nextMatch = null;

        if (data.matches && Array.isArray(data.matches)) {
            // Sort matches by date (oldest to newest)
            const sortedMatches = data.matches.sort((a, b) => new Date(a.begin) - new Date(b.begin));

            sortedMatches.forEach(m => {
                const matchDate = new Date(m.begin);
                
                // A. Past Games (League Only)
                if (m.match_type === 'league' && m.result && matchDate < now) {
                    if (m.result.includes(':')) {
                        const [scoreA, scoreB] = m.result.split(':').map(Number);
                        
                        // Ensure scores are valid numbers
                        if (!isNaN(scoreA) && !isNaN(scoreB)) {
                            if (scoreA > scoreB) wins++;
                            else if (scoreA < scoreB) losses++;
                            else draws++;
                        }
                    }
                }

                // B. Next Match (First match in the future)
                if (!nextMatch && matchDate > now) {
                    nextMatch = {
                        opponent: m.enemy_team ? m.enemy_team.name : "TBD",
                        tag: m.enemy_team ? m.enemy_team.team_tag : "???",
                        logo: m.enemy_team ? m.enemy_team.logo_url : null,
                        date: m.begin
                    };
                }
            });
        }

        const totalGames = wins + losses + draws;
        const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

        // 2. Roster Processing
        const roster = data.players ? data.players.map(p => ({
            name: p.name,
            summoner: p.summoner_name ? p.summoner_name.split('#')[0] : "Unknown",
            is_captain: p.is_leader
        })) : [];

        // 3. Return Clean Object
        return {
            id: id,
            name: data.name, // Real team name from API
            division: data.division || "Placement",
            games: totalGames,
            wins,
            losses,
            draws,
            points: (wins * 3) + draws, // Standard Prime League Points (3 for win, 1 for draw)
            win_rate: winRate,
            next_match: nextMatch,
            roster: roster,
            last_updated: now.toISOString()
        };

    } catch (e) {
        console.error(`❌ [${teamName}] Critical Failure:`, e.message);
        return null;
    }
}

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