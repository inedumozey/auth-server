const express = require("express");
const router = express.Router()

const userCtr = require("../controller/auth");

router.post("/signup", userCtr.signup);
router.get("/resend-verification-link", userCtr.resendVerificationLink);
router.get("/verify-account", userCtr.verifyAccount);
router.post("/signin", userCtr.signin);
router.post("/refreshtoken", userCtr.refreshtoken);
router.get("/reset-pass-request", userCtr.resetPassRequest);
router.post('/reset-pass', userCtr.resetPass)
router.get('/remove-unverified-users', userCtr.removeUnverifiedUser)

module.exports = router;
