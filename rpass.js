document.getElementById("resetForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const newPass = document.getElementById("newPass").value.trim();
  const msg = document.getElementById("reset-msg");

  if (!newPass) {
    msg.textContent = "Password cannot be empty.";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const oobCode = params.get("oobCode");
  const mode = params.get("mode");

  if (!oobCode || mode !== "resetPassword") {
    msg.textContent = "Invalid or expired reset link.";
    return;
  }

  try {
    const email = await firebase.auth().verifyPasswordResetCode(oobCode);

    await firebase.auth().confirmPasswordReset(oobCode, newPass);

    msg.style.color = "green";
    msg.textContent = "Password reset successfully! Redirecting...";

    setTimeout(() => {
      window.location.href = "Login.html";
    }, 2000);

  } catch (error) {
    console.error("Reset error:", error);
    msg.textContent = error.message;
  }
});
