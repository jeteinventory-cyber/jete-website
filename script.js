const LoginFRM = document.querySelector(".Login"); 
const registerFRM = document.querySelector(".SignUp"); 
const wrapper = document.querySelector(".wrapper");
const LoginTitle = document.querySelector(".LGT"); 
const RegisterTitle = document.querySelector(".RGT"); 
const BTNsignup = document.querySelector("#SignUpBT");
const BTNsignin = document.querySelector("#SignIn");


    
function LoginFunction()
{ 
LoginFRM.style.left = "50%"; 
LoginFRM.style.opacity =1;
wrapper.style.height = "500px";
LoginTitle.style.top = "0";
LoginTitle.style.opacity = 1; 

}

document.addEventListener("DOMContentLoaded", function () {
  const BTNsignin = document.getElementById("SignIn");

  if (!BTNsignin) {
    console.error("Sign In button not found!");
    return;
  }



  BTNsignin.addEventListener("click", function (e) {
    e.preventDefault();
    console.log("Sign In button clicked");

    const email = document.getElementById("log").value.trim();
    const password = document.getElementById("pass").value.trim();

    console.log("Email:", email, "Password:", password);

    document.getElementById("error-email").innerText = "";
    document.getElementById("error-password").innerText = "";



    firebase.auth().signInWithEmailAndPassword(email, password)
  .then((userCredential) => {

   
    const modal = document.getElementById("loginModal");
    modal.style.display = "block";

    
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  })
        
  .catch((error) => {
    console.error("Login error:", error.message);

    if (error.code === "Invalid Credentials") {
      document.getElementById("error-email").innerText = "Invalid email or password.";
    } else {
      document.getElementById("error-email").innerText = error.message;
    }
  });

  });

});
