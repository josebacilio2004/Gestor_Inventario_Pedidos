require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./config/database');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, '../database/migration_productos_distribuidores.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration...');
        await pool.query(sql);
        console.log('✅ Migration successful!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
        process.exit();
    }
}

runMigration();
