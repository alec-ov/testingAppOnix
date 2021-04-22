require('dotenv').config()
const express = require("express");
const https = require('https');
const fs = require('fs');
const path = require("path");
const { query } = require('express');

const sha = require("crypto").createHash("sha256");

const app = new express();
app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(express.static('saved'));

const QueryCache = new Map();
/**
 * 
 * @param {string} query 
 * @returns {{data:[gif]}}
 */
async function getGIFs(query = "cat") {
	if (QueryCache.has(query)) {
		return QueryCache.get(query);
	}
	else {
		return new Promise((resolve, reject) => {
			https.get(`https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API}&q=${query}&limit=30`, (resp) => {

				let data = '';

				// A chunk of data has been received.
				resp.on('data', (chunk) => {
					data += chunk;
				});

				// The whole response has been received.
				resp.on('end', () => {
					let result = JSON.parse(data);
					result.data.sort((a, b) => a.rating > b.rating);

					QueryCache.set(query, { gifs: result.data.slice(0, 10), loaded: false })
					resolve(QueryCache.get(query));
				});

			}).on('error', (err) => {
				reject(err);
			});
		});
	}
}
async function download(url, name) {
	const file = fs.createWriteStream("saved/" + name + ".gif");
	return new Promise((resolve, reject) => {
		https.get(url, function (response) {
			response.pipe(file);
			resolve();
		}).on("error", (err) => {
			reject(err);
		});
	});
};

async function saveGIFs(query) {
	let name = 0;
	const data = await getGIFs(query);

	for (let gif of data.gifs) {
		await download(gif.images.original.url, name);
		name++;
	}
}

app.get('/gif', async (req, res) => {
	let result = {};
	if (req.query.q) {
		result = await getGIFs(req.query.q);
	}
	res.render('list', { gifs: result.gifs, query: req.query.q });
})

app.get('/save', async (req, res, next) => {
	if (req.query.q) {
		await saveGIFs(req.query.q);

		res.redirect('/saved');
	}
	next(new Error('Query expected'));
})

app.get('/saved', async (req, res) => {
	let result = {};

	const directoryPath = path.join(__dirname, 'saved');

	fs.readdir(directoryPath, function (err, files) {

		if (err) {
			throw new Error("unable to read directory");
		}

		res.render('saved', { files });
	});


})


app.get('*', async (req, res) => {
	res.send("not found");
})

app.listen(80);
console.log("listening");