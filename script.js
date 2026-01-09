// Aguarda o DOM carregar completamente
document.addEventListener('DOMContentLoaded', function() {
    // Referências aos controles
    const playPauseButton = document.getElementById('playPauseButton');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const musicContainer = document.getElementById('musicContainer');

    // Array com todas as músicas (carregado dinamicamente)
    let musicas = [];
    let musicData = [];
    
    // Variáveis de controle
    let musicaAtualIndex = 0;
    let musicaAtual = null;
    let tocando = false;
    let volumeOriginal = 0.7;

    // Configurar volume inicial
    musicas.forEach(musica => {
        if (musica) musica.volume = volumeOriginal;
    });

    // Sistema de notificações
    function criarNotificacao(mensagem, tipo = 'play') {
        // Remove notificação existente se houver
        const notificacaoExistente = document.querySelector('.notification');
        if (notificacaoExistente) {
            notificacaoExistente.remove();
        }

        // Cria nova notificação
        const notificacao = document.createElement('div');
        notificacao.className = `notification ${tipo}`;
        notificacao.textContent = mensagem;
        
        // Adiciona ícones
        const icone = tipo === 'play' ? '🎵' : tipo === 'pause' ? '⏸️' : '❌';
        notificacao.textContent = `${icone} ${mensagem}`;
        
        document.body.appendChild(notificacao);

        // Mostra a notificação
        setTimeout(() => {
            notificacao.classList.add('show');
        }, 100);

        // Remove a notificação após 3 segundos
        setTimeout(() => {
            notificacao.classList.remove('show');
            setTimeout(() => {
                if (notificacao.parentNode) {
                    notificacao.remove();
                }
            }, 300);
        }, 3000);
    }

    // Função para fade in do áudio
    function fadeIn(audio, duration = 1000) {
        audio.volume = 0;
        const step = volumeOriginal / (duration / 50);
        const fadeInInterval = setInterval(() => {
            if (audio.volume < volumeOriginal) {
                audio.volume = Math.min(audio.volume + step, volumeOriginal);
            } else {
                clearInterval(fadeInInterval);
            }
        }, 50);
    }

    // Função para fade out do áudio
    function fadeOut(audio, duration = 500) {
        const step = audio.volume / (duration / 50);
        const fadeOutInterval = setInterval(() => {
            if (audio.volume > 0) {
                audio.volume = Math.max(audio.volume - step, 0);
            } else {
                audio.pause();
                clearInterval(fadeOutInterval);
            }
        }, 50);
    }

    // Função para atualizar estado dos botões
    function atualizarBotoes() {
        if (prevButton) {
            prevButton.disabled = musicas.length <= 1;
        }
        if (nextButton) {
            nextButton.disabled = musicas.length <= 1;
        }
        
        if (playPauseButton) {
            if (tocando) {
                playPauseButton.textContent = '⏸️ Pausar';
            } else {
                playPauseButton.textContent = musicaAtual ? '▶️ Play' : '▶️ Iniciar';
            }
        }
    }

    // Função para tocar música específica
    function tocarMusica(index, showNotification = true) {
        if (index < 0 || index >= musicas.length || !musicas[index]) {
            criarNotificacao('Música não encontrada', 'error');
            return;
        }

        // Para música atual se estiver tocando
        if (musicaAtual && tocando) {
            fadeOut(musicaAtual, 300);
        }

        musicaAtualIndex = index;
        musicaAtual = musicas[musicaAtualIndex];

        try {
            musicaAtual.currentTime = 0; // Reinicia a música
            musicaAtual.play().then(() => {
                tocando = true;
                fadeIn(musicaAtual);
                atualizarBotoes();
                
                if (showNotification) {
                    const musicaNum = musicaAtualIndex + 1;
                    criarNotificacao(`Tocando música ${musicaNum} 🎵`, 'play');
                }
            }).catch(error => {
                console.error('Erro ao reproduzir música:', error);
                criarNotificacao('Erro ao tocar música', 'error');
            });
        } catch (error) {
            console.error('Erro ao iniciar música:', error);
            criarNotificacao('Erro ao iniciar música', 'error');
        }
    }

    // Função para pausar/despausar a música atual
    function toggleMusic() {
        if (!musicaAtual) {
            // Se não há música atual, inicia a primeira
            tocarMusica(0);
            return;
        }

        try {
            if (tocando) {
                fadeOut(musicaAtual, 500);
                tocando = false;
                criarNotificacao('Música pausada ⏸️', 'pause');
            } else {
                musicaAtual.play().then(() => {
                    tocando = true;
                    fadeIn(musicaAtual);
                    criarNotificacao('Música retomada! 🎶', 'play');
                }).catch(error => {
                    console.error('Erro ao despausar música:', error);
                    criarNotificacao('Erro ao despausar música', 'error');
                });
            }
            atualizarBotoes();
        } catch (error) {
            console.error('Erro ao controlar música:', error);
            criarNotificacao('Erro ao controlar música', 'error');
        }
    }

    // Função para música anterior
    function musicaAnterior() {
        if (musicas.length <= 1) return;
        
        const novoIndex = musicaAtualIndex > 0 ? musicaAtualIndex - 1 : musicas.length - 1;
        tocarMusica(novoIndex);
        criarNotificacao('⏮️ Música anterior', 'play');
    }

    // Função para próxima música
    function proximaMusica() {
        if (musicas.length <= 1) return;
        
        const novoIndex = musicaAtualIndex < musicas.length - 1 ? musicaAtualIndex + 1 : 0;
        tocarMusica(novoIndex);
        criarNotificacao('⏭️ Próxima música', 'play');
    }

    // Eventos para quando as músicas terminarem
    musicas.forEach((musica, index) => {
        if (musica) {
            musica.addEventListener('ended', () => {
                if (index < musicas.length - 1) {
                    // Toca próxima música
                    proximaMusica();
                } else {
                    // Fim da playlist
                    musicaAtual = null;
                    tocando = false;
                    atualizarBotoes();
                    criarNotificacao('Playlist finalizada 🎭', 'pause');
                }
            });
        }
    });

    // Event listeners dos botões
    if (playPauseButton) {
        playPauseButton.addEventListener('click', toggleMusic);
        
        // Efeito visual
        playPauseButton.addEventListener('mousedown', () => {
            playPauseButton.style.transform = 'translateY(-1px) scale(0.98)';
        });
        playPauseButton.addEventListener('mouseup', () => {
            playPauseButton.style.transform = '';
        });
    }

    if (prevButton) {
        prevButton.addEventListener('click', musicaAnterior);
        
        // Efeito visual
        prevButton.addEventListener('mousedown', () => {
            if (!prevButton.disabled) {
                prevButton.style.transform = 'translateY(-1px) scale(0.98)';
            }
        });
        prevButton.addEventListener('mouseup', () => {
            prevButton.style.transform = '';
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', proximaMusica);
        
        // Efeito visual
        nextButton.addEventListener('mousedown', () => {
            if (!nextButton.disabled) {
                nextButton.style.transform = 'translateY(-1px) scale(0.98)';
            }
        });
        nextButton.addEventListener('mouseup', () => {
            nextButton.style.transform = '';
        });
    }

    // Controles de teclado aprimorados
    document.addEventListener('keydown', (event) => {
        // Não interfere se estiver digitando em um input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        // Não interfere se o modal estiver aberto
        if (modal && modal.classList.contains('show')) {
            return;
        }

        switch(event.code) {
            case 'Space':
                event.preventDefault();
                toggleMusic();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                musicaAnterior();
                break;
            case 'ArrowRight':
                event.preventDefault();
                proximaMusica();
                break;
            case 'KeyP':
                event.preventDefault();
                toggleMusic();
                break;
        }
    });

    // Carrega músicas do Supabase
    async function loadMusic() {
        try {
            console.log('🎵 Carregando músicas do Supabase...');
            const { data: music, error } = await window.supabaseClient
                .from('music')
                .select('*')
                .order('music_order', { ascending: true });

            if (error) {
                console.error('❌ Erro ao carregar músicas:', error);
                // Fallback para músicas locais se houver erro
                loadFallbackMusic();
                return;
            }

            if (!music || music.length === 0) {
                console.log('⚠️ Nenhuma música encontrada no banco de dados');
                loadFallbackMusic();
                return;
            }

            musicData = music;
            console.log(`✅ ${music.length} música(s) carregada(s) do banco de dados`);

            // Cria elementos de áudio dinamicamente
            musicContainer.innerHTML = '';
            musicas = [];

            music.forEach((song, index) => {
                const audioElement = document.createElement('audio');
                audioElement.id = `musica${index + 1}`;
                audioElement.preload = 'metadata';
                audioElement.volume = volumeOriginal;

                const sourceElement = document.createElement('source');
                sourceElement.src = song.url;
                sourceElement.type = 'audio/mpeg';

                audioElement.appendChild(sourceElement);
                audioElement.innerHTML += 'Seu navegador não suporta o elemento de áudio.';

                musicContainer.appendChild(audioElement);
                musicas.push(audioElement);

                console.log(`🎵 Música ${index + 1}: ${song.title}`);
            });

            // Configura eventos para as músicas carregadas
            setupMusicEvents();

        } catch (error) {
            console.error('❌ Erro ao carregar músicas:', error);
            loadFallbackMusic();
        }
    }

    // Fallback para músicas locais (se não conseguir carregar do banco)
    function loadFallbackMusic() {
        console.log('🔄 Carregando músicas locais como fallback...');
        
        // Verifica se já existem elementos de áudio hardcoded
        const existingAudios = document.querySelectorAll('#musicContainer audio');
        if (existingAudios.length > 0) {
            musicas = Array.from(existingAudios);
            console.log(`✅ ${musicas.length} música(s) local(is) encontrada(s)`);
        } else {
            // Cria músicas padrão se não houver nada
            const defaultMusic = [
                { title: 'Música 1', url: 'assets/music.mp3' },
                { title: 'Música 2', url: 'assets/music2.mp3' }
            ];

            musicContainer.innerHTML = '';
            musicas = [];

            defaultMusic.forEach((song, index) => {
                const audioElement = document.createElement('audio');
                audioElement.id = `musica${index + 1}`;
                audioElement.preload = 'metadata';
                audioElement.volume = volumeOriginal;

                const sourceElement = document.createElement('source');
                sourceElement.src = song.url;
                sourceElement.type = 'audio/mpeg';

                audioElement.appendChild(sourceElement);
                audioElement.innerHTML += 'Seu navegador não suporta o elemento de áudio.';

                musicContainer.appendChild(audioElement);
                musicas.push(audioElement);
            });

            console.log(`✅ ${musicas.length} música(s) padrão carregada(s)`);
        }

        setupMusicEvents();
    }

    // Configura eventos para as músicas
    function setupMusicEvents() {
        musicas.forEach((musica, index) => {
            if (musica) {
                musica.addEventListener('ended', () => {
                    if (index < musicas.length - 1) {
                        // Toca próxima música
                        proximaMusica();
                    } else {
                        // Fim da playlist
                        musicaAtual = null;
                        tocando = false;
                        atualizarBotoes();
                        criarNotificacao('Playlist finalizada 🎭', 'pause');
                    }
                });
            }
        });
    }

    // Carrega as músicas
    loadMusic();

    // Inicializa o estado dos botões
    atualizarBotoes();

    // Adiciona indicador visual de carregamento
    function adicionarIndicadorCarregamento() {
        if (botao && !document.querySelector('.loading-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'loading-indicator';
            indicator.innerHTML = '🎵';
            indicator.style.cssText = `
                position: absolute;
                top: -5px;
                right: -5px;
                animation: pulse 1s infinite;
                font-size: 12px;
            `;
            botao.style.position = 'relative';
            botao.appendChild(indicator);
        }
    }

    // Adiciona CSS para animação de pulse
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // Sistema de Modal/Lightbox para imagens
    let currentImageIndex = 0;
    let images = [];
    let modal = null;

    function initImageModal() {
        // Cria o modal se não existir
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <div class="modal-nav modal-prev">&#10094;</div>
                    <div class="modal-nav modal-next">&#10095;</div>
                    <img src="" alt="">
                    <div class="modal-counter"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Coleta todas as imagens clicáveis
        images = Array.from(document.querySelectorAll('img')).filter(img => 
            img.src && !img.src.includes('data:') && img.parentElement.tagName !== 'A'
        );

        // Adiciona event listeners para as imagens
        images.forEach((img, index) => {
            img.addEventListener('click', () => openModal(index));
        });

        // Event listeners do modal
        const closeBtn = modal.querySelector('.close');
        const prevBtn = modal.querySelector('.modal-prev');
        const nextBtn = modal.querySelector('.modal-next');
        const modalImg = modal.querySelector('img');
        const counter = modal.querySelector('.modal-counter');

        closeBtn.addEventListener('click', closeModal);
        prevBtn.addEventListener('click', () => changeImage(-1));
        nextBtn.addEventListener('click', () => changeImage(1));
        
        // Fecha modal clicando fora da imagem
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Controles de teclado para o modal
        document.addEventListener('keydown', (e) => {
            if (modal.classList.contains('show')) {
                switch(e.key) {
                    case 'Escape':
                        closeModal();
                        break;
                    case 'ArrowLeft':
                        changeImage(-1);
                        break;
                    case 'ArrowRight':
                        changeImage(1);
                        break;
                }
            }
        });

        // ===== TOUCH/SWIPE SUPPORT =====
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;
        let touchEndY = 0;
        const minSwipeDistance = 50; // Distância mínima para considerar um swipe

        // Adiciona event listeners de touch ao modal
        modal.addEventListener('touchstart', handleTouchStart, { passive: true });
        modal.addEventListener('touchend', handleTouchEnd, { passive: true });
        modal.addEventListener('touchmove', handleTouchMove, { passive: true });

        function handleTouchStart(e) {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }

        function handleTouchMove(e) {
            // Previne scroll da página quando estiver no modal
            if (modal.classList.contains('show')) {
                e.preventDefault();
            }
        }

        function handleTouchEnd(e) {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        }

        function handleSwipe() {
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // Verifica se é um swipe horizontal válido
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    // Swipe para direita - foto anterior
                    changeImage(-1);
                } else {
                    // Swipe para esquerda - próxima foto
                    changeImage(1);
                }
            }
            
            // Swipe para baixo pode fechar o modal
            if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > minSwipeDistance) {
                closeModal();
            }
        }

        // Adiciona indicadores visuais de swipe para mobile
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .modal-content {
                    touch-action: pan-y;
                }
                
                .modal-nav {
                    display: none; /* Esconde botões de navegação em mobile */
                }
                
                .modal-content::before,
                .modal-content::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 40px;
                    height: 40px;
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    color: white;
                    opacity: 0;
                    transition: opacity 0.3s;
                    pointer-events: none;
                }
                
                .modal-content.swiping-left::after {
                    content: '→';
                    right: 10px;
                    opacity: 1;
                }
                
                .modal-content.swiping-right::before {
                    content: '←';
                    left: 10px;
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        // Adiciona feedback visual durante o swipe
        let isSwiping = false;
        
        modal.addEventListener('touchstart', () => {
            isSwiping = true;
        }, { passive: true });
        
        modal.addEventListener('touchend', () => {
            isSwiping = false;
            modal.querySelector('.modal-content').classList.remove('swiping-left', 'swiping-right');
        }, { passive: true });
    }

    function openModal(index) {
        currentImageIndex = index;
        const img = images[currentImageIndex];
        const modalImg = modal.querySelector('img');
        const counter = modal.querySelector('.modal-counter');
        
        modalImg.src = img.src;
        modalImg.alt = img.alt || 'Imagem ampliada';
        counter.textContent = `${currentImageIndex + 1} / ${images.length}`;
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Previne scroll da página
        
        // Notificação
        criarNotificacao('Imagem ampliada! Use ← → para navegar 📸', 'play');
    }

    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto'; // Restaura scroll da página
    }

    function changeImage(direction) {
        currentImageIndex += direction;
        
        // Loop circular
        if (currentImageIndex >= images.length) {
            currentImageIndex = 0;
        } else if (currentImageIndex < 0) {
            currentImageIndex = images.length - 1;
        }
        
        const img = images[currentImageIndex];
        const modalImg = modal.querySelector('img');
        const counter = modal.querySelector('.modal-counter');
        
        // Efeito de transição
        modalImg.style.opacity = '0.5';
        setTimeout(() => {
            modalImg.src = img.src;
            modalImg.alt = img.alt || 'Imagem ampliada';
            counter.textContent = `${currentImageIndex + 1} / ${images.length}`;
            modalImg.style.opacity = '1';
        }, 150);
    }

    // Inicializa o modal quando as imagens carregarem
    function waitForImages() {
        const allImages = document.querySelectorAll('img');
        let loadedImages = 0;
        
        if (allImages.length === 0) {
            initImageModal();
            return;
        }
        
        allImages.forEach(img => {
            if (img.complete) {
                loadedImages++;
            } else {
                img.addEventListener('load', () => {
                    loadedImages++;
                    if (loadedImages === allImages.length) {
                        initImageModal();
                    }
                });
                img.addEventListener('error', () => {
                    loadedImages++;
                    if (loadedImages === allImages.length) {
                        initImageModal();
                    }
                });
            }
        });
        
        if (loadedImages === allImages.length) {
            initImageModal();
        }
    }

    // Aguarda um pouco para garantir que todas as imagens estejam no DOM
    setTimeout(waitForImages, 500);

    // ===== BOTÃO VOLTAR AO TOPO =====
    function initializeBackToTop() {
        const backToTopButton = document.getElementById('backToTop');
        
        if (!backToTopButton) return;
        
        // Mostrar/esconder botão baseado na posição do scroll
        function toggleBackToTopButton() {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add('show');
            } else {
                backToTopButton.classList.remove('show');
            }
        }
        
        // Função para voltar ao topo suavemente
        function scrollToTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            // Mostrar notificação
            criarNotificacao('Voltando ao topo! ⬆️', 'play');
        }
        
        // Event listeners
        window.addEventListener('scroll', toggleBackToTopButton);
        backToTopButton.addEventListener('click', scrollToTop);
        
        // Efeito visual no clique
        backToTopButton.addEventListener('mousedown', () => {
            backToTopButton.style.transform = 'translateY(-1px) scale(0.95)';
        });
        backToTopButton.addEventListener('mouseup', () => {
            backToTopButton.style.transform = '';
        });
        
        // Verificar posição inicial
        toggleBackToTopButton();
        
        console.log('⬆️ Botão "Voltar ao Topo" inicializado!');
    }
    
    // Inicializa o botão voltar ao topo
    initializeBackToTop();

    // Inicialização
    console.log('🎵 Sistema de música avançado carregado com sucesso!');
    console.log('🎵 Carregando músicas do banco de dados...');
    console.log('⌨️ Controles: Espaço/P = Play/Pause, ← = Anterior, → = Próxima');
    console.log('📸 Sistema de modal de imagens inicializado!');
    console.log('⬆️ Botão "Voltar ao Topo" ativo!');
});
