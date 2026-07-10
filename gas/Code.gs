/* ============================================================
 *  神輿トラッカー サーバー（Google Apps Script）
 *
 *  使い方：
 *   1. Googleスプレッドシートを新規作成
 *   2. 拡張機能 → Apps Script でこのコードを貼り付け
 *   3. 下の API_KEY を config.js と同じ文字列に変更
 *   4. デプロイ → 新しいデプロイ → 種類「ウェブアプリ」
 *        実行するユーザー：自分
 *        アクセスできるユーザー：全員
 *   5. 発行された「…/exec」URLを config.js の GAS_URL に貼る
 * ============================================================ */

// ★ config.js の API_KEY と必ず同じ文字列にする
const API_KEY   = "Hassaku2026";
const SHEET_NAME = "positions";
const CACHE_KEY  = "latest";
const CACHE_SEC  = 15;   // 閲覧レスポンスをこの秒数キャッシュ（負荷軽減）

/* 記録用シートを取得（無ければ作成） */
function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["id", "name", "lat", "lng", "speed", "updated"]);
  }
  return sh;
}

/* 神輿からの位置情報を受信して保存 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const data = JSON.parse(e.postData.contents);

    if (data.key !== API_KEY) {
      return out_({ ok: false, error: "auth" });   // 合言葉ちがい
    }

    const sh  = getSheet_();
    const now = new Date();
    const last = sh.getLastRow();

    // 既存の同じidの行を探す
    let ids = [];
    if (last >= 2) ids = sh.getRange(2, 1, last - 1, 1).getValues().flat();
    const idx = ids.indexOf(data.id);

    const row = [
      data.id,
      data.name || "",
      Number(data.lat),
      Number(data.lng),
      (data.speed === null || data.speed === undefined || data.speed === "") ? "" : Number(data.speed),
      now
    ];

    if (idx >= 0) {
      sh.getRange(idx + 2, 1, 1, row.length).setValues([row]); // 上書き
    } else {
      sh.appendRow(row);                                       // 新規
    }

    CacheService.getScriptCache().remove(CACHE_KEY);           // キャッシュ更新
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* 閲覧者へ全神輿の最新位置をJSONで返す */
function doGet(e) {
  const cache  = CacheService.getScriptCache();
  const cached = cache.get(CACHE_KEY);
  if (cached) return out_raw_(cached);

  const sh   = getSheet_();
  const last = sh.getLastRow();
  let list = [];
  if (last >= 2) {
    const v = sh.getRange(2, 1, last - 1, 6).getValues();
    list = v.map(r => ({
      id: r[0],
      name: r[1],
      lat: r[2],
      lng: r[3],
      speed: (r[4] === "" ? null : r[4]),
      updated: (r[5] instanceof Date) ? r[5].getTime() : new Date(r[5]).getTime()
    }));
  }
  const body = JSON.stringify({ ok: true, server: Date.now(), mikoshi: list });
  cache.put(CACHE_KEY, body, CACHE_SEC);
  return out_raw_(body);
}

/* JSONレスポンス */
function out_(obj)     { return out_raw_(JSON.stringify(obj)); }
function out_raw_(str) {
  return ContentService.createTextOutput(str)
    .setMimeType(ContentService.MimeType.JSON);
}
