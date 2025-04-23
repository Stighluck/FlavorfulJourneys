import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { ref, get, child, set } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";
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
const newUsernameInput = document.getElementById('newUsername');
const newUserEmailInput = document.getElementById('newUserEmail');

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

        fetchUsers(); // re-fetch and filter users on selection
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
const addUserBtn = document.getElementById('addUserBtn');

// Fetch and render users from the database
async function fetchUsers() {
    const dbRef = ref(database);

    try {
        // Get all users from Realtime DB
        const [snapshot, disabledStatusRes] = await Promise.all([
            get(child(dbRef, 'users')),
            fetch('https://getusersdisabledstatus-kuxppznbpq-uc.a.run.app/getUsersDisabledStatus')
                .then(res => res.json())
        ]);

        if (snapshot.exists()) {
            const usersData = snapshot.val();
            const disabledMap = disabledStatusRes?.statusMap || {};

            const users = Object.entries(usersData).map(([id, data]) => ({
                id,
                ...data,
                disabled: disabledMap[id] ?? false  // Merge in disabled status
            }));

            renderUsers(users);
        } else {
            console.log("No users found.");
        }
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

function renderUsers(users) {
    userTableBody.innerHTML = '';

    const filteredUsers = users.filter(user => {
        // Normalize to boolean
        const isDisabled = user.disabled === true || user.disabled === "true";
        console.log(isDisabled);

        if (currentFilter === 'enabled') return !isDisabled;
        if (currentFilter === 'disabled') return isDisabled;
        return true; // 'all'
    });

    if (filteredUsers.length === 0) {
        userTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No users found</td></tr>`;
    }

    filteredUsers.forEach(user => {
        const isDisabled = user.disabled === true || user.disabled === "true";

        const tr = document.createElement('tr');
        tr.innerHTML = `    
            <td>${user.username || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.userId || 'N/A'}</td>
            <td>
                <button class="reset-password-btn" data-id="${user.id}">Reset Password</button>
                <button class="${isDisabled ? 'reactivate-user-btn' : 'deactivate-user-btn'}" data-id="${user.id}">
                    ${isDisabled ? 'Reactivate User' : 'Deactivate User'}
                </button>
            </td>
        `;
        userTableBody.appendChild(tr);
    });
}

// Add user button event
const addUserModal = document.getElementById('addUserModal');
const confirmAddUserBtn = document.getElementById('confirmAddUser');
const cancelAddUserBtn = document.getElementById('cancelAddUser');


addUserBtn?.addEventListener('click', () => {
    addUserModal.classList.remove('hidden');
    newUsernameInput.value = '';
    newUserEmailInput.value = '';
});

cancelAddUserBtn.addEventListener('click', () => {
    addUserModal.classList.add('hidden');
});

// Confirm adding a new user
confirmAddUserBtn.addEventListener('click', async () => {
    const username = newUsernameInput.value.trim();
    const email = newUserEmailInput.value.trim();
    const DEFAULT_PASSWORD = "Flavorful123";

    if (!username || !email) {
        alert("Please provide both username and email.");
        return;
    }

    showReauthenticationModal(async (adminPassword) => {
        try {
            const adminUser = getAuth().currentUser;
            const credential = EmailAuthProvider.credential(adminUser.email, adminPassword);
            await reauthenticateWithCredential(adminUser, credential);

            const response = await fetch('https://createuser-kuxppznbpq-uc.a.run.app/createUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password: DEFAULT_PASSWORD,
                    username,
                    coins: 0,
                    gems: 0,
                    isVerified: true,
                    termsAndConditions: false,
                    currentStoryLevel: 1,
                })
            });

            const data = await response.json();

            if (data.success && data.uid) {
                // Write user info to Realtime Database
                await set(ref(database, 'users/' + data.userId), {
                    email: email,
                    username: username,
                    coins: 0,
                    gems: 0,
                    isVerified: true,
                    termsAndConditions: false,
                    currentStoryLevel: 1
                });

                addUserModal.classList.add('hidden');
                fetchUsers();
            } else {
                alert("Failed to add user: " + data.error);
            }

        } catch (error) {
            console.error("Error adding user:", error);
            alert("Something went wrong. Please try again.");
        }
    });
});
// Load users on page load
fetchUsers();
let selectedUserIdForDeactivation = null; // Store user ID temporarily for the modal

const disableUserModal = document.getElementById('disableUserModal');
const enableUserModal = document.getElementById('enableUserModal');
const confirmDisableBtn = document.getElementById('confirmDisable');
const closeDisableBtn = document.getElementById('closeDisable');
const confirmEnableBtn = document.getElementById('confirmEnable');
const closeEnableBtn = document.getElementById('closeEnable');


// Handle resetting user password
userTableBody.addEventListener('click', async (e) => {
    const resetPasswordBtn = e.target.closest('.reset-password-btn');
    if (resetPasswordBtn) {
        const userId = resetPasswordBtn.getAttribute('data-id');
        const userRef = ref(database, `users/${userId}`);

        try {
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                const userData = snapshot.val();
                const userEmail = userData.email;

                resetPasswordModal.classList.remove('hidden');
                document.getElementById('confirmResetPassword').onclick = () =>
                    handlePasswordReset(userEmail, userId);
            }
        } catch (err) {
            console.error('Error fetching user data:', err);
        }
    }

    const deactivateUserBtn = e.target.closest('.deactivate-user-btn');
    if (deactivateUserBtn) {
        selectedUserIdForDeactivation = deactivateUserBtn.getAttribute('data-id');
        disableUserModal.classList.remove('hidden');
    }

    const reactivateUserBtn = e.target.closest('.reactivate-user-btn');
    if (reactivateUserBtn) {
        selectedUserIdForDeactivation = reactivateUserBtn.getAttribute('data-id');
        enableUserModal.classList.remove('hidden');
    }
});
confirmEnableBtn.addEventListener('click', () => {
    showReauthenticationModal(async (adminPassword) => {
        try {
            const adminUser = getAuth().currentUser;
            const credential = EmailAuthProvider.credential(adminUser.email, adminPassword);
            await reauthenticateWithCredential(adminUser, credential);

            const response = await fetch('https://enableuser-kuxppznbpq-uc.a.run.app/EnableUser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUserIdForDeactivation })
            });

            const data = await response.json();
            if (data.success) {
                alert("User has been reactivated.");
                fetchUsers();
                enableUserModal.classList.add('hidden');
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            console.error("Error enabling user:", error);
            alert("Failed to reactivate user.");
        }
    });
});

// Handle DISABLE user
confirmDisableBtn.addEventListener('click', () => {
    showReauthenticationModal(async (adminPassword) => {
        try {
            const adminUser = getAuth().currentUser;
            const credential = EmailAuthProvider.credential(adminUser.email, adminPassword);
            await reauthenticateWithCredential(adminUser, credential);

            const response = await fetch('https://disableuser-kuxppznbpq-uc.a.run.app/disableUser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUserIdForDeactivation })
            });

            const data = await response.json();
            if (data.success) {
                alert("User has been deactivated.");
                fetchUsers();
                disableUserModal.classList.add('hidden');
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            console.error("Error disabling user:", error);
            alert("Failed to deactivate user.");
        }
    });
});
function showReauthenticationModal(onReauthSuccess) {
    const reauthenticateModal = document.getElementById('reauthenticateModal');
    const reauthenticateBtn = document.getElementById('reauthenticateBtn');
    const cancelReauthenticateBtn = document.getElementById('cancelReauthenticateBtn');
    const adminPasswordInput = document.getElementById('adminPassword');

    adminPasswordInput.value = ''; // Clear input before showing
    reauthenticateModal.classList.remove('hidden');

    const handleReauth = async () => {
        const adminPassword = adminPasswordInput.value;
        if (adminPassword) {
            await onReauthSuccess(adminPassword);
            reauthenticateModal.classList.add('hidden');
            fetchUsers();
        } else {
            alert("Please enter your admin password.");
        }
    };

    reauthenticateBtn.onclick = handleReauth;
    cancelReauthenticateBtn.onclick = () => reauthenticateModal.classList.add('hidden');
}


async function handlePasswordReset(userEmail, userId) {
    const adminUser = getAuth().currentUser;
    const isAdmin = true;  // Ensure this is your actual admin check logic

    if (isAdmin) {
        const adminPasswordInput = document.getElementById('adminPassword');

        // Show the reauthentication modal
        const reauthenticateModal = document.getElementById('reauthenticateModal');
        reauthenticateModal.classList.remove('hidden'); // Ensure the modal is shown

        const reauthenticateBtn = document.getElementById('reauthenticateBtn');
        const cancelReauthenticateBtn = document.getElementById('cancelReauthenticateBtn');

        // Handle reauthentication button click
        reauthenticateBtn.onclick = async () => {
            const adminPassword = adminPasswordInput.value;
            const DEFAULT_PASSWORD = "Flavorful123";

            if (adminPassword) {
                // Reauthenticate the admin user
                try {
                    const credential = EmailAuthProvider.credential(adminUser.email, adminPassword);
                    await reauthenticateWithCredential(adminUser, credential);

                    // If reauthentication succeeds, call the Firebase Cloud Function to reset the password
                    const response = await fetch('https://resetuserpassword-kuxppznbpq-uc.a.run.app/resetUserPassword', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            userId: userId,
                            newPassword: DEFAULT_PASSWORD // Here, you can specify the new password for the user
                        })
                    });

                    const data = await response.json();
                    if (data.success) {
                        console.log(`Password reset for user: ${userEmail}`);
                        alert("Password has been reset successfully.");
                        resetPasswordModal.classList.add('hidden');  // Hide reset password modal
                        reauthenticateModal.classList.add('hidden');  // Hide reauthenticate modal
                        fetchUsers();  // Refresh the user list
                    } else {
                        alert("Error resetting password: " + data.error);
                    }
                } catch (error) {
                    console.error("Reauthentication failed:", error);
                    alert("Reauthentication failed. Please try again.");
                }
            } else {
                alert("Please enter a valid admin password.");
            }
        };

        // Handle cancel reauthentication button click
        cancelReauthenticateBtn.onclick = () => {
            reauthenticateModal.classList.add('hidden'); // Hide the modal if the user cancels
        };
    } else {
        alert("You are not authorized to perform this action.");
    }
}

// Close the reset password modal
closeResetPasswordModalBtn.addEventListener('click', () => {
    resetPasswordModal.classList.add('hidden');
});

closeDisableBtn.addEventListener('click', () => {
    disableUserModal.classList.add('hidden');
});

closeEnableBtn.addEventListener('click', () => {
    enableUserModal.classList.add('hidden');
});