// Logger Module - Logs all actions performed in the application
// Logs are stored in Firestore and also printed to the browser console

const Logger = {
    LOG_LEVELS: {
        INFO: "INFO",
        WARN: "WARN",
        ERROR: "ERROR",
        DEBUG: "DEBUG",
        ACTION: "ACTION"
    },

    // Log to Firestore and console
    async log(level, module, message, userId = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp: timestamp,
            level: level,
            module: module,
            message: message,
            userId: userId,
            userAgent: navigator.userAgent
        };

        // Console logging with color coding
        const colors = {
            INFO: "color: #2196F3",
            WARN: "color: #FF9800",
            ERROR: "color: #F44336",
            DEBUG: "color: #9E9E9E",
            ACTION: "color: #4CAF50"
        };

        console.log(
            `%c[${timestamp}] [${level}] [${module}] ${message}`,
            colors[level] || "color: #000"
        );

        // Store log in Firestore
        try {
            await db.collection("logs").add(logEntry);
        } catch (error) {
            console.error("Failed to write log to Firestore:", error);
        }
    },

    info(module, message, userId = null) {
        return this.log(this.LOG_LEVELS.INFO, module, message, userId);
    },

    warn(module, message, userId = null) {
        return this.log(this.LOG_LEVELS.WARN, module, message, userId);
    },

    error(module, message, userId = null) {
        return this.log(this.LOG_LEVELS.ERROR, module, message, userId);
    },

    debug(module, message, userId = null) {
        return this.log(this.LOG_LEVELS.DEBUG, module, message, userId);
    },

    action(module, message, userId = null) {
        return this.log(this.LOG_LEVELS.ACTION, module, message, userId);
    }
};
