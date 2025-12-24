// Инициализация DOM элементов
const loginModal = document.getElementById('loginModal')
const signInModal = document.getElementById('signInModal')
const applicationModal = document.getElementById('applicationModal')
const signUpBtn = document.getElementById('signUpBtn')
const signInBtn = document.getElementById('signInBtn')
const applyBtn = document.getElementById('applyBtn')
const closeButtons = document.getElementsByClassName('close-button')
const profileLink = document.getElementById('profileLink')
const logoutBtn = document.getElementById('logoutBtn')

// Открытие модального окна регистрации
signUpBtn?.addEventListener('click', openLoginModal)

// Открытие модального окна входа
signInBtn?.addEventListener('click', openSignInModal)

// Открытие модального окна заявки
applyBtn?.addEventListener('click', openApplicationModal)

// Закрытие всех модальных окон кнопками
for (let btn of closeButtons) {
	btn.onclick = closeAllModals
}

// Закрытие модальных окон по клику на фон
window.onclick = closeModalOnBackgroundClick

// Проверка статуса авторизации пользователя
function checkAuthStatus() {
	const data = localStorage.getItem('currentUser')
	const currentUser = data ? JSON.parse(data) : null

	if (currentUser) {
		if (signInBtn) signInBtn.style.display = 'none'
		if (signUpBtn) signUpBtn.style.display = 'none'
		if (profileLink) profileLink.style.display = 'inline-flex'
		if (logoutBtn) logoutBtn.style.display = 'inline-flex'
	} else {
		if (signInBtn) signInBtn.style.display = 'inline-flex'
		if (signUpBtn) signUpBtn.style.display = 'inline-flex'
		if (profileLink) profileLink.style.display = 'none'
		if (logoutBtn) logoutBtn.style.display = 'none'
	}
}

// Обработка отправки формы регистрации
const signUpForm = document.getElementById('signUpForm')
signUpForm?.addEventListener('submit', handleSignUpSubmit)

// Обработка отправки формы входа
const signInForm = document.getElementById('signInForm')
signInForm?.addEventListener('submit', handleSignInSubmit)

// Обработка отправки формы заявки
const applicationForm = document.getElementById('applicationForm')
applicationForm?.addEventListener('submit', handleApplicationSubmit)

// Выход из аккаунта
function logout() {
	localStorage.removeItem('currentUser')
	checkAuthStatus()
	window.location.reload()
}
logoutBtn?.addEventListener('click', logout)

// Инициализация задач пользователя при регистрации
function initUserTasks(userId) {
	const tasksKey = `tasks_${userId}`
	const lastTaskTime = localStorage.getItem(`lastTaskTime_${userId}`)

	if (!lastTaskTime) {
		localStorage.setItem(`lastTaskTime_${userId}`, Date.now().toString())
		generateNewTasks(userId)
	}
}

// Генерация новых ежедневных заданий
function generateNewTasks(userId) {
	const tasks = [
		{ id: 1, title: 'Добыть 64 алмаза', reward: 50, type: 'mining' },
		{ id: 2, title: 'Победить 10 игроков в PvP', reward: 100, type: 'pvp' },
		{ id: 3, title: 'Построить дом 10x10', reward: 30, type: 'building' },
		{ id: 4, title: 'Добыть 128 железа', reward: 40, type: 'mining' },
		{ id: 5, title: 'Приручить 5 волков', reward: 25, type: 'taming' },
		{ id: 6, title: 'Убить эндер дракона', reward: 200, type: 'boss' },
		{ id: 7, title: 'Собрать 64 изумруда', reward: 80, type: 'mining' },
		{ id: 8, title: 'Провести 2 часа онлайн', reward: 20, type: 'activity' },
		{ id: 9, title: 'Помочь участнику клана', reward: 35, type: 'social' },
		{ id: 10, title: 'Найти крепость', reward: 60, type: 'exploration' },
	]

	const shuffled = tasks.sort(() => Math.random() - 0.5)
	const selectedTasks = shuffled.slice(0, 3).map(task => ({
		...task,
		completed: false,
		skipped: false,
	}))

	localStorage.setItem(`tasks_${userId}`, JSON.stringify(selectedTasks))
	localStorage.setItem(`lastTaskTime_${userId}`, Date.now().toString())
}

// Завершение задания с начислением очков
function completeTask(userId, taskId) {
	const tasksKey = `tasks_${userId}`
	const tasks = JSON.parse(localStorage.getItem(tasksKey) || '[]')
	const task = tasks.find(t => t.id === taskId)

	if (task && !task.completed && !task.skipped) {
		task.completed = true
		localStorage.setItem(tasksKey, JSON.stringify(tasks))

		const userData = JSON.parse(localStorage.getItem('currentUser'))
		userData.points = (userData.points || 0) + task.reward
		userData.tasksCompleted = (userData.tasksCompleted || 0) + 1
		localStorage.setItem('currentUser', JSON.stringify(userData))

		fetch('http://localhost:3000/api/players/update-points', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nickname: userData.name,
				points: userData.points,
			}),
		})
			.then(() => {
				updatePointsDisplay()
				renderTasks()
				loadLeaderboard()
			})
			.catch(err => console.error('Ошибка синхронизации с сервером:', err))
	}
}

// Пропуск задания без начисления очков
function skipTask(userId, taskId) {
	const tasksKey = `tasks_${userId}`
	const tasks = JSON.parse(localStorage.getItem(tasksKey) || '[]')
	const task = tasks.find(t => t.id === taskId)

	if (task && !task.completed && !task.skipped) {
		task.skipped = true
		localStorage.setItem(tasksKey, JSON.stringify(tasks))
		renderTasks()
	}
}

// Проверка таймера обновления заданий (каждые 10 минут)
function checkTaskTimer() {
	const userData = JSON.parse(localStorage.getItem('currentUser'))
	if (!userData) return

	const userId = userData.id
	const lastTaskTime = parseInt(
		localStorage.getItem(`lastTaskTime_${userId}`) || '0'
	)
	const currentTime = Date.now()
	const timeDiff = currentTime - lastTaskTime
	const tenMinutes = 10 * 60 * 1000

	if (timeDiff >= tenMinutes) {
		generateNewTasks(userId)
		renderTasks()
	}

	const nextTaskEl = document.getElementById('nextTaskTime')
	if (nextTaskEl) {
		const timeLeft = tenMinutes - timeDiff
		const minutes = Math.floor(timeLeft / 60000)
		const seconds = Math.floor((timeLeft % 60000) / 1000)
		nextTaskEl.textContent = `Новые задания через: ${minutes}:${seconds
			.toString()
			.padStart(2, '0')}`
	}
}

// Отрисовка списка текущих заданий
function renderTasks() {
	const tasksList = document.getElementById('tasksList')
	if (!tasksList) return

	const userData = JSON.parse(localStorage.getItem('currentUser'))
	if (!userData) return

	const tasks = JSON.parse(localStorage.getItem(`tasks_${userData.id}`) || '[]')

	if (tasks.length === 0) {
		tasksList.innerHTML =
			'<div class="empty-state">Задания скоро появятся</div>'
		return
	}

	tasksList.innerHTML = tasks
		.map(
			task => `
    <div class="task-item ${task.completed ? 'completed' : ''} ${
				task.skipped ? 'skipped' : ''
			}">
      <div class="task-info">
        <h3>${task.title}</h3>
        <span class="task-reward">+${task.reward} очков</span>
      </div>
      <div class="task-actions">
        ${
					!task.completed && !task.skipped
						? `
          <button onclick="completeTask(${userData.id}, ${task.id})" class="btn-complete">✓ Выполнить</button>
          <button onclick="skipTask(${userData.id}, ${task.id})" class="btn-skip">✗ Пропустить</button>
        `
						: ''
				}
        ${
					task.completed
						? '<span class="status-badge completed">Выполнено</span>'
						: ''
				}
        ${
					task.skipped
						? '<span class="status-badge skipped">Пропущено</span>'
						: ''
				}
      </div>
    </div>
  `
		)
		.join('')
}

// Обновление отображения очков и выполненных заданий
function updatePointsDisplay() {
	const userData = JSON.parse(localStorage.getItem('currentUser'))
	if (!userData) return

	const pointsEl = document.getElementById('pointsCount')
	const tasksCountEl = document.getElementById('tasksCount')

	if (pointsEl) pointsEl.textContent = userData.points || 0
	if (tasksCountEl) tasksCountEl.textContent = userData.tasksCompleted || 0
}

// Расчет времени в клане по дате вступления
function calculateTimeInClan(joinDate) {
	if (!joinDate) return 'Неизвестно'

	const join = new Date(joinDate)
	const now = new Date()
	const diff = now - join

	const days = Math.floor(diff / (1000 * 60 * 60 * 24))
	const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

	if (days > 0) {
		return `${days} дней ${hours} часов`
	} else {
		return `${hours} часов`
	}
}

// Загрузка и отображение лидерборда игроков
function loadLeaderboard() {
	const container = document.getElementById('leaderboard')
	if (!container) return

	const localUserData = JSON.parse(localStorage.getItem('currentUser'))

	fetch('http://localhost:3000/api/players')
		.then(res => res.json())
		.then(serverPlayers => {
			let allPlayers = [...serverPlayers]

			if (localUserData) {
				const existIndex = allPlayers.findIndex(
					p =>
						p.login === localUserData.login || p.nickname === localUserData.name
				)

				if (existIndex !== -1) {
					allPlayers[existIndex].points = Math.max(
						allPlayers[existIndex].points,
						localUserData.points || 0
					)
				} else {
					allPlayers.push({
						nickname: localUserData.name || localUserData.login,
						group: localUserData.category || 'PLAYER',
						points: localUserData.points || 0,
						isLocal: true,
					})
				}
			}

			const sorted = allPlayers.sort((a, b) => b.points - a.points)

			if (sorted.length === 0) {
				container.innerHTML =
					'<div class="empty-state">Участников пока нет</div>'
				return
			}

			container.innerHTML = sorted
				.map((player, index) => {
					const isCurrent =
						localUserData &&
						(player.nickname === localUserData.name ||
							player.login === localUserData.login)

					return `
              <div class="leaderboard-row rank-${index + 1} ${
						isCurrent ? 'current-user-row' : ''
					}">
                  <div class="rank-info">
                      <span class="rank-number">#${index + 1}</span>
                      <div>
                          <span class="player-name">${player.nickname} ${
						isCurrent ? '(ВЫ)' : ''
					}</span>
                          <span class="player-group">${getGroupName(
														player.group
													)}</span>
                      </div>
                  </div>
                  <div class="player-points">
                      <span class="points-val">${player.points.toLocaleString()}</span>
                      <span class="points-label">очков</span>
                  </div>
              </div>
          `
				})
				.join('')
		})
		.catch(() => {
			container.innerHTML = '<div class="empty-state">Ошибка загрузки API</div>'
		})
}

// Получение названия привилегии по ключу
function getPrivilegeName(privilege) {
	const privilegeNames = {
		default: 'PLAYER',
		vip: 'GRIFER',
		premium: 'MUSTANG',
		moder: 'GHAST',
		admin: 'WITHER',
		kraken: 'KRAKEN',
		dragon: 'DRAGON',
		stinger: 'STINGER',
		eternity: 'ETERNITY',
		trainee: 'СТАЖЁР',
	}

	return (
		privilegeNames[privilege] ||
		(privilege ? privilege.toUpperCase() : 'УЧАСТНИК')
	)
}

// Получение названия группы по ключу
function getGroupName(group) {
	const names = {
		LEADERS: '👑 ЛИДЕРЫ',
		ADMINS: '⚙️ АДМИНЫ',
		PVP: '⚔️ PVP',
		UNI: '🎯 UNI',
		PVE: '🛡️ PVE',
		TSD: '📊 TSD',
		RESERVE: '⏳ РЕЗЕРВ',
	}
	return names[group] || group
}

// Инициализация приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', initializeApp)

// Основная функция инициализации приложения
function initializeApp() {
	checkAuthStatus()

	const membersGrid = document.getElementById('members-grid')
	if (membersGrid) {
		loadClanMembers(membersGrid)
	}
	loadLeaderboard()
	updatePointsDisplay()
	renderTasks()
	checkTaskTimer()
	setInterval(checkTaskTimer, 1000)
}

// Загрузка и группировка членов клана
function loadClanMembers(membersGrid) {
	fetch('http://localhost:3000/api/players')
		.then(res => res.json())
		.then(players => {
			membersGrid.innerHTML = ''
			const groupedPlayers = {}

			players.forEach(player => {
				const group = player.group || player.squad || 'RESERVE'
				if (!groupedPlayers[group]) {
					groupedPlayers[group] = []
				}
				groupedPlayers[group].push(player)
			})

			Object.entries(groupedPlayers).forEach(([groupName, groupPlayers]) => {
				const groupCard = document.createElement('div')
				groupCard.className = 'group-section'

				groupCard.innerHTML = `
          <h3>${getGroupName(groupName)}</h3>
          <div class="group-members">
            ${groupPlayers
							.map(
								player => `
              <div class="member">
                <strong>${player.nickname}</strong>
                <span>${player.role || 'MEMBER'}</span>
              </div>
            `
							)
							.join('')}
          </div>
        `

				membersGrid.appendChild(groupCard)
			})
		})
		.catch(err => {
			console.error(err)
			membersGrid.innerHTML = '<p>Не удалось загрузить состав клана.</p>'
		})
}

// Открытие модального окна регистрации
function openLoginModal() {
	loginModal.style.display = 'block'
}

// Открытие модального окна входа
function openSignInModal() {
	signInModal.style.display = 'block'
}

// Открытие модального окна заявки
function openApplicationModal() {
	applicationModal.style.display = 'block'
}

// Закрытие всех модальных окон
function closeAllModals() {
	if (loginModal) loginModal.style.display = 'none'
	if (signInModal) signInModal.style.display = 'none'
	if (applicationModal) applicationModal.style.display = 'none'
}

// Закрытие модального окна при клике на фон
function closeModalOnBackgroundClick(e) {
	if (e.target === loginModal) loginModal.style.display = 'none'
	if (e.target === signInModal) signInModal.style.display = 'none'
	if (e.target === applicationModal) applicationModal.style.display = 'none'
}

// Обработка формы регистрации
function handleSignUpSubmit(e) {
	e.preventDefault()

	const name = document.getElementById('signUpUsername').value.trim()
	const login = document.getElementById('signUpUser').value.trim()
	const pass = document.getElementById('signUpPassword').value
	const privilege = document.getElementById('signUpImage').value
	const category = document.getElementById('signUpCategory').value
	const points = parseInt(document.getElementById('signUpPoints').value) || 0

	if (!name || !login || !pass || !privilege || !category) {
		alert('Заполните все поля!')
		return
	}

	const joinDate = new Date().toISOString()

	fetch('http://localhost:3000/api/users/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Privilege': privilege,
		},
		body: JSON.stringify({
			name,
			login,
			password: pass,
			privilege,
			category,
			points,
			joinDate,
		}),
	})
		.then(r => {
			if (!r.ok) {
				return r.json().then(err => {
					throw err
				})
			}
			return r.json()
		})
		.then(user => {
			loginModal.style.display = 'none'
			signUpForm.reset()
			localStorage.setItem(
				'currentUser',
				JSON.stringify({
					id: user.id,
					name: user.name,
					login: user.login,
					privilege: user.privilege || privilege,
					category: user.category || category,
					points: user.points || points,
					joinDate: user.joinDate || joinDate,
				})
			)
			initUserTasks(user.id)
			checkAuthStatus()
			window.location.href = './profil.html'
		})
		.catch(err => {
			console.error(err)
			alert('Ошибка при регистрации: ' + (err.message || 'Попробуйте позже'))
		})
}

// Обработка формы входа
function handleSignInSubmit(e) {
	e.preventDefault()

	const login = document.getElementById('signInUser').value.trim()
	const pass = document.getElementById('signInPassword').value

	if (!login || !pass) {
		alert('Заполните логин и пароль!')
		return
	}

	fetch('http://localhost:3000/api/users/', {
		headers: { Authorization: 'Basic ' + btoa(`${login}:${pass}`) },
	})
		.then(r => {
			if (!r.ok) {
				throw new Error('Неверный логин или пароль')
			}
			return r.json()
		})
		.then(users => {
			const user = users.find(u => u.login === login)
			if (!user) {
				alert('Неверный логин или пароль')
				return
			}
			localStorage.setItem(
				'currentUser',
				JSON.stringify({
					id: user.id,
					name: user.name,
					login: user.login,
					privilege: user.privilege,
					category: user.category,
					points: user.points || 0,
					joinDate: user.joinDate || new Date().toISOString(),
				})
			)
			signInModal.style.display = 'none'
			checkAuthStatus()
			window.location.href = './profil.html'
		})
		.catch(err => {
			console.error(err)
			alert('Ошибка при входе: ' + err.message)
		})
}

// Обработка формы заявки в клан
function handleApplicationSubmit(e) {
	e.preventDefault()

	const nickname = document.getElementById('appNickname').value.trim()
	const age = document.getElementById('appAge').value.trim()
	const experience = document.getElementById('appExperience').value.trim()
	const online = document.getElementById('appOnline').value.trim()
	const discord = document.getElementById('appDiscord').value.trim()
	const category = document.getElementById('appCategory').value

	if (!nickname || !age || !experience || !online || !discord || !category) {
		alert('Заполните все поля!')
		return
	}

	fetch('http://localhost:3000/api/applications/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			nickname,
			age,
			experience,
			online,
			discord,
			category,
		}),
	})
		.then(r => {
			if (!r.ok) {
				return r.json().then(err => {
					throw err
				})
			}
			return r.json()
		})
		.then(() => {
			applicationModal.style.display = 'none'
			applicationForm.reset()
			alert('Заявка успешно отправлена! Ожидайте ответа от администрации.')
		})
		.catch(err => {
			console.error(err)
			alert(
				'Ошибка при отправке заявки: ' + (err.message || 'Попробуйте позже')
			)
		})
}
