const userModel = require("../models/user.model");

module.exports.createUser = async (firstname, lastname, email, password, phone) => {
  if (!firstname || !email || !password || !phone) {
    throw new Error("All fields are required");
  }
  // Password is passed raw — Supabase Auth handles hashing
  return userModel.create({ fullname: { firstname, lastname }, email, password, phone });
};
