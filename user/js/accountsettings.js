import { auth,database } from '../../firebase/firebase-init.js';
import {
    reauthenticateWithCredential,
    EmailAuthProvider,
    updatePassword,
    updateEmail,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";




const emailSection = document.getElementById("emailSection");
const emailSpan = document.getElementById("email");
const emailInput = emailSection.querySelector("input[type='email']");
const saveEmailBtn = emailSection.querySelector(".action-button");

const brevoApiKey = "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";
const senderName = "FlavorfulJourneys";
const senderEmail = "encabo.sean@gmail.com";

auth.onAuthStateChanged(user => {
    if (user) {
        emailSpan.textContent = user.email;
    }
});

async function sendOldEmailNotification(oldEmail, newEmail) {
    const payload = {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: oldEmail }],
        subject: "Your Flavorful Journeys email was changed",
        htmlContent: `
            <p>Hello,</p>
            <p>Your Flavorful Journeys account email has been changed to: <strong>${newEmail}</strong></p>
            <p>If you did not make this change, please contact support immediately.</p>
        `
    };

    try {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": brevoApiKey
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Failed to send Brevo email:", errorText);
        } else {
            console.log("Notification sent to old email.");
        }
    } catch (err) {
        console.error("Error sending Brevo email:", err);
    }
}

async function waitForEmailVerification(user) {
    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            user.reload(); // Refresh user data
            if (user.emailVerified) {
                clearInterval(interval);
                resolve(); // Email is verified, proceed with update
            }
        }, 3000); // Check every 3 seconds

        // Set a timeout to stop the loop after a certain period (optional)
        setTimeout(() => {
            clearInterval(interval);
            reject(new Error("Email verification took too long."));
        }, 60000); // Stop checking after 1 minute
    });
}

saveEmailBtn.addEventListener("click", async () => {
    const newEmail = emailInput.value.trim();

    if (!newEmail) {
        alert("Please enter the new email.");
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        alert("No user is currently logged in.");
        return;
    }

    passwordModal.classList.remove("hidden");

    confirmPasswordBtn.addEventListener("click", async () => {
        const currentPassword = currentPasswordInput.value.trim();

        if (!currentPassword) {
            alert("Please enter your current password.");
            return;
        }

        const credential = EmailAuthProvider.credential(user.email, currentPassword);

        saveEmailBtn.disabled = true;

        try {
            await reauthenticateWithCredential(user, credential);

            const oldEmail = user.email;

            // Step 1: Update email first
            await updateEmail(user, newEmail);

            // Step 2: Send verification to the new email
            await sendEmailVerification(auth.currentUser); // must re-fetch the updated user

            // Step 3: Show alert and wait for verification
            alert("Verification email sent to your new email. Please check and verify before continuing.");

            // Optional: Wait for email verification (like you're doing)
            try {
                await waitForEmailVerification(auth.currentUser); // works since we updated the email
                await sendOldEmailNotification(oldEmail, newEmail);
                alert("Email updated and verified successfully! You will be logged out for security purposes.");
                await auth.signOut();
                window.location.href = "/index.html";
            } catch (error) {
                console.error("Error waiting for email verification:", error);
                alert("There was an issue waiting for email verification.");
            }
        } catch (error) {
            console.error("Email update error:", error);
            switch (error.code) {
                case 'auth/invalid-email':
                    alert("The new email address is invalid.");
                    break;
                case 'auth/email-already-in-use':
                    alert("This email is already in use.");
                    break;
                case 'auth/wrong-password':
                    alert("The current password is incorrect.");
                    break;
                case 'auth/requires-recent-login':
                    alert("Please log in again to update your email.");
                    break;
                case 'auth/operation-not-allowed':  // Handle this specific error
                    alert("You must verify the new email before proceeding.");
                    break;
                default:
                    alert("An error occurred while updating your email.");
            }
            passwordModal.classList.add("hidden");
        } finally {
            saveEmailBtn.disabled = false;
        }
    });

    cancelPasswordBtn.addEventListener("click", () => {
        passwordModal.classList.add("hidden"); // Close the modal on cancel
    });
});

function isStrongPassword(password) {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return strongPasswordRegex.test(password);
}

const updateBtn = document.getElementById("updatePasswordBtn");
updateBtn.addEventListener("click", async () => {
    const currentPassword = document.querySelectorAll("#passwordSection .textbox")[0].value;
    const newPassword = document.querySelectorAll("#passwordSection .textbox")[1].value;
    const confirmPassword = document.querySelectorAll("#passwordSection .textbox")[2].value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert("Please fill in all fields.");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("New passwords do not match.");
        return;
    }

    if (!isStrongPassword(newPassword)) {
        alert("Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.");
        return;
    }

    const user = auth.currentUser;

    if (!user) {
        alert("No user is currently logged in.");
        return;
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    updateBtn.disabled = true;
    try {
        // Re-authenticate the user
        await reauthenticateWithCredential(user, credential);

        // Update the password
        await updatePassword(user, newPassword);
        alert("Password updated successfully! You will be logged out for security purposes.");
        await auth.signOut();
        window.location.href = "/index.html";
    } catch (error) {
        console.error("Password update error:", error);
        switch (error.code) {
            // case 'auth/wrong-password':
            //     alert("The current password is incorrect.");
            //     break;
            case 'auth/weak-password':
                alert("The new password is too weak. Please choose a stronger one.");
                break;
            case 'auth/too-many-requests':
                alert("Too many attempts. Please try again later.");
                break;
            default:
                alert("The current password is incorrect.");
        }
    } finally {
        updateBtn.disabled = false;
    }
});

document.getElementById('toggleEmail').addEventListener('click', () => {
    document.getElementById('emailSection').classList.remove('hidden');
    document.getElementById('passwordSection').classList.add('hidden');
});

document.getElementById('togglePassword').addEventListener('click', () => {
    document.getElementById('passwordSection').classList.remove('hidden');
    document.getElementById('emailSection').classList.add('hidden');
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
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("✅ Logged in as:", user.email);
        console.log("📦 Provider data:", user.providerData);
        console.log("📧 Email verified:", user.emailVerified);
    } else {
        console.warn("❌ No user is currently logged in.");
    }
});