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
  let hls = null;

  async function loadRadioStations(jsonPath) {
    try {
      const response = await fetch(jsonPath);
      if (!response.ok) throw new Error("Errore nel caricamento del file JSON.");
      allStations = (await response.json()).sort((a, b) => a.name.localeCompare(b.name));
      displayStations(allStations);
      currentIndex = -1;
      resetAudioPlayer();
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
  });

  // Funzione per azzerare lo stream precedente e svuotare il buffer
  function resetAudioPlayer() {
    if (hls) {
      hls.destroy();
      hls = null;
    }
    audioPlayer.pause();
    audioPlayer.removeAttribute("src"); // Rimuove l'URL per non mantenere lock o connessioni aperte
    audioPlayer.load(); // Svuota la memoria e il buffer del browser
  }

  function playStation(station, index) {
    if (!station) return;

    // 1. Ferma e resetta completamente la riproduzione precedente
    resetAudioPlayer();

    currentIndex = index;
    currentStationDisplay.textContent = `Caricamento: ${station.name}...`;

    const handlePlayError = (err) => {
      console.error("Errore di riproduzione:", err);
      currentStationDisplay.textContent = `Offline o non raggiungibile: ${station.name}`;
      resetAudioPlayer();
      updatePlayButton();
    };

    // 2. Gestione flusso HLS (.m3u8) o stream HTTP/MP3 standard
    if (typeof Hls !== "undefined" && Hls.isSupported() && station.url.includes(".m3u8")) {
      hls = new Hls();
      hls.loadSource(station.url);
      hls.attachMedia(audioPlayer);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        audioPlayer.play().catch(handlePlayError);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          handlePlayError(data.type);
        }
      });
    } else {
      audioPlayer.src = station.url;
      audioPlayer.load(); // Fondamentale per agganciarsi al punto "live" in tempo reale
      audioPlayer.play().catch(handlePlayError);
    }

    updatePlayButton();
  }

  function updatePlayButton() {
    // Se c'è uno stream in riproduzione mostra l'icona pausa, altrimenti play
    playPauseBtn.textContent = audioPlayer.paused ? "▶" : "❚❚";
    playPauseBtn.style.display = (currentIndex !== -1) ? "inline" : "none";
  }

  function switchAudio() {
    if (audioPlayer.paused) {
      if (currentIndex !== -1 && currentStations[currentIndex]) {
        // Ricarica la stazione da zero per allinearsi alla diretta live (evita il buffer vecchio)
        playStation(currentStations[currentIndex], currentIndex);
      }
    } else {
      // Quando si stoppa una radio live, è preferibile azzerare la ricezione
      resetAudioPlayer();
      updatePlayButton();
    }
  }

  // Evento nativo di errore del tag <audio> (es. server irraggiungibile, 404, CORS o Mixed Content)
  audioPlayer.addEventListener("error", () => {
    if (currentIndex !== -1 && currentStations[currentIndex]) {
      currentStationDisplay.textContent = `Non disponibile: ${currentStations[currentIndex].name}`;
    }
    resetAudioPlayer();
    updatePlayButton();
  });

  // Il nome della stazione viene confermato a schermo solo quando l'audio parte per davvero
  audioPlayer.addEventListener("playing", () => {
    if (currentIndex !== -1 && currentStations[currentIndex]) {
      currentStationDisplay.textContent = `- ${currentStations[currentIndex].name} -`;
    }
    updatePlayButton();
  });

  audioPlayer.addEventListener("pause", updatePlayButton);

  radioList.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    const index = parseInt(li.dataset.index, 10);
    playStation(currentStations[index], index);
  });

  playPauseBtn.addEventListener("click", switchAudio);

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

  // --vh fix per dispositivi mobili (iOS/Android)
  function setVh() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  }
  window.addEventListener('resize', setVh);
  window.addEventListener('load', setVh);
  setVh();
});
