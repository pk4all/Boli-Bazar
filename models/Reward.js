const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema({
    rank: { type: Number, required: true, unique: true }, // 1, 2, or 3
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String }, // Optional if using just icons, but user requested picture upload
}, { timestamps: true });

module.exports = mongoose.model('Reward', RewardSchema);
