const axios = require('axios');
const os = require('os');

const getVpsIp = () => {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
        return alias.address;
    }
  }
  return '0.0.0.0';
};

const startHeartbeatService = () => {
  // Only run if not SuperAdmin
  if (process.env.IS_SUPERADMIN === 'true') return;

  const superAdminUrl = process.env.SUPERADMIN_API_URL || 'https://rmssuperadmin.cloudedata.com/api/sync/heartbeat';
  const adminId = process.env.ADMIN_ID; // The specific Admin's ID in the registry

  if (!adminId) {
    console.warn('[HeartbeatService] ADMIN_ID not provided. Skipping heartbeat.');
    return;
  }

  // Send heartbeat every 5 minutes
  setInterval(async () => {
    try {
      await axios.post(superAdminUrl, {
        adminId,
        vpsIp: getVpsIp(),
        timestamp: new Date().toISOString()
      });
      console.log('[HeartbeatService] Heartbeat sent to SuperAdmin.');
    } catch (error) {
      console.error('[HeartbeatService] Failed to send heartbeat:', error.message);
    }
  }, 5 * 60 * 1000); // 5 minutes
};

module.exports = { startHeartbeatService };
