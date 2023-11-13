const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const adminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Please Provide First Name"],
      minlength: 3,
      maxlength: 20,
    },
    lastName: {
      type: String,
      required: [true, "Please Provide Last Name"],
      maxlength: 20,
    },
    userName: {
      type: String,
      required: [true, "Please Provide User Name"],
      minlength: 3,
      maxlength: 20,
      // unique: true,
    },
    emailAdress: {
      type: String,
      required: [true, "Please Provide email"],
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide a valid email",
      ],
      // unique: true,
    },
    phoneNumber: {
      type: Number,
      required: [true, "Please Provide Phone Number"],
      match: [
        /^\+\d{1,4}\s?(\d{1,4}\s?){1,10}$/,
        "Please provide a valid phone number",
      ],
      // unique: true,
    },
    jobTitle: {
      type: String,
      required: [true, "Please Provide First Name"],
    },
    officeLocation: {
      type: String,
      required: [true, "Please Provide First Name"],
    },
    password: { type: String, required: [true, "Please provide password"] },
  },
  { timestamps: true }
);

adminSchema.pre("save", async function () {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

adminSchema.methods.comparePassword = async function (canditatePassword) {
  const isMatch = await bcrypt.compare(canditatePassword, this.password);
  return isMatch;
};

adminSchema.methods.createToken = function () {
  return jwt.sign(
    { adminId: this._id, userName: this.userName },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_LIFTIME }
  );
};

module.exports = mongoose.model("Admin", adminSchema);
