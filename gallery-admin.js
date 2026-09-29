// Gallery & Admin Panel Script with Supabase Integration

let supabase = null;
let isAuthenticated = false;

// Initialize Supabase when page loads
async function initSupabase() {
  if (typeof window.supabase === 'undefined') {
    console.log('Supabase library not loaded yet');
    setTimeout(initSupabase, 500);
    return;
  }

  const { createClient } = window.supabase;
  
  // Get credentials from config or environment
  const url = window.SUPABASE_URL || localStorage.getItem('supabase_url');
  const key = window.SUPABASE_KEY || localStorage.getItem('supabase_key');
  
  if (!url || !key) {
    console.log('Supabase credentials not configured. Admin panel disabled.');
    document.getElementById('admin-panel').style.display = 'none';
    loadGalleryFromLocal();
    return;
  }
  
  supabase = createClient(url, key);
  setupGallery();
  setupAdmin();
}

// Load gallery from localStorage (fallback)
async function loadGalleryFromLocal() {
  const gallery = document.getElementById('gallery-container');
  const galleryEmpty = document.getElementById('gallery-empty');
  
  const items = JSON.parse(localStorage.getItem('cakeGallery') || '[]');
  
  if (items.length === 0) {
    galleryEmpty.style.display = 'block';
    return;
  }
  
  galleryEmpty.style.display = 'none';
  gallery.innerHTML = '';
  
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    
    let media = '';
    if (item.type === 'image') {
      media = `<img src="${item.url}" alt="${item.name}" loading="lazy" />`;
    } else {
      media = `<video controls><source src="${item.url}" /></video>`;
    }
    
    div.innerHTML = `
      ${media}
      <div class="gallery-item-info">
        <h4>${item.name}</h4>
        <p>${item.description}</p>
      </div>
    `;
    
    gallery.appendChild(div);
  });
}

// Setup gallery with Supabase
async function setupGallery() {
  if (!supabase) {
    loadGalleryFromLocal();
    return;
  }
  
  const { data, error } = await supabase
    .from('cakes')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error loading gallery:', error);
    loadGalleryFromLocal();
    return;
  }
  
  const gallery = document.getElementById('gallery-container');
  const galleryEmpty = document.getElementById('gallery-empty');
  
  if (!data || data.length === 0) {
    galleryEmpty.style.display = 'block';
    return;
  }
  
  galleryEmpty.style.display = 'none';
  gallery.innerHTML = '';
  
  data.forEach(item => {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    
    let media = '';
    if (item.media_type === 'image') {
      media = `<img src="${item.media_url}" alt="${item.name}" loading="lazy" />`;
    } else {
      media = `<video controls><source src="${item.media_url}" /></video>`;
    }
    
    div.innerHTML = `
      ${media}
      <div class="gallery-item-info">
        <h4>${item.name}</h4>
        <p>${item.description}</p>
      </div>
    `;
    
    gallery.appendChild(div);
  });
}

// Setup admin panel
function setupAdmin() {
  const passwordInput = document.getElementById('admin-password');
  const uploadFields = document.getElementById('upload-fields');
  const uploadBtn = document.getElementById('upload-btn');
  const fileInput = document.getElementById('file-input');
  const statusDiv = document.getElementById('upload-status');
  
  // Unlock upload form when password is entered
  passwordInput.addEventListener('input', (e) => {
    if (e.target.value === window.ADMIN_PASSWORD) {
      uploadFields.style.display = 'block';
      e.target.disabled = true;
      e.target.value = '✓ Unlocked';
    }
  });
  
  // Handle upload
  uploadBtn.addEventListener('click', async () => {
    const name = document.getElementById('cake-name').value;
    const description = document.getElementById('cake-description').value;
    const file = fileInput.files[0];
    
    if (!name || !description || !file) {
      setStatus('Please fill in all fields', 'error');
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      setStatus('File is too large (max 50MB)', 'error');
      return;
    }
    
    uploadBtn.disabled = true;
    setStatus('Uploading...', '');
    
    try {
      if (!supabase) {
        // Save to localStorage if Supabase not available
        const item = {
          name,
          description,
          url: URL.createObjectURL(file),
          type: file.type.startsWith('image') ? 'image' : 'video'
        };
        const gallery = JSON.parse(localStorage.getItem('cakeGallery') || '[]');
        gallery.unshift(item);
        localStorage.setItem('cakeGallery', JSON.stringify(gallery));
        
        setStatus('✓ Cake added to gallery!', 'success');
        clearForm();
        loadGalleryFromLocal();
      } else {
        // Upload to Supabase
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `cakes/${fileName}`;
        
        // Upload file
        const { error: uploadError } = await supabase.storage
          .from('cakes')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data } = supabase.storage.from('cakes').getPublicUrl(filePath);
        const mediaUrl = data.publicUrl;
        
        // Save metadata to database
        const { error: insertError } = await supabase
          .from('cakes')
          .insert([{
            name,
            description,
            media_url: mediaUrl,
            media_type: file.type.startsWith('image') ? 'image' : 'video'
          }]);
        
        if (insertError) throw insertError;
        
        setStatus('✓ Cake added to gallery!', 'success');
        clearForm();
        setupGallery();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('Error uploading cake. Try again.', 'error');
    } finally {
      uploadBtn.disabled = false;
    }
  });
  
  function setStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type ? `${type}` : '';
  }
  
  function clearForm() {
    document.getElementById('cake-name').value = '';
    document.getElementById('cake-description').value = '';
    fileInput.value = '';
  }
}

// Mobile menu toggle (from original script)
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
    siteNav.classList.toggle("is-open", !isExpanded);
  });
}

if (siteNav) {
  siteNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation");
      siteNav.classList.remove("is-open");
    }
  });
}

// Reviews carousel (from original script)
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
const quoteText = document.querySelector("#quote-text");
const quoteAuthor = document.querySelector("#quote-author");
const quoteCount = document.querySelector("#quote-count");

function showReview(direction) {
  currentReview = (currentReview + direction + reviews.length) % reviews.length;
  const review = reviews[currentReview];
  quoteText.textContent = review.text;
  quoteAuthor.innerHTML = `${review.author} <span>· Our promise</span>`;
  quoteCount.innerHTML = `${String(currentReview + 1).padStart(2, "0")} <i>/</i> ${String(reviews.length).padStart(2, "0")}`;
}

if (document.querySelector("#quote-prev")) {
  document.querySelector("#quote-prev").addEventListener("click", () => showReview(-1));
}
if (document.querySelector("#quote-next")) {
  document.querySelector("#quote-next").addEventListener("click", () => showReview(1));
}

document.querySelector("#year").textContent = new Date().getFullYear();

// Initialize everything when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSupabase);
} else {
  initSupabase();
}
