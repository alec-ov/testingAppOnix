# testingAppOnix
Small test project.
## Routes:
  - ### /gif?q=query
  Displays 30 gifs found on GIPHY by a search query
  - ### /save?q=query
  Gets 30 gifs by query, sorts them by "rating" field, downloads top 10 to folder "saved".  
  ~~Adds a "TEST" watermark to every gif.~~  
  Redirects to /saved when finished.
  - ### /saved
  An ejs view that displays all downloaded gifs

## Used technologies/frameworks
- __[Express.js](https://github.com/expressjs/express)__
- __[ejs](https://github.com/mde/ejs)__
- ~~__[Jimp](https://github.com/oliver-moran/jimp#readme)__ for image editing~~ (does not support gifs "currently")
- [GIPHY search API](https://developers.giphy.com/docs/api/endpoint/#search) (API key should be in environment variable "GIPHY_API")
#### Note
folder "saved" not included to repository due to copyright on gifs
