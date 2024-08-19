import db from '../lib/database.js'
import { promises } from 'fs'
import fs from 'fs'
import fetch from 'node-fetch'
import { join } from 'path'
import { xpRange } from '../lib/levelling.js'
import moment from 'moment-timezone'
import proto from '@adiwajshing/baileys'

let totalf = Object.values(global.plugins).filter(v => v.help && v.tags).length
let tags = { 'main': 'Main' }
const defaultMenu = {
  before: `┏━━━━━━⊱ 𝑺𝑰𝑳𝑽𝑨 𝑩𝑶𝑻 ⊰━━━━━━⸙
┏━━━━❮❮ CMD LINE ❯❯━━━━━━
┃💫 *𝙽𝚊𝚖𝚎:* ${global.author}
┃🫠 *𝚃𝚘𝚝𝚊𝚕:* ${totalf} + Features
┃💥 *Network:* LTE
┃📍 ᴠᴇʀꜱɪᴏɴ: 2.5.3
┃👨‍💻 ᴏᴡɴᴇʀ : *𝕊𝕀𝕃𝕍𝔸*      
┃👤 ɴᴜᴍʙᴇʀ: 254743706010
┃💻 HOSTER: *Silva Platform*
┃🛡 ᴍᴏᴅᴇ: *Unkown*
┃💫 ᴘʀᴇғɪx: *Multi-Prefix*
┖─────────┈┈┈〠⸙࿉༐
Thank you for choosing silva md
powered by Sylivanus❤️
─═✧✧═─ 𝕊𝕀𝕃𝕍𝔸 𝔹𝕆𝕋 ─═✧✧═─
    %readmore`.trimStart(),
  header: '┏━━━━ ❨ *💫 %category* ❩ ━━┄┈ •⟅ ',
  body: ' ┃✓ %cmd',
  footer: '┗━═┅┅┅┅═━–––––––๑\n',
  after: `*Made by ♡ ${global.oname}*`,
}
let handler = async (m, { conn, usedPrefix: _p, __dirname }) => {
  try {
    // Reading package.json
    let _package = JSON.parse(await promises.readFile(join(__dirname, '../package.json')).catch(_ => ({}))) || {}

    // User-specific data
    let { rank, exp, limit, level, role } = global.db.data.users[m.sender]
    let { min, xp, max } = xpRange(level, global.multiplier)
    let name = await conn.getName(m.sender)

    // Date and time calculations
    let d = new Date(new Date() + 3600000)
    let locale = 'en'
    let weton = ['Pahing', 'Pon', 'Wage', 'Kliwon', 'Legi'][Math.floor(d / 84600000) % 5]
    let week = d.toLocaleDateString(locale, { weekday: 'long' })
    let date = d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    let dateIslamic = Intl.DateTimeFormat(locale + '-TN-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
    let time = d.toLocaleTimeString(locale, { hour: 'numeric', minute: 'numeric', second: 'numeric' })

    // Uptime calculations
    let _uptime = process.uptime() * 1000
    let _muptime = process.send ? await new Promise(resolve => {
      process.once('message', resolve)
      setTimeout(resolve, 1000)
    }) * 1000 : 0
    let muptime = clockString(_muptime)
    let uptime = clockString(_uptime)

    // Fetching user data
    let totalreg = Object.keys(global.db.data.users).length
    let rtotalreg = Object.values(global.db.data.users).filter(user => user.registered == true).length
    let help = Object.values(global.plugins).filter(plugin => !plugin.disabled).map(plugin => {
      return {
        help: Array.isArray(plugin.tags) ? plugin.help : [plugin.help],
        tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
        prefix: 'customPrefix' in plugin,
        limit: plugin.limit,
        premium: plugin.premium,
        enabled: !plugin.disabled,
      }
    })

    // Organizing tags
    for (let plugin of help)
      if (plugin && 'tags' in plugin)
        for (let tag of plugin.tags)
          if (!(tag in tags) && tag) tags[tag] = tag

    // Menu template
    conn.menu = conn.menu ? conn.menu : {}
    let before = conn.menu.before || defaultMenu.before
    let header = conn.menu.header || defaultMenu.header
    let body = conn.menu.body || defaultMenu.body
    let footer = conn.menu.footer || defaultMenu.footer
    let after = conn.menu.after || (conn.user.jid == conn.user.jid ? '' : `Powered by https://wa.me/${conn.user.jid.split`@`[0]}`) + defaultMenu.after
    let _text = [
      before,
      ...Object.keys(tags).map(tag => {
        return header.replace(/%category/g, tags[tag]) + '\n' + [
          ...help.filter(menu => menu.tags && menu.tags.includes(tag) && menu.help).map(menu => {
            return menu.help.map(help => {
              return body.replace(/%cmd/g, menu.prefix ? help : '%p' + help)
                .replace(/%islimit/g, menu.limit ? '[🅛]' : '')
                .replace(/%isPremium/g, menu.premium ? '[🅟]' : '')
                .replace(/%isVip/g, menu.vip ? '[🅥]' : '')
                .trim()
            }).join('\n')
          }),
          footer
        ].join('\n')
      }),
      after
    ].join('\n')
    let text = typeof conn.menu == 'string' ? conn.menu : typeof conn.menu == 'object' ? _text : ''
    let replace = {
      '%': '%',
      p: _p, uptime, muptime,
      me: conn.getName(conn.user.jid),
      npmname: _package.name,
      npmdesc: _package.description,
      version: _package.version,
      exp: exp - min,
      maxexp: xp,
      totalexp: exp,
      xp4levelup: max - exp,
      github: _package.homepage ? _package.homepage.url || _package.homepage : '[unknown github url]',
      level, limit, name, weton, week, date, dateIslamic, time, totalreg, rtotalreg, role,
      readmore: readMore
    }
    text = text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name])
    const pp = await conn.profilePictureUrl(conn.user.jid).catch(_ => './media/contact.png')

    // ... (rest of the code remains the same)

// Sending the menu
const buttons = [
  {
    buttonId: 'SILVA MENU',
    buttonText: {
      displayText: 'SILVA MENU'
    },
    type: 1
  }
]

const buttonMessage = {
  text: text.replace(),
  footer: author,
  buttons: buttons,
  headerType: 4,
  header: await conn.getBuffer(pp)
}

const interactiveMessage = proto.Message.InteractiveMessage.create({
  interactiveMessage: proto.Message.InteractiveMessage.Body.create({
    header: proto.Message.InteractiveMessage.Header.create({
      title: 'SILVA MENU'
    }),
    footer: proto.Message.InteractiveMessage.Footer.create({
      text: 'SELECT AN OPTION'
    }),
    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
      buttons: buttons
    })
  })
})

conn.sendMessage(m.chat, interactiveMessage, { quoted: m })

// Send audio file
const audio = await conn.getBuffer('./media/silva.mp4')
conn.sendMessage(m.chat, { audio: audio, mimetype: 'audio/mpeg' }, { quoted: m })

  } catch (e) {
    conn.reply(m.chat, 'ERROR IN MENU', m)
    throw e
  }
}
handler.command = /^(menu2|help2)$/i
handler.exp = 3

export default handler

const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)

function clockString(ms) {
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

function pickRandom(list) {
  return list[Math.floor(list.length * Math.random())]
      }