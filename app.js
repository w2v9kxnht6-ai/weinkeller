// Weinkeller PWA - App Logic
let db = null;
let allWines = [];
let currentFilter = 'alle';

// SQL.js initialisieren und DB laden
async function initDB() {
    try {
        // SQL.js laden
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        
        // DB-Datei laden (muss im gleichen Verzeichnis liegen)
        const response = await fetch('weinkeller.db');
        const buffer = await response.arrayBuffer();
        const data = new Uint8Array(buffer);
        
        db = new SQL.Database(data);
        
        // Daten laden
        loadData();
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        
    } catch (error) {
        document.getElementById('loading').innerHTML = `
            <div style="color: #ff6b6b;">
                <div style="font-size: 3em; margin-bottom: 20px;">⚠️</div>
                <div style="font-size: 1.2em; margin-bottom: 10px;">Fehler beim Laden</div>
                <div style="font-size: 0.9em; opacity: 0.8;">Stelle sicher, dass weinkeller.db im gleichen Ordner liegt</div>
                <div style="margin-top: 20px; font-size: 0.8em; opacity: 0.6;">${error.message}</div>
            </div>
        `;
    }
}

// Daten aus DB laden
function loadData() {
    const result = db.exec("SELECT * FROM weine WHERE position NOT LIKE 'GETRUNKEN%' ORDER BY position");
    
    if (result.length > 0) {
        const columns = result[0].columns;
        const values = result[0].values;
        
        allWines = values.map(row => {
            const wine = {};
            columns.forEach((col, i) => {
                wine[col] = row[i];
            });
            return wine;
        });
    }
    
    updateStats();
    renderWines();
}

// Statistiken aktualisieren
function updateStats() {
    const stats = db.exec(`
        SELECT 
            COUNT(*) as flaschen,
            ROUND(SUM(einkaufspreis), 2) as ek,
            ROUND(SUM(aktueller_wert), 2) as wert,
            ROUND(SUM(wertsteigerung_absolut), 2) as gewinn
        FROM weine
        WHERE position NOT LIKE 'GETRUNKEN%'
    `)[0].values[0];
    
    document.getElementById('stat-flaschen').textContent = stats[0];
    document.getElementById('stat-wert').textContent = `€${Math.round(stats[2])}`;
    document.getElementById('stat-perf').textContent = `+${Math.round((stats[2]/stats[1] - 1) * 100)}%`;
    document.getElementById('stat-gewinn').textContent = `€${Math.round(stats[3])}`;
    document.getElementById('subtitle').textContent = `${stats[0]} Flaschen · €${Math.round(stats[2])}`;
}

// Weine rendern
function renderWines(filter = currentFilter, search = '') {
    let wines = allWines;
    
    // Ring-Filter
    if (filter === 'rosa') wines = wines.filter(w => w.ring === 'Rosa');
    if (filter === 'gruen') wines = wines.filter(w => w.ring === 'Grün');
    if (filter === 'blau') wines = wines.filter(w => w.ring === 'Blau');
    
    // Such-Filter
    if (search) {
        const s = search.toLowerCase();
        wines = wines.filter(w => 
            (w.produzent && w.produzent.toLowerCase().includes(s)) ||
            (w.weinname && w.weinname.toLowerCase().includes(s)) ||
            (w.jahrgang && String(w.jahrgang).includes(s)) ||
            (w.position && w.position.toLowerCase().includes(s))
        );
    }
    
    const container = document.getElementById('wine-list');
    
    if (wines.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">🍷</div>
                <div>Keine Weine gefunden</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = wines.map(wine => {
        let ringHTML = '';
        if (wine.ring === 'Rosa') ringHTML = '<span class="ring ring-rosa">🌸 Rosa</span>';
        if (wine.ring === 'Grün') ringHTML = '<span class="ring ring-gruen">🟢 Grün</span>';
        if (wine.ring === 'Blau') ringHTML = '<span class="ring ring-blau">🔵 Blau</span>';
        
        return `
            <div class="wine-card" onclick="showWine(${wine.id})">
                <div class="header-row">
                    <div class="position">${wine.position}</div>
                    ${ringHTML}
                </div>
                <h3>${wine.weinname}</h3>
                <div class="producer">${wine.produzent} · ${wine.jahrgang || 'n/a'}</div>
                <div class="details">
                    <div class="detail">
                        <div class="label">Wert</div>
                        <div class="value">€${wine.aktueller_wert?.toFixed(0) || 0}</div>
                    </div>
                    <div class="detail">
                        <div class="label">Performance</div>
                        <div class="value performance">+${wine.wertsteigerung_prozent?.toFixed(0) || 0}%</div>
                    </div>
                    <div class="detail">
                        <div class="label">Trinkreife</div>
                        <div class="value">${wine.trinkreife_ende || '-'}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Wein-Details anzeigen
function showWine(id) {
    const wine = allWines.find(w => w.id === id);
    if (!wine) return;
    
    let ringHTML = '';
    if (wine.ring === 'Rosa') ringHTML = '<span class="ring ring-rosa">🌸 Rosa (2026)</span>';
    if (wine.ring === 'Grün') ringHTML = '<span class="ring ring-gruen">🟢 Grün (2027)</span>';
    if (wine.ring === 'Blau') ringHTML = '<span class="ring ring-blau">🔵 Blau (Highlight)</span>';
    
    const content = `
        <div class="modal-header">
            <h2>${wine.position}</h2>
            <button class="close-btn" onclick="closeModal()">×</button>
        </div>
        
        ${ringHTML}
        
        <h2 style="margin: 15px 0 5px;">${wine.weinname}</h2>
        <div style="color: #666; margin-bottom: 20px;">${wine.produzent}</div>
        
        <div class="detail-grid">
            <div class="detail-item">
                <div class="label">🗓️ Jahrgang</div>
                <div class="value">${wine.jahrgang || 'n/a'}</div>
            </div>
            <div class="detail-item">
                <div class="label">🍇 Traube</div>
                <div class="value">${wine.traube || 'n/a'}</div>
            </div>
            <div class="detail-item">
                <div class="label">🍾 Größe</div>
                <div class="value">${wine.flaschengroesse || 'n/a'}</div>
            </div>
            <div class="detail-item">
                <div class="label">🌡️ Alkohol</div>
                <div class="value">${wine.alkohol || 'n/a'}</div>
            </div>
            <div class="detail-item">
                <div class="label">🪵 Ausbau</div>
                <div class="value">${wine.ausbau || 'n/a'}</div>
            </div>
            <div class="detail-item">
                <div class="label">📅 Trinkreife</div>
                <div class="value">${wine.trinkreife_start || '-'} - ${wine.trinkreife_ende || '-'}</div>
            </div>
            ${wine.dekantierzeit ? `
            <div class="detail-item">
                <div class="label">🕐 Dekantieren</div>
                <div class="value">${wine.dekantierzeit}</div>
            </div>
            ` : ''}
        </div>
        
        <div class="perf-box">
            <div>Einkaufspreis: €${wine.einkaufspreis?.toFixed(2) || 0}</div>
            <div class="big">€${wine.aktueller_wert?.toFixed(2) || 0}</div>
            <div style="font-size: 1.3em;">Performance: +${wine.wertsteigerung_prozent?.toFixed(1) || 0}% (€${wine.wertsteigerung_absolut?.toFixed(2) || 0})</div>
        </div>
        
        ${wine.ratings ? `
        <div class="ratings-box">
            <div class="label">⭐ Ratings</div>
            <div>${wine.ratings}</div>
        </div>
        ` : ''}
        
        ${wine.notiz ? `
        <div style="background: #e6f3ff; border-left: 4px solid #2196F3; padding: 15px; border-radius: 10px; margin-top: 15px;">
            <div style="font-weight: bold; margin-bottom: 8px;">📝 Notiz</div>
            <div style="color: #555;">${wine.notiz}</div>
        </div>
        ` : ''}
    `;
    
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('modal').classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initDB();
    
    // Tab-Wechsel
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.tab;
            renderWines(currentFilter, document.getElementById('search').value);
        });
    });
    
    // Suche
    document.getElementById('search').addEventListener('input', (e) => {
        renderWines(currentFilter, e.target.value);
    });
    
    // Modal schließen bei Klick außerhalb
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') closeModal();
    });
});
