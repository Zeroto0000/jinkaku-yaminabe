export const CARDS = [
  {
    id: "E",
    name: "E",
    type: "MBTI",
    text: "外に向かう。人との関わりの中で元気が出やすい。",
    resultText: "外に向かう。"
  },
  {
    id: "I",
    name: "I",
    type: "MBTI",
    text: "内側に向かう。ひとりで考える時間を大事にする。",
    resultText: "内側に向かう。"
  },
  {
    id: "S",
    name: "S",
    type: "MBTI",
    text: "現実を見る。具体的で分かりやすいことを重視する。",
    resultText: "現実を見る。"
  },
  {
    id: "N",
    name: "N",
    type: "MBTI",
    text: "可能性を見る。まだ見えていない意味や未来を考える。",
    resultText: "可能性を見る。"
  },
  {
    id: "T",
    name: "T",
    type: "MBTI",
    text: "理屈で判断する。正しさや筋の通り方を重視する。",
    resultText: "理屈で判断する。"
  },
  {
    id: "F",
    name: "F",
    type: "MBTI",
    text: "気持ちで判断する。人の感情や関係性を重視する。",
    resultText: "気持ちで判断する。"
  },
  {
    id: "J",
    name: "J",
    type: "MBTI",
    text: "決めてから動きたい。予定や結論があると安心する。",
    resultText: "決めてから動きたい。"
  },
  {
    id: "P",
    name: "P",
    type: "MBTI",
    text: "流れで動きたい。その場のノリや自由さを大事にする。",
    resultText: "流れで動きたい。"
  },

  {
    id: "Se",
    name: "Se",
    type: "心理機能",
    text: "今この瞬間を見てすぐ動く。勢いと現場対応に強い。",
    resultText: "今すぐ動く。"
  },
  {
    id: "Si",
    name: "Si",
    type: "心理機能",
    text: "過去の経験や慣れたやり方を大事にする。",
    resultText: "経験を信じる。"
  },
  {
    id: "Ne",
    name: "Ne",
    type: "心理機能",
    text: "色んな可能性を広げる。話があちこちに飛びやすい。",
    resultText: "発想を広げる。"
  },
  {
    id: "Ni",
    name: "Ni",
    type: "心理機能",
    text: "先の展開や裏の意味を読む。深読みしやすい。",
    resultText: "未来を読む。"
  },
  {
    id: "Te",
    name: "Te",
    type: "心理機能",
    text: "結果や効率を重視する。できていない部分を詰めやすい。",
    resultText: "結果で詰める。"
  },
  {
    id: "Ti",
    name: "Ti",
    type: "心理機能",
    text: "仕組みや理屈を細かく見る。納得できないと止まる。",
    resultText: "理屈で切る。"
  },
  {
    id: "Fe",
    name: "Fe",
    type: "心理機能",
    text: "場の空気や相手の反応を読む。人に合わせるのがうまい。",
    resultText: "空気を読む。"
  },
  {
    id: "Fi",
    name: "Fi",
    type: "心理機能",
    text: "自分の気持ちや価値観を大事にする。譲れない部分がある。",
    resultText: "自分の気持ちを守る。"
  },

  {
    id: "praise_bug",
    name: "褒められるとバグる",
    type: "事故",
    text: "褒められると急に調子に乗る。",
    resultText: "褒められると急に調子に乗る。"
  },
  {
    id: "love_iq_down",
    name: "好きな人の前だけIQが下がる",
    type: "事故",
    text: "普段は普通なのに、好きな人の前では急に挙動がおかしくなる。",
    resultText: "好きな人の前だけIQが下がる。"
  },
  {
    id: "normal_think",
    name: "自分を常識人だと思っている",
    type: "事故",
    text: "本人だけは自分をかなりまともだと思っている。",
    resultText: "自分を常識人だと思っている。"
  },
  {
    id: "last_word",
    name: "最後に余計な一言を言う",
    type: "事故",
    text: "いい感じに終わりそうな場面で、なぜか余計な一言を足す。",
    resultText: "最後に余計な一言を言う。"
  },
  {
    id: "sleepy",
    name: "寝不足",
    type: "事故",
    text: "寝不足で判断が少し雑になっている。",
    resultText: "寝不足で判断が雑になる。"
  }
];

export function getCardById(id) {
  return CARDS.find(card => card.id === id);
}

export function drawHand(count = 5) {
  const shuffled = [...CARDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function createChimera(selectedCards, topic) {
  const title = createTitle(selectedCards);

  const body = selectedCards
    .map(card => card.resultText || card.text)
    .join("\n");

  const ending = [
    `「${topic}」として見ると、かなり危ない。`,
    `本人は普通のつもりなのが一番こわい。`,
    `ハマれば魅力、ズレると事故。`,
    `悪いやつではない。たぶん。`
  ];

  return {
    title,
    text: `${body}\n${ending[Math.floor(Math.random() * ending.length)]}`
  };
}

function createTitle(cards) {
  const names = cards.map(card => card.name);

  const a = names[0] || "謎";
  const b = names[1] || "人格";

  const titles = [
    `${a}すぎる${b}`,
    `${a}の皮をかぶった${b}`,
    `${b}型${a}人間`,
    `${a}と${b}の事故物件`,
    `${a}な${b}モンスター`
  ];

  return titles[Math.floor(Math.random() * titles.length)];
}
