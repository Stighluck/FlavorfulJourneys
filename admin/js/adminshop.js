import { ref, get, set, child } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";
import { database } from '../../firebase/firebase-init.js';

const filterBtn = document.querySelector('.filter-btn');
const filterOptions = document.querySelector('.filter-options');
const filterSelected = document.querySelector('.filter-selected');
const filterItems = document.querySelectorAll('.filter-options li');
let currentFilter = 'all';
let currentSkinKey = null;

const skinTableBody = document.querySelector('#skinTable tbody');
const skinDetailModal = document.getElementById("skinDetailModal");
const closeModalBtn = document.getElementById("closeModalBtn");

filterBtn.addEventListener('click', () => {
    filterOptions.style.display = filterOptions.style.display === 'block' ? 'none' : 'block';
});

// Handle filter item selection
filterItems.forEach(item => {
    item.addEventListener('click', () => {
        const selectedValue = item.textContent;
        currentFilter = item.dataset.filter; // Save selected filter
        filterSelected.textContent = selectedValue;
        filterOptions.style.display = 'none';

        fetchSkins(); // re-fetch and filter skins on selection
    });
});

// Close the skin details modal
closeModalBtn.addEventListener('click', () => {
    skinDetailModal.classList.add("hidden");
});

// Fetch skins data
async function fetchSkins() {
    const dbRef = ref(database);

    try {
        const snapshot = await get(child(dbRef, 'skins'));
        if (!snapshot.exists()) {
            console.log("No skins found.");
            return;
        }

        const skinsData = snapshot.val();
        let allSkins = [];

        for (const skinName in skinsData) {
            const skin = skinsData[skinName];
            allSkins.push({
                name: skin.name,
                price: skin.price,
                tier: skin.tier,
                currency: skin.currency,
                imageUrl: skin.imageUrl,
            });
        }

        // Apply filters
        if (currentFilter === 'highest') {
            allSkins.sort((a, b) => b.price - a.price);
        } else if (currentFilter === 'lowest') {
            allSkins.sort((a, b) => a.price - b.price);
        }

        renderSkins(allSkins);

    } catch (error) {
        console.error("Error fetching skins:", error);
    }
}

// Render skins to table
function renderSkins(skins) {
    skinTableBody.innerHTML = '';

    if (skins.length === 0) {
        skinTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No skins found</td></tr>`;
        return;
    }

    skins.forEach(skin => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${skin.name}</td>
            <td>${skin.price}</td>
            <td>${skin.tier}</td>
            <td>${skin.currency}</td>
            <td><button class="view-details-btn" data-skin="${skin.name}">View Details</button></td>
        `;
        skinTableBody.appendChild(tr);
    });

    // Add event listeners to view details buttons
    const viewDetailButtons = document.querySelectorAll('.view-details-btn');
    viewDetailButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const skinName = e.target.dataset.skin;
            showSkinDetails(skinName);
        });
    });
}
document.getElementById("saveChangesBtn").addEventListener('click', () => {
    if (currentSkinKey) {
        saveSkinChanges(currentSkinKey);
        skinDetailModal.classList.add("hidden");
        currentSkinKey = null;
        fetchSkins();
    }
});

// Show skin details in modal
function showSkinDetails(skinName) {
    const dbRef = ref(database);

    // Normalize the skin name by removing spaces or underscores and converting to lowercase
    const normalizedSkinName = skinName.replace(/_/g, ' ').toLowerCase();

    get(child(dbRef, 'skins'))
        .then(snapshot => {
            if (!snapshot.exists()) {
                console.log("Skins not found.");
                return;
            }

            const skinsData = snapshot.val();
            for (const skinKey in skinsData) {
                // Normalize the key from Firebase (skin names stored as keys)
                const normalizedKey = skinKey.replace(/_/g, ' ').toLowerCase();

                if (normalizedKey === normalizedSkinName) {
                    const skin = skinsData[skinKey];
                    currentSkinKey = skinKey; // store the key for saving

                    // Populate the modal...
                    document.getElementById("skinName").textContent = skin.name;
                    document.getElementById("editSkinPrice").value = skin.price;
                    document.getElementById("editSkinTier").value = skin.tier;
                    document.getElementById("editSkinCurrency").value = skin.currency;
                    document.getElementById("editSkinImageUrl").value = skin.imageUrl;
                    document.getElementById("skinImage").src = skin.imageUrl;

                    skinDetailModal.classList.remove("hidden");
                    break;
                }
            }
        })
        .catch(error => {
            console.error("Error fetching skin details:", error);
        });
}
function saveSkinChanges(skinKey) {
    const dbRef = ref(database);

    // Get the updated values from the input fields
    const updatedPrice = document.getElementById("editSkinPrice").value;
    const updatedTier = document.getElementById("editSkinTier").value;
    const updatedCurrency = document.getElementById("editSkinCurrency").value;
    const updatedImageUrl = document.getElementById("editSkinImageUrl").value;
    const skinName = document.getElementById("skinName").textContent;
    // Update the skin data in Firebase
    const updatedSkin = {
        name: skinName,
        price: updatedPrice,
        tier: updatedTier,
        currency: updatedCurrency,
        imageUrl: updatedImageUrl,
    };

    // Write the updated data to Firebase
    set(child(dbRef, `skins/${skinKey}`), updatedSkin)
        .then(() => {
            console.log("Skin details updated successfully!");
            skinDetailModal.classList.add("hidden");  // Close the modal after saving changes
            fetchSkins();  // Re-fetch skins to reflect the updates
        })
        .catch((error) => {
            console.error("Error updating skin details:", error);
        });
}

// Fetch skins when the page loads
fetchSkins();
const logoutBtn = document.getElementById("logout");
const modal = document.getElementById("logoutModal");
const confirmLogout = document.getElementById("confirmLogout");
const cancelLogout = document.getElementById("cancelLogout");

// Logout event listeners
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

// Render users table

// Close the reset password modal
function convertToReadableDate(dateString) {
    const maybeTimestamp = Number(dateString);
    const date = isNaN(maybeTimestamp) ? new Date(dateString) : new Date(maybeTimestamp);
    return date.toLocaleString();
}
