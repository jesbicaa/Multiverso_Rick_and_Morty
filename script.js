/* =========================================================
   Multiverso Rick and Morty - script.js
   Projeto de Jéssica Bianca da Silva (RA 160289)

   O que este arquivo faz:
   1. Busca dados na Rick and Morty API usando fetch
   2. Cria os cards dos personagens com createElement e appendChild
   3. Controla busca, filtro de status, paginação e favoritos
   ========================================================= */


/* ---------------------------------------------------------
   1. CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
   --------------------------------------------------------- */

// Endereço base da API. Todos os pedidos começam por ele.
const API = 'https://rickandmortyapi.com/api';

// Nome da "gaveta" do navegador (localStorage) onde guardamos os favoritos
const CHAVE_FAVORITOS = 'rm-favoritos';

// Pega no HTML os elementos que o script vai usar.
// Aqui só buscamos o que já existe, ainda não criamos nada.
const gradeCards = document.getElementById('grade-cards');
const campoBusca = document.getElementById('campo-busca');
const campoStatus = document.getElementById('campo-status');
const botaoFavoritos = document.getElementById('botao-favoritos');
const mensagem = document.getElementById('mensagem');
const carregando = document.getElementById('carregando');
const paginacao = document.getElementById('paginacao');
const botaoAnterior = document.getElementById('botao-anterior');
const botaoProxima = document.getElementById('botao-proxima');
const textoPagina = document.getElementById('texto-pagina');
const portalInterno = document.getElementById('portal-interno');
const secaoPersonagens = document.getElementById('personagens');

// Objeto que guarda a situação atual da tela (página, filtros e modo favoritos)
const estado = {
  pagina: 1,
  totalPaginas: 1,
  nome: '',
  status: '',
  verFavoritos: false
};

// A API devolve tudo em inglês, então traduzimos os valores mais comuns.
// Se aparecer algum valor que não está aqui, mostramos o original mesmo.
const traducaoStatus = {
  Alive: 'Vivo',
  Dead: 'Morto',
  unknown: 'Desconhecido'
};

const traducaoGenero = {
  Male: 'Masculino',
  Female: 'Feminino',
  Genderless: 'Sem gênero',
  unknown: 'Desconhecido'
};

const traducaoEspecie = {
  Human: 'Humano',
  Alien: 'Alienígena',
  Humanoid: 'Humanoide',
  Robot: 'Robô',
  Animal: 'Animal',
  Cronenberg: 'Cronenberg',
  Disease: 'Doença',
  Poopybutthole: 'Poopybutthole',
  Mythological: 'Mitológico',
  unknown: 'Desconhecida'
};

// Classe CSS de cada status (usada para pintar a bolinha de verde, rosa ou amarelo)
const classeStatus = {
  Alive: 'status-vivo',
  Dead: 'status-morto',
  unknown: 'status-desconhecido'
};


/* ---------------------------------------------------------
   2. FUNÇÃO AUXILIAR PARA BUSCAR DADOS (fetch)
   Todas as consultas à API passam por aqui.
   --------------------------------------------------------- */

function buscarJSON(url) {
  // fetch faz o pedido GET para a URL e devolve uma Promise
  return fetch(url).then((resposta) => {
    // 404: a API usa esse código quando a busca não encontra nada
    if (resposta.status === 404) {
      throw new Error('NAO_ENCONTRADO');
    }
    // 429: passamos do limite de requisições por dia
    if (resposta.status === 429) {
      throw new Error('LIMITE');
    }
    // Qualquer outro código diferente de 200 também é tratado como erro
    if (!resposta.ok) {
      throw new Error('ERRO_HTTP');
    }
    // Se deu tudo certo, converte o corpo da resposta de JSON para objeto JavaScript
    return resposta.json();
  });
}


/* ---------------------------------------------------------
   3. DADOS EM TEMPO REAL (números do topo da página)
   --------------------------------------------------------- */

// Faz o número "subir" de 0 até o valor final em 1 segundo
function animarNumero(elemento, valorFinal) {
  const duracao = 1000; // tempo da animação em milissegundos
  const inicio = performance.now(); // marca a hora em que a animação começou

  function passo(agora) {
    // progresso vai de 0 (começo) até 1 (fim)
    const progresso = Math.min((agora - inicio) / duracao, 1);
    // atualiza o texto do elemento com o número da vez
    elemento.textContent = Math.round(valorFinal * progresso).toLocaleString('pt-BR');
    // enquanto não chegou ao fim, pede o próximo quadro da animação
    if (progresso < 1) {
      requestAnimationFrame(passo);
    }
  }

  requestAnimationFrame(passo);
}

// Consulta a API para preencher as caixinhas de estatísticas
function carregarEstatisticas() {
  // Lista de consultas: qual caixinha preencher e qual endereço consultar.
  // A API devolve o total no campo info.count de cada resposta.
  const consultas = [
    { id: 'total-personagens', url: API + '/character' },
    { id: 'total-locais', url: API + '/location' },
    { id: 'total-episodios', url: API + '/episode' },
    { id: 'total-vivos', url: API + '/character/?status=alive' },
    { id: 'total-mortos', url: API + '/character/?status=dead' },
    { id: 'total-desconhecidos', url: API + '/character/?status=unknown' }
  ];

  // Para cada item da lista, faz um fetch separado
  consultas.forEach((consulta) => {
    const elemento = document.getElementById(consulta.id);

    buscarJSON(consulta.url)
      .then((dados) => {
        animarNumero(elemento, dados.info.count);
      })
      .catch(() => {
        // Se der erro, mostra um traço para não ficar um "0" enganando
        elemento.textContent = '-';
      });
  });
}

// Busca o Rick (id 1) e o Morty (id 2) para colocar dentro do portal da página inicial
function carregarDupla() {
  buscarJSON(API + '/character/1,2')
    .then((lista) => {
      lista.forEach((personagem) => {
        // Cria a imagem do avatar com JavaScript
        const imagem = document.createElement('img');
        imagem.className = 'portal-avatar';
        imagem.src = personagem.image;
        imagem.alt = personagem.name;
        // Coloca a imagem dentro do portal
        portalInterno.appendChild(imagem);
      });
    })
    .catch(() => {
      // Se não carregar, tudo bem: o portal fica só com o brilho verde
    });
}


/* ---------------------------------------------------------
   4. FAVORITOS (guardados no localStorage do navegador)
   --------------------------------------------------------- */

// Lê a lista de ids favoritos que está salva no navegador
function lerFavoritos() {
  try {
    const salvo = localStorage.getItem(CHAVE_FAVORITOS);
    // Se tem algo salvo, converte de texto para lista. Se não, devolve lista vazia.
    return salvo ? JSON.parse(salvo) : [];
  } catch (erro) {
    // Alguns navegadores bloqueiam o localStorage. Nesse caso seguimos sem favoritos salvos.
    return [];
  }
}

// Salva a lista de favoritos no navegador
function salvarFavoritos(lista) {
  try {
    localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(lista));
  } catch (erro) {
    // Se não conseguir salvar, ignora. O site continua funcionando.
  }
}

// Confere se um personagem já está nos favoritos
function ehFavorito(id) {
  return lerFavoritos().includes(id);
}

// Liga ou desliga o favorito de um personagem (chamado quando clica no coração)
function alternarFavorito(personagem, botao, card) {
  let favoritos = lerFavoritos();

  if (favoritos.includes(personagem.id)) {
    // Já era favorito: remove da lista
    favoritos = favoritos.filter((id) => id !== personagem.id);
  } else {
    // Não era favorito: adiciona na lista
    favoritos.push(personagem.id);
  }

  salvarFavoritos(favoritos);
  atualizarCoracao(botao, personagem);
  atualizarBotaoFavoritos();

  // Se estamos olhando só os favoritos e o card foi desfavoritado, ele sai da tela
  if (estado.verFavoritos && !favoritos.includes(personagem.id)) {
    card.remove();
    if (gradeCards.children.length === 0) {
      mostrarMensagem('Você não tem mais favoritos. Clique no coração de um card para guardar um personagem aqui.');
    }
  }
}

// Troca o desenho do coração (vazio ou cheio) conforme o personagem for favorito ou não
function atualizarCoracao(botao, personagem) {
  const favorito = ehFavorito(personagem.id);
  botao.textContent = favorito ? '\u2665' : '\u2661'; // ♥ cheio ou ♡ vazio
  botao.setAttribute('aria-pressed', favorito ? 'true' : 'false');
  botao.setAttribute(
    'aria-label',
    (favorito ? 'Remover ' : 'Favoritar ') + personagem.name + (favorito ? ' dos favoritos' : '')
  );
}

// Atualiza o botão "Meus favoritos" com a quantidade atual
function atualizarBotaoFavoritos() {
  botaoFavoritos.textContent = 'Meus favoritos (' + lerFavoritos().length + ')';
  botaoFavoritos.setAttribute('aria-pressed', estado.verFavoritos ? 'true' : 'false');
}


/* ---------------------------------------------------------
   5. CRIAÇÃO DOS CARDS (a parte principal do trabalho)
   O HTML só tem uma div vazia. Todo o resto nasce aqui.
   --------------------------------------------------------- */

// Cria uma linha da lista de informações: um rótulo pequeno em cima e o valor embaixo
function criarLinhaInfo(rotulo, texto, classeExtra) {
  const item = document.createElement('li');

  const spanRotulo = document.createElement('span');
  spanRotulo.className = 'info-rotulo';
  spanRotulo.textContent = rotulo;

  const spanValor = document.createElement('span');
  spanValor.className = 'info-valor';
  // Se veio uma classe extra (como a do status), soma com a classe padrão
  if (classeExtra) {
    spanValor.className += ' ' + classeExtra;
  }
  // textContent coloca o texto de forma segura, sem interpretar como HTML
  spanValor.textContent = texto;

  item.appendChild(spanRotulo);
  item.appendChild(spanValor);
  return item;
}

// Monta o card completo de UM personagem, seguindo o layout do trabalho:
// nome no topo, coração no canto, imagem no meio e as informações embaixo
function criarCard(personagem) {
  // O card em si é um <article>
  const card = document.createElement('article');
  card.className = 'card';

  // Nome do personagem
  const titulo = document.createElement('h3');
  titulo.className = 'card-titulo';
  titulo.textContent = personagem.name;

  // Botão de coração (favoritar)
  const coracao = document.createElement('button');
  coracao.type = 'button';
  coracao.className = 'card-coracao';
  atualizarCoracao(coracao, personagem);
  // Quando clicar no coração, liga ou desliga o favorito
  coracao.addEventListener('click', () => {
    alternarFavorito(personagem, coracao, card);
  });

  // Imagem do personagem
  const imagem = document.createElement('img');
  imagem.className = 'card-imagem';
  imagem.src = personagem.image;
  imagem.alt = 'Imagem de ' + personagem.name;
  imagem.loading = 'lazy'; // só baixa a imagem quando ela está perto de aparecer na tela
  imagem.width = 300;      // a API entrega imagens 300x300, informar isso evita a página "pular"
  imagem.height = 300;

  // Lista com as informações do personagem
  const lista = document.createElement('ul');
  lista.className = 'card-infos';

  // Status (vivo, morto ou desconhecido), com a bolinha colorida
  lista.appendChild(
    criarLinhaInfo(
      'Status',
      traducaoStatus[personagem.status] || personagem.status,
      'status ' + (classeStatus[personagem.status] || '')
    )
  );

  // Espécie
  lista.appendChild(
    criarLinhaInfo('Espécie', traducaoEspecie[personagem.species] || personagem.species)
  );

  // Tipo ou subespécie. Muitos personagens não têm, então só mostramos quando existir
  if (personagem.type) {
    lista.appendChild(criarLinhaInfo('Tipo', personagem.type));
  }

  // Gênero
  lista.appendChild(
    criarLinhaInfo('Gênero', traducaoGenero[personagem.gender] || personagem.gender)
  );

  // Origem e última localização conhecida
  lista.appendChild(criarLinhaInfo('Origem', personagem.origin.name));
  lista.appendChild(criarLinhaInfo('Última localização', personagem.location.name));

  // Quantidade de episódios em que o personagem aparece (tamanho da lista que a API manda)
  lista.appendChild(criarLinhaInfo('Aparições', personagem.episode.length + ' episódio(s)'));

  // Junta as peças dentro do card, na ordem em que aparecem na tela
  card.appendChild(titulo);
  card.appendChild(coracao);
  card.appendChild(imagem);
  card.appendChild(lista);

  return card;
}

// Limpa a grade e cria um card para cada personagem da lista
function renderizarCards(lista) {
  // Remove todos os cards antigos de uma vez
  gradeCards.replaceChildren();

  lista.forEach((personagem, posicao) => {
    const card = criarCard(personagem);
    // Cada card demora um pouquinho mais que o anterior para aparecer (efeito escadinha)
    card.style.animationDelay = posicao * 40 + 'ms';
    // Coloca o card pronto dentro da grade que está no HTML
    gradeCards.appendChild(card);
  });
}


/* ---------------------------------------------------------
   6. MENSAGENS, CARREGAMENTO E PAGINAÇÃO NA TELA
   --------------------------------------------------------- */

// Mostra um aviso para a pessoa (nenhum resultado, erro de conexão etc.)
function mostrarMensagem(texto) {
  mensagem.textContent = texto;
  mensagem.hidden = false;
}

// Esconde o aviso
function limparMensagem() {
  mensagem.hidden = true;
  mensagem.textContent = '';
}

// Mostra ou esconde o indicador de "Abrindo o portal..."
function mostrarCarregando(mostrar) {
  carregando.hidden = !mostrar;
}

// Atualiza os botões Anterior e Próxima e o texto "Página X de Y"
function atualizarPaginacao(totalEncontrado) {
  // No modo favoritos não existe paginação, então escondemos a área toda
  paginacao.hidden = estado.verFavoritos || totalEncontrado === 0;

  textoPagina.textContent =
    'Página ' + estado.pagina + ' de ' + estado.totalPaginas +
    ' (' + totalEncontrado + ' personagens)';

  // Desativa "Anterior" na primeira página e "Próxima" na última
  botaoAnterior.disabled = estado.pagina <= 1;
  botaoProxima.disabled = estado.pagina >= estado.totalPaginas;
}

// Traduz o código do erro em um texto amigável
function textoDoErro(erro) {
  if (erro.message === 'NAO_ENCONTRADO') {
    return 'Nenhum personagem encontrado com esses filtros. Tente outro nome ou outro status.';
  }
  if (erro.message === 'LIMITE') {
    return 'A API recebeu muitas requisições deste endereço hoje. Tente novamente mais tarde.';
  }
  return 'Não foi possível carregar os personagens. Confira sua conexão e tente de novo.';
}


/* ---------------------------------------------------------
   7. BUSCAR PERSONAGENS NA API
   --------------------------------------------------------- */

// Busca uma página de personagens, respeitando a busca por nome e o filtro de status
function buscarPersonagens() {
  mostrarCarregando(true);
  limparMensagem();

  // URLSearchParams monta a parte "?page=1&name=rick&status=alive" da URL para a gente
  const parametros = new URLSearchParams();
  parametros.set('page', estado.pagina);
  if (estado.nome) {
    parametros.set('name', estado.nome);
  }
  if (estado.status) {
    parametros.set('status', estado.status);
  }

  const url = API + '/character/?' + parametros.toString();

  buscarJSON(url)
    .then((dados) => {
      // A API informa quantas páginas existem no campo info.pages
      estado.totalPaginas = dados.info.pages;
      // results é a lista com até 20 personagens
      renderizarCards(dados.results);
      atualizarPaginacao(dados.info.count);
    })
    .catch((erro) => {
      // Deu erro ou não achou nada: esvazia a grade e avisa
      renderizarCards([]);
      estado.totalPaginas = 1;
      atualizarPaginacao(0);
      mostrarMensagem(textoDoErro(erro));
    })
    .finally(() => {
      // Com sucesso ou erro, o "carregando" some no final
      mostrarCarregando(false);
    });
}

// Busca só os personagens favoritados, todos de uma vez
function carregarFavoritos() {
  const ids = lerFavoritos();
  limparMensagem();

  // Sem favoritos, não precisa chamar a API
  if (ids.length === 0) {
    renderizarCards([]);
    atualizarPaginacao(0);
    mostrarMensagem('Você ainda não favoritou ninguém. Clique no coração de um card para guardar o personagem aqui.');
    return;
  }

  mostrarCarregando(true);

  // A API aceita vários ids separados por vírgula: /character/1,2,3
  buscarJSON(API + '/character/' + ids.join(','))
    .then((dados) => {
      // Com um id só, a API devolve um objeto. Com vários, devolve uma lista.
      // Aqui garantimos que sempre vamos trabalhar com lista.
      const lista = Array.isArray(dados) ? dados : [dados];
      renderizarCards(lista);
      atualizarPaginacao(lista.length);
    })
    .catch((erro) => {
      renderizarCards([]);
      atualizarPaginacao(0);
      mostrarMensagem(textoDoErro(erro));
    })
    .finally(() => {
      mostrarCarregando(false);
    });
}

// Rola a tela de volta para o começo da seção de personagens (usado ao trocar de página)
function voltarParaPersonagens() {
  secaoPersonagens.scrollIntoView({ behavior: 'smooth' });
}


/* ---------------------------------------------------------
   8. EVENTOS (o que acontece quando a pessoa mexe na página)
   --------------------------------------------------------- */

// Sai do modo favoritos (usado quando a pessoa começa a buscar ou filtrar)
function sairDoModoFavoritos() {
  estado.verFavoritos = false;
  atualizarBotaoFavoritos();
}

// Busca por nome. O temporizador espera a pessoa parar de digitar antes de chamar a API,
// assim não gastamos uma requisição a cada letra.
let temporizadorBusca;
campoBusca.addEventListener('input', () => {
  clearTimeout(temporizadorBusca);
  temporizadorBusca = setTimeout(() => {
    estado.nome = campoBusca.value.trim();
    estado.pagina = 1; // toda busca nova volta para a primeira página
    sairDoModoFavoritos();
    buscarPersonagens();
  }, 450);
});

// Filtro de status
campoStatus.addEventListener('change', () => {
  estado.status = campoStatus.value;
  estado.pagina = 1;
  sairDoModoFavoritos();
  buscarPersonagens();
});

// Botão "Anterior"
botaoAnterior.addEventListener('click', () => {
  if (estado.pagina > 1) {
    estado.pagina = estado.pagina - 1;
    buscarPersonagens();
    voltarParaPersonagens();
  }
});

// Botão "Próxima"
botaoProxima.addEventListener('click', () => {
  if (estado.pagina < estado.totalPaginas) {
    estado.pagina = estado.pagina + 1;
    buscarPersonagens();
    voltarParaPersonagens();
  }
});

// Botão "Meus favoritos": liga e desliga o modo favoritos
botaoFavoritos.addEventListener('click', () => {
  estado.verFavoritos = !estado.verFavoritos;
  atualizarBotaoFavoritos();

  if (estado.verFavoritos) {
    carregarFavoritos();
  } else {
    // Voltou para a lista normal, respeitando a busca e o status que já estavam escolhidos
    buscarPersonagens();
  }
});


/* ---------------------------------------------------------
   9. INÍCIO: o que roda assim que a página abre
   --------------------------------------------------------- */
carregarEstatisticas();     // preenche os números em tempo real
carregarDupla();            // coloca Rick e Morty dentro do portal
atualizarBotaoFavoritos();  // mostra quantos favoritos já existem
buscarPersonagens();        // carrega a primeira página de cards
