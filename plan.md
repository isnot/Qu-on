
Telegram Botとのプライベート・チャット
コマンド入力
メセージ出力



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
