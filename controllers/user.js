const User = require("../models/user");
const jwt = require("jsonwebtoken"); //To generate signed token
const expressJwt = require("express-jwt"); // for authorization check

exports.userById = (req, res, next, id) => {
  User.findById(id).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({ message: "User not found" });
    }
    req.profile = user;
    next();
  });
};

exports.read = (req, res) => {
  req.profile.hashed_password = undefined;

  return res.json(req.profile);
};

exports.update = (req, res) => {
  User.findOneAndUpdate(
    { _id: req.profile._id },
    { $set: req.body },
    { new: true },
    (err, user) => {
      if (err) {
        return res.status(400).json({
          message: "You are not authorized to perform this action"
        });
      }
      user.hashed_password = undefined;
      res.json(user);
    }
  );
};
