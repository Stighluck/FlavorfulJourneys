import { auth, database } from '../../firebase/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";



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
    import('/user/js/login-firebase.js')
        .then(module => {
            module.logoutUser();
        })
        .catch(err => {
            console.error("Logout module error:", err);
        });
});
document.addEventListener("DOMContentLoaded", () => {
    fetchTotalPlayers();
    fetchTotalIncome();
});

function fetchTotalPlayers() {
    const usersRef = ref(database, 'users');
    get(usersRef)
        .then(snapshot => {
            if (snapshot.exists()) {
                const usersData = snapshot.val();
                const totalPlayers = Object.keys(usersData).length;
                document.getElementById("totalplayers").textContent = totalPlayers;
            } else {
                document.getElementById("totalplayers").textContent = "0";
            }
        })
        .catch(error => {
            console.error("Error fetching total players:", error);
            document.getElementById("totalplayers").textContent = "Error";
        });
}

function fetchTotalIncome() {
    const usersRef = ref(database, 'users');
    get(usersRef)
        .then(snapshot => {
            if (!snapshot.exists()) {
                document.getElementById("totalincome").textContent = "₱0";
                return;
            }

            const usersData = snapshot.val();
            let totalIncome = 0;

            for (const uid in usersData) {
                const user = usersData[uid];
                const transactions = user.transactions || {}; // ✅ correct key here

                for (const date in transactions) {
                    const txn = transactions[date];

                    const amount = Number(txn.amount); // ✅ parse amount
                    if (!isNaN(amount)) {
                        totalIncome += amount;
                    }
                }
            }

            document.getElementById("totalincome").textContent = `$${totalIncome.toLocaleString()}`;
        })
        .catch(error => {
            console.error("Error fetching total income:", error);
            document.getElementById("totalincome").textContent = "Error";
        });
}