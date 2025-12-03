// script.js
document.addEventListener('DOMContentLoaded', function() {
    // ----- بيانات 30 عملية: 10 عادية + 10 تسوية + 10 إقفال -----
    const operations = [
        {id:1, type:'عادية', description:'شراء أجهزة حاسوب نقداً بمبلغ 50,000 جنيه', entries:[{account:'أ. الأجهزة الحاسوب (أصول)', debit:50000, credit:0}, {account:'أ. النقدية', debit:0, credit:50000}]},
        {id:2, type:'عادية', description:'شراء بضاعة بالآجل من شركة النور بقيمة 30,000 جنيه', entries:[{account:'أ. البضاعة (مخزون)', debit:30000, credit:0}, {account:'أ. الدائنون (شركة النور)', debit:0, credit:30000}]},
        {id:3, type:'عادية', description:'بيع بضاعة نقداً بمبلغ 25,000 جنيه - تكلفتها 15,000 جنيه', entries:[{account:'أ. النقدية', debit:25000, credit:0}, {account:'أ. البضاعة (مخزون)', debit:0, credit:15000}, {account:'أ. ربح المبيع', debit:0, credit:10000}]},
        {id:4, type:'عادية', description:'سداد لشركة النور نقداً 10,000 جنيه', entries:[{account:'أ. الدائنون (شركة النور)', debit:10000, credit:0}, {account:'أ. النقدية', debit:0, credit:10000}]},
        {id:5, type:'عادية', description:'تحصيل إيراد خدمات نقداً 8,000 جنيه', entries:[{account:'أ. النقدية', debit:8000, credit:0}, {account:'أ. إيراد الخدمات', debit:0, credit:8000}]},
        {id:6, type:'عادية', description:'شراء أثاث مكتبي بالآجل 12,000 جنيه', entries:[{account:'أ. الأثاث المكتبي (أصول)', debit:12000, credit:0}, {account:'أ. الدائنون', debit:0, credit:12000}]},
        {id:7, type:'عادية', description:'سداد مصروف إيجار نقداً 3,000 جنيه', entries:[{account:'أ. مصروف الإيجار', debit:3000, credit:0}, {account:'أ. النقدية', debit:0, credit:3000}]},
        {id:8, type:'عادية', description:'تحصيل مدين نقداً 5,000 جنيه', entries:[{account:'أ. النقدية', debit:5000, credit:0}, {account:'أ. المدينون', debit:0, credit:5000}]},
        {id:9, type:'عادية', description:'شراء مواد مكتبية نقداً 1,500 جنيه', entries:[{account:'أ. مصروف المواد المكتبية', debit:1500, credit:0}, {account:'أ. النقدية', debit:0, credit:1500}]},
        {id:10, type:'عادية', description:'بيع أصل ثابت نقداً 40,000 جنيه - القيمة الدفترية 35,000 جنيه', entries:[{account:'أ. النقدية', debit:40000, credit:0}, {account:'أ. الأصل الثابت (سيارة)', debit:0, credit:35000}, {account:'أ. ربح بيع الأصل', debit:0, credit:5000}]},
        {id:11, type:'تسوية', description:'تسوية مصروفات مستحقة بقيمة 2,500 جنيه', entries:[{account:'أ. مصروفات مستحقة', debit:2500, credit:0}, {account:'أ. المستحقات', debit:0, credit:2500}]},
        {id:12, type:'تسوية', description:'قيد إهلاك للأصول 1,200 جنيه', entries:[{account:'أ. مصروف الإهلاك', debit:1200, credit:0}, {account:'أ. مجمع إهلاك', debit:0, credit:1200}]},
        {id:13, type:'تسوية', description:'مصاريف مدفوعة مقدماً تم تخصيصها 600 جنيه', entries:[{account:'أ. مصروفات مدفوعة مقدماً', debit:0, credit:600}, {account:'أ. مصروف الفترة', debit:600, credit:0}]},
        {id:14, type:'تسوية', description:'تسوية إيرادات مقدمة 900 جنيه إلى إيراد مكتسب', entries:[{account:'أ. إيرادات مقدمة', debit:900, credit:0}, {account:'أ. إيراد مكتسب', debit:0, credit:900}]},
        {id:15, type:'تسوية', description:'تسوية مصروفات مرتبطة بالإيرادات (تكاليف) 1,500 جنيه', entries:[{account:'أ. مصروف التكاليف', debit:1500, credit:0}, {account:'أ. حسابات مستحقة الدفع', debit:0, credit:1500}]},
        {id:16, type:'تسوية', description:'تسوية مكافآت مستحقة 2,200 جنيه', entries:[{account:'أ. مصروف المكافآت', debit:2200, credit:0}, {account:'أ. المستحقات', debit:0, credit:2200}]},
        {id:17, type:'تسوية', description:'تسوية مصروفات فائدة مستحقة 750 جنيه', entries:[{account:'أ. مصروف الفوائد', debit:750, credit:0}, {account:'أ. الفوائد المستحقة', debit:0, credit:750}]},
        {id:18, type:'تسوية', description:'تسوية مصروفات ضريبة دخل مستحقة 3,000 جنيه', entries:[{account:'أ. مصروف ضريبة الدخل', debit:3000, credit:0}, {account:'أ. ضريبة مستحقة', debit:0, credit:3000}]},
        {id:19, type:'تسوية', description:'تسوية مصروفات تأمين مستحقة 1,100 جنيه', entries:[{account:'أ. مصروف التأمين', debit:1100, credit:0}, {account:'أ. التأمين المستحق', debit:0, credit:1100}]},
        {id:20, type:'تسوية', description:'تسوية مخصص ديون مشكوك في تحصيلها 900 جنيه', entries:[{account:'أ. مخصص الديون المشكوك فيها', debit:900, credit:0}, {account:'أ. مخصصات خسائر الائتمان', debit:0, credit:900}]},
        {id:21, type:'إقفال', description:'قيد إقفال مصروفات الإيجار - نقل إلى ملخص الأرباح', entries:[{account:'أ. ملخص الأرباح والخسائر', debit:3000, credit:0}, {account:'أ. مصروف الإيجار', debit:0, credit:3000}]},
        {id:22, type:'إقفال', description:'قيد إقفال مصروفات الرواتب - نقل إلى ملخص الأرباح', entries:[{account:'أ. ملخص الأرباح والخسائر', debit:5000, credit:0}, {account:'أ. مصروف الرواتب', debit:0, credit:5000}]},
        {id:23, type:'إقفال', description:'قيد إقفال إيرادات المبيعات - نقل إلى ملخص الأرباح', entries:[{account:'أ. إيراد المبيعات', debit:40000, credit:0}, {account:'أ. ملخص الأرباح والخسائر', debit:0, credit:40000}]},
        {id:24, type:'إقفال', description:'قيد إقفال إيراد الخدمات - نقل إلى ملخص الأرباح', entries:[{account:'أ. إيراد الخدمات', debit:8000, credit:0}, {account:'أ. ملخص الأرباح والخسائر', debit:0, credit:8000}]},
        {id:25, type:'إقفال', description:'نقل صافي الربح إلى حساب رأس المال 10,000 جنيه', entries:[{account:'أ. ملخص الأرباح والخسائر', debit:10000, credit:0}, {account:'أ. رأس المال', debit:0, credit:10000}]},
        {id:26, type:'إقفال', description:'قيد إقفال مصروف مصاريف الدعاية 1,200 جنيه', entries:[{account:'أ. ملخص الأرباح والخسائر', debit:1200, credit:0}, {account:'أ. مصروف الدعاية', debit:0, credit:1200}]},
        {id:27, type:'إقفال', description:'قيد إقفال مصروف المرافق 600 جنيه', entries:[{account:'أ. ملخص الأرباح والخسائر', debit:600, credit:0}, {account:'أ. مصروف المرافق', debit:0, credit:600}]},
        {id:28, type:'إقفال', description:'قيد إقفال مصروف الاهلاك 1,200 جنيه', entries:[{account:'أ. ملخص الأرباح والخسائر', debit:1200, credit:0}, {account:'أ. مصروف الإهلاك', debit:0, credit:1200}]},
        {id:29, type:'إقفال', description:'قيد إقفال مصروف الفوائد 750 جنيه', entries:[{account:'أ. ملخص الأرباح والخسائر', debit:750, credit:0}, {account:'أ. مصروف الفوائد', debit:0, credit:750}]},
        {id:30, type:'إقفال', description:'قيد إقفال مصروفات أخرى 900 جنيه', entries:[{account:'أ. ملخص الأرباح والخسائر', debit:900, credit:0}, {account:'أ. مصروفات أخرى', debit:0, credit:900}]}
    ];

    // ----- متغيرات التتبع -----
    let currentIndex = 0;
    let correctScore = 0;
    let incorrectScore = 0;
    let totalAttempts = 0;

    // ----- عناصر DOM -----
    const operationDescEl = document.getElementById('operationDesc');
    const operationTypeEl = document.getElementById('operationType');
    const journalArea = document.getElementById('journalArea');
    const correctScoreEl = document.getElementById('correctScore');
    const incorrectScoreEl = document.getElementById('incorrectScore');
    const totalAttemptsEl = document.getElementById('totalAttempts');
    const progressEl = document.getElementById('progress');
    const currentIndexEl = document.getElementById('currentIndex');
    const totalOpsEl = document.getElementById('totalOps');
    const resultEl = document.getElementById('result');
    const correctAnswerEl = document.getElementById('correctAnswer');

    const checkBtn = document.getElementById('checkBtn');
    const showAnswerBtn = document.getElementById('showAnswerBtn');
    const nextBtn = document.getElementById('nextBtn');
    const clearBtn = document.getElementById('clearBtn');

    // تهيئة إجمالي العمليات
    totalOpsEl.textContent = operations.length;

    // ----- وظائف التطبيق -----
    
    // تحميل العملية الحالية
    function loadOperation(i) {
        const op = operations[i];
        operationDescEl.textContent = op.description;
        operationTypeEl.textContent = 'نوع العملية: ' + op.type;
        currentIndexEl.textContent = i + 1;
        updateProgress();

        // بناء الحقول الديناميكية بحسب عدد الحسابات في القيد
        journalArea.innerHTML = '';
        op.entries.forEach((entry, idx) => {
            const row = document.createElement('div');
            row.className = 'entry-row';
            row.innerHTML = `
                <div class="label">${entry.account}</div>
                <div class="amounts">
                    <input type="number" min="0" step="0.01" inputmode="numeric" placeholder="مدين" data-idx="${idx}" data-side="debit" aria-label="قيمة المدين لـ ${entry.account}">
                    <input type="number" min="0" step="0.01" inputmode="numeric" placeholder="دائن" data-idx="${idx}" data-side="credit" aria-label="قيمة الدائن لـ ${entry.account}">
                </div>
            `;
            journalArea.appendChild(row);
        });

        // إعادة تعيين الرسائل
        resultEl.style.display = 'none';
        correctAnswerEl.style.display = 'none';
    }

    // تحديث شريط التقدم
    function updateProgress() {
        const pct = ((currentIndex + 1) / operations.length) * 100;
        progressEl.style.width = pct + '%';
    }

    // جمع بيانات المستخدم من الحقول
    function getUserEntries() {
        const inputs = journalArea.querySelectorAll('input');
        const grouped = {};
        
        inputs.forEach(inp => {
            const idx = inp.dataset.idx;
            const side = inp.dataset.side; // 'debit' or 'credit'
            const val = parseFloat(inp.value) || 0;
            
            if (!grouped[idx]) grouped[idx] = { debit: 0, credit: 0 };
            grouped[idx][side] = val;
        });
        
        // تحويل إلى مصفوفة مرتبة بحسب index
        const arr = Object.keys(grouped)
            .sort((a, b) => a - b)
            .map(k => grouped[k]);
            
        return arr;
    }

    // مسح الحقول
    function clearFields() {
        const inputs = journalArea.querySelectorAll('input');
        inputs.forEach(i => i.value = '');
        resultEl.style.display = 'none';
        correctAnswerEl.style.display = 'none';
        
        // إرجاع التركيز إلى أول حقل
        if (inputs.length > 0) {
            inputs[0].focus();
        }
    }

    // تحقق من توازن القيد ومقارنة مع القيد الصحيح
    function checkEntry() {
        const op = operations[currentIndex];
        const user = getUserEntries();

        // حساب المجموع
        const totalDebitUser = user.reduce((s, e) => s + (e.debit || 0), 0);
        const totalCreditUser = user.reduce((s, e) => s + (e.credit || 0), 0);

        let isCorrect = true;

        // شرط: توازن المدين والدائن
        if (Math.abs(totalDebitUser - totalCreditUser) > 0.001) {
            isCorrect = false;
        }

        // شرط: القيم لكل سطر مطابقه
        for (let i = 0; i < op.entries.length; i++) {
            const u = user[i] || { debit: 0, credit: 0 };
            const c = op.entries[i] || { debit: 0, credit: 0 };
            
            if (Math.abs(u.debit - c.debit) > 0.001 || Math.abs(u.credit - c.credit) > 0.001) {
                isCorrect = false;
                break;
            }
        }

        // تحديث الإحصائيات
        totalAttempts++;
        totalAttemptsEl.textContent = totalAttempts;

        // عرض النتيجة
        if (isCorrect) {
            correctScore++;
            correctScoreEl.textContent = correctScore;
            resultEl.textContent = '✓ القيد صحيح — أحسنت!';
            resultEl.className = 'result correct';
            resultEl.style.display = 'block';
            
            // تحديث صوتي للنتيجة الصحيحة
            resultEl.setAttribute('aria-label', 'القيد صحيح أحسنت');
        } else {
            incorrectScore++;
            incorrectScoreEl.textContent = incorrectScore;
            resultEl.textContent = '✗ القيد غير صحيح — تحقق من التوازن أو القيم.';
            resultEl.className = 'result incorrect';
            resultEl.style.display = 'block';
            
            // تحديث صوتي للنتيجة غير الصحيحة
            resultEl.setAttribute('aria-label', 'القيد غير صحيح تحقق من التوازن أو القيم');
        }
        
        // تمرير التركيز إلى نتيجة التحقق لمساعدة مستخدمي قارئات الشاشة
        resultEl.focus({preventScroll: true});
    }

    // عرض الاجابة الصحيحة
    function showCorrectAnswer() {
        const op = operations[currentIndex];
        let html = '<h3 style="margin-bottom:10px; color:#1f3a58;">القيد الصحيح:</h3>';
        
        op.entries.forEach(e => {
            html += `<div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items
