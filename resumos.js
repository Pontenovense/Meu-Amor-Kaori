// Supabase configuration
const SUPABASE_URL = 'https://qfhyttwzeicslnrfenyh.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaHl0dHd6ZWljc2xucmZlbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MjU4NjYsImV4cCI6MjA4MzUwMTg2Nn0.6fCQBPaT4W_5gbRDIPvdck8I6KlE81-C7nv3sUu2EU4'; // Replace with your Supabase anon key

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Load months when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadMonths();
});

// Load months from database
async function loadMonths() {
    const mainElement = document.getElementById('resumosMain');

    try {
        const { data: months, error } = await supabase
            .from('months')
            .select(`
                *,
                images (*)
            `)
            .order('name');

        if (error) throw error;

        displayMonths(months);
    } catch (error) {
        console.error('Erro ao carregar meses:', error);
        mainElement.innerHTML = `
            <div class="error-message">
                <p>Erro ao carregar os resumos. Tente novamente mais tarde.</p>
                <p>Detalhes: ${error.message}</p>
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
