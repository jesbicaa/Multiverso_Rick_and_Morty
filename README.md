# Multiverso Rick and Morty

Site estático que consome a [Rick and Morty API](https://rickandmortyapi.com/) e mostra os personagens em cards criados pelo JavaScript.

Trabalho da disciplina de Web Development Front-End, UniFECAF.
**Aluna:** Jéssica Bianca da Silva, RA 160289, Análise e Desenvolvimento de Sistemas.

## O que o site faz

- Busca os personagens na API com `fetch` e cria cada card com `createElement` e `appendChild`. O HTML só tem a área vazia onde os cards entram.
- Mostra números em tempo real (personagens, localizações, episódios e quantidade de vivos, mortos e desconhecidos).
- Busca por nome e filtro por status, com paginação de 20 em 20.
- Botão de coração em cada card para favoritar. Os favoritos ficam salvos no navegador (`localStorage`).
- Layout responsivo para celular, tablet e computador.

## Tecnologias

Só HTML, CSS e JavaScript puro, sem frameworks nem bibliotecas.

## Estrutura

```
index.html   estrutura da página
style.css    visual (cores e estilo inspirados no desenho)
script.js    consumo da API, criação dos cards, filtros e favoritos
```

## Como rodar

Abra o `index.html` no navegador. Não precisa instalar nada nem usar token, a API é aberta.

## Como publicar no GitHub Pages

1. Crie um repositório novo no GitHub e envie os três arquivos.
2. Vá em **Settings > Pages**.
3. Em **Branch**, escolha `main` e a pasta `/ (root)`, depois clique em **Save**.
4. Em alguns minutos o site fica no endereço `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

## Sobre a API

- Endereço base: `https://rickandmortyapi.com/api`
- Sem autenticação, sem token. Só requisições `GET` por HTTPS, com resposta em JSON.
- Limite informado pela comunidade da API: 10.000 requisições por dia por IP.
- Rick and Morty pertence à Adult Swim / Warner Bros. Discovery. Projeto sem fins comerciais.
