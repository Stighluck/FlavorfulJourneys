import { ref, get, set, child } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";
import { app, database } from "../../firebase/firebase-init.js";

const storage = getStorage(app, "gs://flavorfuljourneys-6e7b1.firebasestorage.app");

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

filterItems.forEach(item => {
    item.addEventListener('click', () => {
        const selectedValue = item.textContent;
        currentFilter = item.dataset.filter;
        filterSelected.textContent = selectedValue;
        filterOptions.style.display = 'none';

        fetchSkins();
    });
});

closeModalBtn.addEventListener('click', () => {
    skinDetailModal.classList.add("hidden");
});

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

function showSkinDetails(skinName) {
    const dbRef = ref(database);

    const normalizedSkinName = skinName.replace(/_/g, ' ').toLowerCase();

    get(child(dbRef, 'skins'))
        .then(snapshot => {
            if (!snapshot.exists()) {
                console.log("Skins not found.");
                return;
            }

            const skinsData = snapshot.val();
            for (const skinKey in skinsData) {

                const normalizedKey = skinKey.replace(/_/g, ' ').toLowerCase();

                if (normalizedKey === normalizedSkinName) {
                    const skin = skinsData[skinKey];
                    currentSkinKey = skinKey;

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

    const updatedPrice = document.getElementById("editSkinPrice").value;
    const updatedTier = document.getElementById("editSkinTier").value;
    const updatedCurrency = document.getElementById("editSkinCurrency").value;
    const updatedImageUrl = document.getElementById("editSkinImageUrl").value;
    const skinName = document.getElementById("skinName").textContent;

    const updatedSkin = {
        name: skinName,
        price: updatedPrice,
        tier: updatedTier,
        currency: updatedCurrency,
        imageUrl: updatedImageUrl,
    };

    set(child(dbRef, `skins/${skinKey}`), updatedSkin)
        .then(() => {
            console.log("Skin details updated successfully!");
            skinDetailModal.classList.add("hidden");
            fetchSkins();
        })
        .catch((error) => {
            console.error("Error updating skin details:", error);
        });
}

fetchSkins();
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

function convertToReadableDate(dateString) {
    const maybeTimestamp = Number(dateString);
    const date = isNaN(maybeTimestamp) ? new Date(dateString) : new Date(maybeTimestamp);
    return date.toLocaleString();
}

const addItemBtn = document.getElementById("addItemBtn");
const addItemModal = document.getElementById("addItemModal");
const closeAddItemModalBtn = document.getElementById("closeAddItemModalBtn");
const saveNewItemBtn = document.getElementById("saveNewItemBtn");

addItemBtn.addEventListener("click", () => {
    addItemModal.classList.remove("hidden");
});

closeAddItemModalBtn.addEventListener("click", () => {
    addItemModal.classList.add("hidden");
});

saveNewItemBtn.addEventListener("click", async () => {
    const name = document.getElementById("newSkinName").value.trim();
    const price = document.getElementById("newSkinPrice").value.trim();
    const tier = document.getElementById("newSkinTier").value.trim();
    const currency = document.getElementById("newSkinCurrency").value.trim();
    const imageFile = document.getElementById("newSkinImage").files[0];

    if (!name || !price || !tier || !currency || !imageFile) {
        alert("Please fill out all fields and select an image.");
        return;
    }

    try {
        const imageRef = storageRef(storage, `skins/${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        const downloadURL = await getDownloadURL(imageRef);

        const dbRef = ref(database, 'skins/' + name.toLowerCase().replace(/\s+/g, '_'));
        await set(dbRef, {
            name: name,
            price: parseInt(price),
            tier: tier,
            currency: currency,
            imageUrl: downloadURL,
        });

        alert("Item added successfully!");
        addItemModal.classList.add("hidden");
        fetchSkins();
    } catch (error) {
        console.error("Error adding item:", error);
        alert("Failed to add item. Check console for details.");
    }
});
