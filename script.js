// Referências aos áudios
const musica1 = document.getElementById('musica1');
const musica2 = document.getElementById('musica2');
const botao = document.getElementById('playPauseButton');

// Variável para controle de qual música está tocando
let musicaAtual = null;
let tocando = false;

// Função para iniciar a primeira música
function iniciarMusica() {
    musica1.play();
    musicaAtual = musica1;
    tocando = true;
    botao.textContent = 'Pausar Música';
}

// Função para pausar/despausar a música atual
function toggleMusic() {
    if (tocando) {
        musicaAtual.pause();
        tocando = false;
        botao.textContent = 'Despausar Música';
    } else {
        musicaAtual.play();
        tocando = true;
        botao.textContent = 'Pausar Música';
    }
}

// Evento para quando a primeira música terminar
musica1.addEventListener('ended', () => {
    musica2.play();
    musicaAtual = musica2;
    tocando = true;
    botao.textContent = 'Pausar Música';
});

// Evento para quando a segunda música terminar
musica2.addEventListener('ended', () => {
    musicaAtual = null;
    tocando = false;
    botao.textContent = 'Iniciar Música';
});

// Evento de clique no botão
botao.addEventListener('click', () => {
    if (musicaAtual === null) {
        iniciarMusica(); // Inicia a primeira música
    } else {
        toggleMusic(); // Pausa/despausa a música atual
    }
});