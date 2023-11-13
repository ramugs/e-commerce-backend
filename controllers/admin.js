const { BadRequestError, UnauthenticatedError } = require("../errors");
const Admin = require("../models/admin/admin");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

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
  res.status(StatusCodes.CREATED).json({
    data: `Admin created successfully with the user name ${admin.userName}`,
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
  res.status(StatusCodes.OK).json({ data: responseAdmin, token });
};

const allAdmin = async (req, res) => {
  const allAdmin = await Admin.find();
  if (!allAdmin) {
    throw new BadRequestError("Didn't find any admin");
  }

  const sanitizedAdminData = allAdmin.map((admin) => {
    const { password, ...adminWithoutData } = admin.toObject();
    return adminWithoutData;
  });

  res
    .status(StatusCodes.OK)
    .json({ data: sanitizedAdminData, count: allAdmin.length });
};

const findOneAdmin = async (req, res) => {
  const adminId = req.params.id;
  const admin = await Admin.findOne({ _id: adminId });
  if (!admin) {
    throw new BadRequestError(`No admin found to thid id ${adminId}`);
  }
  const { password, ...adminWithoutPassword } = admin.toObject();
  res.status(StatusCodes.OK).json(adminWithoutPassword);
};

const editAdmin = async (req, res) => {
  const adminId = req.params.id;
  const { userName, phoneNumber, emailAdress, ...remaingData } = req.body;

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
  res.status(StatusCodes.OK).json(admin);
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

  res.status(StatusCodes.OK).json(admin);
};

module.exports = {
  createAdmin,
  login,
  allAdmin,
  findOneAdmin,
  editAdmin,
  editPasswordAdmin,
};
