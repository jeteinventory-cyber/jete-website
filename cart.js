
let products = [];
let productsLoaded = false;

let cart = {};
let cartLoaded = false;

let currentUID = null;

const cloudName = "dys5zlhpk"; 



function loadProductsFromFirebase() {
  firebase.database().ref("Product").once("value").then(snapshot => {
    const data = snapshot.val() || {};
    products = Object.keys(data).map(key => {
      const p = data[key];

      return {
        ProductID: p.ProductID ?? key,
        Name: p.Name,
        Price: p.Price,
        Category: p.Category,
        Stock: p.Stock,
    
        image: p.ProductID
          ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${p.ProductID}`
          : "https://via.placeholder.com/300x200?text=No+Image"
      };
    });

    productsLoaded = true;
    updateCart();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadProductsFromFirebase();
});



firebase.auth().onAuthStateChanged((user) => {
  const welcomes = document.getElementById("userWelcome");
  const loginBtn = document.querySelector(".login-btn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (user) {
    currentUID = user.uid;

    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";

    firebase.database().ref("users/" + currentUID).once("value")
    .then(snapshot => {
      const data = snapshot.val();
      const username = data?.username || user.email.split("@")[0];

      if (welcomes) {
        welcomes.textContent = `Welcome, ${username}!`;
        welcomes.style.display = "block";
      }
    });

    firebase.database().ref("carts/" + currentUID).on("value", snapshot => {
      cart = snapshot.val() || {};
      cartLoaded = true;
      updateCart();
    });

  } else {
    currentUID = null;
    cart = {};

    updateCartCount();
    renderCart();

    if (loginBtn) loginBtn.style.display = "inline-block";
    if (welcomes) welcomes.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
});



function updateCart() {
  if (!productsLoaded || !cartLoaded) return;
  renderCart();
  updateCartCount();
}



function renderCart() {
  const cartContainer = document.querySelector(".cart-content");
  if (!cartContainer) return;

  cartContainer.innerHTML = "";

  if (Object.keys(cart).length === 0) {
    cartContainer.innerHTML = "<p style='color:white;'>Your cart is empty.</p>";
    document.querySelector(".cart-total").innerHTML = "";
    return;
  }

  Object.entries(cart).forEach(([productId, quantity]) => {

    const product = products.find(p => String(p.ProductID) === String(productId));

    if (!product) {
      console.warn("Missing product:", productId);
      return;
    }

  
    const imageUrl = product.image
      ? product.image
      : `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${product.image}`;

    const itemHTML = `
      <div class="cart-item" data-id="${product.ProductID}">
        <input type="checkbox" class="item-checkbox" onchange="updateTotal()" />
        
        <img src="${imageUrl}" alt="${product.Name}" class="product-image">

        <div class="cart-item-info">
          <h3>${product.Name}</h3>
          <p>₱${product.Price}</p>
        </div>

        <div class="cart-quantity">
          <button onclick="updateQuantity('${product.ProductID}', -1)">-</button>
          <span>${quantity}</span>
          <button onclick="updateQuantity('${product.ProductID}', 1)">+</button>
        </div>

        <button class="remove-btn" onclick="removeItem('${product.ProductID}')">Remove</button>
      </div>
    `;

    cartContainer.innerHTML += itemHTML;
  });

  updateTotal();
}



function updateTotal() {
  let total = 0;

  document.querySelectorAll(".cart-item").forEach(item => {
    const checkbox = item.querySelector(".item-checkbox");
    const productId = item.getAttribute("data-id");
    const qty = cart[productId];

    if (checkbox.checked) {
      const product = products.find(p => p.ProductID == productId);
      if (product) {
        total += (product.Price * qty);
      }
    }
  });

  document.querySelector(".cart-total").innerHTML =
    `<p>Total: ₱${total.toLocaleString()}</p>`;
}



function removeItem(productId) {
  if (!currentUID) return;

  delete cart[productId];
  firebase.database().ref("carts/" + currentUID).set(cart);
}



function updateQuantity(productId, change) {
  if (!currentUID) return;

  cart[productId] = (cart[productId] || 0) + change;

  if (cart[productId] <= 0) delete cart[productId];

  firebase.database().ref("carts/" + currentUID).set(cart);
}



function updateCartCount() {
  const count = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  document.querySelectorAll(".cart-count").forEach(el => {
    el.textContent = count;
  });
}



function saveSelectedItemsForCheckout() {
  if (!currentUID) return;

  let selectedItems = {};

  document.querySelectorAll(".cart-item").forEach(item => {
    const checkbox = item.querySelector(".item-checkbox");
    const productId = item.getAttribute("data-id");

    if (checkbox.checked) {
      selectedItems[productId] = cart[productId]; 
    }
  });

  

  firebase.database()
    .ref("checkoutSelections/" + currentUID)
    .set(selectedItems); 
}


function attemptCheckout() {
  let selectedCount = 0;

  document.querySelectorAll(".cart-item").forEach(item => {
    if (item.querySelector(".item-checkbox").checked) {
      selectedCount++;
    }
  });

  if (selectedCount === 0) {
    
    if (currentUID) {
      firebase.database()
        .ref("checkoutSelections/" + currentUID)
        .set({});
    }

    showModal();
    return;
  }

  saveSelectedItemsForCheckout(); 
  window.location.href = "Checkout.html";
}


function showModal() {
  document.getElementById("checkoutModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("checkoutModal").style.display = "none";
}

