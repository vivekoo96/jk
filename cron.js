const cron = require("node-cron"); 
const express = require("express"); 
  
app = express(); // Initializing app 
  
// Creating a cron job which runs on every 10 second 
cron.schedule("*/3 * * * *", function() { 
    console.log("1");
    require('child_process').fork('index.js');
}); 
  
