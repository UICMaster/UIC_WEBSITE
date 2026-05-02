const fs = require('fs');
const API_KEY = process.env.RIOT_API_KEY;

if (!API_KEY) {
    console.error("❌ CRITICAL: RIOT_API_KEY is not defined in Environment Variables!");
    process.exit(1);
}

const roster = JSON.parse(fs.readFileSync('./roster.json', 'utf-8'));
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Auto-Fetch the absolute latest Riot Patch for images
async function getLatestPatch() {
    const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions = await res.json();
    return versions[0]; 
}

async function getPlayerData(player, patchVersion) {
    try {
        const name = encodeURIComponent(player.gameName);
        const tag = encodeURIComponent(player.tagLine);
        
        // 1. Account-V1: Get PUUID
        const accRes = await fetch(`https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${name}/${tag}?api_key=${API_KEY}`);
        const accData = await accRes.json();
        if (!accData.puuid) throw new Error("PUUID not found");

        const puuid = accData.puuid;

        // 2. Summoner-V4: Get Icon and Level
        const summRes = await fetch(`https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${API_KEY}`);
        const summData = await summRes.json();

        // 3. League-V4: Get Ranked Stats
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
            level: 0, tier: "RECRUITING", lp: 0,
            wins: 0, losses: 0, winRate: 0, icon: null
        };
    }
}

async function start() {
    console.log("🚀 Syncing Roster & Fetching Latest Patch...");
    const currentPatch = await getLatestPatch();
    console.log(`✨ Using Data Dragon Patch: ${currentPatch}`);

    let finalData = {};

    for (const [teamName, players] of Object.entries(roster)) {
        console.log(`\n--- ${teamName.toUpperCase()} ---`);
        finalData[teamName] = []; 
        
        for (const player of players) {
            const stats = await getPlayerData(player, currentPatch);
            finalData[teamName].push(stats);
            console.log(`✅ [${stats.role}] ${stats.name}: ${stats.tier} (${stats.lp} LP)`);
            await sleep(500); 
        }
    }

    // Notice: Writing to the root directory where your GitHub action expects it
    fs.writeFileSync('./data.json', JSON.stringify(finalData, null, 2));
    console.log("\n🎉 data.json generated successfully.");
}

start();
