const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHashed: { type: String, required: true },  // Store plain text password
  isAdmin: { type: Boolean, default: false },
  isSubscribed: { type: Boolean, default: false },
  razorpay: { type: [String], default: [] }, // Store transaction IDs
});

// Remove the password hashing middleware
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('passwordHashed')) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.passwordHashed = await bcrypt.hash(this.passwordHashed, salt);
//   next();
// });

// Remove the password comparison method
// userSchema.methods.matchPassword = async function (password) {
//   return await bcrypt.compare(password, this.passwordHashed);
// };

const User = mongoose.model('User', userSchema);

module.exports = User;
