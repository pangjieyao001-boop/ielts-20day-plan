
// ===== 状态管理 =====
let currentDay = 1;
let completedTasks = JSON.parse(localStorage.getItem('ielts_completed') || '{}');
let revealedAnswers = JSON.parse(localStorage.getItem('ielts_revealed') || '{}');

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    renderHeader();
    renderProgress();
    renderDaysNav();
    renderAllDays();
    renderResources();
    setupNavigation();
    showDay(1);
});

// ===== 渲染头部 =====
function renderHeader() {
    const header = document.querySelector('.header');
    const totalTasks = PLAN_DATA.reduce((sum, day) => sum + day.tasks.length, 0);
    const practiceTasks = PLAN_DATA.reduce((sum, day) => sum + day.tasks.filter(t => t.type === 'practice').length, 0);
    const videoTasks = PLAN_DATA.reduce((sum, day) => sum + day.tasks.filter(t => t.type === 'video').length, 0);
    const mockTasks = PLAN_DATA.reduce((sum, day) => sum + day.tasks.filter(t => t.type === 'mock').length, 0);
    
    header.innerHTML = `
        <h1>🎯 小羊20天雅思冲6.5-7分计划系统</h1>
        <div class="subtitle">专为5分基础设计 | 听力口语重点突破 | 每日任务分明</div>
        <div class="stats">
            <div class="stat-item">
                <div class="number">20</div>
                <div class="label">天计划</div>
            </div>
            <div class="stat-item">
                <div class="number">${totalTasks}</div>
                <div class="label">总任务</div>
            </div>
            <div class="stat-item">
                <div class="number">${practiceTasks}</div>
                <div class="label">练习题</div>
            </div>
            <div class="stat-item">
                <div class="number">${videoTasks}</div>
                <div class="label">视频课</div>
            </div>
            <div class="stat-item">
                <div class="number">${mockTasks}</div>
                <div class="label">模考</div>
            </div>
        </div>
    `;
}

// ===== 渲染进度条 =====
function renderProgress() {
    const totalTasks = PLAN_DATA.reduce((sum, day) => sum + day.tasks.length, 0);
    const completedCount = Object.values(completedTasks).filter(v => v).length;
    const percent = Math.round((completedCount / totalTasks) * 100);
    
    document.querySelector('.progress-bar').style.width = percent + '%';
    document.querySelector('.progress-text').textContent = `总进度：${completedCount}/${totalTasks} 任务已完成 (${percent}%)`;
}

// ===== 渲染天数导航 =====
function renderDaysNav() {
    const nav = document.querySelector('.days-nav');
    nav.innerHTML = PLAN_DATA.map(day => {
        const allCompleted = day.tasks.every((t, i) => completedTasks[`${day.day}-${i}`]);
        const cls = allCompleted ? 'completed' : (day.day === currentDay ? 'active' : '');
        return `
            <button class="day-btn ${cls}" onclick="showDay(${day.day})">
                <span class="day-num">Day ${day.day}</span>
                <span class="day-title">${day.title.substring(0, 8)}...</span>
            </button>
        `;
    }).join('');
}

// ===== 渲染所有天数内容 =====
function renderAllDays() {
    const container = document.getElementById('days-container');
    container.innerHTML = PLAN_DATA.map(day => `
        <div class="day-content" id="day-${day.day}">
            <div class="day-header">
                <h2>Day ${day.day}: ${day.title}</h2>
                <div class="theme">${day.theme}</div>
                <div class="time">⏱ 建议总时长: ${day.total_time}</div>
            </div>
            <div class="tasks">
                ${day.tasks.map((task, idx) => renderTask(day.day, idx, task)).join('')}
            </div>
        </div>
    `).join('');
}

// ===== 渲染单个任务 =====
function renderTask(dayNum, idx, task) {
    const taskId = `${dayNum}-${idx}`;
    const isCompleted = completedTasks[taskId];
    const typeClass = task.type;
    const badgeClass = 'badge-' + (task.section === 'diagnostic' ? 'diagnostic' : task.type);
    const badgeText = task.type === 'video' ? '视频' : (task.type === 'practice' ? '练习' : (task.type === 'mock' ? '模考' : '复盘'));
    
    let resourcesHtml = '';
    if (task.resources && task.resources.length > 0) {
        resourcesHtml = `
            <div class="resources">
                <div class="resources-title">📚 资源链接：</div>
                <div class="resource-links">
                    ${task.resources.map(r => `<a href="${r.url}" target="_blank" class="resource-link">${r.name}</a>`).join('')}
                </div>
            </div>
        `;
    }
    
    let exerciseHtml = '';
    if (task.exercises) {
        const ex = task.exercises;
        let questionsHtml = '';
        
        if (ex.passage) {
            questionsHtml += `<div style="background:#f8f9fa;padding:12px;border-radius:8px;margin-bottom:15px;line-height:1.8;font-size:0.95em;">${ex.passage}</div>`;
        }
        
        if (ex.questions) {
            questionsHtml += ex.questions.map((q, qidx) => {
                const inputKey = `${taskId}-q${qidx}`;
                if (task.section === 'speaking') {
                    return `
                        <div class="exercise-question">
                            <span class="question-num">${q.num}</span>
                            <span class="question-text">${q.text}</span>
                        </div>
                    `;
                } else {
                    return `
                        <div class="exercise-question">
                            <span class="question-num">${q.num}</span>
                            <span class="question-text">${q.text}</span>
                            <input type="text" class="answer-input" id="${inputKey}" placeholder="输入你的答案...">
                        </div>
                    `;
                }
            }).join('');
        }
        
        const isRevealed = revealedAnswers[taskId];
        const answerSectionClass = isRevealed ? 'revealed' : '';
        
        let answersHtml = '';
        if (ex.answers && ex.answers.length > 0) {
            if (task.section === 'speaking') {
                answersHtml = ex.answers.map((ans, aidx) => `
                    <div class="speaking-answer">${ans.replace(/\n/g, '<br>')}</div>
                `).join('');
            } else {
                answersHtml = `<div class="answer-box"><div class="label">✅ 答案：</div>${ex.answers.map((a, i) => `${i+1}. ${a}`).join('<br>')}</div>`;
            }
        }
        
        let explanationsHtml = '';
        if (ex.explanations && ex.explanations.length > 0) {
            explanationsHtml = `<div class="explanation-box"><div class="label">📖 解析：</div>${ex.explanations.map((e, i) => `${i+1}. ${e}`).join('<br><br>')}</div>`;
        }
        
        let tipsHtml = '';
        if (ex.tips) {
            tipsHtml = `<div class="tips-box"><div class="label">💡 技巧总结：</div>${ex.tips}</div>`;
        }
        
        exerciseHtml = `
            <div class="exercise-section">
                <div class="exercise-instructions">${ex.instructions}</div>
                ${questionsHtml}
                <div style="margin-top:15px;">
                    <button class="btn btn-primary" onclick="revealAnswers('${taskId}')">🔓 我已完成答题，查看答案与解析</button>
                </div>
                <div class="answer-section ${answerSectionClass}" id="answer-${taskId}">
                    ${answersHtml}
                    ${explanationsHtml}
                    ${tipsHtml}
                </div>
            </div>
        `;
    }
    
    return `
        <div class="task-card ${typeClass}">
            <div class="task-header">
                <div class="task-title">${task.title}</div>
                <span class="task-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="task-desc">${task.description}</div>
            <div class="task-meta">
                <span>⏱ ${task.duration}</span>
                <span>📂 ${getSectionName(task.section)}</span>
            </div>
            ${task.note ? `<div style="color:#856404;background:#fff3cd;padding:8px 12px;border-radius:6px;margin-bottom:10px;font-size:0.9em;">💡 ${task.note}</div>` : ''}
            ${resourcesHtml}
            ${exerciseHtml}
            <div style="margin-top:12px;">
                <button class="btn btn-mark ${isCompleted ? 'completed' : ''}" onclick="toggleComplete('${taskId}')">
                    ${isCompleted ? '✅ 已完成' : '☑️ 标记完成'}
                </button>
            </div>
        </div>
    `;
}

function getSectionName(section) {
    const names = {
        'listening': '听力', 'reading': '阅读', 'writing': '写作', 'speaking': '口语',
        'diagnostic': '诊断', 'review': '复盘', 'mock': '模考'
    };
    return names[section] || section;
}

// ===== 显示指定天数 =====
function showDay(day) {
    currentDay = day;
    document.querySelectorAll('.day-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`day-${day}`).classList.add('active');
    document.querySelectorAll('.day-btn').forEach((btn, idx) => {
        btn.classList.toggle('active', idx + 1 === day);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== 切换任务完成状态 =====
function toggleComplete(taskId) {
    completedTasks[taskId] = !completedTasks[taskId];
    localStorage.setItem('ielts_completed', JSON.stringify(completedTasks));
    renderProgress();
    renderDaysNav();
    renderAllDays();
    showDay(currentDay);
}

// ===== 显示答案 =====
function revealAnswers(taskId) {
    revealedAnswers[taskId] = true;
    localStorage.setItem('ielts_revealed', JSON.stringify(revealedAnswers));
    document.getElementById(`answer-${taskId}`).classList.add('revealed');
}

// ===== 渲染资源库 =====
function renderResources() {
    const resources = [
        { category: "B站免费视频", items: [
            { name: "何琼雅思听力网课", url: "https://www.bilibili.com/video/BV1DCtEeeERx", desc: "听力技巧，精听跟读，同义替换" },
            { name: "杨帅雅思口语网课", url: "https://search.bilibili.com/all?keyword=杨帅雅思口语网课", desc: "四次9分获得者，Part 3逻辑训练" },
            { name: "刘洪波雅思阅读网课", url: "https://www.bilibili.com/video/BV1BD4y1u7yF", desc: "阅读真经总纲作者，定位技巧" },
            { name: "Simon雅思写作网课", url: "https://search.bilibili.com/all?keyword=Simon雅思写作网课", desc: "前雅思考官，关键词拆解法，9分范文" },
            { name: "顾家北雅思写作网课", url: "https://search.bilibili.com/all?keyword=顾家北雅思写作网课", desc: "ABC方法，句子准确性" },
            { name: "Tara雅思口语网课", url: "https://search.bilibili.com/all?keyword=Tara雅思口语网课", desc: "地道表达，常用句型" }
        ]},
        { category: "新东方免费资源", items: [
            { name: "新东方雅思官网（剑雅在线练习）", url: "https://ieltscat.xdf.cn/", desc: "剑5-20正版题库，听力/阅读/口语/写作免费做题" },
            { name: "新东方在线雅思网校", url: "https://www.koolearn.com/ke/ielts/", desc: "免费公开课、备考资料" },
            { name: "新东方雅思水平在线测试", url: "https://ielts.koolearn.com/20240528/863955.html", desc: "免费诊断水平" },
            { name: "新东方雅思Pro APP", url: "#", desc: "应用商店搜索'新东方雅思Pro'，剑5-20正版题库" },
            { name: "雅思真题下载", url: "https://ielts.koolearn.com/zt/ysztxz/", desc: "免费真题下载" }
        ]},
        { category: "雅思哥免费资源", items: [
            { name: "雅思哥官网", url: "https://www.ieltsbro.com/", desc: "雅思官方合作伙伴" },
            { name: "雅思哥APP", url: "#", desc: "应用商店搜索'雅思哥'，口语题库、考场回忆、免费刷题" },
            { name: "当季口语题库", url: "https://www.ieltsbro.com/", desc: "换题季更新快" },
            { name: "全球考场回忆", url: "https://www.ieltsbro.com/", desc: "考生一手回忆" },
            { name: "机经Pro", url: "https://www.ieltsbro.com/", desc: "听力128个Part、阅读48个Passage" }
        ]},
        { category: "国外免费权威资源", items: [
            { name: "IELTS Liz", url: "https://ieltsliz.com/", desc: "英国雅思教师，口语模板、写作句型、YouTube视频" },
            { name: "IELTS Simon", url: "https://www.ielts-simon.com/", desc: "前雅思考官，每日博文、范文框架" },
            { name: "IELTS Buddy", url: "http://www.ieltsbuddy.com/", desc: "在线Quiz、语法练习、听力资料" },
            { name: "IELTS Mentor", url: "https://www.ielts-mentor.com/", desc: "海量题库、不同分数段范文" },
            { name: "IELTS Material", url: "https://www.ieltsmaterial.com/", desc: "最新真题PDF、模拟测试" },
            { name: "IELTS Advantage", url: "https://www.ieltsadvantage.com/", desc: "深度写作攻略、学习路线" },
            { name: "ELLLO", url: "https://www.elllo.org/", desc: "英语在线听力实验室，1500+免费听力课" },
            { name: "engoo", url: "https://engoo.com/", desc: "口语练习材料，IELTS Speaking Test Preparation板块" },
            { name: "ieltsonlinetests.com", url: "https://ieltsonlinetests.com/", desc: "在线模拟考试" }
        ]}
    ];
    
    const page = document.getElementById('resources-page');
    page.innerHTML = `
        <h2 style="color:#667eea;margin-bottom:20px;">📚 雅思免费资源库</h2>
        <p style="color:#666;margin-bottom:25px;">以下所有资源均为免费资源，点击链接即可访问。</p>
        ${resources.map(cat => `
            <div class="resource-category">
                <h3>${cat.category}</h3>
                <table class="resource-table">
                    <thead>
                        <tr><th>资源名称</th><th>说明</th><th>链接</th></tr>
                    </thead>
                    <tbody>
                        ${cat.items.map(item => `
                            <tr>
                                <td><strong>${item.name}</strong></td>
                                <td>${item.desc}</td>
                                <td><a href="${item.url}" target="_blank">访问 →</a></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `).join('')}
    `;
}

// ===== 导航切换 =====
function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.dataset.page;
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            if (page === 'plan') {
                document.getElementById('plan-section').style.display = 'block';
                document.getElementById('resources-page').classList.remove('active');
            } else {
                document.getElementById('plan-section').style.display = 'none';
                document.getElementById('resources-page').classList.add('active');
            }
        });
    });
}

// ===== 重置进度 =====
function resetProgress() {
    if (confirm('确定要重置所有进度吗？此操作不可恢复。')) {
        completedTasks = {};
        revealedAnswers = {};
        localStorage.removeItem('ielts_completed');
        localStorage.removeItem('ielts_revealed');
        renderProgress();
        renderDaysNav();
        renderAllDays();
        showDay(1);
    }
}
