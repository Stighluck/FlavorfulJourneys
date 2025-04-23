import { auth, database } from '../../firebase/firebase-init.js';// adjust path as needed
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { ref, get, child } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";


export function logoutUser() {
  signOut(auth)
    .then(() => {
      console.log("✅ User signed out.");
      window.location.href = "../index.html";
    })
    .catch((error) => {
      console.error("❌ Sign-out error:", error);
    });
}

export function SignIn() {
  const email = document.getElementById("txtEmail").value;
  const password = document.getElementById("txtPassword").value;
  const errormessage = document.getElementById("errormessage");

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      const uid = user.uid;

      const dbRef = ref(database);
      get(child(dbRef, `admins/${uid}`))
        .then((snapshot) => {
          if (snapshot.exists()) {
            console.log("✅ Admin login successful:", user);
            window.location.href = "/admin/admin-dashboard.html";
          } else {
            console.log("✅ User login successful:", user);
            window.location.href = "user-dashboard.html";
          }
        })
        .catch((error) => {
          console.error("❌ Database read failed:", error);
          errormessage.innerText = "Error verifying admin access.";
        });
    })
    .catch((error) => {
      console.log(error.code + ": " + error.message);
      errormessage.innerText = "Invalid email or password";
    });
}

// ✅ Only attach SignIn event listener if button exists
const signInBtn = document.getElementById("btnSignIn");
if (signInBtn) {
  signInBtn.addEventListener("click", SignIn);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      SignIn();
    }
  });
}