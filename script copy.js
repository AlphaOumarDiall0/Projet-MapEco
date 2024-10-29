"use strict";

// Sélection des éléments du DOM
const form = document.querySelector(".form");
const exportBtn = document.querySelector("#exportBtn");
const importBtn = document.querySelector("#importBtn");

const type = document.getElementById("type");
const pointName = document.getElementById("name");
const address = document.getElementById("address");

// Classe de base pour les points
class Point {
  constructor(name, address, coords) {
    this.name = name;
    this.address = address;
    this.coords = coords;
  }
}

// Classe pour les agences
class Agency extends Point {
  type = "agency";
  constructor(name, address, coords) {
    super(name, address, coords);
  }
}

// Classe pour les points Xpress
class XpressPoint extends Point {
  type = "xpress";
  constructor(name, address, coords) {
    super(name, address, coords);
  }
}

// Classe principale pour l'application
class App {
  #map;
  #mapEvent;
  #points = [];

  constructor() {
    this._getPosition(); // Démarre en obtenant la position de l'utilisateur
    this._loadLocalData();

    form.addEventListener("submit", this._newPoint.bind(this));
    exportBtn.addEventListener("click", this._exportJSON.bind(this));
    importBtn.addEventListener("change", this._importJSON.bind(this));
  }

  // Obtenir la position de l'utilisateur pour centrer la carte
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Impossible de récupérer votre position");
        }
      );
    } 
  }

  // Charger la carte centrée sur la position de l'utilisateur
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map("map").setView([9.945587, -9.696645], 7); // Centrée sur la position de l'utilisateur

    L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(this.#map);

    // Afficher le formulaire au clic sur la carte
    this.#map.on("click", this._showForm.bind(this));
  }

  // Afficher le formulaire d'ajout de point
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
  }

  // Ajouter un nouveau point
  _newPoint(e) {
    e.preventDefault();

    // Récupère les données du formulaire
    const pointType = type.value;
    const pointNameValue = pointName.value;
    const addressValue = address.value;
    const { lat, lng } = this.#mapEvent.latlng;

    // Crée le point en fonction du type sélectionné
    let point;
    if (pointType === "agency") {
      point = new Agency(pointNameValue, addressValue, [lat, lng]);
    } else if (pointType === "xpress") {
      point = new XpressPoint(pointNameValue, addressValue, [lat, lng]);
    }

    this.#points.push(point);
    this._renderPoint(point);
    this._saveLocalData();

    form.reset();
    form.classList.add("hidden");
  }

  // Afficher un point sur la carte
  _renderPoint(point) {
    const iconColor =
      point.type === "agency" ? "var(--color-primary)" : "var(--color-secondary)";

    L.marker(point.coords, {
      icon: L.divIcon({
        className: "custom-icon",
        html: `<i style="color:${iconColor};font-size:1.5em;">🏦</i>`,
      }),
    })
      .addTo(this.#map)
      .bindPopup(`<b>${point.name}</b><br>${point.address}`)
      .openPopup();
  }

  // Sauvegarder les points dans localStorage
  _saveLocalData() {
    localStorage.setItem("points", JSON.stringify(this.#points));
  }

  // Charger les points depuis le localStorage
  _loadLocalData() {
    const data = JSON.parse(localStorage.getItem("points"));
    if (!data) return;

    this.#points = data.map(pointData => {
      if (pointData.type === "agency") {
        return new Agency(pointData.name, pointData.address, pointData.coords);
      }
      
      if (pointData.type === "xpress") {
        return new XpressPoint(pointData.name, pointData.address, pointData.coords);
      }
    });

    this.#points.forEach(point => this._renderPoint(point));
  }

  // Exporter les points en JSON
  _exportJSON() {
    const dataStr = JSON.stringify(this.#points, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "points.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Importer les points depuis un fichier JSON
  _importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const importedData = JSON.parse(reader.result);
      this.#points = importedData.map(pointData => {
        if (pointData.type === "agency") {
          return new Agency(pointData.name, pointData.address, pointData.coords);
        }
        
        if (pointData.type === "xpress") {
          return new XpressPoint(pointData.name, pointData.address, pointData.coords);
        }
      });
      
      this.#points.forEach(point => this._renderPoint(point));
      this._saveLocalData();
    };
    reader.readAsText(file);
  }
}

const app = new App();
