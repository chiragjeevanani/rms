const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const fixRolesIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('roles');

        // List indexes
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes);

        const hasNameIndex = indexes.find(idx => idx.name === 'name_1');
        if (hasNameIndex && hasNameIndex.unique) {
            console.log('Dropping unique index name_1...');
            await collection.dropIndex('name_1');
            console.log('Index name_1 dropped.');
        }

        console.log('Role indexes fixed.');
        process.exit(0);
    } catch (err) {
        console.error('Error fixing indexes:', err);
        process.exit(1);
    }
};

fixRolesIndex();
