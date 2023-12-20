const APIController = (function () {
  const clientId = YOUR_SPOTIFY_CLIENT_ID;
  const clientSecret = YOUR_SPOTIFY_CLIENT_SECRET;

  // private methods
  const _getToken = async () => {
    const result = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
      },
      body: "grant_type=client_credentials",
    });

    const data = await result.json();
    return data.access_token;
  };

  const _getGenres = async (token) => {
    const result = await fetch(
      `https://api.spotify.com/v1/browse/categories?locale=sv_US`,
      {
        method: "GET",
        headers: { Authorization: "Bearer " + token },
      }
    );

    const data = await result.json();
    return data.categories.items;
  };

  const _getPlaylistByGenre = async (token, genreId) => {
    const limit = 10;

    const result = await fetch(
      `https://api.spotify.com/v1/browse/categories/${genreId}/playlists?limit=${limit}`,
      {
        method: "GET",
        headers: { Authorization: "Bearer " + token },
      }
    );

    const data = await result.json();
    return data.playlists.items;
  };

  const _getTracks = async (token, tracksEndPoint) => {
    const limit = 5;

    const result = await fetch(`${tracksEndPoint}?limit=${limit}`, {
      method: "GET",
      headers: { Authorization: "Bearer " + token },
    });

    const data = await result.json();
    return data.items;
  };

  const _getTrack = async (token, trackEndPoint) => {
    const result = await fetch(`${trackEndPoint}`, {
      method: "GET",
      headers: { Authorization: "Bearer " + token },
    });

    const data = await result.json();
    return data;
  };

  return {
    getToken() {
      return _getToken();
    },
    getGenres(token) {
      return _getGenres(token);
    },
    getPlaylistByGenre(token, genreId) {
      return _getPlaylistByGenre(token, genreId);
    },
    getTracks(token, tracksEndPoint) {
      return _getTracks(token, tracksEndPoint);
    },
    getTrack(token, trackEndPoint) {
      return _getTrack(token, trackEndPoint);
    },
  };
})();

// UI Module
const UIController = (function () {
  //object to hold references to html selectors
  const DOMElements = {
    selectGenre: "#select_genre",
    selectPlaylist: "#select_playlist",
    buttonSubmit: "#btn_submit",
    divSongDetail: "#song-detail",
    hfToken: "#hidden_token",
    divSonglist: ".song-list",
  };

  //public methods
  return {
    inputField() {
      return {
        genre: document.querySelector(DOMElements.selectGenre),
        playlist: document.querySelector(DOMElements.selectPlaylist),
        tracks: document.querySelector(DOMElements.divSonglist),
        submit: document.querySelector(DOMElements.buttonSubmit),
        songDetail: document.querySelector(DOMElements.divSongDetail),
      };
    },

    // select list
    createGenre(text, value) {
      const html = `<option value="${value}">${text}</option>`;
      document
        .querySelector(DOMElements.selectGenre)
        .insertAdjacentHTML("beforeend", html);
    },

    createPlaylist(text, value) {
      const html = `<option value="${value}">${text}</option>`;
      document
        .querySelector(DOMElements.selectPlaylist)
        .insertAdjacentHTML("beforeend", html);
    },

    // track list
    createTrack(id, name) {
      const html = `<a href="#" class="list-group-item list-group-item-action list-group-item-light" id="${id}">
        ${name}
      </a>`;
      document
        .querySelector(DOMElements.divSonglist)
        .insertAdjacentHTML("beforeend", html);
    },

    // track details
    createTrackDetail(img, title, artist, spotifyUrl) {
      const detailDiv = document.querySelector(DOMElements.divSongDetail);

      detailDiv.innerHTML = "";

      const html = `
        <div class="row col-sm-12 px-0">
            <img src="${img}" alt="">        
        </div>
        <div class="row col-sm-12 px-0">
            <label for="Genre" class="form-label col-sm-12">${title}</label>
        </div>
        <div class="row col-sm-12 px-0">
            <label for="artist" class="form-label col-sm-12">${artist}</label>
        </div>
        <div class="row col-sm-12 px-0">
            <label for="spotifyUrl" class="form-label col-sm-12">
                <a href="${spotifyUrl}" target="_blank" class="spotifyUrl">Listen on Spotify!</a>
            </label>
        </div>
      `;

      detailDiv.insertAdjacentHTML("beforeend", html);
    },

    resetTrackDetail() {
      this.inputField().songDetail.innerHTML = "";
    },

    resetTracks() {
      this.inputField().tracks.innerHTML = "";
      this.resetTrackDetail();
    },

    resetPlaylist() {
      this.inputField().playlist.innerHTML = "";
      this.resetTracks();
    },

    storeToken(value) {
      document.querySelector(DOMElements.hfToken).value = value;
    },

    getStoredToken() {
      return {
        token: document.querySelector(DOMElements.hfToken).value,
      };
    },
  };
})();

const APPController = (function (UICtrl, APICtrl) {
  const DOMInputs = UICtrl.inputField();

  // load genres on page load
  const loadGenres = async () => {
    const token = await APICtrl.getToken();
    UICtrl.storeToken(token);
    const genres = await APICtrl.getGenres(token);
    genres.forEach((element) => UICtrl.createGenre(element.name, element.id));
  };

  // genre change event listener
  DOMInputs.genre.addEventListener("change", async () => {
    UICtrl.resetPlaylist();
    //get the token that's stored on the page
    const token = UICtrl.getStoredToken().token;
    // get the genre select field
    const genreSelect = UICtrl.inputField().genre;
    // get the genre id associated with the selected genre
    const genreId = genreSelect.options[genreSelect.selectedIndex].value;
    // ge the playlist based on a genre
    const playlist = await APICtrl.getPlaylistByGenre(token, genreId);
    // create a playlist list item for every playlist returned
    playlist.forEach((p) => UICtrl.createPlaylist(p.name, p.tracks.href));
  });

  //submit button click event listener
  DOMInputs.submit.addEventListener("click", async (e) => {
    // prevent page reset
    e.preventDefault();
    // clear tracks
    UICtrl.resetTracks();
    //get the token
    const token = UICtrl.getStoredToken().token;
    // get the playlist field
    const playlistSelect = UICtrl.inputField().playlist;
    // get track endpoint based on the selected playlist
    const tracksEndPoint =
      playlistSelect.options[playlistSelect.selectedIndex].value;
    // get the list of tracks
    const tracks = await APICtrl.getTracks(token, tracksEndPoint);
    // create a track list item
    tracks.forEach((el) => UICtrl.createTrack(el.track.href, el.track.name));
  });

  //song selection click event listener
  DOMInputs.tracks.addEventListener("click", async (e) => {
    // prevent page reset
    e.preventDefault();
    UICtrl.resetTrackDetail();
    // get the token
    const token = UICtrl.getStoredToken().token;
    // get the track endpoint
    const trackEndpoint = e.target.id;
    //get the track object
    const track = await APICtrl.getTrack(token, trackEndpoint);
    // load the track details
    UICtrl.createTrackDetail(
      track.album.images[2].url,
      track.name,
      track.artists[0].name,
      track.external_urls.spotify
    );

    const trackName = track.name;
    const artistName = track.artists[0].name;

    // Search for the selected track on YouTube using the Data v3 API
    const youtubeApiKey = YOUR_YOUTUBE_API_KEY;
    const searchQuery = `${trackName} ${artistName}`;
    const youtubeSearchUrl = `https://www.googleapis.com/youtube/v3/search?key=${youtubeApiKey}&q=${searchQuery}&part=snippet&type=video`;

    try {
      const youtubeSearchResponse = await fetch(youtubeSearchUrl);
      const youtubeSearchData = await youtubeSearchResponse.json();

      // Check if there are search results
      if (youtubeSearchData.items && youtubeSearchData.items.length > 0) {
        // Get the video ID of the first search result
        const videoId = youtubeSearchData.items[0].id.videoId;

        // Embed the YouTube player
        const youtubePlayerContainer = document.getElementById("youtubePlayer");
        youtubePlayerContainer.innerHTML = `
          <iframe width="460" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
        `;
      } else {
        console.log("No YouTube results found for the selected track.");
      }
    } catch (error) {
      console.error("Error searching for the track on YouTube:", error);
    }
  });

  return {
    init() {
      console.log("App is starting");
      loadGenres();
    },
  };
})(UIController, APIController);

APPController.init();
