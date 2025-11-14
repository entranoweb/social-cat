#!/usr/bin/env tsx
import { db } from '../src/lib/db.js';
import { workflowsTable } from '../src/lib/schema.js';
import { eq } from 'drizzle-orm';

(async () => {
  const workflowId = process.argv[2] || '62b9cc2e-3e6d-47af-b2bd-e3dd4b5241a1';
  const workflow = await db.select().from(workflowsTable).where(eq(workflowsTable.id, workflowId)).limit(1);

  if (workflow[0]) {
    const config = typeof workflow[0].config === 'string' ? JSON.parse(workflow[0].config) : workflow[0].config;
    console.log('Config:', JSON.stringify(config, null, 2));
  } else {
    console.log('Workflow not found');
  }

  process.exit(0);
})();
