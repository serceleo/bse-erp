import 'dotenv/config'

// Integrační testy běží proti samostatné testovací databázi – nikdy proti produkční.
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
