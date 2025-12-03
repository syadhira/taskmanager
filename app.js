document.addEventListener("DOMContentLoaded", () => {
    console.log("JS loaded");

    // ============================
    // LOGIN BUTTON
    // ============================
    const loginBtn = document.getElementById('loginBtn');

    if (loginBtn) {
        loginBtn.addEventListener('click', function () {
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();

            const validEmail = "2022463642@student.uitm.edu.my";
            const validPassword = "123456abcd@";

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
            const table = document.getElementById('taskTable');
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${document.getElementById('taskName').value}</td>
              <td>${document.getElementById('taskSubject').value}</td>
              <td><span class="badge ${document.getElementById('taskStatus').value === 'Completed' ? 'bg-success' : 'bg-warning text-dark'}">${document.getElementById('taskStatus').value}</span></td>
              <td>${document.getElementById('taskDue').value}</td>
              <td>
                <button class="btn btn-sm btn-secondary">Edit</button>
                <button class="btn btn-sm btn-danger">Delete</button>
              </td>
            `;
            table.appendChild(row);
            addTaskForm.reset();
            bootstrap.Modal.getInstance(document.getElementById('addTaskModal')).hide();
        });
    }

    // ============================
    // ADD SUBJECT
    // ============================
    const addSubjectForm = document.getElementById('addSubjectForm');
    if (addSubjectForm) {
        addSubjectForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const table = document.getElementById('subjectTable');
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${document.getElementById('subjectName').value}</td>
              <td>${document.getElementById('subjectCode').value}</td>
              <td>${document.getElementById('instructor').value}</td>
              <td>
                <button class="btn btn-sm btn-secondary">Edit</button>
                <button class="btn btn-sm btn-danger">Delete</button>
              </td>`;
            table.appendChild(row);
            addSubjectForm.reset();
            bootstrap.Modal.getInstance(document.getElementById('addSubjectModal')).hide();
        });
    }

    // ============================
    // EDIT PROFILE
    // ============================
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', function (e) {
            e.preventDefault();
            document.getElementById('studentName').textContent = document.getElementById('editName').value;
            document.getElementById('studentEmail').textContent = document.getElementById('editEmail').value;
            document.getElementById('studentProgram').textContent = document.getElementById('editProgram').value;

            editProfileForm.reset();
            bootstrap.Modal.getInstance(document.getElementById('editProfileModal')).hide();
        });
    }
});
