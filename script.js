"use strict";
/// Recuperation des données
const form = document.querySelector(".form");
const exportBtn = document.querySelector("#exportBtn");
const importBtn = document.querySelector("#importBtn");

const type = document.getElementById("type");
const pointName = document.getElementById("name");
const address = document.getElementById("address");
const horaireA = document.getElementById("horaireA");
const horaireX = document.getElementById("horaireX");

const sidebar = document.getElementById("sidebar");
const mapElement = document.getElementById("map");

const pointDetails = document.getElementById("pointList");
const containerPoints = document.querySelector(".point-list");

const iconDelete = document.querySelector(".delete_icon");
const editDelete = document.querySelector(".edit_icon");
const pointEdit = document.querySelector(".point_edit");

const search = document.querySelector(".search");
const searchInput = document.querySelector(".search_input");
const messageBox = document.querySelector(".message_box");

const searchIcon = document.querySelector(".search_icon");

// menuToggle.addEventListener("click", function (e) {
//   sidebar.classList.toggle("show");
//   e.stopPropagation();
// });

//////////// Classe Point ///////////////////
class Point {
  id = Date.now() + Math.floor(Math.random() * 100);
  constructor(type, name, address, horaires, coords) {
    this.type = type;
    this.name = name;
    this.address = address;
    this.horaires = horaires;
    this.coords = coords;
  }
}

////////////// Classe Agence qui herite la classe Point et permet de creer des agences ///////////////////
class Agency extends Point {
  // type = "agence";
  services =
    "Ouverture de compte, prêts et crédits, épargne et placements, dépôts et retraits, transfert de fonds, assurances, gestion de cartes bancaires...";
  constructor(name, address, horaires, coords) {
    super("agence", name, address, horaires, coords);
  }
}

//////////////  Classe  XpressPoint qui herite la classe Point et qui permet de creer des pointXpress//////////////////
class XpressPoint extends Point {
  // type = "xpress";
  services =
    "Transaction de base, paiement de factures, recharge, retrait de fonds via mobile, souscription à certains produits bancaires simples...";
  transactionLimit = "5 000 000 GNF";
  constructor(name, address, horaires, coords) {
    // const horairess = `${openHour}h-${closeHour}h`;
    super("xpress", name, address, horaires, coords);
  }
}

////////////////////// La class principale /////////////////////
class App {
  #map;
  #mapEvent;
  #points = [];
  constructor() {
    //// Chargement de la carte
    this._loadMap();
    // this._loadPoints();
    //// Chargement des données depuis le localStorage
    this._loadLocalData();

    /// Attachement de l'ecouteur d'evenement sur le formulaire
    form.addEventListener("submit", this._newPoint.bind(this));
    /// Attachement de l'ecouteur d'evenement sur le type de point
    type.addEventListener(
      "change",
      this._showAgenceOrXpressHoursInput.bind(this)
    );

    //// Boutons d'import et export
    exportBtn.addEventListener("click", this._exportJSON.bind(this));
    importBtn.addEventListener("change", this._importJSON.bind(this));

    /// Attachement de l'ecouteur d'evenement sur la liste
    pointDetails.addEventListener(
      "click",
      this._checkClickOnSidebar.bind(this)
    );

    /// Attachement de l'ecouteur d'evenement sur la barre de recherche
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this._searchPoint();
      }
    });

    /// Attachement de l'ecouteur d'evenement sur l'icon de recherche
    searchIcon.addEventListener("click", (e) => {
      e.preventDefault();
      this._searchPoint();
    });

    containerPoints.addEventListener("click", this._moveToPointById.bind(this));
  }

  ////// La fonction pour charger la carte
  _loadMap() {
    this.#map = L.map("map").setView([9.945587, -9.696645], 7);

    this._showFeedBackMessage('Bienvenue sur notre application MAP-ECO 😊', 'success', 5000);

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

      //// si l'element n'est pas un marker, une popup ou la barre recherche, on affiche la sidebar et le formulaire
      if (!isMarkerClick) {
        this._showForm(e);
        sidebar.classList.toggle("show");
      }
      /// verifie si c'est la taille de l'ecran est < 758
      // if (window.innerWidth < 768) {
      //   search.classList.toggle("hidden");
      // }
    });

  }

  ////////////// La fonction qui permet d'afficher le formulaire //////////
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /////// Fonction pour afficher et masquer la boîte de message ///////////////
  _showFeedBackMessage(message, type = "success", duration = 3000) {
    messageBox.textContent = message;
    messageBox.classList.remove("success", "error");
    messageBox.classList.add(type);
    messageBox.classList.add("active");
    setTimeout(() => {
      messageBox.classList.remove("active");
    }, duration);
  }

  //////////////// La fonction qui permet d'ajouter un point //////////
  _newPoint(e) {
    e.preventDefault();

    /// Recuperation des données du formulaire
    const pointType = type.value;
    const pointNameValue = pointName.value;
    const addressValue = address.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let point;
    /// Verifie si le type est une agence, crée une instance de la classe Agency
    if (pointType === "agence") {
      const horaireValue = horaireA.value;
      point = new Agency(
        pointNameValue || "",
        addressValue || "",
        horaireValue || "",
        [lat, lng] || []
      );
    }

    /// Verifie si le type est une xpress, crée une instance de la classe XpressPoint
    if (pointType === "xpress") {
      const horaireValue = horaireX.value;
      point = new XpressPoint(pointNameValue, addressValue, horaireValue, [
        lat,
        lng,
      ]);
    }


    ////// Selon l'instance créée, on l'ajoute dans le tableau, l'affiche sur la carte, l'affiche sur  la liste et l'enregistre dans le localStorage
    this.#points.push(point);
    this._renderPoint(point);
    this._renderPointDetails(point);
    this._saveLocalData();
    this._showFeedBackMessage('Point ajouté avec succès !!!', 'success', 3000)

    /// Reinitialise le formulaire et le masque
    form.reset();
    form.classList.add("hidden");
  }

  ////////////// La fonction qui permet d'afficher le marker sur la carte /////////
  _renderPoint(point) {
    const minZoomLevel = 7;
    //// On se sert de colorIcon pour créer un marker de personalisé
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

    /// Affichage du marker en fonction du type
    const marker = L.marker(point.coords, {
      icon: point.type === "agence" ? iconBuilding : iconCash,
    })
      .addTo(this.#map)
      .bindPopup(
        ///// Personnalisation de la popup
        `
          <div class="custom-popup">
            <div class="popup-header">
              ${
                point.type === "agence"
                  ? '<i class="fas fa-building-columns popup-icon"></i>'
                  : '<i class="fas fa-money-bill-wave popup-icon"></i>'
              }
            </div>
            <div class="popup-content">
              <h3 class="popup-title">${point.name}</h3>
              <p class="popup-address">
                <i class="fas fa-regular fa-location-dot point__icon" style="color: #005a99;"></i>
                ${point.address}
              </p>
              <p class="popup-hours">
                <i class="fas fa-regular fa-clock point__icon" style="color: #005a99;"></i>
                ${point.horaires || "Horaire indisponible"}
              </p>
              <p class="popup-hours">
                <h4 class="service-title">Services</h4>
                <span class="popup-hours">${point.services}</span>
              </p>
            </div>
          </div>
        `,
        {
          className: "custom-popup-container",
        }
      );

    point.marker = marker;

    /// Attachement de l'ecouteur d'evenement sur la carte pour detecter le niveau de zoom pour afficher ou masquer les marker
    this.#map.on("zoomend", () => {
      const zoomLevel = this.#map.getZoom();
      if (zoomLevel < minZoomLevel) {
        this.#map.removeLayer(marker);
      } else {
        this.#map.addLayer(marker);
      }
    });
  }

  ///// La fonction qui permet d'afficher les detail d'un point sur la sidebar
  _renderPointDetails(point) {
    const colorIcon = "#005a99";
    const iconHtml =
      point.type === "agence"
        ? `<i class="fas fa-building-columns point__icon" style="color: ${colorIcon};"></i>`
        : `<i class="fas fa-money-bill-wave point__icon" style="color: ${colorIcon};"></i>`;

    const html = `
      <li class="point point--${point.type}" data-id="${point.id}">
        <div class="point_infos">
          <div class="point__details">
            ${iconHtml} 
            <h2 class="point__title">${point.name}</h2>
          </div>
        <div class="point__details">
          <i class="fas fa-regular fa-location-dot point__icon" style="color: ${colorIcon}"></i> 
          <span class="point__value">${point.address}</span>
        </div>
        <div class="point__details">
          <i class="fas fa-regular fa-clock point__icon" style="color: ${colorIcon};"></i>
          <span class="point__value">${
            point.horaires || "Horaire indisponible"
          }</span>
        </div>
        ${
          point.type === "agence"
            ? ""
            : `<i class="fas fa-regular fa-hand point__icon" style="color: ${colorIcon};"></i>
               <span class="point__value">${
                 point.transactionLimit || "Limites non définies"
               }</span>`
        }
        </div>

        <div class="point_edit" data-id="${point.id}">
          <i class="fa-solid fa-pen edit_icon point__icon"></i>
          <i class="fa-solid fa-trash delete_icon point__icon"></i>
        </div>
      </li>
    `;
    pointDetails.insertAdjacentHTML("beforeend", html);
  }

  ////////////// Cette fonction permet de verifier l'endroit cliqué sur la sidebar////
  _checkClickOnSidebar(e) {
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
      this._showFeedBackMessage(
        "La modification est encours de developpement. Merci de patienter...!",
        "error",
        3000
      );
      //   const pointElement = e.target.closest(".point");
      //   const pointId = Number(pointElement.getAttribute("data-id"));
      //   this._updatePoint(pointId);
      //   this._showForm()
      //   form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  ////////////// Cette fonction permet d'afficher l'input des horaires en fonction du type de point ////
  _showAgenceOrXpressHoursInput() {
    if (type.value === "agence") {
      horaireA.parentElement.classList.remove("hidden");
      horaireX.parentElement.classList.add("hidden");
    }

    if (type.value === "xpress") {
      horaireA.parentElement.classList.add("hidden");
      horaireX.parentElement.classList.remove("hidden");
    }
  }
  ////////////// Cette fonction permet de rechercher un point ////
  _searchPoint() {
    if (!searchInput.value) {
      this._showFeedBackMessage('Veuillez saisir quelque chose !', 'error', 3000)
      return;
    }

    //// Recupère la saisie et supprime les espaces à travers la methode trim()
    const pointNameValue = searchInput.value.trim().toLowerCase();
    //// cherche un point à travers son nom et le stock dans la variable point
    const point = this.#points.find(
      (point) => point.name.trim().toLowerCase() === pointNameValue
    );

    /// Si le point est trouvé, on appelle la methode _moveToPoint(point) sinon on affiche un message
    if (point) {
      this._moveToPoint(point);
    } else {
      this._showFeedBackMessage('Aucun point trouvé pour cette recherche.', 'error', 3000);
    }
    searchInput.value = "";
  }

  /////////////// Fonction de suppression d'un point /////////////////
  _deletePoint(pointId) {
    //// cherche l'index du point à supprimer par son id
    const index = this.#points.findIndex((point) => point.id === pointId);
    if (index === -1) return;

    const point = this.#points[index];

    //// suppression du marker sur la carte
    if (point.marker) {
      this.#map.removeLayer(point.marker);
    }

    //// suppression du point sur la liste
    const pointElement = document.querySelector(`.point[data-id="${pointId}"]`);
    if (pointElement) pointElement.remove();

    ///// Suppresssion de l'objet dans le tableau
    this.#points.splice(index, 1);

    //////////// Feedback 
    this._showFeedBackMessage('Point supprimé avec avec succès !!!', 'success', 3000);
    ///// mise à jour du localStorage
    this._saveLocalData();
  }

  /////////// La fonction qui permet de modifier un point donné ////
  _updatePoint(pointId) {
    const index = this.#points.findIndex((point) => point.id === pointId);
    if (index === -1) return;

    const point = this.#points[index];
    type.value = point.type;
    pointName.value = point.name;
    address.value = point.address;
    horaire.value = point.horaire;

    this._showFeedBackMessage('Modifications effectuées avec succès !!!', 'success', 3000)
  }

  ///// Cette fonction zoom sur un point cliqué sur la sidebar, conçu specialement pour les elements de la sidebar
  _moveToPointById(e) {
    const pointEl = e.target.closest(".point");
    ////  verifie si le click s'effectue sur un element de la liste sur la sidebar et ne contient pas  les classes edit_icon et delete_icon
    if (
      !pointEl ||
      e.target.classList.contains("edit_icon") ||
      e.target.classList.contains("delete_icon")
    )
      return;

    const point = this.#points.find((point) => {
      return Number(pointEl.dataset.id) === point.id;
    });

    ///// On zoom sur le point
    this.#map.setView(point.coords, 18, {
      animate: true,
      pan: {
        duration: 2,
      },
    });
  }

  ///// Cette fonction zoom sur un point recherché  si toutefois le point existe, conçu specialement pour la  recherche ///////////////
  _moveToPoint(point) {
    this.#map.setView(point.coords, 18, {
      animate: true,
      pan: {
        duration: 2,
      },
    });

    if (point.marker) point.marker.openPopup();
  }

  ///// La fonction qui permet d'ajouter les points dans le localStorage
  _saveLocalData() {
    const pointsData = this.#points.map((point) => ({
      id: point.id,
      type: point.type,
      name: point.name,
      address: point.address,
      horaires: point.horaires,
      coords: point.coords,
      services: point.services,
      transactionLimit: point.transactionLimit || "Limites non definies",
    }));
    localStorage.setItem("points", JSON.stringify(pointsData));
    console.log(this.#points);
  }

  /////// La fonction qui permet de recuperer les points dans le localStorage pour les afficher sur la carte et sur la sidebar
  _loadLocalData() {
    const data = JSON.parse(localStorage.getItem("points"));
    if (!data) return;

    this.#points = data;
    this.#points.forEach((point) => {
      this._renderPoint(point);
      this._renderPointDetails(point);
    });
  }

  //// Ajout d'une fonction pour obtenir une version sans référence circulaire des points
  _getPointsWithoutMarker() {
    console.log(this.#points);
    return this.#points.map((point) => ({
      type: point.type,
      name: point.name,
      address: point.address,
      horaires: point.horaires,
      coords: point.coords,
    }));
  }

  ///////// La fonction qui permet de charger les données des le chargement de la page //////////////
  _loadPoints() {
    fetch("files/importExportTestFile.json")
      .then((response) => response.json())
      .then((data) => {
        this.#points = data;
        this.#points.forEach((point) => {
          this._renderPoint(point);
          this._renderPointDetails(point);
          this._saveLocalData();
        });
        console.log(this.#points);
      })
      .catch((error) =>
        this._showFeedBackMessage(`Une erreur s'est produit lors du chargement ${error}`, 'error', 3000)
      );
  }

  ///////// La fonction qui permet de d'exporter les points qui existent en format json //////////////
  _exportJSON() {
    if (this.#points.length === 0) {
      this._showFeedBackMessage('Aucun point à exporter.', 'error', 3000);
      return;
    }

    const dataStr = JSON.stringify(this._getPointsWithoutMarker()); // Utilisation de la fonction
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "points.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this._showFeedBackMessage('Exportation effectué avec succès', 'success', 3000)
  }
  /////////// La fonction qui permet de d'importer un fichier json qui contient des points et les ajoute dans le localStorage, sur la carte et sur la sidebar
  //////////////
  _importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const importedPoints = JSON.parse(reader.result);
      let point;
      importedPoints.forEach((pointData) => {
        if (pointData.type === "agence") {
          point = new Agency(
            pointData.name || "",
            pointData.address || "",
            pointData.horaires || "",
            pointData.coords || []
          );
        }

        if (pointData.type === "xpress") {
          // const {openHour, closeHour} = pointData.horaires.split("-");
          point = new XpressPoint(
            pointData.name || "",
            pointData.address || "",
            pointData.horaires || "",
            pointData.coords || []
          );
        }

        this.#points.push(point);
        this._renderPoint(point);
        this._renderPointDetails(point);
        this.#points.forEach((point) => console.log("import", point));
      });
      this._saveLocalData();
    };
    reader.readAsText(file);
    this._showFeedBackMessage('Importation effectuée avec succès !!!', 'success', 3000)
  }
}

const app = new App();
