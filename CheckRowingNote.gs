const API_TOKEN = 'TOKEN' //漕艇部のSlack用のトークン
const CHANNEL_ROWING_ID = 'CHANNEL_ID' //乗艇チャンネルのID
const CHANNEL_TEST_ID = 'ANOTHER_CHANNEL_ID' //テストチャンネルのID

//IDとユーザー名の対応(getShipNameで使う)
console.log("Now Loading...Trying to define ID_TO_USERNAME")
let ID_TO_USERNAME = new Map()
let sheets = SpreadsheetApp.openById("SHEET_ID") //このスプレッドシート
//let sheets = SpreadsheetApp.getActiveSpreadsheet()
let id_sheet = sheets.getSheetByName("設定") //ユーザーとIDの対応を記したシート
let datas = id_sheet.getDataRange().getValues() //ユーザーとIDを読み込む
//console.log(datas)
for(let i=0;i<datas.length;i++){
  ID_TO_USERNAME.set(datas[i][0],datas[i][1]) //KeyがID、Valueが名前
}
//console.log(...ID_TO_USERNAME.values()) //デバッグ用

//トリガー設定用
function setTrigger(){
  let time = new Date() //←timeを定数に設定していたけど動作には影響していないんだよなぁ。
  console.log({time})
  let hour = sheets.getRangeByName("時").getValue()
  let minute = sheets.getRangeByName("分").getValue()
  console.log({hour},{minute},typeof(hour),typeof(minute))
  time.setHours(hour) //←本当は、任意の時刻に設定できたらいいんだけど、トリガーで動作させるとバグってしまうので、定数にする
  time.setMinutes(minute)
  console.log({time})
  ScriptApp.newTrigger('main').timeBased().at(time).create()
  let text = "おはようございます。"+hour+"時"+minute+"分に乗艇ノートの有無を確認します。"
  console.log(text)
  postResult(CHANNEL_ROWING_ID,text)
}

//トリガー削除用
function delTrigger(){
  const triggers = ScriptApp.getProjectTriggers();
  for(const trigger of triggers){
    if(trigger.getHandlerFunction() == "main"){
      ScriptApp.deleteTrigger(trigger);
    }
  }
}

//メイン関数
function main(){
  let past_time_stamp = sheets.getRangeByName("前回の時刻").getValue() //前回確認したスレッドのタイムスタンプ(数字)
  past_time_stamp = (Number(past_time_stamp) + 1).toString() //1秒加算する
  let time_stamp = getTimeStamp(CHANNEL_ROWING_ID,past_time_stamp) //タイムスタンプ(文字列)
  console.log("main:",{past_time_stamp},{time_stamp})
  let text
  //console.log(typeof(past_time_stamp),typeof(time_stamp))
  //if(Math.abs(past_time_stamp - parseFloat(time_stamp)) < 1){ //一致している(新しく情報が書き込まれていない) = １秒以下なら()
  if(time_stamp.length <= 0){ //何にも存在しない場合
    text = '明日のEMは実施されないようです。'
    postResult(CHANNEL_ROWING_ID,text)
  }
  else{
    for(let i=0;i<time_stamp.length;i++){
      messages = getReplies(CHANNEL_ROWING_ID,time_stamp[i])
      console.log({messages})
      text = getShipAndRower(messages)
      postResult(CHANNEL_ROWING_ID,text)
    }
    let max_time_stamp = Math.max(...time_stamp)
    sheets.getRangeByName("前回の時刻").setValue(max_time_stamp) //タイムスタンプを上書き
  }
  delTrigger()
}

//明日の日付をM/Dの形で返す Ver1.0から使わなくなった。
function shapedTomorrow(){
  let today = new Date()
  today.setDate(today.getDate()+1) //1日進める
  let shaped_date = (today.getMonth()+1) + '/' + today.getDate()
  return shaped_date
}

//スレッドの内容を取得して、タイムスタンプを抽出する
function getTimeStamp(channel_id=undefined,oldest_ts="0"){
  const CONV_HIS_URL = 'https://slack.com/api/conversations.history'
  //const TOMORROW = shapedTomorrow() 
  const MOTION = 'em'
  const BEGIN_STRING = '\n艇名:'
  if(channel_id==undefined){
    console.log("Error:channel_id is missing")    
  }
  else{
    /*options = {
      'method':'get',
      'content-type':'application/x-www-form-urlencoded',
      'payload':{
        'token':API_TOKEN,
        'channel':channel_id,
        'limit':max_messages
      }
    }
    let res = UrlFetchApp.fetch(CONV_HIS_URL,options)
    let json = JSON.parse(res.getContentText())*/
    //fetchSlackAPIを使うように変更した。他の関数も同様。
    let payload = {
        'token':API_TOKEN,
        'channel':channel_id,
        'oldest':oldest_ts
      }
    let json = JSON.parse(fetchSlackAPI(CONV_HIS_URL,payload,'get'))
    let messages = json['messages']
    console.log(messages)
    let unix_stamps = new Array()
    for(let i=0;i<messages.length;i++){
      let text = messages[i]['text']
      let thread_exist = text.search(MOTION + BEGIN_STRING)
      /* Searchメソッド:文字列から検索文字列wordを最初の文字から最後の文字まで検索し、一致した位置を返す。検索文字列に一致するものが無い場合、「-1」が出力される。*/
      if(thread_exist != -1){
        let thread_ts = messages[i]['ts']
        //return thread_ts 条件に当てはまるもの全てを返す仕様に変更
        unix_stamps.push(thread_ts)
      }
    }
    //return Math.max(...unix_stamps).toString() //UNIXタイムの中で最大のものを返せば良い(直前の3点リーダーを忘れないように)
    return unix_stamps //1つに絞らない unix_stampsは文字列
  }
}

function getReplies(channel_id=undefined,thread_ts=undefined){
  const CONV_REP_URL = 'https://slack.com/api/conversations.replies'
  if(channel_id==undefined || thread_ts==undefined){
    console.log("Error:channel_id or thread_ts is missing")
  }
  else{
    let limit = 10; //試行回数の上限(無限ループにはしたくない)
    for(let i=0;i<limit;i++){
      console.log("返信を取得する試行",i+1,"回目")
      let payload = {
        'token':API_TOKEN,
        'channel':channel_id,
        'ts':thread_ts,
      }
      let json = JSON.parse(fetchSlackAPI(CONV_REP_URL,payload,'get'))
      var messages = json['messages'] //{'ok':true,'messages':~}
      console.log("Now:getReplies")
      console.log(messages) //1回目のログ
      if(messages.length > 1) break; //返信がちゃんと所得できていたらOK(2件以上あるはず)
      Utilities.sleep(1000) //APIの処理がバグっていた時の対策.1秒待つ
    }
    return messages
  }
}

//船の名前を取得する 同時に、書いた人の名前も貼り付けるように機能を補修
//ただし、後掃除についても判断したいので、返信を取得する機能をgetReplies関数に移した
function getShipAndRower(messages){
  let res_txt = '乗艇ノートの記入締切時刻を守った艇名(代表者):\n'
  console.log(messages)
  let archived_texts = []
  for(let i=0;i<messages.length;i++){ //0番目を飛ばすのはスレッドの最初にはテンプレートが貼り付けられているから
    //テンプレートが貼り付けられていない可能性も考慮する
    let text = messages[i]['text']
    //if(text.match('艇名.*')){
    if(text.match('アップ開始時間:')){ //艇名は書かない人もいるのでちょっと変えてみる
      let ship_name = text.match('艇名.*')[0].replace('艇名:','') //艇名
      let user_id = messages[i]['user'] //ユーザーID
      let user_name = ID_TO_USERNAME.get(user_id) //名前に変換

      if(ship_name == "") add_text = user_name + "さん\n" //投稿者も書けば混乱しないと思われる
      else add_text = ship_name + "(代表者:" + user_name + "さん)\n"

      console.log({i},{ship_name},{user_id},{user_name},{add_text})
      if(text.match('後掃除.*')){
        let ato_souji = text.match('後掃除.*')[0].replace('後掃除:','') //後掃除するか否か
        if(ato_souji != "") archived_texts.push(add_text) //するなら、最後に加える
        else res_txt += add_text //しないならそのまま加える
      }
      else res_txt += add_text //後掃除がない場合は特に何もしない
    }
  }
  console.log(archived_texts)
  if(archived_texts.length > 0){
    res_txt += "\n乗艇ノートOK+後掃除:\n"
    for(let i=0;i<archived_texts.length;i++){
      res_txt += archived_texts[i]
    }
  }
  Logger.log(res_txt)
  return res_txt
}

//結果を投稿する
function postResult(channel_id=undefined,text=undefined){
  if(channel_id == undefined || text == undefined){
    console.log('Error:channel_id or text is not defined')
  }
  else{
    const WRITE_URL = 'https://slack.com/api/chat.postMessage'
    payload = {
      'token':API_TOKEN,
      'channel':channel_id,
      'text':text,
    }
    let json = JSON.parse(fetchSlackAPI(WRITE_URL,payload,'post'))
    console.log(json)
  }
}