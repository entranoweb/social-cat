#!/usr/bin/env tsx
/**
 * Validate Workflow Script
 *
 * Validates a workflow JSON file without importing it.
 * Useful for testing workflows before importing.
 *
 * Usage:
 *   npx tsx scripts/validate-workflow.ts <workflow-file.json>
 *   npx tsx scripts/validate-workflow.ts --stdin < workflow.json
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { validateWorkflowExport } from '../src/lib/workflows/import-export';
import { getModuleRegistry } from '../src/lib/workflows/module-registry';

interface WorkflowExport {
  version: string;
  name: string;
  description: string;
  config: {
    steps: Array<{
      id: string;
      module: string;
      inputs: Record<string, unknown>;
      outputAs?: string;
    }>;
    outputDisplay?: {
      type: 'table' | 'list' | 'text' | 'markdown' | 'json' | 'image' | 'images' | 'number';
      columns?: Array<{
        key: string;
        label: string;
        type: string;
      }>;
      content?: string;
    };
  };
  metadata?: {
    author?: string;
    tags?: string[];
    category?: string;
    requiresCredentials?: string[];
  };
}

function validateModulePaths(workflow: WorkflowExport): string[] {
  const errors: string[] = [];
  const registry = getModuleRegistry();

  // Build a set of valid module paths
  const validPaths = new Set<string>();
  registry.forEach((category) => {
    category.modules.forEach((module) => {
      module.functions.forEach((fn) => {
        const path = `${category.name.toLowerCase()}.${module.name}.${fn.name}`;
        validPaths.add(path);
      });
    });
  });

  // Check each step's module path
  workflow.config.steps.forEach((step, index) => {
    if (!validPaths.has(step.module)) {
      errors.push(
        `Step ${index + 1} (${step.id}): Module "${step.module}" not found in registry`
      );
    }
  });

  return errors;
}

function validateVariableReferences(workflow: WorkflowExport): string[] {
  const errors: string[] = [];
  const declaredVariables = new Set<string>();

  workflow.config.steps.forEach((step, index) => {
    // Check if variables used in this step were declared earlier
    const inputsStr = JSON.stringify(step.inputs);
    const variableRefs = inputsStr.match(/\{\{(\w+)(?:\.\w+)*(?:\[\d+\])*\}\}/g) || [];

    variableRefs.forEach((ref) => {
      const varName = ref.match(/\{\{(\w+)/)?.[1];
      if (varName && !declaredVariables.has(varName) && varName !== 'user') {
        errors.push(
          `Step ${index + 1} (${step.id}): References undeclared variable "${varName}"`
        );
      }
    });

    // Register this step's output variable
    if (step.outputAs) {
      declaredVariables.add(step.outputAs);
    }
  });

  return errors;
}

function validateOutputDisplay(workflow: WorkflowExport): string[] {
  const warnings: string[] = [];
  const { config } = workflow;

  if (!config.outputDisplay) {
    return warnings; // No output display configured - auto-detection will be used
  }

  const displayType = config.outputDisplay.type;
  const lastStep = config.steps[config.steps.length - 1];

  if (!lastStep) {
    warnings.push('No steps defined in workflow');
    return warnings;
  }

  // Validation based on display type
  switch (displayType) {
    case 'table':
      warnings.push(
        `⚠️  Output display type is "table" - ensure final step (${lastStep.id}) returns an array of objects`
      );
      if (!config.outputDisplay.columns || config.outputDisplay.columns.length === 0) {
        warnings.push('⚠️  Table display should define columns for proper formatting');
      }
      break;

    case 'list':
      warnings.push(
        `⚠️  Output display type is "list" - ensure final step (${lastStep.id}) returns an array`
      );
      break;

    case 'text':
    case 'markdown':
      warnings.push(
        `⚠️  Output display type is "${displayType}" - ensure final step (${lastStep.id}) returns a string`
      );
      break;

    case 'number':
      warnings.push(
        `⚠️  Output display type is "number" - ensure final step (${lastStep.id}) returns a number`
      );
      break;

    case 'image':
      warnings.push(
        `⚠️  Output display type is "image" - ensure final step (${lastStep.id}) returns an image URL or buffer`
      );
      break;

    case 'images':
      warnings.push(
        `⚠️  Output display type is "images" - ensure final step (${lastStep.id}) returns an array of image URLs or buffers`
      );
      break;

    case 'json':
      // JSON type accepts any output
      break;
  }

  // Check for common mistakes
  if (displayType === 'table') {
    // Check if last step might return a single value instead of array
    const commonSingleValueModules = [
      'average', 'sum', 'count', 'min', 'max',
      'hashSHA256', 'generateUUID', 'now', 'toISO'
    ];

    if (commonSingleValueModules.some(mod => lastStep.module.includes(mod))) {
      warnings.push(
        `❌ LIKELY ERROR: Step "${lastStep.id}" uses "${lastStep.module}" which typically returns a single value, but output display is set to "table" (requires array)`
      );
      warnings.push(
        `   💡 Solution: Either change the final step to return an array, or change outputDisplay.type to "text" or "json"`
      );
    }

    // Check if using AI generation modules that might return JSON strings
    const aiModules = ['generateText', 'generateFast', 'generateQuality', 'generateClaudeFast', 'generateClaudeQuality'];
    if (aiModules.some(mod => lastStep.module.includes(mod))) {
      warnings.push(
        `⚠️  REMINDER: Step "${lastStep.id}" uses an AI generation module. If it returns JSON as a string, the system will auto-parse it for table display.`
      );
      warnings.push(
        `   💡 Best practice: Ensure your AI prompt explicitly requests JSON array format and mentions "Return ONLY valid JSON, no markdown code blocks"`
      );
    }
  }

  return warnings;
}

async function validateWorkflow(workflowJson: string): Promise<void> {
  try {
    console.log('🔍 Validating workflow...\n');

    // Parse JSON
    let workflow: WorkflowExport;
    try {
      workflow = JSON.parse(workflowJson);
    } catch (error) {
      console.error('❌ Invalid JSON format');
      console.error(error);
      process.exit(1);
    }

    // Basic structure validation
    const validation = validateWorkflowExport(workflow);
    if (!validation.valid) {
      console.error('❌ Workflow validation failed:\n');
      validation.errors.forEach((error) => {
        console.error(`   • ${error}`);
      });
      process.exit(1);
    }

    console.log('✅ Basic structure validation passed');

    // Validate module paths
    console.log('\n🔍 Checking module paths...');
    const moduleErrors = validateModulePaths(workflow);
    if (moduleErrors.length > 0) {
      console.error('\n❌ Invalid module paths found:\n');
      moduleErrors.forEach((error) => {
        console.error(`   • ${error}`);
      });
      console.log('\n💡 Tip: Run `npx tsx scripts/search-modules.ts --list` to see all available modules');
      process.exit(1);
    }
    console.log('✅ All module paths are valid');

    // Validate variable references
    console.log('\n🔍 Checking variable references...');
    const varErrors = validateVariableReferences(workflow);
    if (varErrors.length > 0) {
      console.error('\n⚠️  Variable reference warnings:\n');
      varErrors.forEach((error) => {
        console.error(`   • ${error}`);
      });
      console.log('\n💡 Make sure variables are declared with "outputAs" before being used');
    } else {
      console.log('✅ All variable references are valid');
    }

    // Validate output display configuration
    console.log('\n🔍 Checking output display configuration...');
    const displayWarnings = validateOutputDisplay(workflow);
    if (displayWarnings.length > 0) {
      const hasErrors = displayWarnings.some(w => w.includes('❌'));
      if (hasErrors) {
        console.error('\n❌ Output display configuration errors:\n');
      } else {
        console.log('\n⚠️  Output display reminders:\n');
      }
      displayWarnings.forEach((warning) => {
        console.log(`   ${warning}`);
      });
      console.log('\n💡 Output display type guide:');
      console.log('   • table  → Array of objects with columns defined');
      console.log('   • list   → Array of primitives (strings/numbers)');
      console.log('   • text   → String value');
      console.log('   • number → Numeric value');
      console.log('   • json   → Any value (auto-formatted)');
    } else {
      console.log('✅ Output display configuration looks good (or will use auto-detection)');
    }

    // Summary
    console.log('\n📊 Workflow Summary:');
    console.log(`   Name: ${workflow.name}`);
    console.log(`   Description: ${workflow.description}`);
    console.log(`   Steps: ${workflow.config.steps.length}`);
    console.log(`   Version: ${workflow.version}`);

    if (workflow.metadata?.category) {
      console.log(`   Category: ${workflow.metadata.category}`);
    }

    if (workflow.metadata?.tags?.length) {
      console.log(`   Tags: ${workflow.metadata.tags.join(', ')}`);
    }

    if (workflow.metadata?.requiresCredentials?.length) {
      console.log(`   Required credentials: ${workflow.metadata.requiresCredentials.join(', ')}`);
    }

    console.log('\n✅ Workflow validation complete!');
    console.log('\n💡 Import with: npx tsx scripts/import-workflow.ts <file>');
  } catch (error) {
    console.error('❌ Validation error:', error);
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage:
  npx tsx scripts/validate-workflow.ts <workflow-file.json>
  npx tsx scripts/validate-workflow.ts --stdin < workflow.json

Options:
  --stdin    Read workflow JSON from stdin
  --help     Show this help message
  `);
  process.exit(0);
}

let workflowJson: string;

if (args[0] === '--stdin') {
  // Read from stdin
  const chunks: Buffer[] = [];
  process.stdin.on('data', (chunk) => chunks.push(chunk));
  process.stdin.on('end', () => {
    workflowJson = Buffer.concat(chunks).toString('utf-8');
    validateWorkflow(workflowJson);
  });
} else {
  // Read from file
  const filePath = resolve(process.cwd(), args[0]);
  try {
    workflowJson = readFileSync(filePath, 'utf-8');
    validateWorkflow(workflowJson);
  } catch (error) {
    console.error(`❌ Failed to read file: ${filePath}`);
    console.error(error);
    process.exit(1);
  }
}
