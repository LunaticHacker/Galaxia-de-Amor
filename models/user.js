const mongoose = require('mongoose')
const userSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  password: String,
  image: String,
  public_id: String


});
module.exports = mongoose.model('User', userSchema)
