// Student Module - Handles all student dashboard functionality

let allTeachers = [];

// Check auth on page load
window.addEventListener("load", () => {
    if (!Auth.checkAuth("student")) return;
    const user = Auth.getCurrentUser();
    document.getElementById("studentName").textContent = user.name;
    document.getElementById("topbarName").textContent = user.name;
    Logger.info("Student", "Student dashboard loaded", user.uid);
    loadStudentDashboard();
    loadAllTeachers();
});

// Section Navigation
function showSection(section) {
    document.querySelectorAll(".section-panel").forEach(el => el.classList.remove("active"));
    document.getElementById(`section-${section}`).classList.add("active");

    document.querySelectorAll(".sidebar-nav a").forEach(el => el.classList.remove("active"));
    event.target.closest("a").classList.add("active");

    const titles = {
        dashboard: "Dashboard",
        search: "Search Teacher",
        book: "Book Appointment",
        "my-appointments": "My Appointments",
        messages: "Send Message"
    };
    document.getElementById("pageTitle").textContent = titles[section] || "Dashboard";

    Logger.action("Student", `Navigated to section: ${section}`, Auth.getCurrentUser().uid);

    // Load section data
    switch (section) {
        case "dashboard":
            loadStudentDashboard();
            break;
        case "search":
            renderTeacherGrid(allTeachers);
            break;
        case "book":
            populateTeacherDropdowns();
            break;
        case "my-appointments":
            loadMyAppointments();
            break;
        case "messages":
            populateTeacherDropdowns();
            loadSentMessages();
            break;
    }
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("open");
}

// ===== Dashboard =====
async function loadStudentDashboard() {
    const uid = Auth.getCurrentUser().uid;
    try {
        const allSnap = await db.collection("appointments").where("studentId", "==", uid).get();
        const pendingSnap = await db.collection("appointments")
            .where("studentId", "==", uid)
            .where("status", "==", "pending")
            .get();
        const approvedSnap = await db.collection("appointments")
            .where("studentId", "==", uid)
            .where("status", "==", "approved")
            .get();
        const messagesSnap = await db.collection("messages").where("fromId", "==", uid).get();

        document.getElementById("myTotalAppointments").textContent = allSnap.size;
        document.getElementById("myPendingCount").textContent = pendingSnap.size;
        document.getElementById("myApprovedCount").textContent = approvedSnap.size;
        document.getElementById("mySentMessages").textContent = messagesSnap.size;

        // Load recent appointments
        loadRecentAppointments();

        Logger.info("Student", "Dashboard stats loaded", uid);
    } catch (error) {
        Logger.error("Student", `Failed to load dashboard: ${error.message}`, uid);
    }
}

async function loadRecentAppointments() {
    const uid = Auth.getCurrentUser().uid;
    try {
        const snap = await db.collection("appointments")
            .where("studentId", "==", uid)
            .orderBy("createdAt", "desc")
            .limit(5)
            .get();

        const tbody = document.getElementById("recentStudentAppointments");

        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No appointments yet</td></tr>';
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
                    <td>${data.teacherName || "N/A"}</td>
                    <td>${data.date || "N/A"}</td>
                    <td>${data.time || "N/A"}</td>
                    <td>${data.purpose || "N/A"}</td>
                    <td><span class="badge ${statusClass}">${data.status}</span></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (error) {
        Logger.error("Student", `Failed to load recent appointments: ${error.message}`, uid);
    }
}

// ===== Load All Teachers =====
async function loadAllTeachers() {
    try {
        const snap = await db.collection("users")
            .where("role", "==", "teacher")
            .where("approved", "==", true)
            .get();

        allTeachers = [];
        snap.forEach(doc => {
            allTeachers.push({ id: doc.id, ...doc.data() });
        });

        populateTeacherDropdowns();
        Logger.info("Student", `Loaded ${allTeachers.length} teachers`);
    } catch (error) {
        Logger.error("Student", `Failed to load teachers: ${error.message}`);
    }
}

// ===== Search Teachers =====
function searchTeachers() {
    const query = document.getElementById("searchInput").value.toLowerCase().trim();

    if (!query) {
        renderTeacherGrid(allTeachers);
        return;
    }

    const filtered = allTeachers.filter(t =>
        (t.name && t.name.toLowerCase().includes(query)) ||
        (t.department && t.department.toLowerCase().includes(query)) ||
        (t.subject && t.subject.toLowerCase().includes(query))
    );

    renderTeacherGrid(filtered);
    Logger.action("Student", `Searched teachers: "${query}" (${filtered.length} results)`, Auth.getCurrentUser().uid);
}

function renderTeacherGrid(teachers) {
    const grid = document.getElementById("teacherGrid");

    if (teachers.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div>
                <p>No teachers found matching your search.</p>
            </div>
        `;
        return;
    }

    let html = "";
    teachers.forEach(t => {
        html += `
            <div class="teacher-card">
                <div class="teacher-name">${t.name}</div>
                <div class="teacher-detail"><strong>Department:</strong> ${t.department || "N/A"}</div>
                <div class="teacher-detail"><strong>Subject:</strong> ${t.subject || "N/A"}</div>
                <div class="teacher-detail"><strong>Qualification:</strong> ${t.qualification || "N/A"}</div>
                <div class="teacher-detail"><strong>Experience:</strong> ${t.experience || "N/A"} years</div>
                <div class="teacher-detail"><strong>Email:</strong> ${t.email || "N/A"}</div>
                <div class="card-actions">
                    <button class="btn btn-sm btn-primary" onclick="goToBookWithTeacher('${t.id}')">Book Appointment</button>
                    <button class="btn btn-sm btn-secondary" onclick="goToMessageTeacher('${t.id}')">Send Message</button>
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

// Quick actions from teacher cards
function goToBookWithTeacher(teacherId) {
    showSection.call(null, "book");
    // Manually set active nav
    document.querySelectorAll(".section-panel").forEach(el => el.classList.remove("active"));
    document.getElementById("section-book").classList.add("active");
    document.getElementById("pageTitle").textContent = "Book Appointment";

    setTimeout(() => {
        document.getElementById("selectTeacher").value = teacherId;
        loadTeacherSlots();
    }, 200);

    Logger.action("Student", `Quick book for teacher: ${teacherId}`, Auth.getCurrentUser().uid);
}

function goToMessageTeacher(teacherId) {
    document.querySelectorAll(".section-panel").forEach(el => el.classList.remove("active"));
    document.getElementById("section-messages").classList.add("active");
    document.getElementById("pageTitle").textContent = "Send Message";

    setTimeout(() => {
        document.getElementById("msgTeacher").value = teacherId;
    }, 200);

    Logger.action("Student", `Quick message for teacher: ${teacherId}`, Auth.getCurrentUser().uid);
}

// ===== Populate Teacher Dropdowns =====
function populateTeacherDropdowns() {
    const bookSelect = document.getElementById("selectTeacher");
    const msgSelect = document.getElementById("msgTeacher");

    let options = '<option value="">Choose a teacher...</option>';
    allTeachers.forEach(t => {
        options += `<option value="${t.id}">${t.name} - ${t.department || ""} (${t.subject || ""})</option>`;
    });

    if (bookSelect) bookSelect.innerHTML = options;
    if (msgSelect) msgSelect.innerHTML = options;
}

// ===== Load Teacher Slots for Booking =====
async function loadTeacherSlots() {
    const teacherId = document.getElementById("selectTeacher").value;
    const slotSelect = document.getElementById("selectSlot");

    if (!teacherId) {
        slotSelect.innerHTML = '<option value="">Select a teacher first...</option>';
        return;
    }

    try {
        const snap = await db.collection("slots")
            .where("teacherId", "==", teacherId)
            .where("isBooked", "==", false)
            .orderBy("date", "asc")
            .get();

        if (snap.empty) {
            slotSelect.innerHTML = '<option value="">No available slots</option>';
            return;
        }

        let options = '<option value="">Choose a slot...</option>';
        snap.forEach(doc => {
            const data = doc.data();
            options += `<option value="${doc.id}" data-date="${data.date}" data-time="${data.startTime}-${data.endTime}">
                ${data.day} - ${data.date} (${data.startTime} to ${data.endTime})
            </option>`;
        });
        slotSelect.innerHTML = options;

        Logger.info("Student", `Loaded ${snap.size} available slots for teacher: ${teacherId}`);
    } catch (error) {
        Logger.error("Student", `Failed to load slots: ${error.message}`);
        slotSelect.innerHTML = '<option value="">Error loading slots</option>';
    }
}

// ===== Book Appointment =====
async function handleBookAppointment(e) {
    e.preventDefault();
    const uid = Auth.getCurrentUser().uid;
    const user = Auth.getCurrentUser();

    const teacherId = document.getElementById("selectTeacher").value;
    const slotId = document.getElementById("selectSlot").value;
    const purpose = document.getElementById("bookPurpose").value.trim();

    if (!teacherId || !slotId) {
        alert("Please select a teacher and an available slot.");
        return;
    }

    // Get teacher name and slot details
    const selectedTeacher = allTeachers.find(t => t.id === teacherId);
    const slotOption = document.getElementById("selectSlot").selectedOptions[0];
    const date = slotOption.dataset.date;
    const time = slotOption.dataset.time;

    showLoading(true);
    try {
        // Create appointment
        await db.collection("appointments").add({
            studentId: uid,
            studentName: user.name,
            studentEmail: user.email,
            teacherId: teacherId,
            teacherName: selectedTeacher ? selectedTeacher.name : "Unknown",
            slotId: slotId,
            date: date,
            time: time,
            purpose: purpose,
            status: "pending",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Mark slot as booked
        await db.collection("slots").doc(slotId).update({
            isBooked: true
        });

        Logger.action("Student", `Appointment booked with ${selectedTeacher ? selectedTeacher.name : teacherId} on ${date}`, uid);
        alert("Appointment booked successfully! Please wait for teacher approval.");
        document.getElementById("bookForm").reset();
        document.getElementById("selectSlot").innerHTML = '<option value="">Select a teacher first...</option>';
        loadStudentDashboard();
    } catch (error) {
        Logger.error("Student", `Failed to book appointment: ${error.message}`, uid);
        alert("Failed to book appointment: " + error.message);
    }
    showLoading(false);
}

// ===== My Appointments =====
async function loadMyAppointments() {
    const uid = Auth.getCurrentUser().uid;
    try {
        const snap = await db.collection("appointments")
            .where("studentId", "==", uid)
            .orderBy("createdAt", "desc")
            .get();

        const tbody = document.getElementById("myAppointmentsList");

        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No appointments found</td></tr>';
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
                    <td>${data.teacherName || "N/A"}</td>
                    <td>${data.date || "N/A"}</td>
                    <td>${data.time || "N/A"}</td>
                    <td>${data.purpose || "N/A"}</td>
                    <td><span class="badge ${statusClass}">${data.status}</span></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
        Logger.info("Student", "My appointments loaded", uid);
    } catch (error) {
        Logger.error("Student", `Failed to load appointments: ${error.message}`, uid);
    }
}

// ===== Send Message =====
async function handleSendMessage(e) {
    e.preventDefault();
    const uid = Auth.getCurrentUser().uid;
    const user = Auth.getCurrentUser();

    const teacherId = document.getElementById("msgTeacher").value;
    const subject = document.getElementById("msgSubject").value.trim();
    const body = document.getElementById("msgBody").value.trim();

    if (!teacherId) {
        alert("Please select a teacher.");
        return;
    }

    const selectedTeacher = allTeachers.find(t => t.id === teacherId);

    showLoading(true);
    try {
        await db.collection("messages").add({
            fromId: uid,
            fromName: user.name,
            fromEmail: user.email,
            toId: teacherId,
            toName: selectedTeacher ? selectedTeacher.name : "Unknown",
            subject: subject,
            message: body,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        Logger.action("Student", `Message sent to ${selectedTeacher ? selectedTeacher.name : teacherId}: ${subject}`, uid);
        alert("Message sent successfully!");
        document.getElementById("messageForm").reset();
        loadSentMessages();
        loadStudentDashboard();
    } catch (error) {
        Logger.error("Student", `Failed to send message: ${error.message}`, uid);
        alert("Failed to send message: " + error.message);
    }
    showLoading(false);
}

// ===== Sent Messages =====
async function loadSentMessages() {
    const uid = Auth.getCurrentUser().uid;
    try {
        const snap = await db.collection("messages")
            .where("fromId", "==", uid)
            .orderBy("createdAt", "desc")
            .get();

        const list = document.getElementById("sentMessagesList");

        if (snap.empty) {
            list.innerHTML = `
                <li class="empty-state">
                    <div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>
                    <p>No messages sent yet.</p>
                </li>
            `;
            return;
        }

        let html = "";
        snap.forEach(doc => {
            const data = doc.data();
            const time = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : "N/A";
            html += `
                <li class="message-item">
                    <div class="message-header">
                        <span class="message-from">To: ${data.toName || "Unknown"}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-body"><strong>${data.subject || ""}</strong><br>${data.message || ""}</div>
                </li>
            `;
        });
        list.innerHTML = html;
        Logger.info("Student", "Sent messages loaded", uid);
    } catch (error) {
        Logger.error("Student", `Failed to load sent messages: ${error.message}`, uid);
    }
}

// ===== Helpers =====
function openModal(id) {
    document.getElementById(id).classList.add("show");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("show");
}

function showLoading(show) {
    document.getElementById("loadingOverlay").classList.toggle("show", show);
}
