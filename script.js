"use strict";
/// Recuperation des données
const form = document.querySelector(".form");
const exportBtn = document.querySelector("#exportBtn");
const importBtn = document.querySelector("#importBtn");

const type = document.getElementById("type");
const pointName = document.getElementById("name");
const address = document.getElementById("address");
const horaire = document.getElementById("horaire");
const openHour = document.getElementById("openHour");
const closeHour = document.getElementById("closeHour");
const allHour = document.querySelectorAll(".horaire")

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const mapElement = document.getElementById("map");

const pointDetails = document.getElementById("pointList");
const containerPoints = document.querySelector(".point-list");

const iconDelete = document.querySelector(".delete_icon");
const editDelete = document.querySelector(".edit_icon");

const pointEdit = document.querySelector(".point_edit");

const search = document.querySelector(".search");
const searchInput = document.querySelector(".search_input");

const searchIcon = document.querySelector(".search_icon");


menuToggle.addEventListener("click", function (e) {
  sidebar.classList.toggle("show");

  e.stopPropagation();
});


//////////// Classe Point ///////////////////
class Point {
  id = Date.now() + Math.floor(Math.random() * 100);
  constructor(type, name, address, horaire, coords) {
    this.type = type;
    this.name = name;
    this.address = address;
    this.horaire = horaire;
    this.coords = coords;
  }
}

////////////// Classe Agence qui herite la classe Point et permet de creer des agences ///////////////////
class Agency extends Point {
  type = "agency";
  services = "Ouverture de compte, prêts et crédits, epargne et placements, dépots et retraits, transfert de fonds, assurances, gestion de cartes bancaires..."
  constructor(name, address, coords, horaire) {
    super(name, address, coords);
    this.horaire = horaire
  }
}

//////////////  Classe  XpressPoint qui herite la classe Point et qui permet de creer des pointXpress//////////////////
class XpressPoint extends Point {
  type = "xpress";
  services = "Transaction de base, paiement de factures, recharge et autres services prépayés, retrait de fonds via mobile, souscription à certains produits bancaires simples..."
  constructor(name, address, coords, openHour, closeHour) {
    super(name, address, coords);
    this.openHour = openHour;
    this.closeHour = closeHour
  }

}

//////////////  Classe  GAB qui herite la classe Point et qui permet de creer des guichet automatique de billets//////////////////
class Gab extends Point {
  type = "gab";
  hours = "24h/24 et 7j/7"
  services = "Retrait d'argent via carte bancaire"
  constructor(name, address, coords) {
    super(name, address, coords);
  }
}



////////////////////// La class principale /////////////////////
class App {
  #map;
  #mapEvent;
  #points = [];
  constructor() {
    this._loadMap();
    this._loadLocalData();
    // iconDelete.addEventListener('click', function(e){
    //   e.preventDefault()
    //   console.log(e.target)
    // })

    /// Attachement de l'ecouteur d'evenement sur le formulaire
    form.addEventListener("submit", this._newPoint.bind(this));
    /// Attachement de l'ecouteur d'evenement sur le type de point
    type.addEventListener('change', function (e) {
      console.log()
      console.log('Le type a changé')
      if(type.value === "GAB"){
        allHour.forEach(hour => hour.classList.add("hidden"))
      }
      openHour
        .closest('.xpress-horaire')
        .classList.toggle('hidden');
      horaire.closest('.horaire').classList.toggle('hidden');
    });

    //// Boutons d'import et export
    exportBtn.addEventListener("click", this._exportJSON.bind(this));
    importBtn.addEventListener("change", this._importJSON.bind(this));

    /// Attachement de l'ecouteur d'evenement sur la liste
    pointDetails.addEventListener("click", (e) => {
      //// Verifie si l'element cliqué s'agit de l'icone suppression
      if (e.target.classList.contains("delete_icon")) {
        const pointElement = e.target.closest(".point");
        const pointId = Number(pointElement.getAttribute("data-id"));
        if (confirm("Voulez-vous vraiment supprimer ce point ?")) {
          pointElement.remove();
          this._deletePoint(pointId);
        }
      }

      //// Verifie si l'element cliqué s'agit de l'icone modification
      if (e.target.classList.contains("edit_icon")) {
        alert(
          "La modification est encours de developpement. Merci de patienter...!"
        );
        //   const pointElement = e.target.closest(".point");
        //   const pointId = Number(pointElement.getAttribute("data-id"));
        //   this._updatePoint(pointId);
        //   this._showForm()
        //   form.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    /// Attachement de l'ecouteur d'evenement sur la barre de recherche
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this._searchPoint();
        searchInput.value = "";
      }
    });

    /// Attachement de l'ecouteur d'evenement sur l'icon de recherche
    searchIcon.addEventListener("click", (e) => {
      e.preventDefault();
      app._searchPoint(); 
    });

    containerPoints.addEventListener("click", this._moveToPointById.bind(this));
  }

  ////// La fonction pour charger la carte
  _loadMap() {
    this.#map = L.map("map").setView([9.945587, -9.696645], 7);

    ///// Définir la vue classique (OpenStreetMap)
    const streetView = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
      }
    );

    //// Définir la vue satellitaire (Esri)
    const satelliteView = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "&copy; Esri",
      }
    );

    streetView.addTo(this.#map);

    ///// Controle de la vue(classique ou satellite)
    const viewControl = L.control
      .layers({
        "Vue Classique": streetView,
        "Vue Satellite": satelliteView,
      })
      .addTo(this.#map);

    viewControl.setPosition("bottomleft");
    this.#map.zoomControl.setPosition("bottomright");

    this.#map.on("popupopen", () => {
      sidebar.classList.remove("show");
    });

    /// Attachement de l'ecouteur d'evenement sur la carte pour detecter l'element cliqué et determiner les actions relatives
    this.#map.on("click", (e) => {

      /// verifie si l'element cliqué est un marker, une popup ou la barre de recherche
      const isMarkerClick =
        e.originalEvent.target.closest(".leaflet-marker-icon") ||
        e.originalEvent.target.closest(".leaflet-popup") ||
        e.originalEvent.target.closest(".search");

      //// si l'element n'est pas un marker, une popup ou la barre recherche, on a
      if (!isMarkerClick ) {
        this._showForm(e);
        sidebar.classList.toggle("show");
      }
      /// verifie si c'est la taille de l'ecran est < 758


      if(window.innerWidth < 758){
        search.classList.toggle("hidden");
      }
      // this._showForm.bind(this)
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  _newPoint(e) {
    e.preventDefault();

    const pointType = type.value;
    const pointNameValue = pointName.value;
    const addressValue = address.value;
    const { lat, lng } = this.#mapEvent.latlng;

    let point

    if(pointType === "agence"){
      const horaireValue = horaire.value;
      point = new Agency(
        pointType,
        pointNameValue,
        addressValue,
        horaireValue,
        services,
        [lat, lng]
      );
    }


    if(pointType === "xpress"){
      const openHour = Number(openHour.value);
      const closeHour = Number(closeHour.value);
      point = new XpressPoint(
        pointType,
        pointNameValue,
        addressValue,
        openHour,
        closeHour,
        [lat, lng]
      );
    }

    if(pointType === "gab"){
      point = new Gab(
        pointType,
        pointNameValue,
        addressValue,
        [lat, lng]
      );
    }
    
    this.#points.push(point);
    this._renderPoint(point);
    this._renderPointDetails(point);
    this._saveLocalData();

    form.reset();
    form.classList.add("hidden");
    console.log(pointEdit);
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
      iconUrl: "img/money-bill-wave-solid.svg",
      iconSize: [30, 30],
      popupAnchor: [-15, -25],
      color: "#a9e34b",
    });

    const marker = L.marker(point.coords, {
      icon: point.type === "agence" ? iconBuilding : iconCash,
    })
      .addTo(this.#map)
      .bindPopup(
        // `<b>${point.name}</b><br>${point.address}<br>${
        //   point.horaire ? point.horaire : "Horaire indisponible"
        // }`
        `
          <div class="custom-popup">
            <div class="popup-header">
              ${point.type === "agence"
                ? '<i class="fas fa-building-columns popup-icon"></i>'
                : '<i class="fas fa-money-bill-wave popup-icon"></i>'}
            </div>
            <div class="popup-content">
              <h3 class="popup-title">${point.name}</h3>
              <p class="popup-address">
                <i class="fas fa-regular fa-location-dot point__icon" style="color: #005a99;"></i>
                ${point.address}
              </p>
              <p class="popup-hours">
                <i class="fas fa-regular fa-clock point__icon" style="color: #005a99;"></i>
                ${point.horaire || "Horaire indisponible"}
              </p>
              <p class="popup-hours">
                <h4 class="service-title">Services</h4>
                ${point.services}
              </p>
            </div>
          </div>
        `, {
            className: 'custom-popup-container'
        })
      .openPopup();

    point.marker = marker;

    this.#map.on("zoomend", () => {
      const zoomLevel = this.#map.getZoom();
      if (zoomLevel < minZoomLevel) {
        this.#map.removeLayer(marker);
      } else {
        this.#map.addLayer(marker);
      }
    });
  }

  _renderPointDetails(point) {
    const colorIcon = "#a9e34b";
    const iconHtml =
      point.type === "agence"
        ? '<i class="fas fa-building-columns point__icon" style="color: #a9e34b;"></i>'
        : '<i class="fas fa-money-bill-wave point__icon" style="color: #a9e34b;"></i>';

    const html = `
      <li class="point point--${point.type}" data-id="${point.id}">
      <div class="point_infos">
        <div class="point__details">
          ${iconHtml} 
          <h2 class="point__title">${point.name}</h2>

        </div>
        <div class="point__details">
          <i class="fas fa-regular fa-location-dot point__icon" style="color: #a9e34b;"></i> 
          <span class="point__value">${point.address}</span>
        </div>
        <div class="point__details">
          <i class="fas fa-regular fa-clock point__icon" style="color: #a9e34b;"></i>
          <span class="point__value">${
            point.horaire || "Horaire indisponible"
          }</span>
        </div>
        </div>

        <div class="point_edit" data-id="${point.id}">
          <i class="fa-solid fa-pen edit_icon point__icon"></i>
          <i class="fa-solid fa-trash delete_icon point__icon"></i>
        </div>
      </li>
    `;

    pointDetails.insertAdjacentHTML("beforeend", html);
  }

  _saveLocalData() {
    const pointsData = this.#points.map((point) => {
      return {
        id: point.id,
        type: point.type,
        name: point.name,
        address: point.address,
        horaire: point.horaire,
        coords: point.coords,
      };
    });
    localStorage.setItem("points", JSON.stringify(pointsData));
    // localStorage.setItem("points", JSON.stringify(this.#points));
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

    this.#points.forEach((point) => {
      this._renderPoint(point);
      this._renderPointDetails(point);
    });
  }

  /////////////// Fonction de suppression d'un point /////////////////
  _deletePoint(pointId) {
    const index = this.#points.findIndex((point) => point.id === pointId);
    if (index === -1) return;

    const point = this.#points[index];

    // suppression du marker sur la carte
    if (point.marker) {
      this.#map.removeLayer(point.marker);
    }

    // suppression du point sur la liste
    const pointElement = document.querySelector(`.point[data-id="${pointId}"]`);
    if (pointElement) pointElement.remove();

    // Suppresssion de l'objet dans le tableau
    this.#points.splice(index, 1);

    // mise à jour du localStorage
    this._saveLocalData();
  }

  _updatePoint(pointId) {
    const index = this.#points.findIndex((point) => point.id === pointId);
    if (index === -1) return;

    const point = this.#points[index];
    console.log(point);
    type.value = point.type;
    pointName.value = point.name;
    address.value = point.address;
    horaire.value = point.horaire;
  }

  _moveToPointById(e) {
    const pointEl = e.target.closest(".point");

    if (
      !pointEl ||
      e.target.classList.contains("edit_icon") ||
      e.target.classList.contains("delete_icon")
    )
      return;

    const point = this.#points.find((point) => {
      return Number(pointEl.dataset.id) === point.id;
    });

    this.#map.setView(point.coords, 19, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _searchPoint() {
    if(!searchInput.value) {
      alert("Veuillez saisir quelque chose !")
      return
    }
    const pointNameValue = searchInput.value.trim().toLowerCase();
    const point = this.#points.find(
      (point) => point.name.trim().toLowerCase() === pointNameValue
    );

    if (point) {
      this._moveToPoint(point);
    } else {
      alert("Aucun point trouvé pour cette recherche.");
    }
  }

  _moveToPoint(point) {
    this.#map.setView(point.coords, 19, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    if (point.marker) point.marker.openPopup();
  }

  _exportJSON() {
    // if(this.#points.length < 1) return

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

      this.#points = importedPoints.map((pointData) => {
        new Point(
          pointData.type,
          pointData.name,
          pointData.address,
          pointData.horaire,
          pointData.coords
        );
      });
      this.#points.forEach((point) => {
        this._renderPoint(point);
        this._renderPointDetails(point);
      });
      this._saveLocalData();
    };
    reader.readAsText(file);
  }
}

const app = new App();
