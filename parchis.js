const form = document.getElementById('players-form');
const playerNameInput = document.getElementById('player-name');
const addPlayerBtn = document.getElementById('add-player');
const playersListDiv = document.getElementById('players-list');
const setupSection = document.getElementById('setup');
const tournamentSection = document.getElementById('tournament');
const roundsContainer = document.getElementById('rounds-container');
const standingsTable = document.getElementById('standings').querySelector('tbody');
const nextRoundBtn = document.getElementById('next-round');
const cancelTournamentBtn = document.getElementById('cancel-tournament');

let players = [];
let rounds = [];
let standings = [];
let currentRound = 0;
let swissRounds = 0;

function normalizeName(name) {
    name = name.trim();
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function renderPlayersList() {
    playersListDiv.innerHTML = '';
    players.forEach((name, idx) => {
        const span = document.createElement('span');
        span.className = 'player-tag';
        span.textContent = name;
        playersListDiv.appendChild(span);
    });
}

addPlayerBtn.onclick = function(e) {
    e.preventDefault();
    let name = normalizeName(playerNameInput.value);
    if (!name) return;
    if (players.includes(name)) {
        playerNameInput.value = '';
        playerNameInput.focus();
        return;
    }
    players.push(name);
    renderPlayersList();
    playerNameInput.value = '';
    playerNameInput.focus();
};

form.onsubmit = function(e) {
    e.preventDefault();
    if (players.length < 4) {
        alert('Se requieren al menos 4 jugadores.');
        return;
    }
    swissRounds = Math.ceil(Math.log2(players.length));
    standings = players.map(name => ({ name, points: 0, played: [] }));
    setupSection.style.display = 'none';
    tournamentSection.style.display = '';
    currentRound = 0;
    rounds = [];
    renderStandings();
    generateNextRound();
};

cancelTournamentBtn.onclick = function() {
    // Reiniciar todo
    players = [];
    rounds = [];
    standings = [];
    currentRound = 0;
    swissRounds = 0;
    setupSection.style.display = '';
    tournamentSection.style.display = 'none';
    renderPlayersList();
    playerNameInput.value = '';
    playerNameInput.focus();
    roundsContainer.innerHTML = '';
    standingsTable.innerHTML = '';
};

function renderStandings() {
    standings.sort((a, b) => b.points - a.points);
    standingsTable.innerHTML = '';
    for (const s of standings) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${s.name}</td><td>${s.points}</td>`;
        standingsTable.appendChild(tr);
    }
}

function generateNextRound() {
    // Emparejamiento suizo: grupos de 4, pero si sobran 1 o 2, hacer una mesa de 3
    standings.sort((a, b) => b.points - a.points);
    const available = [...standings];
    const matches = [];
    while (available.length >= 4) {
        // Si quedan 5 o 7, hacer una mesa de 3 para que nadie quede fuera
        if (available.length === 7) {
            matches.push(available.splice(0, 3).map(p => p.name));
        } else if (available.length === 5) {
            matches.push(available.splice(0, 3).map(p => p.name));
        } else {
            matches.push(available.splice(0, 4).map(p => p.name));
        }
    }
    if (available.length === 3) {
        matches.push(available.splice(0, 3).map(p => p.name));
    }
    // Ahora todos juegan
    rounds.push({ matches, results: [] });
    renderRound(matches);
}

function renderRound(matches) {
    roundsContainer.innerHTML = `<h3>Ronda ${currentRound + 1} de ${swissRounds}</h3>`;
    // Estado local de selección por mesa
    const mesaSelections = matches.map(group => ({ first: null, second: null }));

    matches.forEach((group, idx) => {
        const div = document.createElement('div');
        div.className = 'match-group';
        div.innerHTML = `<strong>Mesa ${idx + 1}:</strong>`;

        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.padding = '0';
        ul.style.margin = '10px 0 0 0';

        group.forEach(name => {
            const li = document.createElement('li');
            li.textContent = name;
            li.className = 'mesa-player';
            li.style.display = 'inline-block';
            li.style.marginRight = '18px';
            li.style.padding = '7px 18px';
            li.style.borderRadius = '6px';
            li.style.cursor = 'pointer';
            li.style.transition = 'background 0.2s, box-shadow 0.2s';
            li.style.border = '1.2px solid #e3eafc';
            li.style.background = '#fff';

            // Estado visual
            function updateStyle() {
                if (mesaSelections[idx].first === name) {
                    li.style.background = '#3576e0';
                    li.style.color = '#fff';
                    li.style.fontWeight = '700';
                    li.style.boxShadow = '0 2px 8px rgba(53,118,224,0.13)';
                    li.innerHTML = name + ' <span style="font-size:0.9em;">🥇</span>';
                } else if (mesaSelections[idx].second === name) {
                    li.style.background = '#b6c6e3';
                    li.style.color = '#23408e';
                    li.style.fontWeight = '600';
                    li.style.boxShadow = '0 1px 4px rgba(35,64,142,0.08)';
                    li.innerHTML = name + ' <span style="font-size:0.9em;">🥈</span>';
                } else {
                    li.style.background = '#fff';
                    li.style.color = '#23408e';
                    li.style.fontWeight = '400';
                    li.style.boxShadow = 'none';
                    li.innerHTML = name;
                }
            }
            updateStyle();

            li.onclick = function() {
                // Si ya es primero, desmarcar
                if (mesaSelections[idx].first === name) {
                    mesaSelections[idx].first = null;
                } else if (mesaSelections[idx].second === name) {
                    mesaSelections[idx].second = null;
                } else if (!mesaSelections[idx].first) {
                    mesaSelections[idx].first = name;
                } else if (!mesaSelections[idx].second) {
                    if (mesaSelections[idx].first !== name) mesaSelections[idx].second = name;
                }
                // Si se marca como primero y era segundo, quitar de segundo
                if (mesaSelections[idx].first === name && mesaSelections[idx].second === name) {
                    mesaSelections[idx].second = null;
                }
                updateAllStyles();
            };

            ul.appendChild(li);

            // Guardar para actualizar todos
            if (!div._players) div._players = [];
            div._players.push({ li, name });
        });

        function updateAllStyles() {
            div._players.forEach(({ li, name }) => {
                if (mesaSelections[idx].first === name) {
                    li.style.background = '#3576e0';
                    li.style.color = '#fff';
                    li.style.fontWeight = '700';
                    li.style.boxShadow = '0 2px 8px rgba(53,118,224,0.13)';
                    li.innerHTML = name + ' <span style="font-size:0.9em;">🥇</span>';
                } else if (mesaSelections[idx].second === name) {
                    li.style.background = '#b6c6e3';
                    li.style.color = '#23408e';
                    li.style.fontWeight = '600';
                    li.style.boxShadow = '0 1px 4px rgba(35,64,142,0.08)';
                    li.innerHTML = name + ' <span style="font-size:0.9em;">🥈</span>';
                } else {
                    li.style.background = '#fff';
                    li.style.color = '#23408e';
                    li.style.fontWeight = '400';
                    li.style.boxShadow = 'none';
                    li.innerHTML = name;
                }
            });
        }

        div.appendChild(ul);
        roundsContainer.appendChild(div);
    });

    nextRoundBtn.style.display = 'inline-block';
    nextRoundBtn.disabled = false;
    nextRoundBtn.onclick = () => {
        let valid = true;
        let results = [];
        for (let i = 0; i < matches.length; i++) {
            const group = matches[i];
            const sel = mesaSelections[i];
            if (!sel.first || !sel.second) {
                alert('Debes seleccionar primero y segundo en la mesa ' + (i+1));
                valid = false;
                break;
            }
            if (sel.first === sel.second) {
                alert('El primero y segundo no pueden ser el mismo jugador en la mesa ' + (i+1));
                valid = false;
                break;
            }
            results.push({ group, first: sel.first, second: sel.second });
        }
        if (!valid) return;
        // Asignar puntos
        for (const { group, first, second } of results) {
            for (const name of group) {
                const player = standings.find(p => p.name === name);
                if (name === first) player.points += 2;
                else if (name === second) player.points += 1;
            }
        }
        currentRound++;
        renderStandings();
        if (currentRound < swissRounds) {
            generateNextRound();
        } else {
            roundsContainer.innerHTML = '<h3>Torneo finalizado</h3>';
            nextRoundBtn.style.display = 'none';
        }
    };
}
