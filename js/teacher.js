// Teacher Module - Handles all teacher dashboard functionality

// Check auth on page load
window.addEventListener("load", () => {
    if (!Auth.checkAuth("teacher")) return;
    const user = Auth.getCurrentUser();
    document.getElementById("teacherName").textContent = user.name;
    document.getElementById("topbarName").textContent = user.name;
    Logger.info("Teacher", "Teacher dashboard loaded", user.uid);
    loadTeacherDashboard();
});

// Section Navigation
function showSection(section) {
    document.querySelectorAll(".section-panel").forEach(el => el.classList.remove("active"));
    document.getElementById(`section-${section}`).classList.add("active");

    document.querySelectorAll(".sidebar-nav a").forEach(el => el.classList.remove("active"));
    event.target.closest("a").classList.add("active");

    const titles = {
        dashboard: "Dashboard",
        schedule: "Schedule Appointment",
        appointments: "Approve/Cancel Appointments",
        messages: "View Messages",
        "all-appointments": "View All Appointments"
    };
    document.getElementById("pageTitle").textContent = titles[section] || "Dashboard";

    Logger.action("Teacher", `Navigated to section: ${section}`, Auth.getCurrentUser().uid);

    // Load section data
    switch (section) {
        case "dashboard":
            loadTeacherDashboard();
            break;
        case "schedule":
            loadSlots();
            break;
        case "appointments":
            loadPendingAppointments();
            break;
        case "messages":
            loadMessages();
            break;
        case "all-appointments":
            loadAllAppointments();
            break;
    }
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("open");
}

// ===== Dashboard =====
async function loadTeacherDashboard() {
    const uid = Auth.getCurrentUser().uid;
    try {
        const slotsSnap = await db.collection("slots").where("teacherId", "==", uid).get();
        const pendingSnap = await db.collection("appointments")
            .where("teacherId", "==", uid)
            .where("status", "==", "pending")
            .get();
        const approvedSnap = await db.collection("appointments")
            .where("teacherId", "==", uid)
            .where("status", "==", "approved")
            .get();
        const messagesSnap = await db.collection("messages").where("toId", "==", uid).get();

        document.getElementById("totalSlots").textContent = slotsSnap.size;
        document.getElementById("pendingAppointments").textContent = pendingSnap.size;
        document.getElementById("approvedAppointments").textContent = approvedSnap.size;
        document.getElementById("totalMessages").textContent = messagesSnap.size;

        // Load upcoming appointments
        loadUpcomingAppointments();

        Logger.info("Teacher", "Dashboard stats loaded", uid);
    } catch (error) {
        Logger.error("Teacher", `Failed to load dashboard: ${error.message}`, uid);
    }
}

async function loadUpcomingAppointments() {
    const uid = Auth.getCurrentUser().uid;
    try {
        const snap = await db.collection("appointments")
            .where("teacherId", "==", uid)
            .where("status", "in", ["pending", "approved"])
            .orderBy("date", "asc")
            .limit(5)
            .get();

        const tbody = document.getElementById("upcomingAppointments");

        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No upcoming appointments</td></tr>';
            return;
        }

        let html = "";
        snap.forEach(doc => {
            const data = doc.data();
            const statusClass = data.status === "approved" ? "badge-approved" : "badge-pending";
            html += `
                <tr>
                    <td>${data.studentName || "N/A"}</td>
                    <td>${data.date || "N/A"}</td>
                    <td>${data.time || "N/A"}</td>
                    <td>${data.purpose || "N/A"}</td>
                    <td><span class="badge ${statusClass}">${data.status}</span></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    } catch (error) {
        Logger.error("Teacher", `Failed to load upcoming appointments: ${error.message}`, uid);
    }
}

// ===== Schedule / Slots =====
function openAddSlotModal() {
    document.getElementById("slotForm").reset();
    // Set minimum date to today
    document.getElementById("slotDate").min = new Date().toISOString().split("T")[0];
    openModal("slotModal");
    Logger.action("Teacher", "Opened Add Slot modal", Auth.getCurrentUser().uid);
}

async function handleAddSlot(e) {
    e.preventDefault();
    const uid = Auth.getCurrentUser().uid;
    const user = Auth.getCurrentUser();

    const day = document.getElementById("slotDay").value;
    const date = document.getElementById("slotDate").value;
    const startTime = document.getElementById("slotStartTime").value;
    const endTime = document.getElementById("slotEndTime").value;

    if (startTime >= endTime) {
        alert("End time must be after start time.");
        return;
    }

    showLoading(true);
    try {
        await db.collection("slots").add({
            teacherId: uid,
            teacherName: user.name,
            day: day,
            date: date,
            startTime: startTime,
            endTime: endTime,
            isBooked: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        Logger.action("Teacher", `Slot added: ${day} ${date} ${startTime}-${endTime}`, uid);
        alert("Slot added successfully!");
        closeModal("slotModal");
        loadSlots();
        loadTeacherDashboard();
    } catch (error) {
        Logger.error("Teacher", `Failed to add slot: ${error.message}`, uid);
        alert("Failed to add slot: " + error.message);
    }
    showLoading(false);
}

async function loadSlots() {
    const uid = Auth.getCurrentUser().uid;
    try {
        const snap = await db.collection("slots")
            .where("teacherId", "==", uid)
            .orderBy("date", "asc")
            .get();

        const grid = document.getElementById("slotsGrid");

        if (snap.empty) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
                    <p>No slots created yet. Click "Add Slot" to create availability.</p>
                </div>
            `;
            return;
        }

        let html = "";
        snap.forEach(doc => {
            const data = doc.data();
            const bookedClass = data.isBooked ? "" : "available";
            const bookedText = data.isBooked ? "Booked" : "Available";
            html += `
                <div class="schedule-slot ${bookedClass}">
                    <div class="slot-day">${data.day}</div>
                    <div class="slot-time">${data.date}</div>
                    <div class="slot-time">${data.startTime} - ${data.endTime}</div>
                    <div class="slot-time"><strong>${bookedText}</strong></div>
                    <div class="slot-actions">
                        <button class="btn btn-sm btn-danger" onclick="deleteSlot('${doc.id}')">Delete</button>
                    </div>
                </div>
            `;
        });
        grid.innerHTML = html;
        Logger.info("Teacher", "Slots loaded", uid);
    } catch (error) {
        Logger.error("Teacher", `Failed to load slots: ${error.message}`, uid);
    }
}

async function deleteSlot(slotId) {
    if (!confirm("Delete this slot?")) return;

    showLoading(true);
    try {
        await db.collection("slots").doc(slotId).delete();
        Logger.action("Teacher", `Slot deleted: ${slotId}`, Auth.getCurrentUser().uid);
        alert("Slot deleted!");
        loadSlots();
        loadTeacherDashboard();
    } catch (error) {
        Logger.error("Teacher", `Failed to delete slot: ${error.message}`);
        alert("Failed to delete slot.");
    }
    showLoading(false);
}

// ===== Approve/Cancel Appointments =====
async function loadPendingAppointments() {
    const uid = Auth.getCurrentUser().uid;
    try {
        const snap = await db.collection("appointments")
            .where("teacherId", "==", uid)
            .where("status", "==", "pending")
            .orderBy("createdAt", "desc")
            .get();

        const tbody = document.getElementById("pendingList");

        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No pending appointment requests</td></tr>';
            return;
        }

        let html = "";
        snap.forEach(doc => {
            const data = doc.data();
            html += `
                <tr>
                    <td>${data.studentName || "N/A"}</td>
                    <td>${data.date || "N/A"}</td>
                    <td>${data.time || "N/A"}</td>
                    <td>${data.purpose || "N/A"}</td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-success" onclick="approveAppointment('${doc.id}')">Approve</button>
                            <button class="btn btn-sm btn-danger" onclick="cancelAppointment('${doc.id}')">Cancel</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
        Logger.info("Teacher", "Pending appointments loaded", uid);
    } catch (error) {
        Logger.error("Teacher", `Failed to load pending appointments: ${error.message}`, uid);
    }
}

async function approveAppointment(appointmentId) {
    if (!confirm("Approve this appointment?")) return;

    showLoading(true);
    try {
        await db.collection("appointments").doc(appointmentId).update({
            status: "approved"
        });
        Logger.action("Teacher", `Appointment approved: ${appointmentId}`, Auth.getCurrentUser().uid);
        alert("Appointment approved!");
        loadPendingAppointments();
        loadTeacherDashboard();
    } catch (error) {
        Logger.error("Teacher", `Failed to approve appointment: ${error.message}`);
        alert("Failed to approve appointment.");
    }
    showLoading(false);
}

async function cancelAppointment(appointmentId) {
    if (!confirm("Cancel this appointment?")) return;

    showLoading(true);
    try {
        // Get appointment details to free up the slot
        const appointmentDoc = await db.collection("appointments").doc(appointmentId).get();
        const appointmentData = appointmentDoc.data();

        await db.collection("appointments").doc(appointmentId).update({
            status: "cancelled"
        });

        // Free up the slot if it was booked
        if (appointmentData && appointmentData.slotId) {
            await db.collection("slots").doc(appointmentData.slotId).update({
                isBooked: false
            });
        }

        Logger.action("Teacher", `Appointment cancelled: ${appointmentId}`, Auth.getCurrentUser().uid);
        alert("Appointment cancelled!");
        loadPendingAppointments();
        loadTeacherDashboard();
    } catch (error) {
        Logger.error("Teacher", `Failed to cancel appointment: ${error.message}`);
        alert("Failed to cancel appointment.");
    }
    showLoading(false);
}

// ===== Messages =====
async function loadMessages() {
    const uid = Auth.getCurrentUser().uid;
    try {
        const snap = await db.collection("messages")
            .where("toId", "==", uid)
            .orderBy("createdAt", "desc")
            .get();

        const list = document.getElementById("messagesList");

        if (snap.empty) {
            list.innerHTML = `
                <li class="empty-state">
                    <div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>
                    <p>No messages yet.</p>
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
                        <span class="message-from">${data.fromName || "Unknown"}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-body">${data.message || ""}</div>
                </li>
            `;
        });
        list.innerHTML = html;
        Logger.info("Teacher", "Messages loaded", uid);
    } catch (error) {
        Logger.error("Teacher", `Failed to load messages: ${error.message}`, uid);
    }
}

// ===== All Appointments =====
async function loadAllAppointments() {
    const uid = Auth.getCurrentUser().uid;
    try {
        const snap = await db.collection("appointments")
            .where("teacherId", "==", uid)
            .orderBy("createdAt", "desc")
            .get();

        const tbody = document.getElementById("allMyAppointments");

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
                    <td>${data.studentName || "N/A"}</td>
                    <td>${data.date || "N/A"}</td>
                    <td>${data.time || "N/A"}</td>
                    <td>${data.purpose || "N/A"}</td>
                    <td><span class="badge ${statusClass}">${data.status}</span></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
        Logger.info("Teacher", "All appointments loaded", uid);
    } catch (error) {
        Logger.error("Teacher", `Failed to load all appointments: ${error.message}`, uid);
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
