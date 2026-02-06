import { readdirSync, statSync } from 'fs'
import { join, extname } from 'path'
import chalk from 'chalk'
import { pathToFileURL } from 'url'

const commands = new Map()
const events = new Map()

export async function loadPlugins(sock = null) {
  console.log(chalk.cyan('\n📦 Cargando plugins...'))

  // Cargar comandos
  const cmdPath = './commands'
  const cmdFiles = scanFiles(cmdPath)

  for (const file of cmdFiles) {
    try {
      const module = await import(pathToFileURL(file).href + `?t=${Date.now()}`)
      const cmd = module.default || module

      if (cmd.command) {
        const names = Array.isArray(cmd.command) ? cmd.command : [cmd.command]

        for (const name of names) {
          commands.set(name.toLowerCase(), cmd)
        }

        const relativePath = file.replace('./commands/', '')
        console.log(chalk.green(`  ✓ ${names[0]} ${chalk.gray(`(${relativePath})`)}`))
      }
    } catch (err) {
      console.error(chalk.red(`  ✗ ${file}: ${err.message}`))
    }
  }

  // Cargar eventos
  const evtPath = './events'
  const evtFiles = scanFiles(evtPath)

  for (const file of evtFiles) {
    try {
      const module = await import(pathToFileURL(file).href + `?t=${Date.now()}`)
      const evt = module.default || module

      if (evt.name) {
        events.set(evt.name, evt)
        console.log(chalk.blue(`  📡 ${evt.name} ${chalk.gray(`(${file.replace('./events/', '')})`)}`))
      }
    } catch (err) {
      console.error(chalk.red(`  ✗ ${file}: ${err.message}`))
    }
  }

  global.commands = commands
  global.events = events

  console.log(chalk.cyan(`✅ ${commands.size} comandos | ${events.size} eventos cargados\n`))

  return { commands, events }
}

function scanFiles(dir) {
  const files = []

  try {
    const items = readdirSync(dir)

    for (const item of items) {
      const fullPath = join(dir, item)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        files.push(...scanFiles(fullPath))
      } else if (extname(item) === '.js') {
        files.push(fullPath)
      }
    }
  } catch {}

  return files
}

export { commands, events }
export default loadPlugins
