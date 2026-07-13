/* ============================================================
 *  設定ファイル（このファイルだけ編集すればOK）
 *  ・送信ページ / 閲覧ページの両方がここを読み込みます
 * ============================================================ */
const CONFIG = {

  /* ① Google Apps Script のウェブアプリURL
   *    GAS をデプロイすると発行される「…/exec」で終わるURLを貼り付ける */
  GAS_URL: "https://script.google.com/macros/s/ここにデプロイ後のIDが入る/exec",

  /* ② 送信用の合言葉（GAS側 Code.gs の API_KEY と必ず同じ文字列にする） */
  API_KEY: "matsuri2025-himitsu",

  /* ③ 送信間隔（ミリ秒）… 1分 = 60000（GPS送信は1分ごと） */
  SEND_INTERVAL: 60000,

  /* ④ 地図の自動更新間隔（ミリ秒）… 30秒 = 30000（閲覧は30秒のまま） */
  REFRESH_INTERVAL: 30000,

  /* ⑤ 通信断とみなす秒数（1分送信なので150秒＝約2.5回分で判定） */
  OFFLINE_SEC: 150,

  /* ⑤-2 「使用中」とみなす秒数（Code.gs の CLAIM_TIMEOUT_SEC と同じ値にする） */
  CLAIM_SEC: 150,

  /* ⑥ 地図の初期表示（祭り会場の中心の緯度・経度）とズーム倍率
   *    Googleマップで会場を右クリック →「緯度・経度」でコピーできます */
  MAP_CENTER: [35.0116, 135.7681],  // ← 会場に合わせて変更（例：京都駅付近）
  MAP_ZOOM: 15,

  /* ⑦ 神輿の定義（14基）
   *    id  … 端末が送る識別ID（重複しないこと）
   *    name… 表示名（自由に変更可）
   *    color… 地図マーカーのリング色（一覧の枠にも使用）
   *    icon … 地区紋の画像パス（img/フォルダ内） */
  MIKOSHI: [
    { id: "m01", name: "森之内", color: "#c0392b", icon: "img/m01.png" },
    { id: "m02", name: "領家町",   color: "#e67e22", icon: "img/m02.png" },
    { id: "m03", name: "里本江", color: "#f1c40f", icon: "img/m03.png" },
    { id: "m04", name: "地頭町",   color: "#27ae60", icon: "img/m04.png" },
    { id: "m05", name: "高田",     color: "#16a085", icon: "img/m05.png" },
    { id: "m06", name: "東小室",   color: "#2980b9", icon: "img/m06.png" },
    { id: "m07", name: "給分",   color: "#2c3e90", icon: "img/m07.png" },
    { id: "m08", name: "和田",     color: "#8e44ad", icon: "img/m08.png" },
    { id: "m09", name: "七海",     color: "#c0399b", icon: "img/m09.png" },
    { id: "m10", name: "田中",     color: "#7f8c1a", icon: "img/m10.png" },
    { id: "m11", name: "貝田",     color: "#9A6324", icon: "img/m11.png" },
    { id: "m12", name: "大西",     color: "#111111", icon: "img/m12.png" },
    { id: "m13", name: "相神",   color: "#d81b60", icon: "img/m13.png" },
    { id: "m14", name: "中浜",   color: "#e84393", icon: "img/m14.png" }
  ]
};
