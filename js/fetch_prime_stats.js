const fs = require('fs');
const path = require('path');

const CONFIG = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const OUTPUT_PATH = path.resolve(process.cwd(), 'prime_stats.json');
const HEADERS = { 'User-Agent': 'UIC-Dashboard-Bot/3.0' };

async function getTeamIntel(team) {
    console.log(`📡 Syncing: ${team.key.toUpperCase()}...`);
    try {
        const response = await fetch(`https://primebot.me/api/v1/teams/${team.id}/`, { headers: HEADERS });
        const data = await response.json();
        
        let mapWins = 0, mapLosses = 0, totalPoints = 0, sWins = 0, sLosses = 0;
        let formHistory = [], nextMatch = null, lastMatch = null;

        // FILTER: Only count League (Groups) and Playoffs
        const validTypes = ['league', 'playoff'];

        if (data.matches) {
            const sorted = [...data.matches].sort((a, b) => new Date(a.begin) - new Date(b.begin));
            
            sorted.forEach(m => {
                if (!validTypes.includes(m.match_type)) return;

                const mDate = new Date(m.begin);
                const now = new Date();

                if (m.result && mDate < now) {
                    const [us, them] = m.result.split(':').map(Number);
                    if (!isNaN(us)) {
                        mapWins += us; mapLosses += them;
                        
                        // Rule 2.4.2: Bo3 Point Distribution
                        if (us === 2 && them === 0) totalPoints += 3;
                        else if (us === 2 && them === 1) totalPoints += 2;
                        else if (us === 1 && them === 2) totalPoints += 1;

                        if (us > them) { formHistory.push('W'); sWins++; } 
                        else { formHistory.push('L'); sLosses++; }

                        lastMatch = {
                            result: us > them ? "SIEG" : "NIEDERLAGE",
                            score: `${us} - ${them}`,
                            enemy: m.enemy_team?.team_tag || "OPP",
                            date: m.begin
                        };
                    }
                }
                if (!nextMatch && mDate > now) {
                    nextMatch = { date: m.begin, tag: m.enemy_team?.team_tag || "TBD", link: m.prime_league_link };
                }
            });
        }

        return {
            meta: { name: data.name, div: data.division },
            stats: { wins: mapWins, losses: mapLosses, points: totalPoints, games: (sWins + sLosses), 
                     win_rate: (sWins + sLosses) > 0 ? Math.round((sWins / (sWins + sLosses)) * 100) : 0, 
                     form: formHistory.slice(-5) },
            next_match: nextMatch,
            last_match: lastMatch,
            roster: (data.players || []).map(p => ({ summoner: p.summoner_name, is_captain: p.is_leader })),
            team_link: data.prime_league_link,
            logo: data.logo_url
        };
    } catch (e) { return null; }
}

async function start() {
    const results = {};
    let gMatches = 0, gWins = 0, gPlayers = new Set();

    for (const team of CONFIG.teams) {
        const stats = await getTeamIntel(team);
        if (stats) {
            results[team.key] = stats;
            gMatches += stats.stats.games;
            gWins += (stats.stats.win_rate / 100) * stats.stats.games;
            stats.roster.forEach(p => gPlayers.add(p.summoner));
        }
        await new Promise(r => setTimeout(r, 200));
    }

    const payload = {
        config: { teamsOrder: CONFIG.teams.map(t => t.key) },
        global: { matches: gMatches, wr: gMatches > 0 ? Math.round((gWins / gMatches) * 100) : 0, players: gPlayers.size },
        teams: results
    };
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));
    console.log("✅ Telemetry Generated.");
}
start();
