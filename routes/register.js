const { Router } = require("express");
const pool = require("../config/database");
const { body, validationResult } = require("express-validator");
const CryptoJS = require("crypto-js");

const router = Router();

let fighterslist;
router.get("/", (req, res) => {

    const fightsql = 'SELECT * FROM fighter';
        pool.query (fightsql, (err, data) => {
            if (err) {
                  console.error (err);
            } else {
                 fighterslist = data;
                 if (!req.session.userID) {
                    console.log(fighterslist)
                    res.render("register",{
                        fighters: fighterslist,
                      });
                } else {
                    console.log("logged in, redirecting to dashboard");
                    res.redirect("/dashboard");
                }
            }
          
        });

});

router.post(
    "/create",
    body("email")
    .isEmail()
    .withMessage("Must be an email")
    .notEmpty()
    .withMessage("Email cannot be empty"),
    body("username").notEmpty().withMessage("Username cannot be empty"),
    body("password")
    .notEmpty()
    .withMessage("Password cannot be empty")
    .isLength({ min: 4, max: 100 })
    .withMessage("Password must be 4-100 characters"),
    body("confirmPassword")
    .custom((value, { req }) => {
        value = req.body.confirmPassword;
        if (value !== req.body.password) {
            console.log("\nPasswords do not match!");
            return false;
        } else {
            console.log("\nPasswords match");
            return true;
        }
    })
    .withMessage("Confirm password incorrect"),

    async(req, res) => {
        var errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Invalid -> Errors exist
            console.log("*Invalid input*");
            console.log("Validation Results:", errors.mapped(), !errors.isEmpty());
            res.send(`<script>alert("Invalid account input"); window.location.href = "/register"; </script>`);
        } else {
            // Valid -> No errors exist
            console.log("*Valid input*");
            console.log("Validation Results:", errors.mapped(), !errors.isEmpty());

            // Store user input
            const username = req.body.username;
            const fighterid = req.body.fighter;
            const email = req.body.email;
            const pwd = req.body.password;
            console.log(username);
            console.log(fighterid);

            // Check for existing user/email
            try {
                var sql = "SELECT * FROM member WHERE member_username = ? OR member_email = ?";
                pool.query(sql, [username, email], function(err, results) {
                    if (err) throw err;

                    // Invalid new user case
                    if (results.length > 0) {
                        console.log("Cannot register -> User already exists with given credentials.", "member_username: " + results[0].member_username);
                        res.send(`<script>alert("User already exists."); window.location.href = "/register"; </script>`);
                    } else {
                        console.log("Valid new user, sending to --> database", results);
                        // Send user to database
                        try {
                            // Hash password before sending to database
                            const hashedPassword = CryptoJS.SHA256(pwd);
                            var sql2 = "INSERT INTO member (member_username, member_email, member_password, member_fighter_id) VALUES(?, ?, ?,?)";
                            pool.query(sql2, [username, email, hashedPassword.toString(CryptoJS.enc.Base64), fighterid], async function(error, newresults) {
                                if (error) throw error;
                                if (!newresults > 0) {
                                    console.log("User registration failed", newresults);
                                } else {
                                    console.log("New user created: ", username);
                                    console.log(newresults);
                                    console.log(fighterid)
                                    res.redirect("/login");
                                }
                            });
                        } catch (error) {
                            // Unsuccessful -> Return to register page
                            console.log("Unsuccessful registration.", error);
                            res.redirect("/register");
                        }
                    }
                });
            } catch (err) {
                console.log("User creation failed", err);
            }
        }
    }
);

module.exports = router;