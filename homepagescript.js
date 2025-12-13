firebase.auth().onAuthStateChanged((user) => {
  const welcomes = document.getElementById("userWelcome");
  const loginBtn = document.querySelector(".login-btn"); 
  const logoutBtn = document.getElementById("logoutBtn");

  if (user) {
    const uid = user.uid;

    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";

    firebase.database().ref('users/' + uid).once('value').then((snapshot) => {
      const data = snapshot.val();
      const username = data?.username || user.email.split('@')[0];

      if (welcomes) {
        welcomes.textContent = `Welcome, ${username}!`;
        welcomes.style.display = "block";
      }
    });

    // Load cart
    firebase.database().ref('carts/' + uid).on('value', (snapshot) => {
      cart = snapshot.val() || {};
      updateCartCount();
    });

    function updateCartCount() {
      const count = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

      document.querySelectorAll(".cart-count").forEach(ct => {
        ct.textContent = count;
      });
    }

  } else {
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (welcomes) welcomes.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
});

// LOGOUT
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    firebase.auth().signOut().then(() => {
      showModal("Logged Out", "You have successfully logged out.", "Login.html");
    });
  });
}


// EMAIL JS INIT
(function () {
    emailjs.init("gSGSQ7CSu6PRt9BS_");
})();

// CONTACT FORM
document.getElementById("contactForm").addEventListener("submit", function(event){
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!name || !email || !message) {
        showModal("Missing Fields", "Please fill in all fields before submitting.");
        return;
    }

    emailjs.send("service_lu5o1qp", "template_fjl56sa", {
        name: name,
        email: email,
        message: message
    })
    .then(() => {
        showModal("Message Sent", "Your message has been sent! We will contact you soon.");
        document.getElementById("contactForm").reset();
    })
    .catch(error => {
        console.error("EmailJS error:", error);
        showModal("Error", "Failed to send message. Please try again later.");
    });
});


// ----------------------
// PRODUCT FETCHING
// ----------------------

let products = [];
let currentRandomSet = [];

function fetchProducts() {
    firebase.database().ref("Product").once("value").then((snapshot) => {
        const data = snapshot.val();
        products = [];

        if (!data) {
            showModal("No Products", "No products found in the database.");
            return;
        }

        const cloudName = "dys5zlhpk";

        Object.keys(data).forEach(key => {
            const product = data[key];

            if (!product || !product.Name) return;

            products.push({
                id: key,
                name: product.Name,
                category: product.Category || "Uncategorized",
                price: product.Price || 0,
                image: `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${key}`
            });
        });

        if (products.length > 0) {
            showRandomProducts();
            setInterval(showRandomProducts, 5000);
        }
    });
}

function showRandomProducts() {
    if (products.length === 0) return;

    currentRandomSet = [...products]
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);

    displayProducts();
}

function displayProducts() {
    const container = document.querySelector(".products-container");
    if (!container) return;

    container.innerHTML = currentRandomSet.map(p => `
        <div class="product-card rotate-card" onclick="goToShop()">
            <img src="${p.image}"
                 onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'"
                 class="product-img">
            <h3>${p.name}</h3>
            <p class="product-category">${p.category}</p>
            <p class="product-price">₱${Number(p.price).toLocaleString()}</p>
        </div>
    `).join("");
}

function goToShop() {
    window.location.href = "Shop.html";
}

document.addEventListener("DOMContentLoaded", fetchProducts);

function showModal(title, message, redirect = null) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalMessage").textContent = message;

  const modal = document.getElementById("msgModal");
  modal.style.display = "flex";

  modal.dataset.redirect = redirect;
}

function closeModal() {
  const modal = document.getElementById("msgModal");
  modal.style.display = "none";

  const redirect = modal.dataset.redirect;

  // ONLY redirect if redirect is a real URL
  if (redirect && redirect !== "null" && redirect !== "" && redirect !== "undefined") {
      window.location.href = redirect;
  }
}


