# CHANGELOG

SECTOR NOVA 2 の変更履歴です。開発は `DESIGN.md` の「16. 開発フェーズ」に沿って Phase 単位で進めます。

## [Phase 4-2] Stage 2 の完成 — 2026-10-06

### 追加

- S2「DEAD HARBOR」のタイムライン（GUN DECK / MINE LAYER / CARRIER が加わる、中ボス、狭い通路、WARNING、ボス）
- S2 の背景レイヤー: 流れる金属パネルの床と、両脇で点滅する黄色い警告灯（`background.js`）
- ギミック「狭い通路」（`gimmicks.js` の `NarrowPassage`）: CAUTION 表示3秒 → 床と一緒に流れる左右の壁（最小 140px）、触れると被弾＋押し戻し、壁の縁に GUN DECK
- S2 の NOVA CRYSTAL: 壁に1枚だけある色の違うパネル（`WallPanel`）
- 中ボス HARBOR SENTINEL（SENTINEL の S2 の色、HP 75）
- ボス DOCK TITAN（`bosses/dockTitan.js`）: 腕2本の部位破壊（各 10000点）、外れて落ちる腕（影の予告つき）、追尾ミサイル、12方向リング、HP 50% 以下で強化。全攻撃に 30 フレームの予告
- HUD の CAUTION 表示、S2 開始時の LYRA の通信（`story.js`）
- DOCK TITAN と HARBOR SENTINEL の撃破時間を実戦で計測した表（README）

### 変更

- S1 クリア後は、リザルト → S2 のステージ紹介へ進む（S2 クリア後はタイトルへ）
- デバッグキー 9 で WARNING 直前に飛ぶ時、通路も消す
- `DEBUG_MODE` の時は STAGE SELECT（とタイトルの数字キー）で、実装済みのステージを解放前でも選べる（セーブは変えない）
- スマホ: STAGE SELECT の行で「< STAGE n >」の左寄り・右寄りをタップするとステージを変えられる

### テストプレイ後の調整（敵弾の量）

- DESIGN.md（ルートと `sector-nova-2/` の両方）の「17. バランスの原則」に、ステージごとの敵弾の量の目安（S1 の平均を 1 とした倍率 S1=1.0〜S6=2.5）と測り方を追記
- S2 のタイムラインを調整: 撃ってくる敵を MINE LAYER・SNIPER 各1機に減らし、撃たない敵（CARRIER・SHARD・WISP）と休みの区間で構成（道中の敵弾 S1 の 3.10倍 → 1.21倍）
- 通路の壁の GUN DECK を 6台 → 1台
- DOCK TITAN の攻撃の間隔を広げた（腕の弾の後 40→60、ミサイルの後 70→100、リング弾の後 80→110 フレーム。ボス戦の敵弾 S1 の 1.09倍 → 0.84倍、撃破時間はほぼ同じ）
- README に敵弾の数の表（調整前・調整後）と、DOCK TITAN の撃破時間の再計測を追加。README で消えていた「タイトルメニュー」の見出しを戻した

## [Phase 4-1] Stage 1 の完成 — 2026-10-06

### 設計書

- DESIGN.md（ルートと `sector-nova-2/` の両方）の Phase 4 を 4-1 / 4-2 / 4-3 に分割（それぞれの内容と完了条件）
- 「14. ボス・中ボス」の共通ルールにボスの強さの方針を追記（武器は弱めない / HP は無理なく持てる装備で想定撃破時間に収まるように / 1秒あたりダメージのゆるい上限。上限の値は提案してから決める）

### 追加

- S1「FROST RING」の本番タイムライン（SHARD / WISP / 後半から SNIPER、巨大隕石5回、GOLD SHARD、中ボス、WARNING、ボス）
- S1 の背景レイヤー: 輪のある惑星（星の奥）と漂う氷の粒（`background.js`）
- ギミック「巨大隕石」（`gimmicks.js`）: 触れると被弾、壊すと敵だけに当たる破片5つ
- 中ボス SENTINEL（`bosses/sentinel.js`。S1 は FROST SENTINEL、25秒で逃走・得点なし、出ている間はタイムラインが止まる）
- ボス GLACIER MAW（`bosses/glacierMaw.js`。顎の開閉で弱点が出る、5方向弾、影で予告するつらら、HP 50% 以下で強化）
- `BossBase` に中ボス（逃走）・1秒あたりダメージのゆるい上限（`damageCap`、超えた分は半分）・撃破演出の長さ指定
- WARNING 演出（赤い帯と流れる斜線、点滅する WARNING、ボス名、警報音 `alarm`）
- LYRA の通信ウィンドウと `story.js`（オープニング・S1・WARNING の台詞）
- 状態 OPENING / STAGE_INTRO / STAGE_RESULT、リザルト画面とランク（`calcStageRank`）、`sectorNova2_bestRanks` の保存
- S1 の NOVA CRYSTAL 条件（GOLD SHARD を出現から5秒以内に倒す）
- ボスの撃破時間を実戦で計測した表と、ダメージ上限の値の提案（README）

### 変更

- Stage 1 から1作目の敵と ORB CORE を外した（コードは自動テスト用に残す）
- S1 クリア後は CAMPAIGN COMPLETE ではなくリザルト → タイトル。BEST CLEAR はエンディングまで保存しない
- デバッグキー 9 は中ボスが出ていれば中ボスも消して WARNING 直前へ

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
