import { auth, database } from '../../firebase/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";

const db = getDatabase();
onAuthStateChanged(auth, (user) => {
    if (user) {
        const uid = user.uid;
        const transRef = ref(db, `users/${uid}/currencyTransactions`);

        get(transRef)
            .then(snapshot => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const tableBody = document.getElementById("transactionBody");

                    Object.entries(data).sort((a, b) => b[0] - a[0]).forEach(([timestamp, txn]) => {
                        const row = document.createElement("tr");

                        const date = new Date(Number(timestamp)).toLocaleString();

                        row.innerHTML = `
                            <td>${date}</td>
                            <td>${txn.currency || "N/A"}</td>
                            <td>$${parseFloat(txn.price).toFixed(2)}</td>
                            <td>${txn.transactionId}</td>
                        `;

                        tableBody.appendChild(row);
                    });
                } else {
                    console.log("No transaction history found.");
                }
            })
            .catch(error => {
                console.error("Failed to load transaction history:", error);
            });
    } else {
        window.location.href = "../index.html";
    }
});
const logoutBtn = document.getElementById("logout");
const modal = document.getElementById("logoutModal");
const confirmLogout = document.getElementById("confirmLogout");
const cancelLogout = document.getElementById("cancelLogout");

logoutBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
});

cancelLogout.addEventListener("click", () => {
    modal.classList.add("hidden");
});

confirmLogout.addEventListener("click", () => {
    import('./login-firebase.js') // ✅ relative to HTML file, not this JS file
        .then(module => {
            module.logoutUser();
        })
        .catch(err => {
            console.error("Logout module error:", err);
        });
});