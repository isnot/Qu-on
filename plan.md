
Telegram Botとのプライベート・チャット
コマンド入力
メセージ出力

バックエンド（オーディオ・プレイヤー）との接続は、3種類
MPD
playerctl
D-bus/Mpris

https://www.musicpd.org/doc/html/protocol.html
https://github.com/RomanBurunkov/tm-node-mpd
https://github.com/mast/telegram-bot-api
https://github.com/JumpLink/node-mpris

Supervisorでメインプロセス監視

Node.jsでメインプロセス稼働→サービス化

Telegram Bot APIフレームワーク
ポーリング形式
コマンド取得

プロセス開始



ステータス問い合わせ


プレーヤー操作
再生
停止
次へ
前へ


プレイリスト操作／管理
現在のプレイリスト（再生キュー）表示
プレイリストにメディア（URI）を追加
ライブラリからメディアを選択

Mprisコマンド送出
Mprisシグナル受信

インテリジェントな停止
即時、フェードアウトしながら停止する
今の曲の最後でフェードアウト
次の曲の最後でフェードアウト
n分後、再生中の曲の最後でフェードアウト
今の曲の最後、もしくはn分後のいずれか早い方でフェードアウト


vlc
事前にアプリ起動しておくか、cvlcを起動（spawn）する。
追加可能なメディアは、ローカル・ファイルと、SoundcloudのURLが可能。

NuvolaAppYoutubeMusic
事前にアプリ起動、Libraryからプレイリストを選択して、プレイ画面にしておく。
可能な操作は、PlayとNextとStop程度か？


NuvolaAppSoundcloud
事前にアプリ起動しておく。


node-mprisを使用してわかったこと
一度にコネクト出来るアプリは、ひとつらしい？
たぶん、アプリ側で対応しているMPRISメッセージは一通り使えるっぽい。

playerctlを使用してわかったこと
$ playerctl -l
vlc
NuvolaAppYoutubeMusic
NuvolaAppSoundcloud
$ playerctl -p NuvolaAppYoutubeMusic next
$ playerctl -a stop
メディアの追加やプレイリストの操作は、多分できない？



MPD インスタンス生成
TG インスタンス生成

MPD イベント登録
TG イベント登録

MPD connect
TG connect

MPD updateイベント
    MPD状態変化→TGへ通知

TG updateイベント
    ユーサーの指令を受け取る→MPD操作


