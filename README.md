# Qu-on
Music Player controlled via TelegramBot

**BETA version**

# Install and setup

```bash
$ git clone git@github.com:isnot/Qu-on.git
$ cd Qu-on
$ npm install
$ cp settings_sample_ja.json settings.json
$ vi settings.json
```

Please use supervisor if you want.
sample conf for [Supervisor](http://supervisord.org/)
-> quon-daemon.conf


# Run

```bash
$ cd YOUR_DIR_TO/Qu-on
$ node index.js
```


# Usage

TBD

# 説明

TelegramのBotを通じて、MPDを操作します。
特に、**ストップ・タイマー**機能に特化しており、それ以外の機能は簡略化しています。
基本的なMPDの操作は、別途MPDコントローラーを併用することを推奨。

# 事前の準備

事前に以下の準備ができており、正常動作できているものとします。

- MPD インストールと設定が済んでいる。動作確認で問題ないこと
- ローカルネットワークのLAN内から、リモート・コントロールできる（たとえば、スマホのMPDアプリを利用できること）
- Node.js v10以降、npm v6以降（Ubuntu 20.04.2 LTSで動作確認）

# 今後

現時点で、BETA版クオリティであるとご理解いただきたく思います。

今後の目標として、以下のような構想があります。

- test（Jest）を書く
- ドキュメント（ユーザー向け、内部リファレンス）を書く
- YouTubeの動画・再生リストを指定し、音声を再生する
- 同様に、SoundCloud、MixCloudに対応
  - SoundCloudは、APIを利用するためのAPIキーを新たに入手できない問題がある
- これらは、ヘッドレス・ブラウザを使って実現しようかと思う
- UI/UXは要改善だろうと思っています


# 参考

- [Node.js](https://nodejs.org/ja/)
- MPD - [Music Player Daemon](https://www.musicpd.org/)
- [Telegram Bots](https://core.telegram.org/bots)
