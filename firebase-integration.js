import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";
import { app } from "./firebase-config.js";

const auth = getAuth(app);
const db = getFirestore(app);

let currentUserId = null;
let isPremiumUser = false;

// --- UI Elements ---
const goPremiumBtn = document.getElementById("go-premium-btn");
const logoutBtn = document.getElementById("logout-btn"); // Assuming you have a logout button in index.html

// --- Subscription Logic ---
async function checkSubscriptionStatus(userId) {
    if (!userId) {
        isPremiumUser = false;
        updatePremiumUI();
        return;
    }

    try {
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            isPremiumUser = userData.isPremium || false;
        } else {
            isPremiumUser = false;
        }
    } catch (error) {
        console.error("Error checking subscription status:", error);
        isPremiumUser = false;
    } finally {
        updatePremiumUI();
    }
}

function updatePremiumUI() {
    if (goPremiumBtn) {
        if (isPremiumUser) {
            goPremiumBtn.classList.add("hidden");
            // Show premium badge
            showPremiumBadge();
        } else {
            goPremiumBtn.classList.remove("hidden");
            hidePremiumBadge();
        }
    }

    // Restrict Analytics tab for non-premium users
    const analyticsTab = document.querySelector(".nav-tab[data-target='analytics']");
    if (analyticsTab) {
        if (!isPremiumUser) {
            analyticsTab.style.pointerEvents = "none";
            analyticsTab.style.opacity = "0.5";
            analyticsTab.title = "Función Premium - Actualiza para desbloquear";
            
            // Add premium lock icon
            if (!analyticsTab.querySelector('.premium-lock')) {
                const lockIcon = document.createElement('i');
                lockIcon.className = 'fas fa-lock premium-lock ml-2';
                lockIcon.style.color = 'var(--yellow)';
                analyticsTab.appendChild(lockIcon);
            }
        } else {
            analyticsTab.style.pointerEvents = "auto";
            analyticsTab.style.opacity = "1";
            analyticsTab.title = "";
            
            // Remove premium lock icon
            const lockIcon = analyticsTab.querySelector('.premium-lock');
            if (lockIcon) {
                lockIcon.remove();
            }
        }
    }

    // Restrict advanced features in operations section
    restrictOperationsFeatures();
    
    // Restrict export functionality
    restrictExportFeatures();
    
    // Show premium prompts in restricted sections
    showPremiumPrompts();
}

function showPremiumBadge() {
    const header = document.querySelector('header h1');
    if (header && !header.querySelector('.premium-badge')) {
        const badge = document.createElement('span');
        badge.className = 'premium-badge';
        badge.innerHTML = '<i class="fas fa-crown mr-1"></i>Premium';
        badge.style.cssText = `
            background-color: var(--primary);
            color: var(--background);
            padding: 0.25rem 0.5rem;
            border-radius: 1rem;
            font-size: 0.75rem;
            font-weight: bold;
            margin-left: 1rem;
        `;
        header.appendChild(badge);
    }
}

function hidePremiumBadge() {
    const badge = document.querySelector('.premium-badge');
    if (badge) {
        badge.remove();
    }
}

function restrictOperationsFeatures() {
    // Limit operations for non-premium users
    if (!isPremiumUser) {
        const operationsTable = document.getElementById('operations-table');
        if (operationsTable) {
            const rows = operationsTable.querySelectorAll('tbody tr');
            if (rows.length > 10) {
                // Hide operations beyond the 10th for non-premium users
                for (let i = 10; i < rows.length; i++) {
                    rows[i].style.display = 'none';
                }
                
                // Add premium prompt
                addPremiumPromptToTable(operationsTable, 'Actualiza a Premium para ver todas tus operaciones');
            }
        }
    } else {
        // Show all operations for premium users
        const operationsTable = document.getElementById('operations-table');
        if (operationsTable) {
            const rows = operationsTable.querySelectorAll('tbody tr');
            rows.forEach(row => {
                row.style.display = '';
            });
            
            // Remove premium prompt
            const prompt = operationsTable.querySelector('.premium-prompt');
            if (prompt) {
                prompt.remove();
            }
        }
    }
}

function restrictExportFeatures() {
    // Disable export buttons for non-premium users
    const exportButtons = document.querySelectorAll('[id*="export"], [class*="export"]');
    exportButtons.forEach(button => {
        if (!isPremiumUser) {
            button.disabled = true;
            button.title = 'Función Premium - Actualiza para exportar datos';
            button.style.opacity = '0.5';
        } else {
            button.disabled = false;
            button.title = '';
            button.style.opacity = '1';
        }
    });
}

function showPremiumPrompts() {
    if (!isPremiumUser) {
        // Add premium prompts to various sections
        addPremiumPromptToSection('analytics', 'Desbloquea análisis avanzados con Premium');
        addPremiumPromptToSection('finances', 'Gestión financiera completa disponible en Premium');
    } else {
        // Remove premium prompts
        document.querySelectorAll('.premium-section-prompt').forEach(prompt => {
            prompt.remove();
        });
    }
}

function addPremiumPromptToTable(table, message) {
    if (!table.querySelector('.premium-prompt')) {
        const promptRow = document.createElement('tr');
        promptRow.className = 'premium-prompt';
        promptRow.innerHTML = `
            <td colspan="100%" style="text-align: center; padding: 2rem; background-color: var(--surface-light);">
                <div style="color: var(--text-secondary); margin-bottom: 1rem;">
                    <i class="fas fa-crown" style="color: var(--yellow); font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <p>${message}</p>
                </div>
                <button onclick="window.location.href='pricing.html'" style="background-color: var(--primary); color: var(--background); padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; font-weight: bold; cursor: pointer;">
                    Ver Planes Premium
                </button>
            </td>
        `;
        table.querySelector('tbody').appendChild(promptRow);
    }
}

function addPremiumPromptToSection(sectionId, message) {
    const section = document.getElementById(sectionId);
    if (section && !section.querySelector('.premium-section-prompt')) {
        const prompt = document.createElement('div');
        prompt.className = 'premium-section-prompt';
        prompt.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(10, 10, 10, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
            border-radius: 0.5rem;
        `;
        prompt.innerHTML = `
            <div style="text-align: center; color: var(--text); padding: 2rem;">
                <i class="fas fa-crown" style="color: var(--yellow); font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3 style="margin-bottom: 1rem; font-size: 1.5rem;">${message}</h3>
                <button onclick="window.location.href='pricing.html'" style="background-color: var(--primary); color: var(--background); padding: 0.75rem 1.5rem; border: none; border-radius: 0.25rem; font-weight: bold; cursor: pointer; font-size: 1rem;">
                    Actualizar a Premium
                </button>
            </div>
        `;
        
        section.style.position = 'relative';
        section.appendChild(prompt);
    }
}

// --- Stripe Checkout ---
async function createCheckoutSession() {
    if (!currentUserId) {
        console.error("User not authenticated");
        return;
    }

    const priceId = 'YOUR_STRIPE_PRICE_ID'; // Replace with your Stripe Price ID

    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ priceId, userId: currentUserId }),
        });

        const { sessionId } = await response.json();
        const stripe = Stripe('YOUR_STRIPE_PUBLISHABLE_KEY'); // Replace with your Stripe Publishable Key
        await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
        console.error("Error creating checkout session:", error);
    }
}

// --- Auth State Change ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        checkSubscriptionStatus(currentUserId);
    } else {
        currentUserId = null;
        isPremiumUser = false;
        updatePremiumUI();
        // Redirect to login if not on auth page
        if (window.location.pathname !== '/auth.html') {
            window.location.href = 'auth.html';
        }
    }
});

// --- Event Listeners ---
if (goPremiumBtn) {
    goPremiumBtn.addEventListener("click", () => {
        window.location.href = 'pricing.html';
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        signOut(auth).catch((error) => {
            console.error("Error signing out:", error);
        });
    });
}

// --- Original Firebase Integration (for CRUD operations) ---
document.addEventListener('DOMContentLoaded', function() {
    integrateFirebaseOperations();
});

function integrateFirebaseOperations() {
    // ... (rest of the original firebase-integration.js code)
}

}

// ... (rest of the original firebase-integration.js code)

