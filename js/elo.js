async function loadRanks() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) return;
        const ranks = await response.json();

        // Target all card titles (Player Names)
        const cards = document.querySelectorAll('.card--profile');
        
        cards.forEach(card => {
            const nameEl = card.querySelector('.card-title');
            const metaEl = card.querySelector('.card-meta');
            
            if (nameEl && metaEl) {
                const playerName = nameEl.innerText.trim().toUpperCase();
                if (ranks[playerName]) {
                    metaEl.innerText = ranks[playerName];
                }
            }
        });
    } catch (e) {
        console.error("Rank data not ready yet.");
    }
}

document.addEventListener('DOMContentLoaded', loadRanks);
