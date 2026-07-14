/* ============================================================
 *  神輿現在地マップ 本体ロジック
 * ============================================================ */

/* ---- 地図の初期化 ---- */
const map = L.map("map").setView(CONFIG.MAP_CENTER, CONFIG.MAP_ZOOM);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

/* ===== トイレ（固定地点・タップで名称表示） ===== */
function toiletIcon(){
  const svg =
    '<svg width="40" height="52" viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">'+
    '<path d="M20 1 C10 1 2.5 8.5 2.5 18.5 C2.5 32 20 51 20 51 C20 51 37.5 32 37.5 18.5 C37.5 8.5 30 1 20 1 Z" fill="#1565c0" stroke="#ffffff" stroke-width="2.5"/>'+
    '<circle cx="20" cy="18.5" r="12" fill="#ffffff"/>'+
    '<circle cx="15" cy="12.4" r="1.9" fill="#1565c0"/>'+
    '<rect x="12.9" y="14.4" width="4.2" height="5.2" rx="1.4" fill="#1565c0"/>'+
    '<rect x="13.4" y="19" width="1.3" height="5" fill="#1565c0"/><rect x="15.3" y="19" width="1.3" height="5" fill="#1565c0"/>'+
    '<rect x="19.6" y="9" width="0.8" height="18" rx="0.4" fill="#bbdefb"/>'+
    '<circle cx="25" cy="12.4" r="1.9" fill="#1565c0"/>'+
    '<path d="M25 14.4 L21.9 21.4 L28.1 21.4 Z" fill="#1565c0"/>'+
    '<rect x="23.4" y="21.4" width="1.1" height="3.3" fill="#1565c0"/><rect x="25.5" y="21.4" width="1.1" height="3.3" fill="#1565c0"/>'+
    '</svg>';
  return L.divIcon({ className:"",
    html:'<div style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))">'+svg+'</div>',
    iconSize:[40,52], iconAnchor:[20,50], popupAnchor:[0,-46] });
}
(CONFIG.TOILETS || []).forEach(function(t){
  L.marker([t.lat, t.lng], { icon: toiletIcon(), title: t.name })
    .addTo(map)
    .bindPopup('<div class="pop"><b>🚻 トイレ</b><div class="line">'+t.name+'</div></div>');
});

/* ---- 内部状態 ---- */
const markers = {};                 // id -> Leaflet marker
const state   = {};                 // id -> 最新データ
let lastServerTime = 0;             // サーバー時刻（通信断判定の基準）

const numOf = (id) => (id.match(/\d+/) ? String(Number(id.match(/\d+/)[0])) : id);

/* 神輿アイコンを作る（紋バッジ画像。通信断は灰色化） */
function makeIcon(m, offline){
  const src = m.icon || "";
  const cls = "pin-img" + (offline ? " off" : "");
  const html = '<div class="' + cls + '"><img src="' + src + '" alt="' + m.name + '"></div>';
  return L.divIcon({
    className: "", html: html,
    iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, -22]
  });
}

/* 秒数を「◯秒前 / ◯分前」に整形 */
function ago(sec){
  if (sec < 60) return Math.floor(sec) + "秒前";
  if (sec < 3600) return Math.floor(sec / 60) + "分前";
  return Math.floor(sec / 3600) + "時間前";
}
function clock(ms){
  return new Date(ms).toLocaleTimeString("ja-JP", { hour:"2-digit", minute:"2-digit", second:"2-digit" });
}

/* 1基分の状態を計算 */
function calc(m){
  const d = state[m.id];
  if (!d || !d.updated){
    return { known:false, offline:true, statusText:"未受信", cls:"non" };
  }
  const base = lastServerTime || Date.now();
  const sec  = (base - d.updated) / 1000;
  const offline = sec > CONFIG.OFFLINE_SEC;
  return {
    known:true, offline, sec,
    statusText: offline ? "通信断" : "正常",
    cls: offline ? "off" : "ok",
    d
  };
}

/* ポップアップの中身 */
function popupHtml(m, c){
  if (!c.known) return '<div class="pop"><b>' + m.name + "</b><div class='line'>まだ位置を受信していません</div></div>";
  const d = c.d;
  const spd = (d.speed === null || d.speed === undefined || isNaN(d.speed))
      ? "取得不可"
      : (Math.max(0, d.speed) * 3.6).toFixed(1) + " km/h";
  return '<div class="pop">' +
    "<b>" + m.name + "</b>" +
    '<div class="line">現在地：' + d.lat.toFixed(5) + ", " + d.lng.toFixed(5) + "</div>" +
    '<div class="line">最終更新：' + clock(d.updated) + "（" + ago(c.sec) + "）</div>" +
    '<div class="line">速度：' + spd + "</div>" +
    '<div class="line">状態：<span class="' + (c.offline ? "state-off" : "state-ok") + '">' +
        (c.offline ? "⚠ 通信断" : "正常") + "</span></div>" +
    "</div>";
}

/* 地図マーカーを更新 */
function updateMarkers(){
  CONFIG.MIKOSHI.forEach(m => {
    const c = calc(m);
    if (!c.known){                       // 未受信は地図に出さない
      if (markers[m.id]){ map.removeLayer(markers[m.id]); delete markers[m.id]; }
      return;
    }
    const pos = [c.d.lat, c.d.lng];
    if (!markers[m.id]){
      markers[m.id] = L.marker(pos, { icon: makeIcon(m, c.offline) }).addTo(map);
      markers[m.id].bindPopup(popupHtml(m, c), { autoPan: false });
    } else {
      markers[m.id].setLatLng(pos);
      markers[m.id].setIcon(makeIcon(m, c.offline));
      markers[m.id].setPopupContent(popupHtml(m, c));
    }
  });
}

/* 一覧を更新 */
function updateList(){
  const q = document.getElementById("search").value.trim().toLowerCase();
  const ul = document.getElementById("list");
  ul.innerHTML = "";
  let nOk = 0, nOff = 0, nNon = 0;

  CONFIG.MIKOSHI.forEach(m => {
    const c = calc(m);
    if (!c.known) nNon++; else if (c.offline) nOff++; else nOk++;

    const hit = (m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
    if (q && !hit) return;

    const li = document.createElement("li");
    li.className = "row";
    li.innerHTML =
      '<div class="row-crest' + (c.offline ? " off" : "") + '" style="border-color:' + m.color + '">' +
        '<img src="' + (m.icon || "") + '" alt="">' +
      "</div>" +
      '<div class="row-main">' +
        '<div class="row-name">' + m.name + "</div>" +
        '<div class="row-sub">' + (c.known ? "更新 " + ago(c.sec) : "位置情報なし") + "</div>" +
      "</div>" +
      '<div class="badge ' + c.cls + '">' + c.statusText + "</div>";
    li.onclick = () => focusMikoshi(m.id);
    ul.appendChild(li);
  });

  document.getElementById("counts").textContent =
    "受信 " + nOk + " ／ 通信断 " + nOff + " ／ 未受信 " + nNon;
}

/* 指定神輿へ地図を移動しポップアップを開く */
function focusMikoshi(id){
  const mk = markers[id];
  if (mk){
    map.setView(mk.getLatLng(), Math.max(map.getZoom(), 16));
    mk.openPopup();
  }
  if (window.matchMedia("(max-width:720px)").matches){
    document.getElementById("panel").classList.remove("open");
    document.getElementById("panelToggle").textContent = "🔍 神輿検索 ▲";
  }
}

/* ---- サーバーから取得 ---- */
async function fetchData(){
  try{
    const url = CONFIG.GAS_URL + (CONFIG.GAS_URL.includes("?") ? "&" : "?") + "_=" + Date.now();
    const res = await fetch(url, { method:"GET" });
    const json = await res.json();
    if (!json.ok) throw new Error("server");

    lastServerTime = json.server || Date.now();
    json.mikoshi.forEach(d => { state[d.id] = d; });

    updateMarkers();
    updateList();
    document.getElementById("foot").textContent = "最終取得：" + clock(Date.now());
    banner(false);
  }catch(e){
    banner(true, "サーバーに接続できません（自動で再試行します）");
    updateList();   // 経過時間や通信断表示は更新
  }
}

/* 通信エラーバナー */
function banner(show, msg){
  const b = document.getElementById("banner");
  b.textContent = msg || "";
  b.classList.toggle("show", !!show);
}

/* ---- UIイベント ---- */
document.getElementById("search").addEventListener("input", updateList);
document.getElementById("panelToggle").addEventListener("click", () => {
  const p = document.getElementById("panel");
  const open = p.classList.toggle("open");
  document.getElementById("panelToggle").textContent = open ? "🔍 神輿検索 ▼" : "🔍 神輿検索 ▲";
});
setInterval(() => { document.getElementById("clock").textContent = clock(Date.now()); }, 1000);

/* 30秒ごとに更新（経過時間表示は5秒ごとに再計算） */
fetchData();
setInterval(fetchData, CONFIG.REFRESH_INTERVAL);
setInterval(() => { updateMarkers(); updateList(); }, 5000);
