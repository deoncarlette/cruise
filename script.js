// Simple version - uses config.js (created differently for local vs production)
function initializeCruiseApp() {
  console.log('Initializing cruise app...');

  // Check if config is available
  if (!window.CRUISE_CONFIG) {
    console.log("Checking for configuration...");
    console.error('Configuration not loaded - window.CRUISE_CONFIG is undefined');
    console.log('Make sure config.js is loaded before this script');
    return;
  }

  console.log('Configuration loaded successfully');

  // Get configuration
  const config = window.CRUISE_CONFIG;
  const CRUISE_PASSWORD = config.CRUISE_PASSWORD;
  const CRUISE_DATE = config.CRUISE_DATE;
  const SUPABASE_URL = config.SUPABASE_URL;
  const SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;

  console.log('Using password:', CRUISE_PASSWORD);
  console.log('Using cruise date:', CRUISE_DATE);

  // Initialize Supabase client only if credentials are available
  let supabase = null;
  if (SUPABASE_URL && SUPABASE_ANON_KEY &&
    SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE') {

    // Load Supabase from CDN if not already loaded
    if (!window.supabase) {
      console.log('Loading Supabase from CDN...');
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = () => {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized from CDN');
      };
      document.head.appendChild(script);
    } else {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('Supabase initialized');
    }
  } else {
    console.log('Supabase not initialized - using localStorage only');
  }

  // DOM Elements
  const loginScreen = document.getElementById('login-screen');
  const mainContent = document.getElementById('main-content');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const passwordInput = document.getElementById('password');
  const loginError = document.getElementById('login-error');

  // Navigation elements
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

  // Check if essential elements exist
  if (!loginScreen || !mainContent || !loginBtn) {
    console.error('Essential DOM elements not found');
    return;
  }

  // Avatar options
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

  // Storage keys
  const STORAGE_KEY_PROFILES = 'birthday_divas_profiles';
  const STORAGE_KEY_MY_PROFILE = 'birthday_divas_my_profile';
  const STORAGE_KEY_THEME = 'birthday_divas_theme';
  const STORAGE_KEY_LOGIN = 'birthday_divas_logged_in';

  // Initialize data
  let profiles = [];
  let myProfile = JSON.parse(localStorage.getItem(STORAGE_KEY_MY_PROFILE) || 'null');
  let supabaseChannel = null;
  let currentSection = 'home';

  // Supabase Functions
  async function saveProfileToSupabase(profile) {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await supabase
      .from('cruise_profiles')
      .upsert([
        {
          id: profile.id,
          name: profile.name,
          cabin: profile.cabin || null,
          bio: profile.bio || null,
          avatar_index: profile.avatarIndex,
          updated_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return data;
  }

  async function loadProfilesFromSupabase() {
    if (!supabase) {
      console.warn('Supabase not available, using localStorage');
      return JSON.parse(localStorage.getItem(STORAGE_KEY_PROFILES) || '[]');
    }

    try {
      const { data, error } = await supabase
        .from('cruise_profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      profiles = data.map(profile => ({
        id: profile.id,
        name: profile.name,
        cabin: profile.cabin,
        bio: profile.bio,
        avatarIndex: profile.avatar_index
      }));

      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
      return profiles;
    } catch (error) {
      console.error('Error loading from Supabase:', error);
      return JSON.parse(localStorage.getItem(STORAGE_KEY_PROFILES) || '[]');
    }
  }

  function subscribeToProfileUpdates() {
    if (!supabase) return;

    if (supabaseChannel) {
      supabase.removeChannel(supabaseChannel);
    }

    supabaseChannel = supabase.channel('cruise-profiles-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cruise_profiles'
      }, async (payload) => {
        console.log('Profile update received:', payload);
        await loadProfilesFromSupabase();
        renderContacts();
      })
      .subscribe();

    return supabaseChannel;
  }

  // Initialize avatars
  function initializeAvatars() {
    if (!avatarOptions) return;

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
      if (lightIcon) lightIcon.classList.remove('hidden');
      if (darkIcon) darkIcon.classList.add('hidden');
      if (siteHeader) {
        siteHeader.classList.remove('header-gradient-light');
        siteHeader.classList.add('header-gradient-dark');
      }
    } else {
      document.documentElement.classList.remove('dark');
      if (lightIcon) lightIcon.classList.add('hidden');
      if (darkIcon) darkIcon.classList.remove('hidden');
      if (siteHeader) {
        siteHeader.classList.add('header-gradient-light');
        siteHeader.classList.remove('header-gradient-dark');
      }
    }
    localStorage.setItem(STORAGE_KEY_THEME, isDark ? 'dark' : 'light');
  }

  function initializeTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    if (savedTheme) {
      setTheme(savedTheme === 'dark');
    } else {
      setTheme(false);
    }
  }

  // Authentication Functions
  async function handleLogin() {
    console.log('Login button clicked');

    if (!passwordInput || !loginScreen || !mainContent) {
      console.error('Required elements not found for login');
      return;
    }

    const enteredPassword = passwordInput.value;
    console.log('Entered password:', enteredPassword);
    console.log('Expected password:', CRUISE_PASSWORD);

    if (enteredPassword === CRUISE_PASSWORD) {
      console.log('Password correct, logging in...');

      loginScreen.classList.add('hidden');
      mainContent.classList.remove('hidden');
      localStorage.setItem(STORAGE_KEY_LOGIN, 'true');

      await initializeSupabase();
      loadMyProfile();
      startCountdownTimer();
      showSection(homeSection);

      console.log('Login successful');
    } else {
      console.log('Password incorrect, showing error');
      showLoginError();
    }
  }

  function showLoginError() {
    if (!loginError) return;
    loginError.classList.remove('hidden');
    setTimeout(() => {
      loginError.classList.add('hidden');
    }, 3000);
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY_LOGIN);
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (mainContent) mainContent.classList.add('hidden');
    if (passwordInput) passwordInput.value = '';
    if (loginError) loginError.classList.add('hidden');

    if (supabaseChannel && supabase) {
      supabase.removeChannel(supabaseChannel);
      supabaseChannel = null;
    }
  }

  async function checkPreviousLogin() {
    const wasLoggedIn = localStorage.getItem(STORAGE_KEY_LOGIN);
    console.log('Previous login status:', wasLoggedIn);

    if (wasLoggedIn === 'true') {
      console.log('User was previously logged in, skipping login screen');
      if (loginScreen) loginScreen.classList.add('hidden');
      if (mainContent) mainContent.classList.remove('hidden');
      await initializeSupabase();
      loadMyProfile();
      startCountdownTimer();
      showSection(homeSection);
    } else {
      console.log('User not previously logged in, showing login screen');
    }
  }

  async function initializeSupabase() {
    try {
      await loadProfilesFromSupabase();
      renderContacts();
      subscribeToProfileUpdates();
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      profiles = JSON.parse(localStorage.getItem(STORAGE_KEY_PROFILES) || '[]');
      renderContacts();
    }
  }

  // Navigation Functions
  function updateNavActiveState(activeButton) {
    const navButtons = [navHome, navInfo, navSchedule, navContacts, navProfile];
    navButtons.forEach(button => {
      if (button) {
        button.classList.remove('active', 'cruise-blue-text', 'font-bold');
        button.style.color = '';
        button.style.fontWeight = '';
      }
    });

    if (activeButton) {
      activeButton.classList.add('active', 'cruise-blue-text', 'font-bold');
    }
  }

  function showSection(targetSection) {
    if (!targetSection) return;

    const sections = [homeSection, infoSection, scheduleSection, contactsSection, profileSection];

    sections.forEach(section => {
      if (section) section.classList.add('hidden');
    });

    targetSection.classList.remove('hidden');

    // Update navigation active state
    if (targetSection === homeSection) {
      updateNavActiveState(navHome);
      currentSection = 'home';
    } else if (targetSection === infoSection) {
      updateNavActiveState(navInfo);
      currentSection = 'info';
    } else if (targetSection === scheduleSection) {
      updateNavActiveState(navSchedule);
      currentSection = 'schedule';
    } else if (targetSection === contactsSection) {
      updateNavActiveState(navContacts);
      currentSection = 'contacts';
    } else if (targetSection === profileSection) {
      updateNavActiveState(navProfile);
      currentSection = 'profile';
    }

    // Hide mobile nav on section change
    if (window.innerWidth < 768 && navContent) {
      navContent.classList.add('hidden');
    }

    window.scrollTo(0, 0);
  }

  // Countdown Timer
  function startCountdownTimer() {
    function updateTimer() {
      const now = new Date();
      const diff = CRUISE_DATE - now;

      const daysEl = document.getElementById('countdown-days');
      const hoursEl = document.getElementById('countdown-hours');
      const minutesEl = document.getElementById('countdown-minutes');
      const secondsEl = document.getElementById('countdown-seconds');

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (daysEl) daysEl.textContent = days;
        if (hoursEl) hoursEl.textContent = hours;
        if (minutesEl) minutesEl.textContent = minutes;
        if (secondsEl) secondsEl.textContent = seconds;
      } else {
        if (daysEl) daysEl.textContent = "0";
        if (hoursEl) hoursEl.textContent = "0";
        if (minutesEl) minutesEl.textContent = "0";
        if (secondsEl) secondsEl.textContent = "0";
      }
    }

    updateTimer();
    setInterval(updateTimer, 1000);
  }

  // Avatar Selection
  function selectAvatar(index) {
    if (!avatarPreview) return;

    const avatar = avatars[index];
    avatarPreview.innerHTML = '';
    avatarPreview.style.backgroundColor = avatar.color;

    const iconElement = document.createElement('span');
    iconElement.className = 'text-2xl';
    iconElement.textContent = avatar.icon;
    avatarPreview.appendChild(iconElement);

    if (avatarOptions) avatarOptions.classList.add('hidden');
    avatarPreview.dataset.avatarIndex = index;
  }

  // Profile Management
  function loadMyProfile() {
    if (myProfile) {
      const nameEl = document.getElementById('profile-name');
      const cabinEl = document.getElementById('profile-cabin');
      const bioEl = document.getElementById('profile-bio');

      if (nameEl) nameEl.value = myProfile.name || '';
      if (cabinEl) cabinEl.value = myProfile.cabin || '';
      if (bioEl) bioEl.value = myProfile.bio || '';

      if (myProfile.avatarIndex !== undefined) {
        selectAvatar(myProfile.avatarIndex);
      }
    }
  }

  async function saveProfile(formData) {
    const profile = {
      id: myProfile?.id || Date.now(),
      name: formData.get('name'),
      cabin: formData.get('cabin'),
      bio: formData.get('bio'),
      avatarIndex: parseInt(avatarPreview?.dataset.avatarIndex || 0),
      createdAt: myProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveProfileToSupabase(profile);

      myProfile = profile;
      localStorage.setItem(STORAGE_KEY_MY_PROFILE, JSON.stringify(myProfile));

      const existingIndex = profiles.findIndex(p => p.id === profile.id);
      if (existingIndex >= 0) {
        profiles[existingIndex] = profile;
      } else {
        profiles.push(profile);
      }

      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
      renderContacts();

      return profile;
    } catch (error) {
      console.error('Failed to save to Supabase, using localStorage:', error);

      myProfile = profile;
      localStorage.setItem(STORAGE_KEY_MY_PROFILE, JSON.stringify(myProfile));

      const existingIndex = profiles.findIndex(p => p.id === profile.id);
      if (existingIndex >= 0) {
        profiles[existingIndex] = profile;
      } else {
        profiles.push(profile);
      }

      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
      renderContacts();

      throw error;
    }
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const name = formData.get('name')?.trim();

    if (!name) {
      alert('Please enter your name');
      return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Saving...';
      submitBtn.disabled = true;

      try {
        await saveProfile(formData);
        alert('Profile saved successfully!');
      } catch (error) {
        console.error('Error saving profile:', error);
        alert('Failed to save to cloud, but saved locally. Please try again when you have internet connection.');
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    }
  }

  // Contacts Rendering
  function renderContacts() {
    const contactsGrid = document.getElementById('contacts-grid');
    if (!contactsGrid) return;

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

      const cabinElement = document.createElement('p');
      cabinElement.className = 'font-medium text-sm text-blue-600';
      cabinElement.textContent = profile.cabin ? `Cabin: ${profile.cabin}` : '';

      const bioElement = document.createElement('p');
      bioElement.className = 'text-gray-600 text-sm mt-1';
      bioElement.textContent = profile.bio || 'No cruise plans shared yet';

      card.appendChild(avatarDiv);
      card.appendChild(nameElement);

      if (profile.cabin) {
        card.appendChild(cabinElement);
      }

      card.appendChild(bioElement);
      contactsGrid.appendChild(card);
    });
  }

  // Event Listeners
  function initializeEventListeners() {
    console.log('Initializing event listeners...');

    // Authentication
    if (loginBtn) {
      console.log('Adding login button event listener');
      loginBtn.addEventListener('click', handleLogin);
    } else {
      console.error('Login button not found');
    }

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (passwordInput) {
      passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          console.log('Enter key pressed in password field');
          handleLogin();
        }
      });
    }

    // Theme toggle
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark');
        setTheme(!isDark);
      });
    }

    // Mobile navigation
    if (navToggle && navContent) {
      navToggle.addEventListener('click', () => {
        navContent.classList.toggle('hidden');
      });
    }

    // Navigation
    if (navHome) navHome.addEventListener('click', () => showSection(homeSection));
    if (navInfo) navInfo.addEventListener('click', () => showSection(infoSection));
    if (navSchedule) navSchedule.addEventListener('click', () => showSection(scheduleSection));
    if (navContacts) navContacts.addEventListener('click', () => showSection(contactsSection));
    if (navProfile) navProfile.addEventListener('click', () => showSection(profileSection));

    // Avatar selection
    if (avatarSelect && avatarOptions) {
      avatarSelect.addEventListener('click', () => {
        avatarOptions.classList.toggle('hidden');
      });
    }

    // Profile form
    if (profileForm) {
      profileForm.addEventListener('submit', handleProfileSubmit);

      // Set form field names
      const nameField = document.getElementById('profile-name');
      const cabinField = document.getElementById('profile-cabin');
      const bioField = document.getElementById('profile-bio');

      if (nameField) nameField.name = 'name';
      if (cabinField) cabinField.name = 'cabin';
      if (bioField) bioField.name = 'bio';
    }

    console.log('Event listeners initialized');
  }

  // Initialize everything
  function init() {
    console.log('Starting initialization...');
    initializeTheme();
    initializeAvatars();
    initializeEventListeners();

    // Set initial active state for home
    updateNavActiveState(navHome);

    checkPreviousLogin();
    console.log('Initialization complete');
  }

  // Start the app
  init();
}

// Wait for DOM to be ready
console.log('Script loaded, waiting for DOM...');
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    initializeCruiseApp();
  });
} else {
  // DOM is already ready
  console.log('DOM already ready, initializing app...');
  initializeCruiseApp();
}