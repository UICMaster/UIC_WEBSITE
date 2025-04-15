async function fetchRankings() {
    try {
      const response = await fetch('https://riot-api-backend.onrender.com/api/rankings');
      const data = await response.json();

      data.forEach((player, index) => {
        const elementId = `player${index + 1}`;
        const element = document.getElementById(elementId);

        if (element) {
          if (player.error) {
            element.textContent = `${player.gameName}#${player.tagLine}: ${player.error}`;
          } else {
            element.textContent = `${player.gameName}#${player.tagLine}: ${player.rank} (${player.lp} LP) - ${player.wins}W / ${player.losses}L`;
          }
        }
      });
    } catch (error) {
      console.error("Error fetching rankings:", error);
    }
  }

  fetchRankings();