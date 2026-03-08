import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Your Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCERz5-2upWt44cfaoU5rXgFBcQWDOSf1w",
    authDomain: "rapid-rescue-2d536.firebaseapp.com",
    projectId: "rapid-rescue-2d536",
    storageBucket: "rapid-rescue-2d536.firebasestorage.app",
    messagingSenderId: "929402119690",
    appId: "1:929402119690:web:b1a38a49d62919293e21f3",
    measurementId: "G-XGJMTT965H"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Watch for login/logout state changes across the whole site
onAuthStateChanged(auth, (user) => {
    const signinItem = document.getElementById('nav-signin-item');
    const logoutItem = document.getElementById('nav-logout-item');
    const welcomeText = document.getElementById('welcome-text');

    if (user) {
        // --- USER IS LOGGED IN ---
        if (signinItem) signinItem.style.display = 'none';
        if (logoutItem) logoutItem.style.display = 'flex'; // Using flex to keep alignment perfect

        // If they are on the dashboard, update the greeting
        if (welcomeText) {
            const username = user.email.split('@')[0];
            const formattedName = username.charAt(0).toUpperCase() + username.slice(1);
            welcomeText.innerHTML = `Hi, ${formattedName}! <br><span style="font-size: 18px; color: #666;">Emergency Dashboard</span>`;
        }
    } else {
        // --- USER IS LOGGED OUT ---
        if (signinItem) signinItem.style.display = 'block';
        if (logoutItem) logoutItem.style.display = 'none';

        // ONLY redirect to sign in if they are trying to peek at the protected Dashboard
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = "signin.html";
        } else if (welcomeText) {
             welcomeText.innerHTML = `Emergency Dashboard <br><span style="font-size: 14px; color: #e74c3c;">(Viewing as Guest)</span>`;
        }
    }
});

// Handle Log Out Button Click
// We attach this to the document so it works on any page the button exists on
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'nav-logout-btn') {
        if(confirm("Are you sure you want to log out?")) {
            signOut(auth).then(() => {
                window.location.reload(); // Refresh the page to reset the UI
            }).catch((error) => console.error("Error signing out:", error));
        }
    }
});