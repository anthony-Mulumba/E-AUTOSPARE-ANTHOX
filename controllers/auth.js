const User = require("../models/user");
const jwt = require("jsonwebtoken"); //To generate signed token
const expressJwt = require("express-jwt"); // for authorization check
const bcrypt = require("bcryptjs");
const validationLoginUser = require("../validator/login");
const validationRegisterUser = require("../validator/register");
//const isEmpty = require("is-empty");

exports.signup = (req, res, next) => {
  const { errors, isValid } = validationRegisterUser(req.body);

  if (!isValid) {
    const error = new Error(errors);
    error.statusCode = 422;
    error.message = errors;
    throw error;
  }

  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  //Check whether email (user) already in the database.
  User.findOne({ email: email }).then(user => {
    if (user) {
      const error = { message: "Email Already exist" };
      return res.status(400).json({ message: error });
    } else {
      const newUser = new User({
        name: name,
        email: email,
        hashed_password: password
      });

      //hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.hashed_password, salt, (err, hash) => {
          if (err) throw err;
          newUser.hashed_password = hash;
          newUser
            .save()
            .then(user =>
              res.status(201).json({
                message: "User successfully created",
                user: user
              })
            )
            .catch(err => {
              if (!err.statusCode) {
                err.statusCode = 500;
              }
              console.log(err);
              next(err);
            });
        });
      });
    }
  });
};

exports.login = (req, res, next) => {
  const { errors, isValid } = validationLoginUser(req.body);

  if (!isValid) {
    const error = new Error(errors);
    error.statusCode = 422;
    error.message = errors;
    throw error;
  }

  const { email, password } = req.body;

  User.findOne({ email }).then(user => {
    if (!user) {
      const error = {
        message: "No user with that email address. Signup please"
      };
      return res.status(404).json({ message: error });
    }

    //Check the password with Bcrypt
    //check password
    bcrypt.compare(password, user.hashed_password).then(isMatch => {
      if (isMatch) {
        //User matched
        //Create JWT jwt_payload.
        const payload = {
          _id: user._id.toString(),
          name: user.name
        };
        //Sign token; Generate a signed token with user id and secret
        const token = jwt.sign(payload, process.env.JWT_SECRET);
        // (err, token) => {
        res.cookie("t", token, { expire: new Date() + 9999 });
        const { _id, name, email, role } = user;
        return res.status(200).json({
          success: true,
          user: { _id, name, email, role },
          token: "Bearer " + token
        });
        // }
      } else {
        return res
          .status(401)
          .json({ message: `Email and Password don't matched` });
      }
    });
  });
};

exports.signout = (req, res, next) => {
  res.clearCookie("t");
  return res.status(200).json({ message: "Signout success" });
};

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET,
  userProperty: "auth"
});

exports.isAuth = (req, res, next) => {
  let user = req.profile && req.auth && req.profile._id == req.auth._id;
  if (!user) {
    return res.status(403).json({ message: "Access Denied" });
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.profile.role === 0) {
    return res.status(403).json({ message: "Admin resources! Access Denied" });
  }
  next();
};
