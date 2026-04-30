const mongoose = require('mongoose');
const Encrypt_DB_URL = "bW9uZ29kYjovL21vaGFtbWFkcmVoYW4wMDEyMV9kYl91c2VyOkw0U09WQzBpcHI1RXoweTNAYWMtcHhyYzFmbS1zaGFyZC0wMC0wMC52eWR2N3VyLm1vbmdvZGIubmV0OjI3MDE3LGFjLXB4cmMxZm0tc2hhcmQtMDAtMDEudnlkdjd1ci5tb25nb2RiLm5ldDoyNzAxNyxhYy1weHJjMWZtLXNoYXJkLTAwLTAyLnZ5ZHY3dXIubW9uZ29kYi5uZXQ6MjcwMTcvUk1TLVN1cGVyYWRtaW4/c3NsPXRydWUmcmVwbGljYVNldD1hdGxhcy0xMTJhZzEtc2hhcmQtMCZhdXRoU291cmNlPWFkbWluJmFwcE5hbWU9Q2x1c3RlcjA=";

const connectSuperAdminDB = async () => {
  try {
    const DB_URL = Buffer.from(Encrypt_DB_URL, 'base64').toString('ascii');
    const conn = await mongoose.createConnection(DB_URL).asPromise();

    console.log(`🌐 Central SuperAdmin DB Connected: ${conn.host}`);
    return conn;
  } catch (err) {
    console.error(`❌ Central DB Connection Failed: ${err.message}`);
    return null;
  }
};

module.exports = connectSuperAdminDB;
