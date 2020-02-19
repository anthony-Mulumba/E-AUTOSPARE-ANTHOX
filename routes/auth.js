const express = require("express");
const router = express.Router();
const { signup, login, signout } = require("../controllers/auth");
const { userSignupValidator, userSigninValidator } = require("../validator");

router.post("/signup", userSignupValidator, signup);
router.post("/login", userSigninValidator, login);
router.get("/signout", signout);

//router.get("/hello", requireSignin, (req, res) => {
// res.send("Hello without sign in");
//});

module.exports = router;
