const https = require('https');
const fs = require('fs');
const path = require("path");

const Jimp = require('jimp'); // image editing lib

const QueryCache = new Map();
/**
 * loads GIF info from Cache or makes an API request to GIPHY
 * @param {string} query 
 * @returns {[gif]} A list of GIF objects
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
					result.data = result.data.sort((a, b) => {
						
						return (a.rating >= b.rating) - 1;
					}); // sort by rating

					QueryCache.set(query, result.data)
					resolve(QueryCache.get(query));
				});

			}).on('error', (err) => {
				reject(err);
			});
		});
	}
}

/**
 * Downloads a file from a url
 * @param {string} url url of rhe filr to be downloaded
 * @param {string} name name of the file
 * @returns Promise<undefined> wnen finished
 */
async function download(url, name) {
	const file = fs.createWriteStream("saved/" + name);
	return new Promise((resolve, reject) => {
		https.get(url, function (response) {
			response.pipe(file);
			resolve();
		}).on("error", (err) => {
			reject(err);
		});
	});
};

/**
 * Adds text to left top corner of the image.
 * Jimp library currentry cannot encode GIFs thus this function cannot be used. Works properly with .png
 * @param {string} filename path to the image file
 */
async function watermark(filename) {
	const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
	const image = await Jimp.read(filename);

	image.print(font, 10, 10, 'TEST WATERMARK');
	image.write(filename);
}

/**
 * Searches gifs by a query and saves them to "saved" folder.
 * @param {string} query a search query to be used in GIPHY API
 */
async function saveGIFs(query) {
	let name = 0; // counter for names (0.gif, 1.gif e.t.c.)
	const gifs = (await getGIFs(query)).slice(0, 10);// take first 10
	const index = {};

	for (let gif of gifs) { 
		await download(gif.images.original.url, name + ".gif");
		/* GIFs temporarily not supported by Jimp:  */
		//await watermark("./saved/" + name + ".gif");
		
		index[name + ".gif"] = {title: gif.title, author: gif.username, rating: gif.rating}; // save info about author and rating
		name++;
	}
	fs.writeFileSync("saved/list.json", JSON.stringify(index));
}

/**
 * Returns all saved GIFs and infp about them
 * @returns [{data: {title, author, rating}, path: string}] a list of gifs in 'saved' directory and info about them from 'list.json' (if available)
 */
function getSavedGIFs() {
	return new Promise((resolve, reject) => {
		const directoryPath = path.join(__dirname, 'saved');
		const index = JSON.parse(fs.readFileSync(directoryPath + "/list.json").toString());
		
		fs.readdir(directoryPath, function (err, files) {
			if (err) {
				reject(err);
			}
			files = files.filter((f) => f.endsWith(".gif"));
			resolve( files.map((fn) => { return {data: index[fn], path: fn} } ));
		});
	});
}

module.exports = {getGIFs, saveGIFs, getSavedGIFs};