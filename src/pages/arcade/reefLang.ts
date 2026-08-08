/**
 * Reef Run EN / 简体中文 string table — shared by the lawb.xyz arcade page and the radbro.fun
 * standalone. Brand names (REEF RUN, character names) stay latin by convention; system CJK
 * fonts render the rest, so the toggle costs zero downloads. Persisted via localStorage
 * (guarded — the radbro.fun sandboxed iframe may block storage).
 */

export type ReefLang = 'en' | 'zh';

const LANG_KEY = 'reefLang';

export function loadReefLang(): ReefLang {
  try {
    return window.localStorage.getItem(LANG_KEY) === 'zh' ? 'zh' : 'en';
  } catch {
    return 'en';
  }
}

export function saveReefLang(lang: ReefLang): void {
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}

const en = {
  // Menu
  startRun: 'Start run',
  startMeta: 'Space · Enter · 1',
  swimmer: 'Swimmer',
  pickCharacter: 'Pick character · 2',
  wallet: 'Wallet',
  walletConnect: 'Connect · 3',
  walletManage: 'Manage · 3',
  notConnected: 'Not connected',
  depth: 'Depth',
  depthMeta: 'Tier & speed · 4',
  howTo: 'How to play',
  howToMeta: '30-second guide · 5',
  sound: 'Sound',
  soundOn: 'On',
  soundOff: 'Off',
  kbdHint: 'Keyboard: 1 start · 2 swimmer · 3 wallet · 4 depth · 5 how to · M sound · X exit',
  exitDesktop: '← EXIT TO DESKTOP',
  menuTagline: 'Endless swim · dodge the reef · haul the trash',
  bestDive: 'BEST DIVE',
  pressAny: 'PRESS ANY KEY · TAP TO CONTINUE',

  // Mission brief
  briefTitle: 'MISSION BRIEF',
  briefP1:
    'Divers have been recruited to help save the ocean. Lawbsters have recorded an increase of trash sightings across all corners of the ocean floor — roughly 33 billion pounds of plastic added yearly. While the lawbsters continue to collect trash on a regular schedule, any and all help is greatly appreciated.',
  briefP2:
    'The goal: collect as much trash as you can before running out of air or colliding with something. You’re welcome to keep any treasure you find while on your diving excursion.',
  dive: 'DIVE ▶',
  back: 'BACK',
  briefHint: 'ENTER · SPACE · TAP DIVE',

  // How to play
  howtoTitle: 'HOW TO PLAY',
  howtoMission: '🌊 MISSION',
  howtoMissionBody:
    'The ocean is drowning in trash — roughly 33 billion pounds of plastic added yearly. Dive, dodge the reef, and haul out all the trash you can. Any treasure you spot on the way down is yours to keep.',
  howtoSteer: '🕹 STEER',
  howtoSteerBody:
    'Three lanes. A / D or ← / → switch lanes · W swim faster · S ease off. Touch: tap left/right to lane shift, hold + swipe up/down for speed.',
  howtoSurvive: '🫧 SURVIVE',
  howtoSurviveBody:
    'Score = seconds survived. Watch two meters: Armor and O₂. Jellyfish and pufferfish sting armor + breath and slow you down; mines hit hard. The water darkens as you dive deeper — and the reef gets meaner. The statues and wrecks on the sides are scenery: only your three lanes can hurt you.',
  howtoGrab: '🧀 GRAB',
  howtoGrabBody:
    'Air tank refills O₂ · Peptides restore armor (both also cleanse slow-down) · Cheese = nitro burst · Trash = +1 hauled and a bit of armor · Coin = +1 coin and a sip of O₂.',
  howtoJackpot: '⚓ SUNKEN TREASURE',
  howtoJackpotBody:
    'Pay the CULT entry for one seeded run. Beat the survival bar and the whole treasure chest pays out to your wallet, on-chain. Free runs are for fun and stats — they never touch the treasure.',
  ok: 'OK',

  // Dive-device menu
  deviceBestDive: 'BEST DIVE',
  deviceSurvivalBar: 'SURVIVAL BAR',
  devicePot: 'CHEST',
  deviceDiver: 'DIVER',
  deviceSatchel: 'SATCHEL',
  deviceSatchelHint: 'Hauls counted from your saved runs',
  deviceSatchelConnect: 'Connect a wallet to fill your satchel.',
  deviceSatchelEmpty: 'No haul yet — dive!',
  satchelJunkLog: 'JUNK LOG',
  satchelLogHint: 'Hover a find for field notes',
  satchelLogHintTouch: 'Tap a find for field notes',
  satchelUndiscovered: 'UNDISCOVERED',
  satchelHauled: 'hauled',
  cardTitleFree: 'DIVE REPORT',
  cardTitleTreasure: 'TREASURE DIVE',
  cardDiver: 'DIVER',
  cardDate: 'DATE',
  cardDiveTime: 'DIVE TIME',
  cardHaul: 'HAUL MANIFEST',
  cardNoHaul: 'Nothing hauled this dive.',
  cardVerified: 'VERIFIED',
  cardGuest: 'GUEST DIVER',
  cardSave: 'SAVE CARD',
  cardShare: 'SHARE',
  cardSaved: 'Saved!',
  deviceLongestDive: 'LONGEST DIVE',
  deviceRuns: 'RUNS',
  deviceSurfaceTime: 'SURFACE TIME',
  deviceBarOpen: 'OPEN',

  // Game over
  gameOver: 'GAME OVER',
  depthReached: 'Depth reached',
  run: 'run',
  best: 'best',
  dived: 'dive',
  trashHauled: 'trash hauled',
  /** {n} is replaced with the run's trash count (phrasing avoids singular/plural forms). */
  thankYou: 'Trash collected: {n} — thank you for your service.',
  coins: 'coins',
  retry: 'RETRY',
  mainMenu: 'MAIN MENU',
  swimAgain: 'Swim again?',
  reasonOxygen:
    'Ran out of oxygen — stay on Milady/Radbro’s timed O₂ tanks. Clawb does not run out of breath underwater.',
  reasonCrush: 'Coral block collision — change lanes with A/D or touch lane controls.',
  reasonWrecked: 'Armor depleted — avoid jellyfish, pufferfish, and mines; grab peptides.',
  lbConnectHint:
    'Connect a wallet to save your run stats, earn the ✓ verified badge, and enter the jackpot.',

  // In-run touch / HUD
  tapLeft: 'TAP LEFT',
  tapRight: 'TAP RIGHT',
  cruise: 'CRUISE',
  boost: 'BOOST',
  slow: 'SLOW',
  playHint: 'Tap left/right half to move · hold + swipe up/down to boost/slow',
  lawbsterLungs: '∞ lawbster lungs',

  // Select screen
  selectTitle: 'PICK YOUR SWIMMER',
  selectHint: 'Click models, tap chips, or use keyboard (←/→ to swap, Enter confirm).',
  confirm: 'CONFIRM',

  // Standalone extras
  presents: 'LAWBSTERS PRESENT',
  saMenuHint: 'ENTER START · C SWAP SWIMMER · H HOW TO · M SOUND',
  blurbRadbro: 'toughest armor',
  blurbClawb: 'never runs out of air',
  blurbMilady: 'fastest fins',
  loadFailed: 'LOAD FAILED',
  reload: 'RELOAD',
} as const;

export type ReefStrings = { [K in keyof typeof en]: string };

const zh: ReefStrings = {
  startRun: '开始游戏',
  startMeta: '空格 · 回车 · 1',
  swimmer: '泳手',
  pickCharacter: '选择角色 · 2',
  wallet: '钱包',
  walletConnect: '连接 · 3',
  walletManage: '管理 · 3',
  notConnected: '未连接',
  depth: '深度',
  depthMeta: '层级与速度 · 4',
  howTo: '玩法说明',
  howToMeta: '30秒上手 · 5',
  sound: '音效',
  soundOn: '开',
  soundOff: '关',
  kbdHint: '键盘：1 开始 · 2 泳手 · 3 钱包 · 4 深度 · 5 玩法 · M 音效 · X 退出',
  exitDesktop: '← 返回桌面',
  menuTagline: '无尽畅游 · 躲避珊瑚 · 打捞垃圾',
  bestDive: '最佳纪录',
  pressAny: '按任意键 · 点按继续',

  briefTitle: '任务简报',
  briefP1:
    '潜水员们已被招募来拯救海洋。Lawbsters 观测到海底各处的垃圾持续增多——每年新增约 330 亿磅塑料。虽然 lawbsters 一直按计划清理垃圾，但任何帮助都弥足珍贵。',
  briefP2: '目标：在氧气耗尽或撞上障碍之前，尽可能多地收集垃圾。潜水途中发现的任何宝藏都归你所有。',
  dive: '下潜 ▶',
  back: '返回',
  briefHint: '回车 · 空格 · 点按下潜',

  howtoTitle: '玩法说明',
  howtoMission: '🌊 任务',
  howtoMissionBody:
    '海洋正被垃圾淹没——每年新增约 330 亿磅塑料。下潜、躲避珊瑚礁，尽可能多地打捞垃圾。途中发现的宝藏都归你所有。',
  howtoSteer: '🕹 操作',
  howtoSteerBody:
    '三条泳道。A / D 或 ← / → 切换泳道 · W 加速 · S 减速。触屏：点按左/右半屏切换泳道，按住上下滑动控制速度。',
  howtoSurvive: '🫧 生存',
  howtoSurviveBody:
    '得分 = 存活秒数。注意两条量表：护甲和氧气。水母和河豚会削减护甲与氧气并让你变慢；水雷伤害很高。潜得越深，水越暗，礁石越凶。两侧的雕像和沉船只是景观：只有三条泳道里的东西会伤到你。',
  howtoGrab: '🧀 拾取',
  howtoGrabBody:
    '氧气瓶回满氧气 · 肽恢复护甲（两者都能解除减速）· 奶酪 = 氮气冲刺 · 垃圾 = 打捞数 +1 并少量回复护甲 · 金币 = +1 金币并补一口氧气。',
  howtoJackpot: '⚓ 海底宝藏',
  howtoJackpotBody:
    '支付 CULT 入场费获得一次指定种子的挑战。打破生存纪录，整个宝箱将直接链上打入你的钱包。免费游玩仅供娱乐和统计——与宝藏无关。',
  ok: '好的',

  deviceBestDive: '最佳潜水',
  deviceSurvivalBar: '生存纪录',
  devicePot: '宝箱',
  deviceDiver: '潜水员',
  deviceSatchel: '背包',
  deviceSatchelHint: '来自已保存跑动的拾取统计',
  deviceSatchelConnect: '连接钱包以填充背包。',
  deviceSatchelEmpty: '还没有收获——下潜吧！',
  satchelJunkLog: '垃圾图鉴',
  satchelLogHint: '悬停查看图鉴',
  satchelLogHintTouch: '点按查看图鉴',
  satchelUndiscovered: '未发现',
  satchelHauled: '已打捞',
  cardTitleFree: '潜水报告',
  cardTitleTreasure: '寻宝潜水',
  cardDiver: '潜水员',
  cardDate: '日期',
  cardDiveTime: '潜水时长',
  cardHaul: '打捞清单',
  cardNoHaul: '本次潜水没有收获。',
  cardVerified: '已验证',
  cardGuest: '访客潜水员',
  cardSave: '保存卡片',
  cardShare: '分享',
  cardSaved: '已保存！',
  deviceLongestDive: '最长潜水',
  deviceRuns: '次数',
  deviceSurfaceTime: '水面时间',
  deviceBarOpen: '开放',

  gameOver: '游戏结束',
  depthReached: '到达深度',
  run: '存活',
  best: '最佳',
  dived: '潜水',
  trashHauled: '件垃圾打捞',
  thankYou: '本次共收集 {n} 件垃圾——感谢您的服务。',
  coins: '金币',
  retry: '再试一次',
  mainMenu: '主菜单',
  swimAgain: '再游一次？',
  reasonOxygen: '氧气耗尽——Milady/Radbro 需要靠氧气瓶续命。Clawb 在水下永远不会缺氧。',
  reasonCrush: '撞上珊瑚——用 A/D 或触屏切换泳道。',
  reasonWrecked: '护甲耗尽——躲开水母、河豚和水雷；拾取肽来恢复。',
  lbConnectHint: '连接钱包即可保存跑动数据、获得 ✓ 验证徽章并参加奖池。',

  tapLeft: '点左侧',
  tapRight: '点右侧',
  cruise: '巡游',
  boost: '加速',
  slow: '减速',
  playHint: '点按左/右半屏移动 · 按住上下滑动加速/减速',
  lawbsterLungs: '∞ 龙虾之肺',

  selectTitle: '选择你的泳手',
  selectHint: '点击模型、点按标签，或用键盘（←/→ 切换，回车确认）。',
  confirm: '确认',

  presents: 'LAWBSTERS 出品',
  saMenuHint: '回车开始 · C 换泳手 · H 玩法 · M 音效',
  blurbRadbro: '护甲最强',
  blurbClawb: '永不缺氧',
  blurbMilady: '游速最快',
  loadFailed: '加载失败',
  reload: '重新加载',
};

export const REEF_STRINGS: Record<ReefLang, ReefStrings> = { en, zh };

/**
 * Dive-log item names — keyed by satchel item key (supply kinds + canonical trash
 * variant ids from `arcadeTrashVariants.ts`). Separate from ReefStrings because that
 * type maps every key to a plain string.
 */
export const SATCHEL_ITEM_NAMES: Record<ReefLang, Record<string, string>> = {
  en: {
    trash: 'Trash Hauled',
    coin: 'Coins',
    cheese: 'Cheese',
    peptides: 'Peptides',
    trash1: 'Mystery Tin',
    trash2: 'Rusty Drum',
    cube: 'Junk Cube',
    cigpack: 'Soggy Cig Pack',
    energycan: 'Energy Can',
    vape: 'Dead Vape',
    bag: 'Trash Bag',
    crt: 'Sunken CRT',
  },
  zh: {
    trash: '垃圾总量',
    coin: '金币',
    cheese: '奶酪',
    peptides: '肽',
    trash1: '神秘罐头',
    trash2: '锈蚀油桶',
    cube: '垃圾方块',
    cigpack: '湿透烟盒',
    energycan: '能量饮料罐',
    vape: '废弃电子烟',
    bag: '垃圾袋',
    crt: '沉没老电视',
  },
};
