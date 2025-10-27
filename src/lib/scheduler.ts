import cron, { ScheduledTask } from 'node-cron';
import { db } from './db';
import { jobLogsTable } from './schema';

export interface ScheduledJob {
  name: string;
  schedule: string; // Cron expression: e.g., '*/5 * * * *' for every 5 minutes
  task: () => void | Promise<void>;
  enabled?: boolean;
}

class Scheduler {
  private jobs: Map<string, ScheduledTask> = new Map();
  private isInitialized = false;

  /**
   * Register a scheduled job
   * @param job - The job configuration
   *
   * Cron expression format:
   * * * * * *
   * ┬ ┬ ┬ ┬ ┬
   * │ │ │ │ │
   * │ │ │ │ └─── day of week (0 - 7) (0 or 7 is Sunday)
   * │ │ │ └───── month (1 - 12)
   * │ │ └─────── day of month (1 - 31)
   * │ └───────── hour (0 - 23)
   * └─────────── minute (0 - 59)
   *
   * Examples:
   * - '* /5 * * * *' - Every 5 minutes
   * - '0 * * * *' - Every hour at minute 0
   * - '0 0 * * *' - Every day at midnight
   * - '0 9 * * 1' - Every Monday at 9:00 AM
   */
  register(job: ScheduledJob) {
    if (this.jobs.has(job.name)) {
      console.warn(`⚠️  Job "${job.name}" is already registered. Skipping.`);
      return;
    }

    if (job.enabled === false) {
      console.log(`⏸️  Job "${job.name}" is disabled. Skipping registration.`);
      return;
    }

    if (!cron.validate(job.schedule)) {
      console.error(`❌ Invalid cron expression for job "${job.name}": ${job.schedule}`);
      return;
    }

    const scheduledTask = cron.schedule(
      job.schedule,
      async () => {
        const startTime = Date.now();
        console.log(`🔄 Running scheduled job: ${job.name}`);

        try {
          await job.task();
          const duration = Date.now() - startTime;
          console.log(`✅ Completed job: ${job.name} (${duration}ms)`);

          // Log success to database
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (db as any).insert(jobLogsTable).values({
              jobName: job.name,
              status: 'success',
              message: `Job completed successfully`,
              duration,
            });
          } catch (logError) {
            console.error('Failed to log job success to database:', logError);
          }
        } catch (error) {
          const duration = Date.now() - startTime;
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorStack = error instanceof Error ? error.stack : undefined;

          console.error(`❌ Error in job "${job.name}":`, error);

          // Log error to database
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (db as any).insert(jobLogsTable).values({
              jobName: job.name,
              status: 'error',
              message: errorMessage,
              details: errorStack ? JSON.stringify({ stack: errorStack }) : undefined,
              duration,
            });
          } catch (logError) {
            console.error('Failed to log job error to database:', logError);
          }
        }
      }
    );

    // Stop the task initially so it doesn't run until start() is called
    scheduledTask.stop();

    this.jobs.set(job.name, scheduledTask);
    console.log(`📅 Registered job: ${job.name} (${job.schedule})`);
  }

  /**
   * Start all registered jobs
   */
  start() {
    if (this.isInitialized) {
      console.warn('⚠️  Scheduler is already running.');
      return;
    }

    console.log(`🚀 Starting scheduler with ${this.jobs.size} job(s)...`);

    this.jobs.forEach((task, name) => {
      task.start();
      console.log(`▶️  Started job: ${name}`);
    });

    this.isInitialized = true;
    console.log('✅ Scheduler started successfully');
  }

  /**
   * Stop all registered jobs
   */
  stop() {
    console.log('🛑 Stopping scheduler...');

    this.jobs.forEach((task, name) => {
      task.stop();
      console.log(`⏹️  Stopped job: ${name}`);
    });

    this.isInitialized = false;
    console.log('✅ Scheduler stopped');
  }

  /**
   * Stop and remove a specific job
   */
  unregister(jobName: string) {
    const task = this.jobs.get(jobName);
    if (!task) {
      console.warn(`⚠️  Job "${jobName}" not found.`);
      return;
    }

    task.stop();
    this.jobs.delete(jobName);
    console.log(`🗑️  Unregistered job: ${jobName}`);
  }

  /**
   * Start a specific job (if it exists and is stopped)
   */
  startJob(jobName: string) {
    const task = this.jobs.get(jobName);
    if (!task) {
      console.warn(`⚠️  Job "${jobName}" not found.`);
      return false;
    }

    task.start();
    console.log(`▶️  Started job: ${jobName} (will run on schedule)`);
    return true;
  }

  /**
   * Stop a specific job (if it exists and is running)
   */
  stopJob(jobName: string) {
    const task = this.jobs.get(jobName);
    if (!task) {
      console.warn(`⚠️  Job "${jobName}" not found.`);
      return false;
    }

    task.stop();
    console.log(`⏹️  Stopped job: ${jobName}`);
    return true;
  }

  /**
   * Dynamically register or update a job with a new schedule
   * Useful for runtime job management
   */
  registerOrUpdate(job: ScheduledJob) {
    // If job already exists, unregister it first
    if (this.jobs.has(job.name)) {
      this.unregister(job.name);
    }

    // Register the new/updated job
    this.register(job);

    // Start the job if enabled (always start in dynamic registration, even if scheduler not globally initialized)
    // This allows API routes to dynamically start jobs without needing the global scheduler state
    if (job.enabled !== false) {
      console.log(`🚀 Starting job immediately: ${job.name}`);
      this.startJob(job.name);

      // Mark scheduler as initialized so future dynamic registrations work
      if (!this.isInitialized) {
        this.isInitialized = true;
        console.log(`✅ Scheduler initialized via dynamic job registration`);
      }
    }
  }

  /**
   * Check if a specific job is registered
   */
  hasJob(jobName: string): boolean {
    return this.jobs.has(jobName);
  }

  /**
   * Get list of registered jobs
   */
  getJobs() {
    return Array.from(this.jobs.keys());
  }

  /**
   * Check if scheduler is running
   */
  isRunning() {
    return this.isInitialized;
  }
}

// Singleton instance
export const scheduler = new Scheduler();
