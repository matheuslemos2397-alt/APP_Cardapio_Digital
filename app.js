/* ============================================================
   CONFIGURAÇÃO — EDITE AQUI PARA CADA CLIENTE
   ============================================================ */
const CONFIG = {
  whatsapp: "5592993168201", // DDI+DDD+número, só dígitos
  nomeLoja: "Sabor Local",
  moeda: "BRL",
  taxaEntrega: 5.0,          // 0 = entrega grátis
  pedidoMinimo: 0,           // 0 = sem mínimo
};

/* --- SUPABASE: onde os pedidos ficam salvos --- */
const SUPABASE_URL = "https://avvgvzrnfjqofgfihibz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2dmd2enJuZmpxb2ZnZmloaWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwOTEzMTMsImV4cCI6MjEwNTY2NzMxM30.SozpWD35snTiYEnwslrktTT6lm5-ilNJ6tSCOtDqpU4";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ============================================================
   PRODUTOS — edite o array abaixo (id, nome, descricao, preco, img, categoria)
   ============================================================ */
const PRODUTOS = [
  {
    id: 1,
    nome: "X-Burger Clássico",
    descricao: "Pão brioche, blend 180g, queijo cheddar e molho da casa.",
    preco: 24.9,
    img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=60",
    categoria: "Lanches",
  },
  {
    id: 2,
    nome: "X-Bacon Duplo",
    descricao: "Dois blends, bacon crocante, cheddar duplo e barbecue.",
    preco: 32.9,
    img: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&q=60",
    categoria: "Lanches",
  },
  {
    id: 3,
    nome: "Batata Rústica",
    descricao: "Porção 400g com páprica defumada e maionese de ervas.",
    preco: 16.9,
    img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&q=60",
    categoria: "Acompanhamentos",
  },
  {
    id: 4,
    nome: "Refrigerante Lata",
    descricao: "Coca-Cola, Guaraná ou Sprite — 350ml.",
    preco: 6.0,
    img: "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=300&q=60",
    categoria: "Bebidas",
  },
  {
    id: 5,
    nome: "Suco Natural 500ml",
    descricao: "Laranja, maracujá ou morango — feito na hora.",
    preco: 10.9,
    img: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&q=60",
    categoria: "Bebidas",
  },
  {
    id: 6,
    nome: "Brownie com Sorvete",
    descricao: "Brownie quente, sorvete de creme e calda de chocolate.",
    preco: 14.9,
    img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&q=60",
    categoria: "Sobremesas",
  },
];

/* ============================================================
   ESTADO — carrinho persistido no navegador do cliente
   ============================================================ */
const STORAGE_KEY = "carrinho-sabor-local";

function carregarCarrinho() {
  try {
    const dados = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    // Remove ids que não existem mais no cardápio
    return Object.fromEntries(
      Object.entries(dados).filter(
        ([id, qtd]) => PRODUTOS.some((p) => p.id === Number(id)) && qtd > 0
      )
    );
  } catch {
    return {};
  }
}

let carrinho = carregarCarrinho();
let categoriaAtiva = "Todos";
let termoBusca = "";

function salvarCarrinho() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(carrinho));
}

/* ============================================================
   UTILITÁRIOS
   ============================================================ */
const $ = (seletor) => document.querySelector(seletor);
const formatarPreco = (valor) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: CONFIG.moeda });

const totalItens = () => Object.values(carrinho).reduce((s, q) => s + q, 0);
const subtotal = () =>
  Object.entries(carrinho).reduce((soma, [id, qtd]) => {
    const produto = PRODUTOS.find((p) => p.id === Number(id));
    return produto ? soma + produto.preco * qtd : soma;
  }, 0);
const totalValor = () =>
  subtotal() > 0 ? subtotal() + CONFIG.taxaEntrega : 0;

const produtoPorId = (id) => PRODUTOS.find((p) => p.id === Number(id));

/* ---------- Toast ---------- */
let toastTimer;
function toast(mensagem) {
  const el = $("#toast");
  el.textContent = mensagem;
  el.classList.add("toast--visivel");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("toast--visivel"), 2200);
}

/* ============================================================
   RENDERIZAÇÃO — CATEGORIAS
   ============================================================ */
function renderizarCategorias() {
  const categorias = ["Todos", ...new Set(PRODUTOS.map((p) => p.categoria))];
  $("#categorias").innerHTML = categorias
    .map(
      (cat) => `
      <button class="${cat === categoriaAtiva ? "ativo" : ""}" data-cat="${cat}">
        ${cat}
      </button>`
    )
    .join("");

  document.querySelectorAll("#categorias button").forEach((btn) => {
    btn.addEventListener("click", () => {
      categoriaAtiva = btn.dataset.cat;
      renderizarCategorias();
      renderizarCatalogo();
    });
  });
}

/* ============================================================
   RENDERIZAÇÃO — CATÁLOGO (com stepper no próprio card)
   ============================================================ */
function cardRodape(p) {
  const qtd = carrinho[p.id] || 0;
  if (qtd === 0) {
    return `<button class="btn btn--add" data-add="${p.id}">Adicionar</button>`;
  }
  return `
    <div class="stepper" data-stepper="${p.id}">
      <button data-delta="-1" data-id="${p.id}" aria-label="Remover um">−</button>
      <span>${qtd}</span>
      <button data-delta="1" data-id="${p.id}" aria-label="Adicionar um">+</button>
    </div>`;
}

function renderizarCatalogo() {
  const termo = termoBusca.trim().toLowerCase();
  const lista = PRODUTOS.filter((p) => {
    const bateCategoria =
      categoriaAtiva === "Todos" || p.categoria === categoriaAtiva;
    const bateBusca =
      !termo ||
      p.nome.toLowerCase().includes(termo) ||
      p.descricao.toLowerCase().includes(termo);
    return bateCategoria && bateBusca;
  });

  $("#semResultados").hidden = lista.length > 0;

  $("#catalogo").innerHTML = lista
    .map(
      (p) => `
      <article class="card">
        <img class="card__img" src="${p.img}" alt="${p.nome}" loading="lazy" />
        <div class="card__info">
          <h3 class="card__nome">${p.nome}</h3>
          <p class="card__desc">${p.descricao}</p>
          <div class="card__rodape">
            <span class="card__preco">${formatarPreco(p.preco)}</span>
            ${cardRodape(p)}
          </div>
        </div>
      </article>`
    )
    .join("");

  document.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => adicionar(Number(btn.dataset.add)));
  });
  document.querySelectorAll("#catalogo [data-delta]").forEach((btn) => {
    btn.addEventListener("click", () =>
      alterarQuantidade(Number(btn.dataset.id), Number(btn.dataset.delta))
    );
  });
}

/* ============================================================
   CARRINHO
   ============================================================ */
function adicionar(id) {
  carrinho[id] = (carrinho[id] || 0) + 1;
  salvarCarrinho();
  atualizarUI();
  const p = produtoPorId(id);
  toast(`${p.nome} adicionado ✓`);
}

function alterarQuantidade(id, delta) {
  carrinho[id] = (carrinho[id] || 0) + delta;
  if (carrinho[id] <= 0) delete carrinho[id];
  salvarCarrinho();
  atualizarUI();
}

function limparCarrinho() {
  if (totalItens() === 0) return;
  if (!confirm("Esvaziar todo o carrinho?")) return;
  carrinho = {};
  salvarCarrinho();
  atualizarUI();
}

function atualizarUI() {
  const itens = totalItens();
  const fab = $("#btnCarrinho");
  fab.hidden = itens === 0;
  $("#fabCount").textContent = itens;
  $("#fabTotal").textContent = formatarPreco(subtotal());

  renderizarCatalogo(); // atualiza os steppers dos cards
  renderizarItensCarrinho();
}

function renderizarItensCarrinho() {
  const ids = Object.keys(carrinho);
  const container = $("#itensCarrinho");

  if (ids.length === 0) {
    container.innerHTML = `<p class="carrinho-vazio">Seu carrinho está vazio 🛒<br /><small>Adicione itens do cardápio para começar.</small></p>`;
  } else {
    container.innerHTML = ids
      .map((id) => {
        const p = produtoPorId(id);
        if (!p) return "";
        const qtd = carrinho[id];
        return `
        <div class="item-carrinho">
          <div class="item-carrinho__info">
            <div class="item-carrinho__nome">${p.nome}</div>
            <div class="item-carrinho__preco">${formatarPreco(p.preco)} × ${qtd} = ${formatarPreco(p.preco * qtd)}</div>
          </div>
          <div class="item-carrinho__qtd">
            <button data-delta="-1" data-id="${id}" aria-label="Remover um">−</button>
            <span>${qtd}</span>
            <button data-delta="1" data-id="${id}" aria-label="Adicionar um">+</button>
          </div>
        </div>`;
      })
      .join("");
  }

  $("#btnLimpar").hidden = ids.length === 0;
  $("#subtotalCarrinho").textContent = formatarPreco(subtotal());
  $("#taxaCarrinho").textContent =
    ids.length === 0
      ? formatarPreco(0)
      : CONFIG.taxaEntrega === 0
        ? "Grátis 🎉"
        : formatarPreco(CONFIG.taxaEntrega);
  $("#totalCarrinho").textContent = formatarPreco(totalValor());

  container.querySelectorAll("[data-delta]").forEach((btn) => {
    btn.addEventListener("click", () =>
      alterarQuantidade(Number(btn.dataset.id), Number(btn.dataset.delta))
    );
  });
}

/* ============================================================
   MODAL
   ============================================================ */
function abrirModal() {
  renderizarItensCarrinho();
  $("#modal").hidden = false;
  document.body.style.overflow = "hidden";
}
function fecharModal() {
  $("#modal").hidden = true;
  document.body.style.overflow = "";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#modal").hidden) fecharModal();
});

/* ============================================================
   CHECKOUT — WHATSAPP
   ============================================================ */
function gerarCodigo() {
  return String(Math.floor(1000 + Math.random() * 9000)); // 4 dígitos
}

async function finalizarPedido(event) {
  event.preventDefault();

  if (totalItens() === 0) {
    toast("Seu carrinho está vazio 🛒");
    return;
  }
  if (subtotal() < CONFIG.pedidoMinimo) {
    toast(`Pedido mínimo: ${formatarPreco(CONFIG.pedidoMinimo)}`);
    return;
  }

  const nome = $("#campoNome").value.trim();
  const endereco = $("#campoEndereco").value.trim();
  const obs = $("#campoObs").value.trim();
  const pagamento = $("#campoPagamento").value;
  const troco = $("#campoTroco").value.trim();

  const itens = Object.entries(carrinho).map(([id, qtd]) => {
    const p = produtoPorId(id);
    return { nome: p.nome, qtd, preco: p.preco };
  });

  const codigo = gerarCodigo();
  const linkRastreio = `${location.origin}${location.pathname.replace(/[^/]*$/, "")}rastreio/viewer.html?codigo=${codigo}`;

  // 1) Grava o pedido no Supabase (a loja vê em tempo real)
  const { error } = await sb.from("pedidos").insert({
    codigo,
    cliente_nome: nome,
    cliente_endereco: endereco,
    cliente_obs: obs || null,
    pagamento,
    troco: troco || null,
    itens,
    subtotal: subtotal(),
    taxa: CONFIG.taxaEntrega,
    total: totalValor(),
  });

  if (error) {
    console.error(error);
    toast("Erro ao salvar o pedido — tente novamente");
    return;
  }

  // 2) Monta a mensagem do WhatsApp (como antes, + código de rastreio)
  const linhas = itens.map(
    (i) => `▪ ${i.qtd}x ${i.nome} — ${formatarPreco(i.preco * i.qtd)}`
  );

  const mensagem = [
    `🍔 *NOVO PEDIDO — ${CONFIG.nomeLoja.toUpperCase()}*`,
    `🔖 *Código:* ${codigo}`,
    ``,
    `👤 *Cliente:* ${nome}`,
    `📍 *Endereço:* ${endereco}`,
    ``,
    `*Itens do pedido:*`,
    ...linhas,
    ``,
    `Subtotal: ${formatarPreco(subtotal())}`,
    CONFIG.taxaEntrega > 0 ? `Taxa de entrega: ${formatarPreco(CONFIG.taxaEntrega)}` : null,
    `💰 *Total: ${formatarPreco(totalValor())}*`,
    `💳 *Pagamento:* ${pagamento}`,
    troco ? `💵 *Troco para:* ${troco}` : null,
    obs ? `📝 *Observações:* ${obs}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  // 3) Abre o WhatsApp do lojista
  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensagem)}`, "_blank");

  // 4) Mostra o link de rastreio pro cliente
  toast(`Pedido ${codigo} enviado! Acompanhe em: Rastreio no topo ⬆️`);
  $("#linkRastreio").href = linkRastreio;
  $("#linkRastreio").hidden = false;

  // 5) Limpa o carrinho
  carrinho = {};
  salvarCarrinho();
  atualizarUI();
  fecharModal();
}

/* ============================================================
   EVENTOS GLOBAIS E INICIALIZAÇÃO
   ============================================================ */
$("#btnCarrinho").addEventListener("click", abrirModal);
$("#btnLimpar").addEventListener("click", limparCarrinho);
document.querySelectorAll("[data-fechar]").forEach((el) =>
  el.addEventListener("click", fecharModal)
);
$("#formCheckout").addEventListener("submit", finalizarPedido);

// Busca com debounce simples
let buscaTimer;
$("#campoBusca").addEventListener("input", (e) => {
  clearTimeout(buscaTimer);
  buscaTimer = setTimeout(() => {
    termoBusca = e.target.value;
    renderizarCatalogo();
  }, 200);
});

// Mostra/oculta o campo de troco só quando o pagamento é dinheiro
$("#campoPagamento").addEventListener("change", (e) => {
  $("#campoTrocoWrapper").style.display =
    e.target.value === "Dinheiro" ? "flex" : "none";
});

renderizarCategorias();
atualizarUI();

/* ============================================================
   PWA — registro do service worker
   ============================================================ */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* falha silenciosa — funciona normal sem SW */
    });
  });
}
