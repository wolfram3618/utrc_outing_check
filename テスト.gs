function getMessage(){
  getTimeStamp('CU1UHNAJZ')
}

function getRRRRRange(){
  console.log(sheets.getRangeByName("前回の時刻").getValue())
}

function testFunction(){
  let origin_stamp = "1657274780.3912" //切り捨てられてしまったがために不都合が生じている
  let shaped_stamp = (Number(origin_stamp) + 1).toString() //1秒加算する
  let time_stamp = getTimeStamp(CHANNEL_ROWING_ID,shaped_stamp)
  console.log(time_stamp)
  console.log(origin_stamp,shaped_stamp)
}

function changeName(){
  let messages = getReplies(CHANNEL_TEST_ID,"1655568266.973239")
  //let messages = getReplies(CHANNEL_ROWING_ID,"1655546006.492239")
  let text = getShipAndRower(messages)
}

function getSlackUser(){
  let url = "https://slack.com/api/users.list"
  let options = {
    'method':'get',
    'content-type':'application/x-www-form-urlencoded',
    'payload':{
      'token':API_TOKEN,
    }
  }
  let response = UrlFetchApp.fetch(url,options)
  let json = JSON.parse(response)
  let members = json['members']
   let arr = [];
  
  for (const member of members) {
    //削除済、botユーザー、Slackbotを除く
    if (!member.deleted && !member.is_bot && member.id !== "USLACKBOT") {
      let id = member.id;
      let real_name = member.real_name; //氏名(※表示名ではない)
      arr.push([real_name,id]);
    }
  }
  
  //スプレッドシートに書き込み
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('シート2');
  sheet.getRange(1, 1, sheet.getMaxRows()-1, 2).clearContent();
  sheet.getRange(1, 1, arr.length, arr[0].length).setValues(arr);
}

function arrayTest(){
  let ID_TO_USERNAME = new Map()
  let sheets = SpreadsheetApp.getActiveSpreadsheet() //このスプレッドシート
  let id_sheet = sheets.getSheetByName("ユーザー一覧") //ユーザーとIDの対応を記したシート
  let datas = id_sheet.getDataRange().getValues() //ユーザーとIDを読み込む
  for(let i=0;i<datas.length;i++){
    ID_TO_USERNAME.set(datas[i][0],datas[i][1]) //KeyがID、Valueが名前
  }
}

function testBlah(){
  let text = "後掃除:"
  if(text.match("後掃除.*")){
    let nokori = text.match("後掃除.*")[0].replace("後掃除:","")
    if(nokori == ""){
      console.log("しない")
    }
    else{
      console.log("する")
    }
  }
  else{
    console.log("Not found")
  }
}