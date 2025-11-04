import { db } from '../src/lib/db';
import { workflowsTable } from '../src/lib/schema';

async function deleteAllWorkflows() {
  if (!db) {
    console.error('Database not initialized');
    process.exit(1);
  }

  console.log('🗑️  Deleting all workflows...');

  // Delete all workflows - use type assertion to work around union type issue in scripts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).delete(workflowsTable);

  console.log('✅ All workflows deleted');
  process.exit(0);
}

deleteAllWorkflows().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
