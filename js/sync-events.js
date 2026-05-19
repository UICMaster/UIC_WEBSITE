const https = require('https');
const fs = require('fs');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

const options = {
    hostname: 'discord.com',
    path: `/api/v10/guilds/${GUILD_ID}/scheduled-events`,
    headers: { Authorization: `Bot ${DISCORD_TOKEN}` }
};

https.get(options, (res) => {
    if (res.statusCode !== 200) {
        console.error(`API Fehler: HTTP ${res.statusCode}`);
        process.exit(1);
    }

    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const events = JSON.parse(data);
            
            if (!fs.existsSync('./data')) fs.mkdirSync('./data');

            const cleanedEvents = events.map(e => {
                const loc = e.entity_metadata?.location || "https://discord.gg/ultrainstinctcrew";
                const rawDesc = e.description || "Keine Beschreibung verfügbar.";
                
                // 1. Smarte Kategorisierung
                let eventType = "TOURNAMENT";
                let isHighlight = false;
                let teams = [];
                
                if (loc.includes('primeleague.gg')) {
                    eventType = "ESPORTS MATCH";
                    // Extrahiere Teams für SEO (sucht nach "vs." oder "vs")
                    if (e.name.toLowerCase().includes('vs')) {
                        teams = e.name.split(/vs\.?/i).map(teamName => teamName.trim());
                    }
                } else if (e.name.toLowerCase().includes('versammlung')) {
                    eventType = "ORGANIZATION";
                    isHighlight = true;
                }

                // 2. Endzeit Fallback (falls Discord-User keine Endzeit angeben)
                let endTime = e.scheduled_end_time;
                if (!endTime) {
                    const startObj = new Date(e.scheduled_start_time);
                    endTime = new Date(startObj.getTime() + 2 * 60 * 60 * 1000).toISOString();
                }

                // 3. Optionales Cover-Bild für SEO
                let imageUrl = null;
                if (e.image) {
                    imageUrl = `https://cdn.discordapp.com/guild-events/${e.id}/${e.image}.png?size=1024`;
                }

                return {
                    id: e.id,
                    name: e.name,
                    description: rawDesc,
                    type: eventType,
                    highlight: isHighlight,
                    start: e.scheduled_start_time,
                    end: endTime,
                    location: loc,
                    image: imageUrl,
                    competitors: teams
                };
            });

            // 4. Chronologische Sortierung
            cleanedEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

            fs.writeFileSync('./data/events.json', JSON.stringify(cleanedEvents, null, 2));
            console.log(`Erfolgreich ${cleanedEvents.length} Events synchronisiert und formatiert.`);
            
        } catch (err) {
            console.error("Fehler beim Verarbeiten der Discord-Daten:", err);
            process.exit(1);
        }
    });
}).on('error', (err) => {
    console.error("HTTP Netzwerkfehler:", err);
    process.exit(1);
});
