// Configuration
const CRUISE_PASSWORD = "divas2025"; // Simple shared password
const CRUISE_DATE = new Date("October 6, 2025 15:30:00"); // Cruise departure date and time

// DOM Elements - Login
const loginScreen = document.getElementById('login-screen');
const mainContent = document.getElementById('main-content');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');

// DOM Elements - Navigation
const navToggle = document.getElementById('nav-toggle');
const navContent = document.getElementById('nav-content');
const themeToggle = document.getElementById('theme-toggle');
const lightIcon = document.getElementById('light-icon');
const darkIcon = document.getElementById('dark-icon');
const siteHeader = document.getElementById('site-header');

// Navigation buttons
const navHome = document.getElementById('nav-home');
const navInfo = document.getElementById('nav-info');
const navSchedule = document.getElementById('nav-schedule');
const navContacts = document.getElementById('nav-contacts');
const navProfile = document.getElementById('nav-profile');

// Content sections
const homeSection = document.getElementById('home-section');
const infoSection = document.getElementById('info-section');
const scheduleSection = document.getElementById('schedule-section');
const contactsSection = document.getElementById('contacts-section');
const profileSection = document.getElementById('profile-section');

// Profile elements
const profileForm = document.getElementById('profile-form');
const avatarSelect = document.getElementById('avatar-select');
const avatarPreview = document.getElementById('avatar-preview');
const avatarOptions = document.getElementById('avatar-options');

// Avatar options - Emoji-based to avoid external dependencies
const avatars = [
  { color: "#FF5733", icon: "🌊" },
  { color: "#33FF57", icon: "🏝️" },
  { color: "#3357FF", icon: "🚢" },
  { color: "#F033FF", icon: "🌴" },
  { color: "#FF33A8", icon: "🐬" },
  { color: "#33FFF6", icon: "🐠" },
  { color: "#FFD700", icon: "🍹" },
  { color: "#9370DB", icon: "🌺" },
  { color: "#FF6347", icon: "🐚" },
  { color: "#20B2AA", icon: "🏄" },
  { color: "#FF8C00", icon: "🌞" },
  { color: "#BA55D3", icon: "🎉" }
];

// Local storage keys
const STORAGE_KEY_PROFILES = 'birthday_divas_profiles';
const STORAGE_KEY_MY_PROFILE = 'birthday_divas_my_profile';
const STORAGE_KEY_THEME = 'birthday_divas_theme';
const STORAGE_KEY_LOGIN = 'birthday_divas_logged_in';

// Initialize data from local storage
let profiles = JSON.parse(localStorage.getItem(STORAGE_KEY_PROFILES) || '[]');
let myProfile = JSON.parse(localStorage.getItem(STORAGE_KEY_MY_PROFILE) || 'null');

// Initialize avatar options
function initializeAvatars() {
  avatars.forEach((avatar, index) => {
    const option = document.createElement('div');
    option.className = 'w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity';
    option.style.backgroundColor = avatar.color;
    option.innerHTML = `<span class="text-xl">${avatar.icon}</span>`;
    option.dataset.index = index;
    option.addEventListener('click', () => selectAvatar(index));
    avatarOptions.appendChild(option);
  });
}

// Theme Management
function setTheme(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark');
    lightIcon.classList.remove('hidden');
    darkIcon.classList.add('hidden');
    siteHeader.classList.remove('header-gradient-light');
    siteHeader.classList.add('header-gradient-dark');
  } else {
    document.documentElement.classList.remove('dark');
    lightIcon.classList.add('hidden');
    darkIcon.classList.remove('hidden');
    siteHeader.classList.add('header-gradient-light');
    siteHeader.classList.remove('header-gradient-dark');
  }
  localStorage.setItem(STORAGE_KEY_THEME, isDark ? 'dark' : 'light');
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
  if (savedTheme) {
    setTheme(savedTheme === 'dark');
  } else {
    // Default to light theme
    setTheme(false);
  }
}

// Authentication Functions
function handleLogin() {
  if (passwordInput.value === CRUISE_PASSWORD) {
    loginScreen.classList.add('hidden');
    mainContent.classList.remove('hidden');
    localStorage.setItem(STORAGE_KEY_LOGIN, 'true');
    renderContacts();
    loadMyProfile();
    startCountdownTimer();
  } else {
    showLoginError();
  }
}

function showLoginError() {
  loginError.classList.remove('hidden');
  setTimeout(() => {
    loginError.classList.add('hidden');
  }, 3000);
}

function handleLogout() {
  localStorage.removeItem(STORAGE_KEY_LOGIN);
  loginScreen.classList.remove('hidden');
  mainContent.classList.add('hidden');
  passwordInput.value = '';
  loginError.classList.add('hidden');
}

function checkPreviousLogin() {
  const wasLoggedIn = localStorage.getItem(STORAGE_KEY_LOGIN);
  if (wasLoggedIn === 'true') {
    loginScreen.classList.add('hidden');
    mainContent.classList.remove('hidden');
    renderContacts();
    loadMyProfile();
    startCountdownTimer();
  }
}

// Navigation Functions
function showSection(targetSection) {
  const sections = [homeSection, infoSection, scheduleSection, contactsSection, profileSection];

  sections.forEach(section => {
    section.classList.add('hidden');
  });

  targetSection.classList.remove('hidden');

  // Hide mobile menu after selection on small screens
  if (window.innerWidth < 768) {
    navContent.classList.add('hidden');
  }

  window.scrollTo(0, 0);
}

// Countdown Timer
function startCountdownTimer() {
  function updateTimer() {
    const now = new Date();
    const diff = CRUISE_DATE - now;

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      document.getElementById('countdown-days').textContent = days;
      document.getElementById('countdown-hours').textContent = hours;
      document.getElementById('countdown-minutes').textContent = minutes;
      document.getElementById('countdown-seconds').textContent = seconds;
    } else {
      // Cruise has started or passed
      document.getElementById('countdown-days').textContent = "0";
      document.getElementById('countdown-hours').textContent = "0";
      document.getElementById('countdown-minutes').textContent = "0";
      document.getElementById('countdown-seconds').textContent = "0";
    }
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

// Avatar Selection
function selectAvatar(index) {
  const avatar = avatars[index];
  avatarPreview.innerHTML = '';
  avatarPreview.style.backgroundColor = avatar.color;

  const iconElement = document.createElement('span');
  iconElement.className = 'text-2xl';
  iconElement.textContent = avatar.icon;
  avatarPreview.appendChild(iconElement);

  avatarOptions.classList.add('hidden');
  avatarPreview.dataset.avatarIndex = index;
}

// Profile Management
function loadMyProfile() {
  if (myProfile) {
    document.getElementById('profile-name').value = myProfile.name || '';
    document.getElementById('profile-cabin').value = myProfile.cabin || '';
    document.getElementById('profile-bio').value = myProfile.bio || '';

    if (myProfile.avatarIndex !== undefined) {
      selectAvatar(myProfile.avatarIndex);
    }
  }
}

function saveProfile(formData) {
  const profile = {
    id: myProfile?.id || Date.now(),
    name: formData.get('name'),
    cabin: formData.get('cabin'),
    bio: formData.get('bio'),
    avatarIndex: parseInt(avatarPreview.dataset.avatarIndex || 0),
    createdAt: myProfile?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Save my profile
  myProfile = profile;
  localStorage.setItem(STORAGE_KEY_MY_PROFILE, JSON.stringify(myProfile));

  // Update profiles list
  const existingIndex = profiles.findIndex(p => p.id === profile.id);
  if (existingIndex >= 0) {
    profiles[existingIndex] = profile;
  } else {
    profiles.push(profile);
  }

  localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  renderContacts();

  return profile;
}

function handleProfileSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const name = formData.get('name')?.trim();

  if (!name) {
    alert('Please enter your name');
    return;
  }

  try {
    saveProfile(formData);
    alert('Profile saved successfully!');
  } catch (error) {
    console.error('Error saving profile:', error);
    alert('Failed to save profile. Please try again.');
  }
}

// Contacts Rendering
function renderContacts() {
  const contactsGrid = document.getElementById('contacts-grid');
  contactsGrid.innerHTML = '';

  if (profiles.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'col-span-full text-center py-6 sm:py-8 text-gray-500';
    emptyMessage.textContent = 'No profiles have been added yet. Be the first!';
    contactsGrid.appendChild(emptyMessage);
    return;
  }

  profiles.forEach(profile => {
    const avatar = avatars[profile.avatarIndex || 0];

    const card = document.createElement('div');
    card.className = 'bg-gray-50 rounded-lg p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow';

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3';
    avatarDiv.style.backgroundColor = avatar.color;

    const iconElement = document.createElement('span');
    iconElement.className = 'text-xl sm:text-2xl';
    iconElement.textContent = avatar.icon;
    avatarDiv.appendChild(iconElement);

    const nameElement = document.createElement('h3');
    nameElement.className = 'font-medium text-base sm:text-lg';
    nameElement.textContent = profile.name;

    // Fixed cabin element - was using nameElement properties
    const cabinElement = document.createElement('p');
    cabinElement.className = 'font-medium text-sm text-blue-600';
    cabinElement.textContent = profile.cabin ? `Cabin: ${profile.cabin}` : '';

    const bioElement = document.createElement('p');
    bioElement.className = 'text-gray-600 text-sm mt-1';
    bioElement.textContent = profile.bio || 'No cruise plans shared yet';

    card.appendChild(avatarDiv);
    card.appendChild(nameElement);

    // Only add cabin element if cabin number exists
    if (profile.cabin) {
      card.appendChild(cabinElement);
    }

    card.appendChild(bioElement);

    contactsGrid.appendChild(card);
  });
}

// Event Listeners
function initializeEventListeners() {
  // Authentication
  loginBtn.addEventListener('click', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  });

  // Theme toggle
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(!isDark);
  });

  // Mobile navigation
  navToggle.addEventListener('click', () => {
    navContent.classList.toggle('hidden');
  });

  // Navigation
  navHome.addEventListener('click', () => showSection(homeSection));
  navInfo.addEventListener('click', () => showSection(infoSection));
  navSchedule.addEventListener('click', () => showSection(scheduleSection));
  navContacts.addEventListener('click', () => showSection(contactsSection));
  navProfile.addEventListener('click', () => showSection(profileSection));

  // Avatar selection
  avatarSelect.addEventListener('click', () => {
    avatarOptions.classList.toggle('hidden');
  });

  // Profile form
  profileForm.addEventListener('submit', handleProfileSubmit);

  // Update form field names for FormData
  document.getElementById('profile-name').name = 'name';
  document.getElementById('profile-cabin').name = 'cabin';
  document.getElementById('profile-bio').name = 'bio';
}

// Application Initialization
function initializeApp() {
  initializeTheme();
  initializeAvatars();
  initializeEventListeners();
  checkPreviousLogin();
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}