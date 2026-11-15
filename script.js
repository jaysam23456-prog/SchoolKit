/* SCHOOLKIT — Student Companion */

const STORAGE = {
    homework: "schoolkit_homework_v1",
    timetable: "schoolkit_timetable_v1"
};

const DAYS = [
    "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday", "Sunday"
];

let homework = readStore(STORAGE.homework, []);
let timetable = readStore(STORAGE.timetable, []);
let homeworkFilter = "all";
let selectedDay = currentDay();

function readStore(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : fallback;
    } catch {
        return fallback;
    }
}

function saveData() {
    localStorage.setItem(STORAGE.homework, JSON.stringify(homework));
    localStorage.setItem(STORAGE.timetable, JSON.stringify(timetable));
}

function currentDay() {
    const day = new Date().getDay();
    return DAYS[(day + 6) % 7];
}

function todayISO() {
    const d = new Date();
    const offset = d.getTimezoneOffset();

    return new Date(
        d.getTime() - offset * 60000
    ).toISOString().slice(0, 10);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[char]));
}

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2300);
}

function formatDate(dateString) {
    if (!dateString) return "No due date";

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function formatTime(time) {
    if (!time) return "";

    const [hours, minutes] = time.split(":").map(Number);
    const suffix = hours >= 12 ? "PM" : "AM";

    return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function getStats() {
    const total = homework.length;

    const completed = homework.filter(
        item => item.completed
    ).length;

    const pending = total - completed;

    const rate = total
        ? Math.round(completed / total * 100)
        : 0;

    return { total, completed, pending, rate };
}

/* NAVIGATION */

function navigate(viewName) {
    document.querySelectorAll(".view").forEach(view => {
        view.classList.remove("active");
    });

    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.classList.toggle(
            "active",
            btn.dataset.view === viewName
        );
    });

    const target = document.getElementById(`${viewName}View`);

    if (target) {
        target.classList.add("active");
    }

    const names = {
        dashboard: "Dashboard",
        homework: "Homework",
        timetable: "Timetable",
        analytics: "Performance"
    };

    document.getElementById("pageName").textContent =
        names[viewName] || "Dashboard";

    document.getElementById("sidebar").classList.remove("open");

    renderAll();
}

document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
        navigate(btn.dataset.view);
    });
});

document.querySelectorAll("[data-go]").forEach(btn => {
    btn.addEventListener("click", () => {
        navigate(btn.dataset.go);
    });
});

document.getElementById("mobileMenu").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
});

/* HOMEWORK FORM */

document.getElementById("homeworkForm").addEventListener("submit", event => {
    event.preventDefault();

    const title = document.getElementById("hwTitle").value.trim();
    const subject = document.getElementById("hwSubject").value.trim();
    const due = document.getElementById("hwDue").value;
    const notes = document.getElementById("hwNotes").value.trim();

    if (!title || !subject || !due) {
        return showToast("Please complete the required fields.");
    }

    homework.unshift({
        id: makeId(),
        title,
        subject,
        due,
        notes,
        completed: false,
        createdAt: Date.now()
    });

    saveData();

    event.target.reset();

    renderAll();

    showToast("Homework saved successfully.");
});

function makeId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

/* HOMEWORK ACTIONS */

document.getElementById("homeworkList").addEventListener("click", event => {
    const button = event.target.closest("[data-action]");

    if (!button) return;

    const id = button.dataset.id;

    if (button.dataset.action === "toggle") {
        const item = homework.find(task => task.id === id);

        if (item) {
            item.completed = !item.completed;

            showToast(
                item.completed
                    ? "Homework marked complete."
                    : "Homework moved to pending."
            );
        }

    } else if (button.dataset.action === "delete") {
        homework = homework.filter(task => task.id !== id);

        showToast("Homework deleted.");
    }

    saveData();
    renderAll();
});

/* HOMEWORK FILTERS */

document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        homeworkFilter = btn.dataset.filter;

        document.querySelectorAll(".filter-btn").forEach(item => {
            item.classList.toggle("active", item === btn);
        });

        renderHomework();
    });
});

/* TIMETABLE FORM */

document.getElementById("timetableForm").addEventListener("submit", event => {
    event.preventDefault();

    const subject = document.getElementById("classSubject").value.trim();
    const day = document.getElementById("classDay").value;
    const start = document.getElementById("classStart").value;
    const end = document.getElementById("classEnd").value;
    const extra = document.getElementById("classExtra").value.trim();

    if (!subject || !day || !start || !end) {
        return showToast("Please complete the required fields.");
    }

    if (end <= start) {
        return showToast("End time must be later than start time.");
    }

    timetable.push({
        id: makeId(),
        subject,
        day,
        start,
        end,
        extra
    });

    timetable.sort((a, b) =>
        DAYS.indexOf(a.day) - DAYS.indexOf(b.day) ||
        a.start.localeCompare(b.start)
    );

    selectedDay = day;

    saveData();

    event.target.reset();

    renderAll();

    showToast("Class added to your timetable.");
});

/* DELETE TIMETABLE CLASS */

document.getElementById("timetableList").addEventListener("click", event => {
    const button = event.target.closest("[data-delete-class]");

    if (!button) return;

    timetable = timetable.filter(
        item => item.id !== button.dataset.deleteClass
    );

    saveData();
    renderAll();

    showToast("Class removed.");
});

/* TIMETABLE DAY TABS */

document.getElementById("dayTabs").addEventListener("click", event => {
    const button = event.target.closest("[data-day]");

    if (!button) return;

    selectedDay = button.dataset.day;

    renderTimetable();
});

/* STATISTICS */

function renderStats() {
    const s = getStats();

    ["dashTotal", "anaTotal"].forEach(id => {
        document.getElementById(id).textContent = s.total;
    });

    ["dashCompleted", "anaCompleted"].forEach(id => {
        document.getElementById(id).textContent = s.completed;
    });

    ["dashPending", "anaPending"].forEach(id => {
        document.getElementById(id).textContent = s.pending;
    });

    document.getElementById("dashRate").textContent = `${s.rate}%`;
    document.getElementById("anaRate").textContent = `${s.rate}%`;

    document.getElementById("progressFill").style.width =
        `${s.rate}%`;

    document.getElementById("progressCaption").textContent = s.total
        ? `${s.completed} of ${s.total} homework tasks completed. ${
            s.pending
                ? "Keep going — you can do it!"
                : "Excellent work — everything is complete!"
        }`
        : "Complete a homework task to start tracking your progress.";
}

/* HOMEWORK DISPLAY */

function renderHomework() {
    const container = document.getElementById("homeworkList");

    let items = [...homework].sort((a, b) =>
        (a.due || "").localeCompare(b.due || "")
    );

    if (homeworkFilter === "pending") {
        items = items.filter(item => !item.completed);
    }

    if (homeworkFilter === "completed") {
        items = items.filter(item => item.completed);
    }

    if (!items.length) {
        container.innerHTML = `
            <div class="empty-state">
                ${
                    homework.length
                        ? "There are no tasks in this filter."
                        : "No homework saved yet. Use the form above to add your first task."
                }
            </div>
        `;

        return;
    }

    container.innerHTML = items.map(item => `
        <article class="homework-card ${item.completed ? "is-complete" : ""}">

            <button
                class="check-btn"
                data-action="toggle"
                data-id="${escapeHTML(item.id)}"
                aria-label="${item.completed ? "Mark pending" : "Mark complete"}"
            >${item.completed ? "✓" : ""}</button>

            <div class="homework-info">

                <span class="subject-tag">
                    ${escapeHTML(item.subject)}
                </span>

                <strong>${escapeHTML(item.title)}</strong>

                ${
                    item.notes
                        ? `<p>${escapeHTML(item.notes)}</p>`
                        : ""
                }

            </div>

            <span class="due-label">
                ${item.completed ? "Completed" : `Due ${formatDate(item.due)}`}
            </span>

            <button
                class="delete-btn"
                data-action="delete"
                data-id="${escapeHTML(item.id)}"
                aria-label="Delete homework"
            >×</button>

        </article>
    `).join("");
}

/* UPCOMING HOMEWORK */

function renderUpcoming() {
    const container = document.getElementById("upcomingList");

    const items = homework
        .filter(item => !item.completed)
        .sort((a, b) => (a.due || "").localeCompare(b.due || ""))
        .slice(0, 4);

    container.innerHTML = items.length
        ? items.map(item => `
            <div class="compact-item">

                <span class="mini-dot"></span>

                <div>
                    <strong>${escapeHTML(item.title)}</strong>

                    <small>
                        ${escapeHTML(item.subject)}
                        · Due ${formatDate(item.due)}
                    </small>
                </div>

            </div>
        `).join("")
        : `
            <div class="empty-state">
                No pending homework. Add a task when you get one.
            </div>
        `;
}

/* TODAY'S CLASSES */

function renderTodayClasses() {
    const container = document.getElementById("todayClasses");

    const items = timetable
        .filter(item => item.day === currentDay())
        .sort((a, b) => a.start.localeCompare(b.start))
        .slice(0, 4);

    container.innerHTML = items.length
        ? items.map(item => `
            <div class="compact-item">

                <span class="mini-dot"></span>

                <div>
                    <strong>${escapeHTML(item.subject)}</strong>

                    <small>
                        ${formatTime(item.start)} – ${formatTime(item.end)}
                        ${item.extra ? ` · ${escapeHTML(item.extra)}` : ""}
                    </small>
                </div>

            </div>
        `).join("")
        : `
            <div class="empty-state">
                No classes added for today.
            </div>
        `;
}

/* TIMETABLE DISPLAY */

function renderTimetable() {
    const tabs = document.getElementById("dayTabs");

    tabs.innerHTML = DAYS.map(day => `
        <button
            class="day-tab ${selectedDay === day ? "active" : ""}"
            data-day="${day}"
        >
            ${day.slice(0, 3)}
        </button>
    `).join("");

    const container = document.getElementById("timetableList");

    const items = timetable
        .filter(item => item.day === selectedDay)
        .sort((a, b) => a.start.localeCompare(b.start));

    container.innerHTML = items.length
        ? items.map(item => `
            <div class="class-row">

                <div class="class-time">
                    ${formatTime(item.start)}
                    <br>
                    to ${formatTime(item.end)}
                </div>

                <div>
                    <div class="class-subject">
                        ${escapeHTML(item.subject)}
                    </div>

                    <div class="class-extra">
                        ${escapeHTML(item.extra || "No room or teacher added")}
                    </div>
                </div>

                <button
                    class="class-delete"
                    data-delete-class="${escapeHTML(item.id)}"
                >
                    Remove
                </button>

            </div>
        `).join("")
        : `
            <div class="empty-state">
                No classes for ${selectedDay}.
                Add a lesson using the form above.
            </div>
        `;
}

/* RENDER EVERYTHING */

function renderAll() {
    renderStats();
    renderHomework();
    renderUpcoming();
    renderTodayClasses();
    renderTimetable();
}

/* INITIAL SETUP */

document.getElementById("todayLabel").textContent =
    new Date().toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });

document.getElementById("hwDue").min = todayISO();

renderAll();

/* SCHOOLKIT — SERVICE WORKER & AUTOMATIC UPDATES */

if (
    "serviceWorker" in navigator &&
    (location.protocol === "https:" || location.hostname === "localhost")
) {
    window.addEventListener("load", async () => {
        try {
            const registration = await navigator.serviceWorker.register(
    "./service-worker.js",
    {
        updateViaCache: "none"
    }
);

            console.log("SchoolKit Service Worker Registered!");

            const updateBanner = document.getElementById("updateBanner");
            const updateNowBtn = document.getElementById("updateNowBtn");

            // Display the update banner.
            function showUpdateBanner() {
                if (updateBanner) {
                    updateBanner.style.display = "flex";
                }
            }

            // Check for updates whenever the app opens.
            await registration.update();

            // Check whether an update is already waiting.
            if (registration.waiting && navigator.serviceWorker.controller) {
                showUpdateBanner();
            }

            // Detect a newly downloaded update.
            registration.addEventListener("updatefound", () => {
                const newWorker = registration.installing;

                if (!newWorker) return;

                newWorker.addEventListener("statechange", () => {
                    if (
                        newWorker.state === "installed" &&
                        navigator.serviceWorker.controller
                    ) {
                        showUpdateBanner();
                    }
                });
            });

            // Reload when the user clicks Update Now.
            if (updateNowBtn) {
    updateNowBtn.addEventListener("click", () => {

        const waitingWorker = registration.waiting;

        if (!waitingWorker) {
            registration.update();
            return;
        }

        updateNowBtn.textContent = "Updating...";
        updateNowBtn.disabled = true;

        navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => {
                window.location.reload();
            },
            { once: true }
        );

        waitingWorker.postMessage("SKIP_WAITING");
    });
}
        } catch (error) {
            console.error(
                "SchoolKit Service Worker Registration Failed:",
                error
            );
        }
    });
}