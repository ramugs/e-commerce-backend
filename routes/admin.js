const express = require("express");
const router = express.Router();
const authorization = require("../middleware/authentication");
const {
  createAdmin,
  login,
  allAdmin,
  findOneAdmin,
  editAdmin,
  editPasswordAdmin,
  deleteAdmin,
  forgetPassword,
  passwordReset,
} = require("../controllers/admin");

router.route("/login").post(login);
router.route("/create-admin").post(createAdmin);
router.route("/all-admin").get(authorization, allAdmin);
router
  .route("/:id")
  .get(authorization, findOneAdmin)
  .patch(authorization, editAdmin);
router.route("/edit-password/:id").patch(authorization, editPasswordAdmin);
router.route("/delete/:id").delete(authorization, deleteAdmin);
router.route("/forget-password").post(forgetPassword);
router.route("/reset-password/:token").patch(passwordReset);

module.exports = router;
