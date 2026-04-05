const https = require('https');
const fs = require('fs');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

const options = {
  hostname: 'discord.com',
  path: `/api/v10/guilds/${GUILD_ID}/scheduled-events`,
  headers: {
    Authorization: `Bot ${DISCORD_TOKEN}`
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const events = JSON.parse(data);
      
      if (!fs.existsSync('./data')) {
        fs.mkdirSync('./data');
      }

      const cleanedEvents = events.map(e => ({
        name: e.name,
        description: e.description,
        start: e.scheduled_start_time,
        location: e.entity_metadata?.location || "https://discord.gg/ultrainstinctcrew"
      }));

      fs.writeFileSync('./data/events.json', JSON.stringify(cleanedEvents, null, 2));
      console.log(`Erfolgreich ${cleanedEvents.length} Events synchronisiert.`);
    } catch (err) {
      console.error("Fehler beim Parsen der Discord-Daten:", err);
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error("HTTP Fehler:", err);
  process.exit(1);
});