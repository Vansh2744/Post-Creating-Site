const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  },
  content:String,
  like:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  }],
  postDate:{
    type:Date,
    default:Date.now
  }

});

module.exports = mongoose.model("post", postSchema);
