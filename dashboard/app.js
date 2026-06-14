const sites = [
  {
    id: "mb0",
    name: "MB0",
  },
  {
    id: "mbwest",
    name: "MBwest",
  },
  {
    id: "575-florida",
    name: "575 Florida",
  },
  {
    id: "350-ellis",
    name: "350 Ellis",
  },
  {
    id: "564-pacific",
    name: "564 Pacific",
  },
  {
    id: "harbour-way",
    name: "Harbour Way",
  },
  {
    id: "lion",
    name: "Lion",
  },
];

const siteIconImage = "assets/fes-graphics/ui/site-icon.svg";

const modules = [
  {
    name: "Systems",
    image: "assets/fes-graphics/sidebar-with-name/systems-sidebar-with-name.svg",
    href: "http://192.168.0.6:1881",
  },
  {
    name: "Assets",
    image: "assets/fes-graphics/sidebar-with-name/assets-sidebar-with-name.svg",
  },
  {
    name: "Lighting",
    image: "assets/fes-graphics/sidebar-with-name/lighting-sidebar-with-name.svg",
  },
  {
    name: "Projects",
    image: "assets/fes-graphics/sidebar-with-name/projects-sidebar-with-name.svg",
    href: "http://192.168.0.6:8081",
  },
  {
    name: "Johnny",
    image: "assets/fes-graphics/sidebar-with-name/johny-sidebar-with-name.svg",
    href: "http://192.168.0.6:3000",
  },
  {
    name: "Weather",
    image: "assets/fes-graphics/sidebar-with-name/weather-sidebar-with-name.svg",
  },
];

const siteDirectory = document.querySelector("#siteDirectory");
const logoutButton = document.querySelector("#logoutButton");

function createModuleButton(site, module) {
  const element = module.href ? document.createElement("a") : document.createElement("button");
  element.className = "module-button";
  element.setAttribute("aria-label", `${module.name} for ${site.name}`);

  if (module.href) {
    element.href = module.href;
    element.target = "_blank";
    element.rel = "noopener noreferrer";
  } else {
    element.type = "button";
  }

  const image = document.createElement("img");
  image.src = module.image;
  image.alt = module.name;

  element.append(image);
  return element;
}

function createSiteSection(site) {
  const section = document.createElement("section");
  section.className = "site-section";
  section.id = site.id;

  const card = document.createElement("div");
  card.className = "selected-site-card";

  const siteLabel = document.createElement("div");
  siteLabel.className = "site-label";

  const siteIcon = document.createElement("span");
  siteIcon.className = "site-icon-frame";

  const siteIconArt = document.createElement("img");
  siteIconArt.className = "site-icon-art";
  siteIconArt.src = siteIconImage;
  siteIconArt.alt = "";

  const siteName = document.createElement("h2");
  siteName.textContent = site.name;

  const underline = document.createElement("span");
  underline.className = "site-name-underline";

  siteIcon.append(siteIconArt);
  siteLabel.append(siteIcon, siteName, underline);

  const grid = document.createElement("div");
  grid.className = "module-grid";
  grid.append(...modules.map((module) => createModuleButton(site, module)));

  card.append(siteLabel);
  section.append(card, grid);
  return section;
}

siteDirectory.replaceChildren(...sites.map(createSiteSection));

logoutButton.addEventListener("click", () => {
  AccessDirectory.clearSession();
  window.location.href = "../login/";
});
