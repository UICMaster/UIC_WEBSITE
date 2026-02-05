const fs = require('fs');
const path = require('path');

// --- 1. CONFIGURATION ---
const DATA_FILE = 'prime_stats.json';

// CRITICAL FIX: Save to the ROOT directory (up one level from 'js/')
// This ensures your GitHub Action finds the file in the correct place.
const OUTPUT_PATH = path.resolve(__dirname, '../', DATA_FILE);

// YOUR TEAM CONFIGURATION
const TEAMS = {
    "prime":   "116908", 
    "spark":   "208694",
    "ember":   "211165",
    "nova":    "203447",
    "abyss":   "204924",
    "night":   "212047",
    "freezer": "203146"
};

const HEADERS = { 'User-Agent': 'UIC-Dashboard-Bot/2.0' };

// --- 2. INTELLIGENCE GATHERING ENGINE ---
async function getTeamIntel(teamKey, teamId) {
    console.log(`📡 Scanning Frequency: UIC ${teamKey.toUpperCase()}...`);
    try {
        const response = await fetch(`https://primebot.me/api/v1/teams/${teamId}/`, { headers: HEADERS });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const now = new Date();
        
        // Data Accumulators
        let mapWins = 0;   // 1 Win = 1 Point
        let mapLosses = 0;
        let formHistory = []; // Tracks Matchday results: W(2:0), D(1:1), L(0:2)
        let nextMatch = null;
        
        // Roster Set (Prevents duplicates)
        const rosterMap = new Map();

        if (data.matches && Array.isArray(data.matches)) {
            // Sort matches: Oldest -> Newest (Required for correct history calculation)
            const sortedMatches = data.matches.sort((a, b) => new Date(a.begin) - new Date(b.begin));

            sortedMatches.forEach(m => {
                const matchDate = new Date(m.begin);

                // A. ROSTER EXTRACTION (Active players from last 60 days)
                // This filters out old substitutes from previous seasons
                const isRecent = (now - matchDate) < (1000 * 60 * 60 * 24 * 60); 
                if (m.team_lineup && Array.isArray(m.team_lineup) && isRecent) {
                    m.team_lineup.forEach(p => {
                        // Add if new OR if this is the leader instance (to capture captain status)
                        if (!rosterMap.has(p.summoner_name) || p.is_leader) {
                            rosterMap.set(p.summoner_name, {
                                summoner: p.summoner_name,
                                is_captain: p.is_leader || false
                            });
                        }
                    });
                }

                // B. SCORING LOGIC (Best of 2 Format)
                if (m.result && matchDate < now) {
                    const [scoreUs, scoreThem] = m.result.split(':').map(Number);
                    
                    if (!isNaN(scoreUs) && !isNaN(scoreThem)) {
                        // Points: 1 Map Win = 1 Point
                        mapWins += scoreUs;
                        mapLosses += scoreThem;

                        // Form: Matchday Result
                        if (scoreUs > scoreThem) formHistory.push('W');      // 2:0 Win
                        else if (scoreUs === scoreThem) formHistory.push('D'); // 1:1 Draw
                        else formHistory.push('L');                          // 0:2 Loss
                    }
                }

                // C. NEXT MATCH FINDER
                if (!nextMatch && matchDate > now) {
                    nextMatch = {
                        date: m.begin,
                        tag: m.enemy_team ? m.enemy_team.team_tag : "TBD",
                        link: m.prime_league_link
                    };
                }
            });
        }

        // --- 3. FINAL CALCULATION ---
        const totalMaps = mapWins + mapLosses;
        const formShort = formHistory.slice(-5); // Keep only last 5 matchdays

        return {
            id: teamId,
            key: teamKey,
            meta: { 
                name: data.name,
                div: data.division || "Prime League" 
            },
            stats: {
                wins: mapWins,
                losses: mapLosses,
                points: mapWins, // 1 Point per map win logic
                games: totalMaps,
                win_rate: totalMaps > 0 ? Math.round((mapWins / totalMaps) * 100) : 0,
                form: formShort
            },
            next_match: nextMatch,
            // Convert Map to Array and take max 7 players (Starters + Subs)
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
    
    // Sequential Loop to respect API rate limits
    for (const [key, id] of Object.entries(TEAMS)) {
        const stats = await getTeamIntel(key, id);
        if (stats) database[key] = stats;
        
        // 250ms delay between requests
        await new Promise(r => setTimeout(r, 250)); 
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(database, null, 2));
    console.log(`\n✅ TELEMETRY UPDATED: Data saved to ${OUTPUT_PATH}`);
}

start();