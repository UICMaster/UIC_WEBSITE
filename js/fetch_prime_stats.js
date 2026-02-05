const fs = require('fs');
const path = require('path');

// --- 1. CONFIGURATION ---
const DATA_FILE = 'prime_stats.json';
// FIX: Save to ROOT directory
const OUTPUT_PATH = path.resolve(__dirname, '../', DATA_FILE);

// TEAM CONFIGURATION (Added 'manual_div' for missing API data)
const TEAMS = {
    "prime":   { id: "116908", manual_div: "Div x.x" }, 
    "spark":   { id: "208694", manual_div: "Div x.x" },
    "ember":   { id: "211165", manual_div: "Div x.x" },
    "nova":    { id: "203447", manual_div: "Div x.x" },
    "abyss":   { id: "204924", manual_div: "Div x.x" },
    "night":   { id: "212047", manual_div: "Division 6.1" },
    "freezer": { id: "203146", manual_div: "Div x.x" }
};

const HEADERS = { 'User-Agent': 'UIC-Dashboard-Bot/2.1' };

async function getTeamIntel(teamKey, config) {
    console.log(`📡 Scanning: UIC ${teamKey.toUpperCase()}...`);
    try {
        const response = await fetch(`https://primebot.me/api/v1/teams/${config.id}/`, { headers: HEADERS });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const now = new Date();
        
        let mapWins = 0;
        let mapLosses = 0;
        let formHistory = []; 
        let nextMatch = null;
        let lastMatch = null; // New: For extended details
        const rosterMap = new Map();

        if (data.matches && Array.isArray(data.matches)) {
            const sortedMatches = data.matches.sort((a, b) => new Date(a.begin) - new Date(b.begin));

            sortedMatches.forEach(m => {
                const matchDate = new Date(m.begin);

                // A. ROSTER FIX: Extended to 180 days to find Freezer players
                const isRecent = (now - matchDate) < (1000 * 60 * 60 * 24 * 180); 
                
                if (m.team_lineup && Array.isArray(m.team_lineup) && isRecent) {
                    m.team_lineup.forEach(p => {
                        if (!rosterMap.has(p.summoner_name) || p.is_leader) {
                            rosterMap.set(p.summoner_name, {
                                summoner: p.summoner_name,
                                is_captain: p.is_leader || false
                            });
                        }
                    });
                }

                // B. SCORING & HISTORY
                if (m.result && matchDate < now) {
                    const [scoreUs, scoreThem] = m.result.split(':').map(Number);
                    if (!isNaN(scoreUs)) {
                        mapWins += scoreUs;
                        mapLosses += scoreThem;
                        if (scoreUs > scoreThem) formHistory.push('W');
                        else if (scoreUs === scoreThem) formHistory.push('D');
                        else formHistory.push('L');
                        
                        // Capture details of the very last played match
                        lastMatch = {
                            result: scoreUs > scoreThem ? "VICTORY" : (scoreUs === scoreThem ? "DRAW" : "DEFEAT"),
                            score: `${scoreUs} - ${scoreThem}`,
                            enemy: m.enemy_team ? m.enemy_team.team_tag : "OPP",
                            date: m.begin
                        };
                    }
                }

                // C. NEXT MATCH
                if (!nextMatch && matchDate > now) {
                    nextMatch = {
                        date: m.begin,
                        tag: m.enemy_team ? m.enemy_team.team_tag : "TBD",
                        link: m.prime_league_link
                    };
                }
            });
        }

        const totalMaps = mapWins + mapLosses;

        return {
            id: config.id,
            key: teamKey,
            meta: { 
                name: data.name,
                // Use Manual Div if API fails
                div: data.division || config.manual_div 
            },
            stats: {
                wins: mapWins,
                losses: mapLosses,
                points: mapWins,
                games: totalMaps,
                win_rate: totalMaps > 0 ? Math.round((mapWins / totalMaps) * 100) : 0,
                form: formHistory.slice(-5)
            },
            next_match: nextMatch,
            last_match: lastMatch, // Sending last match data to frontend
            roster: Array.from(rosterMap.values()).slice(0, 7),
            team_link: data.prime_league_link,
            logo: data.logo_url
        };

    } catch (e) {
        console.error(`❌ Signal Lost [${teamKey}]:`, e.message);
        return null;
    }
}

async function start() {
    const database = {};
    for (const [key, config] of Object.entries(TEAMS)) {
        const stats = await getTeamIntel(key, config);
        if (stats) database[key] = stats;
        await new Promise(r => setTimeout(r, 250));
    }
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(database, null, 2));
    console.log(`\n✅ TELEMETRY UPDATED: ${OUTPUT_PATH}`);
}

start();