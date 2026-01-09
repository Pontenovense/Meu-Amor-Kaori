// Use the global Supabase client
const supabase = window.supabaseClient;

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
