// src/utils/envValidator.js
// Validates required environment variables on startup

const requiredEnvVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET'
];

const optionalEnvVars = {
    'PORT': '5000',
    'NODE_ENV': 'development',
    'JWT_EXPIRES_IN': '1d',
    'ALLOWED_ORIGINS': 'http://localhost:3000',
    'RATE_LIMIT_WINDOW_MS': '900000',
    'RATE_LIMIT_MAX_REQUESTS': '100',
    'LOG_LEVEL': 'info'
};

function validateEnv() {
    const missing = [];
    const warnings = [];

    // Check required variables
    requiredEnvVars.forEach(varName => {
        // Allow empty DB_PASSWORD (MySQL can have no password)
        if (varName === 'DB_PASSWORD') {
            // DB_PASSWORD can be empty, just check if the key exists (even if empty string)
            // Use 'in' operator to check if key exists, regardless of value (empty string is valid)
            if (!(varName in process.env)) {
                missing.push(varName);
            }
        } else {
            // For other variables, check if they exist and are not empty
            const value = process.env[varName];
            if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
                missing.push(varName);
            }
        }
    });

    // Check optional variables and set defaults
    Object.keys(optionalEnvVars).forEach(varName => {
        if (!process.env[varName]) {
            process.env[varName] = optionalEnvVars[varName];
            warnings.push(`${varName} not set, using default: ${optionalEnvVars[varName]}`);
        }
    });

    // Validate JWT_SECRET strength in production
    if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET) {
        if (process.env.JWT_SECRET.length < 32) {
            warnings.push('⚠️  WARNING: JWT_SECRET should be at least 32 characters long in production!');
        }
        if (process.env.JWT_SECRET === 'your_very_strong_secret_key_here_change_in_production') {
            warnings.push('⚠️  WARNING: JWT_SECRET is using default value! Change it in production!');
        }
    }

    // Validate ALLOWED_ORIGINS in production
    if (process.env.NODE_ENV === 'production') {
        if (!process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS === 'http://localhost:3000') {
            warnings.push('⚠️  WARNING: ALLOWED_ORIGINS should be set to your production domain!');
        }
    }

    // Report missing variables
    if (missing.length > 0) {
        console.error('\n❌ Missing required environment variables:');
        missing.forEach(varName => {
            console.error(`   - ${varName}`);
        });
        console.error('\n💡 Please set these variables in your .env file\n');
        process.exit(1);
    }

    // Report warnings
    if (warnings.length > 0) {
        console.log('\n⚠️  Environment variable warnings:');
        warnings.forEach(warning => {
            console.log(`   ${warning}`);
        });
        console.log();
    }

    return { missing, warnings };
}

module.exports = { validateEnv, requiredEnvVars, optionalEnvVars };

