const baseIconUrl = 'https://ddragon.leagueoflegends.com/cdn/14.8.1/img/profileicon/';

    fetch('https://riot-api-backend.onrender.com/api/rankings')
      .then(response => response.json())
      .then(data => {
        data.forEach((player, index) => {
          const playerId = index + 1;

          // Profile icon
          const iconElement = document.getElementById(`player${playerId}_summoner`);
          if (iconElement && player.profileIconId) {
            iconElement.src = `${baseIconUrl}${player.profileIconId}.png`;
          }

          // Level
          const levelElement = document.getElementById(`player${playerId}_level`);
          if (levelElement) {
            levelElement.innerText = `Level: ${player.summonerLevel ?? 'N/A'}`;
          }

          // Elo/Rank
          const eloElement = document.getElementById(`player${playerId}_elo`);
          if (eloElement) {
            eloElement.innerText = `Rank: ${player.rank}`;
          }

          // Stats
          const statsElement = document.getElementById(`player${playerId}_stats`);
          if (statsElement) {
            statsElement.innerText = `LP: ${player.lp}, Wins: ${player.wins}, Losses: ${player.losses}`;
          }
        });
      })
      .catch(error => console.error('Error fetching player data:', error));
