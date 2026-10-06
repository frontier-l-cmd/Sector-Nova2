# CHANGELOG

SECTOR NOVA 2 の変更履歴です。開発は `DESIGN.md` の「16. 開発フェーズ」に沿って Phase 単位で進めます。

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
