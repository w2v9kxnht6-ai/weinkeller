import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
        
        const URL = 'https://cdxmdavnspgczenhgjmk.supabase.co'
        const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkeG1kYXZuc3BnY3plbmhnam1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMDI2NDEsImV4cCI6MjA4NjY3ODY0MX0.HgoScNFXdOTFKmPn5lJuh7V0GAoABPz61p1JcjDovbE'
        
        const db = createClient(URL, KEY)
        
        let wines = []
        let currentTab = 'alle'
        
        async function loadWines() {
            const { data, error } = await db.from('weine').select('*').order('position')
            if (error) throw error
            wines = data
            updateStats()
            renderWines()
        }
        
        function updateStats() {
            const active = wines.filter(w => !w.position.includes('GETRUNKEN'))
            const wert = active.reduce((s, w) => s + (w.aktueller_wert || 0), 0)
            const ek = active.reduce((s, w) => s + (w.einkaufspreis || 0), 0)
            document.getElementById('status').textContent = `${active.length} Flaschen · €${Math.round(wert)} · Cloud ✓`
        }
        
        function updateFilterStats(filtered) {
            const count = filtered.length
            const value = filtered.reduce((s, w) => s + (w.aktueller_wert || 0), 0)
            
            document.getElementById('filterCount').textContent = count
            document.getElementById('filterValue').textContent = Math.round(value)
            
            const statsEl = document.getElementById('filterStats')
            if (currentTab !== 'alle' || document.getElementById('search').value) {
                statsEl.classList.add('show')
            } else {
                statsEl.classList.remove('show')
            }
        }
        
        function getTrinkreifeClass(ende) {
            if (!ende) return 'trinkreife-normal'
            const year = parseInt(ende)
            if (year <= 2026) return 'trinkreife-rosa'
            if (year <= 2027) return 'trinkreife-gruen'
            return 'trinkreife-normal'
        }
        
        function renderWines() {
            const search = document.getElementById('search')?.value.toLowerCase() || ''
            let filtered = wines
            
            if (currentTab === 'rosa') filtered = filtered.filter(w => w.ring === 'Rosa' && !w.position.includes('GETRUNKEN'))
            else if (currentTab === 'gruen') filtered = filtered.filter(w => w.ring === 'Grün' && !w.position.includes('GETRUNKEN'))
            else if (currentTab === 'blau') filtered = filtered.filter(w => w.ring === 'Blau' && !w.position.includes('GETRUNKEN'))
            else if (currentTab === 'lieferung') filtered = filtered.filter(w => w.position.includes('LIEFERUNG'))
            else if (currentTab === 'getrunken') filtered = filtered.filter(w => w.position.includes('GETRUNKEN'))
            else filtered = filtered.filter(w => !w.position.includes('GETRUNKEN'))
            
            if (search) {
                filtered = filtered.filter(w => 
                    (w.produzent?.toLowerCase().includes(search)) ||
                    (w.weinname?.toLowerCase().includes(search)) ||
                    (w.position?.toLowerCase().includes(search))
                )
            }
            
            updateFilterStats(filtered)
            
            const html = filtered.map(w => {
                const ring = w.ring === 'Rosa' ? '🌸' : w.ring === 'Grün' ? '🟢' : w.ring === 'Blau' ? '🔵' : ''
                return `
                    <div class="wine" data-id="${w.id}">
                        <div class="wine-header">
                            <span class="pos">${w.position}</span>
                            ${ring ? `<span class="ring">${ring}</span>` : ''}
                        </div>
                        <h3>${w.weinname}</h3>
                        <div class="prod">${w.produzent} · ${w.jahrgang || 'n/a'}</div>
                        <div class="stats">
                            <div>
                                <span class="label">Wert</span>
                                <span>€${w.aktueller_wert?.toFixed(0) || 0}</span>
                            </div>
                            <div>
                                <span class="label">Performance</span>
                                <span style="color: #28a745">+${w.wertsteigerung_prozent?.toFixed(0) || 0}%</span>
                            </div>
                            <div>
                                <span class="label">Bis</span>
                                <span>${w.trinkreife_ende || '-'}</span>
                            </div>
                        </div>
                    </div>
                `
            }).join('')
            
            document.getElementById('wines').innerHTML = html || '<div class="empty-state"><h3>Keine Weine gefunden</h3><p>Versuche einen anderen Filter oder Suchbegriff</p></div>'
            
            // Event Listener für Wein-Klick
            document.querySelectorAll('.wine').forEach(el => {
                el.addEventListener('click', () => showDetail(parseInt(el.dataset.id)))
            })
        }
        
        function showDetail(id) {
            const w = wines.find(x => x.id === id)
            const isGetrunken = w.position.includes('GETRUNKEN')
            const isLieferung = w.position.includes('LIEFERUNG')
            
            const ringBadge = w.ring ? 
                `<span class="ring-badge ring-${w.ring.toLowerCase()}">${w.ring === 'Rosa' ? '🌸' : w.ring === 'Grün' ? '🟢' : '🔵'} ${w.ring}</span>` 
                : ''
            
            const trinkreifeClass = getTrinkreifeClass(w.trinkreife_ende)
            
            const modalHtml = `
                <div class="modal-content">
                    <div class="modal-scroll">
                        <div class="modal-header">
                            <div class="modal-pos">${w.position}</div>
                            <button class="close-btn" id="close-btn">×</button>
                        </div>
                        
                        ${ringBadge ? `<div style="margin-bottom: 15px;">${ringBadge}</div>` : ''}
                        
                        <h3>${w.weinname}</h3>
                        <div class="modal-prod">${w.produzent} · ${w.jahrgang || 'n/a'}</div>
                        
                        <div class="detail-box">
                            <div>
                                <span class="detail-label">🍇 Traube</span>
                                <span class="detail-value">${w.traube || 'n/a'}</span>
                            </div>
                            <div>
                                <span class="detail-label">🍾 Größe</span>
                                <span class="detail-value">${w.flaschengroesse || 'n/a'}</span>
                            </div>
                            <div>
                                <span class="detail-label">🍷 Alkohol</span>
                                <span class="detail-value">${w.alkohol || 'n/a'}</span>
                            </div>
                            <div>
                                <span class="detail-label">🍯 Restzucker</span>
                                <span class="detail-value">${w.restzucker ? w.restzucker + ' g/l' : 'n/a'}</span>
                            </div>
                            <div>
                                <span class="detail-label">🍋 Säure</span>
                                <span class="detail-value">${w.saeure ? w.saeure + ' g/l' : 'n/a'}</span>
                            </div>
                            <div>
                                <span class="detail-label">📅 Trinkreife</span>
                                <span class="detail-value">
                                    <span class="trinkreife-badge ${trinkreifeClass}">
                                        ${w.trinkreife_start || '-'} bis ${w.trinkreife_ende || '-'}
                                    </span>
                                </span>
                            </div>
                        </div>
                        
                        <div class="value-box">
                            <div class="small">€${w.einkaufspreis?.toFixed(2) || '0.00'} → €${w.aktueller_wert?.toFixed(2) || '0.00'}</div>
                            <div class="big">+${w.wertsteigerung_prozent?.toFixed(0) || 0}%</div>
                        </div>
                        
                        ${w.ratings ? `
                            <div class="ratings-box">
                                <strong>⭐ Ratings</strong>
                                <div class="ratings-list">${w.ratings.replace(/\|/g, ' · ')}</div>
                            </div>
                        ` : ''}
                        
                        ${w.notiz ? `
                            <div class="notiz-box">
                                <strong>📝 Notiz</strong>
                                <div>${w.notiz}</div>
                            </div>
                        ` : ''}
                        
                        ${!isGetrunken ? `
                            ${isLieferung ? '<button class="btn" id="move-btn">📦→🏠 Ins Lager</button>' : ''}
                            <button class="btn" id="edit-pos-btn">📍 Position ändern</button>
                            <button class="btn btn-danger" id="drink-btn">🍷 Trinken</button>
                        ` : ''}
                        <button class="btn btn-sec" id="close-btn2">Schließen</button>
                    </div>
                </div>
            `
            
            document.getElementById('modal').innerHTML = modalHtml
            document.getElementById('modal').style.display = 'flex'
            
            // Event Listeners
            document.getElementById('close-btn').addEventListener('click', closeModal)
            document.getElementById('close-btn2').addEventListener('click', closeModal)
            
            if (!isGetrunken) {
                if (isLieferung) {
                    document.getElementById('move-btn').addEventListener('click', () => moveToLager(id))
                }
                document.getElementById('edit-pos-btn').addEventListener('click', () => editPos(id))
                document.getElementById('drink-btn').addEventListener('click', () => drinkWine(id))
            }
        }
        
        function closeModal() {
            document.getElementById('modal').style.display = 'none'
        }
        
        async function drinkWine(id) {
            const w = wines.find(x => x.id === id)
            const rating = prompt('Bewertung (0-100):')
            const note = prompt('Notiz:')
            
            const newPos = 'GETRUNKEN_' + w.position.replace('LIEFERUNG_', '')
            let notiz = `GETRUNKEN ${new Date().toLocaleDateString('de-DE')}`
            if (rating) notiz += ` | ${rating}/100`
            if (note) notiz += ` | ${note}`
            
            await db.from('weine').update({ 
                position: newPos, 
                notiz: (w.notiz || '') + ' | ' + notiz 
            }).eq('id', id)
            
            await loadWines()
            closeModal()
            alert('✅ Getrunken!')
        }
        
        async function editPos(id) {
            const w = wines.find(x => x.id === id)
            const newPos = prompt('Neue Position:', w.position)
            if (!newPos) return
            
            await db.from('weine').update({ position: newPos }).eq('id', id)
            await loadWines()
            closeModal()
            alert('✅ Position geändert!')
        }
        
        async function moveToLager(id) {
            const pos = prompt('Position im Lager (z.B. A3):')
            if (!pos) return
            
            await db.from('weine').update({ position: pos }).eq('id', id)
            await loadWines()
            closeModal()
            alert('✅ Ins Lager verschoben!')
        }
        
        // Init
        try {
            await loadWines()
            loadDashboard()  // Dashboard auch laden
            document.getElementById('app').style.display = 'block'
            document.getElementById('loading').style.display = 'none'
            
            // Tabs
            document.querySelectorAll('.tab').forEach(t => {
                t.addEventListener('click', () => {
                    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'))
                    t.classList.add('active')
                    currentTab = t.dataset.tab
                    renderWines()
                })
            })
            
            // Search
            document.getElementById('search').addEventListener('input', renderWines)
            
        } catch (e) {
            document.getElementById('loading').innerHTML = `<div style="color: #ff6b6b;"><h2>Fehler</h2><p>${e.message}</p></div>`
        }

// ═══════════════════════════════════════════════════════════════════
// V3 TAB SYSTEM
// ═══════════════════════════════════════════════════════════════════

document.querySelectorAll('.v3-tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const targetTab = this.dataset.tab
        
        // Buttons updaten
        document.querySelectorAll('.v3-tab-btn').forEach(b => b.classList.remove('active'))
        this.classList.add('active')
        
        // Panels switchen
        document.querySelectorAll('.v3-tab-panel').forEach(p => p.classList.remove('active'))
        document.getElementById(targetTab + '-panel').classList.add('active')
        
        // App-Visibility für Weine-Tab
        if (targetTab === 'weine') {
            const app = document.getElementById('app')
            if (app && app.style.display === 'none') {
                app.style.display = 'block'
            }
        }
    })
})


// ═══════════════════════════════════════════════════════════════════
// DASHBOARD FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

// Dashboard State
let dashboardLoaded = false
let ringChart = null
let countryChart = null

// Main Dashboard Loader
function loadDashboard() {
    if (dashboardLoaded) return
    
    const aktiv = wines.filter(w => !w.position.startsWith('GETRUNKEN'))
    const getrunken = wines.length - aktiv.length
    
    // Stats
    const totalWert = aktiv.reduce((s, w) => s + (parseFloat(w.aktueller_wert) || 0), 0)
    const totalEK = aktiv.reduce((s, w) => s + (parseFloat(w.einkaufspreis) || 0), 0)
    const gewinn = totalWert - totalEK
    const gewinnPct = totalEK > 0 ? (gewinn / totalEK * 100) : 0
    
    document.getElementById('d-total').textContent = aktiv.length
    document.getElementById('d-getrunken').textContent = getrunken
    document.getElementById('d-wert').textContent = '€' + totalWert.toFixed(0)
    document.getElementById('d-ek').textContent = '€' + totalEK.toFixed(0)
    document.getElementById('d-gewinn').textContent = '+€' + gewinn.toFixed(0) + ' (+' + gewinnPct.toFixed(1) + '%)'
    
    // Ring Chart
    createRingChart(aktiv)
    
    // Country Chart
    createCountryChart(aktiv)
    
    // Top Listen
    createTopLists(aktiv)
    
    dashboardLoaded = true
}

function createRingChart(wines) {
    const rings = { Blau: 0, Rosa: 0, Grün: 0, 'Kein Ring': 0 }
    const ringWerte = { Blau: 0, Rosa: 0, Grün: 0, 'Kein Ring': 0 }
    
    wines.forEach(w => {
        const r = w.ring || 'Kein Ring'
        rings[r]++
        ringWerte[r] += parseFloat(w.aktueller_wert) || 0
    })
    
    if (ringChart) ringChart.destroy()
    
    const ctx = document.getElementById('ringChart')
    if (!ctx) return
    
    ringChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['🔵 Blau', '🌸 Rosa', '🟢 Grün', '⚪ Kein Ring'],
            datasets: [{
                data: [rings.Blau, rings.Rosa, rings.Grün, rings['Kein Ring']],
                backgroundColor: ['#4169E1', '#FF69B4', '#32CD32', '#D3D3D3'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 14 }, padding: 15 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const ringNames = ['Blau', 'Rosa', 'Grün', 'Kein Ring']
                            const ringName = ringNames[context.dataIndex]
                            const count = context.parsed
                            const value = ringWerte[ringName]
                            return context.label + ': ' + count + ' Fl. (€' + value.toFixed(0) + ')'
                        }
                    }
                }
            }
        }
    })
}

function createCountryChart(wines) {
    const countryMap = {
        'Fontodi': 'Italien', 'Fuligni': 'Italien', 'Antinori': 'Italien',
        'Cerro': 'Italien', 'Salcheto': 'Italien', 'Badia': 'Italien',
        'Poliziano': 'Italien', 'Poggione': 'Italien',
        'Château': 'Frankreich', 'Domaine': 'Frankreich', 'Clos': 'Frankreich',
        'Kollwentz': 'Österreich', 'Nittnaus': 'Österreich', 'Pöckl': 'Österreich',
        'Tesch': 'Österreich', 'Aigner': 'Österreich', 'Pferschy': 'Österreich',
        'Fritsch': 'Österreich', 'Markowitsch': 'Österreich',
        'Marqués': 'Spanien', 'Almez': 'Spanien', 'Sariño': 'Spanien',
        'Montebuena': 'Spanien', 'Enate': 'Spanien',
        'Damjanic': 'Kroatien', 'Arman': 'Kroatien'
    }
    
    const countries = {}
    wines.forEach(w => {
        let country = 'Andere'
        for (const [key, val] of Object.entries(countryMap)) {
            if (w.produzent.includes(key)) {
                country = val
                break
            }
        }
        countries[country] = (countries[country] || 0) + (parseFloat(w.aktueller_wert) || 0)
    })
    
    const sorted = Object.entries(countries).sort((a, b) => b[1] - a[1])
    
    if (countryChart) countryChart.destroy()
    
    const ctx = document.getElementById('countryChart')
    if (!ctx) return
    
    countryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(([k]) => k),
            datasets: [{
                label: 'Wert (€)',
                data: sorted.map(([, v]) => v),
                backgroundColor: '#722f37',
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '€' + context.parsed.x.toFixed(0)
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { font: { size: 12 } },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                y: {
                    ticks: { font: { size: 12 } },
                    grid: { display: false }
                }
            }
        }
    })
}

function createTopLists(wines) {
    // Top 10 Wertvollste
    const topWert = [...wines]
        .sort((a, b) => (parseFloat(b.aktueller_wert) || 0) - (parseFloat(a.aktueller_wert) || 0))
        .slice(0, 10)
    
    document.getElementById('dash-top-wert').innerHTML = topWert.map((w, i) => `
        <div class="dash-top-item" onclick="showDetail(${w.id})">
            <span class="dash-top-rank">${i + 1}</span>
            <span class="dash-top-name">${w.produzent} ${w.weinname} ${w.jahrgang || ''}</span>
            <span class="dash-top-value">€${parseFloat(w.aktueller_wert).toFixed(0)}</span>
        </div>
    `).join('')
    
    // Top 10 P/L
    const topPL = [...wines]
        .filter(w => parseFloat(w.einkaufspreis) > 0)
        .sort((a, b) => (parseFloat(b.wertsteigerung_prozent) || 0) - (parseFloat(a.wertsteigerung_prozent) || 0))
        .slice(0, 10)
    
    document.getElementById('dash-top-pl').innerHTML = topPL.map((w, i) => `
        <div class="dash-top-item" onclick="showDetail(${w.id})">
            <span class="dash-top-rank">${i + 1}</span>
            <span class="dash-top-name">${w.produzent} ${w.weinname} ${w.jahrgang || ''}</span>
            <span class="dash-top-value">+${parseFloat(w.wertsteigerung_prozent).toFixed(0)}%</span>
        </div>
    `).join('')
}



// ═══════════════════════════════════════════════════════════════════
// ERWEITERTE DASHBOARD FUNKTIONEN
// ═══════════════════════════════════════════════════════════════════

// Toggle Expand/Collapse
function toggleDashSection(id) {
    const element = document.getElementById(id)
    if (!element) return
    
    const section = element.closest('.dash-expand-section')
    if (!section) return
    
    section.classList.toggle('open')
    
    // Beim ersten Öffnen: Extended Content laden
    if (section.classList.contains('open') && !section.dataset.loaded) {
        loadExtendedDashboard()
        section.dataset.loaded = 'true'
    }
}

// Extended Dashboard Content
function loadExtendedDashboard() {
    const aktiv = wines.filter(w => !w.position.startsWith('GETRUNKEN'))
    
    // Ring Details
    const rings = { Blau: 0, Rosa: 0, Grün: 0, 'Kein Ring': 0 }
    const ringWerte = { Blau: 0, Rosa: 0, Grün: 0, 'Kein Ring': 0 }
    
    aktiv.forEach(w => {
        const r = w.ring || 'Kein Ring'
        rings[r]++
        ringWerte[r] += parseFloat(w.aktueller_wert) || 0
    })
    
    document.getElementById('ring-blau-info').textContent = 
        rings.Blau + ' Fl. | €' + ringWerte.Blau.toFixed(0)
    document.getElementById('ring-gruen-info').textContent = 
        rings.Grün + ' Fl. | €' + ringWerte.Grün.toFixed(0)
    document.getElementById('ring-rosa-info').textContent = 
        rings.Rosa + ' Fl. | €' + ringWerte.Rosa.toFixed(0)
    document.getElementById('ring-neutral-info').textContent = 
        rings['Kein Ring'] + ' Fl. | €' + ringWerte['Kein Ring'].toFixed(0)
    
    // Blaue Highlights
    const blaue = aktiv
        .filter(w => w.ring === 'Blau')
        .sort((a, b) => (parseFloat(b.aktueller_wert) || 0) - (parseFloat(a.aktueller_wert) || 0))
    
    document.getElementById('highlights-list').innerHTML = blaue.map(w => `
        <div class="highlight-wine" onclick="showDetail(${w.id})">
            <div class="highlight-wine-title">${w.produzent} ${w.weinname} ${w.jahrgang || ''}</div>
            <div class="highlight-wine-info">
                ${w.traube || ''} | €${parseFloat(w.aktueller_wert || 0).toFixed(0)}
                ${w.einkaufspreis ? ' (EK: €' + parseFloat(w.einkaufspreis).toFixed(2) + ')' : ''}
            </div>
            ${w.ratings ? '<div class="highlight-wine-ratings">' + w.ratings + '</div>' : ''}
        </div>
    `).join('')
    
    // Trinkempfehlungen
    const rosa = aktiv.filter(w => w.ring === 'Rosa')
    const gruen = aktiv.filter(w => w.ring === 'Grün')
    
    let alertsHTML = ''
    
    if (rosa.length > 0) {
        alertsHTML += `
            <div style="margin-bottom: 2rem;">
                <h3 style="color: #ff1493; margin-bottom: 1rem; font-size: 1.3rem;">
                    🌸 ${rosa.length} ROSA-WEINE - 2026 TRINKEN! (AM PEAK!)
                </h3>
                ${rosa.map(w => `
                    <div class="highlight-wine" onclick="showDetail(${w.id})" style="border-left-color: #ff1493;">
                        <div class="highlight-wine-title">${w.produzent} ${w.weinname} ${w.jahrgang || ''}</div>
                        <div class="highlight-wine-info">
                            €${parseFloat(w.aktueller_wert || 0).toFixed(0)} | 
                            Trinkreife bis: ${w.trinkreife_ende || '-'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `
    }
    
    if (gruen.length > 0) {
        alertsHTML += `
            <div>
                <h3 style="color: #32cd32; margin-bottom: 1rem; font-size: 1.3rem;">
                    🟢 ${gruen.length} GRÜN-WEINE - Bis spätestens 2027 trinken
                </h3>
                ${gruen.slice(0, 15).map(w => `
                    <div class="highlight-wine" onclick="showDetail(${w.id})" style="border-left-color: #32cd32;">
                        <div class="highlight-wine-title">${w.produzent} ${w.weinname} ${w.jahrgang || ''}</div>
                        <div class="highlight-wine-info">€${parseFloat(w.aktueller_wert || 0).toFixed(0)}</div>
                    </div>
                `).join('')}
                ${gruen.length > 15 ? 
                    '<div style="text-align:center;color:#666;margin-top:1rem;padding:1rem;">...und ' + (gruen.length - 15) + ' weitere Grün-Weine</div>' 
                    : ''}
            </div>
        `
    }
    
    document.getElementById('drink-alerts-content').innerHTML = alertsHTML
}

