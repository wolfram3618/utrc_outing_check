# utrc_outing_check
漕艇部に在籍していた時に作成したSlack用のBot第一号です。  
当時の漕艇部では、AMモーション(午前の練習)に出るチームを把握するため、前日の夜に船の名前と責任者を特定の投稿に返信させていました。  
その投稿全てを手動で把握するのが大変であったため、情報を抽出して自動でまとめられるようにしたのがこのBotです。  

This is the first bot for Slack I made when I belonged to the rowing club.
At that time, each crew had to reply their ship's name and responsible person to a specifit post, so that the club can make sure who will practice next morning.  
This bot automatically extract and summarize information.

# 当時の更新履歴
6/17 トリガーを設定した時に、設定した時刻を投稿するように修正  
6/18 後掃除認識機能つけた  
6/21 諸々のバグ修正に追われている  
7/9 スレッドに投稿してしまった返信にも反応してしまったので、少々アルゴリズムを変更  
  以前:最新のスレッド1件にのみ反応  
  今回:特定のタイムスタンプ以降のメッセージ全てに反応する  
