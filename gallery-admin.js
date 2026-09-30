const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");
const gallery = document.querySelector("#gallery-container");
const galleryEmpty = document.querySelector("#gallery-empty");
const loginForm = document.querySelector("#admin-login");
const adminSession = document.querySelector("#admin-session");
const uploadForm = document.querySelector("#upload-form");
const statusMessage = document.querySelector("#upload-status");
const maxFileSize = 50 * 1024 * 1024;
const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);

const reviews = [
  {
    text: "A lovely cake is more than dessert. It's a little centrepiece for a moment you want to remember.",
    author: "Vilerious Bakers",
  },
  {
    text: "Made with care, finished by hand, and created around the people and stories you love.",
    author: "Vilerious Bakers",
  },
  {
    text: "From the first idea to the last slice, we bring a little joy to every celebration.",
    author: "Vilerious Bakers",
  },
];

let currentReview = 0;

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = type;
}

function renderGallery(items, client, isAdmin, loadGallery) {
  gallery.replaceChildren();
  galleryEmpty.hidden = items.length > 0;

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "gallery-item";

    const media = item.media_type === "image"
      ? document.createElement("img")
      : document.createElement("video");
    media.src = item.media_url;
    media.alt = item.media_type === "image" ? item.name : `Video: ${item.name}`;
    media.loading = "lazy";
    if (item.media_type === "video") media.controls = true;

    const details = document.createElement("div");
    details.className = "gallery-item-info";
    const name = document.createElement("h4");
    name.textContent = item.name;
    details.append(name);

    if (item.description) {
      const description = document.createElement("p");
      description.textContent = item.description;
      details.append(description);
    }

    card.append(media, details);
    if (isAdmin) {
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.type = "button";
      deleteBtn.textContent = "Delete";
      deleteBtn.setAttribute("aria-label", `Delete ${item.name}`);
      deleteBtn.addEventListener("click", async () => {
        if (!confirm(`Delete "${item.name}" from the gallery? This also removes its media file.`)) return;
        deleteBtn.disabled = true;
        setStatus("Deleting item…");
        try {
          const { error: storageError } = await client.storage
            .from("cakes")
            .remove([item.media_path]);
          if (storageError) throw storageError;

          const { error: rowError } = await client.from("cakes").delete().eq("id", item.id);
          if (rowError) throw rowError;

          setStatus("Item deleted.", "success");
          await loadGallery();
        } catch (error) {
          console.error("Could not delete gallery item:", error);
          setStatus(`Delete failed: ${error.message || "Please try again."}`, "error");
          deleteBtn.disabled = false;
        }
      });

      const actions = document.createElement("div");
      actions.className = "gallery-actions";
      actions.append(deleteBtn);
      card.append(actions);
    }
    gallery.append(card);
  }
}

function getFileExtension(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && /^[a-z0-9]{1,10}$/.test(extension)) return extension;
  return file.type.startsWith("image/") ? "jpg" : "mp4";
}

function setAdminState(session) {
  const signedIn = Boolean(session);
  loginForm.hidden = signedIn;
  adminSession.hidden = !signedIn;
  uploadForm.hidden = !signedIn;
  document.querySelector("#admin-email-display").textContent = session?.user.email ?? "";
  if (!signedIn) loginForm.reset();
}

function showReview(direction) {
  currentReview = (currentReview + direction + reviews.length) % reviews.length;
  const review = reviews[currentReview];
  document.querySelector("#quote-text").textContent = review.text;
  document.querySelector("#quote-author").innerHTML = `${review.author} <span>· Our promise</span>`;
  document.querySelector("#quote-count").innerHTML =
    `${String(currentReview + 1).padStart(2, "0")} <i>/</i> ${String(reviews.length).padStart(2, "0")}`;
}

async function startGallery() {
  const config = window.VILERIOUS_SUPABASE_CONFIG;
  if (!config?.url || !config?.publishableKey || !window.supabase?.createClient) {
    galleryEmpty.hidden = false;
    galleryEmpty.textContent = "The cake gallery is temporarily unavailable.";
    setStatus("Supabase is not configured. Check config.js and reload.", "error");
    return;
  }

  const client = window.supabase.createClient(config.url, config.publishableKey);
  let galleryItems = [];
  let isAdmin = false;

  async function loadGallery() {
    const { data, error } = await client
      .from("cakes")
      .select("id, name, description, media_url, media_path, media_type, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load the cake gallery:", error);
      gallery.replaceChildren();
      galleryEmpty.hidden = false;
      galleryEmpty.textContent = "The cake gallery could not be loaded. Please try again later.";
      setStatus(`Could not load gallery: ${error.message}`, "error");
      return;
    }

    galleryItems = data ?? [];
    renderGallery(galleryItems, client, isAdmin, loadGallery);
  }

  client.auth.onAuthStateChange((_event, session) => {
    isAdmin = Boolean(session);
    setAdminState(session);
    renderGallery(galleryItems, client, isAdmin, loadGallery);
  });

  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) {
    console.error("Could not check the admin session:", sessionError);
    setStatus(`Could not check sign-in status: ${sessionError.message}`, "error");
  }
  isAdmin = Boolean(sessionData?.session);
  setAdminState(sessionData?.session ?? null);

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = document.querySelector("#login-btn");
    button.disabled = true;
    setStatus("Signing in…");

    const { error } = await client.auth.signInWithPassword({
      email: document.querySelector("#admin-email").value.trim(),
      password: document.querySelector("#admin-password").value,
    });
    button.disabled = false;

    if (error) {
      setStatus(`Sign-in failed: ${error.message}`, "error");
      return;
    }
    loginForm.reset();
    setStatus("Signed in. You can now upload gallery items.", "success");
  });

  document.querySelector("#logout-btn").addEventListener("click", async () => {
    const { error } = await client.auth.signOut();
    if (error) {
      console.error("Could not sign out:", error);
      setStatus(`Sign-out failed: ${error.message}`, "error");
      return;
    }
    setStatus("You have signed out.", "success");
  });

  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = document.querySelector("#upload-btn");
    const file = document.querySelector("#file-input").files[0];
    const name = document.querySelector("#cake-name").value.trim();
    const description = document.querySelector("#cake-description").value.trim();

    if (!file || !name) {
      setStatus("Enter a cake name and select a photo or video.", "error");
      return;
    }
    if (!allowedTypes.has(file.type)) {
      setStatus("Choose a JPG, PNG, WebP, GIF, MP4, or WebM file.", "error");
      return;
    }
    if (file.size > maxFileSize) {
      setStatus("This file is over the 50 MB upload limit.", "error");
      return;
    }

    button.disabled = true;
    setStatus("Uploading your cake…");
    const mediaType = file.type.startsWith("image/") ? "image" : "video";
    const filePath = `${crypto.randomUUID()}.${getFileExtension(file)}`;
    let uploaded = false;

    try {
      const { error: uploadError } = await client.storage
        .from("cakes")
        .upload(filePath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      uploaded = true;

      const { data: publicUrlData } = client.storage.from("cakes").getPublicUrl(filePath);
      const { error: insertError } = await client.from("cakes").insert({
        name,
        description,
        media_url: publicUrlData.publicUrl,
        media_path: filePath,
        media_type: mediaType,
      });
      if (insertError) throw insertError;

      uploadForm.reset();
      setStatus("Cake uploaded and added to the gallery.", "success");
      await loadGallery();
    } catch (error) {
      console.error("Cake upload failed:", error);
      if (uploaded) {
        const { error: cleanupError } = await client.storage.from("cakes").remove([filePath]);
        if (cleanupError) console.error("Could not clean up the uploaded file:", cleanupError);
      }
      setStatus(`Upload failed: ${error.message || "Please try again."}`, "error");
    } finally {
      button.disabled = false;
    }
  });

  await loadGallery();
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
    siteNav.classList.toggle("is-open", !isExpanded);
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      siteNav.classList.remove("is-open");
    }
  });
}

document.querySelector("#quote-prev")?.addEventListener("click", () => showReview(-1));
document.querySelector("#quote-next")?.addEventListener("click", () => showReview(1));
document.querySelector("#year").textContent = new Date().getFullYear();

startGallery();
