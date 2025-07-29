// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { 
  getDatabase, 
  ref, 
  set, 
  push, 
  onValue, 
  remove, 
  update,
  get,
  off
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJ4VhGD49H3RNifMf9VCRPnkALAxNpsOU",
  authDomain: "project-2980864980936907935.firebaseapp.com",
  databaseURL: "https://project-2980864980936907935-default-rtdb.firebaseio.com",
  projectId: "project-2980864980936907935",
  storageBucket: "project-2980864980936907935.appspot.com",
  messagingSenderId: "580110751353",
  appId: "1:580110751353:web:8f039f9b34e1709d4126a8",
  measurementId: "G-R3JNPHCFZG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// State management
const state = {
  currentUser: null,
  currentUserType: null,
  serviceProviders: {},
  queueListeners: {},
  providersListener: null,
  currentRating: null
};

// DOM elements
const elements = {
  screens: {
    roleSelection: document.getElementById('roleSelection'),
    clientLogin: document.getElementById('clientLogin'),
    providerLogin: document.getElementById('providerLogin'),
    clientDashboard: document.getElementById('clientDashboard'),
    providerDashboard: document.getElementById('providerDashboard')
  },
  client: {
    name: document.getElementById('clientName'),
    phone: document.getElementById('clientPhone'),
    error: document.getElementById('clientError'),
    avatar: document.getElementById('clientAvatar'),
    bookingContainer: document.getElementById('currentBookingContainer'),
    bookingProvider: document.getElementById('bookingProvider'),
    bookingPosition: document.getElementById('bookingPosition'),
    bookingTime: document.getElementById('bookingTime'),
    cancelBookingBtn: document.getElementById('cancelBookingBtn'),
    providersList: document.getElementById('providersList'),
    citySearch: document.getElementById('citySearch'),
    serviceTypeSearch: document.getElementById('serviceTypeSearch')
  },
  provider: {
    phone: document.getElementById('providerPhone'),
    password: document.getElementById('providerPassword'),
    name: document.getElementById('providerName'),
    newPhone: document.getElementById('newProviderPhone'),
    city: document.getElementById('providerCity'),
    serviceType: document.getElementById('providerServiceType'),
    location: document.getElementById('providerLocation'),
    newPassword: document.getElementById('newProviderPassword'),
    confirmPassword: document.getElementById('confirmProviderPassword'),
    error: document.getElementById('providerError'),
    avatar: document.getElementById('providerAvatar'),
    queue: document.getElementById('providerQueue'),
    statusToggle: document.getElementById('statusToggle'),
    statusText: document.getElementById('statusText'),
    formTitle: document.getElementById('providerFormTitle'),
    loginForm: document.getElementById('providerLoginForm'),
    signupForm: document.getElementById('providerSignupForm')
  },
  rating: {
    container: document.getElementById('ratingContainer'),
    stars: document.querySelectorAll('.stars i'),
    comment: document.getElementById('ratingComment')
  }
};

// Utility functions
const utils = {
  generateId: () => 'id-' + Math.random().toString(36).substr(2, 9),
  
  showError: (element, message) => {
    element.textContent = message;
    element.classList.remove('hidden');
    setTimeout(() => element.classList.add('hidden'), 5000);
  },
  
  validatePhone: (phone) => /^[0-9]{11}$/.test(phone),
  
  clearForm: (formElements) => {
    Object.values(formElements).forEach(element => {
      if (element && element.value) element.value = '';
    });
  },
  
  debounce: (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  },
  
  adjustLayoutForMobile: () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    const roleSelection = document.getElementById('roleSelection');
    const loginContainers = document.querySelectorAll('.login-container');
    const dashboards = document.querySelectorAll('.dashboard');
    
    if (roleSelection) {
      roleSelection.style.minHeight = 'calc(var(--vh, 1vh) * 100)';
    }
    
    loginContainers.forEach(container => {
      container.style.minHeight = 'calc(var(--vh, 1vh) * 100)';
    });
    
    dashboards.forEach(dashboard => {
      dashboard.style.minHeight = 'calc(var(--vh, 1vh) * 100)';
    });
  }
};

// Screen management
function showScreen(screenId) {
  Object.values(elements.screens).forEach(screen => {
    screen.classList.add('hidden');
  });
  elements.screens[screenId].classList.remove('hidden');
  
  window.scrollTo(0, 0);
  utils.adjustLayoutForMobile();
}

// Provider form management
function showProviderSignup() {
  elements.provider.formTitle.innerHTML = '<i class="fas fa-user-plus"></i> إنشاء حساب مقدم خدمة جديد';
  elements.provider.loginForm.classList.add('hidden');
  elements.provider.signupForm.classList.remove('hidden');
}

function showProviderLogin() {
  elements.provider.formTitle.innerHTML = '<i class="fas fa-cut"></i> تسجيل الدخول لمقدمي الخدمة';
  elements.provider.signupForm.classList.add('hidden');
  elements.provider.loginForm.classList.remove('hidden');
}

// Authentication functions
async function clientLogin() {
  const name = elements.client.name.value.trim();
  const phone = elements.client.phone.value.trim();
  const rememberMe = document.getElementById('rememberMeClient').checked;
  
  if (!name) {
    utils.showError(elements.client.error, 'الرجاء إدخال الاسم');
    return;
  }
  
  if (!phone || !utils.validatePhone(phone)) {
    utils.showError(elements.client.error, 'الرجاء إدخال رقم هاتف صحيح (11 رقمًا بالضبط)');
    return;
  }
  
  try {
    const savedData = JSON.parse(localStorage.getItem('client_data')) || {};
    const clientId = savedData.clientId || utils.generateId();
    
    state.currentUser = {
      id: clientId,
      name,
      phone,
      type: 'client'
    };
    state.currentUserType = 'client';
    
    elements.client.avatar.textContent = name.charAt(0);
    showClientDashboard();
    await loadServiceProviders();
    
    await checkExistingBooking();
    
    if (rememberMe) {
      localStorage.setItem('client_data', JSON.stringify({ 
        name, 
        phone, 
        remember: true,
        clientId: state.currentUser.id,
        booking: state.currentUser.booking
      }));
    } else {
      localStorage.removeItem('client_data');
    }
  } catch (error) {
    utils.showError(elements.client.error, 'حدث خطأ أثناء تسجيل الدخول');
    console.error('Client login error:', error);
  }
}

async function providerSignup() {
  const { name, newPhone, city, serviceType, location, newPassword, confirmPassword, error } = elements.provider;
  
  if (!name.value || !newPhone.value || !city.value || !serviceType.value || !location.value || !newPassword.value || !confirmPassword.value) {
    utils.showError(error, 'جميع الحقول مطلوبة');
    return;
  }
  
  if (!utils.validatePhone(newPhone.value)) {
    utils.showError(error, 'رقم الهاتف يجب أن يكون 11 رقمًا بالضبط');
    return;
  }
  
  if (newPassword.value.length < 6) {
    utils.showError(error, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    return;
  }
  
  if (newPassword.value !== confirmPassword.value) {
    utils.showError(error, 'كلمتا المرور غير متطابقتين');
    return;
  }
  
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      `${newPhone.value}@provider.com`, 
      newPassword.value
    );
    
    await set(ref(database, 'serviceProviders/' + userCredential.user.uid), {
      name: name.value,
      phone: newPhone.value,
      city: city.value,
      serviceType: serviceType.value,
      location: location.value,
      status: 'open',
      queue: {},
      averageRating: 0,
      ratingCount: 0,
      verified: false,
      banned: false // إضافة حالة الحظر الافتراضية
    });
    
    state.currentUser = {
      id: userCredential.user.uid,
      name: name.value,
      phone: newPhone.value,
      city: city.value,
      serviceType: serviceType.value,
      location: location.value,
      type: 'provider'
    };
    
    elements.provider.avatar.textContent = name.value.charAt(0);
    showProviderDashboard();
    loadProviderQueue();
    
    utils.clearForm({
      name: name,
      newPhone: newPhone,
      city: city,
      serviceType: serviceType,
      location: location,
      newPassword: newPassword,
      confirmPassword: confirmPassword
    });
    
  } catch (error) {
    let errorMessage = 'حدث خطأ أثناء إنشاء الحساب';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'هذا الرقم مسجل بالفعل، يرجى تسجيل الدخول';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'رقم الهاتف غير صالح';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'كلمة المرور ضعيفة جداً';
    }
    
    utils.showError(elements.provider.error, errorMessage);
    console.error('Provider signup error:', error);
  }
}

async function providerLogin() {
  const { phone, password, error } = elements.provider;
  const rememberMe = document.getElementById('rememberMeProvider').checked;
  
  if (!phone.value || !password.value) {
    utils.showError(error, 'رقم الهاتف وكلمة المرور مطلوبان');
    return;
  }
  
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      `${phone.value}@provider.com`,
      password.value
    );
    
    if (rememberMe) {
      localStorage.setItem('provider_login', JSON.stringify({
        phone: phone.value,
        password: password.value,
        remember: true
      }));
    } else {
      localStorage.removeItem('provider_login');
    }
    
    const providerRef = ref(database, 'serviceProviders/' + userCredential.user.uid);
    const snapshot = await get(providerRef);
    
    if (snapshot.exists()) {
      const providerData = snapshot.val();
      
      // التحقق من حالة الحظر قبل السماح بتسجيل الدخول
      if (providerData.banned) {
        utils.showError(error, 'هذا الحساب محظور ولا يمكن الدخول إليه');
        await signOut(auth);
        return;
      }
      
      state.currentUser = {
        id: userCredential.user.uid,
        name: providerData.name,
        phone: providerData.phone,
        city: providerData.city,
        serviceType: providerData.serviceType,
        location: providerData.location,
        type: 'provider',
        verified: providerData.verified || false
      };
      
      elements.provider.avatar.textContent = providerData.name.charAt(0);
      showProviderDashboard();
      loadProviderQueue();
      
      utils.clearForm({
        phone: phone,
        password: password
      });
    } else {
      utils.showError(error, 'بيانات مقدم الخدمة غير موجودة');
      await signOut(auth);
    }
    
  } catch (error) {
    let errorMessage = 'بيانات الدخول غير صحيحة';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'لا يوجد حساب مرتبط بهذا الرقم';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'كلمة المرور غير صحيحة';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'تم تجاوز عدد المحاولات المسموح بها، يرجى المحاولة لاحقاً';
    }
    
    utils.showError(elements.provider.error, errorMessage);
    console.error('Provider login error:', error);
  }
}

// Dashboard functions
function showClientDashboard() {
  showScreen('clientDashboard');
}

function showProviderDashboard() {
  showScreen('providerDashboard');
  
  onValue(ref(database, 'serviceProviders/' + state.currentUser.id + '/status'), (snapshot) => {
    const status = snapshot.val() || 'open';
    elements.provider.statusToggle.checked = status === 'open';
    elements.provider.statusText.textContent = status === 'open' ? 'مفتوح' : 'مغلق';
  });
  
  elements.provider.statusToggle.addEventListener('change', function() {
    const newStatus = this.checked ? 'open' : 'closed';
    update(ref(database, 'serviceProviders/' + state.currentUser.id), { status: newStatus });
  });
}

// Service Providers management
async function loadServiceProviders() {
  elements.client.providersList.innerHTML = '<div class="loading">جارٍ تحميل قائمة مقدمي الخدمة...</div>';
  
  if (state.providersListener) {
    off(state.providersListener);
  }
  
  state.providersListener = onValue(ref(database, 'serviceProviders'), (snapshot) => {
    state.serviceProviders = snapshot.val() || {};
    renderProvidersList();
  }, (error) => {
    elements.client.providersList.innerHTML = '<div class="error">حدث خطأ أثناء تحميل مقدمي الخدمة</div>';
    console.error('Load providers error:', error);
  });
}

function renderProvidersList() {
  if (!elements.client.providersList) return;
  
  elements.client.providersList.innerHTML = '';
  
  if (!state.serviceProviders || Object.keys(state.serviceProviders).length === 0) {
    elements.client.providersList.innerHTML = '<div class="no-results">لا يوجد مقدمي خدمة مسجلون حالياً</div>';
    return;
  }
  
  // تصفية الحسابات المحظورة قبل الفرز
  const sortedProviders = Object.entries(state.serviceProviders)
    .filter(([id, provider]) => !provider.banned) // هذه هي الإضافة المهمة
    .sort(([, a], [, b]) => (b.averageRating || 0) - (a.averageRating || 0));
  
  sortedProviders.forEach(([id, provider], index) => {
    const isTopRated = index < 3 && provider.averageRating >= 4;
    const hasBooking = state.currentUser?.booking;
    const isCurrentProvider = state.currentUser?.booking?.providerId === id;
    const isSamePhone = provider.queue && Object.values(provider.queue).some(booking => 
      booking.clientPhone === state.currentUser?.phone
    );
    
    // علامة التوثيق
    const verifiedBadge = provider.verified ? 
      '<span class="verified-badge"><i class="fas fa-check-circle"></i> موثق</span>' : '';
    
    const providerCard = document.createElement('div');
    providerCard.className = `provider-card ${isTopRated ? 'top-rated' : ''}`;
    
    const statusClass = provider.status === 'open' ? 'status-open' : 'status-closed';
    const statusText = provider.status === 'open' ? 'مفتوح' : 'مغلق';
    const queueLength = provider.queue ? Object.keys(provider.queue).length : 0;
    
    const ratingStars = provider.averageRating ? 
      `<div class="provider-rating">
        ${'<i class="fas fa-star"></i>'.repeat(Math.round(provider.averageRating))}
        <span class="provider-rating-count">(${provider.ratingCount || 0})</span>
      </div>` : '';
    
    providerCard.innerHTML = `
      <div class="provider-info">
        <div class="provider-header">
          <div class="provider-avatar">${provider.name.charAt(0)}</div>
          <div class="provider-name">${provider.name} ${verifiedBadge}</div>
        </div>
        <div class="provider-status ${statusClass}">${statusText}</div>
        ${ratingStars}
        <div class="provider-details">
          <div><i class="fas fa-city"></i> المدينة: <span class="city-name">${provider.city || 'غير متوفر'}</span></div>
          <div><i class="fas fa-scissors"></i> نوع الخدمة: <span class="service-type">${provider.serviceType || 'غير محدد'}</span></div>
          <div><i class="fas fa-phone"></i> رقم الهاتف: ${provider.phone || 'غير متوفر'}</div>
          <div><i class="fas fa-map-marker-alt"></i> الموقع: <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.location)}" target="_blank" class="location-link">${provider.location || 'غير متوفر'}</a></div>
          <div><i class="fas fa-users"></i> عدد المنتظرين: ${queueLength}</div>
        </div>
      </div>
      <button class="book-btn" ${isSamePhone ? 'disabled' : ''}" 
              onclick="${isSamePhone ? '' : `bookAppointment('${id}', '${provider.name.replace(/'/g, "\\'")}')`}">
        ${isSamePhone ? '<i class="fas fa-calendar-times"></i> لديك حجز بهذا الرقم' : 
          (hasBooking && isCurrentProvider ? '<i class="fas fa-calendar-check"></i> لديك حجز هنا' : 
          '<i class="fas fa-calendar-plus"></i> احجز الآن')}
      </button>
    `;
    
    elements.client.providersList.appendChild(providerCard);
  });
}

// Booking management
async function bookAppointment(providerId, providerName) {
  if (!state.currentUser) return;

  // التحقق من وجود حجز بنفس رقم الهاتف
  const providerRef = ref(database, `serviceProviders/${providerId}/queue`);
  const snapshot = await get(providerRef);
  const queue = snapshot.val() || {};

  const hasBookingWithSamePhone = Object.values(queue).some(booking => 
    booking.clientPhone === state.currentUser.phone
  );

  if (hasBookingWithSamePhone) {
    renderProvidersList();
    return;
  }

  if (state.currentUser.booking && state.currentUser.booking.providerId !== providerId) {
    return;
  }

  try {
    const newBookingRef = push(ref(database, `serviceProviders/${providerId}/queue`));
    await set(newBookingRef, {
      clientId: state.currentUser.id,
      clientName: state.currentUser.name,
      clientPhone: state.currentUser.phone,
      timestamp: Date.now()
    });
    
    const bookingData = {
      providerId,
      providerName,
      bookingId: newBookingRef.key,
      timestamp: new Date().toLocaleString('ar-EG')
    };
    
    state.currentUser.booking = bookingData;
    
    const savedData = JSON.parse(localStorage.getItem('client_data')) || {};
    savedData.booking = bookingData;
    localStorage.setItem('client_data', JSON.stringify(savedData));
    
    showCurrentBooking();
    renderProvidersList();
  } catch (error) {
    console.error('Booking error:', error);
  }
}

async function checkExistingBooking() {
  if (!state.currentUser || state.currentUser.type !== 'client') return;
  
  const savedData = JSON.parse(localStorage.getItem('client_data')) || {};
  if (savedData.booking) {
    state.currentUser.booking = savedData.booking;
    showCurrentBooking();
    return;
  }
  
  for (const [providerId, provider] of Object.entries(state.serviceProviders)) {
    if (provider.queue && !provider.banned) { // إضافة شرط !provider.banned
      for (const [bookingId, booking] of Object.entries(provider.queue)) {
        if (booking.clientId === state.currentUser.id || booking.clientPhone === state.currentUser.phone) {
          const bookingData = {
            providerId,
            providerName: provider.name,
            bookingId,
            timestamp: new Date(booking.timestamp).toLocaleString('ar-EG')
          };
          
          state.currentUser.booking = bookingData;
          
          const savedData = JSON.parse(localStorage.getItem('client_data')) || {};
          savedData.booking = bookingData;
          localStorage.setItem('client_data', JSON.stringify(savedData));
          
          showCurrentBooking();
          return;
        }
      }
    }
  }
}

function showCurrentBooking() {
  if (!state.currentUser?.booking) return;
  
  const { booking } = state.currentUser;
  elements.client.bookingProvider.textContent = booking.providerName;
  elements.client.bookingTime.textContent = booking.timestamp;
  
  if (state.queueListeners[booking.providerId]) {
    off(state.queueListeners[booking.providerId]);
  }
  
  state.queueListeners[booking.providerId] = onValue(
    ref(database, `serviceProviders/${booking.providerId}/queue`), 
    (snapshot) => {
      const queue = snapshot.val() || {};
      const queueArray = Object.entries(queue).map(([key, value]) => ({
        id: key,
        ...value
      })).sort((a, b) => a.timestamp - b.timestamp);
      
      const position = queueArray.findIndex(item => item.id === booking.bookingId) + 1;
      elements.client.bookingPosition.textContent = position > 0 ? position : '--';
    },
    (error) => {
      console.error('Queue listener error:', error);
    }
  );
  
  elements.client.bookingContainer.classList.remove('hidden');
  elements.client.cancelBookingBtn.onclick = cancelBooking;
}

async function cancelBooking() {
  if (!state.currentUser?.booking) return;
  
  const { providerId, bookingId } = state.currentUser.booking;
  
  if (!confirm('هل أنت متأكد من إلغاء الحجز؟')) return;
  
  try {
    await remove(ref(database, `serviceProviders/${providerId}/queue/${bookingId}`));
    
    delete state.currentUser.booking;
    const savedData = JSON.parse(localStorage.getItem('client_data')) || {};
    delete savedData.booking;
    localStorage.setItem('client_data', JSON.stringify(savedData));
    
    elements.client.bookingContainer.classList.add('hidden');
    renderProvidersList();
  } catch (error) {
    console.error('Cancel booking error:', error);
  }
}

// Rating system
function setupRatingStars() {
  elements.rating.stars.forEach(star => {
    star.addEventListener('click', function() {
      const rating = parseInt(this.getAttribute('data-rating'));
      elements.rating.stars.forEach((s, i) => {
        if (i < rating) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
      state.currentRating = rating;
    });
  });
}

async function submitRating() {
  if (!state.currentRating || !state.currentUser?.booking) return;
  
  try {
    const ratingData = {
      providerId: state.currentUser.booking.providerId,
      clientId: state.currentUser.id,
      clientName: state.currentUser.name,
      rating: state.currentRating,
      comment: elements.rating.comment.value.trim(),
      timestamp: Date.now()
    };
    
    await push(ref(database, `ratings/${state.currentUser.booking.providerId}`), ratingData);
    await updateProviderRating(state.currentUser.booking.providerId);
    
    elements.rating.container.classList.add('hidden');
    
    elements.rating.stars.forEach(star => star.classList.remove('active'));
    elements.rating.comment.value = '';
    state.currentRating = null;
    
  } catch (error) {
    console.error('Rating submission error:', error);
  }
}

async function updateProviderRating(providerId) {
  const ratingsRef = ref(database, `ratings/${providerId}`);
  const snapshot = await get(ratingsRef);
  
  if (!snapshot.exists()) return;
  
  const ratings = snapshot.val();
  const ratingsArray = Object.values(ratings);
  const totalRatings = ratingsArray.length;
  const sumRatings = ratingsArray.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = sumRatings / totalRatings;
  
  await update(ref(database, `serviceProviders/${providerId}`), {
    averageRating: averageRating.toFixed(1),
    ratingCount: totalRatings
  });
}

function showRatingForm() {
  elements.rating.container.classList.remove('hidden');
}

// Queue management
async function loadProviderQueue() {
  if (!state.currentUser || state.currentUser.type !== 'provider') return;
  
  elements.provider.queue.innerHTML = '<li class="loading">جارٍ تحميل قائمة الانتظار...</li>';
  
  const queueRef = ref(database, `serviceProviders/${state.currentUser.id}/queue`);
  
  if (state.queueListeners[state.currentUser.id]) {
    off(state.queueListeners[state.currentUser.id]);
  }
  
  state.queueListeners[state.currentUser.id] = onValue(queueRef, (snapshot) => {
    const queue = snapshot.val() || {};
    elements.provider.queue.innerHTML = '';
    
    if (Object.keys(queue).length === 0) {
      elements.provider.queue.innerHTML = '<li class="no-clients">لا يوجد عملاء في قائمة الانتظار</li>';
      return;
    }
    
    const queueArray = Object.entries(queue).map(([key, value]) => ({
      id: key,
      ...value
    })).sort((a, b) => a.timestamp - b.timestamp);
    
    queueArray.forEach((booking, index) => {
      const queueItem = document.createElement('li');
      queueItem.className = 'queue-item';
      
      queueItem.innerHTML = `
        <div class="queue-info">
          <div class="queue-position">الرقم ${index + 1}</div>
          <div class="queue-name">${booking.clientName}</div>
          <div class="queue-phone">${booking.clientPhone || 'غير متوفر'}</div>
          <div class="queue-time">${new Date(booking.timestamp).toLocaleString('ar-EG')}</div>
        </div>
        ${index === 0 ? `
          <button class="delete-btn" onclick="completeClient('${state.currentUser.id}', '${booking.id}')">
            <i class="fas fa-check"></i>
          </button>
        ` : ''}
      `;
      
      elements.provider.queue.appendChild(queueItem);
    });
  }, (error) => {
    elements.provider.queue.innerHTML = '<li class="error">حدث خطأ أثناء تحميل قائمة الانتظار</li>';
    console.error('Load queue error:', error);
  });
}

async function completeClient(providerId, bookingId) {
  if (!confirm('هل أنتهيت من خدمة هذا العميل؟')) return;
  
  try {
    const bookingRef = ref(database, `serviceProviders/${providerId}/queue/${bookingId}`);
    const snapshot = await get(bookingRef);
    
    await remove(bookingRef);
    
    if (state.currentUser?.booking?.bookingId === bookingId) {
      showRatingForm();
    }
  } catch (error) {
    console.error('Complete client error:', error);
  }
}

// Search functionality
function filterProviders() {
  const cityTerm = elements.client.citySearch.value.trim().toLowerCase();
  const serviceTypeTerm = elements.client.serviceTypeSearch.value.trim().toLowerCase();
  const providerCards = document.querySelectorAll('.provider-card');
  
  if (!cityTerm && !serviceTypeTerm) {
    providerCards.forEach(card => card.style.display = 'flex');
    return;
  }
  
  let hasResults = false;
  
  providerCards.forEach(card => {
    const cityElement = card.querySelector('.city-name');
    const serviceTypeElement = card.querySelector('.service-type');
    const nameElement = card.querySelector('.provider-name');
    
    if (cityElement && serviceTypeElement && nameElement) {
      const city = cityElement.textContent.toLowerCase();
      const serviceType = serviceTypeElement.textContent.toLowerCase();
      const name = nameElement.textContent.toLowerCase();
      
      const cityMatch = city.includes(cityTerm);
      const serviceTypeMatch = serviceType.includes(serviceTypeTerm);
      
      if ((!cityTerm || cityMatch) && (!serviceTypeTerm || serviceTypeMatch)) {
        card.style.display = 'flex';
        hasResults = true;
        
        if (cityTerm && cityMatch) {
          cityElement.innerHTML = city.replace(
            new RegExp(cityTerm, 'gi'), 
            match => `<span class="highlight">${match}</span>`
          );
        }
        
        if (serviceTypeTerm && serviceTypeMatch) {
          serviceTypeElement.innerHTML = serviceType.replace(
            new RegExp(serviceTypeTerm, 'gi'), 
            match => `<span class="highlight">${match}</span>`
          );
        }
      } else {
        card.style.display = 'none';
      }
    }
  });
  
  if (!hasResults) {
    elements.client.providersList.innerHTML = '<div class="no-results">لا توجد نتائج مطابقة للبحث</div>';
  }
}

// Logout function
async function logout() {
  try {
    Object.values(state.queueListeners).forEach(off);
    if (state.providersListener) off(state.providersListener);
    
    if (state.currentUser?.booking) {
      const savedData = JSON.parse(localStorage.getItem('client_data')) || {};
      savedData.booking = state.currentUser.booking;
      localStorage.setItem('client_data', JSON.stringify(savedData));
    }
    
    await signOut(auth);
    state.currentUser = null;
    state.currentUserType = null;
    state.queueListeners = {};
    state.providersListener = null;
    state.currentRating = null;
    
    utils.clearForm(elements.client);
    utils.clearForm(elements.provider);
    
    showScreen('roleSelection');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Initialize app
function init() {
  elements.client.citySearch.addEventListener('input', utils.debounce(filterProviders, 300));
  elements.client.serviceTypeSearch.addEventListener('input', utils.debounce(filterProviders, 300));
  
  setupRatingStars();
  
  const savedProviderLogin = JSON.parse(localStorage.getItem('provider_login'));
  if (savedProviderLogin) {
    elements.provider.phone.value = savedProviderLogin.phone;
    elements.provider.password.value = savedProviderLogin.password;
    document.getElementById('rememberMeProvider').checked = true;
  }
  
  const savedClientData = JSON.parse(localStorage.getItem('client_data'));
  if (savedClientData) {
    elements.client.name.value = savedClientData.name;
    elements.client.phone.value = savedClientData.phone;
    document.getElementById('rememberMeClient').checked = true;
  }
  
  window.showScreen = showScreen;
  window.clientLogin = clientLogin;
  window.providerLogin = providerLogin;
  window.providerSignup = providerSignup;
  window.showProviderSignup = showProviderSignup;
  window.showProviderLogin = showProviderLogin;
  window.bookAppointment = bookAppointment;
  window.completeClient = completeClient;
  window.filterProviders = filterProviders;
  window.logout = logout;
  window.cancelBooking = cancelBooking;
  window.submitRating = submitRating;
  
  onAuthStateChanged(auth, (user) => {
    if (user && state.currentUserType === 'provider') {
      showProviderDashboard();
      loadProviderQueue();
    }
  });
  
  utils.adjustLayoutForMobile();
  window.addEventListener('resize', utils.adjustLayoutForMobile);
  
  showScreen('roleSelection');
}

// Start the app
init();
