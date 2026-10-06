# CHANGELOG

SECTOR NOVA 2 の変更履歴です。開発は `DESIGN.md` の「16. 開発フェーズ」に沿って Phase 単位で進めます。

## [Phase 3] 雑魚敵 — 2026-10-06

### Phase 3 前の対応

- 大きな文字を揺らさないように: タイトルロゴの上下の揺れをやめ、タイトルと CAMPAIGN COMPLETE の影を「同じ大きさの文字を固定位置にずらす」形に変更（`drawShadowedText`）。
  STYLE_GUIDE.md に「大きな文字は揺らさない」を追記
- 武器ごと・Lv ごとの1秒あたりダメージを計測し、README に表で記録（遠距離・近距離、オプション2機あり/なし）
- DESIGN.md（ルートと `sector-nova-2/` の両方）の「14. ボス・中ボス」の共通ルールと「17. バランスの原則」に
  「最強装備（Lv3＋オプション2機）でも、想定撃破時間の下限の半分以上かかること」を追記
- 計測の結果、武器は設計書の HP の目安に対して強すぎると判断。数値は変えず、README の「TODO / 要判断」に案を記載

### 追加

- 2作目の雑魚11種: SHARD / WISP / SNIPER / MINE LAYER / GUN DECK / CARRIER / MIRROR / PHASE GHOST / SWARM / FLARE SPIRIT / LINK GUARD
- 派生: DRONE / MINE / HATCHLING（SWARM 型・WISP 型）/ GOLD SHARD / GOLD GHOST
- 敵の共通の仕組み: LINK GUARD のバリア（`takeHit`）、すり抜け（`isHittable`）、地上物（`ground`）、子の出現（`spawned`）、
  撃破時の弾（`deathBullets`）、編隊ボーナス（`formation`）
- Stage 0「TEST RANGE」（DEBUG_MODE のみ。タイトルの行・0 キー・スマホのタップで開始。無敵で開始し、敵の名前を表示）
- 敵ごとの色（`COLORS` の `SHARD_*` など）とパラメータ（`utils.js`）

### 変更

- 難易度の倍率（敵弾の速さ・発射頻度・撃ち返しの数）をタイトルで選んだ難易度で `patterns.js` から適用
- ORB CORE の発射間隔にも難易度の発射頻度をかける
- HOMING の目標・CHAIN の連鎖・BURST から、消えている PHASE GHOST を外す
- 「大型の敵」を敵ごとの指定に（2作目では CARRIER）

## [Phase 2] 検収前の修正 — 2026-10-06

- タッチ操作に **BURST ボタン** を追加（画面右下。ゲージ満タンの時だけ金色で押せる。満タン前は暗い丸で縁にゲージ量。タッチ端末でだけ表示）
- タッチ操作で移動中の指を個別に追うように（移動しながら BURST ボタンを押せる。2本目の指が BURST ボタン以外ならポーズ）
- **BURST で倒した雑魚ではゲージが増えない** ように変更（コンボは続く）
- DESIGN.md（ルートと `sector-nova-2/` の両方）: 「この版でやらないこと」からスマホ／タッチ操作を外し、「変える」に
  「テスト用の仮タッチ操作あり（本格的なスマホ対応は対象外）」を追加。「7. NOVA BURST」に BURST 撃破ではゲージが増えないことを追記。
  「16. 開発フェーズ」に、各 Phase の完了条件の確認に仮タッチ操作を含めることを追記
- DEBUG 表示は、BURST ボタンがある時はその上に表示

## [Phase 2] 自機と新システム — 2026-10-06

### 追加

- 新自機 **NOVA-II**（細身・双発エンジン）と **オプション機**（最大2機、遅れて追従、Lv1・威力50%で同じ武器を撃つ、被弾で1機減る）
- 武器のレベル制（Lv1〜3、時間切れなし、被弾で Lv -1、Lv1 で被弾すると NORMAL）
  - **SPREAD FAN**（3/4/5方向）、**RAIL LANCER**（細/太/太2本、貫通、移動0.75倍）、
    **CHAIN BOLT**（80px 以内へ連鎖1〜3回、ジグザグの電撃）、**HOMING NEEDLE**（追尾1〜3発）
- アイテム全10種を色と形で区別（武器4種・OPTION・REFLECT SHIELD・REPAIR・HULL UP・STAR CHIP・NOVA CRYSTAL）
- **REFLECT SHIELD**: 1回だけ被弾を防ぎ、半径60px内の敵弾を跳ね返して敵に当たる弾にする（20秒）
- **NOVA BURST**（X）: 敵弾全消去（1発10点）、画面内の雑魚に30ダメージ、ボスは最大HPの8%が上限、120フレーム無敵、リングとフラッシュ
- **NOVA ゲージ**（撃破 +2/大型 +4、かすり +3、STAR CHIP +10、Lv3同色 +15、部位破壊 +10）
- **かすり**（半径20px、1発1回、+3% / 20点×コンボ倍率 / 火花、無敵中は無し）
- `src/scoring.js`: **コンボ**（90フレーム、×1/×2/×4/×8、倍率アップ時の「×4!」表示）
- HUD 一式: コンボと残り時間バー、NOVA CRYSTAL 数、武器名と Lv、オプション数、REFLECT 残り秒、NOVA ゲージと BURST READY
- デバッグキー 1〜8 / 0（設計書どおり。9 は Phase 1 のまま）
- 効果音: 被弾・アイテム・かすり・BURST（ショット・撃破は Phase 1 から）
- `EffectsManager` に電撃・かすりの火花・BURST のリングを追加

### 変更

- DESIGN.md（ルートと `sector-nova-2/` の両方）に Phase 1 で採用した2点を反映（タイトルの ←→ の範囲、ボス撃破の瞬間の弾消去）
- ステージ開始時の引き継ぎを設計書 15-7 に合わせた（通常進行では武器・Lv・オプション・ゲージ・結晶を引き継ぎ、
  ライフ・HULL UP の上限・REFLECT・位置はリセット）
- 敵の撃破点にコンボ倍率をかけるように
- HUD のレイアウト（ステージ表示を `ST1` に短縮、ボスの HP バーを左寄せ）
- タイトルの操作説明に BURST: X、デバッグキーの説明を更新

### 削除

- 1作目の武器（TRIPLE BEAM / PIERCE LASER / FLAME VORTEX、20秒制）とアイテム（SHIELD BARRIER / LIFE RECOVER / MAX LIFE UP）

## [Phase 1+] 仮のタッチ操作 — 2026-10-06

- `src/touch.js`: スマホで試すための仮のタッチ操作（タイトルはタップで選択・決定、プレイ中はドラッグ移動 + 自動ショット、2本指でポーズ）
- `InputHandler.tapAction()`: タッチから1フレームだけのボタン入力を送る口
- `style.css`: キャンバス上でのスクロール・ズーム・文字選択を無効化、横幅に収まるように

## [Phase 1] 土台 — 2026-10-06

ベース: SECTOR NOVA v0.3 Campaign Complete（`../sector-nova/`、変更なし）

### 追加

- `src/timeline.js`: 時刻付きデータでステージを進める `TimelineRunner`
  - イベント: `spawn` / `warning` / `boss`（その他のイベントは種類だけ定義し、使う Phase で実装）
  - 出現位置 `x`: 数値 / `left` / `center` / `right` / `random` / `player`
  - 並び方 `pattern`: `line` / `wave` / `column` / `row` / `v` / `sides` / `random`
  - `pause()` / `resume()`（中ボス戦用）、`skipTo('warning')`（デバッグキー9）
  - `DEBUG_MODE` 時のタイムライン書き間違いチェック
  - Stage 1「FROST RING」の仮タイムライン（1作目の敵、約111秒でボス）
- `src/boss.js`: ボスの共通クラス `BossBase` と部位 `BossPart`
  - 形態（形態ごとの HP、HP 割合 / 任意条件での移行）、部位（コアより先に被弾、撃破ボーナス、再生）
  - `isVulnerable()` / `damageMultiplier()`、攻撃スケジューラ（順番・継続時間・間隔）
  - 形態移行（弾全消去 + 形態名表示）、撃破（小爆発 → 大爆発・弾消去 → 2秒の余韻）
- `src/bosses/orbCore.js`: 1作目の ORB CORE を `BossBase` で作り直したもの（HP・攻撃間隔・3方向弾・怒り状態・見た目は1作目と同じ）
- `src/patterns.js`: 弾パターン `Patterns.aimed / fan / ring / spiral / burstFromDeath`、弾速上限、難易度倍率の適用場所、
  予告付き危険物 `Hazard`（`vline` / `hline` / `beam` / `circle`、予告は最低40フレーム）
- `src/hud.js`: HUD を `game.js` から分離（左上ライフ / 上中央スコア / 右上ステージ / ボスHPバー / 左下武器）
- `src/menu.js`: 新タイトルメニュー（NEW GAME / CONTINUE / STAGE SELECT / DIFFICULTY / BOSS RUSH / SOUND）と
  ポーズ・ゲームオーバー・ステージクリア・キャンペーンクリア画面
- `src/audio.js`: Web Audio の骨組み（最初のキー入力で AudioContext 作成、効果音 / BGM バス、M キーでミュート）と
  テスト用効果音3つ（`shot` / `explode` / `select`）
- `src/background.js`: 星空を移設し、ステージ別テーマ（グラデーション・星雲の色・追加レイヤーの口）を追加
- `COLORS` にステージ別パレット（`FROST_*` / `HARBOR_*` / `STORM_*` / `HIVE_*` / `CORONA_*` / `HELIOS_*`）、
  撃ち返し弾・反射弾・危険物・タイトル用の色を追加
- 難易度表 `DIFFICULTY_SETTINGS` とセーブキー一覧 `SAVE_KEYS` を `utils.js` に追加
- 入力を論理アクション化（`INPUT_BINDINGS`）。将来のタッチ操作用に `setVirtual()` を用意
- デバッグキー 9（WARNING 直前へスキップ）、`DEBUG_MODE` 時の右下デバッグ表示と `window.game`
- `README.md` / `CHANGELOG.md` / `DESIGN.md`（設計書のコピー）、`STYLE_GUIDE.md` のパレット追記

### 変更

- タイトル・ページ名を「SECTOR NOVA 2」に、サブタイトルを「ECLIPSE」に
- セーブキーを `sectorNova_*` から `sectorNova2_*` に変更（1作目のセーブとは完全に別）
- Stage 1 の敵の出し方をランダムからタイムラインに変更し、ボス出現を60秒から111秒（WARNING は108秒）に
- ステージを6つ（FROST RING / DEAD HARBOR / STORM VEIL / ECLIPSE HIVE / CORONA ZONE / HELIOS CORE）で定義。Phase 1 で遊べるのは Stage 1 のみ
- 敵の射撃を `Patterns.aimed` 経由に変更
- 敵弾とボス弾を1つのリストにまとめた
- ボス撃破後に2秒の余韻を入れてから次の画面へ
- WARNING 開始時に雑魚の出現を止め、残っている敵弾を消すように
- タイトルの Enter はカーソル位置の項目を決定（初期位置は NEW GAME）

### 修正

- 1フレーム内に押して離したキーを取りこぼす問題
- ウィンドウのフォーカスが外れた時にキーが押しっぱなし扱いになる問題
- 前のステージを再クリアすると解放済みステージが下がる問題

### 削除

- ランダム湧きの `EnemySpawner` と1作目の Stage 2〜5 の内容
- 1作目のボス定義 `BOSS_TYPES` / `Boss` クラス（ORB CORE は `BossBase` 版に置き換え）
