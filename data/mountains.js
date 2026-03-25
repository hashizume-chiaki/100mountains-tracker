// data/mountains.js
// 深田久弥「日本百名山」(1964) の全100山
// 標高: 国土地理院基準
// 難易度: 国土交通省グレーディング（最易ルート基準）
//   A = 初心者向け（体力度1相当）
//   B = 一般向け（体力度2〜3相当）
//   C = 経験者向け（体力度3〜4相当）
//   D = 上級者向け（体力度4〜5相当）
//   E = 高度な技術・体力が必要
// 都道府県: 複数県境の場合は最も北にある都道府県を採用

const MOUNTAINS = [
  // ─── 北海道 ───────────────────────────────────────────────────────
  { id:  1, name: "利尻山",               elevation: 1721, prefecture: "北海道",   difficulty: "B" },
  { id:  2, name: "羅臼岳",               elevation: 1661, prefecture: "北海道",   difficulty: "C" },
  { id:  3, name: "斜里岳",               elevation: 1547, prefecture: "北海道",   difficulty: "C" },
  { id:  4, name: "阿寒岳（雌阿寒岳）",   elevation: 1499, prefecture: "北海道",   difficulty: "B" },
  { id:  5, name: "大雪山（旭岳）",        elevation: 2291, prefecture: "北海道",   difficulty: "B" },
  { id:  6, name: "トムラウシ山",          elevation: 2141, prefecture: "北海道",   difficulty: "C" },
  { id:  7, name: "十勝岳",               elevation: 2077, prefecture: "北海道",   difficulty: "B" },
  { id:  8, name: "幌尻岳",               elevation: 2052, prefecture: "北海道",   difficulty: "D" },
  { id:  9, name: "後方羊蹄山",           elevation: 1898, prefecture: "北海道",   difficulty: "B" },
  // ─── 東北 ────────────────────────────────────────────────────────
  { id: 10, name: "岩木山",               elevation: 1625, prefecture: "青森県",   difficulty: "B" },
  { id: 11, name: "八甲田山（大岳）",      elevation: 1585, prefecture: "青森県",   difficulty: "B" },
  { id: 12, name: "八幡平",               elevation: 1613, prefecture: "岩手県",   difficulty: "A" },
  { id: 13, name: "岩手山",               elevation: 2038, prefecture: "岩手県",   difficulty: "B" },
  { id: 14, name: "早池峰山",             elevation: 1917, prefecture: "岩手県",   difficulty: "C" },
  { id: 15, name: "鳥海山",               elevation: 2236, prefecture: "秋田県",   difficulty: "C" },
  { id: 16, name: "月山",                 elevation: 1984, prefecture: "山形県",   difficulty: "A" },
  { id: 17, name: "朝日岳（大朝日岳）",   elevation: 1871, prefecture: "山形県",   difficulty: "B" },
  { id: 18, name: "蔵王山（熊野岳）",      elevation: 1841, prefecture: "宮城県",   difficulty: "B" },
  { id: 19, name: "飯豊山",               elevation: 2105, prefecture: "山形県",   difficulty: "C" },
  { id: 20, name: "吾妻山（西吾妻山）",   elevation: 2035, prefecture: "山形県",   difficulty: "B" },
  { id: 21, name: "安達太良山",           elevation: 1700, prefecture: "福島県",   difficulty: "B" },
  { id: 22, name: "磐梯山",               elevation: 1816, prefecture: "福島県",   difficulty: "B" },
  { id: 23, name: "会津駒ヶ岳",           elevation: 2133, prefecture: "福島県",   difficulty: "B" },
  // ─── 関東・越後 ──────────────────────────────────────────────────
  { id: 24, name: "那須岳（茶臼岳）",      elevation: 1915, prefecture: "栃木県",   difficulty: "A" },
  { id: 25, name: "越後駒ヶ岳",           elevation: 2003, prefecture: "新潟県",   difficulty: "B" },
  { id: 26, name: "平ヶ岳",               elevation: 2141, prefecture: "新潟県",   difficulty: "D" },
  { id: 27, name: "巻機山",               elevation: 1967, prefecture: "新潟県",   difficulty: "B" },
  { id: 28, name: "燧ヶ岳",               elevation: 2356, prefecture: "福島県",   difficulty: "B" },
  { id: 29, name: "至仏山",               elevation: 2228, prefecture: "群馬県",   difficulty: "B" },
  { id: 30, name: "谷川岳",               elevation: 1977, prefecture: "新潟県",   difficulty: "B" },
  { id: 31, name: "雨飾山",               elevation: 1963, prefecture: "新潟県",   difficulty: "B" },
  { id: 32, name: "苗場山",               elevation: 2145, prefecture: "新潟県",   difficulty: "B" },
  { id: 33, name: "妙高山",               elevation: 2454, prefecture: "新潟県",   difficulty: "B" },
  { id: 34, name: "火打山",               elevation: 2462, prefecture: "新潟県",   difficulty: "B" },
  { id: 35, name: "高妻山",               elevation: 2353, prefecture: "新潟県",   difficulty: "D" },
  { id: 36, name: "男体山",               elevation: 2486, prefecture: "栃木県",   difficulty: "B" },
  { id: 37, name: "日光白根山",           elevation: 2578, prefecture: "栃木県",   difficulty: "B" },
  { id: 38, name: "皇海山",               elevation: 2144, prefecture: "栃木県",   difficulty: "C" },
  { id: 39, name: "武尊山",               elevation: 2158, prefecture: "群馬県",   difficulty: "B" },
  { id: 40, name: "赤城山（黒檜山）",      elevation: 1828, prefecture: "群馬県",   difficulty: "B" },
  { id: 41, name: "草津白根山（本白根山）",elevation: 2171, prefecture: "群馬県",   difficulty: "A" },
  { id: 42, name: "四阿山",               elevation: 2354, prefecture: "群馬県",   difficulty: "B" },
  { id: 43, name: "浅間山（前掛山）",      elevation: 2568, prefecture: "群馬県",   difficulty: "B" },
  { id: 44, name: "筑波山",               elevation:  877, prefecture: "茨城県",   difficulty: "A" },
  // ─── 北アルプス ──────────────────────────────────────────────────
  { id: 45, name: "白馬岳",               elevation: 2932, prefecture: "富山県",   difficulty: "B" },
  { id: 46, name: "五竜岳",               elevation: 2814, prefecture: "富山県",   difficulty: "C" },
  { id: 47, name: "鹿島槍ヶ岳",           elevation: 2889, prefecture: "富山県",   difficulty: "B" },
  { id: 48, name: "剱岳",                 elevation: 2999, prefecture: "富山県",   difficulty: "E" },
  { id: 49, name: "立山（大汝山）",        elevation: 3015, prefecture: "富山県",   difficulty: "B" },
  { id: 50, name: "薬師岳",               elevation: 2926, prefecture: "富山県",   difficulty: "B" },
  { id: 51, name: "黒部五郎岳",           elevation: 2840, prefecture: "富山県",   difficulty: "B" },
  { id: 52, name: "水晶岳（黒岳）",        elevation: 2986, prefecture: "富山県",   difficulty: "C" },
  { id: 53, name: "鷲羽岳",               elevation: 2924, prefecture: "富山県",   difficulty: "C" },
  { id: 54, name: "槍ヶ岳",               elevation: 3180, prefecture: "長野県",   difficulty: "C" },
  { id: 55, name: "穂高岳（奥穂高岳）",   elevation: 3190, prefecture: "長野県",   difficulty: "C" },
  { id: 56, name: "常念岳",               elevation: 2857, prefecture: "長野県",   difficulty: "B" },
  { id: 57, name: "笠ヶ岳",               elevation: 2898, prefecture: "岐阜県",   difficulty: "B" },
  { id: 58, name: "焼岳",                 elevation: 2455, prefecture: "長野県",   difficulty: "B" },
  { id: 59, name: "乗鞍岳",               elevation: 3026, prefecture: "長野県",   difficulty: "B" },
  // ─── 御嶽・長野中部 ──────────────────────────────────────────────
  { id: 60, name: "御嶽山",               elevation: 3067, prefecture: "長野県",   difficulty: "B" },
  { id: 61, name: "美ヶ原（王ヶ頭）",      elevation: 2034, prefecture: "長野県",   difficulty: "A" },
  { id: 62, name: "霧ヶ峰（車山）",        elevation: 1925, prefecture: "長野県",   difficulty: "A" },
  { id: 63, name: "蓼科山",               elevation: 2531, prefecture: "長野県",   difficulty: "B" },
  { id: 64, name: "八ヶ岳（赤岳）",        elevation: 2899, prefecture: "長野県",   difficulty: "C" },
  // ─── 関東・奥秩父 ────────────────────────────────────────────────
  { id: 65, name: "両神山",               elevation: 1723, prefecture: "埼玉県",   difficulty: "C" },
  { id: 66, name: "雲取山",               elevation: 2017, prefecture: "埼玉県",   difficulty: "B" },
  { id: 67, name: "甲武信ヶ岳",           elevation: 2475, prefecture: "埼玉県",   difficulty: "B" },
  { id: 68, name: "金峰山",               elevation: 2599, prefecture: "長野県",   difficulty: "A" },
  { id: 69, name: "瑞牆山",               elevation: 2230, prefecture: "山梨県",   difficulty: "C" },
  { id: 70, name: "大菩薩嶺",             elevation: 2057, prefecture: "山梨県",   difficulty: "A" },
  { id: 71, name: "丹沢山",               elevation: 1567, prefecture: "神奈川県", difficulty: "B" },
  // ─── 富士・伊豆 ──────────────────────────────────────────────────
  { id: 72, name: "富士山",               elevation: 3776, prefecture: "山梨県",   difficulty: "B" },
  { id: 73, name: "天城山（万三郎岳）",   elevation: 1406, prefecture: "静岡県",   difficulty: "B" },
  // ─── 中央アルプス ────────────────────────────────────────────────
  { id: 74, name: "木曽駒ヶ岳",           elevation: 2956, prefecture: "長野県",   difficulty: "A" },
  { id: 75, name: "空木岳",               elevation: 2864, prefecture: "長野県",   difficulty: "C" },
  { id: 76, name: "恵那山",               elevation: 2191, prefecture: "長野県",   difficulty: "B" },
  // ─── 南アルプス ──────────────────────────────────────────────────
  { id: 77, name: "甲斐駒ヶ岳",           elevation: 2967, prefecture: "山梨県",   difficulty: "C" },
  { id: 78, name: "仙丈ヶ岳",             elevation: 3033, prefecture: "山梨県",   difficulty: "C" },
  { id: 79, name: "鳳凰山（観音岳）",      elevation: 2841, prefecture: "山梨県",   difficulty: "B" },
  { id: 80, name: "北岳",                 elevation: 3193, prefecture: "山梨県",   difficulty: "B" },
  { id: 81, name: "間ノ岳",               elevation: 3190, prefecture: "山梨県",   difficulty: "C" },
  { id: 82, name: "塩見岳",               elevation: 3052, prefecture: "長野県",   difficulty: "C" },
  { id: 83, name: "荒川岳（悪沢岳）",      elevation: 3141, prefecture: "長野県",   difficulty: "D" },
  { id: 84, name: "赤石岳",               elevation: 3121, prefecture: "長野県",   difficulty: "D" },
  { id: 85, name: "聖岳",                 elevation: 3013, prefecture: "長野県",   difficulty: "C" },
  { id: 86, name: "光岳",                 elevation: 2592, prefecture: "長野県",   difficulty: "B" },
  // ─── 白山・北陸 ──────────────────────────────────────────────────
  { id: 87, name: "白山（御前峰）",        elevation: 2702, prefecture: "石川県",   difficulty: "C" },
  { id: 88, name: "荒島岳",               elevation: 1523, prefecture: "福井県",   difficulty: "B" },
  // ─── 近畿 ────────────────────────────────────────────────────────
  { id: 89, name: "伊吹山",               elevation: 1377, prefecture: "滋賀県",   difficulty: "A" },
  { id: 90, name: "大台ヶ原山（日出ヶ岳）",elevation: 1695, prefecture: "三重県",   difficulty: "A" },
  { id: 91, name: "大峰山（八経ヶ岳）",   elevation: 1915, prefecture: "奈良県",   difficulty: "B" },
  // ─── 中国・四国 ──────────────────────────────────────────────────
  { id: 92, name: "大山（弥山）",          elevation: 1729, prefecture: "鳥取県",   difficulty: "B" },
  { id: 93, name: "剣山",                 elevation: 1955, prefecture: "徳島県",   difficulty: "A" },
  { id: 94, name: "石鎚山",               elevation: 1982, prefecture: "愛媛県",   difficulty: "B" },
  // ─── 九州 ────────────────────────────────────────────────────────
  { id: 95, name: "九重山（中岳）",        elevation: 1791, prefecture: "大分県",   difficulty: "B" },
  { id: 96, name: "祖母山",               elevation: 1756, prefecture: "大分県",   difficulty: "B" },
  { id: 97, name: "阿蘇山（高岳）",        elevation: 1592, prefecture: "熊本県",   difficulty: "B" },
  { id: 98, name: "霧島山（韓国岳）",      elevation: 1700, prefecture: "宮崎県",   difficulty: "B" },
  { id: 99, name: "開聞岳",               elevation:  924, prefecture: "鹿児島県", difficulty: "B" },
  { id: 100, name: "宮之浦岳",            elevation: 1936, prefecture: "鹿児島県", difficulty: "C" },
];
