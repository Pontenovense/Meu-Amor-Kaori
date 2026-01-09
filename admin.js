// Use the same Supabase client from auth.js
const supabase = window.supabase.createClient(
    'https://qfhyttwzeicslnrfenyh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaHl0dHd6ZWljc2xucmZlbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MjU4NjYsImV4cCI6MjA4MzUwMTg2Nn0.6fCQBPaT4W_5gbRDIPvdck8I6KlE81-C7nv3sUu2EU4'
);

// Global variables
let editingMonthId = null;
let monthsData = [];

// Initialize admin page
async function initAdmin() {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize auth
    window.Auth.init();

    // Setup event listeners
    setupEventListeners();

    // Load months
    loadMonths();

    // Add CSS for admin styles
    addAdminStyles();
}

// Setup event listeners
function setupEventListeners() {
    const form = document.getElementById('monthForm');
    const addImageButton = document.getElementById('addImageButton');
    const cancelButton = document.getElementById('cancelButton');
    const logoutButton = document.getElementById('logoutButton');

    form.addEventListener('submit', handleFormSubmit);
    addImageButton.addEventListener('click', addImageField);
    cancelButton.addEventListener('click', cancelEdit);
    logoutButton.addEventListener('click', () => window.Auth.handleLogout());
}

// Add admin-specific styles
function addAdminStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .admin-nav {
            text-align: center;
            margin: 20px 0;
        }

        .admin-nav button {
            background: linear-gradient(145deg, #dc143c, #8b0000);
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-family: inherit;
            font-weight: 600;
        }

        .admin-nav button:hover {
            background: linear-gradient(145deg, #ff1744, #b71c1c);
        }

        .admin-main {
            max-width: 1000px;
            margin: 0 auto;
        }

        .admin-section {
            background: rgba(255, 255, 255, 0.9);
            padding: 30px;
            border-radius: 20px;
            margin-bottom: 30px;
            box-shadow: var(--shadow);
        }

        .admin-section h2 {
            color: #333;
            margin-bottom: 20px;
            text-align: center;
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

        .form-group input[type="text"],
        .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-family: inherit;
            font-size: 16px;
        }

        .form-group input:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #dc143c;
        }

        .image-item {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-bottom: 10px;
            padding: 10px;
            background: #f9f9f9;
            border-radius: 8px;
        }

        .image-item input[type="file"] {
            flex: 1;
        }

        .image-item input[type="text"] {
            flex: 2;
        }

        .removeImage {
            background: #f44336;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }

        .removeImage:hover {
            background: #d32f2f;
        }

        #addImageButton {
            background: linear-gradient(145deg, #4CAF50, #45a049);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-family: inherit;
            font-weight: 600;
        }

        #addImageButton:hover {
            background: linear-gradient(145deg, #66BB6A, #4CAF50);
        }

        .form-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 30px;
        }

        .form-actions button {
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-family: inherit;
            font-weight: 600;
            cursor: pointer;
            font-size: 16px;
        }

        #submitButton {
            background: linear-gradient(145deg, #dc143c, #8b0000);
            color: white;
        }

        #submitButton:hover {
            background: linear-gradient(145deg, #ff1744, #b71c1c);
        }

        #cancelButton {
            background: #757575;
            color: white;
        }

        #cancelButton:hover {
            background: #616161;
        }

        .months-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }

        .month-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: var(--shadow);
            border: 2px solid #eee;
        }

        .month-card h3 {
            color: #333;
            margin-bottom: 10px;
        }

        .month-card p {
            color: #666;
            font-size: 14px;
            margin-bottom: 15px;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .month-images {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-bottom: 15px;
        }

        .month-image-thumb {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 6px;
            border: 2px solid #ddd;
        }

        .month-actions {
            display: flex;
            gap: 10px;
        }

        .month-actions button {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-family: inherit;
            font-weight: 600;
            font-size: 14px;
        }

        .edit-btn {
            background: #2196F3;
            color: white;
        }

        .edit-btn:hover {
            background: #1976D2;
        }

        .delete-btn {
            background: #f44336;
            color: white;
        }

        .delete-btn:hover {
            background: #d32f2f;
        }

        .confirm-modal {
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

        .confirm-modal.show {
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .confirm-modal-content {
            background: white;
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            max-width: 400px;
            width: 90%;
        }

        .confirm-modal h3 {
            margin-bottom: 15px;
            color: #333;
        }

        .confirm-modal p {
            margin-bottom: 25px;
            color: #666;
        }

        .confirm-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
        }

        .confirm-actions button {
            padding: 10px 25px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-family: inherit;
            font-weight: 600;
        }

        #confirmYes {
            background: #f44336;
            color: white;
        }

        #confirmYes:hover {
            background: #d32f2f;
        }

        #confirmNo {
            background: #757575;
            color: white;
        }

        #confirmNo:hover {
            background: #616161;
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }

        .error {
            background: #ffebee;
            color: #c62828;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #ffcdd2;
        }

        .success {
            background: #e8f5e8;
            color: #2e7d32;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #c8e6c9;
        }

        @media (max-width: 768px) {
            .admin-section {
                padding: 20px;
            }

            .form-actions {
                flex-direction: column;
            }

            .month-actions {
                flex-direction: column;
            }

            .months-grid {
                grid-template-columns: 1fr;
            }

            .image-item {
                flex-direction: column;
                align-items: stretch;
            }

            .image-item input[type="text"] {
                margin-top: 5px;
            }
        }
    `;
    document.head.appendChild(style);
}

// Load months from database
async function loadMonths() {
    const monthsList = document.getElementById('monthsList');
    monthsList.innerHTML = '<p>Carregando meses...</p>';

    try {
        const { data: months, error } = await supabase
            .from('months')
            .select(`
                *,
                images (*)
            `)
            .order('name');

        if (error) throw error;

        monthsData = months;
        displayMonths(months);
    } catch (error) {
        console.error('Erro ao carregar meses:', error);
        monthsList.innerHTML = '<p class="error">Erro ao carregar meses. Tente novamente.</p>';
    }
}

// Display months in the UI
function displayMonths(months) {
    const monthsList = document.getElementById('monthsList');

    if (months.length === 0) {
        monthsList.innerHTML = '<p>Nenhum mês cadastrado ainda.</p>';
        return;
    }

    const monthsGrid = document.createElement('div');
    monthsGrid.className = 'months-grid';

    months.forEach(month => {
        const monthCard = createMonthCard(month);
        monthsGrid.appendChild(monthCard);
    });

    monthsList.innerHTML = '';
    monthsList.appendChild(monthsGrid);
}

// Create month card element
function createMonthCard(month) {
    const card = document.createElement('div');
    card.className = 'month-card';

    const imagesHtml = month.images && month.images.length > 0
        ? month.images.slice(0, 4).map(img => `<img src="${img.url}" alt="${img.alt || ''}" class="month-image-thumb">`).join('')
        : '<p style="color: #999; font-style: italic;">Sem imagens</p>';

    card.innerHTML = `
        <h3>${month.name}</h3>
        <p>${month.description || 'Sem descrição'}</p>
        <div class="month-images">
            ${imagesHtml}
        </div>
        <div class="month-actions">
            <button class="edit-btn" onclick="editMonth('${month.id}')">Editar</button>
            <button class="delete-btn" onclick="deleteMonth('${month.id}', '${month.name}')">Excluir</button>
        </div>
    `;

    return card;
}

// Add image field to form
function addImageField() {
    const container = document.getElementById('imagesContainer');
    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';

    imageItem.innerHTML = `
        <input type="file" accept="image/*" class="imageFile">
        <input type="text" placeholder="Descrição da imagem (opcional)" class="imageDesc">
        <button type="button" class="removeImage">Remover</button>
    `;

    // Add remove functionality
    imageItem.querySelector('.removeImage').addEventListener('click', () => {
        imageItem.remove();
    });

    container.appendChild(imageItem);
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();

    const submitButton = document.getElementById('submitButton');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Salvando...';
    submitButton.disabled = true;

    try {
        const monthName = document.getElementById('monthName').value.trim();
        const monthDescription = document.getElementById('monthDescription').value.trim();

        // Get image files
        const imageFiles = Array.from(document.querySelectorAll('.imageFile')).filter(input => input.files[0]);
        const imageDescs = Array.from(document.querySelectorAll('.imageDesc'));

        if (editingMonthId) {
            // Update existing month
            await updateMonth(editingMonthId, monthName, monthDescription, imageFiles, imageDescs);
        } else {
            // Create new month
            await createMonth(monthName, monthDescription, imageFiles, imageDescs);
        }

        // Reset form and reload
        resetForm();
        loadMonths();

        showMessage('Mês salvo com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar mês:', error);
        showMessage('Erro ao salvar mês: ' + error.message, 'error');
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Create new month
async function createMonth(name, description, imageFiles, imageDescs) {
    // Insert month
    const { data: month, error: monthError } = await supabase
        .from('months')
        .insert([{ name, description }])
        .select()
        .single();

    if (monthError) throw monthError;

    // Upload images if any
    if (imageFiles.length > 0) {
        await uploadImages(month.id, imageFiles, imageDescs);
    }
}

// Update existing month
async function updateMonth(monthId, name, description, imageFiles, imageDescs) {
    // Update month
    const { error: monthError } = await supabase
        .from('months')
        .update({ name, description })
        .eq('id', monthId);

    if (monthError) throw monthError;

    // Upload new images if any
    if (imageFiles.length > 0) {
        await uploadImages(monthId, imageFiles, imageDescs);
    }
}

// Upload images to Supabase Storage
async function uploadImages(monthId, imageFiles, imageDescs) {
    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i].files[0];
        const desc = imageDescs[i]?.value || '';

        if (!file) continue;

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(fileName);

        // Insert image record
        const { error: imageError } = await supabase
            .from('images')
            .insert([{
                month_id: monthId,
                url: publicUrl,
                alt: desc,
                description: desc,
                image_order: i
            }]);

        if (imageError) throw imageError;
    }
}

// Edit month
function editMonth(monthId) {
    const month = monthsData.find(m => m.id === monthId);
    if (!month) return;

    editingMonthId = monthId;

    // Fill form
    document.getElementById('monthName').value = month.name;
    document.getElementById('monthDescription').value = month.description || '';

    // Clear existing image fields
    const container = document.getElementById('imagesContainer');
    container.innerHTML = '';

    // Update UI
    document.getElementById('formTitle').textContent = 'Editar Mês';
    document.getElementById('submitButton').textContent = 'Atualizar Mês';
    document.getElementById('cancelButton').style.display = 'inline-block';

    // Scroll to form
    document.querySelector('.admin-section').scrollIntoView({ behavior: 'smooth' });
}

// Delete month
function deleteMonth(monthId, monthName) {
    const modal = document.getElementById('confirmModal');
    const title = document.getElementById('confirmTitle');
    const message = document.getElementById('confirmMessage');

    title.textContent = 'Excluir Mês';
    message.textContent = `Tem certeza que deseja excluir o mês "${monthName}"? Esta ação não pode ser desfeita.`;

    modal.classList.add('show');

    // Setup confirmation buttons
    document.getElementById('confirmYes').onclick = async () => {
        modal.classList.remove('show');

        try {
            const { error } = await supabase
                .from('months')
                .delete()
                .eq('id', monthId);

            if (error) throw error;

            loadMonths();
            showMessage('Mês excluído com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao excluir mês:', error);
            showMessage('Erro ao excluir mês: ' + error.message, 'error');
        }
    };

    document.getElementById('confirmNo').onclick = () => {
        modal.classList.remove('show');
    };
}

// Cancel edit
function cancelEdit() {
    resetForm();
}

// Reset form
function resetForm() {
    editingMonthId = null;
    document.getElementById('monthForm').reset();
    document.getElementById('imagesContainer').innerHTML = `
        <div class="image-item">
            <input type="file" accept="image/*" class="imageFile">
            <input type="text" placeholder="Descrição da imagem (opcional)" class="imageDesc">
            <button type="button" class="removeImage" style="display: none;">Remover</button>
        </div>
    `;
    document.getElementById('formTitle').textContent = 'Adicionar Novo Mês';
    document.getElementById('submitButton').textContent = 'Salvar Mês';
    document.getElementById('cancelButton').style.display = 'none';
}

// Show message
function showMessage(message, type) {
    const existingMessage = document.querySelector('.success, .error');
    if (existingMessage) existingMessage.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = type;
    messageDiv.textContent = message;

    const form = document.getElementById('monthForm');
    form.parentNode.insertBefore(messageDiv, form);

    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAdmin);

// Make functions global for onclick handlers
window.editMonth = editMonth;
window.deleteMonth = deleteMonth;
