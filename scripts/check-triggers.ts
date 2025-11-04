import { db } from '../src/lib/db';
import { workflowsTable, Workflow } from '../src/lib/schema';

async function checkTriggers() {
  if (!db) {
    console.error('Database not initialized');
    process.exit(1);
  }

  // Use type assertion to work around union type issue in scripts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workflows = await (db as any).select().from(workflowsTable);

  console.log('Workflows in database:');
  workflows.forEach((w: Workflow) => {
    console.log(`\n- ${w.name}`);
    console.log(`  ID: ${w.id}`);
    console.log(`  Trigger:`, JSON.stringify(w.trigger, null, 2));
  });

  process.exit(0);
}

checkTriggers().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
