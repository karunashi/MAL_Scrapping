
// Dependencies
var express = require("express");
var router = express.Router();
var path = require("path");

// Web Scrapping Below
var request = require("request");
var cheerio = require("cheerio");

// Models
var Note = require("../models/Note.js");
var Article = require("../models/Article.js");

router.get("articles", function (req, res){
	Article.find().sort({_id: -1})
	.populate("note")
	.exec(function(err, doc){
		if (err) {
			console.log(err);
			}
		else {
		res.json(doc)
			}
		});
});

router.get("/scrape", function(req, res) {
  
  // First, we grab the body of the html with request
  request("https://myanimelist.net/news", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    // Grab every div with the class news-unit and...
    $("div .news-unit").each(function(i, element) {

      // Save an empty result object
      var result = {};

      // Add title, link, paragraph text, and img source

      , and save them as properties of the result object
      result.title = $(this).children("div .news-unit-right").children("p").text();
      result.link = $(this).children("a").attr("href");
      result.paratext = $(this).children("div .news-unit-right").children("div .text").text();
      result.picture = $(this).children("a").children("img").attr("src");

		// Check to make sure news topics with just "More" gets ignored in the collection since it's just an extension to the front page.
      if (result.title === "More") {
        console.log("Insufficient Title Information for News");
      }
      else {
        var entry = new Article(result);

        entry.save(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        // Or log the doc
        else {
          console.log(doc);
        }
      });
      }
    });
  });
  // Tell the browser that we finished scraping the text
  res.send("Scrape Complete");
});

// Grab an article by it's ObjectId
router.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
  // ..and populate all of the notes associated with it
  .populate("note")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});


// Create a new note or replace an existing note
router.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);

  // And save the new note the db
  newNote.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
    }
  });
});


//// Placeholder for deleting notes later

// Export this to server.js
module.exports = router;