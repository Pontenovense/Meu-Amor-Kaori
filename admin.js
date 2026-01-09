// Use the global Supabase client

// Global variables
let editingMonthId = null;
let monthsData = [];
let editingMusicId = null;
let musicData = [];

// Initialize admin page
async function initAdmin() {
    console.log('🚀 initAdmin called');
    try {
        // Check authentication
        console.log('🔐 Checking authentication...');
        const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
        if (sessionError) {
            console.error('❌ Session error:', sessionError);
        }
        console.log('📋 Session check result:', session ? 'authenticated' : 'not authenticated');

        if (!session) {
            console.log('🔄 Redirecting to index.html (not authenticated)');
            window.location.href = 'index.html';
            return;
        }

        // Initialize auth
        console.log('🔧 Initializing auth...');
        window.Auth.init();

        // Setup event listeners
        console.log('🎧 Setting up event listeners...');
        setupEventListeners();

        // Load months
        console.log('📅 Loading months...');
        loadMonths();

        // Load music
        console.log('🎵 Loading music...');
        loadMusic();

        console.log('✅ Admin initialization complete');
    } catch (error) {
        console.error('❌ Error in initAdmin:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    const form = document.getElementById('monthForm');
    const addImageButton = document.getElementById('addImageButton');
    const cancelButton = document.getElementById('cancelButton');
    const logoutButton = document.getElementById('logoutButton');

    const musicForm = document.getElementById('musicForm');
    const musicCancelButton = document.getElementById('musicCancelButton');

    if (form) form.addEventListener('submit', handleFormSubmit);
    if (addImageButton) addImageButton.addEventListener('click', addImageField);
    if (cancelButton) cancelButton.addEventListener('click', cancelEdit);
    if (logoutButton) logoutButton.addEventListener('click', () => window.Auth.handleLogout());

    if (musicForm) musicForm.addEventListener('submit', handleMusicFormSubmit);
    if (musicCancelButton) musicCancelButton.addEventListener('click', cancelMusicEdit);
}



// Load months from database
async function loadMonths() {
    console.log('🔄 loadMonths called');
    const monthsList = document.getElementById('monthsList');
    if (!monthsList) {
        console.error('❌ monthsList element not found');
        return;
    }
    monthsList.innerHTML = '<p>Carregando meses...</p>';

    try {
        console.log('🔍 Querying months from database...');
        const { data: months, error } = await window.supabaseClient
            .from('months')
            .select(`
                *,
                images (*)
            `)
            .order('name');

        if (error) {
            console.error('❌ Database query error:', error);
            throw error;
        }

        console.log('✅ Database query successful, months:', months?.length || 0);
        monthsData = months;
        displayMonths(months);
    } catch (error) {
        console.error('❌ Error loading months:', error);
        monthsList.innerHTML = '<p class="error">Erro ao carregar meses. Tente novamente.</p>';
    }
}

// Display months in the UI
function displayMonths(months) {
    const monthsList = document.getElementById('monthsList');
    console.log('📋 Displaying months:', months?.length || 0, 'months found');

    if (months.length === 0) {
        monthsList.innerHTML = '<p>Nenhum mês cadastrado ainda.</p>';
        return;
    }

    const monthsGrid = document.createElement('div');
    monthsGrid.className = 'months-grid';

    // Sort months chronologically
    const sortedMonths = sortMonthsChronologically(months);
    console.log('📅 Months sorted chronologically:', sortedMonths.map(m => m.name));

    sortedMonths.forEach(month => {
        const monthCard = createMonthCard(month);
        monthsGrid.appendChild(monthCard);
    });

    monthsList.innerHTML = '';
    monthsList.appendChild(monthsGrid);
    console.log('✅ Months displayed successfully');

    // Add drag and drop functionality
    setupDragAndDrop(monthsGrid);
}

// Sort months by order, then chronologically
function sortMonthsChronologically(months) {
    const monthOrder = {
        'janeiro': 1, 'fevereiro': 2, 'março': 3, 'abril': 4, 'maio': 5, 'junho': 6,
        'julho': 7, 'agosto': 8, 'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
    };

    return months.sort((a, b) => {
        // First sort by month_order
        if (a.month_order !== b.month_order) {
            return (a.month_order || 0) - (b.month_order || 0);
        }
        // Then by name
        const normalizeName = (name) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const monthA = monthOrder[normalizeName(a.name)] || 99;
        const monthB = monthOrder[normalizeName(b.name)] || 99;
        return monthA - monthB;
    });
}

// Create month card element
function createMonthCard(month) {
    const card = document.createElement('div');
    card.className = 'month-card';
    card.draggable = true;
    card.setAttribute('data-month-id', month.id);

    const imagesHtml = month.images && month.images.length > 0
        ? month.images.slice(0, 4).map(img => `<img src="${img.url}" alt="${img.description || ''}" class="month-image-thumb">`).join('')
        : '<p style="color: #999; font-style: italic;">Sem imagens</p>';

    card.innerHTML = `
        <div class="drag-handle">⋮⋮</div>
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

        // Get image data from form
        const imageItems = Array.from(document.querySelectorAll('.image-item'));
        const imageData = imageItems.map(item => ({
            file: item.querySelector('.imageFile').files[0] || null,
            description: item.querySelector('.imageDesc').value || '',
            existingId: item.getAttribute('data-existing-id') || null
        }));

        if (editingMonthId) {
            // Update existing month
            await updateMonth(editingMonthId, monthName, monthDescription, imageData);
        } else {
            // Create new month
            await createMonth(monthName, monthDescription, imageData);
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
async function createMonth(name, description, imageData) {
    // Insert month
    const { data: month, error: monthError } = await window.supabaseClient
        .from('months')
        .insert([{ name, description }])
        .select()
        .single();

    if (monthError) throw monthError;

    // Upload images if any
    const imagesWithFiles = imageData.filter(img => img.file);
    if (imagesWithFiles.length > 0) {
        await uploadImages(month.id, imagesWithFiles);
    }
}

// Update existing month
async function updateMonth(monthId, name, description, imageData) {
    // Update month
    const { error: monthError } = await window.supabaseClient
        .from('months')
        .update({ name, description })
        .eq('id', monthId);

    if (monthError) throw monthError;

    // Get current images for the month
    const { data: currentImages, error: fetchError } = await window.supabaseClient
        .from('images')
        .select('id')
        .eq('month_id', monthId);

    if (fetchError) {
        console.error('Error fetching current images:', fetchError);
        throw fetchError;
    }

    const keptImageIds = imageData.filter(img => img.existingId).map(img => img.existingId);
    const imagesToDelete = currentImages.filter(img => !keptImageIds.includes(img.id)).map(img => img.id);

    // Delete removed images from both database and storage
    if (imagesToDelete.length > 0) {
        // First, get the URLs of images to delete from storage
        const { data: imagesToDeleteData, error: fetchDeleteError } = await window.supabaseClient
            .from('images')
            .select('url')
            .in('id', imagesToDelete);

        if (fetchDeleteError) {
            console.error('Error fetching images to delete:', fetchDeleteError);
            // Continue anyway
        }

        // Delete images from storage
        if (imagesToDeleteData && imagesToDeleteData.length > 0) {
            for (const image of imagesToDeleteData) {
                try {
                    // Extract filename from URL
                    const urlParts = image.url.split('/');
                    const fileName = urlParts[urlParts.length - 1];

                    const { error: storageError } = await window.supabaseClient.storage
                        .from('images')
                        .remove([fileName]);

                    if (storageError) {
                        console.error('Error deleting image from storage:', storageError);
                        // Continue with other deletions
                    }
                } catch (storageError) {
                    console.error('Error deleting image from storage:', storageError);
                    // Continue with other deletions
                }
            }
        }

        // Delete image records from database
        const { error: deleteError } = await window.supabaseClient
            .from('images')
            .delete()
            .in('id', imagesToDelete);

        if (deleteError) {
            console.error('Error deleting removed images:', deleteError);
            // Continue anyway
        }
    }

    // Update existing images and upload new ones
    for (let i = 0; i < imageData.length; i++) {
        const img = imageData[i];
        if (img.existingId) {
            // Update existing image
            const { error: updateError } = await window.supabaseClient
                .from('images')
                .update({
                    description: img.description,
                    alt: img.description,
                    image_order: i
                })
                .eq('id', img.existingId);

            if (updateError) {
                console.error('Error updating image:', updateError);
            }
        } else if (img.file) {
            // Upload new image
            await uploadImages(monthId, [img], i);
        }
    }
}

// Upload images to Supabase Storage
async function uploadImages(monthId, imageData, startOrder = 0) {
    for (let i = 0; i < imageData.length; i++) {
        const file = imageData[i].file;
        const desc = imageData[i].description || '';

        if (!file) continue;

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
            .from('images')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = window.supabaseClient.storage
            .from('images')
            .getPublicUrl(fileName);

        // Insert image record
        const { error: imageError } = await window.supabaseClient
            .from('images')
            .insert([{
                month_id: monthId,
                url: publicUrl,
                alt: desc,
                description: desc,
                image_order: startOrder + i
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

    // Clear existing image fields and populate with current images
    const container = document.getElementById('imagesContainer');
    container.innerHTML = '';

    // Add existing images for editing
    if (month.images && month.images.length > 0) {
        // Sort images by order
        const sortedImages = month.images.sort((a, b) => (a.image_order || 0) - (b.image_order || 0));

        sortedImages.forEach((image, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            imageItem.setAttribute('data-existing-id', image.id);

            imageItem.innerHTML = `
                <input type="file" accept="image/*" class="imageFile">
                <input type="text" placeholder="Descrição da imagem (opcional)" class="imageDesc" value="${image.description || image.alt || ''}">
                <button type="button" class="removeImage">Remover</button>
                <div class="existing-image">
                    <img src="${image.url}" alt="Imagem atual" style="max-width: 100px; max-height: 100px; margin-top: 10px; border-radius: 4px;">
                    <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Imagem atual</p>
                </div>
            `;

            // Add remove functionality
            imageItem.querySelector('.removeImage').addEventListener('click', () => {
                imageItem.remove();
            });

            container.appendChild(imageItem);
        });
    } else {
        // Add empty image field if no existing images
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';

        imageItem.innerHTML = `
            <input type="file" accept="image/*" class="imageFile">
            <input type="text" placeholder="Descrição da imagem (opcional)" class="imageDesc">
            <button type="button" class="removeImage" style="display: none;">Remover</button>
        `;

        container.appendChild(imageItem);
    }

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
            // First, get all images associated with this month
            const { data: images, error: fetchError } = await window.supabaseClient
                .from('images')
                .select('url')
                .eq('month_id', monthId);

            if (fetchError) {
                console.error('Error fetching images for deletion:', fetchError);
                // Continue with month deletion even if image fetch fails
            }

            // Delete images from storage
            if (images && images.length > 0) {
                for (const image of images) {
                    try {
                        // Extract filename from URL
                        const urlParts = image.url.split('/');
                        const fileName = urlParts[urlParts.length - 1];

                        const { error: storageError } = await window.supabaseClient.storage
                            .from('images')
                            .remove([fileName]);

                        if (storageError) {
                            console.error('Error deleting image from storage:', storageError);
                            // Continue with other deletions
                        }
                    } catch (storageError) {
                        console.error('Error deleting image from storage:', storageError);
                        // Continue with other deletions
                    }
                }
            }

            // Delete the month (this will cascade delete image records)
            const { error } = await window.supabaseClient
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

// Setup drag and drop functionality
function setupDragAndDrop(monthsGrid) {
    let draggedElement = null;
    let isDragging = false;
    let touchStartY = 0;
    let touchStartX = 0;

    // Desktop drag and drop
    monthsGrid.addEventListener('dragstart', (e) => {
        draggedElement = e.target;
        draggedElement.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });

    monthsGrid.addEventListener('dragend', (e) => {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    });

    monthsGrid.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const afterElement = getDragAfterElement(monthsGrid, e.clientY);
        const draggable = document.querySelector('.dragging');

        if (afterElement == null) {
            monthsGrid.appendChild(draggable);
        } else {
            monthsGrid.insertBefore(draggable, afterElement);
        }
    });

    monthsGrid.addEventListener('drop', async (e) => {
        e.preventDefault();
        await updateMonthOrder(monthsGrid);
    });

    // Mobile touch drag and drop
    monthsGrid.addEventListener('touchstart', (e) => {
        if (e.target.closest('.drag-handle')) {
            isDragging = true;
            draggedElement = e.target.closest('.month-card');
            draggedElement.classList.add('dragging');
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
            e.preventDefault();
        }
    }, { passive: false });

    monthsGrid.addEventListener('touchmove', (e) => {
        if (isDragging && draggedElement) {
            e.preventDefault();
            const touch = e.touches[0];
            const afterElement = getDragAfterElement(monthsGrid, touch.clientY);

            if (afterElement == null) {
                monthsGrid.appendChild(draggedElement);
            } else {
                monthsGrid.insertBefore(draggedElement, afterElement);
            }
        }
    }, { passive: false });

    monthsGrid.addEventListener('touchend', async (e) => {
        if (isDragging && draggedElement) {
            draggedElement.classList.remove('dragging');
            isDragging = false;
            await updateMonthOrder(monthsGrid);
            draggedElement = null;
        }
    }, { passive: false });
}

// Helper function to update month order
async function updateMonthOrder(monthsGrid) {
    // Update the order in the database
    const cards = Array.from(monthsGrid.children);
    const updates = cards.map((card, index) => ({
        id: card.getAttribute('data-month-id'),
        month_order: index
    }));

    try {
        for (const update of updates) {
            await window.supabaseClient
                .from('months')
                .update({ month_order: update.month_order })
                .eq('id', update.id);
        }

        // Reload months to reflect new order
        loadMonths();
        showMessage('Ordem dos meses atualizada!', 'success');
    } catch (error) {
        console.error('Error updating month order:', error);
        showMessage('Erro ao atualizar ordem dos meses.', 'error');
    }
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.month-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Load music from database
async function loadMusic() {
    console.log('🔄 loadMusic called');
    const musicList = document.getElementById('musicList');
    if (!musicList) {
        console.error('❌ musicList element not found');
        return;
    }
    musicList.innerHTML = '<p>Carregando músicas...</p>';

    try {
        console.log('🔍 Querying music from database...');
        const { data: music, error } = await window.supabaseClient
            .from('music')
            .select('*')
            .order('music_order', { ascending: true });

        if (error) {
            console.error('❌ Database query error:', error);
            throw error;
        }

        console.log('✅ Database query successful, music:', music?.length || 0);
        musicData = music;
        displayMusic(music);
    } catch (error) {
        console.error('❌ Error loading music:', error);
        musicList.innerHTML = '<p class="error">Erro ao carregar músicas. Tente novamente.</p>';
    }
}

// Display music in the UI
function displayMusic(music) {
    const musicList = document.getElementById('musicList');
    console.log('📋 Displaying music:', music?.length || 0, 'songs found');

    if (music.length === 0) {
        musicList.innerHTML = '<p>Nenhuma música cadastrada ainda.</p>';
        return;
    }

    const musicGrid = document.createElement('div');
    musicGrid.className = 'music-grid';

    music.forEach(song => {
        const musicCard = createMusicCard(song);
        musicGrid.appendChild(musicCard);
    });

    musicList.innerHTML = '';
    musicList.appendChild(musicGrid);
    console.log('✅ Music displayed successfully');

    // Add drag and drop functionality
    setupMusicDragAndDrop(musicGrid);
}

// Create music card element
function createMusicCard(song) {
    const card = document.createElement('div');
    card.className = 'music-card';
    card.draggable = true;
    card.setAttribute('data-music-id', song.id);

    card.innerHTML = `
        <div class="drag-handle">⋮⋮</div>
        <h3>${song.title}</h3>
        <audio controls style="width: 100%; margin: 10px 0;">
            <source src="${song.url}" type="audio/mpeg">
            Seu navegador não suporta o elemento de áudio.
        </audio>
        <div class="music-actions">
            <button class="edit-btn" onclick="editMusic('${song.id}')">Editar</button>
            <button class="delete-btn" onclick="deleteMusic('${song.id}', '${song.title}')">Excluir</button>
        </div>
    `;

    return card;
}

// Handle music form submission
async function handleMusicFormSubmit(e) {
    e.preventDefault();

    const submitButton = document.getElementById('musicSubmitButton');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Salvando...';
    submitButton.disabled = true;

    try {
        const musicTitle = document.getElementById('musicTitle').value.trim();
        const musicFile = document.getElementById('musicFile').files[0];

        if (!musicFile) {
            throw new Error('Por favor, selecione um arquivo de música.');
        }

        if (editingMusicId) {
            // Update existing music
            await updateMusic(editingMusicId, musicTitle, musicFile);
        } else {
            // Create new music
            await createMusic(musicTitle, musicFile);
        }

        // Reset form and reload
        resetMusicForm();
        loadMusic();

        showMusicMessage('Música salva com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar música:', error);
        showMusicMessage('Erro ao salvar música: ' + error.message, 'error');
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Create new music
async function createMusic(title, file) {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
        .from('music')
        .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = window.supabaseClient.storage
        .from('music')
        .getPublicUrl(fileName);

    // Insert music record
    const { error: musicError } = await window.supabaseClient
        .from('music')
        .insert([{
            title,
            url: publicUrl
        }]);

    if (musicError) throw musicError;
}

// Update existing music
async function updateMusic(musicId, title, file) {
    if (file) {
        // Upload new file
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
            .from('music')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = window.supabaseClient.storage
            .from('music')
            .getPublicUrl(fileName);

        // Update music record with new file
        const { error: musicError } = await window.supabaseClient
            .from('music')
            .update({ title, url: publicUrl })
            .eq('id', musicId);

        if (musicError) throw musicError;
    } else {
        // Update only title
        const { error: musicError } = await window.supabaseClient
            .from('music')
            .update({ title })
            .eq('id', musicId);

        if (musicError) throw musicError;
    }
}

// Edit music
function editMusic(musicId) {
    const song = musicData.find(m => m.id === musicId);
    if (!song) return;

    editingMusicId = musicId;

    // Fill form
    document.getElementById('musicTitle').value = song.title;

    // Update UI
    document.getElementById('musicFormTitle').textContent = 'Editar Música';
    document.getElementById('musicSubmitButton').textContent = 'Atualizar Música';
    document.getElementById('musicCancelButton').style.display = 'inline-block';

    // Scroll to form
    document.querySelector('#musicForm').scrollIntoView({ behavior: 'smooth' });
}

// Delete music
function deleteMusic(musicId, musicTitle) {
    const modal = document.getElementById('confirmModal');
    const title = document.getElementById('confirmTitle');
    const message = document.getElementById('confirmMessage');

    title.textContent = 'Excluir Música';
    message.textContent = `Tem certeza que deseja excluir a música "${musicTitle}"? Esta ação não pode ser desfeita.`;

    modal.classList.add('show');

    // Setup confirmation buttons
    document.getElementById('confirmYes').onclick = async () => {
        modal.classList.remove('show');

        try {
            // First, get the music record to get the URL
            const { data: musicRecord, error: fetchError } = await window.supabaseClient
                .from('music')
                .select('url')
                .eq('id', musicId)
                .single();

            if (fetchError) {
                console.error('Error fetching music for deletion:', fetchError);
                // Continue with music deletion even if fetch fails
            }

            // Delete audio file from storage
            if (musicRecord && musicRecord.url) {
                try {
                    // Extract filename from URL
                    const urlParts = musicRecord.url.split('/');
                    const fileName = urlParts[urlParts.length - 1];

                    const { error: storageError } = await window.supabaseClient.storage
                        .from('music')
                        .remove([fileName]);

                    if (storageError) {
                        console.error('Error deleting audio from storage:', storageError);
                        // Continue with database deletion
                    }
                } catch (storageError) {
                    console.error('Error deleting audio from storage:', storageError);
                    // Continue with database deletion
                }
            }

            // Delete the music record
            const { error } = await window.supabaseClient
                .from('music')
                .delete()
                .eq('id', musicId);

            if (error) throw error;

            loadMusic();
            showMusicMessage('Música excluída com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao excluir música:', error);
            showMusicMessage('Erro ao excluir música: ' + error.message, 'error');
        }
    };

    document.getElementById('confirmNo').onclick = () => {
        modal.classList.remove('show');
    };
}

// Cancel music edit
function cancelMusicEdit() {
    resetMusicForm();
}

// Reset music form
function resetMusicForm() {
    editingMusicId = null;
    document.getElementById('musicForm').reset();
    document.getElementById('musicFormTitle').textContent = 'Adicionar Música';
    document.getElementById('musicSubmitButton').textContent = 'Salvar Música';
    document.getElementById('musicCancelButton').style.display = 'none';
}

// Show music message
function showMusicMessage(message, type) {
    const existingMessage = document.querySelector('.success, .error');
    if (existingMessage) existingMessage.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = type;
    messageDiv.textContent = message;

    const form = document.getElementById('musicForm');
    form.parentNode.insertBefore(messageDiv, form);

    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Setup music drag and drop functionality
function setupMusicDragAndDrop(musicGrid) {
    let draggedElement = null;
    let isDragging = false;
    let touchStartY = 0;
    let touchStartX = 0;

    // Desktop drag and drop
    musicGrid.addEventListener('dragstart', (e) => {
        draggedElement = e.target;
        draggedElement.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });

    musicGrid.addEventListener('dragend', (e) => {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    });

    musicGrid.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const afterElement = getMusicDragAfterElement(musicGrid, e.clientY);
        const draggable = document.querySelector('.dragging');

        if (afterElement == null) {
            musicGrid.appendChild(draggable);
        } else {
            musicGrid.insertBefore(draggable, afterElement);
        }
    });

    musicGrid.addEventListener('drop', async (e) => {
        e.preventDefault();
        await updateMusicOrder(musicGrid);
    });

    // Mobile touch drag and drop
    musicGrid.addEventListener('touchstart', (e) => {
        if (e.target.closest('.drag-handle')) {
            isDragging = true;
            draggedElement = e.target.closest('.music-card');
            draggedElement.classList.add('dragging');
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
            e.preventDefault();
        }
    }, { passive: false });

    musicGrid.addEventListener('touchmove', (e) => {
        if (isDragging && draggedElement) {
            e.preventDefault();
            const touch = e.touches[0];
            const afterElement = getMusicDragAfterElement(musicGrid, touch.clientY);

            if (afterElement == null) {
                musicGrid.appendChild(draggedElement);
            } else {
                musicGrid.insertBefore(draggedElement, afterElement);
            }
        }
    }, { passive: false });

    musicGrid.addEventListener('touchend', async (e) => {
        if (isDragging && draggedElement) {
            draggedElement.classList.remove('dragging');
            isDragging = false;
            await updateMusicOrder(musicGrid);
            draggedElement = null;
        }
    }, { passive: false });
}

// Helper function to update music order
async function updateMusicOrder(musicGrid) {
    // Update the order in the database
    const cards = Array.from(musicGrid.children);
    const updates = cards.map((card, index) => ({
        id: card.getAttribute('data-music-id'),
        music_order: index
    }));

    try {
        for (const update of updates) {
            await window.supabaseClient
                .from('music')
                .update({ music_order: update.music_order })
                .eq('id', update.id);
        }

        // Reload music to reflect new order
        loadMusic();
        showMusicMessage('Ordem das músicas atualizada!', 'success');
    } catch (error) {
        console.error('Error updating music order:', error);
        showMusicMessage('Erro ao atualizar ordem das músicas.', 'error');
    }
}

function getMusicDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.music-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Make functions global for onclick handlers
window.editMonth = editMonth;
window.deleteMonth = deleteMonth;
window.editMusic = editMusic;
window.deleteMusic = deleteMusic;
