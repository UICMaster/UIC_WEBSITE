const fs = require('fs');
const path = require('path');

// --- PATHS & HEADERS ---
const INPUT_PATH = path.resolve(process.cwd(), 'data', 'teams.json');
const OUTPUT_PATH = path.resolve(process.cwd(), 'data', 'golden_prime_league.json');
const HEADERS = { 'User-Agent': 'UIC-Data-Warehouse/1.0' };

async function buildGoldenJSON() {
    console.log("🚀 Starting Golden Prime League Sync...");
    const localTeamsData = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
    const goldenDatabase = {};

    for (const [teamKey, localTeamInfo] of Object.entries(localTeamsData)) {
        console.log(`📡 Fetching data for: ${localTeamInfo.teamDisplay || teamKey}...`);
        
        // Initialize the base structure inheriting your local data
        goldenDatabase[teamKey] = {
            ...localTeamInfo,
            api_meta: null,
            roster: [...localTeamInfo.roster], // Clone to safely mutate
            matches: []
        };

        const teamId = localTeamInfo.primeLeagueId;
        
        // Skip API fetch if no ID is present (e.g., Community team)
        if (!teamId || teamId.trim() === "") {
            console.log(`⚠️ Skipping API fetch for ${teamKey} (No Prime League ID).`);
            continue;
        }

        try {
            const response = await fetch(`https://primebot.me/api/v1/teams/${teamId}/`, { headers: HEADERS });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const apiData = await response.json();

            // 1. INHERIT API META DATA
            goldenDatabase[teamKey].api_meta = {
                id: apiData.id,
                name: apiData.name,
                team_tag: apiData.team_tag,
                division: apiData.division,
                logo_url: apiData.logo_url,
                prime_league_link: apiData.prime_league_link,
                updated_at: apiData.updated_at
            };

            // 2. MERGE ROSTERS (Local Data + API Data)
            const apiPlayers = apiData.players || [];
            
            // Update local roster with API specifics
            goldenDatabase[teamKey].roster = goldenDatabase[teamKey].roster.map(localPlayer => {
                const apiMatch = apiPlayers.find(p => p.summoner_name.toLowerCase() === localPlayer.gameName.toLowerCase());
                return {
                    ...localPlayer,
                    api_id: apiMatch ? apiMatch.id : null,
                    isCaptain: apiMatch ? apiMatch.is_leader : localPlayer.isCaptain,
                    api_name: apiMatch ? apiMatch.name : null, // The real name if provided to the API
                    in_api_roster: !!apiMatch
                };
            });

            // Append players found in API but missing in your local teams.json (Edge Case Safety)
            apiPlayers.forEach(apiPlayer => {
                const existsLocally = goldenDatabase[teamKey].roster.find(p => p.gameName.toLowerCase() === apiPlayer.summoner_name.toLowerCase());
                if (!existsLocally) {
                    goldenDatabase[teamKey].roster.push({
                        playerId: "UNKNOWN_LOCAL",
                        gameName: apiPlayer.summoner_name,
                        role: "UNKNOWN",
                        rosterStatus: "api_only",
                        isCaptain: apiPlayer.is_leader,
                        api_id: apiPlayer.id,
                        in_api_roster: true,
                        missing_in_local: true
                    });
                }
            });

            // 3. INHERIT AND FORMAT ALL MATCHES
            if (apiData.matches) {
                goldenDatabase[teamKey].matches = apiData.matches.map(m => {
                    // Ensure the confirmed flag is explicitly a boolean for downstream scripts
                    const isConfirmed = m.match_begin_confirmed !== undefined ? Boolean(m.match_begin_confirmed) : false;
                    
                    return {
                        id: m.id,
                        match_id: m.match_id,
                        match_type: m.match_type,
                        match_day: m.match_day,
                        begin: m.begin,
                        confirmed: isConfirmed, // <-- The critical flag for your downstream scripts
                        result: m.result || null,
                        prime_league_link: m.prime_league_link,
                        updated_at: m.updated_at,
                        enemy_team: m.enemy_team ? {
                            id: m.enemy_team.id,
                            name: m.enemy_team.name,
                            team_tag: m.enemy_team.team_tag,
                            prime_league_link: m.enemy_team.prime_league_link,
                            logo_url: m.enemy_team.logo_url || null // Included if API provides it here
                        } : null,
                        team_lineup: m.team_lineup || [],
                        enemy_lineup: m.enemy_lineup || []
                    };
                });
            }

        } catch (e) {
            console.error(`❌ Error fetching data for ${teamKey}:`, e.message);
        }

        // Respect API rate limits
        await new Promise(r => setTimeout(r, 250));
    }

    // Write the Golden JSON
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(goldenDatabase, null, 2));
    console.log(`✅ Golden Data successfully built: ${OUTPUT_PATH}`);
}

buildGoldenJSON();
