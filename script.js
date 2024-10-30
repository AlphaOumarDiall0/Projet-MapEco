"use strict";

const form = document.querySelector(".form");
const exportBtn = document.querySelector("#exportBtn");
const importBtn = document.querySelector("#importBtn");

const type = document.getElementById("type");
const pointName = document.getElementById("name");
const address = document.getElementById("address");

class Point {
  constructor(type, name, address, coords) {
    this.type = type;
    this.name = name;
    this.address = address;
    this.coords = coords;
  }
}

class App {
  #map;
  #mapEvent;
  #points = [];

  constructor() {
    this._loadMap();
    this._loadLocalData();

    form.addEventListener("submit", this._newPoint.bind(this));
    exportBtn.addEventListener("click", this._exportJSON.bind(this));
    importBtn.addEventListener("change", this._importJSON.bind(this));
  }

  _loadMap() {
    this.#map = L.map("map").setView([9.945587, -9.696645], 7);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
  }

  _newPoint(e) {
    e.preventDefault();

    // Récupère les données du formulaire
    const pointType = type.value;
    console.log(pointType);
    const pointNameValue = pointName.value;
    const addressValue = address.value;
    const { lat, lng } = this.#mapEvent.latlng;

    // Création et ajout du point
    const point = new Point(pointType, pointNameValue, addressValue, [
      lat,
      lng,
    ]);
    this.#points.push(point);

    this._renderPoint(point);
    this._saveLocalData();

    form.reset();
    form.classList.add("hidden");
  }

  _renderPoint(point) {
    const iconColor =
      point.type === "agence"
        ? "var(--color-primary)"
        : "var(--color-secondary)";

    const myIcon = L.icon({
      iconUrl: "img/building-columns-solid.svg",
      iconSize: [38, 95],
      color: "#fff",
      iconAnchor: [22, 94],
      popupAnchor: [0, -50],
    });

    let iconBuilding = L.colorIcon({
      iconSize: [30, 30],
      popupAnchor: [0, -15],
      iconUrl: "img/building-columns-solid.svg",
      color: "#005a99",
    });

    let iconCash = L.colorIcon({
      iconSize: [30, 30],
      popupAnchor: [0, -15],
      iconUrl: "img/cash-outline.svg",
      color: "#fdb913",
    });

    L.marker(
      point.coords,
      //   {
      //   icon: L.divIcon({
      //     className: "custom-icon",
      //     html: `<i style="color:${iconColor};font-size:1.5em;">🏦</i>`,
      //   }),
      // }
      { icon: point.type === "agence" ? iconBuilding : iconCash }
    )
      .addTo(this.#map)
      .bindPopup(`<b>${point.name}</b><br>${point.address}`)
      .openPopup();
  }

  _saveLocalData() {
    localStorage.setItem("points", JSON.stringify(this.#points));
  }

  _loadLocalData() {
    const data = JSON.parse(localStorage.getItem("points"));
    if (!data) return;

    this.#points = data;
    this.#points.forEach((point) => this._renderPoint(point));
  }

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

  _importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const importedPoints = JSON.parse(reader.result);
      this.#points = importedPoints;
      this.#points.forEach((point) => this._renderPoint(point));
      this._saveLocalData();
    };
    reader.readAsText(file);
  }
}

const app = new App();
