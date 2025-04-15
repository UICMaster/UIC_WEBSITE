fetch('https://riot-api-backend.onrender.com/api/rankings')
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById('players-container');

        data.forEach(player => {
          const card = document.createElement('div');
          card.className = 'player-card';

          if (player.error) {
            card.innerHTML = `<strong>${player.gameName}#${player.tagLine}</strong><br>Error: ${player.error}`;
            container.appendChild(card);
            return;
          }

          card.innerHTML = `
            <div class="player-header">
              <img id="${player.id}_summoner" src="https://ddragon.leagueoflegends.com/cdn/14.7.1/img/profileicon/${player.profileIconId}.png" alt="Icon" />
              <div>
                <strong>${player.gameName}#${player.tagLine}</strong><br>
                Level <span id="${player.id}_level">${player.level}</span>
              </div>
            </div>
            <p>ELO: <span id="${player.id}_elo">${player.rank}</span></p>
            <p>Stats: <span id="${player.id}_stats">LP: ${player.lp}, Wins: ${player.wins}, Losses: ${player.losses}</span></p>
          `;

          container.appendChild(card);
        });
      });