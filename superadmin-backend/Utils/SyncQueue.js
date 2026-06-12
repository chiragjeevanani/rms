const { Queue, Worker } = require('bullmq');
const axios = require('axios');
const IORedis = require('ioredis');
const SyncLog = require('../Models/SyncLog');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const syncQueue = new Queue('sync-events-queue', { connection });

// Function to add jobs to the queue
const addSyncJob = async (adminId, event, apiUrl, syncToken, payload) => {
  // Create a log entry first
  const syncLog = new SyncLog({
    adminId,
    event,
    payload,
    status: 'pending'
  });
  await syncLog.save();

  // Add to queue
  await syncQueue.add(event, {
    syncLogId: syncLog._id,
    apiUrl,
    syncToken,
    payload
  }, {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000 // 5s, 10s, 20s...
    }
  });
};

// Initialize worker only if SuperAdmin
const initializeSyncWorker = () => {
  if (process.env.IS_SUPERADMIN !== 'true') return;

  const worker = new Worker('sync-events-queue', async (job) => {
    const { syncLogId, apiUrl, syncToken, payload } = job.data;
    
    // Attempt the HTTP POST
    try {
      const response = await axios.post(apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${syncToken}`
        },
        timeout: 10000 // 10s timeout
      });

      // If successful, update the log
      await SyncLog.findByIdAndUpdate(syncLogId, {
        status: 'success',
        attempts: job.attemptsMade + 1,
        error: null
      });

      return response.data;
    } catch (error) {
      // If error, update log
      await SyncLog.findByIdAndUpdate(syncLogId, {
        status: 'failed',
        attempts: job.attemptsMade + 1,
        error: error.message || 'Unknown error'
      });

      // Rethrow to trigger BullMQ retry
      throw error;
    }
  }, { connection });

  worker.on('failed', (job, err) => {
    console.error(`Sync Job ${job.id} failed with error: ${err.message}`);
  });

  console.log('⚡ Sync Worker initialized for SuperAdmin');
};

module.exports = {
  syncQueue,
  addSyncJob,
  initializeSyncWorker
};
