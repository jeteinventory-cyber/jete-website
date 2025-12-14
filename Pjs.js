document.addEventListener("DOMContentLoaded", () => {
  const welcomes = document.getElementById("userWelcome");
  const loginBtn = document.querySelector(".login-btn");
  const logoutBtn = document.getElementById("logoutBtn");
  const ordersTableBody = document.getElementById("ordersTableBody");


  
  (function () {
    emailjs.init("gSGSQ7CSu6PRt9BS_");
  })();

  document.getElementById("contactForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!name || !email || !message) {
      alert("Please fill in all fields before submitting.");
      return;
    }

    emailjs
      .send("service_lu5o1qp", "template_fjl56sa", { name, email, message })
      .then(
        () => {
          alert("Message sent successfully! We'll get back to you soon.");
          document.getElementById("contactForm").reset();
        },
        (error) => {
          console.error("EmailJS error:", error);
          alert("Failed to send message. Please try again later.");
        }
      );
  });

 
  function renderRow(order) {
  const tx = order.transactionID || "N/A";
  const status = order.status || "Pending";
  const dateStr = order.timestamp || "";

  let itemsHtml = "";

  if (Array.isArray(order.items)) {
    order.items.forEach((item) => {
      itemsHtml += `
        <div class="order-item-details">
          <img src="${item.image}" alt="${item.name}" class="order-item-image">
          <div class="order-text">
            <strong>${item.name}</strong><br>
            <span>Price: ₱${item.price}</span><br>
            <span>Qty: ${item.quantity}</span><br>
            <span class="item-total">Total: ₱${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        </div>
      `;
    });
  } else {
    itemsHtml = "<em>No item details available</em>";
  }

  return `
    <tr class="order-row">
      <td>${tx}</td>

      <td>
        <button class="dropdown-btn">View Items ▼</button>
        <div class="dropdown-content">
          ${itemsHtml}
        </div>
      </td>

      <td>₱${order.total}</td>
      <td>${status}</td>
      <td>${dateStr}</td>
    </tr>
  `;
}

 
  firebase.auth().onAuthStateChanged(async (user) => {
        let cart = {};

    function updateCartCount() {
      const total = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
      document.querySelectorAll(".cart-count").forEach(el => {
        el.textContent = total;
      });
    }

    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        const uid = user.uid;


        firebase.database().ref("carts/" + uid).on("value", (snap) => {
          cart = snap.val() || {};
          updateCartCount();
        });
      } else {
        cart = {};
        updateCartCount();
      }

      
    });

    if (!ordersTableBody) return;

    ordersTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;">Loading...</td>
      </tr>
    `;


    if (!user) {
      if (loginBtn) loginBtn.style.display = "inline-block";
      if (logoutBtn) logoutBtn.style.display = "none";
      if (welcomes) welcomes.style.display = "none";

      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; color:#c00;">
            Please log in to view your orders.
          </td>
        </tr>
      `;
      return;
    }

  
    const uid = user.uid;

    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";

  
    try {
      const userSnap = await firebase.database().ref(`users/${uid}`).once("value");
      const userData = userSnap.val();
      const username =
        (userData && (userData.username || userData.name)) ||
        user.email.split("@")[0];

      if (welcomes) {
        welcomes.textContent = `Welcome, ${username}!`;
        welcomes.style.display = "block";
      }
    } catch (err) {
      console.warn("Could not fetch profile:", err);
    }

  
    try {
      const ordersRef = firebase.database().ref("onlineOrders");

      ordersRef.on("value", (snapshot) => {
        if (!snapshot.exists()) {
          ordersTableBody.innerHTML = `
            <tr><td colspan="5" style="text-align:center;">No orders found.</td></tr>
          `;
          return;

          
        }
     
        setTimeout(() => {
          document.querySelectorAll(".dropdown-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
              const content = btn.nextElementSibling;
              content.classList.toggle("active");
              btn.textContent = content.classList.contains("active")
                ? "Hide Items ▲"
                : "View Items ▼";
            });
          });
        }, 300);


        const ordersObj = snapshot.val();

        const ordersArray = Object.entries(ordersObj)
          .map(([key, val]) => ({
            ...val,
            _key: key,
            userID: val.userID ?? null,
            transactionID: val.transactionID ?? key,
          }))
          .filter((o) => o.userID === uid);

        if (!ordersArray.length) {
          ordersTableBody.innerHTML = `
            <tr><td colspan="5" style="text-align:center;">You have no orders yet.</td></tr>
          `;
          return;
        }

        ordersTableBody.innerHTML = "";
        ordersArray.forEach((order) => {
          ordersTableBody.innerHTML += renderRow(order);
        });
      });
    } catch (error) {
      console.error("Error loading orders:", error);
      ordersTableBody.innerHTML = `
        <tr><td colspan="5" style="text-align:center; color:red;">Failed to load orders.</td></tr>
      `;
    }
  });

  
 


  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await firebase.auth().signOut();
        window.location.href = "Login.html";
      } catch (err) {
        console.error("Logout failed:", err);
      }
    });
  }
});

