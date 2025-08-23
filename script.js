document.addEventListener("DOMContentLoaded", () => {
  const radioList = document.getElementById("radio-list");
  const audioPlayer = document.getElementById("audio-player");
  const currentStationDisplay = document.getElementById("current-station");
  const searchBar = document.getElementById("search-bar");
  const jsonSelector = document.getElementById("json-selector");
  const nextBtn = document.getElementById("next-btn");
  const prevBtn = document.getElementById("prev-btn");
  const playPauseBtn = document.getElementById("switch");

  let allStations = [];
  let currentStations = [];
  let currentIndex = -1;
  let hls;

  async function loadRadioStations(jsonPath) {
    try {
      const response = await fetch(jsonPath);
      if (!response.ok) throw new Error("Errore nel caricamento del file JSON.");
      allStations = (await response.json()).sort((a, b) => a.name.localeCompare(b.name));
      displayStations(allStations);
      currentIndex = -1;
      currentStationDisplay.textContent = "Seleziona una radio";
    } catch (error) {
      console.error(error);
      currentStationDisplay.textContent = "Impossibile caricare le stazioni radio.";
      radioList.innerHTML = "<li>Nessuna stazione trovata.</li>";
    }
  }

  function displayStations(stations) {
    currentStations = stations;
    radioList.innerHTML = stations.map((s, i) => `
      <li data-index="${i}" data-url="${s.url}">
        <div class="station-info">
          <span class="name">${s.name}</span>
          <span class="language">(${s.language})</span>
        </div>
        <div class="station-info">
          <span class="genre">${s.genre}</span>
        </div>
      </li>
    `).join('');
  }

  searchBar.addEventListener("input", (e) => {
    const text = e.target.value.toLowerCase();
    displayStations(allStations.filter(s => s.name.toLowerCase().includes(text) || s.genre.toLowerCase().includes(text)));
    currentIndex = -1;
    currentStationDisplay.textContent = "Seleziona una radio";
  });

  function playStation(station, index) {
    if (!audioPlayer.paused) audioPlayer.pause();

    if (typeof Hls !== "undefined" && Hls.isSupported() && station.url.endsWith(".m3u8")) {
      if (hls) hls.destroy();
      hls = new Hls();
      hls.loadSource(station.url);
      hls.attachMedia(audioPlayer);
      hls.on(Hls.Events.MANIFEST_PARSED, () => audioPlayer.play().catch(console.error));
    } else {
      audioPlayer.src = station.url;
      audioPlayer.play().catch(console.error);
    }

    currentStationDisplay.textContent = `- ${station.name} -`;
    currentIndex = index;
    updatePlayButton();
  }

  function updatePlayButton() {
    playPauseBtn.textContent = audioPlayer.paused ? "▶" : "❚❚";
    playPauseBtn.style.display = audioPlayer.src ? "inline" : "none";
  }

  async function switchAudio() {
    if (audioPlayer.paused) {
      try { await audioPlayer.play(); } catch (err) { console.error(err); }
    } else {
      audioPlayer.pause();
    }
    updatePlayButton();
  }

  radioList.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    const index = parseInt(li.dataset.index);
    playStation(currentStations[index], index);
  });

  playPauseBtn.addEventListener("click", switchAudio);
  audioPlayer.addEventListener("play", updatePlayButton);
  audioPlayer.addEventListener("pause", updatePlayButton);

  nextBtn.addEventListener("click", () => {
    if (!currentStations.length) return;
    currentIndex = (currentIndex + 1) % currentStations.length;
    playStation(currentStations[currentIndex], currentIndex);
  });

  prevBtn.addEventListener("click", () => {
    if (!currentStations.length) return;
    currentIndex = (currentIndex - 1 + currentStations.length) % currentStations.length;
    playStation(currentStations[currentIndex], currentIndex);
  });

  jsonSelector.addEventListener("change", (e) => {
    searchBar.value = "";
    loadRadioStations(e.target.value);
  });

  loadRadioStations(jsonSelector.value);

  // --vh fix per iOS/Android
  function setVh() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  }
  window.addEventListener('resize', setVh);
  window.addEventListener('load', setVh);
  setVh();
});
