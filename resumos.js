// Use the global Supabase client

// Load months when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadMonths();
});

// Load months from database
async function loadMonths() {
    const mainElement = document.getElementById('resumosMain');
    console.log('📅 Carregando meses do banco de dados...');

    try {
        console.log('🔍 Fazendo query no Supabase...');
        const { data: months, error } = await window.supabaseClient
            .from('months')
            .select(`
                *,
                images (*)
            `)
            .order('name');

        if (error) {
            console.error('❌ Erro na query:', error);
            throw error;
        }

        console.log('✅ Query executada com sucesso. Meses encontrados:', months?.length || 0);
        if (months) {
            console.log('📋 Meses:', months.map(m => ({ nome: m.name, imagens: m.images?.length || 0 })));
        }

        displayMonths(months);
    } catch (error) {
        console.error('❌ Erro ao carregar meses:', error);
        mainElement.innerHTML = `
            <div class="error-message">
                <p>Erro ao carregar os resumos. Verifique o console para mais detalhes.</p>
                <p>Detalhes: ${error.message}</p>
                <p><strong>Possíveis causas:</strong></p>
                <ul>
                    <li>SQL não foi executado no Supabase</li>
                    <li>Configuração incorreta do banco</li>
                    <li>Problemas de permissão</li>
                </ul>
            </div>
        `;
    }
}

// Display months in the UI
function displayMonths(months) {
    const mainElement = document.getElementById('resumosMain');

    if (months.length === 0) {
        mainElement.innerHTML = `
            <section>
                <h2>Resumos</h2>
                <p>Ainda não há resumos disponíveis. Volte em breve!</p>
            </section>
        `;
        return;
    }

    // Clear loading message
    mainElement.innerHTML = '';

    // Create sections for each month
    months.forEach(month => {
        const section = createMonthSection(month);
        mainElement.appendChild(section);
    });
}

// Create month section element
function createMonthSection(month) {
    const section = document.createElement('section');
    section.id = month.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Create section content
    let sectionHtml = `<h2>${month.name}</h2>`;

    // Add images
    if (month.images && month.images.length > 0) {
        // Sort images by order
        const sortedImages = month.images.sort((a, b) => (a.image_order || 0) - (b.image_order || 0));

        sortedImages.forEach((image, index) => {
            if (index > 0) {
                sectionHtml += '<div class="divider"></div>';
            }

            sectionHtml += `<img src="${image.url}" alt="${image.alt || ''}">`;

            // Add description if exists
            if (image.description) {
                sectionHtml += `<p><em>${image.description}</em></p>`;
            }
        });
    }

    // Add month description
    if (month.description) {
        if (month.images && month.images.length > 0) {
            sectionHtml += '<div class="divider"></div>';
        }
        sectionHtml += `<p>${month.description}</p>`;
    }

    section.innerHTML = sectionHtml;
    return section;
}
