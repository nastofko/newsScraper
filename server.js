const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
const axios = require("axios");
const cheerio = require("cheerio");

// Require all models
const db = require("./models");

const PORT = 3000;

// Initialize Express
const app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Handlebars
let exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({defaultLayout: "main",}));
app.set("view engine", "handlebars");

// Connect to the Mongo DB

//mongodb://localhost/nameofdb
mongoose.connect("mongodb://localhost/graperhw", { useNewUrlParser: true });

app.get("/scrape", function (req, res) {
    axios.get("http://maddox.xmission.com/").then(function (response) {
        let $ = cheerio.load(response.data);
        let title = [];
        $(".rss").each(function (i, ele) {
            // $(ele) represents each element

            // result = {}
            let result = {};

            // result = { title: text }
            result.title = $(ele).text();

            // result = {title: text, link: href}
            result.link = $(ele).attr("href");

            title.push(result)

            // Using .create() will save data to the db
            db.Article.create(result)
                .then(function (dbArticle) {
                    // View the added result in the console
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    // If an error occurred, log it
                    console.log(err);
                });
        });
        res.send("Scrape Complete")
        console.log(title)


    });
});
// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
        .then(function (dbArticle) {
            // If we were able to successfully find Articles, send them back to the client
            res.json(dbArticle);
        })
        //Catch Error
        .catch(function (err) {
            res.json(err);
        });
});
// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle){
        // If we were able to successfully find an Article with the given id, send it back to the client
        res.json(dbArticle);
    })
    .catch(function(err){
        //Catch Error
        res.json(err);
    });
});
// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res){
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
    .then(function(dbNote){
        // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
        return db.Article.findOneAndUpdate({_id: req.params.id}, { note: dbNote._id}, {new: true});
    })
    .then(function(dbArticle){
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
    })
    .catch(function(err){
        //Catch Error
        res.json(err);
    });
});


// Start Server
app.listen(PORT, function () {
    console.log("listening on port " + PORT)
})