const http = require('http');
const fs = require('fs');

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => { // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log('req.body', req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    // Your code here
    // make some parsing:
    let urlParts = req.url.split("/");

    // Get all the artists
    if (req.method === 'GET' && req.url === "/artists") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.body = artists;
      res.body = JSON.stringify(res.body)
      res.write(res.body)
      return res.end();

    }
    // Get a specific artist's details based on artistId
    if (req.method === 'GET' && req.url.startsWith("/artists/") && urlParts.length === 3) {
      let artistId = Number(urlParts[2]);
      res.setHeader("Content-Type", "application/json");
      res.body = artists[artistId];
      // check artist exist
      if (!res.body) {
        res.statusCode = 404;
        res.end('Artist not found');
        return;
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");

      //also need albums:

      let albumsArr = Object.values(albums);
      let artistAlbumsArr = albumsArr.filter(album => album.artistId === artistId)
      res.body.albums = artistAlbumsArr;
      res.body = JSON.stringify(res.body)
      res.write(res.body)
      console.log('res.body ', res.body)
      res.end();
      return;
    }

    // ### Add an artist
    if (req.method === 'POST' && req.url === '/artists') {
      res.setHeader("Content-Type", "application/json");
      // check artist name in request exist
      if (!req.body || !req.body.name) {
        res.statusCode = 404;
        res.end('No artist name to add');
        return;
      }

      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");

      let newArtistId = getNewArtistId()
      let newArtist = {
        name: req.body.name,
        artistId: newArtistId
      }
      // adding to server:
      artists[newArtistId] = newArtist;

      res.body = newArtist;
      res.body = JSON.stringify(res.body)
      res.write(res.body)
      console.log('res.body ', res.body)
      res.end();
      return;
    }

    // ### Edit a specified artist by artistId
    if ((req.method === 'PATCH' || req.metod === 'PUT') && req.url.startsWith('/artists/')
      && urlParts.length === 3) {
      res.setHeader("Content-Type", "application/json");
      let artistId = Number(urlParts[2]);
      // check artist exist
      if (!artists[artistId]) {
        res.statusCode = 404;
        res.end('Artist not found');
        return;
      }

      // check artist name in request exist
      if (!req.body || !req.body.name) {
        res.statusCode = 404;
        res.end('No artist name to add');
        return;
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");

      // editing on server:
      artists[artistId].name = req.body.name;

      res.body = artists[artistId];
      res.body = JSON.stringify(res.body)
      res.write(res.body)
      console.log('res.body ', res.body)
      res.end();
      return;
    }


    //### Delete a specified artist by artistId
    if (req.method === 'DELETE' && req.url.startsWith('/artists/')
      && urlParts.length === 3) {
      res.setHeader("Content-Type", "application/json");
      let artistId = Number(urlParts[2]);
      // check artist exist
      if (!artists[artistId]) {
        res.statusCode = 404;
        res.end('Artist not found');
        return;
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");

      // deleting on server:
      delete artists[artistId];

      res.body = {
        "message": "Sucessfully deleted"
      };
      res.body = JSON.stringify(res.body)
      res.write(res.body)
      console.log('res.body ', res.body)
      res.end();
      return;
    }


    //###  Get all albums of a specific artist based on artistId
    if (req.method === 'GET' && req.url.startsWith("/artists/")
      && req.url.endsWith("/albums") && urlParts.length === 4) {
      let artistId = Number(urlParts[2]);
      res.setHeader("Content-Type", "application/json");

      // check artist exist
      if (!artists[artistId]) {
        res.statusCode = 404;
        res.end('Artist not found');
        return;
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");

      // need albums:

      let albumsArr = Object.values(albums);
      let artistAlbumsArr = albumsArr.filter(album => album.artistId === artistId)
      res.body = artistAlbumsArr;
      res.body = JSON.stringify(res.body)
      res.write(res.body)
      console.log('res.body ', res.body)
      res.end();
      return;
    }

    // ### Get a specific album's details based on albumId
    if (req.method === 'GET' && req.url.startsWith("/albums/")
      && urlParts.length === 3) {
      let albumId = Number(urlParts[2]);
      let album = albums[albumId]
      res.setHeader("Content-Type", "application/json");

      // check album exist
      if (!album) {
        res.statusCode = 404;
        res.end('Album not found');
        return;
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");

      // need artist by id:
      let artistId = album.artistId;
      let artist = artists[artistId];

      // also need songs by albumId

      let songsArr = Object.values(songs);
      let songsOfAlbumArr = songsArr.filter(song => song.albumId === albumId)
      res.body = album;
      // adding artist and songs
      res.body.artist = artist;
      res.body.songs = songs;
      res.body = JSON.stringify(res.body)
      res.write(res.body)
      console.log('res.body ', res.body)
      res.end();
      return;
    }

    // ### Add an album to a specific artist based on artistId
    if ((req.method === 'POST') && req.url === '/albums') {
      res.setHeader("Content-Type", "application/json");

      // check album to add exist
      if (!req.body) {
        res.statusCode = 404;
        res.end('nothing to add');
        return;
      }

      // check artist name and artistId in request exist
      if (!req.body.name || !req.body.artistId) {
        res.statusCode = 404;
        res.end('No album name or artistId');
        return;
      }

      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");

      // editing on server:
      let newAlbumId = getNewAlbumId();
      let newAlbum = req.body
      newAlbum.albumId = newAlbumId
      albums[newAlbumId] = newAlbum;

      res.body = newAlbum;
      res.body = JSON.stringify(res.body)
      res.write(res.body)
      console.log('res.body ', res.body)
      res.end();
      return;
    }

    // ### Edit a specified album by albumId

    if ((req.method === 'PATCH' || req.metod === 'PUT') && req.url.startsWith('/albums/')
      && urlParts.length === 3) {
      res.setHeader("Content-Type", "application/json");
      let albumId = Number(urlParts[2]);
      // check alb exist
      if (!albums[albumId]) {
        res.statusCode = 404;
        res.end('Album not found');
        return;
      }

      // check album and artistId in request exist
      if (!req.body || !req.body.name || !req.body.artistId) {
        res.statusCode = 404;
        res.end('No artist name or artistId to edit');
        return;
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");

      // editing on server:
      albums[albumId] = req.body;
      // can make different edit on PUT and PATCH if needed
      // here is PUT in fact

      res.body = JSON.stringify(res.body)
      res.write(res.body)
      console.log('res.body ', res.body)
      res.end();
      return;
    }

    // ### Delete a specified album by albumId
    if (req.method === 'DELETE' && req.url.startsWith('/albums/')
      && urlParts.length === 3) {
      res.setHeader("Content-Type", "application/json");
      let albumId = Number(urlParts[2]);
      // check album exist
      if (!albums[albumId]) {
        res.statusCode = 404;
        res.end('Album not found');
        return;
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");

      // deleting on server:
      delete albums[albumId];

      res.body = {
        "message": "Sucessfully deleted"
      };
      res.body = JSON.stringify(res.body)
      res.write(res.body)
      console.log('res.body ', res.body)
      res.end();
      return;
    }

    // ## Get all songs of a specific artist based on artistId
    if (req.method === 'GET' && req.url.startsWith("/artists/")
    && req.url.endsWith("/songs") && urlParts.length === 4) {
    let artistId = Number(urlParts[2]);
    res.setHeader("Content-Type", "application/json");

    // check artist exist
    if (!artists[artistId]) {
      res.statusCode = 404;
      res.end('Artist not found');
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");

    // need albums:

    let albumsArr = Object.values(albums);
    let artistAlbumsArr = albumsArr.filter(album => album.artistId === artistId)
    let albumsIdArr = artistAlbumsArr.map(album => album.albumId)

    // need songs:
    let allSongsArr = Object.values(songs);
    let artistSongsByAlbumIdArr = allSongsArr.filter(song => albumsIdArr.includes(song.albumId))

    res.body = artistSongsByAlbumIdArr;
    res.body = JSON.stringify(res.body)
    res.write(res.body)
    console.log('res.body ', res.body)
    res.end();
    return;
  }

  // ### Get all songs of a specific album based on albumId
  if (req.method === 'GET' && req.url.startsWith("/albums/")
  && req.url.endsWith("/songs") && urlParts.length === 4) {
  let albumId = Number(urlParts[2]);
  res.setHeader("Content-Type", "application/json");

  // check a exist
  if (!albums[albumId]) {
    res.statusCode = 404;
    res.end('A not found');
    return;
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");

  // need songs:
  let allSongsArr = Object.values(songs);
  let songsByAlbumIdArr = allSongsArr.filter(song => song.albumId === albumId)

  res.body = songsByAlbumIdArr;
  res.body = JSON.stringify(res.body)
  res.write(res.body)
  console.log('res.body ', res.body)
  res.end();
  return;
}

// ### Get all songs of a specified trackNumber
if (req.method === 'GET' && req.url.startsWith("/trackNumber/")
  && req.url.endsWith("/songs") && urlParts.length === 4) {
  let trackNumber = Number(urlParts[2]);
  res.setHeader("Content-Type", "application/json");

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");

  // need songs:
  let allSongsArr = Object.values(songs);
  let songsByTrackNumberArr = allSongsArr.filter(song => song.trackNumber === trackNumber)

  res.body = songsByTrackNumberArr;
  res.body = JSON.stringify(res.body)
  res.write(res.body)
  console.log('res.body ', res.body)
  res.end();
  return;
}

// ### Get a specific song's details based on songId
if (req.method === 'GET' && req.url.startsWith("/songs/") && urlParts.length === 3) {
  let songId = Number(urlParts[2]);
  res.setHeader("Content-Type", "application/json");
  res.body = songs[songId];
  // check song exist
  if (!res.body) {
    res.statusCode = 404;
    res.end('song not found');
    return;
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.body = JSON.stringify(res.body)
  res.write(res.body)
  console.log('res.body ', res.body)
  res.end();
  return;
}


    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});


// ### Add a song to a specific album based on albumId
// ### Edit a specified song by songId
//### Delete a specified song by songId
const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));
