# SECTOR NOVA 2

*Subtitle: **ECLIPSE***

SFC（スーパーファミコン）風の縦スクロールシューティング「SECTOR NOVA」の続編です。
HTML5 Canvas と JavaScript だけで作られており、画像・音声ファイル・外部ライブラリは使いません。

- 設計書: [DESIGN.md](DESIGN.md)（開発は「16. 開発フェーズ」の Phase 単位で進めます）
- 見た目のルール: [STYLE_GUIDE.md](STYLE_GUIDE.md)
- 変更履歴: [CHANGELOG.md](CHANGELOG.md)
- 1作目（`../sector-nova/`）は一切変更していません。

## 現在のバージョン: Phase 1（土台）

Phase 1 は「続編の骨組み」です。中身（自機・武器・雑魚・ボス）はまだ1作目のものを流用しています。

- 新しいタイトルメニュー（↑↓で選択、←→で変更、Enterで決定）
- Stage 1「FROST RING」が **タイムライン** で進行（敵は1作目のものを使った仮配置）
- Stage 1 のボスは、`BossBase` で作り直した **ORB CORE**（1作目と同じ HP・攻撃・見た目）
- 弾パターン関数と予告付き危険物 `Hazard`（`src/patterns.js`）
- HUD とメニューを `game.js` から分離（`src/hud.js` / `src/menu.js`）
- Web Audio の骨組み（最初のキー入力で起動、M でミュート、テスト用効果音3つ）
- 背景モジュールの骨組み（ステージ別テーマ。Stage 1 は氷の青）
- セーブは `sectorNova2_*` キー（1作目とは完全に別）

## 起動方法

`index.html` をブラウザで開くだけで遊べます。ビルドは不要です。
ローカルサーバーを使う場合は、このフォルダで `python -m http.server 8754` を実行して
`http://localhost:8754/` を開いてください。

## 操作

| キー | 動作 |
|---|---|
| 矢印キー / WASD | 移動 |
| Space | ショット（押しっぱなしで連射） |
| P | ポーズ / 再開 |
| Enter | 決定 / 進む / タイトルへ戻る |
| M | サウンドの ON / OFF（どの画面でも可） |
| タイトル: ↑↓ | メニュー選択 |
| タイトル: ←→ | DIFFICULTY / STAGE SELECT / SOUND の値を変更 |
| タイトル: C | CONTINUE（最新の解放ステージから） |
| タイトル: 1〜6 | 解放済みのステージを直接開始（Phase 1 は Stage 1 のみ） |
| X | NOVA BURST（Phase 2 で実装予定。キー割り当てのみ済み） |

### 仮のタッチ操作（スマホ確認用・設計書の範囲外）

| 画面 | 操作 |
|---|---|
| タイトル | 行をタップで選択、選択中の行をもう一度タップで決定（DIFFICULTY / SOUND はタップごとに切り替え） |
| プレイ中 | 画面のどこでもドラッグで移動（相対移動）、触れている間は自動ショット、2本指タップでポーズ |
| ポーズ中 | タップで再開 |
| その他の画面 | タップ = Enter |

`src/touch.js` に分離しています。正式なタッチ対応は設計書で「この版でやらないこと」なので、仮実装です。

### デバッグキー（`DEBUG_MODE = true` の時、プレイ中のみ）

| キー | 動作 |
|---|---|
| 1〜4 | 武器を NORMAL / TRIPLE / LASER / FLAME に切り替え（1作目の武器。Phase 2 で置き換え） |
| 5 | SHIELD BARRIER 付与（1作目の仕様。Phase 2 で置き換え） |
| 9 | WARNING の直前までスキップ（ボス戦の確認用） |

`DEBUG_MODE` の時は、画面右下にタイムラインの経過秒と敵・敵弾の数が出ます。
ブラウザのコンソールから `window.game` でゲームの状態を確認できます。
リリース時は `src/utils.js` の `DEBUG_MODE` を `false` にしてください。

## タイトルメニュー

| 項目 | 内容 |
|---|---|
| NEW GAME | Stage 1 からスコア 0 で開始 |
| CONTINUE | 最新の解放ステージから開始 |
| STAGE SELECT | ←→ で解放済みステージを選び、Enter で開始 |
| DIFFICULTY | EASY / NORMAL / HARD（←→で変更・セーブ。効果は Phase 3 / 6 で適用） |
| BOSS RUSH | NORMAL END 到達で解放。未解放時は「???」でグレー表示 |
| SOUND | ON / OFF（セーブ） |

タイトルにはロゴ「SECTOR NOVA 2」、サブタイトル「ECLIPSE」、BEST SCORE、BEST CLEAR を表示します。

## ステージ

| # | 名前 | 状態 |
|---|---|---|
| 1 | FROST RING | 実装済み（Phase 1 の仮内容: 1作目の敵 + ORB CORE） |
| 2 | DEAD HARBOR | 未実装（Phase 4） |
| 3 | STORM VEIL | 未実装（Phase 4） |
| 4 | ECLIPSE HIVE | 未実装（Phase 5） |
| 5 | CORONA ZONE | 未実装（Phase 5） |
| 6 | HELIOS CORE | 未実装（Phase 5） |

Stage 1 の流れ（仮）: 序盤（0〜30秒）→ 中盤（32〜75秒、50〜54秒は中ボス用の空き枠）→
後半（76〜103秒）→ 108秒 WARNING → 111秒 ORB CORE。
ORB CORE を倒すと、現時点では最後の実装ステージなので CAMPAIGN COMPLETE 画面になります。

## 仕組み（開発者向け）

### タイムライン（`src/timeline.js`）

ステージの敵出現とイベントを時刻付きのデータで書きます。

```js
{ t: 2.0,   spawn: 'A', x: 80, count: 3, interval: 20, pattern: 'line' },
{ t: 108.0, event: 'warning' },
{ t: 111.0, event: 'boss', type: 'orbCore' },
```

- `x`: 数値（px）または `'left' | 'center' | 'right' | 'random' | 'player'`
- `pattern`: `line`（同じ位置から順番に）/ `wave`（同じ波を描く）/ `column`（縦に並んで同時）/
  `row`（横一列）/ `v`（V字編隊）/ `sides`（左右の端から交互）/ `random`（1体ごとにランダム）
- `spacing`: row / column / v の間隔（px、省略時 30）
- `TimelineRunner` は独自の時計を持ち、`pause()` 中は後続のイベントが止まります（中ボス戦用）
- `DEBUG_MODE` 時、起動時にタイムラインの書き間違い（未知の敵・イベント・ボス、ボス無し）を `console.warn` で知らせます

### ボス（`src/boss.js` + `src/bosses/*.js`）

ボスは `BossBase` を継承して1ファイルずつ作ります。`BossBase` が受け持つもの:

- `phases`: 形態（名前、形態ごとの HP、移行条件 `endAtHpRatio` / `endWhen`、攻撃リスト、`onEnter`）
- `parts`: 部位（`BossPart`。コアより先に当たり、壊れると得点・再生も可）
- `isVulnerable()` / `damageMultiplier()`: 弱点露出・ダメージ軽減
- 攻撃スケジューラ: `{ run, duration, rest }` を順番に繰り返す
- 形態移行: 敵弾と危険物を全消去し、形態名を2秒表示
- 撃破: 揺れながら小爆発（90f）→ 大爆発・弾消去 → 2秒の余韻 → ステージ終了
- 50% 以下で `isEnraged`

### 弾パターン（`src/patterns.js`）

- `Patterns.aimed / fan / ring / spiral / burstFromDeath` が弾の配列を返します
- 難易度の倍率と弾速の上限（NORMAL で 4.0）は **ここだけ** で適用します
- `Hazard`: 予告（最低40フレーム、点滅する細い線）→ 発動（当たり判定あり）の2段階。
  形は `vline`（縦の雷）/ `hline`（横のフレア）/ `beam`（レーザー、回転可）/ `circle`

## ファイル構成

```text
sector-nova-2/
|- index.html          # 読み込み順に注意
|- style.css
|- README.md           # このファイル
|- CHANGELOG.md
|- STYLE_GUIDE.md      # 2作目用に更新中
|- DESIGN.md           # 設計書のコピー
`- src/
   |- utils.js         # 定数・COLORS・DEBUG_MODE・セーブ補助
   |- input.js         # キー → 論理アクション（将来のタッチ操作用の口あり）
   |- audio.js         # 効果音（Web Audio）。BGM は Phase 6
   |- effects.js
   |- background.js    # 星空 + ステージ別テーマ
   |- bullet.js
   |- patterns.js      # 弾パターン・Hazard
   |- weapon.js        # 1作目の武器（Phase 2 で置き換え）
   |- player.js        # 1作目の自機（Phase 2 で NOVA-II に）
   |- enemy.js         # 1作目の敵（Phase 3 で置き換え）
   |- powerup.js       # 1作目のアイテム（Phase 2 で置き換え）
   |- timeline.js      # タイムラインのデータと実行
   |- stage.js         # ステージ定義・ステージ解放/スコアのセーブ
   |- boss.js          # BossBase / BossPart / ボス登録
   |- bosses/
   |  `- orbCore.js    # BossBase 版 ORB CORE（Phase 1 の動作確認用）
   |- hud.js           # HUD
   |- menu.js          # タイトルメニュー・ポーズ・ゲームオーバー等の画面
   |- game.js          # 状態管理・当たり判定・進行
   `- main.js
```

`scoring.js` / `story.js` / `gimmicks.js` と残りのボスファイルは、使う Phase で追加します。

## セーブデータ（localStorage）

1作目のキー（`sectorNova_*`）とは完全に分けています。外部ファイルは作りません。

| キー | 内容 | 使用開始 |
|---|---|---|
| `sectorNova2_unlockedStage` | 解放済みの最大ステージ | Phase 1 |
| `sectorNova2_bestScore` | 最高スコア | Phase 1 |
| `sectorNova2_bestClearScore` | クリア時の最高スコア | Phase 1 |
| `sectorNova2_difficulty` | 選んだ難易度 | Phase 1 |
| `sectorNova2_muted` | ミュート設定 | Phase 1 |
| `sectorNova2_bestRanks` | ステージごとの最高ランク | Phase 4 |
| `sectorNova2_normalEndCleared` | NORMAL END 到達（BOSS RUSH 解放） | Phase 5/6 |
| `sectorNova2_trueEndCleared` | TRUE END 到達 | Phase 6 |
| `sectorNova2_bossRushBestTime` | BOSS RUSH の最速タイム | Phase 6 |

## 開発フェーズ チェックリスト

### Phase 1: 土台 — 完了

- [x] 1作目を `sector-nova-2/` にコピーし、タイトル・ページ名を「SECTOR NOVA 2」に変更
- [x] セーブキーを `sectorNova2_` に変更
- [x] `timeline.js` を作り、Stage 1 を仮の内容（1作目の敵）でタイムライン駆動にする
- [x] `BossBase` を作り、1作目の ORB CORE を作り直して動かす
- [x] `patterns.js`（弾パターン関数・Hazard）を作る
- [x] `hud.js` / `menu.js` を `game.js` から分離。新しいタイトルメニュー（↑↓選択）
- [x] `audio.js` の骨組み（AudioContext の初期化、M キーミュート、テスト用効果音3つ）
- [x] `background.js` の骨組み
- [x] `STYLE_GUIDE.md` を2作目用に更新開始（パレット追加）

完了条件:

- [x] 新タイトルから遊べる
- [x] Stage 1 がタイムラインで進み、ORB CORE（BossBase 版）を倒せる
- [x] コンソールエラーなし
- [x] 1作目のフォルダが無変更

### Phase 2: 自機と新システム

- [ ] NOVA-II の新デザイン
- [ ] 武器4種 + NORMAL、Lv 制のルールすべて
- [ ] オプション機、NOVA BURST、かすり、コンボ
- [ ] アイテム全種（NOVA CRYSTAL は見た目と取得処理まで）、REFLECT SHIELD の弾反転
- [ ] HUD 一式、デバッグキー一式
- [ ] 基本の効果音（ショット・被弾・撃破・アイテム・かすり・BURST）

### Phase 3: 雑魚敵

- [ ] 雑魚11種 + 派生（DRONE / MINE / HATCHLING / GOLD 個体）
- [ ] 難易度倍率を `patterns.js` で適用
- [ ] Stage 0「TEST RANGE」で全種を確認できるようにする

### Phase 4: Stage 1〜3

- [ ] S1〜S3 の背景・ギミック・タイムライン
- [ ] 中ボス SENTINEL、ボス3体（GLACIER MAW / DOCK TITAN / THUNDER RAY）
- [ ] WARNING 演出、LYRA の通信ウィンドウと `story.js`
- [ ] リザルト画面とランク
- [ ] S1〜S3 の NOVA CRYSTAL 条件

### Phase 5: Stage 4〜6

- [ ] S4〜S6 の背景・ギミック・タイムライン
- [ ] HIVE MOTHER、CORONA SERPENT、NEBULA HEART（侵食体）、ECLIPSE CROWN（3形態）
- [ ] NORMAL END / BAD END
- [ ] S4〜S6 の NOVA CRYSTAL 条件

### Phase 6: 仕上げ

- [ ] BGM 一式、効果音の追加
- [ ] 難易度（EASY / NORMAL / HARD）
- [ ] TRUE END 条件、TRUE ECLIPSE、TRUE END
- [ ] BOSS RUSH モード
- [ ] セーブ項目すべて、全体のバランス調整
- [ ] `README.md` / `STYLE_GUIDE.md` / `CHANGELOG.md` の最終更新
- [ ] `DEBUG_MODE = false` の状態での最終確認

## TODO / 要判断

仕様に書かれていない点は、仕様を大きく変えない最小限の実装で進め、ここに記録しています。

### Phase 1 で判断したこと

1. **Stage 1 以外は未実装扱い。** 1作目の Stage 2〜5 とランダム湧き（`EnemySpawner`）は削除しました。
   Stage 2〜6 は名前とボス名だけ定義（`implemented: false`）し、Phase 4/5 でタイムラインごと作ります。
2. **Stage 1 クリア後は1作目の CAMPAIGN COMPLETE 画面（仮）。** このとき `sectorNova2_bestClearScore` も記録されます。
   Phase 4 でリザルト画面、Phase 5 でエンディングに置き換え、BEST CLEAR の記録も NORMAL END 到達時に変えます。
3. **DIFFICULTY は選択とセーブのみ。** 弾速・発射頻度の倍率は Phase 3 で `patterns.js` の `patternDifficulty()` に、
   初期ライフ・ゲージ・スコア倍率は Phase 6 で適用します（倍率表は `DIFFICULTY_SETTINGS` に定義済み）。
4. **←→ は DIFFICULTY 行以外でも使います。** STAGE SELECT 行では ←→ でステージ番号、SOUND 行では ON/OFF を切り替えます
   （設計書の操作表には DIFFICULTY 行の ←→ だけが書かれています）。DIFFICULTY / SOUND 行は Enter でも切り替わります。
5. **タイトルの Enter は「選択中の項目の決定」。** カーソルの初期位置は NEW GAME なので、1作目と同じく Enter だけで開始できます。
6. **BOSS RUSH 行** は未解放時「???」でグレー表示、Enter しても何も起きません。モード本体は Phase 6。
7. **WARNING は簡易版。** 3秒間、雑魚の出現停止・敵弾消去・「ボス名 APPROACHING」表示まで。
   赤い帯・警報音・BGM 切り替えは Phase 4。
8. **デバッグキーは暫定。** 1作目の 1〜5（武器/シールド）を残し、タイムライン仕様にある 9（WARNING 直前へ）だけ追加しました。
   Phase 2 で設計書の 1〜8 / 0 に置き換えます。
9. **ボス撃破時の弾消去は「撃破した瞬間」にも行います。** 設計書の順序（大爆発 → 弾消去）に加えて、
   撃破後の爆発演出中に被弾しないようにするためです。大爆発の瞬間にももう一度消去します。
10. **敵弾とボス弾を1つのリスト（`enemyBullets`）にまとめました。** かすり・NOVA BURST・弾消去を1か所で扱えるようにするためです。
11. **テスト用効果音3つ** は `shot` / `explode` / `select`（メニューの移動と決定は同じ音）。
12. **Hazard の回転レーザー（`beam` + `angularSpeed`）は発動中だけ回転します。** 予告は発動時の向きのみ。
    ECLIPSE CROWN 第3形態で掃引範囲の予告が必要なら Phase 5 で拡張します。
13. **Stage 1 の50〜54秒は中ボス用の空き枠** にしてあります（中ボス SENTINEL は Phase 4）。
14. **1作目の武器（20秒制）・アイテム・自機・HUD の武器表示は Phase 2 まで流用。** ステージ開始時のリセットも1作目のルールのままです。
16. **仮のタッチ操作（`src/touch.js`）を追加。** 設計書ではスマホ操作は対象外ですが、スマホで試すために入れています。不要なら `index.html` から外せます。
15. **`window.game` は `DEBUG_MODE` の時だけ公開** します（コンソールでの確認・自動テスト用）。

### 1作目からの不具合修正（2作目のみ）

- 1フレーム内に押して離した素早いキー入力を取りこぼしていた → 取りこぼさないように修正
- ウィンドウからフォーカスが外れるとキーが押しっぱなし扱いになることがあった → フォーカスが外れたら押下状態をリセット
- 前のステージを再クリアすると解放済みステージが下がることがあった → 解放段階は下げないように修正

### 今後の確認事項

- Stage 1 の仮タイムラインの難易度は未調整（Phase 4 で本番の内容に置き換えるため）
- 目標性能（敵弾200発 + 敵40体で 60fps）の計測は、弾数が増える Phase 3〜5 で行う

## クイックテスト（手動確認）

- [ ] **起動** — タイトル「SECTOR NOVA 2 / ECLIPSE」が表示され、コンソールにエラーがない
- [ ] **タブ名** — ブラウザのタブが「SECTOR NOVA 2」
- [ ] **メニュー移動** — ↑↓ でカーソルが動き、端で反対側に回り込む。音が鳴る
- [ ] **DIFFICULTY** — ←→ で EASY / NORMAL / HARD が切り替わり、リロード後も残る
- [ ] **SOUND / M キー** — ON/OFF が切り替わり、リロード後も残る
- [ ] **BOSS RUSH** — 「???」でグレー表示、Enter で何も起きない
- [ ] **NEW GAME** — Stage 1 FROST RING がスコア 0 で始まり、背景が青い
- [ ] **タイムライン** — 敵が列・横並び・V字・左右交互などの形で順番に出てくる
- [ ] **ポーズ** — P で止まり、P で再開。止まっている間は敵も出てこない
- [ ] **デバッグ 9** — WARNING 直前に飛び、3秒後に ORB CORE が現れる
- [ ] **WARNING** — 雑魚が出なくなり、残っていた敵弾が消える
- [ ] **ORB CORE** — 3方向弾を撃ち、HP 50% 以下で赤いリングが出て攻撃が速くなる
- [ ] **撃破** — 敵弾が消え、揺れながら爆発 → 大爆発 → 2秒後に CAMPAIGN COMPLETE
- [ ] **ゲームオーバー** — ライフ0で GAME OVER、Enter でタイトルへ
- [ ] **CONTINUE / C** — タイトルで C を押すと Stage 1 から始まる
- [ ] **セーブ分離** — localStorage に `sectorNova2_*` 以外のキーが作られない（1作目のセーブに影響しない）
