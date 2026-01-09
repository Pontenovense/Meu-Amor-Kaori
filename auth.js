// Supabase configuration
const SUPABASE_URL = 'https://qfhyttwzeicslnrfenyh.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaHl0dHd6ZWljc2xucmZlbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MjU4NjYsImV4cCI6MjA4MzUwMTg2Nn0.6fCQBPaT4W_5gbRDIPvdck8I6KlE81-C7nv3sUu2EU4'; // Replace with your Supabase anon key

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Authentication state
let currentUser = null;

// DOM elements
let authModal = null;
let loginForm = null;
let logoutButton = null;
let adminLink = null;

// Initialize authentication
function initAuth() {
    // Create auth modal
    createAuthModal();

    // Get DOM elements
    adminLink = document.getElementById('adminLink');
    logoutButton = document.getElementById('logoutButton');

    // Check current session
    checkSession();

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user || null;
        updateUI();
    });
}

// Create authentication modal
function createAuthModal() {
    authModal = document.createElement('div');
    authModal.className = 'auth-modal';
    authModal.innerHTML = `
        <div class="auth-modal-content">
            <span class="auth-close">&times;</span>
            <h2>Login Administrativo</h2>
            <form id="loginForm">
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Senha:</label>
                    <input type="password" id="password" required>
                </div>
                <button type="submit" class="auth-submit">Entrar</button>
            </form>
            <div id="authMessage"></div>
        </div>
    `;
    document.body.appendChild(authModal);

    // Get form element
    loginForm = document.getElementById('loginForm');

    // Event listeners
    document.querySelector('.auth-close').addEventListener('click', closeAuthModal);
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) closeAuthModal();
    });
    loginForm.addEventListener('submit', handleLogin);

    // Add CSS for modal
    addAuthStyles();
}

// Add authentication styles
function addAuthStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .auth-modal {
            display: none;
            position: fixed;
            z-index: 3000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
        }

        .auth-modal.show {
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .auth-modal-content {
            background: white;
            padding: 30px;
            border-radius: 20px;
            width: 90%;
            max-width: 400px;
            position: relative;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .auth-close {
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 28px;
            cursor: pointer;
            color: #666;
        }

        .auth-close:hover {
            color: #dc143c;
        }

        .auth-modal h2 {
            text-align: center;
            margin-bottom: 25px;
            color: #333;
            font-family: 'Alice', serif;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #555;
        }

        .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            font-family: inherit;
            transition: border-color 0.3s;
        }

        .form-group input:focus {
            outline: none;
            border-color: #dc143c;
        }

        .auth-submit {
            width: 100%;
            padding: 12px;
            background: linear-gradient(145deg, #dc143c, #8b0000);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .auth-submit:hover {
            background: linear-gradient(145deg, #ff1744, #b71c1c);
            transform: translateY(-2px);
        }

        #authMessage {
            margin-top: 15px;
            text-align: center;
            min-height: 20px;
        }

        .auth-success {
            color: #4CAF50;
        }

        .auth-error {
            color: #f44336;
        }

        @media (max-width: 480px) {
            .auth-modal-content {
                padding: 20px;
                margin: 20px;
            }

            .auth-modal h2 {
                font-size: 24px;
            }
        }
    `;
    document.head.appendChild(style);
}

// Check current session
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    currentUser = session?.user || null;
    updateUI();
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const messageDiv = document.getElementById('authMessage');
    messageDiv.textContent = 'Fazendo login...';
    messageDiv.className = '';

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        messageDiv.textContent = 'Login realizado com sucesso!';
        messageDiv.className = 'auth-success';

        setTimeout(() => {
            closeAuthModal();
        }, 1500);

    } catch (error) {
        messageDiv.textContent = error.message || 'Erro no login';
        messageDiv.className = 'auth-error';
    }
}

// Handle logout
async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Erro no logout:', error);
    }
}

// Open auth modal
function openAuthModal() {
    authModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Close auth modal
function closeAuthModal() {
    authModal.classList.remove('show');
    document.body.style.overflow = 'auto';
    loginForm.reset();
    document.getElementById('authMessage').textContent = '';
}

// Update UI based on auth state
function updateUI() {
    const isLoggedIn = !!currentUser;

    if (adminLink) {
        adminLink.style.display = isLoggedIn ? 'inline-block' : 'none';
    }

    if (logoutButton) {
        logoutButton.style.display = isLoggedIn ? 'inline-block' : 'none';
    }

    // Update nav button text
    const authButton = document.getElementById('authButton');
    if (authButton) {
        authButton.textContent = isLoggedIn ? 'Logout' : 'Admin';
        authButton.onclick = isLoggedIn ? handleLogout : openAuthModal;
    }
}

// Show login prompt
function showLoginPrompt() {
    openAuthModal();
}

// Export functions for global use
window.Auth = {
    init: initAuth,
    isLoggedIn: () => !!currentUser,
    getUser: () => currentUser,
    showLoginPrompt: showLoginPrompt
};
