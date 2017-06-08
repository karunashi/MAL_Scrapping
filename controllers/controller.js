
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

      // Add title, link, paragraph text, and img source, and save them as properties of the result object
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