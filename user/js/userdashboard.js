import { auth, database } from '../../firebase/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";


// Now fetch the username
onAuthStateChanged(auth, (user) => {
    if (user) {
        const uid = user.uid;
        const userRef = ref(database, `users/${uid}`);

        get(userRef)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    document.getElementById("username").textContent = userData.username + "!";
                    document.getElementById("coins").textContent = userData.coins;
                    document.getElementById("gems").textContent = userData.gems;
                } else {
                    console.warn("Username not found.");
                }
            })
            .catch((error) => {
                console.error("Error fetching username:", error);
            });

        const transactionsRef = ref(database, `users/${uid}/transactions`);
        get(transactionsRef)
            .then((transSnap) => {
                if (transSnap.exists()) {
                    const transactions = transSnap.val();
                    let totalAmount = 0;

                    Object.values(transactions).forEach((tx) => {
                        totalAmount += parseFloat(tx.amount); // make sure amount is treated as number
                    });

                    console.log("Total amount spent: $" + totalAmount.toFixed(2));

                    // Optionally display it on page
                    const totalElement = document.getElementById("total-amount");
                    if (totalElement) {
                        totalElement.textContent = "$" + totalAmount.toFixed(2);
                    }
                } else {
                    console.log("No transactions found.");
                }
            })
            .catch((err) => {
                console.error("Failed to fetch transactions:", err);
            });
        const currencyTxRef = ref(database, `users/${uid}/currencyTransactions`);
        get(currencyTxRef)
            .then((txSnapshot) => {
                if (txSnapshot.exists()) {
                    const txData = txSnapshot.val();

                    // Get the latest key (largest timestamp)
                    const latestTimestamp = Object.keys(txData).sort((a, b) => b - a)[0];
                    const lastTransaction = txData[latestTimestamp];

                    console.log("Last purchase:", lastTransaction);

                    const lastItemElement = document.getElementById("lastitem");
                    if (lastItemElement) {
                        lastItemElement.textContent = `${lastTransaction.item} ${lastTransaction.currency} - ${lastTransaction.price}`;
                    }
                } else {
                    console.log("No currency transactions found.");
                    document.getElementById("lastitem").textContent = "No purchases yet.";
                }
            })
            .catch((err) => {
                console.error("Failed to fetch currency transactions:", err);
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

