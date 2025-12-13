document.addEventListener("DOMContentLoaded", () => {
  const orderItemsContainer = document.querySelector(".order-items");
  const totalSummaryContainer = document.querySelector(".order-totals");
  const checkoutForm = document.querySelector(".checkout-form");
  const completeBtn = document.querySelector(".complete-checkout-btn");

  const shippingFee = ;

  let products = [];
  let selectedItems = [];
  let subtotal = 0;

  const cloudName = "dys5zlhpk";


  async function loadProducts() {
    const snap = await firebase.database().ref("Product").once("value");
    const data = snap.val() || {};

    products = Object.keys(data).map((key) => {
      const p = data[key];

      return {
        ProductID: p.ProductID ?? key,
        Name: p.Name,
        Price: p.Price,
        Stock: p.Stock,
        image: p.ProductID
          ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${p.ProductID}`
          : "/assets/placeholder.png",
      };
    });
  }

  function showError(msg, err) {
    console.error(msg, err || "");
    alert(msg);
  }

  
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      showModal("Login Required", "You must log in to continue checkout.", "Login.html");
      window.location.href = "Login.html";
      return;
    }

    const uid = user.uid;

    
    const nameField = document.getElementById("fullname");
    const phoneField = document.getElementById("phone");

    try {
      const userSnap = await firebase.database().ref("users/" + uid).once("value");
      const userData = userSnap.val();

      if (userData) {
        if (userData.username && nameField) nameField.value = userData.username;
        if (userData.phone && phoneField) phoneField.value = userData.phone;
      } else {
        console.warn("User data not found for UID:", uid);
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    }


    try {
      // LOAD PRODUCTS FIRST
      await loadProducts();

      // LOAD ONLY SELECTED ITEMS
  const selectionSnap = await firebase.database()
      .ref("checkoutSelections/" + uid)
      .once("value");

  const selectionData = selectionSnap.val() || {};

  if (!selectionData || Object.keys(selectionData).length === 0) {
      orderItemsContainer.innerHTML = "<p>No items selected for checkout.</p>";
      return;
  }

  selectedItems = Object.keys(selectionData).map((productId) => {
      const product = products.find((p) => String(p.ProductID) === String(productId));

      return {
          productId,
          name: product?.Name || "Unknown Item",
          price: product?.Price || 0,
          image: product?.image || "/assets/placeholder.png",
          quantity: selectionData[productId],
      };
  });

    
      subtotal = 0;
      orderItemsContainer.innerHTML = "";

      selectedItems.forEach((item) => {
        const total = item.price * item.quantity;
        subtotal += total;

        orderItemsContainer.innerHTML += `
          <div class="order-item">
            <img src="${item.image}" alt="${item.name}" class="product-image" style="width:50px;">
            <div class="item-details">
              <h4>${item.name}</h4>
              <p>₱${item.price}</p>
              <p>Qty: ${item.quantity}</p>
            </div>
            <div class="item-price">₱${total.toFixed(2)}</div>
          </div>
        `;
      });

      const grandTotal = subtotal + shippingFee;

      totalSummaryContainer.innerHTML = `
        <div class="total-row"><span>Subtotal</span><span>₱${subtotal.toFixed(2)}</span></div>
        <div class="total-row"><span>Shipping</span><span>${"Shipping will be based on distance via Lalamove."}</span></div>
        <div class="total-row grand-total"><span>Total</span><span>₱${grandTotal.toFixed(2)}</span></div>
      `;

      
      async function handleSubmit(e) {
        e.preventDefault();

        const fullname = document.getElementById("fullname").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const address = document.getElementById("address").value.trim();
        const city = document.getElementById("city").value.trim();
        const paymentMethod = document.getElementById("payment").value;

        if (!fullname || !phone || !address || !city) {
          showModal("Missing Information", "Please fill in all required fields.");

          return;
        }

        completeBtn.disabled = true;
        completeBtn.textContent = "Processing...";

        try {
          
          const now = new Date();
          const transactionID =
            "TXN-" +
            now.getFullYear() +
            (now.getMonth() + 1).toString().padStart(2, "0") +
            now.getDate().toString().padStart(2, "0") +
            now.getHours().toString().padStart(2, "0") +
            now.getMinutes().toString().padStart(2, "0") +
            now.getSeconds().toString().padStart(2, "0");

         
          const orderData = {
            transactionID,
            userID: uid,
            items: selectedItems,
            productNames: selectedItems.map((i) => i.name),
            shipping: {
              name: fullname,
              phone,
              address,
              city,
              paymentMethod,
            },
            total: grandTotal,
            timestamp: new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" }),
            status: "Pending",
          };

          await firebase.database().ref("onlineOrders/" + transactionID).set(orderData);

        
          for (const item of selectedItems) {
            const ref = firebase.database().ref(`Product/${item.productId}/Stock`);
            const stockSnap = await ref.once("value");
            const currentStock = stockSnap.val();

            if (!isNaN(currentStock)) {
              const newStock = Math.max(0, currentStock - item.quantity);
              await ref.set(newStock);
            }
          }

          
      
          const cartRef = firebase.database().ref("carts/" + uid);
          const cartSnap = await cartRef.once("value");
          const currentCart = cartSnap.val() || {};

          selectedItems.forEach(item => {
            delete currentCart[item.productId];
          });

          await cartRef.set(currentCart);

       
          await firebase.database().ref("checkoutSelections/" + uid).set(null);



            function showModal(title, message, redirect = null) {
            const modal = document.getElementById("checkoutModal");
            const modalTitle = document.getElementById("modalTitle");
            const modalMessage = document.getElementById("modalMessage");
            const closeBtn = document.getElementById("modalCloseBtn");

            modalTitle.textContent = title;
            modalMessage.textContent = message;

            modal.style.display = "flex";

            closeBtn.onclick = () => {
              modal.style.display = "none";
              if (redirect) window.location.href = redirect;
            };
          }
          showModal("Order Placed", "Checkout complete! Your order has been placed.", "Profile.html");



          setTimeout(() => {
            window.location.href = "Profile.html";
          }, 800);

        } catch (err) {
          showError("Failed to complete checkout. Please try again.", err);
        }

        completeBtn.disabled = false;
        completeBtn.textContent = "Complete Checkout";
      }

      if (checkoutForm) checkoutForm.addEventListener("submit", handleSubmit);
      if (completeBtn) completeBtn.addEventListener("click", handleSubmit);

    } catch (error) {
      showError("There was a problem loading your checkout.", error);
    }
  });
});

