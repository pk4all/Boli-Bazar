const mongoose = require('mongoose');
async function fix() {
    await mongoose.connect('mongodb://localhost:27017/bolibazar');
    const User = mongoose.connection.db.collection('users');
    const execs = await User.find({ role: 'sales_executive' }).toArray();
    for (const ex of execs) {
        if (ex.executiveCode && ex.executiveCode.includes('-')) {
            const newCode = ex.executiveCode.replace(/-/g, '');
            await User.updateOne({ _id: ex._id }, { $set: { executiveCode: newCode } });
            console.log(`Updated ${ex.executiveCode} to ${newCode}`);
        }
    }
    console.log('Done');
    process.exit(0);
}
fix();
