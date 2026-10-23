# 武将卡面动作与画风设计
本轮使用内置 image_gen 生图，逐位生成 26 张独立卡面；统一通过 Cocos Image Core 缩放为 350×480 PNG。最终覆盖原 `assets/resources/ui/hero/` 图片，保留文件名、原 .meta、资源引用与 `Hero.Icon` 配置。
## 画风与构图
采用中国历史连环画的墨线与克制设色：哑光衣甲、自然年龄与表情、清晰色块、有限装饰。每位角色的躯干、重心、手势和视线围绕不同动作设计，避免统一站姿。画面只包含人物绘图，不烘焙文字和卡框。
以下动作都是美术创作，不是对当时瞬间或真实相貌的复原。有明确史载事迹的角色以该事迹为线索；仅有身份或性格记载的角色作合理创作；貂蝉、马云禄采用文学形象，黄月英的工匠设定采用民间传说，曹操的横槊赋诗采用演义意象。SP 是游戏变体，不额外声称有史载形态。
## 人物动作与依据
| 配置 ID | 人物 | 动作设计 | 依据性质与参考 | 保留的图片文件 |
|---|---|---|---|---|
| 1001 | 吕布 | 辕门射戟：侧身开弓，重心压在前腿 | 史载事件，动作作艺术设计；[原文参考](https://zh.wikisource.org/wiki/三國志/卷07) | `card_1001_v2.png` |
| 1002 | 刘协 | 案前书诏：坐姿前倾，扶卷落笔 | 依据汉献帝身份创作；[原文参考](https://zh.wikisource.org/wiki/後漢書/卷09) | `card_1002.png` |
| 1003 | 张让 | 掀帘侧窥：佝身回首，袖中握印 | 依据中常侍身份与宫廷权势创作；[原文参考](https://zh.wikisource.org/wiki/後漢書/卷78) | `card_1003.png` |
| 1004 | 貂蝉 | 回旋舞袖：抬臂翻腕，身形呈弧线 | 文学人物，采用《三国演义》舞宴形象；[原文参考](https://zh.wikisource.org/wiki/三國演義/第008回) | `card_1004.png` |
| 1005 | 何太后 | 临朝裁决：端坐抬手，衣袖形成横势 | 依据何太后临朝身份创作；[原文参考](https://ctext.org/text.pl?if=gb&node=73722&show=parallel) | `card_1005.png` |
| 1006 | 黄盖 | 赤壁引火：单膝跪在船头，俯身点燃薪草 | 据《三国志》火攻事迹；[原文参考](https://zh.wikisource.org/wiki/三國志/卷55) | `card_1006.png` |
| 1007 | 董卓 | 据席横坐：身体后倚，抬杯俯视 | 依据权臣形象创作；[原文参考](https://zh.wikisource.org/wiki/三國志/卷06) | `card_1007.png` |
| 1008 | 张角 | 符水济众：俯身递碗，长杖支地 | 据《后汉书》符水传教记载，画面为艺术设计；[原文参考](https://www.chinese-classics.org/read/history/hou-han-shu/hou-han-shu-071) | `card_1008.png` |
| 1009 | 董卓sp | 西凉驰射：马上张弓，骑战姿态 | 依据董卓善左右驰射的记载；[原文参考](https://ctext.org/text.pl?if=gb&node=76668&show=parallel) | `card_1009.png` |
| 1010 | 吕布sp | 转身挥戟：前跨斜劈，红披风压成块面 | 演义武将意象，与射戟版区分；[原文参考](https://zh.wikisource.org/wiki/三國志/卷07) | `card_1010.png` |
| 1011 | 贾诩 | 俯案落子：拈筹推演，神情内敛 | 依据谋士身份创作；[原文参考](https://zh.wikisource.org/wiki/三國志/卷10) | `card_1011.png` |
| 1012 | 步练师 | 敛袖礼让：侧身行礼，双手相叠 | 依据步夫人谦和、不妒与举荐形象创作；[原文参考](https://zh.wikisource.org/wiki/三國志/卷50) | `card_1012.png` |
| 1013 | 赵云 | 长坂护主：回身护婴，单手横枪 | 据《三国志》长坂保护后主事迹；[原文参考](https://zh.wikisource.org/wiki/三國志/卷36) | `card_1013.png` |
| 1014 | 吕蒙 | 军中读书：盘膝低首，双手展简 | 据《三国志》裴注劝学故事；[原文参考](https://zh.wikisource.org/wiki/三國志/卷54) | `card_1014.png` |
| 1015 | 甄姬 | 赈谷分粮：侧跪倾斗，回首招人 | 据甄氏劝家中赈济亲邻记载；[原文参考](https://ctext.org/text.pl?if=gb&node=602196) | `card_1015.png` |
| 1016 | 刘备sp | 躬身迎贤：上前拱手，面带诚意 | 据刘备礼贤形象与三顾事迹作艺术设计；[原文参考](https://zh.wikisource.org/wiki/三國志/卷32) | `card_1016.png` |
| 1017 | 诸葛亮 | 俯身布阵：扶案指图，羽扇收在腰侧 | 依据谋略与推演兵法形象创作；[原文参考](https://zh.wikisource.org/wiki/三國志/卷35) | `card_1017.png` |
| 1018 | 陆逊 | 临阵发令：转身举令，另一手压剑 | 据夷陵指挥身份作艺术设计；[原文参考](https://zh.wikisource.org/wiki/三國志/卷58) | `card_1018.png` |
| 1019 | 马云禄 | 马上探身：俯冲挺枪，目光锁定前方 | 文学人物，采用《反三国演义》骑战形象；[原文参考](https://zh.wikisource.org/zh-hant/反三國演義/第10回) | `card_1019.png` |
| 1020 | 黄月英 | 伏案制器：执尺比量，另一手固定木件 | 才学据史注，工匠姿态取民间传说；[原文参考](https://zh.wikisource.org/wiki/三國志/卷35) | `card_1020.png` |
| 1021 | 马超 | 勒马回望：挺身收缰，长枪斜背 | 据西凉骑将身份作艺术设计；[原文参考](https://zh.wikisource.org/wiki/三國志/卷36) | `card_1021.png` |
| 1022 | 曹操 | 临风吟诗：斜倚长槊，抬杯沉吟 | 文学意象，采用《三国演义》横槊赋诗；[原文参考](https://zh.wikisource.org/wiki/三國演義/第048回) | `card_1022.png` |
| 1023 | 关羽 | 捋髯读简：稳坐凝神，垂目观简 | 据关羽好《左氏传》的传统记载作艺术设计；[原文参考](https://zh.wikisource.org/wiki/三國志/卷36) | `card_1023.png` |
| 1024 | 张飞 | 据桥怒喝：沉肩跨步，横矛拦路 | 据《三国志》长坂据水断桥事迹；[原文参考](https://zh.wikisource.org/wiki/三國志/卷36) | `card_1024.png` |
| 1025 | 周瑜 | 顾曲抚琴：指尖停弦，侧首听音 | 据《三国志》周瑜精音律形象创作；[原文参考](https://zh.wikisource.org/wiki/三國志/卷54) | `card_1025.png` |
| 1026 | 孙尚香 | 拔剑回身：侧步出鞘，短袍收袖 | 据孙夫人才捷刚猛形象作艺术设计；[原文参考](https://zh.wikisource.org/wiki/三國志/卷37) | `card_1026.png` |

## 最终生成提示词
每张图使用下列共用提示词，再拼接对应人物的 SUBJECT ACTION。生成模式：内置 image_gen；本轮为全新绘制，未使用旧卡面姿势作为参考；不透明背景。原始生成图不直接供游戏加载，导入版统一为 350×480。
### 共用提示词

```text
Use case: historical-scene.
Asset type: one finished collectible Three Kingdoms character illustration for a 350 x 480 game card, portrait aspect ratio 35:48. Generate ONE image, no collage.
Art direction: a carefully DRAWN Chinese historical illustrated-book / lianhuanhua painting with restrained opaque gouache colour. Expressive tapered ink outlines, clearly designed two-dimensional shapes, broad deliberate shadow shapes, matte flat mineral colours, occasional dry-brush accents. Anatomy is convincingly hand-drawn, not a painted photograph. Face has individual asymmetry and age, meaningful eyes, no generic model face. Keep the drawing clean and readable at thumbnail size. Very subtle paper only, not a noisy texture filter. Real cloth weight and worn simple iron/leather; decoration sparse and intentional.
Composition: the SUBJECT ACTION below is the essential design, not a static standing portrait. Strong unmistakable silhouette and believable weight shift; torso, elbows, hands and gaze all participate in that action. Keep entire head and important hands/prop visible with 5% safe margin. Character is the focus, fills 78-90% of height; face and hands readable, not tiny. Crop secondary objects/horse naturally at lower edge if necessary. Keep the leftmost 10% and bottom 12% quieter for existing game labels. Background a few economical setting marks on warm stone-grey or pale ochre paper, subordinate to figure, no busy landscape.
Lighting: soft diffuse daylight described with 2-3 painted values, no photographic lighting. Colours: warm ivory, charcoal, indigo, earth red, moss, limited antique bronze; each subject's accent specified below. Refined published book illustration, serious and human, not a flashy fantasy poster.
Constraints: Eastern Han / Three Kingdoms inspired clothing; fully clothed adults, coherent hands and weapon geometry, no gore, no text, no Chinese characters, no letters, no numbers, no watermark, no card frame, no UI.
Avoid: default straight upright stance looking to one side, identical mannequin poses, photorealism, 3D/PBR render, volumetric rays, bloom, rim glow, polished gold, intricate fantasy filigree, pore texture, wet/plastic skin, airbrushed faces, anime doll faces, generic gacha gloss, excessive scratches/grain, smoky cinematic background.

```

### 1001 吕布

```text
SUBJECT ACTION (highest priority):
Lü Bu / 吕布, a powerful adult archer in his thirties, strong square face, narrow focused eyes, small moustache, two restrained pheasant plumes. ACTION: standing in a deep SIDE PROFILE facing image LEFT, both feet planted at different depths, torso twists, left arm extends a recurved wooden bow to the left, right elbow pulled well BACK at shoulder height, right fingers draw the string and a SINGLE arrow to his cheek. Show the instant of steady aim in the famous halberd-shooting feat, NOT holding a spear. Correct bowstring triangle and nocked arrow. Dark iron Han lamellar vest over vermilion sleeves, red sash with short ends. Three-quarter length composition, bow and both hands entirely in frame, head not hidden. Spare camp gate post far behind. Ink-drawn action, bold diagonal shoulder line.
```

### 1002 刘协

```text
SUBJECT ACTION (highest priority):
Liu Xie / Emperor Xian, adult in his late twenties, slender pale face, fine brows, light moustache, restrained and weary dignity. ACTION: SEATED leaning forward over a low lacquer writing table, head inclined down toward a plain silk edict; right hand holds a brush poised just above silk, left hand presses the scroll flat. Shoulders curve inward with concentration; legs folded under black and muted crimson imperial robes. Small Han crown with hanging beads visible but not hiding face. Three-quarter view from slightly above, intimate asymmetric composition, table slopes diagonally across lower third. No writing visible. A single screen edge behind, no grand throne architecture. Focus on human tension and careful hand gesture.
```

### 1003 张让

```text
SUBJECT ACTION (highest priority):
Zhang Rang / 张让, older eunuch official around sixty, gaunt long face, thin lips, clean-shaven, deep eyelids, shrewd worried gaze. ACTION: body seen in three-quarter BACK view, upper body bent slightly toward a bamboo palace curtain; left hand lifts the curtain edge at shoulder height, head turns sharply back over right shoulder toward viewer; right hand low at waist partially concealed inside the opposite sleeve holding a small bronze seal. Only two anatomically clear hands. Plum-brown long official robe, plain black tall Han court cap. Strong hooked silhouette and twisting neck, NOT an upright front-facing official. Curtain drawn as a few flat vertical lines; background warm grey. No evil magic, no caricature.
```

### 1004 貂蝉

```text
SUBJECT ACTION (highest priority):
Diao Chan / 貂蝉, adult court dancer in her twenties from Romance of the Three Kingdoms, lively thoughtful almond eyes, individual natural face. ACTION: captured during a turning Han sleeve dance, body in an S-CURVE, hips turned left and shoulders right, head looks down over shoulder; one arm arcs above her head, the other reaches low outwards, long cloth sleeves trace two unequal sweeping curves. Weight on one supporting leg with the other stepping across, not symmetrical arms, not standing with a fan. Fully clothed deep muted rose and cream layered long robe, simple bronze hairpin, no cleavage or glitter. Three-quarter to full figure but face large/readable. Spare low stage rail only. Grace comes from accurate line rhythm and weight, not floating fabric or effects.
```

### 1005 何太后

```text
SUBJECT ACTION (highest priority):
Empress Dowager He / 何太后, mature woman around forty, broad expressive face, firm brows, forceful political authority, not a teenage beauty. ACTION: seated UPRIGHT on a low Han lacquer couch at an oblique angle, shoulders facing viewer, left forearm rests heavily on armrest, right arm extends outward palm DOWN in a decisive calming/order gesture at chest level; she turns her chin slightly upward toward unseen officials. Straight powerful vertical back contrasted with horizontal sleeve. Dark burgundy and black court robes, modest bronze phoenix hair ornament, broad sleeves painted as simple structured folds. Knees and couch lower edge visible, face uncovered. Pale interior screen and one curtain edge, no ornate throne room.
```

### 1006 黄盖

```text
SUBJECT ACTION (highest priority):
Huang Gai / 黄盖, weathered veteran around sixty, deep brow and grey moustache, sturdy muscular build. ACTION: kneeling on ONE KNEE on a wooden fireboat prow, torso leaning steeply forward, one hand braces against the gunwale, other hand lowers a short burning torch toward a neatly tied bundle of reeds at lower left; he looks directly at the task. Only a small orange flame, not a cinematic inferno. Brown leather and dark iron armour, faded rust sleeves rolled back, greying hair tied under plain cloth. Side three-quarter view, shoulders on a diagonal, visible bent knee establishes weight. Blue-grey river indicated by three brushstrokes. Hands and flame clear, no unrelated weapon.
```

### 1007 董卓

```text
SUBJECT ACTION (highest priority):
Dong Zhuo / 董卓, older heavyset powerful warlord, coarse moustache and beard, fleshy broad face and tired sharp eyes. ACTION: sprawling in an ASYMMETRICAL seated posture on a low broad lacquer couch, left leg bent and right knee angled out, weight sinks heavily onto left elbow resting on a bolster; right hand raises a small plain bronze wine cup at waist height, chin lowered while eyes look outward imperiously. Crop at shins. Heavy maroon court robe worn over simple iron armour, wide dark belt, loose cap. Strong broad triangular mass, relaxed yet threatening. Do not make him stand or hold a vertical weapon. Background just one flat screen silhouette and warm grey wash.
```

### 1008 张角

```text
SUBJECT ACTION (highest priority):
Zhang Jiao / 张角, lean middle-aged religious leader with narrow weathered face and wispy beard, earnest intense expression. ACTION: crouched into a LOW HALF-KNEEL, torso bent forward as if offering ritual water to an unseen person just outside the card; right arm reaches forward holding a plain ceramic bowl steady, left hand grips a rough wooden staff planted near his back foot for balance. Head bends toward bowl, gaze warm but fervent. Muted ochre-yellow headcloth and worn hemp robe, dark green patched sash. Clear triangular bowed silhouette, anatomically natural bending. A cloth medicine satchel lies by knee. Sparse earth and paper, no thunder, no glowing runes, no supernatural effects, no actual legible talismans.
```

### 1009 董卓sp

```text
SUBJECT ACTION (highest priority):
Dong Zhuo SP / frontier-years Dong Zhuo, sturdy thick-necked bearded man around forty, recognizable broad coarse features but younger than court variant. ACTION: mounted on a steady dark horse moving toward RIGHT, he TWISTS his torso back toward LEFT in the saddle to aim a small recurved bow over his rear shoulder. Left hand holds bow, right draws string to cheek, shoulders form a strong oblique cross. Show horse neck and saddle in lower third, horse cropped naturally, NO full distant horse. Leather lamellar armour and muted dark ochre robe, plain fur-edged northern cloak, TWO modest bow/arrow cases at belt suggest historical riding skill. No extravagant plumes or crown. Horse kept subordinate; large readable face and bow hands; dry brush dust marks only. Completely different silhouette from the seated court version.
```

### 1010 吕布sp

```text
SUBJECT ACTION (highest priority):
Lü Bu SP / 吕布 SP, powerful warrior with strong square face and short moustache, two pheasant plumes. ACTION: a forceful FORWARD LUNGE with torso in three-quarter BACK view, head turned toward the strike on image RIGHT, both hands widely spaced gripping ONE straight halberd shaft that sweeps diagonally from lower left to upper right. Front knee deeply bent, rear leg drives body forward, clear balanced weight and action. Head fully visible, weapon head not cut off. Not on horseback, not standing straight, not holding an idle vertical pole. Simple dark Han lamellar armour with muted red sleeves; red cloak forms ONE broad flat graphic shape behind. Minimal sandy ground marks, no flames, no sparks. Published ink-and-gouache martial illustration.
```

### 1011 贾诩

```text
SUBJECT ACTION (highest priority):
Jia Xu / 贾诩, older strategist around sixty, lean elongated face, narrow calm eyes, sparse grey pointed beard. ACTION: seated close to a low strategy table, torso hunched slightly forward, LEFT elbow supported on knee and fingertips resting against chin, RIGHT hand reaches down to place one small dark wooden counter on an unlettered map. His gaze follows the counter, not viewer. Three-quarter view from above, table diagonal at bottom, head near upper left, clear unequal arm gestures. Plain smoky indigo robe and soft black scholar cap, no jewellery or fan. A few other wooden markers only, no complex chessboard or writing. Quiet absorbed intelligence, not mystical schemer effects.
```

### 1012 步练师

```text
SUBJECT ACTION (highest priority):
Bu Lianshi / Lady Bu, gracious adult noblewoman around thirty, softly squared natural face, steady compassionate eyes. ACTION: in a formal low HAN COURT BOW, kneeling upright on heels with torso inclined forward about thirty degrees, shoulders seen in SIDE THREE-QUARTER view; hands folded one over the other at chest level inside neatly gathered sleeves, head raised slightly to meet an unseen person rather than staring downward. Distinct compact triangular silhouette. Muted teal and warm ivory layered silk robes, simple bronze hairpins, almost no ornament, no weapon or fan. The grounded respectful pose embodies courtesy and recommending others, not sensual posing. One faint bamboo screen in background. Full knee-fold and long sleeves readable, face clear and adult.
```

### 1013 赵云

```text
SUBJECT ACTION (highest priority):
Zhao Yun / 赵云, adult battle-worn brave cavalryman in his thirties, composed focused face, lean athletic build, clean strong jaw. ACTION: seated firmly on a cropped grey horse turning away, upper body rotates protectively over LEFT shoulder, LEFT forearm cradles a securely swaddled infant close against chest under cloak, RIGHT hand holds one straight spear diagonally outward to guard the escape. Baby is a small wrapped bundle, safely supported, not distressed or exposed. Character expression protective and alert, not posing. Dull grey iron armour with off-white scarf and indigo sash, no dazzling silver. Horse neck in lower-right foreground, rest outside frame, head large, both hands coherent. A few wind-blown reed strokes and pale dust, no gore or crowds.
```

### 1014 吕蒙

```text
SUBJECT ACTION (highest priority):
Lü Meng / 吕蒙, mature soldier-scholar with slightly broad rugged face and trimmed moustache. ACTION: sitting CROSS-LEGGED on a low camp mat, armour loosened over a plain muted olive robe, torso curled forward reading a bamboo-strip book spread open in BOTH hands across lap, head lowered in concentration, one elbow rests on knee. Three-quarter side view, one bent knee projects toward viewer. A plain helmet set beside him and one spear leaning far behind establish military setting, not held. Bamboo strips unlettered. Unique rounded inward posture, no fan, no standing commander stance. Smoke-grey and warm ochre flat colours, spare tent seam only.
```

### 1015 甄姬

```text
SUBJECT ACTION (highest priority):
Lady Zhen / 甄姬, adult noblewoman in her twenties, natural thoughtful features and calm compassion. ACTION: SIDE-KNEELING beside a modest grain basket, right hand tips a small wooden measure to pour grain into a cloth sack at lower left, left hand steadies the sack rim; head turns gently toward an unseen recipient beyond left edge. Body twists at waist, bent knees and two purposeful hands clearly visible. A few grain marks sufficient, no endless particles. Dusty blue and pale ivory Han robes with sleeves tied back for the task, one simple hairpin, no goddess veil or magical water. Large readable face and humane everyday motion, not a fashion pose. Quiet pale storehouse wall indicated with two strokes.
```

### 1016 刘备sp

```text
SUBJECT ACTION (highest priority):
Liu Bei SP / 刘备, mature leader around fifty, long ears subtly indicated, narrow thoughtful face and neatly trimmed moustache/beard. ACTION: captured taking a short STEP FORWARD while bending from the waist in a respectful greeting, BOTH hands clasped together in a formal fist-and-palm salute extended away from chest, head slightly lifted with earnest welcoming gaze. Oblique full three-quarter figure, one foot forward, robe folds follow movement. Muted dark forest-green travelling robe, simple black headcloth, belt with a single sheathed sword kept low. Not an imperial throne pose and not dual-sword fighting. Spare rustic doorway suggests visit to a scholar. Humility, physical warmth and purpose.
```

### 1017 诸葛亮

```text
SUBJECT ACTION (highest priority):
Zhuge Liang / 诸葛亮, thoughtful scholar-strategist around forty, long lean face, fine beard, clear serious eyes. ACTION: STANDING but bent forward over a waist-low map table, LEFT palm planted flat on table supporting his weight, RIGHT index finger points precisely to one location on an unlettered folded map. Head tilts down following finger, shoulders asymmetric. His traditional feather fan is tucked at the waist, NOT raised in front of torso. Pale sage and ivory scholar robe, dark simple guanjin cap, wide sleeves tied back enough to show hands. Side three-quarter view, strong triangular lean. Map/table at lower-right, a few bamboo markers, blank mist-grey background. Show active reasoning rather than a stock fan-holding portrait.
```

### 1018 陆逊

```text
SUBJECT ACTION (highest priority):
Lu Xun / 陆逊, youthful-looking but adult commander around thirty-five, slender scholarly face with small moustache, alert decisive expression. ACTION: torso turns sharply from left toward RIGHT while right hand raises a plain narrow wooden command tablet above shoulder level, left hand firmly rests on the pommel of a SHEATHED straight sword at hip; rear heel lifts as he pivots, giving coat a clear angular swing. Mid-thigh-up portrait, head faces right in profile, command arm and hand entire in frame. Light indigo scholar-warrior robe over simple brown lamellar vest, plain cap, no feather fan. One dark tree silhouette and a very muted distant red horizontal brushstroke evoke a woodland campaign, not a burning cinematic scene.
```

### 1019 马云禄

```text
SUBJECT ACTION (highest priority):
Ma Yunlu / 马云禄, adult fictional female cavalry warrior from Anti-Romance of the Three Kingdoms, strong angular face, tanned skin, practical tied hair, determined gaze. ACTION: leaning far FORWARD over a cropped dun horse neck, hips remain in saddle, RIGHT arm thrusts a straight spear LOW toward image LEFT, LEFT hand holds reins close to horse mane, shoulders and spear nearly parallel. Completely different from Zhao Yun's upright protective turn and Dong Zhuo's backwards archery. Practical dark leather and dull steel lamellar armour over off-white trousers, muted teal scarf, modest helmet with no fantasy horns. Character fills frame, horse only neck at bottom, face not small. Focused controlled movement, no flying leap, no cleavage, no magical effects.
```

### 1020 黄月英

```text
SUBJECT ACTION (highest priority):
Huang Yueying / 黄月英, adult inventive scholar/artisan from folklore, warm brown skin, intelligent broad face, brown-black hair tied simply with a few loose strands, natural rather than idealized beauty. ACTION: seated SIDEWAYS on a low stool, one knee drawn up for balance, torso leans over a small timber workbench; LEFT hand clamps a wooden axle assembly in place, RIGHT hand uses a plain straight wooden measuring rule to check its length. Head inclined very close with absorbed concentration. Ochre work robe, sleeves rolled to forearms, grey apron, no jewellery or fantasy gadgets. Simple wooden wheel/axle with 4 spokes only, no sci-fi clockwork, no readable plans. Clear hand task, sharp ink drawing and broad matte paint. Her crafts role is a folklore interpretation, not a documentary claim.
```

### 1021 马超

```text
SUBJECT ACTION (highest priority):
Ma Chao / 马超, robust adult cavalry leader around thirty, angular proud face, strong nose, thick brows, controlled anger. ACTION: sharply LEANING BACK in the saddle while pulling the reins with BOTH hands toward chest, arresting a grey warhorse's forward motion. Horse head and raised neck dominate lower-left only, horse body cropped. Character torso forms a bold backward diagonal; face turns toward right beyond frame. A long spear is securely strapped diagonally across back, not in his hands. Plain light iron helmet with small rust-red tassel, off-white outer surcoat over dark leather armour, indigo cloak. Distinct strong pulling gesture, correct reins and two hands, no rearing full horse or stunt. Sparse frontier wind and grass strokes.
```

### 1022 曹操

```text
SUBJECT ACTION (highest priority):
Cao Cao / 曹操, mature statesman-poet in his fifties, compact sturdy build, broad brow, deep alert eyes and short beard. ACTION: relaxed but commanding three-quarter pose leaning his LEFT elbow on a long spear shaft braced DIAGONALLY against a ship rail; RIGHT hand holds a small dark bronze wine cup close to chin as he pauses mid-recitation, chin lifted and gaze into distance. Upper body weight shifted strongly sideways, not centered upright. Dark blue-black robe with muted burgundy collar, simple court cap, worn cloak. Crop at mid-thigh, one diagonal rail and pale river wash only. A thoughtful human moment evoking the literary poet-commander, no written poem, no bright moon, no huge fleet.
```

### 1023 关羽

```text
SUBJECT ACTION (highest priority):
Guan Yu / 关羽, majestic middle-aged warrior with long dark beard and naturally ruddy weathered skin, heavy brows, restrained dignity. ACTION: sitting SIDEWAYS on a low stool with knees apart, LEFT hand holds an open bamboo-strip book at lap level, RIGHT hand lightly gathers his long beard away from the pages; head bends down toward reading. One elbow relaxed on raised knee, muscular torso leaned forward, no warrior standing pose. Moss-green robe over dark iron armour, green cloth headwrap, no golden crown. A small unlit daylight oil lamp and sheathed blade far in background, no giant weapon in hands. Hands, book and beard clearly separated. A measured quiet scholarly silhouette, not a deity or glowing statue.
```

### 1024 张飞

```text
SUBJECT ACTION (highest priority):
Zhang Fei / 张飞, stocky powerful mature warrior, broad rugged face, thick black beard, fierce natural eyes. ACTION: wide grounded STANCE on a bridge edge, knees bent and chest thrust forward, mouth open in a forceful shout; BOTH hands spread wide on one long dark spear held HORIZONTALLY across lower chest to bar the way, shoulders squared but body leaning aggressively forward. Dramatic thick triangular silhouette, face three-quarter left, no symmetrical mannequin stiffness. Simple dark iron lamellar armour, ochre sleeves, black headcloth, red-brown waist sash. Two rough bridge planks and grey river wash establish Changban; no armies or gore. Entire face and both hands visible, spear can extend beyond edges naturally, shaft perfectly continuous.
```

### 1025 周瑜

```text
SUBJECT ACTION (highest priority):
Zhou Yu / 周瑜, elegant adult commander around thirty with expressive alert eyes and fine moustache, composed handsome but human face. ACTION: seated at a low GUQIN table, LEFT fingers lightly press strings on the left side while RIGHT hand hovers just after plucking near the instrument's right side; head turns suddenly toward LEFT as if noticing an incorrect musical note from off-frame. Upper body twists gently against seated hips. Deep muted blue robe, plain black scholar cap, a restrained strip of iron armour visible beneath robe and a sheathed sword nearby to identify soldier-musician. Guqin is one straight dark lacquer board with a few coherent strings, no keyboard. Clear fingers, intimate side three-quarter view, pale paper and one reed stroke only.
```

### 1026 孙尚香

```text
SUBJECT ACTION (highest priority):
Sun Shangxiang / Lady Sun, adult noblewoman with athletic build and confident keen natural face, hair tied in a practical high bun, no glamorous model pose. ACTION: stepping to image RIGHT while turning shoulders back toward LEFT, RIGHT hand draws a single straight Han jian sword UP and AWAY from the scabbard held low by LEFT hand at hip, blade halfway out so geometry clear. Knees slightly bent, alert ready posture, opposing diagonal arms. Dark rust-red practical cross-collared short outer robe over full trousers and light leather guard, modest bronze hairpin, no dress armour cleavage. Three-quarter figure cropped at shins, face clear. Spare hall doorway and one rack silhouette only; no second sword or magical aura. Martial confidence based on Lady Sun's strong temperament, not claimed documented sword technique.
```

## 检查范围

逐张查看生成图，检查动作区别、人物、手与兵器关系；全部缩放结果核对 350×480、PNG 与不透明像素，抽查最终尺寸下的辨识度。替换后以 AssetDB 回读确认原图片与 SpriteFrame 引用，并核对全部 Hero.Icon 路径。没有通过模拟点击逐张检查游戏内显示。
