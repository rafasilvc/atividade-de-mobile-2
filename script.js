
const traducoes = {
  "brasil":"brazil","alemanha":"germany",
  "japão":"japan","japao":"japan",
  "eua":"united states","estados unidos":"united states",
  "frança":"france","franca":"france",
  "espanha":"spain","portugal":"portugal",
  "argentina":"argentina","canadá":"canada","canada":"canada",
  "méxico":"mexico","mexico":"mexico",
  "china":"china","rússia":"russia","russia":"russia",
  "italia":"italy","itália":"italy",
  "reino unido":"united kingdom","inglaterra":"united kingdom",
  "escocia":"united kingdom","escócia":"united kingdom",
  "irlanda":"ireland","holanda":"netherlands",
  "belgica":"belgium","bélgica":"belgium",
  "suica":"switzerland","suíça":"switzerland",
  "austria":"austria","áustria":"austria",
  "polonia":"poland","polônia":"poland",
  "noruega":"norway","suecia":"sweden","suécia":"sweden",
  "finlandia":"finland","finlândia":"finland",
  "dinamarca":"denmark","grecia":"greece","grécia":"greece",
  "coreia do sul":"south korea","coreia do norte":"north korea",
  "coreia":"south korea","india":"india","índia":"india",
  "tailandia":"thailand","tailândia":"thailand",
  "vietna":"vietnam","vietnã":"vietnam",
  "indonesia":"indonesia","indonésia":"indonesia",
  "malasia":"malaysia","malásia":"malaysia",
  "filipinas":"philippines","singapura":"singapore",
  "arabia saudita":"saudi arabia","arábia saudita":"saudi arabia",
  "turquia":"turkey","israel":"israel",
  "emirados arabes":"united arab emirates","emirados árabes":"united arab emirates",
  "egito":"egypt","marrocos":"morocco",
  "nigeria":"nigeria","nigéria":"nigeria",
  "africa do sul":"south africa","áfrica do sul":"south africa",
  "quenia":"kenya","quênia":"kenya",
  "argelia":"algeria","argélia":"algeria",
  "chile":"chile","peru":"peru",
  "colombia":"colombia","colômbia":"colombia",
  "venezuela":"venezuela","bolivia":"bolivia","bolívia":"bolivia",
  "paraguai":"paraguay","uruguai":"uruguay",
  "cuba":"cuba","jamaica":"jamaica",
  "costa rica":"costa rica","panama":"panama","panamá":"panama",
  "australia":"australia","austrália":"australia",
  "nova zelandia":"new zealand","nova zelândia":"new zealand"
};
 

let mapInstance = null;
const HISTORY_KEY = "geo_history_v3";
const THEME_KEY   = "geo_theme_v3";
const MAX_HIST    = 8;
 

const paisInput = document.getElementById("paisInput");
const resultado  = document.getElementById("resultado");
const btnClear   = document.getElementById("btnClear");
 
paisInput.addEventListener("input", () => {
  btnClear.classList.toggle("hidden", !paisInput.value);
});
paisInput.addEventListener("keydown", e => {
  if (e.key === "Enter") buscarPais();
});
 
function limparBusca() {
  paisInput.value = "";
  btnClear.classList.add("hidden");
  paisInput.focus();
}
 
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "dark";
  aplicarTema(saved);
}
 
function toggleTheme() {
  const cur  = document.documentElement.getAttribute("data-theme") || "dark";
  const next = cur === "dark" ? "light" : "dark";
  aplicarTema(next);
  localStorage.setItem(THEME_KEY, next);
}
 
function aplicarTema(t) {
  document.documentElement.setAttribute("data-theme", t);
  document.getElementById("themeIcon").textContent = t === "dark" ? "☀️" : "🌙";
}
 

async function buscarPais() {
  const raw = paisInput.value.trim().toLowerCase();
  if (!raw) { paisInput.focus(); return; }
  const termo = traducoes[raw] || raw;
  mostrarLoading("Buscando país...");
  try {
    const r = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(termo)}`);
    if (!r.ok) throw new Error();
    const [info] = await r.json();
    mostrarCard(info);
  } catch {
    mostrarErro("⚠️ País não encontrado. Tente outro nome!");
  }
}
 
function buscarRapido(nome) {
  paisInput.value = nome;
  btnClear.classList.remove("hidden");
  buscarPais();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
 

function buscarPorLocalizacao() {
  if (!navigator.geolocation) {
    mostrarErro("⚠️ Geolocalização não suportada neste dispositivo.");
    return;
  }
  const btn = document.getElementById("btnGeo");
  btn.classList.add("loading");
  mostrarLoading("📍 Obtendo sua localização GPS...");
 
  navigator.geolocation.getCurrentPosition(
    async ({ coords: { latitude: lat, longitude: lon } }) => {
      try {
        mostrarLoading("🌍 Identificando seu país...");
        const geoR = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          { headers: { "Accept-Language": "pt-BR" } }
        );
        const geoD = await geoR.json();
        const code = geoD.address?.country_code?.toUpperCase();
        if (!code) throw new Error("País não identificado.");
 
        mostrarLoading("✨ Carregando dados...");
        const cR = await fetch(`https://restcountries.com/v3.1/alpha/${code}`);
        if (!cR.ok) throw new Error("País não encontrado.");
        const [info] = await cR.json();
        mostrarCard(info, { lat, lon });
      } catch (err) {
        mostrarErro(`⚠️ ${err.message}`);
      } finally {
        btn.classList.remove("loading");
      }
    },
    err => {
      btn.classList.remove("loading");
      const msgs = { 1:"Permissão negada.", 2:"Posição indisponível.", 3:"Tempo esgotado." };
      mostrarErro(`⚠️ ${msgs[err.code] || "Erro de localização."}`);
    },
    { timeout: 12000, maximumAge: 60000 }
  );
}
 

function mostrarCard(info, geo = null) {
  const capital   = info.capital?.[0] ?? "—";
  const pop       = info.population?.toLocaleString("pt-BR") ?? "—";
  const area      = info.area ? info.area.toLocaleString("pt-BR") + " km²" : "—";
  const regiao    = info.region ?? "—";
  const subregiao = info.subregion ?? "—";
  const moedas    = info.currencies
    ? Object.values(info.currencies).map(m => `${m.name} (${m.symbol ?? "—"})`).join(", ") : "—";
  const linguas   = info.languages
    ? Object.values(info.languages).join(", ") : "—";
  const fuso      = info.timezones?.[0] ?? "—";
  const fronteiras = info.borders?.length ? `${info.borders.length} países` : "Nenhuma terrestre";
  const tld       = info.tld?.join(", ") ?? "—";
  const conducao  = info.car?.side === "left" ? "Esquerda 🚗" : "Direita 🚗";
 
  const geoBadge = geo
    ? `<div class="geo-tag">📍 Detectado pelo GPS · ${geo.lat.toFixed(2)}°, ${geo.lon.toFixed(2)}°</div>`
    : "";
 
  const lat = info.latlng?.[0] ?? 0;
  const lon = info.latlng?.[1] ?? 0;
 
  resultado.innerHTML = `
    <div class="country-card">
      <div class="flag-hero">
        <div class="flag-glow" style="background-image:url('${info.flags.png}')"></div>
        <img class="flag-img" src="${info.flags.svg || info.flags.png}" alt="Bandeira de ${info.name.common}" loading="lazy"/>
        <div class="flag-overlay"></div>
      </div>
 
      <div class="card-content">
        ${geoBadge}
        <h2 class="country-name">${info.name.common}</h2>
        <p class="country-official">${info.name.official}</p>
 
        <div class="stats-row">
          <div class="stat stat-1">
            <div class="stat-lbl">Capital</div>
            <div class="stat-val">${capital}</div>
          </div>
          <div class="stat stat-2">
            <div class="stat-lbl">Região</div>
            <div class="stat-val">${regiao}</div>
          </div>
          <div class="stat stat-3">
            <div class="stat-lbl">População</div>
            <div class="stat-val">${pop}</div>
          </div>
          <div class="stat stat-4">
            <div class="stat-lbl">Área</div>
            <div class="stat-val">${area}</div>
          </div>
        </div>
 
        <div class="card-divider"></div>
 
        <div class="info-list">
          <div class="info-item">
            <span class="info-key">Moeda</span>
            <span class="info-val">${moedas}</span>
          </div>
          <div class="info-item">
            <span class="info-key">Idioma(s)</span>
            <span class="info-val">${linguas}</span>
          </div>
          <div class="info-item">
            <span class="info-key">Subregião</span>
            <span class="info-val">${subregiao}</span>
          </div>
          <div class="info-item">
            <span class="info-key">Fuso horário</span>
            <span class="info-val">${fuso}</span>
          </div>
          <div class="info-item">
            <span class="info-key">Fronteiras</span>
            <span class="info-val">${fronteiras}</span>
          </div>
          <div class="info-item">
            <span class="info-key">Domínio (.tld)</span>
            <span class="info-val">${tld}</span>
          </div>
          <div class="info-item">
            <span class="info-key">Trânsito</span>
            <span class="info-val">${conducao}</span>
          </div>
        </div>
 
        <div class="map-wrap">
          <div class="map-lbl">Localização no mapa</div>
          <div id="map"></div>
        </div>
      </div>
    </div>
  `;
 
  initMap(lat, lon, info.name.common, capital);
  adicionarHistorico({
    nome: info.name.common, oficial: info.name.official,
    bandeira: info.flags.png, capital, regiao, code: info.cca2
  });
}
 
function initMap(lat, lon, nome, capital) {
  if (mapInstance) { mapInstance.remove(); mapInstance = null; }
  const el = document.getElementById("map");
  if (!el || typeof L === "undefined") return;
 
  mapInstance = L.map("map", {
    center: [lat, lon], zoom: 4,
    zoomControl: true, scrollWheelZoom: false
  });
 
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap", maxZoom: 8
  }).addTo(mapInstance);
 
  const icon = L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;background:linear-gradient(135deg,#6c3bff,#ff6eb4);border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(108,59,255,0.8)"></div>`,
    iconSize: [16,16], iconAnchor: [8,8]
  });
 
  L.marker([lat, lon], { icon })
    .addTo(mapInstance)
    .bindPopup(`<b>${nome}</b><br/>Capital: ${capital}`)
    .openPopup();
 
  setTimeout(() => mapInstance?.invalidateSize(), 250);
}
 

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch { return []; }
}
 
function adicionarHistorico(item) {
  let h = getHistory().filter(x => x.code !== item.code);
  h.unshift(item);
  if (h.length > MAX_HIST) h = h.slice(0, MAX_HIST);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
  renderHistorico();
}
 
function renderHistorico() {
  const h = getHistory();
  const sec = document.getElementById("historySection");
  const lst = document.getElementById("historyList");
  if (!h.length) { sec.classList.add("hidden"); return; }
  sec.classList.remove("hidden");
  lst.innerHTML = h.map(i => `
    <div class="history-item" onclick="buscarRapido('${i.nome.toLowerCase()}')">
      <img class="hist-flag" src="${i.bandeira}" alt="" />
      <div class="hist-info">
        <div class="hist-name">${i.nome}</div>
        <div class="hist-sub">${i.capital} · ${i.regiao}</div>
      </div>
      <span class="hist-arrow">›</span>
    </div>
  `).join("");
}
 
function limparHistorico() {
  localStorage.removeItem(HISTORY_KEY);
  document.getElementById("historySection").classList.add("hidden");
}
 
function mostrarLoading(msg = "Carregando...") {
  resultado.innerHTML = `
    <div class="loading-state">
      <div class="spinner-wrap"><div class="spinner-inner"></div></div>
      <p class="loading-txt">${msg}</p>
    </div>`;
}
 
function mostrarErro(msg) {
  resultado.innerHTML = `<div class="error-state">${msg}</div>`;
}
 

function syncOnline() {
  const el = document.getElementById("offlineIndicator");
  el.classList.toggle("hidden", navigator.onLine);
}
window.addEventListener("online",  syncOnline);
window.addEventListener("offline", syncOnline);
syncOnline();
 

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("/sw.js")
      .then(r => console.log("[SW]", r.scope))
      .catch(console.warn)
  );
}
 

let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault(); deferredPrompt = e;
  document.getElementById("installBanner").classList.remove("hidden");
});
document.getElementById("installBtn")?.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById("installBanner").classList.add("hidden");
});
document.getElementById("dismissBtn")?.addEventListener("click", () => {
  document.getElementById("installBanner").classList.add("hidden");
});
 

if (new URLSearchParams(location.search).get("action") === "geo") {
  window.addEventListener("load", () => setTimeout(buscarPorLocalizacao, 600));
}
 

initTheme();
renderHistorico();