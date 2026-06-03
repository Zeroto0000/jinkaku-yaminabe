// app.js

import {
  drawHand,
  getCardById,
  createChimera
} from "./cards.js";

import { db } from "./firebase.js";

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const DEFAULT_TOPICS = [
  "恋愛失敗しそうな人",
  "SNSで炎上しそうな人",
  "上司にしたくない人",
  "友達にしたら楽しそうな人",
  "なんだかんだモテそうな人",
  "実は一番闇が深そうな人",
  "相談したら余計ややこしくしそうな人",
  "グループ作業で揉めそうな人",
  "ラスボスになりそうな人",
  "好きな人の前でバグりそうな人"
];

function getRandomTopic() {
  return DEFAULT_TOPICS[Math.floor(Math.random() * DEFAULT_TOPICS.length)];
}

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

const lobby = document.getElementById("lobby");
const waiting = document.getElementById("waiting");

const nameInput = document.getElementById("nameInput");
const roomIdInput = document.getElementById("roomIdInput");

const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const copyRoomIdBtn = document.getElementById("copyRoomIdBtn");
const startGameBtn = document.getElementById("startGameBtn");

const lobbyMessage = document.getElementById("lobbyMessage");
const waitingMessage = document.getElementById("waitingMessage");

const roomIdText = document.getElementById("roomIdText");
const playerList = document.getElementById("playerList");
const hostArea = document.getElementById("hostArea");

const selecting = document.getElementById("selecting");
const selectingTopicText = document.getElementById("selectingTopicText");
const handArea = document.getElementById("handArea");
const submitCardsBtn = document.getElementById("submitCardsBtn");
const selectingMessage = document.getElementById("selectingMessage");
const myResultArea = document.getElementById("myResultArea");
const myResultTitle = document.getElementById("myResultTitle");
const myResultText = document.getElementById("myResultText");

const revealing = document.getElementById("revealing");
const revealingTopicText = document.getElementById("revealingTopicText");
const anonymousResults = document.getElementById("anonymousResults");
const revealingMessage = document.getElementById("revealingMessage");

const voteArea = document.getElementById("voteArea");

const result = document.getElementById("result");
const resultTopicText = document.getElementById("resultTopicText");
const resultArea = document.getElementById("resultArea");
const resultMessage = document.getElementById("resultMessage");

const playAgainBtn = document.getElementById("playAgainBtn");

const topicSubmit = document.getElementById("topicSubmit");
const myTopicInput = document.getElementById("myTopicInput");
const submitTopicBtn = document.getElementById("submitTopicBtn");
const topicSubmitMessage = document.getElementById("topicSubmitMessage");

const state = {
  roomId: "",
  playerId: "",
  playerName: "",
  isHost: false,
  unsubscribePlayers: null,
  unsubscribeRoom: null,
  unsubscribeSubmissions: null,
  unsubscribeVotes: null,
  unsubscribeTopics: null,

  selectedCardIds: [],
  currentHand: [],
  currentTopic: "",
  currentPhase: "waiting",

  playerCount: 0,
  submissions: [],
  votes: [],
  topics: [],

  roomTopics: [],
topicIndex: 0,
currentTopicId: ""
};

function makeRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function makePlayerId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "player_" + Math.random().toString(36).slice(2, 12);
}

function showLobby() {
  lobby.classList.remove("hidden");
  waiting.classList.add("hidden");
  selecting.classList.add("hidden");
  revealing.classList.add("hidden");
  topicSubmit.classList.add("hidden");
  result.classList.add("hidden");
}

function showWaiting() {
  lobby.classList.add("hidden");
  waiting.classList.remove("hidden");
  selecting.classList.add("hidden");
  revealing.classList.add("hidden");
  topicSubmit.classList.add("hidden");
  result.classList.add("hidden");
}

function showSelecting() {
  lobby.classList.add("hidden");
  waiting.classList.add("hidden");
  selecting.classList.remove("hidden");
  revealing.classList.add("hidden");
  topicSubmit.classList.add("hidden");
  result.classList.add("hidden");
}

function showRevealing() {
  lobby.classList.add("hidden");
  waiting.classList.add("hidden");
  selecting.classList.add("hidden");
  revealing.classList.remove("hidden");
  result.classList.add("hidden");
  topicSubmit.classList.add("hidden");
}

function showResult() {
  lobby.classList.add("hidden");
  waiting.classList.add("hidden");
  selecting.classList.add("hidden");
  revealing.classList.add("hidden");
  result.classList.remove("hidden");
  topicSubmit.classList.add("hidden");
}

function showTopicSubmit() {
  lobby.classList.add("hidden");
  waiting.classList.add("hidden");
  topicSubmit.classList.remove("hidden");
  selecting.classList.add("hidden");
  revealing.classList.add("hidden");
  result.classList.add("hidden");
}

function setLobbyMessage(text) {
  lobbyMessage.textContent = text;
}

function setWaitingMessage(text) {
  waitingMessage.textContent = text;
}

function saveLocalState() {
  localStorage.setItem("jinkaku_roomId", state.roomId);
  localStorage.setItem("jinkaku_playerId", state.playerId);
  localStorage.setItem("jinkaku_playerName", state.playerName);
  localStorage.setItem("jinkaku_isHost", String(state.isHost));
}

function loadLocalState() {
  state.roomId = localStorage.getItem("jinkaku_roomId") || "";
  state.playerId = localStorage.getItem("jinkaku_playerId") || "";
  state.playerName = localStorage.getItem("jinkaku_playerName") || "";
  state.isHost = localStorage.getItem("jinkaku_isHost") === "true";
}

function watchPlayers() {
  if (state.unsubscribePlayers) {
    state.unsubscribePlayers();
  }

  const playersRef = collection(db, "rooms", state.roomId, "players");

  state.unsubscribePlayers = onSnapshot(playersRef, (snapshot) => {
    playerList.innerHTML = "";

    state.playerCount = snapshot.size;

    snapshot.forEach((docSnap) => {
      const player = docSnap.data();

      const li = document.createElement("li");
      li.textContent = player.isHost
        ? `${player.name}（ホスト）`
        : player.name;

      playerList.appendChild(li);
    });

    checkAllSubmitted();
  });
}

function watchRoom() {
  if (state.unsubscribeRoom) {
    state.unsubscribeRoom();
  }

  const roomRef = doc(db, "rooms", state.roomId);

  state.unsubscribeRoom = onSnapshot(roomRef, (docSnap) => {
  if (!docSnap.exists()) {
    setWaitingMessage("部屋が見つからない");
    return;
  }

  const room = docSnap.data();

state.currentPhase = room.phase;
state.currentTopic = room.topic || "";
state.roomTopics = room.topics || [];
state.topicIndex = room.topicIndex || 0;
state.currentTopicId = room.currentTopicId || "";

  if (room.phase === "waiting") {
    showWaiting();
  }

  if (room.phase === "selecting") {
    startSelecting(room.topic);
  }

  if (room.phase === "revealing") {
    startRevealing(room.topic);
  }

    if (room.phase === "voting") {
  showRevealing();
  revealingTopicText.textContent = "回答完了";
  anonymousResults.innerHTML = "";
  voteArea.innerHTML = "";
  revealingMessage.textContent = "全お題の回答が終わった。次は投票パートを作る。";
}


    
    if (room.phase === "result") {
  startResult(room.topic);
}

    if (room.phase === "topicSubmit") {
  showTopicSubmit();
}
});
}

function enterRoom() {
  roomIdText.textContent = state.roomId;
  hostArea.classList.toggle("hidden", !state.isHost);

  showWaiting();
  watchPlayers();
  watchRoom();
  watchSubmissions();
  watchVotes();
  watchTopics();
}
createRoomBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();

  if (!name) {
    setLobbyMessage("名前を入れて");
    return;
  }

  createRoomBtn.disabled = true;
  setLobbyMessage("部屋を作成中...");

  try {
    const roomId = makeRoomId();
    const playerId = makePlayerId();

    state.roomId = roomId;
    state.playerId = playerId;
    state.playerName = name;
    state.isHost = true;

    await setDoc(doc(db, "rooms", roomId), {
      roomId,
      hostId: playerId,
      phase: "waiting",
      topic: "",
      createdAt: serverTimestamp()
    });

    await setDoc(doc(db, "rooms", roomId, "players", playerId), {
      playerId,
      name,
      isHost: true,
      joinedAt: serverTimestamp()
    });

    saveLocalState();
    setLobbyMessage("");
    enterRoom();
  } catch (error) {
    console.error(error);
    setLobbyMessage("部屋作成に失敗した");
  } finally {
    createRoomBtn.disabled = false;
  }
});

joinRoomBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const roomId = roomIdInput.value.trim().toUpperCase();

  if (!name || !roomId) {
    setLobbyMessage("名前と部屋IDを入れて");
    return;
  }

  joinRoomBtn.disabled = true;
  setLobbyMessage("参加中...");

  try {
    const roomRef = doc(db, "rooms", roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      setLobbyMessage("その部屋IDは見つからない");
      return;
    }

    const playerId = makePlayerId();

    state.roomId = roomId;
    state.playerId = playerId;
    state.playerName = name;
    state.isHost = false;

    await setDoc(doc(db, "rooms", roomId, "players", playerId), {
      playerId,
      name,
      isHost: false,
      joinedAt: serverTimestamp()
    });

    saveLocalState();
    setLobbyMessage("");
    enterRoom();
  } catch (error) {
    console.error(error);
    setLobbyMessage("参加に失敗した");
  } finally {
    joinRoomBtn.disabled = false;
  }
});

copyRoomIdBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(state.roomId);
    setWaitingMessage("部屋IDをコピーした");
  } catch (error) {
    console.error(error);
    setWaitingMessage("コピーできなかった");
  }
});

startGameBtn.addEventListener("click", async () => {
  try {
    await updateDoc(doc(db, "rooms", state.roomId), {
      phase: "topicSubmit",
      topic: "",
      startedAt: serverTimestamp()
    });

    setWaitingMessage("ゲームを開始した");
  } catch (error) {
    console.error(error);
    setWaitingMessage("ゲーム開始に失敗した");
  }
});

loadLocalState();

if (state.roomId && state.playerId) {
  enterRoom();
} else {
  showLobby();
}

function startSelecting(topic) {
  state.selectedCardIds = [];
  state.currentHand = drawHand(5);

  selectingTopicText.textContent = topic;
  handArea.innerHTML = "";
  myResultArea.classList.add("hidden");
  selectingMessage.textContent = "";
  submitCardsBtn.disabled = false;

  state.currentHand.forEach((card) => {
    const button = document.createElement("button");
    button.className = "card-button";
    button.dataset.cardId = card.id;

    button.innerHTML = `
      <span class="type">${card.type}</span>
      <span class="name">${card.name}</span>
      <span class="text">${card.text}</span>
    `;

    button.addEventListener("click", () => {
      toggleCard(card.id, button);
    });

    handArea.appendChild(button);
  });

  showSelecting();
}

function toggleCard(cardId, button) {
  const alreadySelected = state.selectedCardIds.includes(cardId);

  if (alreadySelected) {
    state.selectedCardIds = state.selectedCardIds.filter(id => id !== cardId);
    button.classList.remove("selected");
    selectingMessage.textContent = "";
    return;
  }

  if (state.selectedCardIds.length >= 3) {
    selectingMessage.textContent = "選べるのは3枚まで";
    return;
  }

  state.selectedCardIds.push(cardId);
  button.classList.add("selected");
  selectingMessage.textContent = `${state.selectedCardIds.length}/3枚選択中`;
}

submitCardsBtn.addEventListener("click", async () => {
  if (state.selectedCardIds.length !== 3) {
    selectingMessage.textContent = "3枚選んで";
    return;
  }

  const selectedCards = state.selectedCardIds.map(id => getCardById(id));
  const result = createChimera(selectedCards, state.currentTopic);

  const submissionId = `${state.currentTopicId}_${state.playerId}`;

await setDoc(doc(db, "rooms", state.roomId, "submissions", submissionId), {
  topicId: state.currentTopicId,
  topicText: state.currentTopic,
  playerId: state.playerId,
  playerName: state.playerName,
  cardIds: state.selectedCardIds,
  title: result.title,
  text: result.text,
  createdAt: serverTimestamp()
});

  myResultTitle.textContent = `【${result.title}】`;
  myResultText.textContent = result.text;
  myResultArea.classList.remove("hidden");

  selectingMessage.textContent = "提出した。全員の提出を待とう。";
  submitCardsBtn.disabled = true;
});

function watchSubmissions() {
  if (state.unsubscribeSubmissions) {
    state.unsubscribeSubmissions();
  }

  const submissionsRef = collection(db, "rooms", state.roomId, "submissions");

  state.unsubscribeSubmissions = onSnapshot(submissionsRef, (snapshot) => {
    state.submissions = [];

    snapshot.forEach((docSnap) => {
      state.submissions.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    if (state.currentPhase === "selecting") {
  const currentSubmissions = getCurrentTopicSubmissions();

  selectingMessage.textContent =
    `提出済み：${currentSubmissions.length}/${state.playerCount}`;
}

    checkAllSubmitted();

    if (state.currentPhase === "revealing") {
      renderAnonymousResults();
    }
  });
}

async function checkAllSubmitted() {
  if (!state.isHost) return;
  if (state.currentPhase !== "selecting") return;
  if (state.playerCount <= 0) return;
  if (state.submissions.length < state.playerCount) return;

  try {
    await updateDoc(doc(db, "rooms", state.roomId), {
      phase: "revealing"
    });
  } catch (error) {
    console.error(error);
  }
}

function startRevealing(topic) {
  revealingTopicText.textContent = topic;
  revealingMessage.textContent = "誰が作ったかはまだ秘密。";
  renderAnonymousResults();
  showRevealing();
}

function renderAnonymousResults() {
  anonymousResults.innerHTML = "";
  voteArea.innerHTML = "";

  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const sortedSubmissions = [...state.submissions].sort((a, b) => {
    return a.playerId.localeCompare(b.playerId);
  });

  sortedSubmissions.forEach((submission, index) => {
    const label = labels[index];

    const div = document.createElement("div");
    div.className = "anonymous-card";

    div.innerHTML = `
      <span class="label">${label}</span>
      <h3>【${submission.title}】</h3>
      <p>${submission.text}</p>
    `;

    anonymousResults.appendChild(div);

    const voteButton = document.createElement("button");
voteButton.className = "vote-button";
voteButton.textContent = `${label} に投票`;

const isMine = submission.playerId === state.playerId;
const canVoteSelf = state.playerCount <= 2;

if (isMine && !canVoteSelf) {
  voteButton.textContent = `${label} は自分の作品`;
  voteButton.disabled = true;
} else {
  voteButton.addEventListener("click", () => {
    submitVote(label, submission.playerId);
  });
}

voteArea.appendChild(voteButton);
  });

  const myVote = state.votes.find(vote => vote.playerId === state.playerId);
  if (myVote) {
    revealingMessage.textContent = `投票済み：${myVote.label}`;
    [...voteArea.children].forEach(button => {
      button.disabled = true;
      if (button.textContent.startsWith(myVote.label)) {
        button.classList.add("voted");
      }
    });
  }
}

function watchVotes() {
  if (state.unsubscribeVotes) {
    state.unsubscribeVotes();
  }

  const votesRef = collection(db, "rooms", state.roomId, "votes");

  state.unsubscribeVotes = onSnapshot(votesRef, (snapshot) => {
    state.votes = [];

    snapshot.forEach((docSnap) => {
      state.votes.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    if (state.currentPhase === "revealing") {
      revealingMessage.textContent =
        `投票済み：${state.votes.length}/${state.playerCount}`;
    }

    checkAllVoted();

    if (state.currentPhase === "result") {
      renderResult();
    }
  });
}

async function checkAllVoted() {
  if (!state.isHost) return;
  if (state.currentPhase !== "revealing") return;
  if (state.playerCount <= 0) return;
  if (state.votes.length < state.playerCount) return;

  try {
    await updateDoc(doc(db, "rooms", state.roomId), {
      phase: "result"
    });
  } catch (error) {
    console.error(error);
  }
}

async function submitVote(label, targetPlayerId) {
  try {
    await setDoc(doc(db, "rooms", state.roomId, "votes", state.playerId), {
      playerId: state.playerId,
      playerName: state.playerName,
      label,
      targetPlayerId,
      createdAt: serverTimestamp()
    });

    revealingMessage.textContent = `投票した：${label}`;
  } catch (error) {
    console.error(error);
    revealingMessage.textContent = "投票に失敗した";
  }
}

function startResult(topic) {
  resultTopicText.textContent = topic;
  resultMessage.textContent = "作者公開。";
  playAgainBtn.classList.toggle("hidden", !state.isHost);
  renderResult();
  showResult();
}

function renderResult() {
  resultArea.innerHTML = "";

  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const sortedSubmissions = [...state.submissions].sort((a, b) => {
    return a.playerId.localeCompare(b.playerId);
  });

  const voteCounts = {};

  sortedSubmissions.forEach((submission, index) => {
    const label = labels[index];

    voteCounts[submission.playerId] = {
      label,
      count: 0,
      submission
    };
  });

  state.votes.forEach((vote) => {
    if (voteCounts[vote.targetPlayerId]) {
      voteCounts[vote.targetPlayerId].count++;
    }
  });

  const ranking = Object.values(voteCounts).sort((a, b) => {
    return b.count - a.count;
  });

  ranking.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = index === 0 ? "result-rank winner" : "result-rank";

    div.innerHTML = `
      <span class="rank">${index + 1}位 / ${item.count}票</span>
      <h3>${item.label}：【${item.submission.title}】</h3>
      <p>${item.submission.text}</p>
      <p><strong>作者：${item.submission.playerName}</strong></p>
    `;

    resultArea.appendChild(div);
  });
}

playAgainBtn.addEventListener("click", async () => {
  if (!state.isHost) {
    resultMessage.textContent = "もう一回遊ぶ操作はホストだけできる";
    return;
  }

  try {
    resultMessage.textContent = "次のゲームを準備中...";

    await clearCollection("submissions");
    await clearCollection("votes");
    await clearCollection("topics");

    await updateDoc(doc(db, "rooms", state.roomId), {
      phase: "waiting",
      topic: "",
      topics: [],
      topicIndex: 0,
      currentTopicId: "",
      voteIndex: 0,
      restartedAt: serverTimestamp()
    });

    resultMessage.textContent = "";
  } catch (error) {
    console.error(error);
    resultMessage.textContent = "準備に失敗した";
  }
});

async function clearCollection(collectionName) {
  const targetRef = collection(db, "rooms", state.roomId, collectionName);
  const snapshot = await getDocs(targetRef);

  const deletePromises = [];

  snapshot.forEach((docSnap) => {
    deletePromises.push(
      deleteDoc(doc(db, "rooms", state.roomId, collectionName, docSnap.id))
    );
  });

  await Promise.all(deletePromises);
}

submitTopicBtn.addEventListener("click", async () => {
  const topicText = myTopicInput.value.trim() || getRandomTopic();

  try {
    await setDoc(doc(db, "rooms", state.roomId, "topics", state.playerId), {
      playerId: state.playerId,
      playerName: state.playerName,
      text: topicText,
      createdAt: serverTimestamp()
    });

    topicSubmitMessage.textContent = "お題を提出した。全員の提出を待とう。";
    submitTopicBtn.disabled = true;
    myTopicInput.disabled = true;
  } catch (error) {
    console.error(error);
    topicSubmitMessage.textContent = "お題提出に失敗した";
  }
});

function watchTopics() {
  if (state.unsubscribeTopics) {
    state.unsubscribeTopics();
  }

  const topicsRef = collection(db, "rooms", state.roomId, "topics");

  state.unsubscribeTopics = onSnapshot(topicsRef, (snapshot) => {
    state.topics = [];

    snapshot.forEach((docSnap) => {
      state.topics.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    if (state.currentPhase === "topicSubmit") {
      topicSubmitMessage.textContent =
        `お題提出済み：${state.topics.length}/${state.playerCount}`;
    }

    checkAllTopicsSubmitted();
  });
}

async function checkAllTopicsSubmitted() {
  if (!state.isHost) return;
  if (state.currentPhase !== "topicSubmit") return;
  if (state.playerCount <= 0) return;
  if (state.topics.length < state.playerCount) return;

  const shuffledTopics = shuffleArray(state.topics).map((topic, index) => {
    return {
      id: `topic_${index}`,
      text: topic.text,
      authorId: topic.playerId,
      authorName: topic.playerName
    };
  });

  const firstTopic = shuffledTopics[0];

  try {
    await updateDoc(doc(db, "rooms", state.roomId), {
      phase: "selecting",
      topics: shuffledTopics,
      topicIndex: 0,
      currentTopicId: firstTopic.id,
      topic: firstTopic.text
    });
  } catch (error) {
    console.error(error);
  }
}

function getCurrentTopicSubmissions() {
  return state.submissions.filter((submission) => {
    return submission.topicId === state.currentTopicId;
  });
}
