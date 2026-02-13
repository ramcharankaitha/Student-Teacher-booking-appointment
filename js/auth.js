// Authentication Module - Handles login, register, logout, and session management

const Auth = {
    // Register a new user (Student or Teacher)
    async register(email, password, userData) {
        try {
            Logger.info("Auth", `Registration attempt for ${email} as ${userData.role}`);
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;

            // Store user data in Firestore
            const userDoc = {
                uid: uid,
                email: email,
                name: userData.name,
                role: userData.role,
                approved: userData.role === "admin" ? true : false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Add role-specific fields
            if (userData.role === "student") {
                userDoc.studentId = userData.studentId || "";
                userDoc.course = userData.course || "";
                userDoc.semester = userData.semester || "";
            } else if (userData.role === "teacher") {
                userDoc.department = userData.department || "";
                userDoc.subject = userData.subject || "";
                userDoc.qualification = userData.qualification || "";
                userDoc.experience = userData.experience || "";
            }

            await db.collection("users").doc(uid).set(userDoc);
            Logger.action("Auth", `User registered successfully: ${email} (${userData.role})`, uid);

            // Sign out after registration (wait for admin approval)
            await auth.signOut();
            return { success: true, message: "Registration successful! Please wait for admin approval before logging in." };
        } catch (error) {
            Logger.error("Auth", `Registration failed for ${email}: ${error.message}`);
            return { success: false, message: error.message };
        }
    },

    // Login user
    async login(email, password) {
        try {
            Logger.info("Auth", `Login attempt for ${email}`);
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;

            // Get user data from Firestore
            const userDoc = await db.collection("users").doc(uid).get();
            if (!userDoc.exists) {
                await auth.signOut();
                Logger.error("Auth", `Login failed: User data not found for ${email}`);
                return { success: false, message: "User data not found. Please contact admin." };
            }

            const userData = userDoc.data();

            // Check if user is approved
            if (!userData.approved) {
                await auth.signOut();
                Logger.warn("Auth", `Login denied: Account not approved for ${email}`);
                return { success: false, message: "Your account is not yet approved by the admin. Please wait." };
            }

            // Store session info
            sessionStorage.setItem("uid", uid);
            sessionStorage.setItem("role", userData.role);
            sessionStorage.setItem("name", userData.name);
            sessionStorage.setItem("email", userData.email);

            Logger.action("Auth", `User logged in successfully: ${email} (${userData.role})`, uid);
            return { success: true, role: userData.role, name: userData.name };
        } catch (error) {
            Logger.error("Auth", `Login failed for ${email}: ${error.message}`);
            return { success: false, message: error.message };
        }
    },

    // Logout user
    async logout() {
        try {
            const uid = sessionStorage.getItem("uid");
            const email = sessionStorage.getItem("email");
            Logger.action("Auth", `User logging out: ${email}`, uid);

            await auth.signOut();
            sessionStorage.clear();
            window.location.href = "index.html";
        } catch (error) {
            Logger.error("Auth", `Logout failed: ${error.message}`);
        }
    },

    // Check if user is logged in and has the required role
    checkAuth(requiredRole) {
        const uid = sessionStorage.getItem("uid");
        const role = sessionStorage.getItem("role");

        if (!uid) {
            window.location.href = "index.html";
            return false;
        }

        if (requiredRole && role !== requiredRole) {
            window.location.href = "index.html";
            return false;
        }

        return true;
    },

    // Get current user info
    getCurrentUser() {
        return {
            uid: sessionStorage.getItem("uid"),
            role: sessionStorage.getItem("role"),
            name: sessionStorage.getItem("name"),
            email: sessionStorage.getItem("email")
        };
    }
};
