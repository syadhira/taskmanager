document.addEventListener("DOMContentLoaded", () => {
    // Sidebar overlay toggle for mobile/tablet
    const sidebarWrapper = document.getElementById('sidebarOffcanvas');
    const sidebarBackdrop = document.createElement('div');
    sidebarBackdrop.className = 'sidebar-backdrop';
    document.body.appendChild(sidebarBackdrop);
    function showSidebar() {
        sidebarWrapper.classList.add('show');
        sidebarBackdrop.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    function hideSidebar() {
        sidebarWrapper.classList.remove('show');
        sidebarBackdrop.classList.remove('show');
        document.body.style.overflow = '';
    }
    // Toggle button
    document.querySelectorAll('.mobile-sidebar-toggle').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            showSidebar();
        });
    });
    // Hide on backdrop click or close button
    sidebarBackdrop.addEventListener('click', hideSidebar);
    document.querySelectorAll('.btn-close, [data-bs-dismiss="offcanvas"]').forEach(btn => {
        btn.addEventListener('click', hideSidebar);
    });
    // Hide on nav link click (optional, for better UX)
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.addEventListener('click', hideSidebar);
    });
    // Render tasks from localStorage on page load (if on tasks page)
    function renderTasksFromStorage() {
        const taskTable = document.getElementById('taskTable');
        if (!taskTable) return;
        const tasks = JSON.parse(localStorage.getItem('tasksData')) || [];
        taskTable.innerHTML = '';
        tasks.forEach(task => {
            // Build row HTML
            const row = document.createElement('tr');
            row.className = 'task-row';
            row.setAttribute('data-status', task.status);
            // Priority badge
            const priorityClass = task.priority === 'high' ? 'priority-high' : task.priority === 'medium' ? 'priority-medium' : 'priority-low';
            const priorityIcon = task.priority === 'high' ? 'bi-arrow-up' : task.priority === 'medium' ? 'bi-dash' : 'bi-arrow-down';
            // Status badge
            const statusClass = task.status === 'completed' ? 'bg-success' : task.status === 'in-progress' ? 'bg-info' : task.status === 'overdue' ? 'bg-danger' : 'bg-warning text-dark';
            const statusText = task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ');
            // Task icon
            const taskIcon = task.status === 'completed' ? 'bi-check-circle' : task.status === 'in-progress' ? 'bi-arrow-clockwise' : task.status === 'overdue' ? 'bi-exclamation-triangle' : 'bi-clock';
            const taskIconBg = task.status === 'completed' ? 'bg-success' : task.status === 'in-progress' ? 'bg-info' : task.status === 'overdue' ? 'bg-danger' : 'bg-warning';
            // Subject badge color
            const subjectColors = ['bg-primary', 'bg-info', 'bg-secondary', 'bg-success', 'bg-warning'];
            const subjectColor = subjectColors[Math.floor(Math.random() * subjectColors.length)];
            // Due date
            const dueDate = new Date(task.due);
            const today = new Date();
            today.setHours(0,0,0,0);
            dueDate.setHours(0,0,0,0);
            const diffDays = Math.ceil((dueDate - today) / (1000*60*60*24));
            let dueDateStatus = '';
            if (task.status === 'completed') {
                dueDateStatus = '<small class="d-block text-success">Completed on time</small>';
            } else if (diffDays < 0) {
                dueDateStatus = `<small class="d-block text-danger">${Math.abs(diffDays)} days overdue</small>`;
            } else if (diffDays <= 2) {
                dueDateStatus = `<small class="d-block text-warning">Due in ${diffDays} days</small>`;
            } else {
                dueDateStatus = `<small class="d-block text-muted">Due in ${diffDays} days</small>`;
            }
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <div class="task-icon ${taskIconBg} me-3">
                            <i class="bi ${taskIcon}"></i>
                        </div>
                        <div>
                            <h6 class="mb-1 task-title">${task.name}</h6>
                            <small class="text-muted">${task.description || 'No description provided'}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="subject-badge ${subjectColor}">${task.subject}</span>
                </td>
                <td>
                    <span class="priority-badge ${priorityClass}">
                        <i class="bi ${priorityIcon}"></i> ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                </td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div>
                        <strong>${dueDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</strong>
                        ${dueDateStatus}
                    </div>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" title="${task.status === 'completed' ? 'View Details' : 'Mark Complete'}">
                            <i class="bi ${task.status === 'completed' ? 'bi-eye' : 'bi-check'}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            taskTable.appendChild(row);
        });
    }
    // Only run on tasks page
    if (document.body.dataset.page === 'tasks') {
        renderTasksFromStorage();
        updateStatistics();
        initializeFilters();
        initializeSorting();
        // populate subject dropdowns from stored subjects
        populateSubjectSelects();
    }
    // If on dashboard, ensure quick-start study subject select is populated
    if (document.body.dataset.page === 'dashboard') {
        if (typeof populateSubjectSelects === 'function') populateSubjectSelects();
    }
    // Always update stats cards on load
    if (typeof updateStatistics === 'function') {
        updateStatistics();
    }
    // Also update stats after any table change
    const taskTable = document.getElementById('taskTable');
    if (taskTable) {
        taskTable.addEventListener('click', function() {
            setTimeout(updateStatistics, 200);
        });
    }
    console.log("JS loaded");

    // ============================
    // NAVIGATION ACTIVE STATE
    // ============================
    const currentPage = document.body.dataset.page;
    const sidebarNavLinks = document.querySelectorAll('.sidebar .nav-link');
    
    sidebarNavLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes(currentPage)) {
            link.classList.add('active');
        }
    });

    // Populate subject selects on tasks page from localStorage
    function populateSubjectSelects() {
        const subjectsRaw = JSON.parse(localStorage.getItem('subjectsData')) || [];
        const taskSelect = document.getElementById('taskSubject');
        const editSelect = document.getElementById('editTaskSubject');
        const studySelect = document.getElementById('studySubject');

        function fill(select) {
            if (!select) return;
            // keep a default placeholder
            const placeholder = select.id === 'editTaskSubject' ? '<option value="">Select subject...</option>' : '<option value="">Choose subject...</option>';
            select.innerHTML = placeholder;
            subjectsRaw.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.name;
                opt.textContent = s.name;
                select.appendChild(opt);
            });
        }

        fill(taskSelect);
        fill(editSelect);
        fill(studySelect);
    }

    // ============================
    // NOTIFICATIONS (localStorage-backed)
    // ============================
    function loadNotifications() {
        try {
            return JSON.parse(localStorage.getItem('notificationsData')) || [];
        } catch (e) {
            return [];
        }
    }

    function saveNotifications(list) {
        localStorage.setItem('notificationsData', JSON.stringify(list));
    }

    function addNotification(type, title, message) {
        const list = loadNotifications();
        const item = {
            id: Date.now(),
            type: type || 'general',
            title: title || 'Notification',
            message: message || '',
            time: new Date().toISOString(),
            read: false
        };
        list.unshift(item);
        // Keep only the most recent 50 notifications
        if (list.length > 50) list.splice(50);
        saveNotifications(list);
        updateNotificationUI();
    }

    function markAllNotificationsRead() {
        // Soft-archive: move all active notifications into archived storage
        archiveAllNotifications();
    }

    // Archived notifications helpers (soft-delete storage)
    function loadArchivedNotifications() {
        try {
            return JSON.parse(localStorage.getItem('archivedNotificationsData')) || [];
        } catch (e) {
            return [];
        }
    }

    function saveArchivedNotifications(list) {
        localStorage.setItem('archivedNotificationsData', JSON.stringify(list));
    }

    function archiveNotificationById(id) {
        let active = loadNotifications();
        const idx = active.findIndex(n => n.id === id);
        if (idx === -1) return;
        const [item] = active.splice(idx, 1);
        const archived = loadArchivedNotifications();
        archived.unshift({...item, archivedAt: new Date().toISOString()});
        // limit archived size to 200
        if (archived.length > 200) archived.splice(200);
        saveArchivedNotifications(archived);
        saveNotifications(active);
        updateNotificationUI();
    }

    function archiveAllNotifications() {
        const active = loadNotifications();
        if (!active || active.length === 0) {
            // nothing to do
            saveNotifications([]);
            updateNotificationUI();
            return;
        }
        const archived = loadArchivedNotifications();
        const combined = active.map(n => ({...n, archivedAt: new Date().toISOString()})).concat(archived);
        // keep most recent first and cap size
        const limited = combined.slice(0, 200);
        saveArchivedNotifications(limited);
        saveNotifications([]);
        updateNotificationUI();
    }

    // ----------------------------
    // Recent Activity (real-time)
    // ----------------------------
    function loadActivities() {
        try { return JSON.parse(localStorage.getItem('activitiesData')) || []; } catch (e) { return []; }
    }
    function saveActivities(list) { try { localStorage.setItem('activitiesData', JSON.stringify(list)); } catch (e) { console.error('saveActivities failed', e); } }
    function timeAgoShort(iso) {
        if (!iso) return '';
        const then = new Date(iso);
        if (isNaN(then)) return iso;
        const diff = Date.now() - then.getTime();
        const sec = Math.floor(diff/1000);
        if (sec < 60) return sec + 's ago';
        const min = Math.floor(sec/60);
        if (min < 60) return min + 'm ago';
        const hr = Math.floor(min/60);
        if (hr < 24) return hr + 'h ago';
        const days = Math.floor(hr/24);
        return days + ' day' + (days>1?'s':'') + ' ago';
    }
    function escapeHtml(s){ return String(s).replace(/[&<>\"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
    function renderRecentActivity(){
        // Prefer the sidebar recent activity container if present, otherwise fall back
        const container = document.querySelector('.recent-sidebar-card .activity-list') || document.querySelector('.recent-activity .activity-list');
        if (!container) return;
        const list = loadActivities();
        container.innerHTML = '';
        list.slice(0,10).forEach(item => {
            const iconClass = item.type === 'task' ? 'bi-plus-circle' : item.type === 'reminder' ? 'bi-clock' : item.type === 'complete' ? 'bi-check-circle' : 'bi-activity';
            const color = item.type === 'task' ? 'bg-primary' : item.type === 'reminder' ? 'bg-warning' : item.type === 'complete' ? 'bg-success' : 'bg-secondary';
            const el = document.createElement('div');
            el.className = 'activity-item';
            el.innerHTML = `\n                <div class="activity-icon ${color}">\n                  <i class="bi ${iconClass}"></i>\n                </div>\n                <div class="activity-content">\n                  <p class="activity-text mb-1" style="color: var(--text-primary);">${escapeHtml(item.text)}</p>\n                  <small class="text-muted" style="color: var(--text-secondary);">${timeAgoShort(item.time)}</small>\n                </div>\n            `;
            container.appendChild(el);
        });
    }
    function addActivity(text, type){
        const list = loadActivities();
        list.unshift({ id: Date.now(), text: text, type: type || 'general', time: new Date().toISOString() });
        if (list.length > 50) list.splice(50);
        saveActivities(list);
        renderRecentActivity();
    }
    // expose for console/testing
    try { window.addActivity = addActivity; } catch (e) {}
    // initial render and polling for changes (other tabs)
    renderRecentActivity();
    let __lastActs = JSON.stringify(loadActivities());
    setInterval(function(){ const cur = JSON.stringify(loadActivities()); if (cur !== __lastActs){ __lastActs = cur; renderRecentActivity(); } }, 1000);

    function updateNotificationUI() {
        const btn = document.querySelector('.notification-btn');
        if (!btn) return;
        const menu = btn.nextElementSibling; // expected dropdown
        if (!menu) return;
        const list = loadNotifications();
        const unreadCount = list.filter(n => !n.read).length;
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = unreadCount > 0 ? unreadCount : '';
            badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
        }

        // Build dropdown contents (limit to 6 recent)
        let html = `
            <li class="dropdown-header d-flex justify-content-between align-items-center">
              <span class="fw-bold">Notifications</span>
              <button class="btn btn-sm btn-link text-primary p-0" id="markAllReadBtn">Mark all read</button>
            </li>
            <li><hr class="dropdown-divider"></li>
        `;

        if (list.length === 0) {
            html += `<li class="dropdown-item text-center text-muted">No notifications</li>`;
        } else {
            list.slice(0,6).forEach(n => {
                const timeAgo = new Date(n.time).toLocaleString();
                const unreadClass = n.read ? '' : 'fw-bold';
                html += `
                  <li>
                    <a class="dropdown-item py-2" href="#" data-id="${n.id}">
                      <div class="d-flex">
                        <div class="flex-grow-1">
                          <div class="small ${unreadClass}">${n.title}</div>
                          <div class="text-muted small">${n.message}</div>
                          <div class="text-muted xsmall">${timeAgo}</div>
                        </div>
                      </div>
                    </a>
                  </li>
                `;
            });
            html += `<li><hr class="dropdown-divider"></li>`;
            html += `<li><a class="dropdown-item text-center text-primary" href="#" id="viewAllNotifications">View all notifications</a></li>`;
        }

        menu.innerHTML = html;

        // Attach handlers
        const markBtn = document.getElementById('markAllReadBtn');
        if (markBtn) markBtn.addEventListener('click', function(e){ e.preventDefault(); markAllNotificationsRead(); });
        const viewAll = document.getElementById('viewAllNotifications');
        if (viewAll) viewAll.addEventListener('click', function(e){ e.preventDefault(); window.location.hash = '#notifications'; });

        // Remove individual notification when clicked (mark as read -> disappear)
        const itemLinks = menu.querySelectorAll('a[data-id]');
        itemLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const id = Number(this.getAttribute('data-id'));
                // Soft-archive this notification so it disappears from active list
                archiveNotificationById(id);
            });
        });
    }

     (function(){
    function syncHeights(){
      try{
        const recent = document.querySelector('.recent-sidebar-card');
        const moved = document.querySelector('.moved-resources');
        if (!recent || !moved) return;
        // match overall card height so bottoms align
        const height = recent.offsetHeight;
        moved.style.minHeight = height + 'px';
      }catch(e){console.error(e)}
    }
    document.addEventListener('DOMContentLoaded', function(){ syncHeights(); });
    window.addEventListener('resize', function(){ syncHeights(); });
    // also try after a short delay in case fonts/images change layout
    setTimeout(syncHeights, 800);
  })();
    // Initialize notifications UI on load
    updateNotificationUI();

    // ============================
    // LOGIN BUTTON
    // ============================
    const loginBtn = document.getElementById('loginBtn');

    if (loginBtn) {
        loginBtn.addEventListener('click', function () {
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();

            const validEmail = "2025180137@student.uitm.edu.my";
            const validPassword = "Aisyah12345";

            if (email === validEmail && password === validPassword) {
                window.location.href = "dashboard.html";
            }
        });
    }

    // ============================
    // BREADCRUMB HANDLER
    // ============================
    const breadcrumb = document.getElementById("breadcrumb");
    const page = document.body.dataset.page;

    console.log("Current page:", page);

    if (breadcrumb) {
        let items = [];

        switch (page) {
            case "dashboard":
                items = ["Dashboard"];
                break;
            case "tasks":
                items = ["Dashboard", "Tasks"];
                break;
            case "subjects":
                items = ["Dashboard", "Subjects"];
                break;
            case "profile":
                items = ["Dashboard", "Profile"];
                break;
            default:
                items = [];
        }

        breadcrumb.innerHTML = "";

        items.forEach((item, index) => {
            const li = document.createElement("li");
            li.classList.add("breadcrumb-item");

            if (index === items.length - 1) {
                li.classList.add("active");
                li.textContent = item;
            } else {
                const a = document.createElement("a");
                a.href = item.toLowerCase() + ".html";
                a.textContent = item;
                li.appendChild(a);
            }

            breadcrumb.appendChild(li);
        });
    }

    // ============================
    // ADD TASK
    // ============================
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', function (e) {
            e.preventDefault();
            // Get form values
            const taskName = document.getElementById('taskName').value;
            const taskDescription = document.getElementById('taskDescription').value;
            const taskSubject = document.getElementById('taskSubject').value;
            const taskPriority = document.getElementById('taskPriority').value;
            const taskStatus = document.getElementById('taskStatus').value;
            const taskDue = document.getElementById('taskDue').value;
            const taskReminderChecked = document.getElementById('taskReminder') ? document.getElementById('taskReminder').checked : false;
            // Save to localStorage
            let tasks = JSON.parse(localStorage.getItem('tasksData')) || [];
            tasks.push({
                name: taskName,
                description: taskDescription,
                subject: taskSubject,
                priority: taskPriority,
                status: taskStatus,
                due: taskDue,
                reminder: taskReminderChecked
            });
            localStorage.setItem('tasksData', JSON.stringify(tasks));
            if (typeof addActivity === 'function') addActivity(`Updated task "${taskName}"`, 'task');
            if (typeof addActivity === 'function') addActivity(`Added new task "${taskName}"`, 'task');
            // ...existing code for adding to table...
            // Create priority badge
            const priorityClass = taskPriority === 'high' ? 'priority-high' : 
                                taskPriority === 'medium' ? 'priority-medium' : 'priority-low';
            const priorityIcon = taskPriority === 'high' ? 'bi-arrow-up' : 
                               taskPriority === 'medium' ? 'bi-dash' : 'bi-arrow-down';
            // Create status badge
            const statusClass = taskStatus === 'completed' ? 'bg-success' : 
                              taskStatus === 'in-progress' ? 'bg-info' : 'bg-warning text-dark';
            const statusText = taskStatus.charAt(0).toUpperCase() + taskStatus.slice(1).replace('-', ' ');
            // Create task icon
            const taskIcon = taskStatus === 'completed' ? 'bi-check-circle' : 
                           taskStatus === 'in-progress' ? 'bi-arrow-clockwise' : 'bi-clock';
            const taskIconBg = taskStatus === 'completed' ? 'bg-success' : 
                             taskStatus === 'in-progress' ? 'bg-info' : 'bg-warning';
            // Create subject badge color
            const subjectColors = ['bg-primary', 'bg-info', 'bg-secondary', 'bg-success', 'bg-warning'];
            const subjectColor = subjectColors[Math.floor(Math.random() * subjectColors.length)];
            // Format due date
            const dueDate = new Date(taskDue);
            const today = new Date();
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            let dueDateStatus = '';
            if (taskStatus === 'completed') {
                dueDateStatus = '<small class="d-block text-success">Completed on time</small>';
            } else if (diffDays < 0) {
                dueDateStatus = `<small class="d-block text-danger">${Math.abs(diffDays)} days overdue</small>`;
            } else if (diffDays <= 2) {
                dueDateStatus = `<small class="d-block text-warning">Due in ${diffDays} days</small>`;
            } else {
                dueDateStatus = `<small class="d-block text-muted">Due in ${diffDays} days</small>`;
            }
            const table = document.getElementById('taskTable');
            const row = document.createElement('tr');
            row.className = 'task-row';
            row.setAttribute('data-status', taskStatus);
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <div class="task-icon ${taskIconBg} me-3">
                            <i class="bi ${taskIcon}"></i>
                        </div>
                        <div>
                            <h6 class="mb-1 task-title">${taskName}</h6>
                            <small class="text-muted">${taskDescription || 'No description provided'}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="subject-badge ${subjectColor}">${taskSubject}</span>
                </td>
                <td>
                    <span class="priority-badge ${priorityClass}">
                        <i class="bi ${priorityIcon}"></i> ${taskPriority.charAt(0).toUpperCase() + taskPriority.slice(1)}
                    </span>
                </td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div>
                        <strong>${dueDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</strong>
                        ${dueDateStatus}
                    </div>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" title="${taskStatus === 'completed' ? 'View Details' : 'Mark Complete'}">
                            <i class="bi ${taskStatus === 'completed' ? 'bi-eye' : 'bi-check'}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            table.appendChild(row);
            addTaskForm.reset();
            bootstrap.Modal.getInstance(document.getElementById('addTaskModal')).hide();
            // Show success message (optional)
            if (typeof addNotification === 'function') addNotification('task', 'New task added', taskName);
            if (taskReminderChecked && typeof addNotification === 'function') addNotification('reminder', 'Reminder set', `Reminder set for ${taskName} on ${taskDue}`);
            console.log('Task added successfully!');
        });
    }

    // ============================
    // SUBJECTS PAGE DYNAMIC CARD LOGIC
    // ============================

    if (document.body.dataset.page === 'subjects') {
        // Subject data array 
        let subjects;
        const _defaultSubjects = [
                {
                    name: 'Information System Project Manager',
                    code: 'IMS565',
                    description: 'Capstone: manage information system projects and teams',
                    instructor: 'KHAIRUL MIZAN BIN TAIB',
                    instructorEmail: 'khairulmizan@uitm.edu.my',
                    credits: 3,
                    semester: '2',
                    year: '2024/2025',
                    days: 'Mon',
                    time: '02:00 PM - 05:00 PM',
                    room: 'BILIK SEMINAR',
                    color: 'primary',
                    icon: 'bi-diagram-3',
                    grade: '-',
                    tasks: 0,
                    progress: 0
                }
            ];

        // Try to load persisted subjects first (so edits/deletes survive reload)
        try {
            const stored = JSON.parse(localStorage.getItem('subjectsData'));
            if (Array.isArray(stored) && stored.length > 0) {
                subjects = stored;
            } else {
                subjects = _defaultSubjects;
                localStorage.setItem('subjectsData', JSON.stringify(subjects));
            }
        } catch (err) {
            subjects = _defaultSubjects;
            localStorage.setItem('subjectsData', JSON.stringify(subjects));
        }

      // Update subject stats
      function updateSubjectStats() {
    // Total subjects
    document.querySelector('.stats-primary .stats-number').textContent = subjects.length;
    // Average credits
    const avgCredits = subjects.length ? (subjects.reduce((sum, s) => sum + Number(s.credits), 0) / subjects.length).toFixed(1) : '0';
    document.querySelector('.stats-success .stats-number').textContent = avgCredits;
    // Instructors
    const instructorSet = new Set(subjects.map(s => s.instructor));
    document.querySelector('.stats-info .stats-number').textContent = instructorSet.size;
    // Total credit hours
    const totalCredits = subjects.reduce((sum, s) => sum + Number(s.credits), 0);
    document.querySelector('.stats-warning .stats-number').textContent = totalCredits;

    // Update header badges with live data
    const headerSubjects = document.querySelector('.header-subjects-count');
    const headerInstructors = document.querySelector('.header-instructors-count');
    const headerCredits = document.querySelector('.header-credits-count');
    if (headerSubjects) headerSubjects.textContent = subjects.length;
    if (headerInstructors) headerInstructors.textContent = instructorSet.size;
    if (headerCredits) headerCredits.textContent = totalCredits;
      }

      // Render all subject cards
      function renderSubjectCards() {
        const grid = document.getElementById('subjectCardGrid');
        grid.innerHTML = '';
        subjects.forEach((subj, idx) => {
          grid.innerHTML += `
            <div class="col-lg-4 col-md-6">
              <div class="subject-card">
                <div class="subject-header bg-${subj.color}">
                  <div class="subject-icon">
                    <i class="bi ${subj.icon}"></i>
                  </div>
                  <div class="subject-info">
                    <h5 class="subject-title">${subj.name}</h5>
                    <p class="subject-code">${subj.code}</p>
                  </div>
                </div>
                <div class="subject-body">
                  <div class="instructor-info mb-3">
                    <div class="d-flex align-items-center">
                      <div class="instructor-avatar bg-${subj.color} me-2">
                        <i class="bi bi-person"></i>
                      </div>
                      <div>
                        <strong>${subj.instructor}</strong>
                        <small class="d-block text-muted">${subj.instructorEmail}</small>
                      </div>
                    </div>
                  </div>
                  <div class="subject-stats">
                    <div class="row text-center">
                      <div class="col-4">
                        <div class="stat-item">
                          <strong>${subj.credits}</strong>
                          <small>Credits</small>
                        </div>
                      </div>
                      <div class="col-4">
                        <div class="stat-item">
                          <strong>${subj.tasks}</strong>
                          <small>Tasks</small>
                        </div>
                      </div>
                      <div class="col-4">
                        <div class="stat-item">
                          <strong>${subj.grade}</strong>
                          <small>Grade</small>
                        </div>
                      </div>
                    </div>
                    <div class="progress mt-2" style="height: 6px;">
                      <div class="progress-bar bg-${subj.progress === 100 ? 'success' : subj.progress >= 80 ? 'primary' : subj.progress >= 60 ? 'warning' : 'danger'}" style="width: ${subj.progress}%;"></div>
                    </div>
                    <small class="text-muted">${subj.progress}% Complete</small>
                  </div>
                </div>
                <div class="subject-footer">
                  <div class="btn-group w-100" role="group">
                    <button class="btn btn-outline-primary btn-sm" data-action="view" data-idx="${idx}"><i class="bi bi-eye"></i> View</button>
                    <button class="btn btn-outline-secondary btn-sm" data-action="edit" data-idx="${idx}"><i class="bi bi-pencil"></i> Edit</button>
                    <button class="btn btn-outline-danger btn-sm" data-action="delete" data-idx="${idx}"><i class="bi bi-trash"></i></button>
                  </div>
                </div>
              </div>
            </div>
          `;
        });
                updateSubjectStats();
                // persist current subjects list so other pages can sync
                localStorage.setItem('subjectsData', JSON.stringify(subjects));
                // ensure tasks page selects (if open) are updated
                if (typeof populateSubjectSelects === 'function') populateSubjectSelects();
      }

      renderSubjectCards();

      // Add Subject
      const addSubjectForm = document.getElementById('addSubjectForm');
      if (addSubjectForm) {
        addSubjectForm.addEventListener('submit', function (e) {
          e.preventDefault();
          const subj = {
            name: document.getElementById('subjectName').value,
            code: document.getElementById('subjectCode').value,
            description: document.getElementById('subjectDescription').value,
            instructor: document.getElementById('instructor').value,
            instructorEmail: document.getElementById('instructorEmail').value,
            credits: document.getElementById('subjectCredits').value,
            semester: document.getElementById('subjectSemester').value,
            year: document.getElementById('subjectYear').value,
            days: document.getElementById('subjectDays').value,
            time: document.getElementById('subjectTime').value,
            room: document.getElementById('subjectRoom').value,
            color: document.getElementById('subjectColor').value,
            icon: document.getElementById('subjectIcon').value,
            grade: '-',
            tasks: 0,
            progress: 0
          };
          subjects.push(subj);
          renderSubjectCards();
                    // Notification: subject added
                    if (typeof addNotification === 'function') addNotification('subject', 'Subject added', subj.name);
          addSubjectForm.reset();
          bootstrap.Modal.getInstance(document.getElementById('addSubjectModal')).hide();
        });
      }

      // Card actions (edit, view, delete)
      document.getElementById('subjectCardGrid').addEventListener('click', function(e) {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const idx = btn.getAttribute('data-idx');
        const action = btn.getAttribute('data-action');
                if (action === 'delete') {
                    if (confirm('Delete this subject?')) {
                        const deletedName = subjects[idx] ? subjects[idx].name : 'Subject';
                        subjects.splice(idx, 1);
                        renderSubjectCards();
                        if (typeof addNotification === 'function') addNotification('subject', 'Subject deleted', deletedName);
                    }
        } else if (action === 'edit') {
          const subj = subjects[idx];
          document.getElementById('editSubjectIndex').value = idx;
          document.getElementById('editSubjectName').value = subj.name;
          document.getElementById('editSubjectCode').value = subj.code;
          document.getElementById('editSubjectDescription').value = subj.description;
          document.getElementById('editInstructor').value = subj.instructor;
          document.getElementById('editInstructorEmail').value = subj.instructorEmail;
          document.getElementById('editSubjectCredits').value = subj.credits;
          document.getElementById('editSubjectSemester').value = subj.semester;
          document.getElementById('editSubjectYear').value = subj.year;
          document.getElementById('editSubjectDays').value = subj.days;
          document.getElementById('editSubjectTime').value = subj.time;
          document.getElementById('editSubjectRoom').value = subj.room;
          document.getElementById('editSubjectColor').value = subj.color;
          document.getElementById('editSubjectIcon').value = subj.icon;
          new bootstrap.Modal(document.getElementById('editSubjectModal')).show();
        } else if (action === 'view') {
          const subj = subjects[idx];
          document.getElementById('viewSubjectDetails').innerHTML = `
            <h4 class="mb-2">${subj.name} <span class="badge bg-${subj.color}">${subj.code}</span></h4>
            <p>${subj.description || ''}</p>
            <ul class="list-group mb-2">
              <li class="list-group-item"><strong>Instructor:</strong> ${subj.instructor} (${subj.instructorEmail})</li>
              <li class="list-group-item"><strong>Credits:</strong> ${subj.credits}</li>
              <li class="list-group-item"><strong>Schedule:</strong> ${subj.days} ${subj.time} (${subj.room})</li>
              <li class="list-group-item"><strong>Semester:</strong> ${subj.semester} | <strong>Year:</strong> ${subj.year}</li>
            </ul>
            <div class="progress mb-2" style="height: 8px;">
              <div class="progress-bar bg-${subj.progress === 100 ? 'success' : subj.progress >= 80 ? 'primary' : subj.progress >= 60 ? 'warning' : 'danger'}" style="width: ${subj.progress}%;"></div>
            </div>
            <small class="text-muted">${subj.progress}% Complete</small>
          `;
          new bootstrap.Modal(document.getElementById('viewSubjectModal')).show();
        }
      });

      // Edit subject form submit
      const editSubjectForm = document.getElementById('editSubjectForm');
      if (editSubjectForm) {
        editSubjectForm.addEventListener('submit', function(e) {
          e.preventDefault();
          const idx = document.getElementById('editSubjectIndex').value;
          subjects[idx] = {
            ...subjects[idx],
            name: document.getElementById('editSubjectName').value,
            code: document.getElementById('editSubjectCode').value,
            description: document.getElementById('editSubjectDescription').value,
            instructor: document.getElementById('editInstructor').value,
            instructorEmail: document.getElementById('editInstructorEmail').value,
            credits: document.getElementById('editSubjectCredits').value,
            semester: document.getElementById('editSubjectSemester').value,
            year: document.getElementById('editSubjectYear').value,
            days: document.getElementById('editSubjectDays').value,
            time: document.getElementById('editSubjectTime').value,
            room: document.getElementById('editSubjectRoom').value,
            color: document.getElementById('editSubjectColor').value,
            icon: document.getElementById('editSubjectIcon').value
          };
          renderSubjectCards();
                    // Notification: subject edited
                    if (typeof addNotification === 'function') addNotification('subject', 'Subject updated', subjects[idx].name);
                    bootstrap.Modal.getInstance(document.getElementById('editSubjectModal')).hide();
        });
      }
    }

    // ============================
    // TASK FILTERS AND STATISTICS
    // ============================
    
    // Function to determine if a task is overdue
    function isTaskOverdue(taskRow) {
        const dueDateElement = taskRow.querySelector('td:nth-child(5) strong');
        if (!dueDateElement) return false;
        
        const dueDateText = dueDateElement.textContent.trim();
        const dueDate = new Date(dueDateText);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        dueDate.setHours(0, 0, 0, 0);
        
        const status = taskRow.getAttribute('data-status');
        return dueDate < today && status !== 'completed';
    }
    
    // Function to get task status from row
    function getTaskStatus(taskRow) {
        const status = taskRow.getAttribute('data-status');
        if (isTaskOverdue(taskRow)) {
            return 'overdue';
        }
        return status || 'pending';
    }
    
    // Function to update statistics
    function updateStatistics() {
        const taskRows = document.querySelectorAll('#taskTable .task-row');
        let stats = {
            total: 0,
            completed: 0,
            pending: 0,
            inProgress: 0,
            overdue: 0,
            thisWeek: 0
        };
        
        taskRows.forEach(row => {
            // Count all tasks regardless of visibility/filter
            stats.total++;
            const status = getTaskStatus(row);
            
            // Check if task is due this week
            const dueDateElement = row.querySelector('td:nth-child(5) strong');
            if (dueDateElement) {
                const dueDate = new Date(dueDateElement.textContent.trim());
                const today = new Date();
                const endOfWeek = new Date(today);
                endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
                endOfWeek.setHours(23, 59, 59, 999);
                
                if (dueDate <= endOfWeek && status !== 'completed') {
                    stats.thisWeek++;
                }
            }
            
            switch (status) {
                case 'completed':
                    stats.completed++;
                    break;
                case 'in-progress':
                    stats.inProgress++;
                    break;
                case 'overdue':
                    stats.overdue++;
                    break;
                default:
                    stats.pending++;
            }
        });
        
        // Update the statistics cards
        const totalElement = document.querySelector('.stats-card.stats-primary .stats-number');
        const completedElement = document.querySelector('.stats-card.stats-success .stats-number');
        const pendingElement = document.querySelector('.stats-card.stats-warning .stats-number');
        const inProgressElement = document.querySelector('.stats-card.stats-info .stats-number');
        const overdueElement = document.querySelector('.stats-card.stats-danger .stats-number');
        const thisWeekElement = document.querySelector('.stats-card.stats-secondary .stats-number');

        if (totalElement) totalElement.textContent = stats.total;
        if (completedElement) completedElement.textContent = stats.completed;
        if (pendingElement) pendingElement.textContent = stats.pending;
        if (inProgressElement) inProgressElement.textContent = stats.inProgress;
        if (overdueElement) overdueElement.textContent = stats.overdue;
        if (thisWeekElement) thisWeekElement.textContent = stats.thisWeek;

        // Update header badges with live data
        const headerCompleted = document.querySelector('.header-completed-count');
        const headerPending = document.querySelector('.header-pending-count');
        const headerOverdue = document.querySelector('.header-overdue-count');
        if (headerCompleted) headerCompleted.textContent = stats.completed;
        if (headerPending) headerPending.textContent = stats.pending;
        if (headerOverdue) headerOverdue.textContent = stats.overdue;

        // Update completion rate
        const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        const completionRateElement = document.querySelector('.stats-card.stats-success .stats-change');
        if (completionRateElement) {
            completionRateElement.innerHTML = `<i class="bi bi-arrow-up"></i> ${completionRate}% completion rate`;
        }


        // Update overdue status message
        const overdueStatusElement = document.querySelector('.stats-card.stats-danger .stats-change');
        if (overdueStatusElement) {
            if (stats.overdue > 0) {
                overdueStatusElement.innerHTML = `<i class="bi bi-exclamation"></i> ${stats.overdue > 1 ? 'Need' : 'Needs'} attention`;
                overdueStatusElement.className = 'stats-change text-danger';
            } else {
                overdueStatusElement.innerHTML = `<i class="bi bi-check-circle"></i> All on track`;
                overdueStatusElement.className = 'stats-change text-success';
            }
        }
    }
    
// ============================
// PROFILE EDIT HANDLER
// ============================
if (document.body.dataset.page === 'profile') {
  const editProfileForm = document.getElementById('editProfileForm');
  if (editProfileForm) {
    editProfileForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Ambil value dari form
      const name = document.getElementById("editName").value;
      const email = document.getElementById("editEmail").value;
      const phone = document.getElementById("editPhone").value;
      const dob = document.getElementById("editDOB").value;
      const gender = document.getElementById("editGender").value;
      const program = document.getElementById("editProgram").value;
      const faculty = document.getElementById("editFaculty").value;
      const campus = document.getElementById("editCampus").value;

      // Emergency Contact
      const emergencyName = document.getElementById("editEmergencyName").value;
      const relationship = document.getElementById("editRelationship").value;
      const emergencyPhone = document.getElementById("editEmergencyPhone").value;
      const emergencyEmail = document.getElementById("editEmergencyEmail").value;

      // Update ke profile display
      document.getElementById("displayName").textContent = name;
      document.getElementById("studentName").textContent = name;
      document.getElementById("studentEmail").innerHTML = `<a href="mailto:${email}">${email}</a>`;
      document.getElementById("studentNumber").innerHTML = `<a href="tel:${phone}">${phone}</a>`;
      document.getElementById("studentDOB").textContent = dob;
      document.getElementById("studentProgram").textContent = program;

      // Update Emergency Contact
      document.getElementById("emergencyName").textContent = emergencyName;
      document.getElementById("emergencyRelation").textContent = relationship;
      document.getElementById("emergencyPhone").innerHTML = `<a href="tel:${emergencyPhone}">${emergencyPhone}</a>`;
      document.getElementById("emergencyEmail").innerHTML = `<a href="mailto:${emergencyEmail}">${emergencyEmail}</a>`;


      // Tutup modal
      const modal = bootstrap.Modal.getInstance(document.getElementById("editProfileModal"));
      modal.hide();
    });
  }
}



// ============================
// PRINT ID CARD HANDLER
// ============================
const printBtn = document.getElementById("printIdBtn");
if (printBtn) {
  printBtn.addEventListener("click", function () {
    const imgUrl = "pic/idcard.jpg";  
    const win = window.open("");
    win.document.write(`
      <html>
        <head><title>Print ID Card</title></head>
        <body style="margin:0; text-align:center;">
          <img src="${imgUrl}" style="max-width:100%; height:auto;" />
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    win.document.close();
  });
}


    // Function to filter tasks
    function filterTasks(filterType) {
        const taskRows = document.querySelectorAll('#taskTable .task-row');
        
        taskRows.forEach(row => {
            const status = getTaskStatus(row);
            let shouldShow = true;
            
            switch (filterType) {
                case 'all':
                    shouldShow = true;
                    break;
                case 'pending':
                    shouldShow = status === 'pending';
                    break;
                case 'in-progress':
                    shouldShow = status === 'in-progress';
                    break;
                case 'completed':
                    shouldShow = status === 'completed';
                    break;
                case 'overdue':
                    shouldShow = status === 'overdue';
                    break;
                default:
                    shouldShow = true;
            }
            
            row.style.display = shouldShow ? '' : 'none';
        });
        
        // No need to update statistics after filtering - they show total counts
    }
    
    // Initialize filter event listeners
    function initializeFilters() {
        const filterButtons = document.querySelectorAll('input[name="taskFilter"]');
        
        filterButtons.forEach(button => {
            button.addEventListener('change', function() {
                if (this.checked) {
                    const filterId = this.id;
                    let filterType = 'all';
                    
                    switch (filterId) {
                        case 'filterAll':
                            filterType = 'all';
                            break;
                        case 'filterPending':
                            filterType = 'pending';
                            break;
                        case 'filterInProgress':
                            filterType = 'in-progress';
                            break;
                        case 'filterCompleted':
                            filterType = 'completed';
                            break;
                        case 'filterOverdue':
                            filterType = 'overdue';
                            break;
                    }
                    
                    filterTasks(filterType);
                }
            });
        });
    }
    
    // Initialize sorting functionality
    function initializeSorting() {
        const sortButtons = document.querySelectorAll('.dropdown-menu .dropdown-item');
        
        sortButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const sortText = this.textContent.trim();
                
                const taskTable = document.getElementById('taskTable');
                const taskRows = Array.from(taskTable.querySelectorAll('.task-row'));
                
                taskRows.sort((a, b) => {
                    if (sortText.includes('Due Date (Newest)')) {
                        const dateA = new Date(a.querySelector('td:nth-child(5) strong').textContent);
                        const dateB = new Date(b.querySelector('td:nth-child(5) strong').textContent);
                        return dateB - dateA;
                    } else if (sortText.includes('Due Date (Oldest)')) {
                        const dateA = new Date(a.querySelector('td:nth-child(5) strong').textContent);
                        const dateB = new Date(b.querySelector('td:nth-child(5) strong').textContent);
                        return dateA - dateB;
                    } else if (sortText.includes('Name (A-Z)')) {
                        const nameA = a.querySelector('.task-title').textContent.toLowerCase();
                        const nameB = b.querySelector('.task-title').textContent.toLowerCase();
                        return nameA.localeCompare(nameB);
                    } else if (sortText.includes('Name (Z-A)')) {
                        const nameA = a.querySelector('.task-title').textContent.toLowerCase();
                        const nameB = b.querySelector('.task-title').textContent.toLowerCase();
                        return nameB.localeCompare(nameA);
                    }
                    return 0;
                });
                
                // Re-append sorted rows
                taskRows.forEach(row => taskTable.appendChild(row));
                
                // Update the dropdown button text
                const dropdownButton = document.querySelector('.dropdown button');
                if (dropdownButton) {
                    dropdownButton.innerHTML = `<i class="bi bi-funnel me-2"></i>${sortText}`;
                }
            });
        });
    }
    
    // Initialize all task-related functionality
    if (document.getElementById('taskTable')) {
        // Sync Task Master achievement in tasks.html
        function syncTaskMasterAchievement() {
            // Count completed tasks from the table
            const taskRows = document.querySelectorAll('#taskTable .task-row');
            let completed = 0;
            let total = 0;
            taskRows.forEach(row => {
                let status = row.getAttribute('data-status');
                // Overdue logic
                const dueDateElement = row.querySelector('td:nth-child(5) strong');
                if (dueDateElement) {
                    const dueDate = new Date(dueDateElement.textContent.trim());
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    dueDate.setHours(0, 0, 0, 0);
                    if (dueDate < today && status !== 'completed') status = 'overdue';
                }
                total++;
                if (status === 'completed') completed++;
            });
            // Fallback to localStorage if table is empty
            if (total === 0) {
                const tasks = JSON.parse(localStorage.getItem('tasksData')) || [];
                total = tasks.length;
                completed = tasks.filter(t => t.status === 'completed').length;
            }
            // Update the achievement UI (adjust selectors as needed)
            const taskMasterCount = document.querySelector('.achievement-taskmaster-count, .taskmaster-count');
            const taskMasterBar = document.querySelector('.achievement-taskmaster-bar, .taskmaster-bar, .achievement-taskmaster-progress, .taskmaster-progress');
            const taskMasterGoal = 20;
            if (taskMasterCount) taskMasterCount.textContent = `${completed}/${taskMasterGoal}`;
            if (taskMasterBar) {
                const percent = Math.round((completed / taskMasterGoal) * 100);
                taskMasterBar.style.width = percent + '%';
                taskMasterBar.setAttribute('aria-valuenow', completed);
            }
        }
        syncTaskMasterAchievement();
        // Also update on add/edit/delete
        if (taskTable) {
            taskTable.addEventListener('click', function(e) {
                setTimeout(syncTaskMasterAchievement, 200);
            });
        }
        if (addTaskForm) {
            addTaskForm.addEventListener('submit', function() {
                setTimeout(syncTaskMasterAchievement, 200);
            });
        }
        initializeFilters();
        initializeSorting();
        updateStatistics(); // Initial statistics update
        
        // Update statistics whenever a task is added
        const originalAddTask = addTaskForm;
        // Sync all current table data to localStorage on page load
        function syncTableToLocalStorage() {
            const taskRows = document.querySelectorAll('#taskTable .task-row');
            let tasks = [];
            taskRows.forEach(row => {
                const name = row.querySelector('.task-title')?.textContent || '';
                const description = row.querySelector('.task-title')?.nextElementSibling?.textContent || '';
                const subject = row.querySelector('.subject-badge')?.textContent || '';
                const priority = row.querySelector('.priority-badge')?.textContent.trim().toLowerCase() || '';
                let status = row.getAttribute('data-status');
                const due = row.querySelector('td:nth-child(5) strong')?.textContent || '';
                // Overdue logic
                const dueDate = new Date(due);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                dueDate.setHours(0, 0, 0, 0);
                if (dueDate < today && status !== 'completed') status = 'overdue';
                tasks.push({ name, description, subject, priority, status, due });
            });
            localStorage.setItem('tasksData', JSON.stringify(tasks));
        }
        syncTableToLocalStorage();
        if (originalAddTask) {
            originalAddTask.addEventListener('submit', function() {
                setTimeout(() => {
                    updateStatistics();
                    syncTableToLocalStorage();
                }, 100);
            });
        }
        // Also sync on delete/edit
        const taskTable = document.getElementById('taskTable');
        if (taskTable) {
            taskTable.addEventListener('click', function(e) {
                setTimeout(syncTableToLocalStorage, 200);
            });
        }
    }

    // ============================
    // DASHBOARD CHARTS
    // ============================
    if (document.getElementById('taskChart')) {
        initializeCharts();
        // Also update dashboard stats cards to match live task data
        let stats = { total: 0, completed: 0, pending: 0, inProgress: 0, overdue: 0 };
        let statsSource = [];
        const taskRows = document.querySelectorAll('#taskTable .task-row');
        if (taskRows.length > 0) {
            taskRows.forEach(row => {
                let status = row.getAttribute('data-status');
                // Overdue logic
                const dueDateElement = row.querySelector('td:nth-child(5) strong');
                if (dueDateElement) {
                    const dueDate = new Date(dueDateElement.textContent.trim());
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    dueDate.setHours(0, 0, 0, 0);
                    if (dueDate < today && status !== 'completed') status = 'overdue';
                }
                stats.total++;
                if (status === 'completed') stats.completed++;
                else if (status === 'in-progress') stats.inProgress++;
                else if (status === 'overdue') stats.overdue++;
                else stats.pending++;
            });
        } else {
            // fallback to localStorage if no table
            statsSource = JSON.parse(localStorage.getItem('tasksData')) || [];
            statsSource.forEach(task => {
                let status = task.status;
                // Overdue logic
                const dueDate = new Date(task.due);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                dueDate.setHours(0, 0, 0, 0);
                if (dueDate < today && status !== 'completed') status = 'overdue';
                stats.total++;
                if (status === 'completed') stats.completed++;
                else if (status === 'in-progress') stats.inProgress++;
                else if (status === 'overdue') stats.overdue++;
                else stats.pending++;
            });
        }
        // Update dashboard stats cards if present
        const totalElement = document.querySelector('.stats-card.stats-primary .stats-number');
        const completedElement = document.querySelector('.stats-card.stats-success .stats-number');
        const pendingElement = document.querySelector('.stats-card.stats-warning .stats-number');
        const inProgressElement = document.querySelector('.stats-card.stats-info .stats-number');
        const overdueElement = document.querySelector('.stats-card.stats-danger .stats-number');
        if (totalElement) totalElement.textContent = stats.total;
        if (completedElement) completedElement.textContent = stats.completed;
        if (pendingElement) pendingElement.textContent = stats.pending;
        if (inProgressElement) inProgressElement.textContent = stats.inProgress;
        if (overdueElement) overdueElement.textContent = stats.overdue;
        // Update completion rate
        const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        const completionRateElement = document.querySelector('.stats-card.stats-success .stats-change');
        if (completionRateElement) {
            completionRateElement.innerHTML = `<i class="bi bi-arrow-up"></i> ${completionRate}% completion rate`;
        }
        // Update overdue status message
        const overdueStatusElement = document.querySelector('.stats-card.stats-danger .stats-change');
        if (overdueStatusElement) {
            if (stats.overdue > 0) {
                overdueStatusElement.innerHTML = `<i class="bi bi-exclamation"></i> ${stats.overdue > 1 ? 'Need' : 'Needs'} attention`;
                overdueStatusElement.className = 'stats-change text-danger';
            } else {
                overdueStatusElement.innerHTML = `<i class="bi bi-check-circle"></i> All on track`;
                overdueStatusElement.className = 'stats-change text-success';
            }
        }
    }
});

// Chart Initialization Function
function initializeCharts() {
    // Task Completion Doughnut Chart
    const taskCtx = document.getElementById('taskChart').getContext('2d');
    // Get live stats from the DOM (from tasks table if available), else from localStorage
    let completed = 0, inProgress = 0, pending = 0, overdue = 0;
    let statsSource = [];
    const taskRows = document.querySelectorAll('#taskTable .task-row');
    if (taskRows.length > 0) {
        taskRows.forEach(row => {
            let status = row.getAttribute('data-status');
            // Overdue logic (reuse from getTaskStatus)
            const dueDateElement = row.querySelector('td:nth-child(5) strong');
            if (dueDateElement) {
                const dueDate = new Date(dueDateElement.textContent.trim());
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                dueDate.setHours(0, 0, 0, 0);
                if (dueDate < today && status !== 'completed') status = 'overdue';
            }
            if (status === 'completed') completed++;
            else if (status === 'in-progress') inProgress++;
            else if (status === 'overdue') overdue++;
            else pending++;
        });
    } else {
        // fallback to localStorage if no table
        statsSource = JSON.parse(localStorage.getItem('tasksData')) || [];
        statsSource.forEach(task => {
            let status = task.status;
            // Overdue logic
            const dueDate = new Date(task.due);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);
            if (dueDate < today && status !== 'completed') status = 'overdue';
            if (status === 'completed') completed++;
            else if (status === 'in-progress') inProgress++;
            else if (status === 'overdue') overdue++;
            else pending++;
        });
    }
    // Chart.js cannot render if all data is zero, so ensure at least one value is present
    let chartData = [completed, inProgress, pending, overdue];
    if (chartData.every(v => v === 0)) chartData = [1, 0, 0, 0];
    const taskChart = new Chart(taskCtx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'In Progress', 'Pending', 'Overdue'],
            datasets: [{
                data: chartData,
                backgroundColor: [
                    '#10b981', // Success green
                    '#3b82f6', // Primary blue
                    '#f59e0b', // Warning yellow
                    '#ef4444'  // Danger red
                ],
                borderWidth: 0,
                cutout: '60%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} tasks (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    taskChart.update();

    // Study Hours Bar Chart
    const studyCtx = document.getElementById('studyChart').getContext('2d');
    const studyChart = new Chart(studyCtx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Study Hours',
                // start with zero input; chart will be updated from saved schedules
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: [
                    'rgba(139, 69, 19, 0.8)',   // Monday
                    'rgba(255, 99, 132, 0.8)',  // Tuesday
                    'rgba(54, 162, 235, 0.8)',  // Wednesday
                    'rgba(255, 206, 86, 0.8)',  // Thursday
                    'rgba(75, 192, 192, 0.8)',  // Friday
                    'rgba(153, 102, 255, 0.8)', // Saturday
                    'rgba(255, 159, 64, 0.8)'   // Sunday
                ],
                borderColor: [
                    'rgba(139, 69, 19, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 2,
                        callback: function(value) {
                            return value + 'h';
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const idx = context.dataIndex;
                            const total = context.parsed && (context.parsed.y || context.parsed) ? (context.parsed.y || context.parsed) : context.raw || 0;
                            const breakdown = (window.studyChart && window.studyChart.__subjectBreakdown && window.studyChart.__subjectBreakdown[idx]) ? window.studyChart.__subjectBreakdown[idx] : [];
                            const lines = [`${total} hours studied`];
                            if (breakdown.length > 0) {
                                breakdown.forEach(b => {
                                    lines.push(`${b.subject}: ${b.hours}h`);
                                });
                            } else {
                                lines.push('No study sessions');
                            }
                            return lines;
                        }
                    }
                }
            },
            elements: {
                bar: {
                    borderRadius: 8
                }
            }
        }
    });

    // expose studyChart so other code can update it
    try { window.studyChart = studyChart; } catch (e) { /* ignore */ }
    // populate chart from saved schedules (if any)
    try { if (typeof updateStudyChart === 'function') updateStudyChart(); } catch (e) { /* ignore */ }

    // Add click handlers for interactive features
    taskChart.options.onClick = (event, elements) => {
        if (elements.length > 0) {
            const dataIndex = elements[0].index;
            const label = taskChart.data.labels[dataIndex];
            console.log(`Clicked on ${label} section`);
            //  navigate to filtered tasks view 
        }
    };

    studyChart.options.onClick = (event, elements) => {
        if (elements.length > 0) {
            const dataIndex = elements[0].index;
            const day = studyChart.data.labels[dataIndex];
            const hours = studyChart.data.datasets[0].data[dataIndex];
            console.log(`${day}: ${hours} hours`);
            //  show detailed schedule for that day
        }
    };
}

// Schedule Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const scheduleForm = document.getElementById('scheduleForm');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const subject = document.getElementById('studySubject').value;
            const date = document.getElementById('studyDate').value;
            const time = document.getElementById('studyTime').value;
            const duration = document.getElementById('studyDuration').value;
            const notes = document.getElementById('studyNotes').value;
            
            // Here you would typically save to localStorage or send to a server
            // compute start and end times
            const startDateTime = new Date(`${date}T${time}`);
            const durHours = parseFloat(duration) || 0;
            const endDateTime = new Date(startDateTime.getTime() + durHours * 3600 * 1000);
            // format time strings HH:MM
            function fmtTime(d) {
                if (!d || isNaN(d)) return '';
                const hh = String(d.getHours()).padStart(2,'0');
                const mm = String(d.getMinutes()).padStart(2,'0');
                return `${hh}:${mm}`;
            }
            const scheduleData = {
                id: Date.now(),
                subject,
                date,
                time: fmtTime(startDateTime),
                startISO: startDateTime.toISOString(),
                endISO: endDateTime.toISOString(),
                endTime: fmtTime(endDateTime),
                duration: durHours,
                notes,
                reminderSet: false,
                created: new Date().toISOString()
            };
            
            // Save to localStorage for demo purposes
            let schedules = JSON.parse(localStorage.getItem('studySchedules')) || [];
            schedules.push(scheduleData);
            localStorage.setItem('studySchedules', JSON.stringify(schedules));
            // Notification: study scheduled (include start → end)
            if (typeof addNotification === 'function') addNotification('schedule', 'Study session scheduled', `${subject} on ${date} • ${scheduleData.time} - ${scheduleData.endTime}`);
            // Update study chart immediately
            try { if (typeof updateStudyChart === 'function') updateStudyChart(); } catch (e) { console.error('updateStudyChart error', e); }
            // Refresh upcoming schedules UI
            try { if (typeof renderUpcomingSchedules === 'function') renderUpcomingSchedules(); } catch (e) { /* ignore */ }
            
            // Show success message
            alert(`Study session scheduled successfully!\nSubject: ${subject}\nDate: ${date}\nTime: ${time}`);
            
            // Reset form and close modal
            scheduleForm.reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('scheduleModal'));
            modal.hide();
        });
    }
    
    // Set minimum date to today
    const studyDateInput = document.getElementById('studyDate');
    if (studyDateInput) {
        const today = new Date().toISOString().split('T')[0];
        studyDateInput.min = today;
        studyDateInput.value = today;
    }
    
    // Add some interactive features
    addInteractiveFeatures();
    // render upcoming schedules and schedule reminders that were set
    try { if (typeof renderUpcomingSchedules === 'function') renderUpcomingSchedules(); } catch (e) { /* ignore */ }
    try { if (typeof scheduleAllRemindersOnLoad === 'function') scheduleAllRemindersOnLoad(); } catch (e) { /* ignore */ }
    // Attach handler for study chart refresh/reset button
    try {
        const refreshBtn = document.getElementById('studyRefreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const ok = confirm('Reset all study schedules? This will delete all saved sessions and reminders.');
                if (!ok) return;
                try { if (typeof window.clearStudySchedules === 'function') { window.clearStudySchedules(); } else { /* fallback */ localStorage.removeItem('studySchedules'); renderUpcomingSchedules(); if (typeof updateStudyChart === 'function') updateStudyChart(); } } catch (err) { console.error('clearStudySchedules failed', err); }
            });
        }
    } catch (err) { console.error('attach refresh handler failed', err); }
});

function addInteractiveFeatures() {
    // Animate stats cards on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe stats cards
    document.querySelectorAll('.stats-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });
    
    // Add loading state to charts
    const chartContainers = document.querySelectorAll('.chart-body');
    chartContainers.forEach(container => {
        container.classList.add('loading');
        setTimeout(() => {
            container.classList.remove('loading');
        }, 1500);
    });
    
    // Add click effects to cards
    document.querySelectorAll('.stats-card, .sidebar-card, .chart-container').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // ============================
    // TASK ACTIONS (EDIT, DELETE, VIEW)
    // ============================
    
    // Add event delegation for task action buttons
    const taskTable = document.getElementById('taskTable');
    if (taskTable) {
        taskTable.addEventListener('click', function(e) {
            const button = e.target.closest('button');
            if (!button) return;
            
            const row = button.closest('tr');
            if (!row) return;
            
            const title = button.getAttribute('title') || button.querySelector('i').className;
            
            if (title.includes('Edit') || button.querySelector('.bi-pencil')) {
                editTask(row);
            } else if (title.includes('Delete') || button.querySelector('.bi-trash')) {
                deleteTask(row);
            } else if (title.includes('View') || title.includes('Details') || button.querySelector('.bi-eye')) {
                viewTask(row);
            } else if (title.includes('Complete') || button.querySelector('.bi-check')) {
                markTaskComplete(row);
            }
        });
    }
    
    // Edit Task Function
    function editTask(row) {
        const taskName = row.querySelector('.task-title').textContent;
        const taskDescription = row.querySelector('.task-title').nextElementSibling.textContent;
        const taskSubject = row.querySelector('.subject-badge').textContent;
        const taskPriority = row.querySelector('.priority-badge').textContent.toLowerCase().trim();
        const taskStatus = row.getAttribute('data-status');
        const taskDueText = row.querySelector('td:nth-child(5) strong').textContent;
        
        // Parse due date
        const dueDate = new Date(taskDueText);
        const formattedDue = dueDate.toISOString().slice(0, 16);
        
        // Populate edit modal
        document.getElementById('editTaskName').value = taskName;
        document.getElementById('editTaskDescription').value = taskDescription === 'No description provided' ? '' : taskDescription;
        document.getElementById('editTaskSubject').value = taskSubject;
        document.getElementById('editTaskPriority').value = taskPriority;
        document.getElementById('editTaskStatus').value = taskStatus;
        document.getElementById('editTaskDue').value = formattedDue;
        
        // Store the row reference
        document.getElementById('editTaskIndex').value = Array.from(row.parentNode.children).indexOf(row);
        
        // Show modal
        new bootstrap.Modal(document.getElementById('editTaskModal')).show();
    }
    
    // View Task Function
    function viewTask(row) {
        const taskName = row.querySelector('.task-title').textContent;
        const taskDescription = row.querySelector('.task-title').nextElementSibling.textContent;
        const taskSubject = row.querySelector('.subject-badge').textContent;
        const taskPriorityElement = row.querySelector('.priority-badge');
        const taskStatusElement = row.querySelector('.badge');
        const taskDueText = row.querySelector('td:nth-child(5) strong').textContent;
        
        // Populate view modal
        document.getElementById('viewTaskName').textContent = taskName;
        document.getElementById('viewTaskDescription').textContent = taskDescription === 'No description provided' ? 'No description provided' : taskDescription;
        document.getElementById('viewTaskSubject').innerHTML = `<span class="subject-badge ${row.querySelector('.subject-badge').className}">${taskSubject}</span>`;
        document.getElementById('viewTaskPriority').innerHTML = taskPriorityElement.outerHTML;
        document.getElementById('viewTaskStatus').innerHTML = taskStatusElement.outerHTML;
        document.getElementById('viewTaskDue').textContent = taskDueText;
        
        // Show modal
        new bootstrap.Modal(document.getElementById('viewTaskModal')).show();
    }
    
    // Delete Task Function
    function deleteTask(row) {
        const taskName = row.querySelector('.task-title').textContent;
        
        if (confirm(`Are you sure you want to delete the task "${taskName}"?`)) {
            // Remove from DOM
            row.remove();
            // Remove from localStorage
            let tasks = JSON.parse(localStorage.getItem('tasksData')) || [];
            // Identify the task by name, description, subject, and due date
            const taskDescription = row.querySelector('.task-title').nextElementSibling.textContent;
            const taskSubject = row.querySelector('.subject-badge').textContent;
            const dueDate = row.querySelector('td:nth-child(5) strong').textContent;
            tasks = tasks.filter(task => {
                // Compare all relevant fields
                return !(
                    task.name === taskName &&
                    (task.description || 'No description provided') === taskDescription &&
                    task.subject === taskSubject &&
                    new Date(task.due).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) === dueDate
                );
            });
            localStorage.setItem('tasksData', JSON.stringify(tasks));
            updateStatistics();
            console.log('Task deleted successfully!');
            if (typeof addNotification === 'function') addNotification('task', 'Task deleted', taskName);
            if (typeof addActivity === 'function') addActivity(`Deleted task "${taskName}"`, 'task');
        }
    }
    
    // Mark Task Complete Function
    function markTaskComplete(row) {
        const taskName = row.querySelector('.task-title').textContent;
        
        if (confirm(`Mark task "${taskName}" as completed?`)) {
            // Update row data
            row.setAttribute('data-status', 'completed');
            
            // Update task icon
            const taskIcon = row.querySelector('.task-icon');
            taskIcon.className = 'task-icon bg-success me-3';
            taskIcon.innerHTML = '<i class="bi bi-check-circle"></i>';
            
            // Update status badge
            const statusBadge = row.querySelector('.badge');
            statusBadge.className = 'badge bg-success';
            statusBadge.textContent = 'Completed';
            
            // Update due date status
            const dueDateSmall = row.querySelector('td:nth-child(5) small');
            dueDateSmall.className = 'd-block text-success';
            dueDateSmall.textContent = 'Completed on time';
            
            // Update action buttons
            const actionBtns = row.querySelector('.btn-group');
            actionBtns.innerHTML = `
                <button class="btn btn-sm btn-outline-primary" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-success" title="View Details">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            `;
            // Persist change to localStorage (try index first, fallback to field match)
            try {
                const taskRows = Array.from(document.querySelectorAll('#taskTable .task-row'));
                const idx = taskRows.indexOf(row);
                let tasks = JSON.parse(localStorage.getItem('tasksData')) || [];
                let updated = false;
                if (typeof idx === 'number' && tasks[idx]) {
                    tasks[idx].status = 'completed';
                    tasks[idx].completedAt = new Date().toISOString();
                    updated = true;
                } else {
                    // Fallback: match by name, subject and due date
                    const subjectText = row.querySelector('.subject-badge') ? row.querySelector('.subject-badge').textContent.trim() : '';
                    const dueText = row.querySelector('td:nth-child(5) strong') ? row.querySelector('td:nth-child(5) strong').textContent.trim() : '';
                    for (let i = 0; i < tasks.length; i++) {
                        try {
                            const t = tasks[i];
                            const tDue = t.due ? (new Date(t.due)).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : String(t.due || '');
                            if (t.name === taskName && (t.subject === subjectText || tDue === dueText)) {
                                tasks[i].status = 'completed';
                                tasks[i].completedAt = new Date().toISOString();
                                updated = true;
                                break;
                            }
                        } catch (e) { continue; }
                    }
                }
                if (updated) {
                    localStorage.setItem('tasksData', JSON.stringify(tasks));
                } else {
                    // If nothing updated, try syncing table to storage by rebuilding tasks list
                    const rebuilt = [];
                    document.querySelectorAll('#taskTable .task-row').forEach(r => {
                        const name = r.querySelector('.task-title')?.textContent || '';
                        const description = r.querySelector('.task-title')?.nextElementSibling?.textContent || '';
                        const subject = r.querySelector('.subject-badge')?.textContent || '';
                        const priority = r.querySelector('.priority-badge')?.textContent.trim().toLowerCase() || '';
                        const status = r.getAttribute('data-status') || 'pending';
                        const due = r.querySelector('td:nth-child(5) strong')?.textContent || '';
                        rebuilt.push({ name, description, subject, priority, status, due });
                    });
                    localStorage.setItem('tasksData', JSON.stringify(rebuilt));
                }
            } catch (err) {
                console.error('Failed to persist task completion', err);
            }

            // Update UI, stats, notifications and recent activity
            updateStatistics();
            console.log('Task marked as completed!');
            try {
                if (typeof addNotification === 'function') addNotification('task', 'Task completed', taskName);
            } catch (e) { console.error('Notification failed', e); }
            try {
                if (typeof addActivity === 'function') addActivity(`Completed task "${taskName}"`, 'complete');
            } catch (e) { console.error('Adding activity failed', e); }
            try { if (typeof updateNotificationUI === 'function') updateNotificationUI(); } catch(e){}
            try { if (typeof renderRecentActivity === 'function') renderRecentActivity(); } catch(e){}
        }
    }
    
    // Function to edit task from view modal
    window.editTaskFromView = function() {
        bootstrap.Modal.getInstance(document.getElementById('viewTaskModal')).hide();
        setTimeout(() => {
            // Find the current task row (this would need to be improved with proper task identification)
            const rows = document.querySelectorAll('#taskTable tr');
            if (rows.length > 0) {
                editTask(rows[0]); // For demo - would need proper task identification
            }
        }, 300);
    };
    
    // Handle Edit Task Form Submission
    const editTaskForm = document.getElementById('editTaskForm');
    if (editTaskForm) {
        editTaskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const taskIndex = document.getElementById('editTaskIndex').value;
            const row = document.querySelectorAll('#taskTable tr')[taskIndex];
            
            if (!row) return;
            // Capture old due display and old task data for change detection
            const oldDueDisplay = row.querySelector('td:nth-child(5) strong').textContent;
            let tasks = JSON.parse(localStorage.getItem('tasksData')) || [];
            const oldTask = tasks[taskIndex] ? {...tasks[taskIndex]} : null;
            
            // Get form values
            const taskName = document.getElementById('editTaskName').value;
            const taskDescription = document.getElementById('editTaskDescription').value;
            const taskSubject = document.getElementById('editTaskSubject').value;
            const taskPriority = document.getElementById('editTaskPriority').value;
            const taskStatus = document.getElementById('editTaskStatus').value;
            const taskDue = document.getElementById('editTaskDue').value;
            
            // Create priority badge
            const priorityClass = taskPriority === 'high' ? 'priority-high' : 
                                taskPriority === 'medium' ? 'priority-medium' : 'priority-low';
            const priorityIcon = taskPriority === 'high' ? 'bi-arrow-up' : 
                               taskPriority === 'medium' ? 'bi-dash' : 'bi-arrow-down';
            
            // Create status badge
            const statusClass = taskStatus === 'completed' ? 'bg-success' : 
                              taskStatus === 'in-progress' ? 'bg-info' : 'bg-warning text-dark';
            const statusText = taskStatus.charAt(0).toUpperCase() + taskStatus.slice(1).replace('-', ' ');
            
            // Create task icon
            const taskIcon = taskStatus === 'completed' ? 'bi-check-circle' : 
                           taskStatus === 'in-progress' ? 'bi-arrow-clockwise' : 'bi-clock';
            const taskIconBg = taskStatus === 'completed' ? 'bg-success' : 
                             taskStatus === 'in-progress' ? 'bg-info' : 'bg-warning';
            
            // Create subject badge color
            const subjectColors = ['bg-primary', 'bg-info', 'bg-secondary', 'bg-success', 'bg-warning'];
            const subjectColor = subjectColors[Math.floor(Math.random() * subjectColors.length)];
            
            // Format due date
            const dueDate = new Date(taskDue);
            const today = new Date();
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let dueDateStatus = '';
            if (taskStatus === 'completed') {
                dueDateStatus = '<small class="d-block text-success">Completed on time</small>';
            } else if (diffDays < 0) {
                dueDateStatus = `<small class="d-block text-danger">${Math.abs(diffDays)} days overdue</small>`;
                row.setAttribute('data-status', 'overdue');
            } else if (diffDays <= 2) {
                dueDateStatus = `<small class="d-block text-warning">Due in ${diffDays} days</small>`;
            } else {
                dueDateStatus = `<small class="d-block text-muted">Due in ${diffDays} days</small>`;
            }
            
            // Update row
            row.setAttribute('data-status', diffDays < 0 && taskStatus !== 'completed' ? 'overdue' : taskStatus);

            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <div class="task-icon ${taskIconBg} me-3">
                            <i class="bi ${taskIcon}"></i>
                        </div>
                        <div>
                            <h6 class="mb-1 task-title">${taskName}</h6>
                            <small class="text-muted">${taskDescription || 'No description provided'}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="subject-badge ${subjectColor}">${taskSubject}</span>
                </td>
                <td>
                    <span class="priority-badge ${priorityClass}">
                        <i class="bi ${priorityIcon}"></i> ${taskPriority.charAt(0).toUpperCase() + taskPriority.slice(1)}
                    </span>
                </td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div>
                        <strong>${dueDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</strong>
                        ${dueDateStatus}
                    </div>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" title="${taskStatus === 'completed' ? 'View Details' : 'Mark Complete'}">
                            <i class="bi ${taskStatus === 'completed' ? 'bi-eye' : 'bi-check'}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            // Update localStorage with edited task
            tasks = tasks || JSON.parse(localStorage.getItem('tasksData')) || [];
            // Find the original task by index and update
            const newDueDisplay = dueDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
            if (typeof taskIndex !== 'undefined' && tasks[taskIndex]) {
                tasks[taskIndex] = {
                    name: taskName,
                    description: taskDescription,
                    subject: taskSubject,
                    priority: taskPriority,
                    status: row.getAttribute('data-status'),
                    due: newDueDisplay,
                    reminder: (tasks[taskIndex] && tasks[taskIndex].reminder) ? tasks[taskIndex].reminder : false
                };
                localStorage.setItem('tasksData', JSON.stringify(tasks));
            }

            // Notify if due date changed
            if (oldDueDisplay && newDueDisplay && oldDueDisplay !== newDueDisplay) {
                if (typeof addNotification === 'function') addNotification('task', 'Due date changed', `${taskName}: ${oldDueDisplay} → ${newDueDisplay}`);
                if (typeof addActivity === 'function') addActivity(`${taskName}: due date changed ${oldDueDisplay} → ${newDueDisplay}`, 'reminder');
            } else {
                if (typeof addActivity === 'function') addActivity(`Updated task "${taskName}"`, 'task');
            }

            // Hide modal and update statistics
            bootstrap.Modal.getInstance(document.getElementById('editTaskModal')).hide();
            updateStatistics();
            console.log('Task updated successfully!');
        });
    }
}

// ---------- Study schedule helpers ----------
// Compute weekly study data (Mon..Sun) from localStorage.studySchedules
function getWeeklyStudyData() {
    const schedules = JSON.parse(localStorage.getItem('studySchedules')) || [];
    const totals = [0,0,0,0,0,0,0]; // Mon..Sun
    schedules.forEach(s => {
        if (!s || !s.date) return;
        const d = new Date(s.date);
        if (isNaN(d)) return;
        const day = d.getDay(); // 0 Sun .. 6 Sat
        // map to index: Mon=0 .. Sun=6
        const idx = (day + 6) % 7;
        const dur = parseFloat(s.duration) || 0;
        totals[idx] += dur;
    });
    return totals;
}

function updateStudyChart() {
    try {
        // Build totals and per-day subject breakdown from schedules
        const schedules = JSON.parse(localStorage.getItem('studySchedules')) || [];
        const totals = [0,0,0,0,0,0,0];
        const breakdownMap = [ {}, {}, {}, {}, {}, {}, {} ];
        schedules.forEach(s => {
            if (!s || !s.date) return;
            const d = new Date(s.date);
            if (isNaN(d)) return;
            const day = d.getDay(); // 0 Sun .. 6 Sat
            const idx = (day + 6) % 7; // Mon=0 .. Sun=6
            const dur = parseFloat(s.duration) || 0;
            const subj = (s.subject || 'Unknown').toString();
            totals[idx] += dur;
            breakdownMap[idx][subj] = (breakdownMap[idx][subj] || 0) + dur;
        });

        // Convert breakdownMap objects into arrays [{subject,hours}, ...]
        const breakdownList = breakdownMap.map(obj => Object.keys(obj).map(k => ({ subject: k, hours: obj[k] })));

        if (window.studyChart && window.studyChart.data && window.studyChart.data.datasets && window.studyChart.data.datasets[0]) {
            window.studyChart.data.datasets[0].data = totals;
            // attach breakdown for tooltip use
            try { window.studyChart.__subjectBreakdown = breakdownList; } catch (e) { /* ignore */ }
            // Optionally adjust y.max to fit data (keep a sensible minimum)
            const maxVal = Math.max(...totals, 10);
            if (window.studyChart.options && window.studyChart.options.scales && window.studyChart.options.scales.y) {
                window.studyChart.options.scales.y.max = Math.max(10, Math.ceil(maxVal / 2) * 2);
            }
            window.studyChart.update();
        }
    } catch (err) {
        console.error('Failed to update study chart', err);
    }
}

// ---------- Upcoming schedules UI & reminders ----------
(function(){
    // store timeouts so they can be cleared if needed
    window._scheduleTimeouts = window._scheduleTimeouts || {};

    function requestNotificationPermission() {
        return new Promise((resolve) => {
            if (!('Notification' in window)) return resolve('unsupported');
            if (Notification.permission === 'granted') return resolve('granted');
            if (Notification.permission === 'denied') return resolve('denied');
            Notification.requestPermission().then(p => resolve(p));
        });
    }

    window.toggleReminder = async function(scheduleId) {
        try {
            const schedules = JSON.parse(localStorage.getItem('studySchedules')) || [];
            const idx = schedules.findIndex(s => s.id == scheduleId);
            if (idx === -1) return;
            const schedule = schedules[idx];
            if (schedule.reminderSet) {
                // cancel
                schedule.reminderSet = false;
                // clear timeout
                if (window._scheduleTimeouts && window._scheduleTimeouts[scheduleId]) {
                    clearTimeout(window._scheduleTimeouts[scheduleId]);
                    delete window._scheduleTimeouts[scheduleId];
                }
            } else {
                // set reminder - ensure permission
                const perm = await requestNotificationPermission();
                if (perm !== 'granted') {
                    alert('Notifications permission is required to set reminders.');
                    return;
                }
                schedule.reminderSet = true;
                scheduleReminderFor(schedule);
            }
            schedules[idx] = schedule;
            localStorage.setItem('studySchedules', JSON.stringify(schedules));
            if (typeof renderUpcomingSchedules === 'function') renderUpcomingSchedules();
        } catch (err) {
            console.error('toggleReminder error', err);
        }
    };

    window.scheduleReminderFor = function(schedule) {
        try {
            if (!schedule || !schedule.startISO) return;
            const start = new Date(schedule.startISO).getTime();
            const now = Date.now();
            const delay = start - now;
            // clear existing
            if (window._scheduleTimeouts[schedule.id]) {
                clearTimeout(window._scheduleTimeouts[schedule.id]);
                delete window._scheduleTimeouts[schedule.id];
            }
            if (delay <= 0) {
                // start time passed — show immediate notification
                showScheduleNotification(schedule);
                return;
            }
            // set timeout (note: long delays may be unreliable in background)
            const t = setTimeout(() => {
                showScheduleNotification(schedule);
                // clear flag if you want one-time reminders
                // keep reminderSet true to indicate user set it
            }, delay);
            window._scheduleTimeouts[schedule.id] = t;
        } catch (err) {
            console.error('scheduleReminderFor error', err);
        }
    };

    function showScheduleNotification(schedule) {
        try {
            if (!('Notification' in window) || Notification.permission !== 'granted') {
                // fallback: alert
                alert(`Reminder: ${schedule.subject} • ${schedule.date} ${schedule.time} - ${schedule.endTime}`);
                return;
            }
            const title = `Study session: ${schedule.subject}`;
            const body = `${schedule.date} • ${schedule.time} - ${schedule.endTime}`;
            const n = new Notification(title, { body });
            // optionally focus/open the app when clicked
            n.onclick = function() { window.focus(); };
        } catch (err) {
            console.error('showScheduleNotification error', err);
        }
    }

    window.renderUpcomingSchedules = function() {
        try {
            const container = document.getElementById('upcomingList');
            if (!container) return;
            const schedules = JSON.parse(localStorage.getItem('studySchedules')) || [];
            const now = Date.now();
            // upcoming: start >= now
            const upcoming = schedules.filter(s => s.startISO && new Date(s.startISO).getTime() >= now);
            upcoming.sort((a,b) => new Date(a.startISO) - new Date(b.startISO));
            container.innerHTML = '';
            if (upcoming.length === 0) {
                container.innerHTML = '<div class="text-muted small p-3">No upcoming sessions</div>';
                return;
            }
            upcoming.forEach(s => {
                const li = document.createElement('div');
                li.className = 'list-group-item d-flex align-items-start justify-content-between gap-2';
                li.innerHTML = `
                    <div class="me-2">
                      <div class="fw-semibold subject-label text-truncate" style="max-width:160px">${escapeHtml(s.subject || 'Unknown')}</div>
                      <div class="small text-muted">${s.date} • ${s.time} - ${s.endTime}</div>
                    </div>
                    <div class="d-flex flex-column align-items-end">
                      <button class="btn btn-sm ${s.reminderSet ? 'btn-success' : 'btn-outline-primary'}" data-id="${s.id}" onclick="toggleReminder(${s.id})">${s.reminderSet ? 'Reminder Set' : 'Set Reminder'}</button>
                    </div>
                `;
                container.appendChild(li);
            });
        } catch (err) {
            console.error('renderUpcomingSchedules error', err);
        }
    };

    window.scheduleAllRemindersOnLoad = function() {
        try {
            const schedules = JSON.parse(localStorage.getItem('studySchedules')) || [];
            const now = Date.now();
            schedules.forEach(s => {
                if (s.reminderSet) {
                    const start = new Date(s.startISO).getTime();
                    if (start > now) {
                        scheduleReminderFor(s);
                    } else if (start <= now) {
                        // if missed while offline, you might want to show immediately
                    }
                }
            });
        } catch (err) {
            console.error('scheduleAllRemindersOnLoad error', err);
        }
    };

    // Clear all study schedules and reminders, reset UI and chart to zero
    window.clearStudySchedules = function() {
        try {
            // clear stored schedules
            localStorage.removeItem('studySchedules');
            // clear any scheduled timeouts
            if (window._scheduleTimeouts) {
                Object.keys(window._scheduleTimeouts).forEach(k => {
                    try { clearTimeout(window._scheduleTimeouts[k]); } catch (e) {}
                });
                window._scheduleTimeouts = {};
            }
            // re-render upcoming list and update chart
            try { if (typeof renderUpcomingSchedules === 'function') renderUpcomingSchedules(); } catch (e) { console.error(e); }
            try { if (typeof updateStudyChart === 'function') updateStudyChart(); } catch (e) { console.error(e); }
            // add activity + notification
            try { if (typeof addActivity === 'function') addActivity('Cleared all study schedules', 'reminder'); } catch (e) {}
            try { if (typeof addNotification === 'function') addNotification('schedule', 'Study schedules reset', 'All study sessions have been removed.'); } catch (e) {}
        } catch (err) {
            console.error('Error clearing study schedules', err);
        }
    };

    // small helper to escape html
    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function(m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[m]; });
    }

})();