import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { 
  getDatabase, 
  ref, 
  onValue, 
  update,
  query,
  orderByChild,
  equalTo
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js";
import { 
  getAuth, 
  signOut 
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

// حالة التطبيق
const state = {
  providers: [],
  filteredProviders: [],
  cities: new Set()
};

// عناصر DOM
const elements = {
  searchInput: document.getElementById('providerSearch'),
  statusFilter: document.getElementById('statusFilter'),
  cityFilter: document.getElementById('cityFilter'),
  providersGrid: document.getElementById('providersGrid'),
  refreshBtn: document.getElementById('refreshBtn')
};

// وظائف المساعدة
const utils = {
  debounce: (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  },
  
  showError: (message) => {
    alert(message);
  },
  
  showSuccess: (message) => {
    alert(message);
  }
};

// تحميل مقدمي الخدمة من Firebase
function loadProviders() {
  try {
    const providersRef = ref(database, 'serviceProviders');
    
    onValue(providersRef, (snapshot) => {
      const providers = snapshot.val() || {};
      state.providers = Object.entries(providers).map(([id, data]) => ({
        id,
        ...data,
        status: data.banned ? 'banned' : (data.verified ? 'verified' : 'active')
      }));
      
      state.cities = new Set();
      state.providers.forEach(provider => {
        if (provider.city) state.cities.add(provider.city);
      });
      
      updateFilters();
      filterProviders();
    });
  } catch (error) {
    utils.showError('حدث خطأ أثناء تحميل مقدمي الخدمة');
    console.error('Load providers error:', error);
  }
}

// تحديث خيارات التصفية
function updateFilters() {
  // تحديث قائمة المدن
  elements.cityFilter.innerHTML = '<option value="all">جميع المدن</option>';
  state.cities.forEach(city => {
    const option = document.createElement('option');
    option.value = city;
    option.textContent = city;
    elements.cityFilter.appendChild(option);
  });
}

// تصفية مقدمي الخدمة حسب البحث والتحديدات
function filterProviders() {
  const searchTerm = elements.searchInput.value.toLowerCase();
  const status = elements.statusFilter.value;
  const city = elements.cityFilter.value;
  
  state.filteredProviders = state.providers.filter(provider => {
    // تصفية حسب الحالة
    if (status !== 'all' && provider.status !== status) return false;
    
    // تصفية حسب المدينة
    if (city !== 'all' && provider.city !== city) return false;
    
    // تصفية حسب البحث
    if (searchTerm) {
      const matchesName = provider.name?.toLowerCase().includes(searchTerm);
      const matchesPhone = provider.phone?.includes(searchTerm);
      const matchesCity = provider.city?.toLowerCase().includes(searchTerm);
      const matchesService = provider.serviceType?.toLowerCase().includes(searchTerm);
      
      if (!matchesName && !matchesPhone && !matchesCity && !matchesService) return false;
    }
    
    return true;
  });
  
  renderProviders();
}

// عرض مقدمي الخدمة في الشبكة
function renderProviders() {
  if (state.filteredProviders.length === 0) {
    elements.providersGrid.innerHTML = '<div class="no-results">لا توجد نتائج مطابقة للبحث</div>';
    return;
  }
  
  elements.providersGrid.innerHTML = '';
  
  state.filteredProviders.forEach(provider => {
    const providerCard = document.createElement('div');
    providerCard.className = 'provider-card';
    
    // حالة الحساب
    const statusDiv = document.createElement('div');
    statusDiv.className = `provider-status status-${provider.status}`;
    statusDiv.textContent = provider.status === 'verified' ? 'موثق' : 
                          provider.status === 'banned' ? 'محظور' : 'نشط';
    
    // معلومات مقدم الخدمة
    const providerContent = document.createElement('div');
    providerContent.className = 'provider-content';
    
    const providerHeader = document.createElement('div');
    providerHeader.className = 'provider-header';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'provider-avatar';
    avatarDiv.textContent = provider.name?.charAt(0) || '?';
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'provider-info';
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'provider-name';
    nameDiv.textContent = provider.name || 'غير معروف';
    
    // إضافة علامة التوثيق إذا كان موثقاً
    if (provider.status === 'verified') {
      const verifiedBadge = document.createElement('span');
      verifiedBadge.className = 'verified-badge';
      verifiedBadge.innerHTML = '<i class="fas fa-check-circle"></i> موثق';
      nameDiv.appendChild(verifiedBadge);
    }
    
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'provider-details';
    
    detailsDiv.innerHTML = `
      <p><i class="fas fa-phone"></i> ${provider.phone || 'غير معروف'}</p>
      <p><i class="fas fa-city"></i> ${provider.city || 'غير معروف'}</p>
      <p><i class="fas fa-scissors"></i> ${provider.serviceType || 'غير محدد'}</p>
      <p><i class="fas fa-map-marker-alt"></i> ${provider.location || 'غير معروف'}</p>
    `;
    
    // أزرار الإجراءات
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'provider-actions';
    
    const verifyBtn = document.createElement('button');
    verifyBtn.className = `btn ${provider.status === 'verified' ? 'btn-outline' : 'btn-primary'}`;
    verifyBtn.innerHTML = `<i class="fas fa-check-circle"></i> ${provider.status === 'verified' ? 'إلغاء التوثيق' : 'توثيق'}`;
    verifyBtn.onclick = () => toggleVerifyProvider(provider);
    
    const banBtn = document.createElement('button');
    banBtn.className = `btn ${provider.status === 'banned' ? 'btn-success' : 'btn-danger'}`;
    banBtn.innerHTML = `<i class="fas fa-ban"></i> ${provider.status === 'banned' ? 'إلغاء الحظر' : 'حظر'}`;
    banBtn.onclick = () => toggleBanProvider(provider);
    
    actionsDiv.appendChild(verifyBtn);
    actionsDiv.appendChild(banBtn);
    
    // بناء البطاقة
    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(detailsDiv);
    providerHeader.appendChild(avatarDiv);
    providerHeader.appendChild(infoDiv);
    providerContent.appendChild(providerHeader);
    providerContent.appendChild(actionsDiv);
    providerCard.appendChild(statusDiv);
    providerCard.appendChild(providerContent);
    
    // إضافة البطاقة للشبكة
    elements.providersGrid.appendChild(providerCard);
  });
}

// توثيق/إلغاء توثيق مقدم الخدمة
async function toggleVerifyProvider(provider) {
  const isVerified = provider.status === 'verified';
  const confirmMessage = isVerified 
    ? `هل أنت متأكد من إلغاء توثيق ${provider.name}؟`
    : `هل أنت متأكد من توثيق ${provider.name}؟`;
  
  if (!confirm(confirmMessage)) return;
  
  try {
    await update(ref(database, `serviceProviders/${provider.id}`), {
      verified: !isVerified
    });
    
    utils.showSuccess(isVerified ? 'تم إلغاء التوثيق بنجاح' : 'تم التوثيق بنجاح');
  } catch (error) {
    utils.showError('حدث خطأ أثناء عملية التوثيق');
    console.error('Verify provider error:', error);
  }
}

// حظر/إلغاء حظر مقدم الخدمة
async function toggleBanProvider(provider) {
  const isBanned = provider.status === 'banned';
  const confirmMessage = isBanned 
    ? `هل أنت متأكد من إلغاء حظر ${provider.name}؟`
    : `هل أنت متأكد من حظر ${provider.name}؟ سيتم إخفاء الحساب من صفحة العملاء.`;
  
  if (!confirm(confirmMessage)) return;
  
  try {
    await update(ref(database, `serviceProviders/${provider.id}`), {
      banned: !isBanned,
      status: isBanned ? 'open' : 'closed'
    });
    
    utils.showSuccess(isBanned ? 'تم إلغاء الحظر بنجاح' : 'تم الحظر بنجاح');
  } catch (error) {
    utils.showError('حدث خطأ أثناء عملية الحظر');
    console.error('Ban provider error:', error);
  }
}

// تسجيل الخروج
async function logout() {
  try {
    await signOut(auth);
    window.location.href = 'index.html';
  } catch (error) {
    utils.showError('حدث خطأ أثناء تسجيل الخروج');
    console.error('Logout error:', error);
  }
}

// تهيئة الأحداث
function init() {
  elements.searchInput.addEventListener('input', utils.debounce(filterProviders, 300));
  elements.statusFilter.addEventListener('change', filterProviders);
  elements.cityFilter.addEventListener('change', filterProviders);
  elements.refreshBtn.addEventListener('click', loadProviders);
  
  // تحميل مقدمي الخدمة عند بدء التشغيل
  loadProviders();
}

// بدء التطبيق
init();

// جعل الدوال متاحة عالمياً للاستدعاء من HTML
window.toggleVerifyProvider = toggleVerifyProvider;
window.toggleBanProvider = toggleBanProvider;
window.logout = logout;
