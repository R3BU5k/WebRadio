document.addEventListener("DOMContentLoaded", () => {
  const radioList = document.getElementById("radio-list");
  const audioPlayer = document.getElementById("audio-player");
  const currentStationDisplay = document.getElementById("current-station");
  const searchBar = document.getElementById("search-bar");
  const jsonSelector = document.getElementById("json-selector");
  const nextBtn = document.getElementById("next-btn");
  const prevBtn = document.getElementById("prev-btn");

  let allStations = [];
  let currentIndex = -1; // -1 indica che nessuna stazione è selezionata

  // Funzione per caricare le stazioni radio dal file JSON
  async function loadRadioStations(jsonPath) {
    try {
      const response = await fetch(jsonPath);
      if (!response.ok) {
        throw new Error("Errore nel caricamento del file JSON.");
      }
      allStations = await response.json();

      // Ordina le stazioni in ordine alfabetico per nome
      allStations.sort((a, b) => a.name.localeCompare(b.name));

      displayStations(allStations);
      currentIndex = -1; // Resetta l'indice quando si carica una nuova lista
      currentStationDisplay.textContent = "Seleziona una radio";
    } catch (error) {
      console.error("Si è verificato un errore:", error);
      currentStationDisplay.textContent =
        "Impossibile caricare le stazioni radio.";
      radioList.innerHTML = "<li>Nessuna stazione trovata.</li>";
    }
  }

  // Funzione per visualizzare le stazioni nell'elenco
  function displayStations(stations) {
    radioList.innerHTML = "";
    stations.forEach((station) => {
      const li = document.createElement("li");
      li.innerHTML = `
            <div class="station-info">
                <span class="name">${station.name}</span>
                <span class="language">(${station.language})</span>
            </div>
            <div class="station-info">
                <span class="genre">${station.genre}</span>
            </div>
        `;
      li.dataset.url = station.url;
      li.dataset.name = station.name;
      li.dataset.index = allStations.findIndex((s) => s.name === station.name);
      radioList.appendChild(li);
    });
  }

  // Funzione per filtrare le stazioni
  searchBar.addEventListener("input", (e) => {
    const searchText = e.target.value.toLowerCase();
    const filteredStations = allStations.filter((station) => {
      return (
        station.name.toLowerCase().includes(searchText) ||
        station.genre.toLowerCase().includes(searchText)
      );
    });
    displayStations(filteredStations);
  });

  // Funzione unificata per riprodurre una stazione
  function playStation(station, index) {
    const url = station.url;
    const name = station.name;

    // Se è già in riproduzione, metti in pausa per un istante per evitare conflitti
    if (!audioPlayer.paused) {
      audioPlayer.pause();
    }

    // Logica per gestire i link HLS e i link MP3 (richiede hls.js)
    if (
      typeof Hls !== "undefined" &&
      Hls.isSupported() &&
      url.endsWith(".m3u8")
    ) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(audioPlayer);
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        audioPlayer
          .play()
          .catch((error) =>
            console.error("Errore durante la riproduzione:", error)
          );
      });
    } else {
      // Usa il metodo standard
      audioPlayer.src = url;
      audioPlayer
        .play()
        .catch((error) =>
          console.error("Errore durante la riproduzione:", error)
        );
    }

    currentStationDisplay.textContent = `In riproduzione: ${name}`;
    currentIndex = index; // Aggiorna l'indice corrente
  }

  // Gestione del click sulla lista delle radio
  radioList.addEventListener("click", (e) => {
    const listItem = e.target.closest("li");
    if (listItem) {
      const index = parseInt(listItem.dataset.index);
      playStation(allStations[index], index);
    }
  });

  // Gestione del click sul pulsante 'Avanti'
  nextBtn.addEventListener("click", () => {
    if (allStations.length === 0) return;
    currentIndex = (currentIndex + 1) % allStations.length;
    playStation(allStations[currentIndex], currentIndex);
  });

  // Gestione del click sul pulsante 'Indietro'
  prevBtn.addEventListener("click", () => {
    if (allStations.length === 0) return;
    currentIndex = (currentIndex - 1 + allStations.length) % allStations.length;
    playStation(allStations[currentIndex], currentIndex);
  });

  // Gestione dell'evento di cambio selezione nel menu a tendina
  jsonSelector.addEventListener("change", (e) => {
    const selectedJson = e.target.value;
    searchBar.value = "";
    loadRadioStations(selectedJson);
  });

  // Avvia il caricamento delle stazioni quando la pagina è pronta
  loadRadioStations(jsonSelector.value);
});
