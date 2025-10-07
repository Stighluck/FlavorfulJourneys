import { auth, database } from '../../firebase/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { ref, get, getDatabase } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";

const db = getDatabase();

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../index.html";
        return;
    }

    const uid = user.uid;
    const transRef = ref(db, `users/${uid}/currencyTransactions`);
    const skinsRef = ref(db, "skins");

    try {
        // Fetch both user transactions and all skins
        const [transSnap, skinsSnap] = await Promise.all([get(transRef), get(skinsRef)]);

        if (!transSnap.exists()) {
            console.log("No transaction history found.");
            return;
        }

        const transactions = transSnap.val();
        const skins = skinsSnap.exists() ? skinsSnap.val() : {};

        const tableBody = document.getElementById("transactionBody");
        tableBody.innerHTML = ""; // clear any previous rows

        Object.entries(transactions)
            .sort((a, b) => b[0] - a[0])
            .forEach(([timestamp, txn]) => {
                const row = document.createElement("tr");
                const date = new Date(Number(timestamp)).toLocaleString();

                let imageUrl = "";

                // Normalize helper (makes matching flexible)
                const normalize = str => str?.toLowerCase().replace(/_/g, "").trim();

                // Loop through all skins
                console.log("🔥 All skins from database:", skins);
                console.log("🧾 Current transaction item:", txn.item);

                for (const [skinKey, skinData] of Object.entries(skins)) {
                    console.log("Checking skin:", skinKey, "with name:", skinData.name);

                    if (
                        normalize(skinKey) === normalize(txn.item) ||
                        normalize(skinData.name) === normalize(txn.item)
                    ) {
                        console.log("✅ MATCH FOUND:", skinKey, "->", skinData.imageUrl);
                        imageUrl = skinData.imageUrl;
                        break;
                    }
                }

                // Fallback if no image
                if (!imageUrl)
                    imageUrl = "../assets/no-image.png";

                // ✅ Debug log for clarity
                console.log(`Transaction: ${txn.item} | Matched Image: ${imageUrl}`);

                row.innerHTML = `
                    <td>${date}</td>
                    <td>${txn.item || "N/A"}</td>
                    <td>${txn.currency || "N/A"}</td>
                    <td>$${parseFloat(txn.price).toFixed(2)}</td>
                    <td>${txn.transactionId}</td>
                    <td><button class="view-btn" data-img="${imageUrl}">View</button></td>
                `;

                tableBody.appendChild(row);
            });

        // Add view button logic
        const imageModal = document.getElementById("imageModal");
        const previewImage = document.getElementById("previewImage");
        const closeImageModal = document.getElementById("closeImageModal");

        document.querySelectorAll(".view-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const imgSrc = btn.getAttribute("data-img");
                previewImage.src = imgSrc;
                imageModal.classList.remove("hidden");
            });
        });

        closeImageModal.addEventListener("click", () => {
            imageModal.classList.add("hidden");
            previewImage.src = "";
        });

    } catch (error) {
        console.error("Failed to load data:", error);
    }
});
