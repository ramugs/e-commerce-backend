const { BadRequestError, UnauthenticatedError } = require("../errors");
const Admin = require("../models/admin/admin");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const sendEmail = require("../middleware/email");
const crypto = require("crypto");

const createAdmin = async (req, res) => {
  const { userName, phoneNumber, emailAdress } = req.body;
  const differentAdmin = await Admin.find();
  for (const item of differentAdmin) {
    if (item.userName === userName) {
      throw new BadRequestError(`User name already exists: ${userName}`);
    } else if (item.phoneNumber === phoneNumber) {
      throw new BadRequestError(`Phone number already exists: ${phoneNumber}`);
    } else if (item.emailAdress === emailAdress) {
      throw new BadRequestError(`Email address already exists: ${emailAdress}`);
    }
  }

  const admin = await Admin.create(req.body);
  res.status(200).json({
    data: `Admin created successfully with the user name ${admin.userName}`,
    status: "success",
  });
};

const login = async (req, res) => {
  const { userName, password } = req.body;
  if (!userName) {
    throw new BadRequestError("Please Enter the User Name");
  }
  if (!password) {
    throw new BadRequestError("Please Enter the Password");
  }
  const admin = await Admin.findOne({ userName });
  if (!admin) {
    throw new BadRequestError("Invalid User Name");
  }
  const isPassword = await admin.comparePassword(password);
  if (!isPassword) {
    throw new BadRequestError("Invalid Password");
  }
  const responseAdmin = {
    _id: admin._id,
    firstName: admin.firstName,
    lastName: admin.lastName,
    userName: admin.userName,
    emailAdress: admin.emailAdress,
    phoneNumber: admin.phoneNumber,
    jobTitle: admin.jobTitle,
    officeLocation: admin.officeLocation,
  };
  const token = admin.createToken();
  res.status(200).json({ data: responseAdmin, token, status: "success" });
};

const allAdmin = async (req, res) => {
  const {
    firstName,
    lastName,
    userName,
    emailAdress,
    phoneNumber,
    jobTitle,
    officeLocation,
    sort,
  } = req.query;
  const queryObject = {};
  if (firstName) {
    queryObject.firstName = { $regex: firstName, $options: "i" };
  }
  if (lastName) {
    queryObject.lastName = { $regex: lastName, $options: "i" };
  }
  if (userName) {
    queryObject.userName = { $regex: userName, $options: "i" };
  }
  if (emailAdress) {
    queryObject.emailAdress = { $regex: emailAdress, $options: "i" };
  }
  if (phoneNumber) {
    queryObject.phoneNumber = { $regex: phoneNumber, $options: "i" };
  }
  if (jobTitle) {
    queryObject.jobTitle = { $regex: jobTitle, $options: "i" };
  }
  if (officeLocation) {
    queryObject.officeLocation = { $regex: officeLocation, $options: "i" };
  }

  let result = Admin.find(queryObject);
  if (sort) {
    const sortList = sort.split(",").join(" ");
    result = result.sort(sortList);
  } else {
    result = result.sort("-createdAt");
  }

  const page = Number(req.query?.page) || 1;
  const limit = Number(req.query?.limit) || 10;
  const skip = (page - 1) * limit;

  result = result.skip(skip).limit(limit);

  const allAdmin = await result;
  const allAdminCount = await Admin.find({});
  if (!allAdmin) {
    throw new BadRequestError("Didn't find any admin");
  }

  const sanitizedAdminData = allAdmin.map((admin) => {
    const { password, ...adminWithoutData } = admin.toObject();
    return adminWithoutData;
  });
  res.status(200).json({
    data: sanitizedAdminData,
    count: allAdmin.length,
    totalCount: allAdminCount.length,
    status: "success",
  });
};

const findOneAdmin = async (req, res) => {
  const adminId = req.params.id;
  const admin = await Admin.findOne({ _id: adminId });
  if (!admin) {
    throw new BadRequestError(`No admin found to thid id ${adminId}`);
  }
  const { password, ...adminWithoutPassword } = admin.toObject();
  res.status(200).json({ data: adminWithoutPassword, status: "success" });
};

const editAdmin = async (req, res) => {
  const adminId = req.params.id;
  const { userName, phoneNumber, emailAdress } = req.body;

  const differentAdmin = await Admin.find({
    _id: { $ne: adminId },
  });

  for (const item of differentAdmin) {
    if (item.userName === userName) {
      throw new BadRequestError(`User name already exists: ${userName}`);
    } else if (item.phoneNumber === phoneNumber) {
      throw new BadRequestError(`Phone number already exists: ${phoneNumber}`);
    } else if (item.emailAdress === emailAdress) {
      throw new BadRequestError(`Email address already exists: ${emailAdress}`);
    }
  }
  const admin = await Admin.findByIdAndUpdate({ _id: adminId }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!admin) {
    throw new NotFoundError(`No Admin with id ${adminId}`);
  }
  res.status(200).json({ data: admin, status: "success" });
};

const editPasswordAdmin = async (req, res) => {
  const adminId = req.params.id;
  const { oldPassword, newPassword } = req.body;
  const accessAdmin = await Admin.findOne({ _id: adminId });
  if (!accessAdmin) {
    throw new BadRequestError(`Invalid admin id ${adminId}`);
  }
  const isPassword = await accessAdmin.comparePassword(oldPassword);
  if (!isPassword) {
    throw new BadRequestError("Invalid Password");
  }
  const salt = await bcrypt.genSalt(10);
  const generatedPassword = await bcrypt.hash(newPassword, salt);
  const admin = await Admin.findByIdAndUpdate(
    { _id: adminId },
    { password: generatedPassword },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({ data: admin, status: "success" });
};

const deleteAdmin = async (req, res) => {
  const adminId = req.params.id;
  const admin = await Admin.findByIdAndDelete({ _id: adminId });
  if (!admin) {
    throw new BadRequestError(`Invalid admin id ${adminId}`);
  }
  res
    .status(200)
    .json({ data: `${adminId} admin deleted successfully`, status: "success" });
};

const forgetPassword = async (req, res) => {
  const admin = await Admin.findOne({ emailAdress: req.body.emailAdress });
  if (!admin) {
    throw new BadRequestError(`Could not find the admin we the given email`);
  }

  const resetToken = admin.createResetPasswordToken();

  await admin.save();
  const resetUrl = `${process.env.PRODUCTION_URL}/ecommerce/admin/reset-password/${resetToken}`;
  const message = `we have received a password reset request. Please use the below link to reset ypur password \n\n ${resetUrl}\n\n This reset password link will be valid for only 10 minutes`;

  try {
    await sendEmail({
      email: admin.emailAdress,
      subject: `Password Change Request Received`,
      message: message,
    });
    res.status(200).json({
      resetToken,
      data: "Password reset link is send to the email",
      status: "success",
    });
  } catch (error) {
    admin.passwordResetToken = undefined;
    admin.passwordResetTokenExpires = undefined;
    await admin.save({ validateBeforeSave: false });
    console.log(error);
    throw new BadRequestError(
      `There was an error send password reset email. Please try again Later`
    );
  }
};

const passwordReset = async (req, res) => {
  const token = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const admin = await Admin.findOne({
    passwordResetToken: token,
    passwordResetTokenExpires: { $gt: Date.now() },
  });
  if (!admin) {
    throw new BadRequestError(`Token is Invalid or Expired`);
  }
  admin.password = req.body.password;
  admin.passwordResetToken = undefined;
  admin.passwordResetTokenExpires = undefined;
  admin.passwordChangedAt = Date.now();

  await admin.save();
  res
    .status(200)
    .json({ data: `Password reset successful`, status: "success" });
};

module.exports = {
  createAdmin,
  login,
  allAdmin,
  findOneAdmin,
  editAdmin,
  editPasswordAdmin,
  deleteAdmin,
  forgetPassword,
  passwordReset,
};
