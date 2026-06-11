const captainModel = require("../models/captain.model");

module.exports.createCaptain = async (
  firstname, lastname, email, password, phone,
  color, number, capacity, type,
  make, model, year,
  nationalIdNumber, licenseNumber,
) => {
  if (!firstname || !email || !password) {
    throw new Error("All fields are required");
  }
  return captainModel.create({
    fullname: { firstname, lastname },
    email,
    password,
    phone,
    vehicle: { color, number, capacity, type, make, model, year },
    documents: { nationalIdNumber, licenseNumber },
  });
};
