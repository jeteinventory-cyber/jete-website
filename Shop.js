let cart = {};
let currentUid = null;
let products = []; 



function fetchProducts() {
  console.log("Fetching products from Firebase...");

  firebase.database().ref("Product").once("value").then((snapshot) => {
    const productsData = snapshot.val();
    console.log("Raw data from Firebase:", productsData);

    if (productsData) {
      products = [];

      Object.keys(productsData).forEach(key => {
        const product = productsData[key];

        if (!product || typeof product !== 'object' || !product.Name) return;

        const cloudName = "dys5zlhpk";

        products.push({
          ProductID: key,
          Name: product.Name,
          Category: product.Category || 'Uncategorized',
          Price: product.Price || 0,
          Stock: product.Stock || 0,
          OnlineStatus: product.OnlineStatus || "Available",
          Status: product.Status || "Good",  

          image: product.ProductID
            ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${product.ProductID}`
            : 'https://via.placeholder.com/300x200?text=No+Image'
        });

      });

      console.log("Products loaded:", products.length, "products");
      renderProducts();
    } else {
      console.log("No products found in database");
      products = [];
      renderProducts();
    }
  }).catch(error => {
    console.error("Error fetching products:", error);
    products = [];
    renderProducts();
  });
}


firebase.auth().onAuthStateChanged((user) => {
  const welcomes = document.getElementById("userWelcome");
  const loginBtn = document.querySelector(".login-btn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (user) {
    currentUid = user.uid;
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";

    firebase.database().ref("users/" + currentUid).once("value").then((snapshot) => {
      const data = snapshot.val();
      const username = data?.username || user.email.split("@")[0];
      if (welcomes) {
        welcomes.textContent = `Welcome, ${username}!`;
        welcomes.style.display = "block";
      }
    });

    const cartRef = firebase.database().ref("carts/" + currentUid);
    cartRef.off();
    cartRef.on("value", (snapshot) => {
      cart = snapshot.val() || {};
      localStorage.setItem("cart_" + currentUid, JSON.stringify(cart));
      updateCartCount();
      renderProducts();
    });

  } else {
    currentUid = null;
    cart = {};
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (welcomes) welcomes.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
    updateCartCount();
  }

  fetchProducts();
});


function addToCart(productId) {
  const user = firebase.auth().currentUser;
  if (!user) {
    alert("Please log in to add items to your cart.");
    return;
  }

  const product = products.find(p => p.ProductID === productId);
  const currentInCart = cart[productId] || 0;

  if (product && currentInCart >= product.Stock) {
    alert(`Sorry, only ${product.Stock} items available in stock.`);
    return;
  }

  const uid = user.uid;
  const updatedCart = { ...cart, [productId]: (cart[productId] || 0) + 1 };
  cart = updatedCart;
  updateCartCount();
  renderProducts();
  showAddedMessage();

  firebase.database().ref("carts/" + uid).set(updatedCart)
    .then(() => console.log("Cart saved for UID:", uid))
    .catch(err => console.error("Error saving cart:", err));
}


function renderProducts() {
  const container = document.querySelector(".products-container");
  if (!container) {
    console.error("Products container not found!");
    return;
  }

  console.log("Rendering products. Total:", products.length);

  const searchValue = document.getElementById("searchInput")?.value.toLowerCase() || "";
  const selectedCategory = document.getElementById("categorySelect")?.value || "all";

  const filtered = products.filter((p) =>
    p.Name &&
    (selectedCategory === "all" || p.Category === selectedCategory) &&
    p.Name.toLowerCase().includes(searchValue)
  );

  console.log("Filtered products:", filtered.length);

  if (filtered.length === 0) {
    container.innerHTML = '<div class="no-products">No products found</div>';
    return;
  }

  container.innerHTML = filtered.map((product) => {
    const inCart = cart[product.ProductID] || 0;
    const outOfStock = product.Stock <= 0;
    const maxReached = inCart >= product.Stock;

    return `
       <div class="product-card">

    <a href="${product.image}" target="_blank">
     <img 
        src="${product.image}" 
        alt="${product.Name}" 
        class="product-image"
        onclick="openImageModal('${product.image}')"
      >

    </a>

    <h3>${product.Name}</h3>
    <p class="product-category">Category: ${product.Category}</p>
    <p class="product-price">Price: ₱${product.Price}</p>
    <p class="product-stock">Stock: ${product.Stock}</p>

    <button onclick="addToCart('${product.ProductID}')"
      ${outOfStock || maxReached ? 'disabled' : ''}>
      ${outOfStock ? 'Out of Stock' : maxReached ? 'Max Reached' : 'Add to Cart'}
    </button>

    <p class="in-cart">In Cart: ${inCart}</p>
  </div>
`;
  }).join("");
}

function updateCartCount() {
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  document.querySelectorAll(".cart-count").forEach((el) => el.textContent = count);
}


function showAddedMessage() {
  const msg = document.createElement("div");
  msg.textContent = " Item added to your cart!";
  msg.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: bold;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  `;
  document.body.appendChild(msg);
  requestAnimationFrame(() => msg.style.opacity = "1");
  setTimeout(() => {
    msg.style.opacity = "0";
    setTimeout(() => msg.remove(), 300);
  }, 1500);
}


function openImageModal(src) {
  event?.preventDefault();   
  event?.stopPropagation();

  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");

  

  modal.style.display = "block";
  modalImg.src = src;
}


document.querySelector(".close-modal").onclick = function() {
  document.getElementById("imageModal").style.display = "none";
};


window.onclick = function(event) {
  const modal = document.getElementById("imageModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};


document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
  document.getElementById("searchInput")?.addEventListener("input", renderProducts);
  document.getElementById("categorySelect")?.addEventListener("change", renderProducts);
});


document.getElementById("logoutBtn")?.addEventListener("click", () => {
  firebase.auth().signOut().then(() => {
    window.location.href = "Login.html";
  });
});



