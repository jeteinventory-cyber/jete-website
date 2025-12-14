
document.getElementById("forgotForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const errorMsg = document.getElementById("error-msg");

  if (!email) {
    errorMsg.textContent = "Please enter your email.";
    return;
  }

  errorMsg.textContent = "";

  try {
    
    const snapshot = await firebase.database().ref("users").once("value");
    let userFound = false;

    snapshot.forEach(child => {
      if (child.val().email === email) userFound = true;
    });

    if (!userFound) {
      errorMsg.textContent = "Email not found in our records.";
      return;
    }

   
    
    firebase.auth().sendPasswordResetEmail(email)
      .then(() => {
        errorMsg.style.color = "green";
        errorMsg.textContent = "Password reset email sent! Check your inbox.";
      })
      .catch((err) => {
        errorMsg.style.color = "red";
        errorMsg.textContent = err.message;
      });

  } catch (err) {
    console.error("Firebase Error:", err);
    errorMsg.style.color = "red";
    errorMsg.textContent = err.message;
  }
});

