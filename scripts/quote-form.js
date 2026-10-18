// The shareable address-first quote wizard. Only the current step is mounted, so
// hidden fields never block validation. The server owns route classification,
// gas pricing, photo ownership, CRM writes, and whether a quote is sent.
import { copy } from "./quote-copy.js";
import { readQuoteResponse } from "./quote-response.js";
import { prepareQuotePhotos } from "./quote-photos.js";
const form = document.querySelector("#quote-form");
const content = document.querySelector("#quote-step");
const nextButton = document.querySelector("#quote-next");
const backButton = document.querySelector("#quote-back");
const message = document.querySelector("#quote-message");
const storageKey = "splendid_quote_draft_v2";
const sizes = {
  studio: "studio",
  "1-bedroom": "one",
  "2-bedroom": "two",
  "3-bedroom": "three",
  "4-bedroom": "four",
  "office-small": "smallOffice",
  "office-medium": "mediumOffice",
  "office-large": "largeOffice",
};
const state = {
  data: {
    requestId: crypto.randomUUID(),
    pickupZip: "",
    dropoffZip: "",
    moveSize: "",
    moveDate: "",
    addressFromFull: "",
    addressToFull: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    inventory: "",
    accessDetails: "",
    additionalDetails: "",
  },
  current: "route",
  route: { classification: "unknown" },
  inventoryMode: "photos",
  files: [],
  preparedPhotos: null,
  busy: false,
  complete: false,
};
try {
  const saved = JSON.parse(sessionStorage.getItem(storageKey));
  if (saved && Date.now() - saved.savedAt < 1800000) {
    Object.assign(state.data, saved.data);
    state.current = saved.current || "route";
    state.route = saved.route || state.route;
    state.inventoryMode = saved.inventoryMode || "photos";
  }
} catch {}
let language = "en";
try {
  language = window.splendidI18n?.getLang() || "en";
} catch {}
const t = (key) => (copy[language] ?? copy.en)[key] ?? copy.en[key] ?? key;
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const persist = () => {
  try {
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        data: {
          ...state.data,
          photos: undefined,
        },
        current: state.current,
        route: state.route,
        inventoryMode: state.inventoryMode,
        savedAt: Date.now(),
      }),
    );
  } catch {}
};
const steps = () => [
  "route",
  "size",
  "date",
  ...(state.route.classification === "long-distance"
    ? ["inventory", "access"]
    : []),
  "first",
  "last",
  "phone",
  "email",
  "details",
  "review",
];
const error = (text) => {
  message.textContent = text;
  message.classList.toggle("has-error", Boolean(text));
};
const input = (
  name,
  label,
  {
    type = "text",
    placeholder = "",
    autocomplete = "",
    required = true,
    extra = "",
  } = {},
) =>
  `<div class="wizard-field"><label for="${name}">${t(label)}</label><input id="${name}" name="${name}" type="${type}" value="${escape(state.data[name])}" placeholder="${escape(placeholder)}" ${autocomplete ? `autocomplete="${autocomplete}"` : ""} ${required ? "required" : ""} ${extra}></div>`;
const textarea = (name, label, placeholder = "") =>
  `<div class="wizard-field"><label for="${name}">${t(label)}</label><textarea id="${name}" name="${name}" maxlength="10000" rows="5" placeholder="${escape(placeholder)}">${escape(state.data[name])}</textarea></div>`;
const heading = (title, intro) =>
  `<h1 id="step-title" tabindex="-1">${t(title)}</h1>${intro ? `<p class="wizard-intro">${t(intro)}</p>` : ""}`;
const routeNote = () =>
  state.route.classification === "long-distance"
    ? t("longNote")
    : state.route.classification === "local"
      ? t("localNote")
      : t("unknownNote");
function reviewRow(label, value, step) {
  return `<div class="review-row"><div><dt>${t(label)}</dt><dd>${escape(value).replaceAll("\n", "<br>")}</dd></div><button type="button" data-edit="${step}" aria-label="${t("edit")} ${t(label)}">${t("edit")}</button></div>`;
}
const previewURLs = new Map();
function releasePreview(file) {
  const url = previewURLs.get(file);
  if (url) URL.revokeObjectURL(url);
  previewURLs.delete(file);
}
function photoTile(file, index) {
  if (!previewURLs.has(file)) previewURLs.set(file, URL.createObjectURL(file));
  const source = state.preparedPhotos?.[index]
    ? `data:image/jpeg;base64,${state.preparedPhotos[index].content}`
    : previewURLs.get(file);
  const heic =
    /\.hei[cf]$/i.test(file.name) || /image\/hei[cf]/.test(file.type);
  return `<figure class="photo-tile">${heic && !state.preparedPhotos ? `<div class="photo-format">HEIC</div>` : `<img src="${source}" alt="${t("photoAlt")} ${index + 1}" loading="lazy">`}<button type="button" class="photo-remove" ${state.busy ? "disabled" : ""} data-remove-photo="${index}" aria-label="${t("removePhoto")} ${index + 1}"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m4 4 8 8M12 4l-8 8"/></svg></button><figcaption title="${escape(file.name)}">${escape(file.name)}</figcaption></figure>`;
}
content.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-remove-photo]");
  if (!button || state.busy) return;
  const index = Number(button.dataset.removePhoto);
  releasePreview(state.files[index]);
  state.files.splice(index, 1);
  state.preparedPhotos = null;
  await prepareSelection();
});
const manualFields = new Set();
function addressField(side) {
  const name = side === "from" ? "addressFromFull" : "addressToFull";
  const label = t(side === "from" ? "fromLabel" : "toLabel");
  if (state.data[name])
    return `<div class="wizard-field" data-address-slot="${side}"><label>${label}</label><div class="selected-address"><span>${escape(state.data[name])}</span><button type="button" data-change-address="${side}">${t("changeAddress")}</button></div></div>`;
  if (window.splendidPlacesUnavailable || manualFields.has(side))
    return input(name, side === "from" ? "fromLabel" : "toLabel", {
      placeholder: t("addressPlaceholder"),
      autocomplete: `section-${side} street-address`,
      extra: 'maxlength="500"',
    });
  return `<div class="wizard-field" data-address-slot="${side}"><label for="address-${side}">${label}</label><gmp-place-autocomplete id="address-${side}" aria-label="${label}" placeholder="${escape(t("addressPlaceholder"))}"></gmp-place-autocomplete><button class="manual-address-link" type="button" data-manual-address="${side}">${t("manualAddress")}</button></div>`;
}
function attachAddresses() {
  if (state.current !== "route" || !window.splendidPlacesReady) return;
  for (const side of ["from", "to"]) {
    const element = content.querySelector(`#address-${side}`);
    if (!element) continue;
    element.includedRegionCodes = ["us"];
    let selection = 0;
    element.addEventListener("gmp-select", async ({ placePrediction }) => {
      const current = ++selection;
      try {
        const place = placePrediction.toPlace();
        await place.fetchFields({
          fields: ["formattedAddress", "addressComponents"],
        });
        if (!element.isConnected || current !== selection) return;
        if (!place.formattedAddress) throw Error("missing address");
        const name = side === "from" ? "addressFromFull" : "addressToFull";
        state.data[name] = place.formattedAddress;
        state.data[side === "from" ? "pickupZip" : "dropoffZip"] = (
          place.addressComponents?.find((part) =>
            part.types.includes("postal_code"),
          )?.longText ?? ""
        ).slice(0, 5);
        state.route = { classification: "unknown" };
        persist();
        error("");
        element.closest("[data-address-slot]").outerHTML = addressField(side);
      } catch {
        if (element.isConnected) {
          manualFields.add(side);
          await render();
          error(t("addressLookupFailed"));
        }
      }
    });
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter") event.preventDefault();
    });
  }
}
window.addEventListener("splendid:places", () => {
  if (state.current === "route" && !state.busy) render();
});
// If the Maps script is blocked, customers can still enter an address manually.
setTimeout(() => {
  if (!window.splendidPlacesReady && !window.splendidPlacesUnavailable) {
    window.splendidPlacesUnavailable = true;
    if (state.current === "route" && !state.busy) render();
  }
}, 8000);
function markup() {
  const d = state.data;
  switch (state.current) {
    case "route":
      return (
        heading("routeTitle", "routeIntro") +
        `<div class="address-fields">${addressField("from")}${addressField("to")}</div><p class="wizard-hint">${t("selectAddress")}</p>`
      );
    case "size":
      return (
        heading("sizeTitle", "sizeIntro") +
        `<div class="size-choices" role="radiogroup" aria-labelledby="step-title">${Object.entries(
          sizes,
        )
          .map(
            ([value, label]) =>
              `<label class="size-choice"><input type="radio" name="moveSize" value="${value}" ${d.moveSize === value ? "checked" : ""} required><span>${t(label)}</span></label>`,
          )
          .join("")}</div>`
      );
    case "date":
      return (
        heading("dateTitle", "dateIntro") +
        input("moveDate", "dateLabel", { type: "date", required: false })
      );
    case "inventory":
      return (
        heading("inventoryTitle", "inventoryIntro") +
        `<div class="inventory-modes" role="group" aria-label="${t("inventory")}"><button type="button" data-mode="photos" aria-pressed="${state.inventoryMode === "photos"}"><strong>${t("photos")}</strong><span class="recommended">${t("recommended")}</span><small>${t("photosWhy")}</small></button><button type="button" data-mode="list" aria-pressed="${state.inventoryMode === "list"}"><strong>${t("list")}</strong><small>${t("listWhy")}</small></button></div>` +
        (state.inventoryMode === "photos"
          ? `<div class="photo-upload"><label for="inventory-photos" class="photo-picker"><svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16v16H4zM4 16l5-5 5 5 3-3 3 3"/><circle cx="16" cy="8" r="1.5"/></svg><span>${t(state.files.length ? "addPhotos" : "choosePhotos")}</span><input id="inventory-photos" type="file" ${state.busy ? "disabled" : ""} accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" multiple></label><p class="wizard-hint">${t("photoHint")}</p><div class="photo-grid">${state.files.map((file, index) => photoTile(file, index)).join("")}</div>${state.preparedPhotos ? `<p class="upload-done">${t("uploaded")}</p>` : ""}<p class="photo-privacy">${t("photoPrivacy")}</p></div>`
          : textarea("inventory", "inventoryLabel", t("inventoryPlaceholder")))
      );
    case "access":
      return (
        heading("accessTitle", "accessIntro") +
        textarea("accessDetails", "accessLabel")
      );
    case "first":
      return (
        heading("firstTitle") +
        input("firstName", "firstLabel", {
          autocomplete: "given-name",
          extra: 'maxlength="100"',
        })
      );
    case "last":
      return (
        heading("lastTitle") +
        input("lastName", "lastLabel", {
          autocomplete: "family-name",
          extra: 'maxlength="100"',
        })
      );
    case "phone":
      return (
        heading("phoneTitle", "phoneIntro") +
        input("phone", "phoneLabel", {
          type: "tel",
          autocomplete: "tel",
          placeholder: "(818) 555-0123",
          extra: 'maxlength="25"',
        })
      );
    case "email":
      return (
        heading("emailTitle", "emailIntro") +
        input("email", "emailLabel", {
          type: "email",
          autocomplete: "email",
          placeholder: "you@example.com",
          extra: 'maxlength="150"',
        })
      );
    case "details":
      return (
        heading("detailsTitle", "detailsIntro") +
        textarea("additionalDetails", "detailsLabel")
      );
    case "review":
      return (
        heading("reviewTitle", "reviewIntro") +
        `<dl class="review-details">${reviewRow("addresses", `${d.addressFromFull}\n${d.addressToFull}`, "route")}${reviewRow("moveSize", t(sizes[d.moveSize]), "size")}${reviewRow("date", d.moveDate || t("flexible"), "date")}${reviewRow("contact", `${d.firstName} ${d.lastName}\n${d.phone}\n${d.email}`, "first")}${state.route.classification === "long-distance" ? reviewRow("inventory", state.preparedPhotos ? `${state.files.length} ${t("photoCount")}` : d.inventory, "inventory") : ""}</dl><p class="quote-expectation">${routeNote()}</p>`
      );
    default:
      state.current = "route";
      return markup();
  }
}
function updateButtons() {
  const list = steps();
  const index = Math.max(0, list.indexOf(state.current));
  backButton.hidden = index === 0;
  backButton.disabled = state.busy;
  nextButton.disabled = state.busy;
  nextButton.textContent = state.busy
    ? t("working")
    : state.current === "review"
      ? t("send")
      : t("next");
  document.querySelector("#quote-progress-label").textContent =
    `${t("step")} ${index + 1} ${t("of")} ${list.length}`;
  const progress = document.querySelector("#quote-progress");
  progress.setAttribute(
    "aria-valuenow",
    String(Math.round(((index + 1) / list.length) * 100)),
  );
  progress.style.setProperty(
    "--progress",
    `${((index + 1) / list.length) * 100}%`,
  );
  backButton.querySelector("span").textContent = t("back");
}
async function render(direction = 0) {
  error("");
  const motion =
    direction && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (motion)
    await content
      .animate(
        [
          { opacity: 1, transform: "translateX(0)" },
          { opacity: 0, transform: `translateX(${-direction * 22}px)` },
        ],
        { duration: 110, easing: "ease-out" },
      )
      .finished.catch(() => {});
  content.innerHTML = markup();
  attachAddresses();
  updateButtons();
  persist();
  if (direction) {
    content.querySelector("h1")?.focus({ preventScroll: true });
    document
      .querySelector(".quote-shell")
      .scrollIntoView({ block: "start", behavior: "instant" });
  }
  if (motion)
    await content
      .animate(
        [
          { opacity: 0, transform: `translateX(${direction * 28}px)` },
          { opacity: 1, transform: "translateX(0)" },
        ],
        { duration: 260, easing: "cubic-bezier(.2,.7,.2,1)" },
      )
      .finished.catch(() => {});
}
function saveInput(event) {
  const target = event.target;
  if (!target.name || !(target.name in state.data)) return;
  if (target.type === "radio" && !target.checked) return;
  state.data[target.name] = target.value;
  if (
    ["pickupZip", "dropoffZip", "addressFromFull", "addressToFull"].includes(
      target.name,
    )
  )
    state.route = { classification: "unknown" };
  persist();
}
form.addEventListener("input", saveInput);
form.addEventListener("change", saveInput);
async function request(url, data) {
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(url.includes("submit") ? 55000 : 12000),
    });
  } catch {
    throw Error(t("error"));
  }
  return readQuoteResponse(response, t("error"));
}
async function checkRoute(mode) {
  message.classList.remove("has-error");
  message.textContent = t("checking");
  try {
    state.route = await request("/api/quote-route", {
      mode,
      pickup: state.data.addressFromFull,
      dropoff: state.data.addressToFull,
    });
  } catch {
    state.route = { classification: "unknown" };
  }
}
async function upload() {
  if (state.preparedPhotos) return;
  if (!state.files.length) throw Error(t("photoRequired"));
  try {
    state.preparedPhotos = await prepareQuotePhotos(
      state.files,
      (current, total) => {
        message.classList.remove("has-error");
        message.textContent = `${t("uploading")} ${current} ${t("of")} ${total}…`;
      },
    );
  } catch {
    throw Error(t("uploadError"));
  }
}

async function prepareSelection() {
  state.busy = true;
  state.preparedPhotos = null;
  await render();
  let failure = "";
  try {
    if (state.files.length) await upload();
  } catch (e) {
    failure = e.message;
  } finally {
    state.busy = false;
    await render();
    if (failure) error(failure);
  }
}

function validate() {
  if (
    state.current === "route" &&
    (!state.data.addressFromFull || !state.data.addressToFull)
  ) {
    error(t("addressRequired"));
    return false;
  }

  const invalid = Array.from(content.querySelectorAll("input,textarea")).find(
    (element) => !element.checkValidity(),
  );
  if (invalid) {
    invalid.reportValidity();
    return false;
  }
  if (state.current === "size" && !state.data.moveSize) {
    error(t("sizeRequired"));
    return false;
  }
  if (
    state.current === "phone" &&
    !/^(1)?\d{10}$/.test(state.data.phone.replace(/\D/g, ""))
  ) {
    error(t("phoneInvalid"));
    return false;
  }
  if (
    state.current === "inventory" &&
    state.inventoryMode === "list" &&
    state.data.inventory.trim().length < 10
  ) {
    error(t("listRequired"));
    return false;
  }
  return true;
}
async function complete(result) {
  state.complete = true;
  for (const file of state.files) releasePreview(file);
  state.files = [];
  state.preparedPhotos = null;
  try {
    sessionStorage.removeItem(storageKey);
  } catch {}
  document.querySelector("#quote-wizard-controls").hidden = true;
  document.querySelector(".wizard-topline").hidden = true;
  message.textContent = "";
  content.innerHTML = `<div class="wizard-success"><span class="success-mark" aria-hidden="true">✓</span>${heading("savedTitle")}<p class="wizard-intro">${t(result.quoteStatus === "accepted" ? "savedLocal" : "savedManual")}</p><a class="wizard-home" href="/">${t("home")}</a></div>`;
  content.querySelector("h1").focus({ preventScroll: true });
}
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (state.busy || state.complete || !validate()) return;
  state.busy = true;
  error("");
  updateButtons();
  try {
    if (state.current === "review") {
      let utms = {};
      try {
        utms = JSON.parse(sessionStorage.getItem("splendid_utms") || "{}");
      } catch {}
      const result = await request("/api/submit-quote", {
        ...state.data,
        ...utms,
        photos:
          state.route.classification === "long-distance" &&
          state.inventoryMode === "photos"
            ? (state.preparedPhotos ?? [])
            : [],
        website: form.querySelector("[name=website]").value,
      });
      await complete(result);
      return;
    }
    if (state.current === "route") await checkRoute("address");
    if (state.current === "inventory") {
      if (state.inventoryMode === "photos") await upload();
      else {
        state.preparedPhotos = null;
      }
    }
    const list = steps();
    state.current = list[list.indexOf(state.current) + 1] || "review";
    await render(1);
  } catch (e) {
    if (e.needsInventory) {
      state.route = { classification: "long-distance" };
      state.current = "inventory";
      await render(1);
    }
    error(e.leadSaved ? t("emailRetry") : e.message || t("error"));
  } finally {
    state.busy = false;
    if (!state.complete) updateButtons();
  }
});
backButton.addEventListener("click", async () => {
  if (state.busy || state.complete) return;
  state.busy = true;
  const list = steps();
  state.current = list[Math.max(0, list.indexOf(state.current) - 1)];
  await render(-1);
  state.busy = false;
  updateButtons();
});
content.addEventListener("click", async (event) => {
  if (state.busy) return;
  const addressChange = event.target.closest("[data-change-address]");
  if (addressChange) {
    const side = addressChange.dataset.changeAddress;
    state.data[side === "from" ? "addressFromFull" : "addressToFull"] = "";
    state.data[side === "from" ? "pickupZip" : "dropoffZip"] = "";
    state.route = { classification: "unknown" };
    await render();
    return;
  }
  const manual = event.target.closest("[data-manual-address]");
  if (manual) {
    manualFields.add(manual.dataset.manualAddress);
    await render();
    return;
  }
  const mode = event.target.closest("[data-mode]");
  if (mode) {
    state.inventoryMode = mode.dataset.mode;
    await render();
    return;
  }
  const edit = event.target.closest("[data-edit]");
  if (edit) {
    state.current = edit.dataset.edit;
    await render(-1);
  }
});
content.addEventListener("change", async (event) => {
  if (event.target.id !== "inventory-photos") return;
  const selected = Array.from(event.target.files);
  const files = [
    ...state.files,
    ...selected.filter(
      (file) =>
        !state.files.some(
          (existing) =>
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified,
        ),
    ),
  ];
  if (
    files.length > 10 ||
    files.some(
      (file) =>
        file.size > 15 * 1024 * 1024 ||
        !(
          /image\/(jpeg|png|webp|heic|heif)/.test(file.type) ||
          /\.hei[cf]$/i.test(file.name)
        ),
    )
  ) {
    error(t("photoInvalid"));
    return;
  }
  for (const file of state.files)
    if (!files.includes(file)) releasePreview(file);
  state.files = files;
  state.preparedPhotos = null;

  await prepareSelection();
});
window.addEventListener("splendid:language", (event) => {
  language = event.detail;
  if (!state.complete && !state.busy) render();
});
if (!steps().includes(state.current)) state.current = "route";
// Files are browser objects and cannot survive reload; revisit inventory instead
// of claiming that a restored draft still contains uploaded photos.
const restorePhotos =
  state.route.classification === "long-distance" &&
  state.inventoryMode === "photos" &&
  steps().indexOf(state.current) > steps().indexOf("inventory");
if (restorePhotos) state.current = "inventory";
render().then(() => {
  if (restorePhotos) message.textContent = t("restorePhotos");
});

document
  .querySelector(".quote-page__skip")
  ?.addEventListener("click", () => content.querySelector("h1")?.focus());
