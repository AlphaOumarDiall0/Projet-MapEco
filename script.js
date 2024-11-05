"use strict";

const form = document.querySelector(".form");
const exportBtn = document.querySelector("#exportBtn");
const importBtn = document.querySelector("#importBtn");

const type = document.getElementById("type");
const pointName = document.getElementById("name");
const address = document.getElementById("address");
const horaire = document.getElementById("horaire");

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const mapElement = document.getElementById("map");

menuToggle.addEventListener("click", function (e) {
  sidebar.classList.toggle("show");
  e.stopPropagation();
});

// mapElement.addEventListener("click", function () {
//   sidebar.classList.toggle("show");
// });

class Point {
  constructor(type, name, address, horaire, coords) {
    this.type = type;
    this.name = name;
    this.address = address;
    this.horaire = horaire;
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

    // this.#map.on("click", this._showForm.bind(this));

    this.#map.on("popupopen", () => {
      sidebar.classList.remove("show");
    });

    this.#map.on("click", (e) => {
      console.log(e.originalEvent);
      console.log(e.originalEvent.target);
      const isMarkerClick =
        e.originalEvent.target.closest(".leaflet-marker-icon") ||
        e.originalEvent.target.closest(".leaflet-popup");

      // if (isMarkerClick){
      //   console.log('marqueur ou popup cliqué')
      //   sidebar.classList.remove("show")
      // }

      if (!isMarkerClick) {
        this._showForm(e);
        sidebar.classList.toggle("show");
      }
      // this._showForm.bind(this)
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
  }

  _newPoint(e) {
    e.preventDefault();

    const pointType = type.value;
    const pointNameValue = pointName.value;
    const addressValue = address.value;
    const horaireValue = horaire.value;
    const { lat, lng } = this.#mapEvent.latlng;

    const point = new Point(
      pointType,
      pointNameValue,
      addressValue,
      horaireValue,
      [lat, lng]
    );

    this.#points.push(point);
    this._renderPoint(point);
    this._saveLocalData();

    form.reset();
    form.classList.add("hidden");
  }

  _renderPoint(point) {
    const minZoomLevel = 7;

    const iconBuilding = L.colorIcon({
      iconUrl: "img/building-columns-solid.svg",
      iconSize: [30, 30],
      popupAnchor: [-15, -25],
      color: "#005a99",
    });

    const iconCash = L.colorIcon({
      iconUrl: "img/cash-outline.svg",
      iconSize: [30, 30],
      popupAnchor: [-15, -25],
      color: "#a9e34b",
    });

    const marker = L.marker(point.coords, {
      icon: point.type === "agence" ? iconBuilding : iconCash,
    })
      .addTo(this.#map)
      .bindPopup(`<b>${point.name}</b><br>${point.address}`)
      .openPopup();

    this.#map.on("zoomend", () => {
      const zoomLevel = this.#map.getZoom();
      if (zoomLevel < minZoomLevel) {
        this.#map.removeLayer(marker);
      } else {
        this.#map.addLayer(marker);
      }
    });
  }

  _saveLocalData() {
    localStorage.setItem("points", JSON.stringify(this.#points));
  }

  _loadLocalData() {
    const data = JSON.parse(localStorage.getItem("points"));
    if (!data) return;

    this.#points = data.map(
      (pointData) =>
        new Point(
          pointData.type,
          pointData.name,
          pointData.address,
          pointData.horaire,
          pointData.coords
        )
    );

    this.#points.forEach((point) => this._renderPoint(point));
  }

  _exportJSON() {
    const dataStr = JSON.stringify(this.#points, null, 2);
    const blob = new Blob([dataStr], { type: "sama/json" });
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
      this.#points = importedPoints.map(
        (pointData) =>
          new Point(
            pointData.type,
            pointData.name,
            pointData.address,
            pointData.coords
          )
      );
      this.#points.forEach((point) => this._renderPoint(point));
      this._saveLocalData();
    };
    reader.readAsText(file);
  }
}

const app = new App();
