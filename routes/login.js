const {Router} = require ('express');
const pool = require ('../config/database');
const passport = require ('passport');
const LocalStrategy = require ('passport-local');
const {body, validationResult} = require ('express-validator');
const CryptoJS = require ('crypto-js');
var AES = require ('crypto-js/aes');
var SHA256 = require ('crypto-js/sha256');
const { eventNames } = require('../config/database');
var randtoken = require('rand-token');
var nodemailer = require('nodemailer');
var flash = require('express-flash');

const router = Router ();
router.use(flash());
router.get ('/', (req, res) => {
  console.log ('login page request');
  if (!req.session.userID) {
    res.render ('login');
  } else {
    res.redirect ('/dashboard');
  }
});

router.post (
  '/auth',
  [
    body ('username').notEmpty ().withMessage ('Username cannot be empty'),
    body ('password').notEmpty ().withMessage ('Password cannot be empty'),
  ],
  function (req, res) {
    var errors = validationResult (req);
    if (!errors.isEmpty ()) {
      // Invalid -> Errors exist
      console.log ('*Invalid input*');
      console.log ('Validation Results:', errors.mapped (), !errors.isEmpty ());
      res.send (
        `<script>alert("Incorrect login."); window.location.href = "/login"; </script>`
      );
    } else {
      // Valid -> No errors exist
      console.log ('*Valid input*');
      console.log ('Validation Results:', errors.mapped (), !errors.isEmpty ());

      // Store user input
      const username = req.body.username;
      const pwd = req.body.password;

      // Check for existing user
      try {
        var sql =
          'SELECT member_username FROM member WHERE member_username = ?';
        pool.query (sql, [username], function (err, results) {
          if (err) {
            res.send (err);
            console.log (err);
          }

          // User does not exist
          if (results.length === 0) {
            console.log ('User does not exist', results);
            res.send (
              `<script>alert("Incorrect login."); window.location.href = "/login"; </script>`
            );
          } else {
            console.log ('User found: ', results[0].member_username);
            // Checking database for user + password combination
            try {
              // Hash password before checking
              const hashedPassword = CryptoJS.SHA256 (pwd);
              var sql2 =
                'SELECT * FROM member WHERE member_username = ? AND member_password = ?';
              pool.query (
                // CryptoJS.enc.Base64 for reading as 64 bit string
                sql2,
                [username, hashedPassword.toString (CryptoJS.enc.Base64)],
                function (error, newresults) {
                  if (error) throw error;

                  if (!newresults[0] > 0) {
                    // Unsuccessful -> back to login
                    console.log ('Incorrect login');
                    res.send (
                      `<script>alert("Incorrect login."); window.location.href = "/login"; </script>`
                    );
                  } else {
                    // Successful -> send to landing page
                    req.session.userID = newresults[0].member_id;
                    req.session.username = newresults[0].member_username;
                    req.session.role = newresults[0].member_role;
                    console.log (
                      'Correct login for: ',
                      newresults[0].member_id,
                      '|',
                      '"' + newresults[0].member_username + '"'
                    );
                    res.redirect ('/dashboard');
                  }
                }
              ); // End of 2nd query
            } catch (error) {
              // Unsuccessful -> Return to login page
              console.log (
                'Unsuccessful login --> Redirecting to login page\n',
                error
              );
              res.redirect ('/login');
            }
          }
        }); // End of 1st query
      } catch (err) {
        console.log ('User login FAILED!', err);
      }
    }
  }
);

function sendEmail(email, token) {
 
  var email = email;
  var token = token;

  var mail = nodemailer.createTransport({
      service: 'gmail',
      auth: {
          user: process.env.FROM_EMAIL, 
          pass: process.env.FROM_EMAIL_PASSWORD,
      }
  });

  var mailOptions = {
      from: 'tournasmash@gmail.com',
      to: email,
      subject: 'Reset Password Link - Tournasmash.ddns.net',
      html: '<p>You requested for reset password, kindly use this <a href="https://tournasmash.ddns.net:32000/passwordreset?token=' + token + '">link</a> to reset your password</p>'

  };

  mail.sendMail(mailOptions, function(error, info) {
      if (error) {
          console.log(error)
          console.log(1)
      } else {
          console.log(0)
      }
  });
};

router.post('/resetpasswordemail', function(req, res, next) {
 
  var email = req.body.email;
  console.log("starting sql");
  var sql = 'SELECT * FROM member WHERE member_email = ?';

  pool.query(sql,email, function(err, result) {
      if (err) throw err;
      var type = ''
      var msg = ''
      if(result.length ===  0){
        res.send (
          `<script>alert("This is not a TournaSmash Email. Please enter the email associated with your account "); window.location.href = "/forgotpassword"; </script>`
          );
        }else{
          console.log("you passed the first if statement");
      if (result[0].member_email.length > 0) {

         var token = randtoken.generate(20);
        console.log(token);
         var sent = sendEmail(email, token);

           if (sent != '0') {

              var data = {
                  token: token
              }

              pool.query('UPDATE member SET ? WHERE member_email ="' + email + '"', data, function(err, result) {
                if(err) throw err
     
            })

              type = 'success';
              msg = 'The reset password link has been sent to your email address';

          } else {
              type = 'error';
              msg = 'Something goes to wrong. Please try again';
          }

      } else {
          console.log('2');
          type = 'error';
          msg = 'The Email is not registered with us';

      }
    
    }
      req.flash(type, msg);
      res.send (
        `<script>alert("A reset link has been sent to your email."); window.location.href = "/login"; </script>`
      );
  });
})

router.post('/resetpass', function(req, res, next) {
 
  var token = req.body.token;
  var password = req.body.password;

 pool.query('SELECT * FROM member WHERE token ="' + token + '"', function(err, result) {
      if (err) throw err;

      var type
      var msg

      if (result.length > 0) {
           const hashedPassword = CryptoJS.SHA256(password);
            var data ={ member_password: hashedPassword}
                  pool.query('UPDATE member SET ? WHERE member_email ="' + result[0].member_email + '"', data, function(err, result) {
                      if(err) throw err
       });
          type = 'success';
          msg = 'Your password has been updated successfully';   
      } else {
          console.log('2');
          type = 'success';
          msg = 'Invalid link; please try again';
          }
      req.flash(type, msg);
      res.redirect('/login');
  });
})

module.exports = router;
