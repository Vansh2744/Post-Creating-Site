const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: String,
  username: String,
  email: String,
  password: String,
  phone: Number,
  profilepic: {
    type: String,
    default: "default.jpg",
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
  ],
});

module.exports = mongoose.model("user", userSchema);
