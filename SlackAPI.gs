function fetchSlackAPI(url,payload,method='get'){ //UrlFetchApp.fetchをSlack API用に最適化
  if(url == undefined || payload == undefined){
    console.log("URLかペイロードが定義されていません")
    return undefined
  }
  else{
    let options = {
      'method':method,
      'content-type':'application/x-www-form-urlencoded',
      'payload':payload,
      'muteHttpException':true
    }
    try{
      let response = UrlFetchApp.fetch(url,options)
      return response
    }
    catch(error){
      console.log("エラーが発生しました")
      console.log(error)
    }
  }
}