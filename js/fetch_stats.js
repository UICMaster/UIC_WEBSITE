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
        { gameName: 'UIC Dragonfly', tagLine: '1299' }
    ],
    "ember": [
        { gameName: 'SilasX', tagLine: 'EUWde' },
        { gameName: 'UIC Shederen', tagLine: 'Ger' },
        { gameName: 'ResetHoe', tagLine: 'Kata' },
        { gameName: 'UIC DontMethWith', tagLine: 'AMB' },
        { gameName: 'UIC Envy', tagLine: 'UIC' }
    ],
    "nova": [
        { gameName: 'UIC adedier', tagLine: 'EUWE' },
        { gameName: 'UIC Rubix Qube', tagLine: 'MÖP' },
        { gameName: 'Apathy', tagLine: 'Azir' },
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
    ]
};

const roles = ["top", "jgl", "mid", "bot", "sup"];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getPlayerData(player) {
    try {
        // 1. Account-V1
        const accUrl = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(player.gameName)}/${encodeURIComponent(player.tagLine)}?api_key=${API_KEY}`;
        const accRes = await fetch(accUrl);
        const accData = await accRes.json();
        
        if (!accData.puuid) return null;

        // 2. Summoner-V4
        const summUrl = `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${accData.puuid}?api_key=${API_KEY}`;
        const summRes = await fetch(summUrl);
        const summData = await summRes.json();
        
        // If we have summoner data but it's an error object, log it
        if (summData.status) {
            console.error(`❌ Riot API Error for ${player.gameName}: ${summData.status.message}`);
            return null;
        }

        // 3. League-V4 (Ranked Stats)
        // Note: The 'id' field from Summoner-V4 is required here
        const leagueUrl = `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summData.id}?api_key=${API_KEY}`;
        const leagueRes = await fetch(leagueUrl);
        const leagueData = await leagueRes.json();

        let soloQ = { tier: 'UNRANKED', rank: '', wins: 0, losses: 0 };
        if (Array.isArray(leagueData)) {
            const found = leagueData.find(m => m.queueType === 'RANKED_SOLO_5x5');
            if (found) soloQ = found;
        }

        return {
            name: player.gameName,
            level: summData.summonerLevel,
            rank: soloQ.tier === 'UNRANKED' ? 'UNRANKED' : `${soloQ.tier} ${soloQ.rank}`,
            wl: `${soloQ.wins}/${soloQ.losses}`,
            icon: `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${summData.profileIconId}.png`
        };
    } catch (e) {
        console.error(`⚠️ Error fetching ${player.gameName}: ${e.message}`);
        return null;
    }
}

async function start() {
    let finalData = {};
    console.log("🚀 Starting Production Data Sync...");

    for (const [teamName, players] of Object.entries(teams)) {
        console.log(`\n--- Team: ${teamName.toUpperCase()} ---`);
        for (let i = 0; i < players.length; i++) {
            const stats = await getPlayerData(players[i]);
            if (stats) {
                const key = `${teamName}_${roles[i]}`;
                finalData[key] = stats;
                console.log(`✅ [${roles[i].toUpperCase()}] ${stats.name} - ${stats.rank}`);
            } else {
                console.log(`❌ [${roles[i].toUpperCase()}] ${players[i].gameName} - Failed`);
            }
            // 1.5s delay to be extremely safe with rate limits
            await sleep(1500); 
        }
    }

    fs.writeFileSync('data.json', JSON.stringify(finalData, null, 2));
    console.log("\n🎉 Update Complete. data.json is saved.");
}

start();
