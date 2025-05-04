function updateUrlStatus(li, isAccessible, duration) {
    const statusBadge = li.querySelector('.status-badge');
    const msDisplay = li.querySelector('.ms-display');
    li.classList.remove('disabled');

    let statusClass;
    if (isAccessible) {
        statusBadge.textContent = '正常';
        statusClass = 'status-normal';
    } else {
        li.classList.add('disabled');
        statusBadge.textContent = '无法访问';
        statusClass = 'status-error';
    }

    statusBadge.className = `status-badge ${statusClass}`;
    msDisplay.textContent = duration + 'ms';
    msDisplay.className = `ms-display ms-${statusClass.split('-')[1]}`;
}

function checkUrl(url, li) {
    return new Promise((resolve) => {
        const img = new Image();
        let isResolved = false;
        const startTime = performance.now();

        const timeoutId = setTimeout(() => {
            if (!isResolved) {
                updateUrlStatus(li, false, 5000);
                isResolved = true;
                resolve(false);
            }
        }, 5000); // 5秒超时

        img.onload = function() {
            if (!isResolved) {
                clearTimeout(timeoutId);
                const endTime = performance.now();
                const duration = Math.round(endTime - startTime);
                updateUrlStatus(li, true, duration);
                isResolved = true;
                resolve(true);
            }
        };

        img.onerror = function() {
            if (!isResolved) {
                clearTimeout(timeoutId);
                const endTime = performance.now();
                const duration = Math.round(endTime - startTime);
                updateUrlStatus(li, false, duration);
                isResolved = true;
                resolve(false);
            }
        };

        // 添加一个随机参数来避免缓存
        img.src = url + '/favicon.ico?' + new Date().getTime();
    });
}

async function checkAllUrls() {
    const urlList = document.getElementById('url-list');
    const listItems = urlList.querySelectorAll('li');
    let accessibleCount = 0;
    let inaccessibleCount = 0;

    const checkPromises = Array.from(listItems).map(li => {
        const url = li.dataset.url;
        const statusBadge = li.querySelector('.status-badge');
        const msDisplay = li.querySelector('.ms-display');
        statusBadge.textContent = '检测中...';
        statusBadge.className = 'status-badge status-checking';
        msDisplay.className = 'ms-display ms-checking';
        msDisplay.textContent = '-ms';
        return checkUrl(url, li);
    });

    const results = await Promise.all(checkPromises);
    results.forEach(isAccessible => {
        if (isAccessible) {
            accessibleCount++;
        } else {
            inaccessibleCount++;
        }
    });

    updateLastCheckedTimeAndStats(accessibleCount, inaccessibleCount);
}

function updateLastCheckedTimeAndStats(accessibleCount, inaccessibleCount) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();

    document.getElementById('stats-container').innerHTML = `
        <div id="last-checked-time">
            <i class="fas fa-clock icon-clock"></i> 最后检测时间: ${timeString}
        </div>
        <div class="stats-row">
            <div class="stat-item">
                <div class="stat-value">
                    <i class="fas fa-check icon-check"></i>${accessibleCount}
                </div>
                <div class="stat-label">正常数量</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">
                    <i class="fas fa-times icon-times"></i>${inaccessibleCount}
                </div>
                <div class="stat-label">无法访问数量</div>
            </div>
        </div>
    `;
}

// 初始检查
checkAllUrls();

// 每1分钟检查一次
setInterval(checkAllUrls, 60 * 1000);

// 暗黑模式切换
const modeToggle = document.getElementById('mode-toggle');
const body = document.body;
const icon = modeToggle.querySelector('i');

function setDarkMode(isDark) {
    if (isDark) {
        body.classList.add('dark-mode');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('darkMode', 'enabled');
    } else {
        body.classList.remove('dark-mode');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('darkMode', 'disabled');
    }
}

function checkSystemPreference() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function initializeDarkMode() {
    const userPreference = localStorage.getItem('darkMode');
    if (userPreference === 'enabled') {
        setDarkMode(true);
    } else if (userPreference === 'disabled') {
        setDarkMode(false);
    } else {
        setDarkMode(checkSystemPreference());
    }
}

// 初始化暗黑模式
initializeDarkMode();

// 监听系统主题变化
window.matchMedia('(prefers-color-scheme: dark)').addListener((e) => {
    if (localStorage.getItem('darkMode') === null) {
        setDarkMode(e.matches);
    }
});

// 切换按钮点击事件
modeToggle.addEventListener('click', () => {
    setDarkMode(!body.classList.contains('dark-mode'));
});

// 收藏按钮功能
document.querySelector('.bookmark-btn').addEventListener('click', function(e) {
    e.preventDefault();
    if (window.sidebar && window.sidebar.addPanel) { // Mozilla Firefox Bookmark
        window.sidebar.addPanel(document.title, window.location.href, '');
    } else if (window.external && ('AddFavorite' in window.external)) { // IE Favorite
        window.external.AddFavorite(location.href, document.title);
    } else if (window.opera && window.print) { // Opera Hotlist
        this.title = document.title;
        return true;
    } else { // webkit - safari/chrome
        alert('请使用' + (navigator.userAgent.toLowerCase().indexOf('mac') != -1 ? 'Command/Cmd' : 'CTRL') + ' + D 添加到收藏夹。');
    }
});