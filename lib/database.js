import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

const adapter = new JSONFile('database.json')
const db = new Low(adapter, {})

await db.read()
db.data = db.data || {
  users: {},
  groups: {},
  subBots: {},
  settings: {
    globalDisabledCommands: [],
    globalDisabledCategories: [],
    botMode: 'public' // public, private, self
  }
}
await db.write()

setInterval(async () => {
  if (db.data) await db.write()
}, 30000)

export function getUser(jid) {
  const id = jid.split('@')[0]
  if (!db.data.users[id]) {
    db.data.users[id] = {
      id, name: '', money: global.config?.startBalance || 1000,
      bank: 0, level: 1, xp: 0, warn: 0, banned: false,
      commands: 0, daily: 0, work: 0, crime: 0, rob: 0,
      createdAt: Date.now()
    }
  }
  return db.data.users[id]
}

export function getGroup(jid) {
  if (!db.data.groups[jid]) {
    db.data.groups[jid] = {
      id: jid,
      welcome: true,
      antilink: false,
      antispam: false,
      mute: false,
      botEnabled: true, // Bot encendido/apagado en este grupo
      allowedGroups: [], // Para modo privado: grupos permitidos
      disabledCommands: [],
      disabledCategories: [],
      settings: {},
      createdAt: Date.now()
    }
  }
  return db.data.groups[jid]
}

export function getSubBotConfig(sessionId) {
  if (!db.data.subBots[sessionId]) {
    db.data.subBots[sessionId] = {
      sessionId,
      botName: null,
      prefix: '.',
      botMode: 'public', // public, private, self
      allowedGroups: [], // Grupos donde funciona en modo privado
      disabledCommands: [],
      disabledCategories: [],
      settings: {},
      createdAt: Date.now()
    }
  }
  return db.data.subBots[sessionId]
}

export async function save() {
  await db.write()
}

export { db }
export default db
