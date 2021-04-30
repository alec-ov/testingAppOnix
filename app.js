require('dotenv').config();

const express = require("express");

const {getGIFs, saveGIFs, getSavedGIFs} = require('./gif_manager');

const app = new express();
app.set("view engine", "ejs");
app.use(express.static('public')); // styles
app.use(express.static('saved')); // saved gifs

/**
 * Generates a middleware function that catches any exceptions and passes them to express(next()) to be handled
 * @param {Function} handler async middleware function that doesn't catch exceptions
 * @returns request handler that automaticly passes errors to next()
 */
function catcher(handler) {
	return async (req, res, next) => {
		try {
			await handler(req, res, next);
		}
		catch (e) {
			next(e);
		}
	}
}

/** Log all requests */
app.use((req, res, next) => {
	console.log("Request to", req.url);
	next();
})
/** Search page. Displays GIPHY search results and an option to save top 10 of them(sorted by gif.rating) */
app.get('/gif', catcher(
	async (req, res) => {
		let gifs = [];
		if (req.query.q) {
			gifs = await getGIFs(req.query.q);
		}
		res.render('list', { gifs, query: req.query.q });
	})
);

/** Doenloads 10 gifs to "saved" folder and when finished redirects to list of saved gifs */
app.get('/save', catcher(
	async (req, res, next) => {
		if (req.query.q) {
			await saveGIFs(req.query.q);

			res.redirect('/saved');
		} else {
			throw new Error('Query expected');
		}

	})
);

/** Displays all images in "saved" directory */
app.get('/saved', catcher(
	async (req, res, next) => {
		res.render('saved', { files: await getSavedGIFs() });
	})
);

app.get('*', (req, res) => {
	res.status(404);
	res.render('nav')
})

app.listen(80); // standart http port
console.log("listening on port 80.");