/* ============================================================
 *  神輿トラッカー サーバー（Google Apps Script）
 *
 *  更新後は必ず「デプロイ → デプロイを管理 → 編集(鉛筆) →
 *  バージョン：新バージョン → デプロイ」で再デプロイしてください。
 * ============================================================ */

// ★ config.js の API_KEY と必ず同じ文字列にする（送信用の合言葉）
const API_KEY = "Hassaku2026";

// ★ 管理者パスワード（削除に使用。config等の公開ファイルには書かない）
const ADMIN_KEY = "Bebe*****";

// この秒数以内に更新のある神輿は「使用中」とみなし、別端末の送信を拒否する
// （config.js の CLAIM_SEC と同じ値にする）
const CLAIM_TIMEOUT_SEC = 120;

const SHEET_NAME = "positions";
const CACHE_KEY  = "latest";
const CACHE_SEC  = 15;

/* 記録用シートを取得（無ければ作成／owner列を保証） */
function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["id", "name", "lat", "lng", "speed", "updated", "owner"]);
  }
  return sh;
}

/* 受信・削除の入口 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const data = JSON.parse(e.postData.contents);

    /* ===== 管理者：指定神輿の削除 ===== */
    if (data.action === "delete") {
      if (data.adminKey !== ADMIN_KEY) return out_({ ok: false, error: "admin_auth" });
      const sh = getSheet_();
      const last = sh.getLastRow();
      if (last >= 2) {
        const ids = sh.getRange(2, 1, last - 1, 1).getValues().flat();
        const idx = ids.indexOf(data.id);
        if (idx >= 0) {
          sh.deleteRow(idx + 2);
          CacheService.getScriptCache().remove(CACHE_KEY);
          return out_({ ok: true, deleted: data.id });
        }
      }
      return out_({ ok: true, deleted: null });   // すでに無い場合も成功扱い
    }

    /* ===== 神輿からの位置送信 ===== */
    if (data.key !== API_KEY) return out_({ ok: false, error: "auth" });

    const sh   = getSheet_();
    const now  = new Date();
    const last = sh.getLastRow();
    let ids = [];
    if (last >= 2) ids = sh.getRange(2, 1, last - 1, 1).getValues().flat();
    const idx = ids.indexOf(data.id);

    // 担当ロック：別端末が使用中なら拒否
    if (idx >= 0) {
      const cur = sh.getRange(idx + 2, 1, 1, 7).getValues()[0];
      const owner   = cur[6];
      const updated = (cur[5] instanceof Date) ? cur[5].getTime() : new Date(cur[5]).getTime();
      const active  = (now.getTime() - updated) < CLAIM_TIMEOUT_SEC * 1000;
      if (owner && owner !== data.token && active) {
        return out_({ ok: false, error: "in_use" });
      }
    }

    const row = [
      data.id,
      data.name || "",
      Number(data.lat),
      Number(data.lng),
      (data.speed === null || data.speed === undefined || data.speed === "") ? "" : Number(data.speed),
      now,
      data.token || ""
    ];
    if (idx >= 0) sh.getRange(idx + 2, 1, 1, 7).setValues([row]);
    else          sh.appendRow(row);

    CacheService.getScriptCache().remove(CACHE_KEY);
    return out_({ ok: true });

  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* 閲覧者・管理画面へ最新位置を返す（owner列は返さない＝トークン非公開） */
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
      id: r[0], name: r[1], lat: r[2], lng: r[3],
      speed: (r[4] === "" ? null : r[4]),
      updated: (r[5] instanceof Date) ? r[5].getTime() : new Date(r[5]).getTime()
    }));
  }
  const body = JSON.stringify({ ok: true, server: Date.now(), mikoshi: list });
  cache.put(CACHE_KEY, body, CACHE_SEC);
  return out_raw_(body);
}

function out_(obj)     { return out_raw_(JSON.stringify(obj)); }
function out_raw_(str) {
  return ContentService.createTextOutput(str).setMimeType(ContentService.MimeType.JSON);
}
