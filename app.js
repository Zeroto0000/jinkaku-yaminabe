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
  updateDoc,
  collection,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
const topicInput = document.getElementById("topicInput");

const selecting = document.getElementById("selecting");
const selectingTopicText = document.getElementById("selectingTopicText");
const handArea = document.getElementById("handArea");
const submitCardsBtn = document.getElementById("submitCardsBtn");
const selectingMessage = document.getElementById("selectingMessage");
const myResultArea = document.getElementById("myResultArea");
const myResultTitle = document.getElementById("myResultTitle");
const myResultText = document.getElementById("myResultText");

const state = {
  roomId: "",
  playerId: "",
  playerName: "",
  isHost: false,
  unsubscribePlayers: null,
  unsubscribeRoom: null,

  selectedCardIds: [],
  currentHand: [],
  currentTopic: ""
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
}

function showWaiting() {
  lobby.classList.add("hidden");
  waiting.classList.remove("hidden");
  selecting.classList.add("hidden");
}

function showSelecting() {
  lobby.classList.add("hidden");
  waiting.classList.add("hidden");
  selecting.classList.remove("hidden");
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

    snapshot.forEach((docSnap) => {
      const player = docSnap.data();

      const li = document.createElement("li");
      li.textContent = player.isHost
        ? `${player.name}（ホスト）`
        : player.name;

      playerList.appendChild(li);
    });
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

    if (room.phase === "selecting") {
  state.currentTopic = room.topic;
  startSelecting(room.topic);
}
  });
}

function enterRoom() {
  roomIdText.textContent = state.roomId;
  hostArea.classList.toggle("hidden", !state.isHost);

  showWaiting();
  watchPlayers();
  watchRoom();
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
  const topic = topicInput.value.trim();

  if (!topic) {
    setWaitingMessage("お題を入れて");
    return;
  }

  try {
    await updateDoc(doc(db, "rooms", state.roomId), {
      phase: "selecting",
      topic,
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
