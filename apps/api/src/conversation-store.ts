const fs = require("node:fs");
const path = require("node:path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "conversations.json");

let conversations = {};

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2), "utf8");
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    conversations = raw ? JSON.parse(raw) : {};
  } catch {
    conversations = {};
  }
}

function persist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(conversations, null, 2), "utf8");
}

function generateConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createConversation(initialState) {
  const conversationId = generateConversationId();

  conversations[conversationId] = {
    conversationId,
    state: initialState,
    messages: []
  };

  persist();

  return conversations[conversationId];
}

function getConversation(conversationId) {
  return conversations[conversationId] || null;
}

function updateConversation(conversationId, state, messages) {
  if (!conversations[conversationId]) return null;

  conversations[conversationId] = {
    ...conversations[conversationId],
    state,
    messages
  };

  persist();

  return conversations[conversationId];
}

ensureStorage();

module.exports = {
  createConversation,
  getConversation,
  updateConversation
};