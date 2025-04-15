fetch('https://riot-api-backend.onrender.com/api/rankings')
.then(res => res.json())
.then(data => {
  data.forEach((player, index) => {
    const num = index + 1;
    const baseId = `player${num}`;

    if (player.error) {
      document.getElementById(`${baseId}_elo`).innerText = 'Error';
      document.getElementById(`${baseId}_stats`).innerText = player.error;
      return;
    }

    // Fill in data
    const icon = document.getElementById(`${baseId}_summoner`);
    const elo = document.getElementById(`${baseId}_elo`);
    const stats = document.getElementById(`${baseId}_stats`);
    const level = document.getElementById(`${baseId}_level`);

    if (icon) {
      icon.src = `https://ddragon.leagueoflegends.com/cdn/14.7.1/img/profileicon/${player.profileIconId}.png`;
    }

    if (elo) {
      //   elo.textContent = player.rank; 
      elo.textContent = `${player.rank} (${player.lp} LP)`;
    }

    if (stats) {
      stats.textContent = `${player.wins} / ${player.losses}`;
    }

    if (level) {
      level.textContent = player.summonerLevel;
    }
  });
})
.catch(error => {
  console.error('Error fetching player data:', error);
});