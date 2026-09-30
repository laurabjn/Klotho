import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Optional so that `prisma generate` works without a database (CI, fresh clone).
    url: process.env.DATABASE_URL,
  },
});
