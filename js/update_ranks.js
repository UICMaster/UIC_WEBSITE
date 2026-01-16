const fs = require('fs');
const https = require('https');

const API_KEY = process.argv[2];

async function request(url) {
  return new Promise((resolve, reject) => {
    https.get(`${url}?api_key=${API_KEY}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function run() {
  const players = JSON.parse(fs.readFileSync('players.json', 'utf8'));
  const results = {};

  for (const p of players) {
    if (p.puuid === "PASTE_PUUID_HERE") continue;
    try {
      console.log(`Updating ${p.name}...`);
      // 1. Get Summoner ID from PUUID
      const sum = await request(`https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${p.puuid}`);
      
      // 2. Get Rank from Summoner ID
      const ranks = await request(`https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${sum.id}`);
      
      const solo = ranks.find(r => r.queueType === 'RANKED_SOLO_5x5');
      results[p.name.toUpperCase()] = solo ? `${solo.tier} ${solo.rank} (${solo.leaguePoints} LP)` : 'UNRANKED';
      
      // Delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 1200)); 
    } catch (e) {
      console.error(`Failed for ${p.name}:`, e.message);
      results[p.name.toUpperCase()] = 'DATA ERROR';
    }
  }

  fs.writeFileSync('data.json', JSON.stringify(results, null, 2));
}

run();
