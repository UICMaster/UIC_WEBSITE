//* =========================================
//  1. TACTICAL HUD DATA LOADER (Dynamic)
//  ========================================= */
async function loadDynamicHUD() {
    try {
        const res = await fetch('./data/data.json');
        if (!res.ok) throw new Error("Data file not found");
        const data = await res.json(); 

        const tabsContainer = document.getElementById('dynamic-tabs');
        const gridsContainer = document.getElementById('dynamic-grids-container');
        
        if (!tabsContainer || !gridsContainer) return; // Prevent errors on other pages

        let isFirstTeam = true;

        for (const [teamName, players] of Object.entries(data)) {
            // --- 1. Generate Tab Button ---
            const tabBtn = document.createElement('button');
            tabBtn.className = `tab-btn ${isFirstTeam ? 'active' : ''}`;
            tabBtn.innerText = `UIC ${teamName.toUpperCase()}`;
            tabBtn.onclick = (e) => openTeam(e, teamName);
            tabsContainer.appendChild(tabBtn);

            // --- 2. Generate Team Grid ---
            const gridDiv = document.createElement('div');
            gridDiv.id = teamName;
            gridDiv.className = `grid-auto team-grid ${isFirstTeam ? 'active' : ''}`;

            // --- 3. Generate Player Cards ---
            players.forEach(player => {
                // Formatting Win Rate Color
                let wrColor = "inherit";
                if (player.winRate >= 50) wrColor = "#00ff88"; // Success green from your CSS
                if (player.winRate < 50 && player.wins > 0) wrColor = "#ff0055"; // Error red from your CSS

                const iconSrc = player.icon || 'assets/profile/placeholder.png';
                
                // Format Rank and Exact LP
                const rankDisplay = player.tier === "UNRANKED" || player.tier === "RECRUITING" 
                    ? player.tier 
                    : `${player.tier} <span style="font-size: 0.8em; color: var(--text-muted);">(${player.lp} LP)</span>`;
                
                // Format Win/Loss
                const statsDisplay = player.wins > 0 
                    ? `W/L: ${player.wins}/${player.losses} <span style="color:${wrColor}; font-weight:700;">(${player.winRate}%)</span>` 
                    : '&nbsp;';

                // We normalize the role for the image path (e.g., "HEAD COACH" -> "head_coach")
                const safeRoleForImage = player.role.toLowerCase().replace(' ', '_');

                gridDiv.innerHTML += `
                    <div class="card card--interactive card--profile">
                        <div class="role-badge">${player.role}</div>
                        <img src="assets/profile/${teamName}/${teamName}_${safeRoleForImage}.png" 
                             alt="${player.role}" 
                             class="card-img" 
                             onerror="this.src='assets/profile/profile_placeholder.png'">
                        
                        <div class="card-body">
                            <div class="player-identity">
                                <img src="${iconSrc}" class="mini-riot-icon" onerror="this.src='assets/profile/placeholder.png'">
                                <div class="name-box">
                                    <h3 class="card-title">${player.name}</h3>
                                    <span class="player-level">LVL <span>${player.level}</span></span>
                                </div>
                            </div>
                            <div class="player-status">
                                <div class="card-meta">${rankDisplay}</div>
                                <div class="card-stats">${statsDisplay}</div>
                            </div>
                        </div>
                    </div>
                `;
            });

            gridsContainer.appendChild(gridDiv);
            isFirstTeam = false;
        }
        
    } catch (e) {
        console.error("HUD Sync Error:", e);
    }
}

//* =========================================
//  2. TEAM TAB SYSTEM (Cyber-Switch)
//  ========================================= */
function openTeam(evt, teamName) {
    const teamGrids = document.getElementsByClassName("team-grid");
    for (let i = 0; i < teamGrids.length; i++) teamGrids[i].classList.remove("active");

    const tabLinks = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabLinks.length; i++) tabLinks[i].classList.remove("active");

    const selectedTeam = document.getElementById(teamName);
    if (selectedTeam) selectedTeam.classList.add("active");
    
    evt.currentTarget.classList.add("active");
    evt.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

// Initialize HUD on Page Load
document.addEventListener('DOMContentLoaded', loadDynamicHUD);
