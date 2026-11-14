process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgres://postgres@localhost:5433/vibloid";
process.env.SESSION_SECRET = "test-secret-test-secret";
process.env.OWNER_PASSWORD = "hunter2";
