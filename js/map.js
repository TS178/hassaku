/* ============================================================
 *  神輿現在地マップ 本体ロジック
 * ============================================================ */

/* ---- 地図の初期化 ---- */
const map = L.map("map").setView(CONFIG.MAP_CENTER, CONFIG.MAP_ZOOM);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

/* ---- 内部状態 ---- */
const markers = {};                 // id -> Leaflet marker
const state   = {};                 // id -> 最新データ
let lastServerTime = 0;             // サーバー時刻（通信断判定の基準）

const numOf = (id) => (id.match(/\d+/) ? String(Number(id.match(/\d+/)[0])) : id);

/* 神輿アイコンを作る（通信断は灰色） */
function makeIcon(m, offline){
  const bg = offline ? "#9e9e9e" : m.color;
  return L.divIcon({
    className: "",
    html: '<div class="pin" style="background:' + bg + '">' + numOf(m.id) + "</div>",
    iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -16]
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
      markers[m.id].bindPopup(popupHtml(m, c));
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
      '<div class="dot" style="background:' + (c.offline ? "#9e9e9e" : m.color) + '">' + numOf(m.id) + "</div>" +
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
    document.getElementById("panelToggle").textContent = "一覧 ▲";
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
  document.getElementById("panelToggle").textContent = open ? "一覧 ▼" : "一覧 ▲";
});
setInterval(() => { document.getElementById("clock").textContent = clock(Date.now()); }, 1000);

/* 30秒ごとに更新（経過時間表示は5秒ごとに再計算） */
fetchData();
setInterval(fetchData, CONFIG.REFRESH_INTERVAL);
setInterval(() => { updateMarkers(); updateList(); }, 5000);
