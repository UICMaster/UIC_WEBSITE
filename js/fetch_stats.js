const fs = require('fs');
const API_KEY = process.env.RIOT_API_KEY;

// Verify API Key exists at start
if (!API_KEY) {
    console.error("❌ CRITICAL: RIOT_API_KEY is not defined in Environment Variables!");
    process.exit(1);
}

const teams = {
    "prime": [
        { gameName: 'UIC Speedy', tagLine: 'EUW' },
        { gameName: 'UIC Niki', tagLine: 'AMB' },
        { gameName: 'UIC Shenycrane', tagLine: 'Vugel' },
        { gameName: 'UIC Giani', tagLine: '999' },
        { gameName: 'UIC Baguetto', tagLine: 'R3kt' }
    ],
    "spark": [
        { gameName: 'skanpy', tagLine: '3005' },
        { gameName: 'UIC Lenno', tagLine: 'UIC' },
        { gameName: 'UIC Rhinoshield', tagLine: 'RIN' },
        { gameName: 'UIC Flare', tagLine: 'JND' },
        { gameName: '', tagLine: '' }, 
        { gameName: 'soulrender', tagLine: 'fent' }
    ],
    "ember": [
        { gameName: 'SilasX', tagLine: 'EUWde' },
        { gameName: 'UIC Shederen', tagLine: 'Ger' },
        { gameName: 'ResetHoe', tagLine: 'Kata' },
        { gameName: 'UIC DontMethWith', tagLine: 'AMB' },
        { gameName: 'UIC Envy', tagLine: 'UIC' }, 
        { gameName: 'RatHairedShanks', tagLine: 'NoPie' }
    ],
    "nova": [
        { gameName: 'TAS Kaetaya', tagLine: 'XwX' },
        { gameName: 'UIC Rubix Qube', tagLine: 'MÖP' },
        { gameName: 'UIC adedier', tagLine: 'EUWE' },
        { gameName: 'UIC Simply', tagLine: '666' },
        { gameName: 'UIC Excellent C', tagLine: '1997' }
    ],
    "abyss": [
        { gameName: 'Dany', tagLine: 'RFA40' },
        { gameName: 'UIC Keygasza', tagLine: '1337' },
        { gameName: 'UIC Goku', tagLine: 'UIC' },
        { gameName: 'UIC N1ghtm4reX', tagLine: 'H96' },
        { gameName: 'TheEigeeen', tagLine: 'EIGI' }
    ],
    "night": [
        { gameName: 'UIC proStarII', tagLine: 'UIC' },
        { gameName: 'Shekar', tagLine: '5ONiT' },
        { gameName: 'RatHairedShanks', tagLine: 'NoPie' },
        { gameName: 'Cedopanya', tagLine: 'EUW' },
        { gameName: 'UIC ReCord', tagLine: 'Cedo' }
    ],
    "freezer": [
        { gameName: 'Rayando07', tagLine: 'grag' },
        { gameName: 'BlauerKlaus', tagLine: 'Qvy心' },
        { gameName: 'UIC FrozenHands', tagLine: 'MID' },
        { gameName: 'RG AutumnLeaf', tagLine: 'Moo' },
        { gameName: 'UIC Ryu Copeland', tagLine: '117' },
        { gameName: 'UIC Loonz', tagLine: 'Coach' }
    ]
};

const roles = ["top", "jgl", "mid", "bot", "sup", "coach"];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getPlayerData(player) {
    try {
        const name = encodeURIComponent(player.gameName);
        const tag = encodeURIComponent(player.tagLine);
        
        // 1. Account-V1: Get PUUID (The "Source of Truth")
        const accRes = await fetch(`https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${name}/${tag}?api_key=${API_KEY}`);
        const accData = await accRes.json();
        if (!accData.puuid) return null;

        const puuid = accData.puuid;

        // 2. Summoner-V4: Get Icon and Level
        const summRes = await fetch(`https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${API_KEY}`);
        const summData = await summRes.json();

        // 3. League-V4 (BY PUUID): Get Ranked Stats
        // Using your high-limit endpoint for better reliability
        const leagueRes = await fetch(`https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}?api_key=${API_KEY}`);
        const leagueData = await leagueRes.json();

        let soloQ = { tier: 'UNRANKED', rank: '', wins: 0, losses: 0 };
        
        if (Array.isArray(leagueData)) {
            // Strictly filter for SoloQ
            const found = leagueData.find(m => m.queueType === 'RANKED_SOLO_5x5');
            if (found) {
                soloQ = found;
            } else {
                console.log(`ℹ️ ${player.gameName} has no SoloQ entries (might play Flex/Arena).`);
            }
        }

        return {
            name: player.gameName,
            level: summData.summonerLevel || 0,
            rank: soloQ.tier === 'UNRANKED' ? 'UNRANKED' : `${soloQ.tier} ${soloQ.rank}`,
            wl: `${soloQ.wins}/${soloQ.losses}`,
            icon: `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${summData.profileIconId || 0}.png`
        };
    } catch (e) {
        console.error(`⚠️ Failed to fetch ${player.gameName}: ${e.message}`);
        return null;
    }
}

async function start() {
    let finalData = {};
    console.log("🚀 Starting PUUID-Based Data Sync...");

    for (const [teamName, players] of Object.entries(teams)) {
        console.log(`\n--- ${teamName.toUpperCase()} ---`);
        for (let i = 0; i < players.length; i++) {
            const stats = await getPlayerData(players[i]);
            if (stats) {
                const key = `${teamName}_${roles[i]}`;
                finalData[key] = stats;
                console.log(`✅ [${roles[i].toUpperCase()}] ${stats.name}: ${stats.rank} (${stats.wl})`);
            }
            // We can speed this up slightly because your limits are higher
            await sleep(500); 
        }
    }

    fs.writeFileSync('data.json', JSON.stringify(finalData, null, 2));
    console.log("\n🎉 data.json updated via PUUID endpoint.");
}

start();





