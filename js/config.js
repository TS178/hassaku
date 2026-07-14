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
  MAP_CENTER: [37.144497, 136.732007],  // ← 会場に合わせて変更（例：京都駅付近）
  MAP_ZOOM: 15,

  /* ⑦ 神輿の定義（14基）
   *    id  … 端末が送る識別ID（重複しないこと）
   *    name… 表示名（自由に変更可）
   *    color… 地図マーカーのリング色（一覧の枠にも使用）
   *    icon … 地区紋の画像パス（img/フォルダ内） */
  MIKOSHI: [
    { id: "m01", name: "森之内（本社）", color: "#FFC400", icon: "img/m01.png?v=2" },
    { id: "m02", name: "富来領家町",     color: "#F57C00", icon: "img/m02.png?v=2" },
    { id: "m03", name: "里本江",         color: "#FFC400", icon: "img/m03.png?v=2" },
    { id: "m04", name: "富来地頭町",     color: "#8B0000", icon: "img/m04.png?v=2" },
    { id: "m05", name: "富来高田",       color: "#1B5E20", icon: "img/m05.png?v=2" },
    { id: "m06", name: "東小室",         color: "#111111", icon: "img/m06.png?v=2" },
    { id: "m07", name: "給分",           color: "#EC5F9E", icon: "img/m07.png?v=2" },
    { id: "m08", name: "和田",           color: "#1976D2", icon: "img/m08.png?v=2" },
    { id: "m09", name: "七海",           color: "#1976D2", icon: "img/m09.png?v=2" },
    { id: "m10", name: "田中",           color: "#12206E", icon: "img/m10.png?v=2" },
    { id: "m11", name: "貝田",           color: "#AEB4B8", icon: "img/m11.png?v=2" },
    { id: "m12", name: "大西",           color: "#E23B2E", icon: "img/m12.png?v=2" },
    { id: "m13", name: "相神",           color: "#C9A227", icon: "img/m13.png?v=2" },
    { id: "m14", name: "中浜",           color: "#EDEDED", icon: "img/m14.png?v=2" }
  ],

  /* ⑧ トイレの場所（増やす場合はここに { name, lat, lng } の行を足すだけ） */
  TOILETS: [
    { name: "冨木八幡神社 社務所", lat: 37.152385944229074, lng: 136.73750267232603 },
    { name: "住吉神社 お手洗い",   lat: 37.13906994256999,  lng: 136.72721473095197 }
  ]
};
