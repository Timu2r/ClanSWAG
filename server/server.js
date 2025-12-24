import express from 'express'
import bodyParser from 'body-parser'
import basicAuth from 'basic-auth'
import cors from 'cors'

const app = express()
const PORT = 3000

app.use(cors())
app.use(bodyParser.json())

let users = []
let nextId = 1

const clanPlayers = [
  { id: 1, nickname: 'SWA4_G', group: 'LEADERS', role: 'LEADER', points: 12500, warnings: 0, tasksCompleted: 45 },
  { id: 2, nickname: 'SWAG | ZiroClieck', group: 'LEADERS', role: 'CO_LEADER', points: 11800, warnings: 1, tasksCompleted: 42 },
  { id: 3, nickname: 'SWAG | FirTeg', group: 'LEADERS', role: 'TEX_ADMIN', points: 9800, warnings: 0, tasksCompleted: 38 },
  { id: 4, nickname: 'SWAG | Никто', group: 'ADMINS', role: 'ADMIN', points: 8500, warnings: 2, tasksCompleted: 35 },
  { id: 5, nickname: 'SWAG | Sad_one_luva', group: 'ADMINS', role: 'CURATOR', points: 7200, warnings: 0, tasksCompleted: 30 },
  { id: 6, nickname: 'SWAG | melissa0mur', group: 'ADMINS', role: 'CURATOR', points: 6800, warnings: 1, tasksCompleted: 28 },
  { id: 7, nickname: 'SWAG | cat', group: 'ADMINS', role: 'CO_CURATOR', points: 6500, warnings: 0, tasksCompleted: 27 },
  { id: 8, nickname: 'SWAG | kostya357857', group: 'PVP', role: 'MEMBER', points: 4200, warnings: 3, tasksCompleted: 22 },
  { id: 9, nickname: 'SWAG | KPblCKA', group: 'PVP', role: 'MEMBER', points: 3800, warnings: 1, tasksCompleted: 20 },
  { id: 10, nickname: 'SWAG | KAZAKH', group: 'UNI', role: 'MEMBER', points: 5600, warnings: 0, tasksCompleted: 25 },
  { id: 11, nickname: 'SWAG | xkiller5256', group: 'UNI', role: 'MEMBER', points: 4900, warnings: 2, tasksCompleted: 23 },
  { id: 12, nickname: 'SWAG | kesk69', group: 'UNI', role: 'MEMBER', points: 4500, warnings: 1, tasksCompleted: 21 },
  { id: 13, nickname: 'SWAG | bustHolyWorld', group: 'UNI', role: 'MEMBER', points: 4100, warnings: 0, tasksCompleted: 19 },
  { id: 14, nickname: 'SWAG | KOKCIK', group: 'UNI', role: 'MEMBER', points: 3700, warnings: 4, tasksCompleted: 18 },
  { id: 15, nickname: 'SWAG | grizli за яйца', group: 'UNI', role: 'MEMBER', points: 3400, warnings: 1, tasksCompleted: 17 },
  { id: 16, nickname: 'SWAG | Atamas', group: 'UNI', role: 'MEMBER', points: 3200, warnings: 0, tasksCompleted: 16 },
  { id: 17, nickname: 'SWAG | LOLOLOLOsh', group: 'UNI', role: 'MEMBER', points: 2900, warnings: 2, tasksCompleted: 15 },
  { id: 18, nickname: 'SWAG | IhateArtyfan4ik', group: 'UNI', role: 'MEMBER', points: 2700, warnings: 3, tasksCompleted: 14 },
  { id: 19, nickname: 'SWAG | wo1rd', group: 'PVE', role: 'MEMBER', points: 4800, warnings: 0, tasksCompleted: 24 },
  { id: 20, nickname: 'SWAG | Solepuga2007', group: 'PVE', role: 'MEMBER', points: 4400, warnings: 1, tasksCompleted: 22 },
  { id: 21, nickname: 'SWAG | drroyak', group: 'PVE', role: 'MEMBER', points: 3900, warnings: 0, tasksCompleted: 20 },
  { id: 22, nickname: 'SWAG | Dilorildo', group: 'PVE', role: 'MEMBER', points: 3600, warnings: 2, tasksCompleted: 19 },
  { id: 23, nickname: 'SWAG | vvto19256chelik', group: 'PVE', role: 'MEMBER', points: 3300, warnings: 1, tasksCompleted: 17 },
  { id: 24, nickname: 'SWAG | _Red_', group: 'PVE', role: 'MEMBER', points: 3100, warnings: 0, tasksCompleted: 16 },
  { id: 25, nickname: 'SWAG | mode_123', group: 'TSD', role: 'MEMBER', points: 5200, warnings: 0, tasksCompleted: 26 },
]

let nextPlayerId = 100

function isLoginUnique(login, excludeId = null) {
  return !users.some(u => u.login === login && u.id !== excludeId)
}

function authMiddleware(req, res, next) {
  const credentials = basicAuth(req)
  if (!credentials) {
    res.set('WWW-Authenticate', 'Basic realm="SWAG Clan API"')
    return res.status(401).json({ error: 'Missing Authorization header' })
  }

  const user = users.find(
    u => u.login === credentials.name && u.password === credentials.pass
  )
  if (!user) {
    res.set('WWW-Authenticate', 'Basic realm="SWAG Clan API"')
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  req.user = user
  next()
}

app.get('/api/players', (req, res) => {
  res.json(clanPlayers)
})

app.get('/api/players/by-group', (req, res) => {
  const { group } = req.query
  if (!group) return res.json(clanPlayers)
  res.json(clanPlayers.filter(p => p.group === group))
})

app.get('/api/leaderboard', (req, res) => {
  const topPlayers = [...clanPlayers]
    .sort((a, b) => b.points - a.points)
    .slice(0, 10)
  res.json(topPlayers)
})

app.get('/api/users', (req, res) => {
  const sanitizedUsers = users.map(({ password, ...rest }) => rest)
  res.json(sanitizedUsers)
})

app.post('/api/users', (req, res) => {
  const { name, privilege = 'default', login, password, category = 'RESERVE', points = 0 } = req.body

  if (!name || !login || !password) {
    return res
      .status(400)
      .json({ error: 'name, login and password are required' })
  }

  if (!isLoginUnique(login)) {
    return res.status(400).json({ error: 'Login must be unique' })
  }

  const newUser = { 
    id: nextId++, 
    name, 
    privilege, 
    login, 
    password,
    category,
    points: parseInt(points) || 0,
    joinDate: new Date().toISOString()
  }
  users.push(newUser)
  const { password: _, ...userWithoutPassword } = newUser

  clanPlayers.push({
    id: nextPlayerId++,
    nickname: name,
    role: 'MEMBER',
    group: category,
    points: parseInt(points) || 0,
    warnings: 0,
    tasksCompleted: 0
  })

  res.status(201).json(userWithoutPassword)
})

app.get('/api/me', authMiddleware, (req, res) => {
  const { id, name, privilege, login, category, points, joinDate } = req.user
  res.json({ id, name, privilege, login, category, points: points || 0, joinDate })
})

app.put('/api/users/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id)
  const userToUpdate = users.find(u => u.id === id)

  if (!userToUpdate) return res.status(404).json({ error: 'User not found' })
  if (req.user.id !== id) return res.status(403).json({ error: 'Forbidden' })

  const { name, privilege, login, password, category, points } = req.body

  if (login && !isLoginUnique(login, id)) {
    return res.status(400).json({ error: 'Login must be unique' })
  }

  if (name !== undefined) userToUpdate.name = name
  if (privilege !== undefined) userToUpdate.privilege = privilege
  if (login !== undefined) userToUpdate.login = login
  if (password !== undefined) userToUpdate.password = password
  if (category !== undefined) userToUpdate.category = category
  if (points !== undefined) userToUpdate.points = parseInt(points)

  const { password: _, ...userWithoutPassword } = userToUpdate
  res.json(userWithoutPassword)
})

app.delete('/api/users/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id)
  const index = users.findIndex(u => u.id === id)

  if (index === -1) return res.status(404).json({ error: 'User not found' })
  if (req.user.id !== id) return res.status(403).json({ error: 'Forbidden' })

  users.splice(index, 1)
  res.json({ message: 'User deleted' })
})

app.listen(PORT, () => {
  console.log(`SWAG Clan server running on http://localhost:${PORT}`)
})
