const express = require("express");
const router = express.Router();
const { createAdmin, login } = require("../controllers/admin");

router.route("/login").post(login);
router.route("/create-admin").post(createAdmin);

module.exports = router;
