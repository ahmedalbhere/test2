// Import Firebase modules
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

// Firebase configuration (يجب أن يكون نفس إعدادات التطبيق الرئيسي)
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
  accounts: [],
  filteredAccounts: [],
  currentAccount: null,
  cities: new Set()
};

// عناصر DOM
const elements = {
  searchInput: document.getElementById('accountSearch'),
  accountTypeFilter: document.getElementById('accountTypeFilter'),
  statusFilter: document.getElementById('statusFilter'),
  cityFilter: document.getElementById('cityFilter'),
  accountsTableBody: document.getElementById('accountsTableBody'),
  totalAccounts: document.getElementById('totalAccounts'),
  activeAccounts: document.getElementById('activeAccounts'),
  bannedAccounts: document.getElementById('bannedAccounts'),
  reportedAccounts: document.getElementById('reportedAccounts'),
  refreshBtn: document.getElementById('refreshBtn'),
  accountModal: document.getElementById('accountModal'),
  modalAccountName: document.getElementById('modalAccountName'),
  modalAccountAvatar: document.getElementById('modalAccountAvatar'),
  modalAccountPhone: document.getElementById('modalAccountPhone'),
  modalAccountType: document.getElementById('modalAccountType'),
  modalAccountCity: document.getElementById('modalAccountCity'),
  modalAccountDate: document.getElementById('modalAccountDate'),
  modalAccountStatus: document.getElementById('modalAccountStatus'),
  accountReportsList: document.getElementById('accountReportsList'),
  banAccountBtn: document.getElementById('banAccountBtn'),
  unbanAccountBtn: document.getElementById('unbanAccountBtn'),
  warnAccountBtn: document.getElementById('warnAccountBtn'),
  accountReportsSection: document.getElementById('accountReportsSection')
};

// وظائف المساعدة
const utils = {
  formatDate: (timestamp) => {
    if (!timestamp) return 'غير معروف';
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  debounce: (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  },
  
  showError: (message) => {
    alert(message); // يمكن استبدال هذا بنظام تنبيهات أفضل
  }
};

// تحميل الحسابات من Firebase
async function loadAccounts() {
  try {
    const accountsRef = ref(database, 'serviceProviders');
    const clientsRef = ref(database, 'clients');
    
    // جلب مقدمي الخدمة
    onValue(accountsRef, (snapshot) => {
      const providers = snapshot.val() || {};
      const providerAccounts = Object.entries(providers).map(([id, data]) => ({
        id,
        ...data,
        type: 'provider',
        status: data.banned ? 'banned' : (data.reportedCount > 0 ? 'reported' : 'active')
      }));
      
      // جلب العملاء (إذا كان لديك جدول عملاء)
      onValue(clientsRef, (snapshot) => {
        const clients = snapshot.val() || {};
        const clientAccounts = Object.entries(clients).map(([id, data]) => ({
          id,
          ...data,
          type: 'client',
          status: data.banned ? 'banned' : (data.reportedCount > 0 ? 'reported' : 'active')
        }));
        
        // دمج الحسابات
        state.accounts = [...providerAccounts, ...clientAccounts];
        state.cities = new Set();
        
        // استخراج المدن الفريدة
        state.accounts.forEach(account => {
          if (account.city) state.cities.add(account.city);
        });
        
        updateFilters();
        filterAccounts();
      });
    });
  } catch (error) {
    utils.showError('حدث خطأ أثناء تحميل الحسابات');
    console.error('Load accounts error:', error);
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
  
  // تحديث الإحصائيات
  updateStats();
}

// تحديث الإحصائيات
function updateStats() {
  const total = state.accounts.length;
  const active = state.accounts.filter(a => a.status === 'active').length;
  const banned = state.accounts.filter(a => a.status === 'banned').length;
  const reported = state.accounts.filter(a => a.status === 'reported').length;
  
  elements.totalAccounts.textContent = total;
  elements.activeAccounts.textContent = active;
  elements.bannedAccounts.textContent = banned;
  elements.reportedAccounts.textContent = reported;
}

// تصفية الحسابات حسب البحث والتحديدات
function filterAccounts() {
  const searchTerm = elements.searchInput.value.toLowerCase();
  const accountType = elements.accountTypeFilter.value;
  const status = elements.statusFilter.value;
  const city = elements.cityFilter.value;
  
  state.filteredAccounts = state.accounts.filter(account => {
    // تصفية حسب نوع الحساب
    if (accountType !== 'all' && account.type !== accountType) return false;
    
    // تصفية حسب الحالة
    if (status !== 'all' && account.status !== status) return false;
    
    // تصفية حسب المدينة
    if (city !== 'all' && account.city !== city) return false;
    
    // تصفية حسب البحث
    if (searchTerm) {
      const matchesName = account.name?.toLowerCase().includes(searchTerm);
      const matchesPhone = account.phone?.includes(searchTerm);
      const matchesCity = account.city?.toLowerCase().includes(searchTerm);
      
      if (!matchesName && !matchesPhone && !matchesCity) return false;
    }
    
    return true;
  });
  
  renderAccountsTable();
}

// عرض الحسابات في الجدول
function renderAccountsTable() {
  elements.accountsTableBody.innerHTML = '';
  
  if (state.filteredAccounts.length === 0) {
    elements.accountsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="no-results">لا توجد حسابات مطابقة للبحث</td>
      </tr>
    `;
    return;
  }
  
  state.filteredAccounts.forEach(account => {
    const row = document.createElement('tr');
    
    // صورة الحساب
    const avatarCell = document.createElement('td');
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'account-avatar';
    avatarDiv.textContent = account.name?.charAt(0) || '?';
    avatarCell.appendChild(avatarDiv);
    
    // الاسم
    const nameCell = document.createElement('td');
    nameCell.textContent = account.name || 'غير معروف';
    
    // رقم الهاتف
    const phoneCell = document.createElement('td');
    phoneCell.textContent = account.phone || 'غير معروف';
    
    // نوع الحساب
    const typeCell = document.createElement('td');
    typeCell.textContent = account.type === 'provider' ? 'مقدم خدمة' : 'زبون';
    
    // المدينة
    const cityCell = document.createElement('td');
    cityCell.textContent = account.city || 'غير معروف';
    
    // الحالة
    const statusCell = document.createElement('td');
    const statusSpan = document.createElement('span');
    statusSpan.className = `account-status status-${account.status}`;
    
    switch (account.status) {
      case 'active':
        statusSpan.textContent = 'نشط';
        break;
      case 'banned':
        statusSpan.textContent = 'محظور';
        break;
      case 'reported':
        statusSpan.textContent = 'مبلغ عنه';
        break;
      default:
        statusSpan.textContent = 'غير معروف';
    }
    
    statusCell.appendChild(statusSpan);
    
    // الإجراءات
    const actionsCell = document.createElement('td');
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'actions';
    
    const viewBtn = document.createElement('button');
    viewBtn.className = 'action-btn view-btn';
    viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
    viewBtn.title = 'عرض التفاصيل';
    viewBtn.onclick = () => showAccountDetails(account);
    
    const banBtn = document.createElement('button');
    banBtn.className = 'action-btn ban-btn';
    banBtn.innerHTML = '<i class="fas fa-ban"></i>';
    banBtn.title = account.status === 'banned' ? 'إلغاء الحظر' : 'حظر الحساب';
    banBtn.onclick = (e) => {
      e.stopPropagation();
      toggleBanAccount(account);
    };
    
    actionsDiv.appendChild(viewBtn);
    actionsDiv.appendChild(banBtn);
    
    // إضافة زر الإنذار لمقدمي الخدمة المبلغ عنهم
    if (account.type === 'provider' && account.status === 'reported') {
      const warnBtn = document.createElement('button');
      warnBtn.className = 'action-btn warn-btn';
      warnBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
      warnBtn.title = 'إرسال إنذار';
      warnBtn.onclick = (e) => {
        e.stopPropagation();
        sendWarning(account);
      };
      actionsDiv.appendChild(warnBtn);
    }
    
    actionsCell.appendChild(actionsDiv);
    
    // بناء الصف
    row.appendChild(avatarCell);
    row.appendChild(nameCell);
    row.appendChild(phoneCell);
    row.appendChild(typeCell);
    row.appendChild(cityCell);
    row.appendChild(statusCell);
    row.appendChild(actionsCell);
    
    // إضافة الصف للجدول
    elements.accountsTableBody.appendChild(row);
  });
}

// عرض تفاصيل الحساب في النافذة المنبثقة
function showAccountDetails(account) {
  state.currentAccount = account;
  
  // تعبئة البيانات الأساسية
  elements.modalAccountName.textContent = account.name || 'غير معروف';
  elements.modalAccountAvatar.textContent = account.name?.charAt(0) || '?';
  elements.modalAccountPhone.textContent = account.phone || 'غير معروف';
  elements.modalAccountType.textContent = account.type === 'provider' ? 'مقدم خدمة' : 'زبون';
  elements.modalAccountCity.textContent = account.city || 'غير معروف';
  elements.modalAccountDate.textContent = utils.formatDate(account.createdAt);
  
  // تحديث حالة الحساب
  const statusText = account.status === 'banned' ? 'محظور' : 
                   account.status === 'reported' ? 'مبلغ عنه' : 'نشط';
  
  elements.modalAccountStatus.textContent = statusText;
  
  // تحديث أزرار الحظر/إلغاء الحظر
  if (account.status === 'banned') {
    elements.banAccountBtn.classList.add('hidden');
    elements.unbanAccountBtn.classList.remove('hidden');
  } else {
    elements.banAccountBtn.classList.remove('hidden');
    elements.unbanAccountBtn.classList.add('hidden');
  }
  
  // تحميل البلاغات (إذا وجدت)
  loadAccountReports(account.id);
  
  // عرض النافذة المنبثقة
  elements.accountModal.classList.add('active');
}

// إغلاق النافذة المنبثقة
function closeModal() {
  elements.accountModal.classList.remove('active');
  state.currentAccount = null;
}

// تحميل البلاغات على الحساب
function loadAccountReports(accountId) {
  const reportsRef = ref(database, `reports/${accountId}`);
  
  onValue(reportsRef, (snapshot) => {
    const reports = snapshot.val() || {};
    elements.accountReportsList.innerHTML = '';
    
    if (Object.keys(reports).length === 0) {
      elements.accountReportsSection.classList.add('hidden');
      return;
    }
    
    elements.accountReportsSection.classList.remove('hidden');
    
    Object.entries(reports).forEach(([id, report]) => {
      const reportItem = document.createElement('li');
      reportItem.className = 'report-item';
      
      reportItem.innerHTML = `
        <p><strong>سبب البلاغ:</strong> ${report.reason || 'غير محدد'}</p>
        <p>${report.details || 'لا توجد تفاصيل إضافية'}</p>
        <div class="report-meta">
          <span>${utils.formatDate(report.timestamp)}</span>
          <span>بواسطة: ${report.reporterName || 'مجهول'}</span>
        </div>
      `;
      
      elements.accountReportsList.appendChild(reportItem);
    });
  });
}

// حظر/إلغاء حظر الحساب
async function toggleBanAccount(account) {
  if (!confirm(`هل
