const { addSyncJob } = require('./SyncQueue');

const WebhookService = {
  /**
   * Dispatch when a new admin is created by SuperAdmin
   */
  dispatchAdminCreated: async (admin) => {
    if (!admin.apiUrl || !admin.syncToken) return;

    const payload = {
      event: 'admin-created',
      data: {
        adminId: admin.adminId, // The central identifier
        name: admin.name,
        email: admin.email,
        status: admin.status,
        plan: admin.plan,
        expiryDate: admin.expiryDate
      }
    };
    
    await addSyncJob(
      admin._id,
      'admin-created',
      `${admin.apiUrl}/admin-created`,
      admin.syncToken,
      payload
    );
  },

  /**
   * Dispatch when an admin's status changes
   */
  dispatchAdminStatusChange: async (admin, status) => {
    if (!admin.apiUrl || !admin.syncToken) return;

    const payload = {
      event: 'admin-status',
      data: {
        adminId: admin.adminId,
        status: status
      }
    };

    await addSyncJob(
      admin._id,
      'admin-status',
      `${admin.apiUrl}/admin-status`,
      admin.syncToken,
      payload
    );
  },

  /**
   * Dispatch when an admin's plan changes
   */
  dispatchAdminPlanChange: async (admin, plan) => {
    if (!admin.apiUrl || !admin.syncToken) return;

    const payload = {
      event: 'admin-plan',
      data: {
        adminId: admin.adminId,
        plan: plan
      }
    };

    await addSyncJob(
      admin._id,
      'admin-plan',
      `${admin.apiUrl}/admin-plan`,
      admin.syncToken,
      payload
    );
  },

  /**
   * Dispatch when an admin's expiry date changes
   */
  dispatchAdminExpiryChange: async (admin, expiryDate) => {
    if (!admin.apiUrl || !admin.syncToken) return;

    const payload = {
      event: 'admin-expiry',
      data: {
        adminId: admin.adminId,
        expiryDate: expiryDate
      }
    };

    await addSyncJob(
      admin._id,
      'admin-expiry',
      `${admin.apiUrl}/admin-expiry`,
      admin.syncToken,
      payload
    );
  }
};

module.exports = WebhookService;
