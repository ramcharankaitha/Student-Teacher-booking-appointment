// Admin Module - Handles all admin dashboard functionality

// Check auth on page load
window.addEventListener("load", () => {
    if (!Auth.checkAuth("admin")) return;
    const user = Auth.getCurrentUser();
    document.getElementById("adminName").textContent = user.name;
    document.getElementById("topbarName").textContent = user.name;
    Logger.info("Admin", "Admin dashboard loaded", user.uid);
    loadDashboardStats();
    loadRecentAppointments();
});

// Section Navigation
function showSection(section) {
    document.querySelectorAll(".section-panel").forEach(el => el.classList.remove("active"));
    document.getElementById(`section-${section}`).classList.add("active");

    document.querySelectorAll(".sidebar-nav a").forEach(el => el.classList.remove("active"));
    event.target.closest("a").classList.add("active");

    const titles = {
        dashboard: "Dashboard",
        teachers: "Manage Teachers",
        approvals: "Approve Registrations",
        appointments: "All Appointments",
        logs: "System Logs"
    };
    document.getElementById("pageTitle").textContent = titles[section] || "Dashboard";

    Logger.action("Admin", `Navigated to section: ${section}`, Auth.getCurrentUser().uid);

    // Load section data
    switch (section) {
        case "dashboard":
            loadDashboardStats();
            loadRecentAppointments();
            break;
        case "teachers":
            loadTeachers();
            break;
        case "approvals":
            loadPendingApprovals();
            break;
        case "appointments":
            loadAllAppointments();
            break;
        case "logs":
            loadLogs();
            break;
    }
}

// Toggle sidebar for mobile
function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("open");
}

// ===== Dashboard Stats =====
async function loadDashboardStats() {
    try {
        const teachersSnap = await db.collection("users").where("role", "==", "teacher").get();
        const studentsSnap = await db.collection("users").where("role", "==", "student").get();
        const pendingSnap = await db.collection("users").where("approved", "==", false).get();
        const appointmentsSnap = await db.collection("appointments").get();

        document.getElementById("totalTeachers").textContent = teachersSnap.size;
        document.getElementById("totalStudents").textContent = studentsSnap.size;
        document.getElementById("pendingApprovals").textContent = pendingSnap.size;
        document.getElementById("totalAppointments").textContent = appointmentsSnap.size;

        Logger.info("Admin", "Dashboard stats loaded");
    } catch (error) {
        Logger.error("Admin", `Failed to load stats: ${error.message}`);
    }
}

// ===== Recent Appointments =====
async function loadRecentAppointments() {
    try {
        const snap = await db.collection("appointments")
            .orderBy("createdAt", "desc")
            .limit(5)
            .get();

        const tbody = document.getElementById("recentAppointments");

        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No appointments found</td></tr>';
            return;
        }

        let html = "";
        snap.forEach(doc => {
            const data = doc.data();
            const statusClass = data.status === "approved" ? "badge-approved" :
                data.status === "cancelled" ? "badge-cancelled" : "badge-pending";
            html += `
                <tr>
                    <td>${data.studentName || "N/A"}</td>
                    <td>${data.teacherName || "N/A"}</td>
                    <td>${data.date || "N/A"}</td>
                    <td>${data.time || "N/A"}</td>
                    <td><span class="badge ${statusClass}">${data.status}</span></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
        Logger.info("Admin", "Recent appointments loaded");
    } catch (error) {
        Logger.error("Admin", `Failed to load recent appointments: ${error.message}`);
    }
}

// ===== Manage Teachers =====
async function loadTeachers() {
    try {
        const snap = await db.collection("users").where("role", "==", "teacher").get();
        const tbody = document.getElementById("teachersList");

        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No teachers found</td></tr>';
            return;
        }

        let html = "";
        snap.forEach(doc => {
            const data = doc.data();
            const statusClass = data.approved ? "badge-approved" : "badge-pending";
            const statusText = data.approved ? "Approved" : "Pending";
            html += `
                <tr>
                    <td>${data.name}</td>
                    <td>${data.email}</td>
                    <td>${data.department || "N/A"}</td>
                    <td>${data.subject || "N/A"}</td>
                    <td>${data.qualification || "N/A"}</td>
                    <td>${data.experience || "N/A"} yrs</td>
                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-primary" onclick="openEditTeacherModal('${doc.id}')">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteTeacher('${doc.id}', '${data.name}')">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
        Logger.info("Admin", "Teachers list loaded");
    } catch (error) {
        Logger.error("Admin", `Failed to load teachers: ${error.message}`);
    }
}

// Add Teacher Modal
function openAddTeacherModal() {
    document.getElementById("teacherModalTitle").textContent = "Add Teacher";
    document.getElementById("teacherSubmitBtn").textContent = "Add Teacher";
    document.getElementById("editTeacherId").value = "";
    document.getElementById("teacherForm").reset();
    document.getElementById("tPassword").required = true;
    document.getElementById("passwordHint").textContent = "Required for new teachers";
    document.getElementById("tEmail").disabled = false;
    openModal("teacherModal");
    Logger.action("Admin", "Opened Add Teacher modal", Auth.getCurrentUser().uid);
}

// Edit Teacher Modal
async function openEditTeacherModal(teacherId) {
    try {
        const doc = await db.collection("users").doc(teacherId).get();
        if (!doc.exists) {
            alert("Teacher not found!");
            return;
        }
        const data = doc.data();

        document.getElementById("teacherModalTitle").textContent = "Edit Teacher";
        document.getElementById("teacherSubmitBtn").textContent = "Update Teacher";
        document.getElementById("editTeacherId").value = teacherId;
        document.getElementById("tName").value = data.name || "";
        document.getElementById("tEmail").value = data.email || "";
        document.getElementById("tEmail").disabled = true;
        document.getElementById("tPassword").value = "";
        document.getElementById("tPassword").required = false;
        document.getElementById("passwordHint").textContent = "Leave blank to keep current password";
        document.getElementById("tDepartment").value = data.department || "";
        document.getElementById("tSubject").value = data.subject || "";
        document.getElementById("tQualification").value = data.qualification || "";
        document.getElementById("tExperience").value = data.experience || "";

        openModal("teacherModal");
        Logger.action("Admin", `Opened Edit Teacher modal for: ${data.name}`, Auth.getCurrentUser().uid);
    } catch (error) {
        Logger.error("Admin", `Failed to load teacher for edit: ${error.message}`);
        alert("Failed to load teacher data.");
    }
}

// Handle Add/Edit Teacher Submit
async function handleTeacherSubmit(e) {
    e.preventDefault();
    const teacherId = document.getElementById("editTeacherId").value;
    const isEdit = !!teacherId;

    const name = document.getElementById("tName").value.trim();
    const email = document.getElementById("tEmail").value.trim();
    const password = document.getElementById("tPassword").value;
    const department = document.getElementById("tDepartment").value.trim();
    const subject = document.getElementById("tSubject").value.trim();
    const qualification = document.getElementById("tQualification").value.trim();
    const experience = document.getElementById("tExperience").value;

    showLoading(true);

    try {
        if (isEdit) {
            // Update teacher in Firestore
            await db.collection("users").doc(teacherId).update({
                name, department, subject, qualification, experience
            });
            Logger.action("Admin", `Teacher updated: ${name}`, Auth.getCurrentUser().uid);
            alert("Teacher updated successfully!");
        } else {
            // Create new teacher via Firebase Auth using a secondary app
            // This prevents the admin from being signed out
            if (!password || password.length < 6) {
                alert("Password must be at least 6 characters.");
                showLoading(false);
                return;
            }

            const adminUid = Auth.getCurrentUser().uid;

            // Use a temporary secondary Firebase app to create the user
            let secondaryApp;
            try {
                secondaryApp = firebase.app("secondary");
            } catch (e) {
                secondaryApp = firebase.initializeApp(firebase.app().options, "secondary");
            }
            const secondaryAuth = secondaryApp.auth();

            const userCredential = await secondaryAuth.createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;

            // Sign out from secondary app immediately
            await secondaryAuth.signOut();

            await db.collection("users").doc(uid).set({
                uid, email, name, role: "teacher",
                department, subject, qualification, experience,
                approved: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            Logger.action("Admin", `New teacher added: ${name} (${email})`, adminUid);
            alert("Teacher added successfully!");
        }

        closeModal("teacherModal");
        loadTeachers();
        loadDashboardStats();
    } catch (error) {
        Logger.error("Admin", `Teacher operation failed: ${error.message}`);
        alert("Operation failed: " + error.message);
    }

    showLoading(false);
}

// Delete Teacher
async function deleteTeacher(teacherId, teacherName) {
    if (!confirm(`Are you sure you want to delete teacher "${teacherName}"? This action cannot be undone.`)) {
        return;
    }

    showLoading(true);
    try {
        await db.collection("users").doc(teacherId).delete();
        Logger.action("Admin", `Teacher deleted: ${teacherName}`, Auth.getCurrentUser().uid);
        alert("Teacher deleted successfully!");
        loadTeachers();
        loadDashboardStats();
    } catch (error) {
        Logger.error("Admin", `Failed to delete teacher: ${error.message}`);
        alert("Failed to delete teacher: " + error.message);
    }
    showLoading(false);
}

// ===== Approve Registrations =====
let currentApprovalFilter = "all";

async function loadPendingApprovals(filter) {
    if (filter) currentApprovalFilter = filter;

    try {
        let query = db.collection("users").where("approved", "==", false);
        if (currentApprovalFilter !== "all") {
            query = query.where("role", "==", currentApprovalFilter);
        }

        const snap = await query.get();
        const tbody = document.getElementById("approvalsList");

        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No pending registrations</td></tr>';
            return;
        }

        let html = "";
        snap.forEach(doc => {
            const data = doc.data();
            let details = "";
            if (data.role === "student") {
                details = `ID: ${data.studentId || "N/A"}, Course: ${data.course || "N/A"}, Sem: ${data.semester || "N/A"}`;
            } else {
                details = `Dept: ${data.department || "N/A"}, Subject: ${data.subject || "N/A"}`;
            }
            html += `
                <tr>
                    <td>${data.name}</td>
                    <td>${data.email}</td>
                    <td><span class="badge ${data.role === 'student' ? 'badge-approved' : 'badge-pending'}">${data.role}</span></td>
                    <td>${details}</td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-success" onclick="approveUser('${doc.id}', '${data.name}')">Approve</button>
                            <button class="btn btn-sm btn-danger" onclick="rejectUser('${doc.id}', '${data.name}')">Reject</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
        Logger.info("Admin", `Pending approvals loaded (filter: ${currentApprovalFilter})`);
    } catch (error) {
        Logger.error("Admin", `Failed to load approvals: ${error.message}`);
    }
}

function filterApprovals(filter, btn) {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadPendingApprovals(filter);
}

async function approveUser(userId, userName) {
    if (!confirm(`Approve registration for "${userName}"?`)) return;

    showLoading(true);
    try {
        await db.collection("users").doc(userId).update({ approved: true });
        Logger.action("Admin", `User approved: ${userName}`, Auth.getCurrentUser().uid);
        alert(`${userName} has been approved!`);
        loadPendingApprovals();
        loadDashboardStats();
    } catch (error) {
        Logger.error("Admin", `Failed to approve user: ${error.message}`);
        alert("Failed to approve: " + error.message);
    }
    showLoading(false);
}

async function rejectUser(userId, userName) {
    if (!confirm(`Reject and delete registration for "${userName}"? This will remove their account.`)) return;

    showLoading(true);
    try {
        await db.collection("users").doc(userId).delete();
        Logger.action("Admin", `User rejected and deleted: ${userName}`, Auth.getCurrentUser().uid);
        alert(`${userName}'s registration has been rejected.`);
        loadPendingApprovals();
        loadDashboardStats();
    } catch (error) {
        Logger.error("Admin", `Failed to reject user: ${error.message}`);
        alert("Failed to reject: " + error.message);
    }
    showLoading(false);
}

// ===== All Appointments =====
async function loadAllAppointments() {
    try {
        const snap = await db.collection("appointments").orderBy("createdAt", "desc").get();
        const tbody = document.getElementById("allAppointments");

        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No appointments found</td></tr>';
            return;
        }

        let html = "";
        snap.forEach(doc => {
            const data = doc.data();
            const statusClass = data.status === "approved" ? "badge-approved" :
                data.status === "cancelled" ? "badge-cancelled" :
                data.status === "rejected" ? "badge-rejected" : "badge-pending";
            html += `
                <tr>
                    <td>${data.studentName || "N/A"}</td>
                    <td>${data.teacherName || "N/A"}</td>
                    <td>${data.date || "N/A"}</td>
                    <td>${data.time || "N/A"}</td>
                    <td>${data.purpose || "N/A"}</td>
                    <td><span class="badge ${statusClass}">${data.status}</span></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
        Logger.info("Admin", "All appointments loaded");
    } catch (error) {
        Logger.error("Admin", `Failed to load appointments: ${error.message}`);
    }
}

// ===== System Logs =====
async function loadLogs() {
    try {
        const snap = await db.collection("logs")
            .orderBy("timestamp", "desc")
            .limit(50)
            .get();

        const tbody = document.getElementById("logsList");

        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No logs found</td></tr>';
            return;
        }

        let html = "";
        snap.forEach(doc => {
            const data = doc.data();
            const levelClass = data.level === "ERROR" ? "badge-rejected" :
                data.level === "WARN" ? "badge-pending" :
                data.level === "ACTION" ? "badge-approved" : "badge-cancelled";
            html += `
                <tr>
                    <td style="white-space: nowrap; font-size: 12px;">${data.timestamp || "N/A"}</td>
                    <td><span class="badge ${levelClass}">${data.level}</span></td>
                    <td>${data.module || "N/A"}</td>
                    <td style="font-size: 13px;">${data.message || "N/A"}</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
        Logger.info("Admin", "System logs loaded");
    } catch (error) {
        Logger.error("Admin", `Failed to load logs: ${error.message}`);
    }
}

// ===== Modal Helpers =====
function openModal(id) {
    document.getElementById(id).classList.add("show");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("show");
}

function showLoading(show) {
    document.getElementById("loadingOverlay").classList.toggle("show", show);
}
