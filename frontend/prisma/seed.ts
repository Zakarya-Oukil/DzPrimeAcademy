import { ensureSeeded, seedOwner } from '../src/lib/seed';
import { prisma } from '../src/lib/db';

// npm run db:seed
//   - always: wilayas, institutions, modules, exams, starter bundles (idempotent)
//   - owner account: only when ADMIN_EMAIL and ADMIN_PASSWORD are set in the environment of this command
async function main() {
  await ensureSeeded();
  console.log('Catalog seed complete.');

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const result = await seedOwner();
    console.log(result === 'created' ? 'Owner account created (password change required at first login).' : 'Owner account already exists, left unchanged.');
  } else {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set: no owner account was created.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
