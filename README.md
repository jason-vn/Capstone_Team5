Team 5 CS 4023 Capstone (Spring 2022) - TournaSmash

- Front-end HTML/CSS code and image files are located in the "views" folder.

- Back-end JavaScript code handling performing API functions and SQL statements and error handling is located in the "routes" folder. These files handle the requests sent from the front-end.

- The "controllers" folder contains challonge.js and db.js which both contain the various API and SQL statement functions called in the "routes" files for forwarding requests through Challonge and the MariaDB database, respectively.

- "database.js" in the "config" folder contains the code for creating an encrypted connection to our MariaDB database through our application. The SSL certificates were included in the .gitignore

- "server.js" handles application startup, routing, and other functions of our application and requires other node modules to add functionality.

Instructions for starting the project:
1. Clone repo
2. npm i (installs node modules)
3. node server.js (starts application)

The PM2 node module was used on the production server to keep the application running in the background.