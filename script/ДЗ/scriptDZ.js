const usernameInput = document.getElementById('username-input');
  const displayName = document.getElementById('display-name');
  const saveNameBtn = document.getElementById('save-name');
  const themeSelect = document.getElementById('theme-select');
  const profilePic = document.getElementById('profile-pic');
  const picUpload = document.getElementById('pic-upload');

  function saveName() {
    const name = usernameInput.value.trim();
    if (name) {
      sessionStorage.setItem('username', name);
      displayName.textContent = 'Имя пользователя: ' + name;
    } else {
      sessionStorage.removeItem('username');
      displayName.textContent = '';
    }
  }

  function loadName() {
    const name = sessionStorage.getItem('username');
    if (name) {
      displayName.textContent = 'Имя пользователя: ' + name;
      usernameInput.value = name;
    }
  }

  saveNameBtn.addEventListener('click', saveName);
  loadName();

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
      themeSelect.value = 'dark';
    } else {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      themeSelect.value = 'light';
    }
  }

  function saveTheme(theme) {
    localStorage.setItem('theme', theme);
  }

  function loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    applyTheme(theme);
  }

  themeSelect.addEventListener('change', () => {
    const selected = themeSelect.value;
    applyTheme(selected);
    saveTheme(selected);
  });

  loadTheme();

  function loadImage() {
    const picData = localStorage.getItem('profilePic');
    if (picData) {
      profilePic.src = picData;
    } else {
      profilePic.src = '';
    }
  }

  picUpload.addEventListener('change', () => {
    const file = picUpload.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        localStorage.setItem('profilePic', e.target.result);
        profilePic.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  loadImage();