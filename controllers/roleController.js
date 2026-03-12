const Role = require("../models/Role");

exports.getRoles = async (req, res) => {
  const roles = await Role.find();
  res.json(roles);
};

exports.createRole = async (req, res) => {
  const { name, status } = req.body;
  const role = await Role.create({ name, status });
  res.status(201).json(role);
};

exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const updated = await Role.findByIdAndUpdate(id, req.body, {
    new: true
  });
  res.json(updated);
};

exports.deleteRole = async (req, res) => {
  const { id } = req.params;
  await Role.findByIdAndDelete(id);
  res.json({ message: "Role deleted" });
};
