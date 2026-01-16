const fs = require('fs');
const API_KEY = process.env.RIOT_API_KEY;

const teams = {
    "prime": [
        { gameName: 'UIC Speedy', tagLine: 'EUW' },
        { gameName: 'UIC Niki', tagLine: 'AMB' },
        { gameName: 'UIC Shenycrane', tagLine: 'Vugel' },
        { gameName: 'UIC Giani', tagLine: '999' },
        { gameName: 'UIC Baguetto', tagLine: 'R3kt' }
    ], // Added comma
    "spark": [
        { gameName: 'skanpy', tagLine: '3005' },
        { gameName: 'UIC Lenno', tagLine: 'UIC' },
        { gameName: 'UIC Rhinoshield', tagLine: 'RIN' },
        { gameName: 'UIC Flare', tagLine: 'JND' },
        { gameName: 'UIC Dragonfly', tagLine: '1299' }
    ], // Added comma
    "ember": [
        { gameName: 'SilasX', tagLine: 'EUWde' },
        { gameName: 'UIC Shederen', tagLine: 'Ger' },
        { gameName: 'ResetHoe', tagLine: 'Kata' },
        { gameName: 'UIC DontMethWith', tagLine: 'AMB' },
        { gameName: 'UIC Envy', tagLine: 'UIC' }
    ], // Added comma
    "nova": [
        { gameName: 'UIC adedier', tagLine: 'EUWE' },
        { gameName: 'UIC Rubix Qube', tagLine: 'MÖP' },
        { gameName: 'Apathy', tagLine: 'Azir' },
        { gameName: 'UIC Simply', tagLine: '666' },
        { gameName: 'UIC Excellent C', tagLine: '1997' }
    ], // Added comma
    "abyss": [
        { gameName: 'Dany', tagLine: 'RFA40' },
        { gameName: 'UIC Keygasza', tagLine: '1337' },
        { gameName: 'UIC Goku', tagLine: 'UIC' },
        { gameName: 'UIC N1ghtm4reX', tagLine: 'H96' },
        { gameName: 'TheEigeeen', tagLine: 'EIGI' }
    ], // Added comma
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
        // 1. Account-V1 (PUUID)
        const accUrl = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(player.name)}/${encodeURIComponent(player.tag)}?api_key=${API_KEY}`;
        const accRes = await fetch(accUrl);
        const accData = await accRes.json();
        if (!accData.puuid) return null;

        // 2. Summoner-V4 (ID & Level)
        const summUrl = `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${accData.puuid}?api_key=${API_KEY}`;
        const summRes = await fetch(summUrl);
        const summData = await summRes.json();

        // 3. League-V4 (Ranked Stats)
        const leagueUrl = `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summData.id}?api_key=${API_KEY}`;
        const leagueRes = await fetch(leagueUrl);
        const leagueData = await leagueRes.json();
        const soloQ = leagueData.find(m => m.queueType === 'RANKED_SOLO_5x5') || { tier: 'UNRANKED', rank: '', wins: 0, losses: 0 };

        return {
            name: player.name,
            level: summData.summonerLevel,
            rank: `${soloQ.tier} ${soloQ.rank}`.trim(),
            wl: `${soloQ.wins}/${soloQ.losses}`,
            icon: `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${summData.profileIconId}.png`
        };
    } catch (e) {
        console.error(`Error for ${player.name}:`, e.message);
        return null;
    }
}

async function start() {
    let finalData = {};
    for (const [teamName, players] of Object.entries(teams)) {
        for (let i = 0; i < players.length; i++) {
            const stats = await getPlayerData(players[i]);
            if (stats) {
                const key = `${teamName}_${roles[i]}`;
                finalData[key] = stats;
            }
            // Rate limit safety: 1.2s delay between players (3 calls each = ~100 calls/2 mins)
            await sleep(1200);
        }
    }
    fs.writeFileSync('data.json', JSON.stringify(finalData, null, 2));
}

start();