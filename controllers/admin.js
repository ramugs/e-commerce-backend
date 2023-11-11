const createAdmin = (req, res) => {
  res.send("create admin");
};
const login = (req, res) => {
  res.send("login admin");
};

module.exports = { createAdmin, login };
