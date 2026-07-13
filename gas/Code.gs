/* ============================================================
 *  神輿トラッカー サーバー（Google Apps Script）
 *
 *  ■ 初回のみ：エディタで setupSheets を1回実行してください
 *    （positions / History / Master シートを自動作成・初期化します）
 *  ■ コード変更後は必ず再デプロイ：
 *    デプロイ → デプロイを管理 → 鉛筆 → バージョン「新バージョン」→ デプロイ
 * ============================================================ */

const API_KEY   = "Hassaku2026";        // config.js と同じ（送信用の合言葉）
const ADMIN_KEY = "　　　";    // 管理者パスワード（公開ファイルには書かない）
const CLAIM_TIMEOUT_SEC = 150;                  // 使用中とみなす秒数（config.js CLAIM_SEC と同値）
const TZ = "Asia/Tokyo";

const POS_SHEET    = "positions";   // 最新位置のみ（1神輿1行・上書き）
const HIST_SHEET   = "History";     // 全履歴（受信ごとに追加・削除しない）
const MASTER_SHEET = "Master";      // 神輿マスタ（毎年編集）

const CACHE_KEY = "latest";  const CACHE_SEC = 15;         // 閲覧用キャッシュ
const MKEY      = "master";   const MCACHE_SEC = 300;       // Masterキャッシュ

function ss_(){ return SpreadsheetApp.getActiveSpreadsheet(); }

/* ---- 各シート取得（無ければヘッダ付きで作成） ---- */
function getPositions_(){
  const ss=ss_(); let sh=ss.getSheetByName(POS_SHEET);
  if(!sh){ sh=ss.insertSheet(POS_SHEET); sh.appendRow(["id","name","lat","lng","speed","updated","owner"]); }
  return sh;
}
function getHistory_(){
  const ss=ss_(); let sh=ss.getSheetByName(HIST_SHEET);
  if(!sh){ sh=ss.insertSheet(HIST_SHEET); sh.appendRow(["年度","日付","時刻","神輿ID","神輿名","緯度","経度","GPS精度"]); }
  return sh;
}
function getMaster_(){
  const ss=ss_(); let sh=ss.getSheetByName(MASTER_SHEET);
  if(!sh){ sh=ss.insertSheet(MASTER_SHEET); sh.appendRow(["神輿ID","神輿名","担当地区"]); }
  return sh;
}

/* ---- 初回セットアップ（エディタから1回実行） ---- */
function setupSheets(){
  getPositions_(); getHistory_();
  const sh=getMaster_();
  if(sh.getLastRow()<2){
    const seed=[
      ["m01","森之内","東増穂"],["m02","領家町","富来"],["m03","里本江","東増穂"],
      ["m04","地頭町","富来"],["m05","高田","富来"],["m06","東小室","稗造"],
      ["m07","給分","東増穂"],["m08","和田","稗造"],["m09","七海","富来"],
      ["m10","田中","稗造"],["m11","貝田","稗造"],["m12","大西","稗造"],
      ["m13","相神","東増穂"],["m14","中浜","東増穂"]
    ];
    sh.getRange(2,1,seed.length,3).setValues(seed);
  }
  CacheService.getScriptCache().remove(MKEY);
  return "OK";
}

/* ---- Masterを {id:{name,area}} で取得（キャッシュ） ---- */
function getMasterMap_(){
  const cache=CacheService.getScriptCache();
  const c=cache.get(MKEY);
  if(c) return JSON.parse(c);
  const sh=getMaster_(); const last=sh.getLastRow(); const map={};
  if(last>=2){
    getMaster_().getRange(2,1,last-1,3).getValues().forEach(r=>{ if(r[0]) map[r[0]]={name:r[1],area:r[2]}; });
  }
  cache.put(MKEY, JSON.stringify(map), MCACHE_SEC);
  return map;
}

/* ---- 受信・削除の入口 ---- */
function doPost(e){
  const lock=LockService.getScriptLock();
  try{
    lock.waitLock(15000);
    const data=JSON.parse(e.postData.contents);

    /* 管理者：最新位置(positions)のみ削除。Historyは消さない */
    if(data.action==="delete"){
      if(data.adminKey!==ADMIN_KEY) return out_({ok:false,error:"admin_auth"});
      const sh=getPositions_(); const last=sh.getLastRow();
      if(last>=2){
        const ids=sh.getRange(2,1,last-1,1).getValues().flat();
        const idx=ids.indexOf(data.id);
        if(idx>=0){ sh.deleteRow(idx+2); CacheService.getScriptCache().remove(CACHE_KEY);
          return out_({ok:true,deleted:data.id}); }
      }
      return out_({ok:true,deleted:null});
    }

    /* 位置送信 */
    if(data.key!==API_KEY) return out_({ok:false,error:"auth"});

    const pos=getPositions_(); const now=new Date(); const last=pos.getLastRow();
    let ids=[]; if(last>=2) ids=pos.getRange(2,1,last-1,1).getValues().flat();
    const idx=ids.indexOf(data.id);

    // 担当ロック
    if(idx>=0){
      const cur=pos.getRange(idx+2,1,1,7).getValues()[0];
      const owner=cur[6];
      const updated=(cur[5] instanceof Date)?cur[5].getTime():new Date(cur[5]).getTime();
      const active=(now.getTime()-updated)<CLAIM_TIMEOUT_SEC*1000;
      if(owner && owner!==data.token && active) return out_({ok:false,error:"in_use"});
    }

    // 神輿名はMaster優先（毎年の変更に対応）
    const master=getMasterMap_();
    const name=(master[data.id] && master[data.id].name) ? master[data.id].name : (data.name||"");

    const lat=Number(data.lat), lng=Number(data.lng);
    const speed=(data.speed==null||data.speed==="")?"":Number(data.speed);
    const acc  =(data.acc==null||data.acc==="")?"":Number(data.acc);

    // ① positions：最新のみ（1神輿1行・上書き）
    const row=[data.id,name,lat,lng,speed,now,data.token||""];
    if(idx>=0) pos.getRange(idx+2,1,1,7).setValues([row]);
    else       pos.appendRow(row);

    // ② History：受信ごとに1行追加（削除しない）
    const hist=getHistory_();
    hist.appendRow([
      Utilities.formatDate(now,TZ,"yyyy"),
      Utilities.formatDate(now,TZ,"yyyy/MM/dd"),
      Utilities.formatDate(now,TZ,"HH:mm:ss"),
      data.id, name, lat, lng, acc
    ]);

    CacheService.getScriptCache().remove(CACHE_KEY);
    return out_({ok:true});
  }catch(err){ return out_({ok:false,error:String(err)}); }
  finally{ lock.releaseLock(); }
}

/* ---- 閲覧・管理へ最新位置を返す（owner列は返さない） ---- */
function doGet(e){
  const cache=CacheService.getScriptCache();
  const cached=cache.get(CACHE_KEY);
  if(cached) return out_raw_(cached);

  const sh=getPositions_(); const last=sh.getLastRow(); let list=[];
  if(last>=2){
    sh.getRange(2,1,last-1,6).getValues().forEach(r=>{
      list.push({ id:r[0], name:r[1], lat:r[2], lng:r[3],
        speed:(r[4]===""?null:r[4]),
        updated:(r[5] instanceof Date)?r[5].getTime():new Date(r[5]).getTime() });
    });
  }
  const body=JSON.stringify({ ok:true, server:Date.now(), mikoshi:list });
  cache.put(CACHE_KEY, body, CACHE_SEC);
  return out_raw_(body);
}

function out_(obj){ return out_raw_(JSON.stringify(obj)); }
function out_raw_(str){ return ContentService.createTextOutput(str).setMimeType(ContentService.MimeType.JSON); }
