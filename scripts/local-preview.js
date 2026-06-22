(function () {
  const productionOrigin = "https://home.facilities-engineering.com";
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

  function isLocalPreview() {
    return window.location.protocol === "file:" || localHosts.has(window.location.hostname);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[character]));
  }

  function getLocalPathname() {
    if (window.location.protocol !== "file:") {
      return window.location.pathname || "/";
    }

    const filePath = decodeURIComponent(window.location.pathname || "");
    const marker = "/Unify Network/";
    const markerIndex = filePath.indexOf(marker);
    if (markerIndex < 0) {
      return "/";
    }

    const relativePath = filePath
      .slice(markerIndex + marker.length)
      .replace(/index\.html$/, "");

    return `/${relativePath}` || "/";
  }

  function getProductionUrl() {
    return `${productionOrigin}${getLocalPathname()}`;
  }

  function installStyles() {
    if (document.querySelector("style[data-local-preview-styles]")) {
      return;
    }

    const styles = document.createElement("style");
    styles.dataset.localPreviewStyles = "true";
    styles.textContent = `
      .local-preview-banner {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 2147483000;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        width: min(560px, calc(100vw - 32px));
        border: 1px solid rgb(255 255 255 / 16%);
        border-radius: 8px;
        background: rgb(17 24 39 / 94%);
        box-shadow: 0 18px 45px rgb(0 0 0 / 24%);
        color: #ffffff;
        font-family: Arial, Helvetica, sans-serif;
        padding: 12px;
      }

      .local-preview-banner strong {
        display: block;
        font-size: 0.86rem;
        line-height: 1.2;
        margin-bottom: 2px;
      }

      .local-preview-banner span {
        color: rgb(255 255 255 / 78%);
        display: block;
        font-size: 0.78rem;
        line-height: 1.35;
      }

      .local-preview-banner a {
        border: 1px solid rgb(255 255 255 / 22%);
        border-radius: 6px;
        color: #ffffff;
        flex: 0 0 auto;
        font-size: 0.78rem;
        font-weight: 800;
        padding: 0.5rem 0.62rem;
        text-decoration: none;
        white-space: nowrap;
      }

      .local-preview-banner a:hover,
      .local-preview-banner a:focus {
        background: rgb(255 255 255 / 12%);
        outline: none;
      }

      @media (max-width: 640px) {
        .local-preview-banner {
          grid-template-columns: 1fr;
          right: 10px;
          bottom: 10px;
          width: calc(100vw - 20px);
        }

        .local-preview-banner a {
          justify-self: start;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  function renderBanner() {
    if (!isLocalPreview() || document.querySelector("[data-local-preview-banner]")) {
      return;
    }

    installStyles();

    const productionUrl = getProductionUrl();
    const locationLabel = window.location.protocol === "file:" ? "a local file" : window.location.host;
    const banner = document.createElement("aside");
    banner.className = "local-preview-banner";
    banner.dataset.localPreviewBanner = "true";
    banner.setAttribute("aria-label", "Local preview status");
    banner.innerHTML = `
      <div>
        <strong>Local preview</strong>
        <span>
          Viewing ${escapeHtml(locationLabel)}. Production uses
          home.facilities-engineering.com and may need a company policy exemption.
        </span>
      </div>
      <a href="${escapeHtml(productionUrl)}" target="_blank" rel="noopener noreferrer">
        Open Production
      </a>
    `;

    document.body.appendChild(banner);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderBanner);
  } else {
    renderBanner();
  }
}());
