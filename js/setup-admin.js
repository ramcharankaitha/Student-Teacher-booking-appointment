// Admin Setup Script
// Run this once to create the initial admin account
// Open setup.html in browser to execute this

const AdminSetup = {
    async createAdmin(email, password, name) {
        try {
            console.log("Creating admin account...");
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;

            await db.collection("users").doc(uid).set({
                uid: uid,
                email: email,
                name: name,
                role: "admin",
                approved: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log(`Admin account created successfully!`);
            console.log(`Email: ${email}`);
            console.log(`UID: ${uid}`);
            alert(`Admin account created!\nEmail: ${email}\nYou can now login at index.html`);
        } catch (error) {
            console.error("Failed to create admin:", error.message);
            alert("Failed to create admin: " + error.message);
        }
    }
};
