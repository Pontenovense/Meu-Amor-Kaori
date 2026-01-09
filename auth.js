// Create global Supabase client (only if not exists)
if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(
        'https://qfhyttwzeicslnrfenyh.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaHl0dHd6ZWljc2xucmZlbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MjU4NjYsImV4cCI6MjA4MzUwMTg2Nn0.6fCQBPaT4W_5gbRDIPvdck8I6KlE81-C7nv3sUu2EU4'
    );
}

// Authentication module to avoid global variable conflicts
window.AuthModule = (function() {
    // Private variables (scoped to this module)
    let authModal = null;
    let loginForm = null;
    let logoutButton = null;
    let adminLink = null;
    let currentUser = null;

// Initialize authentication
function initAuth() {
    console.log('🔐 Inicializando sistema de autenticação...');

    try {
        // Create auth modal
        createAuthModal();
        console.log('✅ Modal de autenticação criado');

        // Get DOM elements
        adminLink = document.getElementById('adminLink');
        logoutButton = document.getElementById('logoutButton');
        console.log('✅ Elementos DOM obtidos');

        // Check current session
        checkSession();

        // Listen for auth state changes
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('🔄 Mudança de estado de auth:', event, session?.user?.email);
            currentUser = session?.user || null;
            updateUI();
        });

        console.log('🎉 Sistema de autenticação inicializado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao inicializar autenticação:', error);
    }
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
        /* Authentication Modal - Modern and Presentable */
        .auth-modal {
            display: none;
            position: fixed;
            z-index: 3000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(10px);
            animation: fadeInModal 0.3s ease;
        }

        .auth-modal.show {
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .auth-modal-content {
            background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
            padding: 40px;
            border-radius: 20px;
            width: 90%;
            max-width: 450px;
            position: relative;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            animation: slideInModal 0.3s ease;
            overflow: hidden;
        }

        .auth-modal-content::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, #dc143c, #4ecdc4);
        }

        .auth-close {
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            background: rgba(102, 102, 102, 0.1);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all 0.3s ease;
        }

        .auth-close:hover {
            color: #dc143c;
            background: rgba(220, 20, 60, 0.1);
            transform: scale(1.1);
        }

        .auth-modal h2 {
            text-align: center;
            margin-bottom: 30px;
            color: #2c3e50;
            font-family: 'Alice', serif;
            font-size: 28px;
            font-weight: 700;
            position: relative;
        }

        .auth-modal h2::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 50px;
            height: 2px;
            background: linear-gradient(90deg, #dc143c, #4ecdc4);
            border-radius: 1px;
        }

        .form-group {
            margin-bottom: 25px;
            position: relative;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #37474f;
            font-size: 16px;
        }

        .form-group input {
            width: 100%;
            padding: 15px 18px;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            font-size: 16px;
            font-family: 'Alice', serif;
            transition: all 0.3s ease;
            background: #fafafa;
            box-sizing: border-box;
        }

        .form-group input:focus {
            outline: none;
            border-color: #dc143c;
            background: white;
            box-shadow: 0 0 0 3px rgba(220, 20, 60, 0.1);
            transform: translateY(-1px);
        }

        .form-group input::placeholder {
            color: #9e9e9e;
        }

        .auth-submit {
            width: 100%;
            padding: 15px;
            background: linear-gradient(145deg, #dc143c, #8b0000);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: 'Alice', serif;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(220, 20, 60, 0.3);
        }

        .auth-submit::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
        }

        .auth-submit:hover::before {
            left: 100%;
        }

        .auth-submit:hover {
            background: linear-gradient(145deg, #ff1744, #b71c1c);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(220, 20, 60, 0.4);
        }

        .auth-submit:active {
            transform: translateY(0);
        }

        #authMessage {
            margin-top: 20px;
            text-align: center;
            min-height: 24px;
            font-weight: 500;
            border-radius: 8px;
            padding: 8px;
            transition: all 0.3s ease;
        }

        .auth-success {
            color: #2e7d32;
            background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
            border: 1px solid #81c784;
        }

        .auth-error {
            color: #c62828;
            background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
            border: 1px solid #e57373;
        }

        /* Animations */
        @keyframes fadeInModal {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideInModal {
            from {
                opacity: 0;
                transform: scale(0.9) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }

        /* Responsive Design */
        @media (max-width: 480px) {
            .auth-modal-content {
                padding: 25px;
                margin: 20px;
                border-radius: 16px;
            }

            .auth-modal h2 {
                font-size: 24px;
                margin-bottom: 20px;
            }

            .form-group input {
                padding: 12px 15px;
                font-size: 16px; /* Prevent zoom on iOS */
            }

            .auth-submit {
                padding: 12px;
                font-size: 15px;
            }

            .auth-close {
                top: 15px;
                right: 15px;
                width: 35px;
                height: 35px;
                font-size: 20px;
            }
        }

        @media (max-width: 360px) {
            .auth-modal-content {
                padding: 20px;
                margin: 15px;
            }

            .auth-modal h2 {
                font-size: 20px;
            }

            .form-group {
                margin-bottom: 20px;
            }

            .form-group input {
                padding: 10px 12px;
            }

            .auth-submit {
                padding: 10px;
                font-size: 14px;
            }
        }
    `;
    document.head.appendChild(style);
}

// Check current session
async function checkSession() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
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
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
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
    const { error } = await window.supabaseClient.auth.signOut();
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
        authButton.textContent = isLoggedIn ? 'Logout' : 'Login';
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
    showLoginPrompt: showLoginPrompt,
    handleLogout: handleLogout
};

    // Return public API
    return {
        init: initAuth,
        isLoggedIn: () => !!currentUser,
        getUser: () => currentUser,
        showLoginPrompt: showLoginPrompt
    };
})();
