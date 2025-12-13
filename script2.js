const registerFRM = document.querySelector(".SignUp");
const wrapper = document.querySelector(".wrapper");
const RegisterTitle = document.querySelector(".RGT");

function RegisterFunction() {
  registerFRM.style.right = "50%";
  registerFRM.style.opacity = 1;
  wrapper.style.height = "580px";
  RegisterTitle.style.top = "0%";
  RegisterTitle.style.opacity = 1;
}

let confirmationResultGlobal = null;
let tempUserData = {};

document.addEventListener("DOMContentLoaded", function () {
  const signUpBtn = document.getElementById("SignUpBT");
  const confirmBtn = document.getElementById("confirmBtn");

  const agreeCheckbox = document.getElementById("agree");
  const termsModal = document.getElementById("termsModal");
  const termsOkBtn = document.getElementById("termsOkBtn");

  let termsAccepted = false;

  const errorUsername = document.getElementById("error-username");
  const errorEmail = document.getElementById("error-email");
  const errorPassword = document.getElementById("error-password");
  const errorPhone = document.getElementById("error-phone");
  const errorAgree = document.getElementById("error-agree");
  const errorConfirm = document.getElementById("error-confirm");
  const generalError = document.getElementById("errorMsg");

  const loadingBar = document.getElementById("loadingBar");

  // Terms Modal
  
  agreeCheckbox.addEventListener("change", function () {
    if (this.checked && !termsAccepted) {
      termsModal.style.display = "flex";
      this.checked = false; 
    }
  });

  termsOkBtn.addEventListener("click", function () {
    termsAccepted = true;
    agreeCheckbox.checked = true;
    termsModal.style.display = "none";
  });


  // phone format

  const phoneInput = document.getElementById("phone");

  phoneInput.addEventListener("input", () => {
    let val = phoneInput.value;

    if (!val.startsWith("+63")) {
      val = "+63" + val.replace(/[^0-9]/g, "");
    } else {
      val = "+63" + val.substring(3).replace(/[^0-9]/g, "");
    }

    if (val.length > 13) {
      val = val.substring(0, 13);
    }

    phoneInput.value = val;
  });
  
  // whole sign up

  signUpBtn.addEventListener("click", async function (e) {
    e.preventDefault();

    loadingBar.style.display = "block";
    loadingBar.querySelector(".loading-progress").style.width = "0%";
    setTimeout(() => {
      loadingBar.querySelector(".loading-progress").style.width = "100%";
    }, 100);

    errorUsername.innerHTML = "";
    errorEmail.innerHTML = "";
    errorPassword.innerHTML = "";
    errorPhone.innerHTML = "";
    errorAgree.innerHTML = "";
    generalError.innerHTML = "";
    generalError.style.color = "red";

    const username = document.getElementById("signname").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("signpass").value.trim();
    const phone = phoneInput.value.trim();
    const agree = agreeCheckbox.checked;

    let valid = true;

    if (!username) {
      errorUsername.innerHTML = "Username is required.";
      valid = false;
    }

    if (!email) {
      errorEmail.innerHTML = "Email is required.";
      valid = false;
    }

    if (!password) {
      errorPassword.innerHTML = "Password is required.";
      valid = false;
    } else {
      const hasUppercase = /[A-Z]/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      const hasMinLength = password.length >= 8;

      let passError = "";
      if (!hasUppercase) passError += "• Must contain at least 1 capital letter.<br>";
      if (!hasSpecialChar) passError += "• Must contain at least 1 special character.<br>";
      if (!hasMinLength) passError += "• Must be at least 8 characters long.<br>";

      if (passError !== "") {
        errorPassword.innerHTML = passError;
        valid = false;
      }
    }

    if (!phone) {
      errorPhone.innerHTML = "Phone number is required.";
      valid = false;
    }

    // Terms
    if (!agree || !termsAccepted) {
      errorAgree.innerHTML = "You must agree to terms.";
      valid = false;
    }

    if (!valid) {
      loadingBar.style.display = "none";
      return;
    }

    tempUserData = { username, email, password, phone };

    try {
      document.getElementById("recaptcha-container").style.display = "block";

      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
          "recaptcha-container",
          { size: "invisible" }
        );
      }

      const auth = firebase.auth();
      const appVerifier = window.recaptchaVerifier;

      const confirmationResult = await auth.signInWithPhoneNumber(phone, appVerifier);
      confirmationResultGlobal = confirmationResult;

      generalError.style.color = "green";
      generalError.innerHTML = "OTP sent successfully!";
      document.getElementById("confirmationBox").style.display = "block";

      loadingBar.style.display = "none";

    } catch (err) {
      loadingBar.style.display = "none";
      console.error("OTP Send Error:", err);
      generalError.innerHTML = "Failed to send OTP: " + err.message;
    }
  });
  

  // OTP
  confirmBtn.addEventListener("click", async function (e) {
    e.preventDefault();

    const code = document.getElementById("codeInput").value.trim();
    errorConfirm.innerHTML = "";
    generalError.innerHTML = "";

    if (!code) {
      errorConfirm.innerHTML = "Please enter the OTP.";
      return;
    }

    try {
      await confirmationResultGlobal.confirm(code);

      const auth = firebase.auth();
      const userCredential = await auth.createUserWithEmailAndPassword(
        tempUserData.email,
        tempUserData.password
      );

      const user = userCredential.user;

      await firebase.database().ref("users/" + user.uid).set({
        username: tempUserData.username,
        email: tempUserData.email,
        phone: tempUserData.phone
      });

      generalError.style.color = "green";
      generalError.innerText = "Registration successful! Redirecting...";

      setTimeout(() => {
        window.location.href = "Login.html";
      }, 2000);

    } catch (err) {
      console.error("Registration Error:", err);
      errorConfirm.innerText = "Error: " + err.message;
    }
  });

});
