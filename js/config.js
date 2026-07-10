/* ============================================================
 *  設定ファイル（このファイルだけ編集すればOK）
 *  ・送信ページ / 閲覧ページの両方がここを読み込みます
 * ============================================================ */
const CONFIG = {

  /* ① Google Apps Script のウェブアプリURL
   *    GAS をデプロイすると発行される「…/exec」で終わるURLを貼り付ける */
  GAS_URL: "https://script.google.com/macros/s/AKfycbydLwSgrkduohAYUAKmUhgbBz41zYpYjstQaqKUskEvLyjh52TCuIXbWcaMrb4aBdPvEA/exec",

  /* ② 送信用の合言葉（GAS側 Code.gs の API_KEY と必ず同じ文字列にする） */
  API_KEY: "Hassaku2026",

  /* ③ 送信間隔（ミリ秒）… 30秒 = 30000 */
  SEND_INTERVAL: 30000,

  /* ④ 地図の自動更新間隔（ミリ秒）… 30秒 = 30000 */
  REFRESH_INTERVAL: 30000,

  /* ⑤ 通信断とみなす秒数（この秒数以上、更新がなければ「通信断」） */
  OFFLINE_SEC: 120,

  /* ⑥ 地図の初期表示（祭り会場の中心の緯度・経度）とズーム倍率
   *    Googleマップで会場を右クリック →「緯度・経度」でコピーできます */
  MAP_CENTER: [37.144873, 136.732907],  // ← 会場に合わせて変更（例：京都駅付近）
  MAP_ZOOM: 15,

  /* ⑦ 神輿の定義（14基）
   *    id  … 端末が送る識別ID（重複しないこと）
   *    name… 表示名（自由に変更可）
   *    color… 地図アイコンの色（好みで変更可） */
  MIKOSHI: [
    { id: "m01", name: "森之内",   color: "#e6194B" },
    { id: "m02", name: "領家町",   color: "#3cb44b" },
    { id: "m03", name: "里本江",   color: "#4363d8" },
    { id: "m04", name: "地頭町",   color: "#f58231" },
    { id: "m05", name: "高田",   color: "#911eb4" },
    { id: "m06", name: "東小室",   color: "#008080" },
    { id: "m07", name: "給分",   color: "#e6194B" },
    { id: "m08", name: "和田",   color: "#3cb44b" },
    { id: "m09", name: "七海",   color: "#4363d8" },
    { id: "m10", name: "田中",   color: "#f58231" },
    { id: "m11", name: "貝田", color: "#911eb4" },
    { id: "m12", name: "大西", color: "#008080" },
    { id: "m13", name: "相神", color: "#9A6324" },
    { id: "m14", name: "中浜", color: "#000075" }
  ]
};
