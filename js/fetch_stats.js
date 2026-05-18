const fs = require('fs');
const path = require('path');
const API_KEY = process.env.RIOT_API_KEY;

if (!API_KEY) {
    console.error("❌ CRITICAL: RIOT_API_KEY is not defined in Environment Variables!");
    process.exit(1);
}

// --- THE ADAPTER ---
// Read the new automated database
const rawTeamsData = JSON.parse(fs.readFileSync('./data/teams.json', 'utf-8'));

// Update target output directory to /data to keep the root clean
const OUTPUT_PATH = path.resolve(process.cwd(), 'data', 'data.json');
// -------------------

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getLatestPatch() {
    const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions = await res.json();
    return versions[0]; 
}

async function getPlayerData(player, patchVersion) {
    // GATE 1: Skip API calls for Staff or Empty Slots
    if (player.trackStats === false || !player.gameName) {
        return {
            name: player.gameName || "OPEN SPOT",
            role: player.role,
            level: 0, 
            tier: player.gameName ? "STAFF" : "RECRUITING", 
            lp: 0,
            wins: 0, 
            losses: 0, 
            winRate: 0, 
            icon: null
        };
    }

    try {
        let puuid = player.puuid;

        // GATE 2 & 3: Use existing PUUID to save API limits, fallback if missing
        if (!puuid || puuid.trim() === "") {
            console.log(`   [API] Fetching missing PUUID for ${player.gameName}...`);
            const name = encodeURIComponent(player.gameName);
            const tag = encodeURIComponent(player.tagLine);
            
            const accRes = await fetch(`https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${name}/${tag}?api_key=${API_KEY}`);
            if (!accRes.ok) throw new Error("PUUID not found via Riot ID");
            const accData = await accRes.json();
            puuid = accData.puuid;
        }

        // Fetch Summoner Data (Icon and Level)
        const summRes = await fetch(`https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${API_KEY}`);
        if (!summRes.ok) throw new Error("Summoner data not found");
        const summData = await summRes.json();

        // Fetch League Data (Ranked Stats)
        const leagueRes = await fetch(`https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}?api_key=${API_KEY}`);
        const leagueData = await leagueRes.json();

        let soloQ = { tier: 'UNRANKED', rank: '', wins: 0, losses: 0, leaguePoints: 0 };
        if (Array.isArray(leagueData)) {
            const found = leagueData.find(m => m.queueType === 'RANKED_SOLO_5x5');
            if (found) soloQ = found;
        }

        let winRate = 0;
        if ((soloQ.wins + soloQ.losses) > 0) {
            winRate = ((soloQ.wins / (soloQ.wins + soloQ.losses)) * 100).toFixed(1);
        }

        return {
            name: player.gameName,
            role: player.role,
            level: summData.summonerLevel || 0,
            tier: soloQ.tier === 'UNRANKED' ? 'UNRANKED' : `${soloQ.tier} ${soloQ.rank}`,
            lp: soloQ.leaguePoints,
            wins: soloQ.wins,
            losses: soloQ.losses,
            winRate: parseFloat(winRate),
            icon: `https://ddragon.leagueoflegends.com/cdn/${patchVersion}/img/profileicon/${summData.profileIconId || 0}.png`
        };

    } catch (e) {
        console.error(`⚠️ Failed to fetch ${player.gameName}: ${e.message}`);
        return {
            name: player.gameName || "OPEN SPOT",
            role: player.role,
            level: 0, tier: "ERROR", lp: 0,
            wins: 0, losses: 0, winRate: 0, icon: null
        };
    }
}

async function start() {
    console.log("🚀 Syncing Roster & Fetching Latest Patch...");
    const currentPatch = await getLatestPatch();
    console.log(`✨ Using Data Dragon Patch: ${currentPatch}`);

    let finalData = {};

    // Loop through the new teams.json structure
    for (const [teamKey, teamData] of Object.entries(rawTeamsData)) {
        if (!teamData.roster) continue;

        console.log(`\n--- ${teamKey.toUpperCase()} ---`);
        finalData[teamKey] = []; 
        
        for (const player of teamData.roster) {
            const stats = await getPlayerData(player, currentPatch);
            finalData[teamKey].push(stats);
            console.log(`✅ [${stats.role}] ${stats.name}: ${stats.tier} (${stats.lp} LP)`);
            
            // Only sleep to respect rate limits if we actually hit the API
            if (player.trackStats !== false && player.gameName) {
                await sleep(1500); 
            }
        }
    }

    // Write to the new nested directory
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalData, null, 2));
    console.log(`\n🎉 data.json generated successfully at: ${OUTPUT_PATH}`);
}

start();
