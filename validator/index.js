exports.userSignupValidator = (req, res, next) => {
  req.check("name", "Name is required").notEmpty();
  req
    .check("email", "Email must be between 4 to 32 characters")
    .matches(/.+\@.+\..+/)
    .withMessage("Invalid email address")
    .isLength({
      min: 4,
      max: 32
    });

  req.check("password", "Password is required").notEmpty();
  req
    .check("password")
    .isLength({ min: 6 })
    .withMessage("Password must contain at least 6 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one number");

  req.check("password2", "Confirm Password is required").notEmpty();
  req
    .checkBody("password2", "Password confirmation does not match password")
    .equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    //console.log(errors);

    const firstError = errors.map(error => error.msg)[0];
    return res.status(400).json({ error_message: firstError });
  }

  next();
};

exports.userSigninValidator = (req, res, next) => {
  //req.check("name", "Name is required").notEmpty();
  req
    .check("email", "Email must be between 4 to 32 characters")
    .matches(/.+\@.+\..+/)
    .withMessage("Invalid email address")
    .isLength({
      min: 4,
      max: 32
    });

  req.check("password", "Password is required").notEmpty();
  req
    .check("password")
    .isLength({ min: 6 })
    .withMessage("Password must contain at least 6 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one number");
  const errors = req.validationErrors();
  if (errors) {
    //console.log(errors);
    const firstError = errors.map(error => error.msg)[0];
    return res.status(400).json({ error_message: firstError });
  }

  next();
};
