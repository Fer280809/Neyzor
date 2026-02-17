# 🤖 Asta BOT MAX v2.0

**Sistema Completo de WhatsApp Bot Multi-Device**

## ✨ Características Principales

- ✅ **@napi-rs/canvas** - Bienvenidas con imágenes personalizadas
- ✅ **Sistema de Permisos FIXEADO** - Compatible Baileys Latest
- ✅ **Bot ON/OFF** - Encender/apagar por grupo
- ✅ **Modo Privado** - Control total de grupos (Owner/SubBot)
- ✅ **SerBot Completo** - Sub-bots con QR, Código y gestión total
- ✅ **Toggle System** - Activar/desactivar comandos/categorías
- ✅ **Warn System** - 3 advertencias = kick automático
- ✅ **Config Editable** - Nombre, logo, links, prefijo vía comandos

## 🚀 Instalación

```bash
# 1. Descomprimir
cd neyrox-bot-max

# 2. Instalar
npm install

# 3. Iniciar
npm start
```

## 📁 Estructura

```
neyrox-bot-max/
├── index.js              # Principal con canvas
├── config.js             # Config dinámica
├── package.json          # Con @napi-rs/canvas
├── lib/
│   ├── permissions.js    # Sistema de permisos
│   ├── handler.js        # Handler con bot on/off
│   ├── loader.js         # Cargador
│   ├── database.js       # DB con allowedGroups
│   ├── canvas.js         # @napi-rs/canvas
│   ├── serbot.js         # Sistema sub-bots
│   └── utils.js          # Utilidades
├── commands/
│   ├── admin/            # Admin tools
│   │   ├── warn.js
│   │   └── resetwarn.js
│   ├── config/           # Configuración
│   │   ├── setconfig.js  # Editar bot
│   │   ├── toggle.js     # ON/OFF comandos
│   │   └── boton.js      # Bot on/off
│   ├── grupo/            # Grupo
│   │   ├── kick.js
│   │   ├── promote.js
│   │   ├── demote.js
│   │   └── tagall.js
│   ├── economia/         # Economía
│   │   ├── balance.js
│   │   ├── pay.js
│   │   └── rob.js
│   ├── serbot/           # Sub-bots
│   │   ├── serbot.js
│   │   ├── stopbot.js
│   │   └── bots.js
│   ├── owner/            # Owner
│   │   ├── ban.js
│   │   ├── eval.js
│   │   ├── bc.js
│   │   ├── leave.js
│   │   └── gruposcontrol.js
│   └── info/             # Info
│       ├── menu.js
│       ├── ping.js
│       └── grupos.js
├── events/               # Eventos automáticos
├── sessions/             # Sesiones
├── tmp/                  # Temporales
└── assets/               # Imágenes
```

## 📝 Comandos Principales

### ⚙️ Configuración (Owner)
| Comando | Descripción |
|---------|-------------|
| `.setconfig name NuevoNombre` | Cambiar nombre del bot |
| `.setconfig prefix !` | Cambiar prefijo |
| `.setconfig canal https://...` | Link del canal |
| `.setconfig logo ./assets/logo.jpg` | Logo del bot |

### 🔘 Bot ON/OFF (Admin)
| Comando | Descripción |
|---------|-------------|
| `.bot` | Ver estado |
| `.bot on` | Encender bot |
| `.bot off` | Apagar bot |

### 🎛️ Control de Grupos (Owner/SubBot en privado)
| Comando | Descripción |
|---------|-------------|
| `.gruposcontrol` | Ver estado |
| `.gruposcontrol mode public` | Modo público (todos los grupos) |
| `.gruposcontrol mode private` | Modo privado (solo permitidos) |
| `.gruposcontrol mode self` | Solo chat privado |
| `.gruposcontrol allow 123@g.us` | Permitir grupo |
| `.gruposcontrol deny 123@g.us` | Denegar grupo |
| `.gruposcontrol list` | Listar grupos |

### ⚠️ Sistema Warn (Admin)
| Comando | Descripción |
|---------|-------------|
| `.warn @user` | Dar advertencia |
| `.warn @user spam` | Advertencia con razón |
| `.resetwarn @user` | Resetear advertencias |

### 🔧 Toggle (Admin/Owner/SubBot)
| Comando | Descripción |
|---------|-------------|
| `.toggle` | Ver estado |
| `.toggle off kick` | Desactivar comando en grupo/bot |
| `.toggle on kick` | Activar comando |
| `.toggle offcat economia` | Desactivar categoría |
| `.toggle global off kick` | Desactivar global (owner) |

### 🤖 SerBot
| Comando | Descripción |
|---------|-------------|
| `.serbot` / `.qr` | Vincular por QR |
| `.code 521234567890` | Vincular por código |
| `.stopbot` | Detener sub-bot |
| `.bots` | Ver lista de sub-bots |
| `.bots restart` | Reiniciar todos |
| `.bots stop <id>` | Detener específico |

### 👥 Grupo
| Comando | Descripción |
|---------|-------------|
| `.kick @user` | Expulsar |
| `.promote @user` | Dar admin |
| `.demote @user` | Quitar admin |
| `.tagall mensaje` | Mencionar todos |

### 💰 Economía
| Comando | Descripción |
|---------|-------------|
| `.balance` | Ver dinero |
| `.pay @user 1000` | Transferir |
| `.rob @user` | Robar (50%, cooldown 5min) |

## 🎨 Personalizar Bienvenida

1. Coloca tu imagen en `assets/welcome-bg.jpg`
2. Tamaño recomendado: 1024x500px
3. El bot la usará automáticamente

## 🔒 Sistema de Modos

### Modo Público (default)
- El bot funciona en todos los grupos

### Modo Privado
- Solo funciona en grupos permitidos
- Owner/SubBot controlan desde privado

### Modo Self
- Solo responde en chat privado
- Útil para mantenimiento

## 📝 Crear Nuevos Comandos

Crea archivo en `commands/[carpeta]/comando.js`:

```javascript
export const command = ['nombre', 'alias']
export const description = 'Descripción'
export const category = 'Categoria'
export const admin = false
export const group = false
export const owner = false

export async function run({ sock, msg, chatId, args, reply, sender, isAdmin, isOwner }) {
  await reply('¡Funciona!')
}

export default { command, description, category, run }
```

## 🔄 Actualizar Baileys

```bash
npm install github:WhiskeySockets/Baileys
```

## 📜 Licencia

MIT - Libre uso y modificación.

**⚡ Powered by 𝕱𝖊𝖗𝖓𝖆𝖓𝖉𝖔**
