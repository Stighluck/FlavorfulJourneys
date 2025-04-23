import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { ref, get, child } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";
import { auth, database } from '../../firebase/firebase-init.js'; // Ensure this import is correct

// Other UI Elements
const logoutBtn = document.getElementById("logout");
const modal = document.getElementById("logoutModal");
const confirmLogout = document.getElementById("confirmLogout");
const cancelLogout = document.getElementById("cancelLogout");
const resetPasswordModal = document.getElementById("resetPasswordModal");
const closeResetPasswordModalBtn = document.getElementById("closeResetPasswordModal");
const filterBtn = document.querySelector('.filter-btn');
const filterOptions = document.querySelector('.filter-options');
const filterSelected = document.querySelector('.filter-selected');
const filterItems = document.querySelectorAll('.filter-options li');
let currentFilter = 'all';


// Toggle dropdown
filterBtn.addEventListener('click', () => {
    filterOptions.style.display = filterOptions.style.display === 'block' ? 'none' : 'block';
});

// Handle selection
filterItems.forEach(item => {
    item.addEventListener('click', () => {
        const selectedValue = item.textContent;
        currentFilter = item.dataset.filter; // save selected filter
        filterSelected.textContent = selectedValue;
        filterOptions.style.display = 'none';

        fetchTransactions(); // re-fetch and filter users on selection
    });
});

// Optional: Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!document.querySelector('.filter-container').contains(e.target)) {
        filterOptions.style.display = 'none';
    }
});

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
const userTableBody = document.querySelector('#userTable tbody');

async function fetchTransactions() {
    const dbRef = ref(database);

    try {
        const snapshot = await get(child(dbRef, 'users'));
        if (!snapshot.exists()) {
            console.log("No users found.");
            return;
        }

        const usersData = snapshot.val();
        let allTransactions = [];

        for (const uid in usersData) {
            const user = usersData[uid];
            const transactions = user.transactions;

            if (transactions) {
                for (const date in transactions) {
                    const txn = transactions[date];
                    allTransactions.push({
                        username: user.username || 'N/A',
                        email: user.email || 'N/A',
                        transactionId: txn.transactionId || 'N/A',
                        amount: txn.amount || 0,
                        gems: txn.gems || 0,
                        date: date
                    });
                }
            }
        }

        // Apply filters
        if (currentFilter === 'latest') {
            allTransactions.sort((a, b) => Number(b.date) - Number(a.date));
        } else if (currentFilter === 'oldest') {
            allTransactions.sort((a, b) => Number(a.date) - Number(b.date));
        } else if (currentFilter === 'highest') {
            allTransactions.sort((a, b) => b.amount - a.amount);
        } else if (currentFilter === 'lowest') {
            allTransactions.sort((a, b) => a.amount - b.amount);
        }

        renderTransactions(allTransactions);
    } catch (error) {
        console.error("Error fetching transactions:", error);
    }
}

function renderTransactions(transactions) {
    userTableBody.innerHTML = '';

    if (transactions.length === 0) {
        userTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No transactions found</td></tr>`;
        return;
    }

    transactions.forEach(txn => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${txn.username || 'N/A'}</td>
            <td>${txn.email || 'N/A'}</td>
            <td>${convertToReadableDate(txn.date) || 'N/A'}</td> <!-- Convert the date key instead -->
            <td>${txn.transactionId || 'N/A'}</td>
            <td>${txn.amount || 0}</td>
            <td>${txn.gems || 0}</td>
        `;
        userTableBody.appendChild(tr);
    });
}

// Replace old fetchUsers with this
fetchTransactions();
// Close the reset password modal
function convertToReadableDate(dateString) {
    const maybeTimestamp = Number(dateString);
    const date = isNaN(maybeTimestamp) ? new Date(dateString) : new Date(maybeTimestamp);
    return date.toLocaleString();
}
