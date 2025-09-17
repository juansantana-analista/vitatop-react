var appId = "Bearer " + getCookie("userAuthToken");
// Início função validar login
function validarToken() {
  const userAuthToken = getCookie("userAuthToken");

  if (!userAuthToken) {
    console.log("Token não encontrado");
    return false;
  }

  try {
    const base64Url = userAuthToken.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));

    const currentTime = Math.floor(Date.now() / 1000);
    const isValid = payload.expires && payload.expires > currentTime;
    
    if (!isValid) {
      console.log("Token expirado");
      // Limpa dados expirados - IMPORTANTE PARA iOS
      deleteCookie('userAuthToken');
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        localStorage.clear();
        sessionStorage.clear();
      }
    }
    
    return isValid;
  } catch (error) {
    console.error("Erro ao decodificar o token:", error);
    deleteCookie('userAuthToken');
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      localStorage.clear();
      sessionStorage.clear();
    }
    return false;
  }
}

// Função para definir cookie
function setCookie(name, value, hours) {
  let expires = "";
  if (hours) {
    const date = new Date();
    date.setTime(date.getTime() + hours * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// Função para obter cookie
function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}
// Função para remover um cookie
function deleteCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
}
// Fim função validar login

//Inicio Funçao listar categorias
// Updated listarCategorias function
function listarCategorias() {
  app.dialog.preloader("Carregando...");

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "ProdutoCategoriaRest",
    method: "listarCategorias",
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success' e se há dados de categorias
      if (
        responseJson.status === "success" &&
        responseJson.data &&
        responseJson.data.data
      ) {
        const categorias = responseJson.data.data;

        // Limpar o container de categorias
        $("#container-categorias").empty();

        // Adiciona a opção Todas ao inicio
        var opcaoTodasHTML = `
          <div class="category-item active" data-id="todas">
            <div class="category-icon">
              <i class="mdi mdi-apps"></i>
            </div>
            <div class="category-name">Todas</div>
          </div>
        `;
        $("#container-categorias").append(opcaoTodasHTML);

        // Adicione cada categoria
        categorias.forEach((categoria) => {
          var categoriaHTML = `
            <div class="category-item" data-id="${categoria.id}">
              <div class="category-icon">
                <i class="${categoria.icone}"></i>
              </div>
              <div class="category-name">${categoria.nome}</div>
            </div>
          `;

          $("#container-categorias").append(categoriaHTML);
        });

        // Adicione manipuladores de eventos para os itens de categoria
        $(".category-item").on("click", function () {
          // Remove a classe ativa de todos os itens
          $(".category-item").removeClass("active");

          // Adiciona a classe ativa ao item clicado
          $(this).addClass("active");

          // Pega o id da categoria clicada
          var categoriaId = $(this).data("id");

          // Se for "todas", define como undefined para listar todos os produtos
          if (categoriaId === "todas") {
            categoriaId = undefined;
          }

          // Chama a função listarProdutos com o id da categoria
          listarProdutos("", categoriaId);

          // Centraliza o item selecionado
          scrollToCategory(this);

          // Atualiza os indicadores de rolagem
          updateScrollIndicators();
        });

        // Configurar os indicadores de rolagem
        setupScrollIndicators();

        // Configurar botões de rolagem
        setupScrollButtons();

        // Mostrar dica de rolagem na primeira vez
        showSwipeHint();

        app.dialog.close();
      } else {
        app.dialog.close();
        // Verifica se há uma mensagem de erro definida
        const errorMessage =
          responseJson.message || "Formato de dados inválido";
        app.dialog.alert(
          "Erro ao carregar categorias: " + errorMessage,
          "Falha na requisição!"
        );
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao carregar categorias: " + error.message,
        "Falha na requisição!"
      );
    });
}

// Função para rolar até a categoria selecionada
function scrollToCategory(categoryElement) {
  const container = document.querySelector(".categories-scroll-wrapper");
  const item = categoryElement;

  if (container && container.scrollWidth > container.clientWidth) {
    const itemOffset = item.offsetLeft;
    const containerWidth = container.clientWidth;
    const scrollLeft = itemOffset - containerWidth / 2 + item.offsetWidth / 2;

    container.scrollTo({
      left: scrollLeft,
      behavior: "smooth",
    });
  }
}

// Função para configurar os indicadores de rolagem
function setupScrollIndicators() {
  const container = document.querySelector(".categories-scroll-wrapper");
  const dotsContainer = document.querySelector(".scroll-dots");

  if (!container || !dotsContainer) return;

  // Limpar indicadores existentes
  dotsContainer.innerHTML = "";

  // Determinar quantos indicadores são necessários
  const containerWidth = container.clientWidth;
  const scrollWidth = container.scrollWidth;

  if (scrollWidth <= containerWidth) {
    // Não há necessidade de rolagem, esconde os indicadores
    document.querySelector(".scroll-indicator").style.display = "none";
    document.querySelector(".scroll-arrow.scroll-left").style.display = "none";
    document.querySelector(".scroll-arrow.scroll-right").style.display = "none";
    return;
  }

  // Mostra os indicadores e botões de rolagem
  document.querySelector(".scroll-indicator").style.display = "flex";
  document.querySelector(".scroll-arrow.scroll-left").style.display = "flex";
  document.querySelector(".scroll-arrow.scroll-right").style.display = "flex";

  // Calcular o número de "páginas" de rolagem
  const numDots = Math.ceil(scrollWidth / containerWidth);

  // Criar os indicadores
  for (let i = 0; i < numDots; i++) {
    const dot = document.createElement("div");
    dot.className = "dot" + (i === 0 ? " active" : "");
    dot.setAttribute("data-index", i);
    dotsContainer.appendChild(dot);

    // Adicionar evento de clique para cada indicador
    dot.addEventListener("click", function () {
      const index = parseInt(this.getAttribute("data-index"));
      container.scrollTo({
        left: index * containerWidth,
        behavior: "smooth",
      });
    });
  }

  // Atualizar indicadores ao rolar
  container.addEventListener("scroll", function () {
    updateScrollIndicators();
  });
}

// Função para atualizar os indicadores de rolagem
function updateScrollIndicators() {
  const container = document.querySelector(".categories-scroll-wrapper");
  const dots = document.querySelectorAll(".scroll-dots .dot");
  const leftArrow = document.querySelector(".scroll-arrow.scroll-left");
  const rightArrow = document.querySelector(".scroll-arrow.scroll-right");

  if (!container || !dots.length) return;

  const scrollPosition = container.scrollLeft;
  const containerWidth = container.clientWidth;
  const scrollWidth = container.scrollWidth;

  // Atualizar visibilidade dos botões de seta
  if (scrollPosition <= 10) {
    leftArrow.style.opacity = "0.5";
    leftArrow.style.pointerEvents = "none";
  } else {
    leftArrow.style.opacity = "1";
    leftArrow.style.pointerEvents = "auto";
  }

  if (scrollPosition + containerWidth >= scrollWidth - 10) {
    rightArrow.style.opacity = "0.5";
    rightArrow.style.pointerEvents = "none";
  } else {
    rightArrow.style.opacity = "1";
    rightArrow.style.pointerEvents = "auto";
  }

  // Calcular o índice do indicador ativo
  const activeIndex = Math.round(scrollPosition / containerWidth);

  // Atualizar a classe ativa dos indicadores
  dots.forEach((dot, index) => {
    if (index === activeIndex) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });
}

// Função para configurar botões de rolagem
function setupScrollButtons() {
  const container = document.querySelector(".categories-scroll-wrapper");
  const leftButton = document.querySelector(".scroll-arrow.scroll-left");
  const rightButton = document.querySelector(".scroll-arrow.scroll-right");

  if (!container || !leftButton || !rightButton) return;

  // Configurar botão de rolagem para esquerda
  leftButton.addEventListener("click", function () {
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: -scrollAmount,
      behavior: "smooth",
    });
  });

  // Configurar botão de rolagem para direita
  rightButton.addEventListener("click", function () {
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });
  });
}

// Função para mostrar dica de rolagem
function showSwipeHint() {
  // Verificar se já mostrou a dica antes
  if (localStorage.getItem("swipeHintShown")) return;

  const container = document.querySelector(".categories-scroll-container");

  if (!container) return;

  // Criar elemento de dica
  const hint = document.createElement("div");
  hint.className = "swipe-hint";
  hint.innerHTML = `
    <i class="mdi mdi-gesture-swipe-horizontal"></i>
    <span>Deslize para ver mais</span>
  `;

  container.appendChild(hint);

  // Mostrar a dica após um curto atraso
  setTimeout(() => {
    hint.classList.add("show");
  }, 1000);

  // Esconder a dica após alguns segundos
  setTimeout(() => {
    hint.classList.remove("show");
    // Remover a dica depois da animação de fade-out
    setTimeout(() => {
      hint.remove();
    }, 300);
  }, 4000);

  // Marcar como mostrada
  localStorage.setItem("swipeHintShown", "true");

  // Também esconder se o usuário interagir com o container
  const scrollContainer = document.querySelector(".categories-scroll-wrapper");
  if (scrollContainer) {
    const hideHint = () => {
      hint.classList.remove("show");
      setTimeout(() => hint.remove(), 300);
      scrollContainer.removeEventListener("scroll", hideHint);
      scrollContainer.removeEventListener("click", hideHint);
      scrollContainer.removeEventListener("touchstart", hideHint);
    };

    scrollContainer.addEventListener("scroll", hideHint);
    scrollContainer.addEventListener("click", hideHint);
    scrollContainer.addEventListener("touchstart", hideHint);
  }
}
//Fim Função Lista categorias

//Inicio Funçao listar produtos tela Home
// Updated listarProdutos function to match the new single-line layout
function listarProdutos(searchQuery = "", categoriaId) {
  app.dialog.preloader("Carregando...");

  var imgUrl = "https://vitatop.tecskill.com.br/";

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "ProdutoVariacaoRest",
    method: "listarProdutos",
    categoria_id: categoriaId,
    search: searchQuery,
    limit: 30,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success' e se há dados de pedidos
      if (
        responseJson.status === "success" &&
        responseJson.data &&
        responseJson.data.data
      ) {
        const produtos = responseJson.data.data;
        let produtosFiltrados = produtos;
        if (window.categoriasSelecionadasLojinha && Array.isArray(window.categoriasSelecionadasLojinha) && window.categoriasSelecionadasLojinha.length > 0) {
          produtosFiltrados = produtos.filter(produto =>
            window.categoriasSelecionadasLojinha.includes(String(produto.categoria_produto))
          );
        }
        $("#container-produtos").empty();

        produtos.forEach((produto) => {
          var produtoPreco = formatarMoeda(produto.preco_lojavirtual);

          var imgUrl = "https://vitatop.tecskill.com.br/";
          const imagemProduto = produto.foto
            ? imgUrl + produto.foto
            : "img/default.png";
          const nomeProduto = truncarNome(produto.nome, 40); // Increased character limit
          const rating = 5;

          var produtoHTML = `
                  <!-- ITEM CARD-->
                  <div class="item-card">
                      <a data-id="${produto.id}" 
                      data-nome="${produto.nome}" 
                      data-preco="${produto.preco}"
                      data-preco2="${produto.preco2}"
                      data-preco_lojavirtual="${produto.preco_lojavirtual}"
                      data-imagem="${imagemProduto}"
                      href="#" class="item">
                          <div class="img-container">
                              <img src="${imagemProduto}" alt="${nomeProduto}">
                          </div>
                          <div class="nome-rating">
                                  <span class="color-gray product-name">${nomeProduto.toLocaleUpperCase()}
                              <div class="star-rating">
                                  <span class="star"></span>
                                  <span class="star"></span>
                                  <span class="star"></span>
                                  <span class="star"></span>
                                  <span class="star"></span>
                              </div>
                              <div class="price">${produtoPreco}</div>
                          </div> 
                      </a>
                  </div>
                  `;
          $("#container-produtos").append(produtoHTML);

          // Selecionar as estrelas apenas do produto atual
          const stars = $("#container-produtos")
            .children()
            .last()
            .find(".star-rating .star");

          // Preencher as estrelas conforme o rating do produto atual
          for (let i = 0; i < rating; i++) {
            stars[i].classList.add("filled");
          }
        });

        // Adicionar evento de clique
        $(".item").on("click", function () {
          var id = $(this).attr("data-id");
          var nomeProduto = $(this).attr("data-nome");
          var preco = $(this).attr("data-preco");
          var preco2 = $(this).attr("data-preco2");
          var preco_lojavirtual = $(this).attr("data-preco_lojavirtual");
          var imagem = $(this).attr("data-imagem");
          localStorage.setItem("produtoId", id);
          const produto = {
            id: id,
            imagem: imagem,
            nome: nomeProduto,
            rating: 5,
            likes: 5,
            reviews: 5,
            preco: preco,
            preco2: preco2,
            preco_lojavirtual: preco_lojavirtual,
          };
          localStorage.setItem("produto", JSON.stringify(produto));
          app.views.main.router.navigate("/detalhes/");
        });

        app.dialog.close();
      } else {
        app.dialog.close();
        // Verifica se há uma mensagem de erro definida
        const errorMessage =
          responseJson.message || "Formato de dados inválido";
        app.dialog.alert(
          "Erro ao carregar produtos: " + errorMessage,
          "Falha na requisição!"
        );
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao carregar produtos: " + error.message,
        "Falha na requisição!"
      );
    });
}
//Fim Função Lista produtos

//Inicio Função Detalhes Produto
// Função para inicializar a exibição dos benefícios do produto
function initializeBenefits(benefits) {
  // Container onde os benefícios serão inseridos
  const benefitsContainer = document.querySelector(".benefits");

  // Manter apenas o título dos benefícios
  benefitsContainer.innerHTML = `
      <div class="benefits-title">
          Benefícios do Produto
          <i class="fas fa-capsules"></i>
      </div>
  `;

  // Verifica se há benefícios para exibir
  if (benefits && benefits.length > 0) {
    // Adiciona cada benefício dinamicamente
    benefits.forEach((benefit) => {
      const benefitItem = document.createElement("div");
      benefitItem.className = "benefit-item";
      benefitItem.setAttribute("data-benefit", benefit.id);

      benefitItem.innerHTML = `
              <div class="benefit-icon" style="background-color: ${
                benefit.cor_icone || "#00a676"
              }">
                  <i class="${benefit.icone || "fas fa-check"}"></i>
              </div>
              <div class="benefit-content">
                  <div class="benefit-title">${benefit.nome}</div>
                  <div class="view-more">Ver mais <i class="fas fa-chevron-right"></i></div>
              </div>
          `;

      benefitsContainer.appendChild(benefitItem);
    });

    // Adiciona o evento de clique para cada benefício
    document.querySelectorAll(".benefit-item").forEach((item) => {
      item.addEventListener("click", function () {
        const benefitId = this.getAttribute("data-benefit");
        const benefit = benefits.find((b) => b.id === benefitId);

        if (benefit) {
          // Atualiza o conteúdo do modal
          document.getElementById("modalTitle").textContent = benefit.nome;
          document.getElementById("modalDescription").textContent =
            benefit.descricao;

          // Exibe o modal
          const modal = document.getElementById("benefitModal");
          modal.style.display = "flex";
        }
      });
    });

    // Configurar o fechamento do modal
    const closeModal = document.querySelector(".close-modal");
    if (closeModal) {
      closeModal.addEventListener("click", function () {
        const modal = document.getElementById("benefitModal");
        modal.style.display = "none";
      });
    }

    // Permitir fechar o modal clicando fora dele
    const modal = document.getElementById("benefitModal");
    if (modal) {
      window.addEventListener("click", function (event) {
        if (event.target === modal) {
          modal.style.display = "none";
        }
      });
    }
  } else {
    // Caso não haja benefícios, exibe uma mensagem
    const noBenefitsItem = document.createElement("div");
    noBenefitsItem.className = "benefit-item";
    noBenefitsItem.innerHTML = `
          <div class="benefit-icon">
              <i class="fas fa-info"></i>
          </div>
          <div class="benefit-content">
              <div class="benefit-title">Informações Indisponíveis</div>
              <div>Nenhum benefício cadastrado para este produto.</div>
          </div>
      `;

    benefitsContainer.appendChild(noBenefitsItem);
  }
}

// Modifica a função buscarProduto para usar os benefícios dinâmicos
function buscarProduto() {
  var produtoId = localStorage.getItem("produtoId");
  app.dialog.preloader("Carregando...");

  var imgUrl = "https://vitatop.tecskill.com.br/";

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "ProdutoVariacaoRest",
    method: "obterProdutoCompleto",
    produto_id: produtoId,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success' e se há dados de pedidos
      if (
        responseJson.status === "success" &&
        responseJson.data.status === "success"
      ) {
        const detalhes = responseJson.data.data;
        var produtoPreco = "";

        // Preparar as imagens para o carrossel
        const fotoPrincipal = detalhes.foto
          ? imgUrl + detalhes.foto
          : "img/default.png";

        // Array para armazenar todas as fotos do produto
        let fotos = [];

        // Adiciona a foto principal
        if (detalhes.foto) {
          fotos.push(imgUrl + detalhes.foto);
        }

        // Verificar e adicionar fotos adicionais
        if (detalhes.foto2) fotos.push(imgUrl + detalhes.foto2);
        if (detalhes.foto3) fotos.push(imgUrl + detalhes.foto3);
        if (detalhes.foto4) fotos.push(imgUrl + detalhes.foto4);
        if (detalhes.foto5) fotos.push(imgUrl + detalhes.foto5);
        if (detalhes.foto6) fotos.push(imgUrl + detalhes.foto6);

        // Se não houver fotos, adiciona a imagem padrão
        if (fotos.length === 0) {
          fotos.push("img/default.png");
        }

        // Atualizar HTML para o carrossel principal
        const swiperWrapper = document.querySelector(
          "#product-gallery-main .swiper-wrapper"
        );
        const thumbsWrapper = document.querySelector(
          "#product-gallery-thumbs .swiper-wrapper"
        );

        if (swiperWrapper && thumbsWrapper) {
          swiperWrapper.innerHTML = "";
          thumbsWrapper.innerHTML = "";

          fotos.forEach((foto, index) => {
            // Slides principais
            const slide = document.createElement("div");
            slide.className = "swiper-slide";
            slide.innerHTML = `<img src="${foto}" alt="${
              detalhes.nome
            } - Imagem ${index + 1}" class="product-image">`;
            swiperWrapper.appendChild(slide);

            // Miniaturas
            const thumbSlide = document.createElement("div");
            thumbSlide.className = "swiper-slide";
            thumbSlide.innerHTML = `<img src="${foto}" alt="Miniatura ${
              index + 1
            }" class="thumb-image">`;
            thumbsWrapper.appendChild(thumbSlide);
          });

          // Inicializar o swiper de miniaturas
          const thumbsSwiper = new Swiper("#product-gallery-thumbs", {
            slidesPerView: 4,
            spaceBetween: 10,
            freeMode: true,
            watchSlidesProgress: true,
            breakpoints: {
              // quando a largura da janela é >= 320px
              320: {
                slidesPerView: 3,
                spaceBetween: 5,
              },
              // quando a largura da janela é >= 480px
              480: {
                slidesPerView: 4,
                spaceBetween: 8,
              },
              // quando a largura da janela é >= 768px
              768: {
                slidesPerView: 5,
                spaceBetween: 10,
              },
            },
          });

          // Inicializar o swiper principal
          const mainSwiper = new Swiper("#product-gallery-main", {
            slidesPerView: 1,
            spaceBetween: 10,
            loop: fotos.length > 1,
            autoplay: {
              delay: 5000, // Auto-play a cada 5 segundos
              disableOnInteraction: false, // Continua o autoplay mesmo após interação
              pauseOnMouseEnter: true, // Pausa ao passar o mouse
            },
            pagination: {
              el: ".swiper-pagination",
              clickable: true,
            },
            navigation: {
              nextEl: ".swiper-button-next",
              prevEl: ".swiper-button-prev",
            },
            thumbs: {
              swiper: thumbsSwiper,
            },
          });

          // Adicionar evento de clique para o zoom
          document.querySelectorAll(".product-image").forEach((img) => {
            img.addEventListener("click", function () {
              openImageZoom(this.src);
            });
          });
        }

        //ALIMENTAR COM OS VALORES DO ITEM
        $("#imagem-detalhe").attr("src", fotoPrincipal);
        $("#imagemShare").attr("src", fotoPrincipal);
        $("#nome-detalhe").html(detalhes.nome.toUpperCase());
        $("#nomeShare").html(detalhes.nome.toUpperCase());

        var precoLucro = detalhes.preco_lojavirtual - detalhes.preco;
        $("#precoOriginal").html(formatarMoeda(detalhes.preco_lojavirtual));
        $("#precoDesconto").html(formatarMoeda(detalhes.preco));
        $("#precoRevenda").html(formatarMoeda(detalhes.preco_lojavirtual));
        $("#precoLucro").html(formatarMoeda(precoLucro));
        //$("#precopromo-detalhe").html(produtoPreco);

        // Selecione a div onde você quer adicionar o link
        const $container = $("#containerBtnCarrinho");
        // Crie o link e configure os atributos
        const $btnAddCarrinho = $("<button></button>")
          .text("Adicionar Carrinho")
          .attr("data-produto-id", "123")
          .attr("id", "botaoCarrinho")
          .addClass("add-cart");

        // Anexe o link ao container
        $container.append($btnAddCarrinho);
        produtoId = detalhes.id;

        //CLICOU NO ADICIONAR CARRINHO
        $("#addCarrinho").on("click", function () {
          //ADICIONAR AO CARRINHO
          adicionarItemCarrinho(produtoId);
        });

        //CLICOU NO ADICIONAR CARRINHO
        $("#comprarAgora").on("click", function () {
          //ADICIONAR AO CARRINHO
          adicionarItemCarrinho(produtoId);
        });

        // Inicializa os benefícios do produto
        initializeBenefits(detalhes.beneficios);


      const contraContainer = document.querySelector(".contra-indicacoes");
        // Manter apenas o título dos benefícios
        contraContainer.innerHTML = `
          <div class="contra-indicacoes-title">
            Contra Indicação
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
        `;
      // Verifica se há contra-indicações válidas
      if (Array.isArray(detalhes.contra_indicacoes) && detalhes.contra_indicacoes.length > 0) {
        detalhes.contra_indicacoes.forEach((contra) => {
          const contraItem = document.createElement("div");
          contraItem.className = "contra-indicacoes-item";

          contraItem.innerHTML = `
            <div class="benefit-content">
              <div class="benefit-title">${contra.titulo}</div>
            </div>
          `;

          contraContainer.appendChild(contraItem);
        });
      }

        localStorage.setItem("produtoDetalhes", JSON.stringify({ detalhes }));
        app.dialog.close();
      } else {
        app.dialog.close();
        // Verifica se há uma mensagem de erro definida
        const errorMessage =
          responseJson.message || "Formato de dados inválido";
        app.dialog.alert(
          "Erro ao carregar produtos: " + errorMessage,
          "Falha na requisição!"
        );
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao carregar produtos: " + error.message,
        "Falha na requisição!"
      );
    });
}

// Função para abrir o zoom da imagem
function openImageZoom(imageSrc) {
  // Remover qualquer zoom anterior se existir
  $("#imageZoomPopup").remove();

  // Criar elemento para o popup de zoom
  const zoomPopup = `
  <div id="imageZoomPopup" class="image-zoom-popup">
    <div class="image-zoom-container">
      <div class="image-zoom-close">×</div>
      <div class="image-zoom-content">
        <img src="${imageSrc}" alt="Zoom da imagem" class="zoom-image">
      </div>
    </div>
  </div>
`;

  // Adicionar o popup ao final do body
  $("body").append(zoomPopup);

  // Mostrar o popup com animação
  setTimeout(() => {
    $("#imageZoomPopup").addClass("active");
  }, 10);

  // Fechar o popup ao clicar no botão de fechar ou fora da imagem
  $("#imageZoomPopup, .image-zoom-close").on("click", function (e) {
    if (e.target === this || $(e.target).hasClass("image-zoom-close")) {
      $("#imageZoomPopup").removeClass("active");
      setTimeout(() => {
        $("#imageZoomPopup").remove();
      }, 300);
    }
  });

  // Implementar gestos de pinch zoom se estiver em um dispositivo móvel
  const zoomImage = document.querySelector(".zoom-image");
  if (zoomImage && window.Hammer) {
    const hammer = new Hammer(zoomImage);
    let scale = 1;
    let posX = 0;
    let posY = 0;
    let lastScale = 1;
    let lastPosX = 0;
    let lastPosY = 0;

    hammer.get("pinch").set({ enable: true });
    hammer.get("pan").set({ direction: Hammer.DIRECTION_ALL });

    hammer.on("pinch pan", function (ev) {
      if (ev.type === "pinch") {
        scale = Math.max(1, Math.min(lastScale * ev.scale, 4));
      }

      if (ev.type === "pan" && scale !== 1) {
        posX = lastPosX + ev.deltaX;
        posY = lastPosY + ev.deltaY;
      }

      zoomImage.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
    });

    hammer.on("pinchend panend", function () {
      lastScale = scale;
      lastPosX = posX;
      lastPosY = posY;
    });

    // Duplo toque para resetar zoom
    hammer.on("doubletap", function () {
      scale = 1;
      posX = 0;
      posY = 0;
      lastScale = 1;
      lastPosX = 0;
      lastPosY = 0;
      zoomImage.style.transform = `translate(0, 0) scale(1)`;
    });
  }
}

// Função para abrir o zoom da imagem
function openImageZoom(imageSrc) {
  // Remover qualquer zoom anterior se existir
  $("#imageZoomPopup").remove();

  // Criar elemento para o popup de zoom
  const zoomPopup = `
    <div id="imageZoomPopup" class="image-zoom-popup">
      <div class="image-zoom-container">
        <div class="image-zoom-close">×</div>
        <div class="image-zoom-content">
          <img src="${imageSrc}" alt="Zoom da imagem" class="zoom-image">
        </div>
      </div>
    </div>
  `;

  // Adicionar o popup ao final do body
  $("body").append(zoomPopup);

  // Mostrar o popup com animação
  setTimeout(() => {
    $("#imageZoomPopup").addClass("active");
  }, 10);

  // Fechar o popup ao clicar no botão de fechar ou fora da imagem
  $("#imageZoomPopup, .image-zoom-close").on("click", function (e) {
    if (e.target === this || $(e.target).hasClass("image-zoom-close")) {
      $("#imageZoomPopup").removeClass("active");
      setTimeout(() => {
        $("#imageZoomPopup").remove();
      }, 300);
    }
  });

  // Implementar gestos de pinch zoom se estiver em um dispositivo móvel
  const zoomImage = document.querySelector(".zoom-image");
  if (zoomImage && window.Hammer) {
    const hammer = new Hammer(zoomImage);
    let scale = 1;
    let posX = 0;
    let posY = 0;
    let lastScale = 1;
    let lastPosX = 0;
    let lastPosY = 0;

    hammer.get("pinch").set({ enable: true });
    hammer.get("pan").set({ direction: Hammer.DIRECTION_ALL });

    hammer.on("pinch pan", function (ev) {
      if (ev.type === "pinch") {
        scale = Math.max(1, Math.min(lastScale * ev.scale, 4));
      }

      if (ev.type === "pan" && scale !== 1) {
        posX = lastPosX + ev.deltaX;
        posY = lastPosY + ev.deltaY;
      }

      zoomImage.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
    });

    hammer.on("pinchend panend", function () {
      lastScale = scale;
      lastPosX = posX;
      lastPosY = posY;
    });

    // Duplo toque para resetar zoom
    hammer.on("doubletap", function () {
      scale = 1;
      posX = 0;
      posY = 0;
      lastScale = 1;
      lastPosX = 0;
      lastPosY = 0;
      zoomImage.style.transform = `translate(0, 0) scale(1)`;
    });
  }
}
//Fim Função Detalhes Produto

//Inicio Função obter Links
function buscarLinks() {
  var produtoId = localStorage.getItem("produtoId");

  var codigo_indicador = localStorage.getItem("codigo_indicador");
  app.dialog.preloader("Carregando...");

  var imgUrl = "https://vitatop.tecskill.com.br/";

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "ProdutoLinkRest",
    method: "loadAll",
    filters: [["produto_id", "=", produtoId]],
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success' e se há dados de pedidos
      if (responseJson.status === "success") {
        const links = responseJson.data;
        let linkLandingPage = "";
        let linkCheckout = "";

        //Limpa o container antes de copular
        $("#qrcode").html("");
        $("#ul-links").html("");

        links.forEach((link) => {
          const linkUrl = truncarNome(link.link_url, 40);

          // Verifica se o tipo_link é igual a 1 e armazena o link_url
          if (link.tipo_link == "1") {
            linkLandingPage = link.link_url;
            $("#paginaLinkUrl").html(linkUrl);
          } else {
            linkCheckout = link.link_url;
            $("#checkoutLinkUrl").html(linkUrl);
          }
        });

        $("#shareLanding").on("click", function () {
          // Pega o url do link clicado em share
          //Abre opção compartilhamento
          onCompartilhar(
            "Link do Produto",
            "Aproveite agora mesmo nosso produto",
            linkLandingPage + codigo_indicador
          );
        });
        $("#linkPaginaUrl").on("click", function () {
          // Pega o url do link clicado em share
          //Abre opção compartilhamento
          onCompartilhar(
            "Link do Produto",
            "Aproveite agora mesmo nosso produto",
            linkLandingPage + codigo_indicador
          );
        });
        $("#linkCheckoutUrl").on("click", function () {
          // Pega o url do link clicado em share
          //Abre opção compartilhamento
          onCompartilhar(
            "Link do Produto",
            "Aproveite agora mesmo nosso produto",
            linkCheckout + codigo_indicador
          );
        });

        $(".compartilhar-link").on("click", function () {
          // Pega o url do link clicado em share
          var linkUrl = $(this).data("link");
          //Abre opção compartilhamento

          onCompartilhar(
            "Link do Produto",
            "Aproveite agora mesmo nosso produto",
            linkCheckout + codigo_indicador
          );
        });

        var qrcode = new QRCode(document.getElementById("qrcode"), {
          text: linkLandingPage,
          width: 130,
          height: 130,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H,
        });

        app.dialog.close();
      } else {
        app.dialog.close();
        // Verifica se há uma mensagem de erro definida
        const errorMessage =
          responseJson.message || "Formato de dados inválido";
        app.dialog.alert(
          "Erro ao carregar links: " + errorMessage,
          "Falha na requisição!"
        );
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao carregar links: " + error.message,
        "Falha na requisição!"
      );
    });
}
//Fim Função obter Links

//Inicio Função obter id da Pessoa
function buscarPessoaId(userId) {
  app.dialog.preloader("Carregando...");

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "PessoaRest",
    method: "loadAll",
    filters: [["user_id", "=", userId]], 
    order: "id",
    direction: "desc"
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success'
      if (responseJson.status === "success") {
        const maiorId = responseJson.data.reduce((max, pessoa) => {
          const idNum = parseInt(pessoa.id, 10);
          return idNum > max ? idNum : max;
        }, 0);

        localStorage.setItem("pessoaId", maiorId);
        app.dialog.close();
      } else {
        app.dialog.close();
        // Verifica se há uma mensagem de erro definida
        const errorMessage =
          responseJson.message || "Formato de dados inválido";
        app.dialog.alert(
          "Erro ao carregar pessoa: " + errorMessage,
          "Falha na requisição!"
        );
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao carregar pessoa: " + error.message,
        "Falha na requisição!"
      );
    });
}
//Fim Função obter id da Pessoa

//Inicio Função obter Link Afiliado
function buscarLinkAfiliado() {
  const pessoaId = localStorage.getItem("pessoaId");
  app.dialog.preloader("Carregando...");

  var imgUrl = "https://vitatop.tecskill.com.br/";

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "PessoaRestService",
    method: "LinkIndicador",
    dados: { pessoa_id: pessoaId },
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      console.log(responseJson);
      // Verifica se o status é 'success' e se há dados de pedidos
      if (responseJson.status === "success") {
        const resultado = responseJson;
        var linkCadastro = resultado.data.data.link_cadastro;
        var linkLp = resultado.data.data.link_lp;
        $("#qrcode").html("");

        $("#link-cadastro").text(linkCadastro);
        $("#link-lp").text(linkLp);

        $("#compartilharLinkCadastro").on("click", function () {
          // Pega o url do link clicado em share
          //Abre opção compartilhamento.
          onCompartilhar(
            "Link de Indicação",
            "Faça seu cadastro na plataforma",
            linkCadastro
          );
        });
        $("#compartilharLinkLp").on("click", function () {
          // Pega o url do link clicado em share
          //Abre opção compartilhamento.
          onCompartilhar(
            "Link de Indicação",
            "Conheça nossa plataforma e se torne nosso Distribuidor Independente!",
            linkLp
          );
        });
        /*
        var qrcode = new QRCode(document.getElementById("qrcode"), {
          text: linkCadastro,
          width: 200,
          height: 200,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H,
        });
        */
        app.dialog.close();
      } else {
        app.dialog.close();
        // Verifica se há uma mensagem de erro definida
        const errorMessage =
          responseJson.message || "Formato de dados inválido";
        app.dialog.alert(
          "Erro ao carregar links: " + errorMessage,
          "Falha na requisição!"
        );
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao carregar pessoa: " + error.message,
        "Falha na requisição!"
      );
    });
}
//Fim Função obter Link Afiliado

//Inicio Funçao listar pedidos tela Pedidos com Paginação
function listarPedidos(loadMore = false, offset = 0) {
  if (!loadMore) {
    app.dialog.preloader("Carregando...");
  } else {
    // Mostrar loading no botão "Carregar mais"
    $("#loadMoreButton").html('<i class="mdi mdi-loading mdi-spin"></i> Carregando...');
    $("#loadMoreButton").prop('disabled', true);
  }

  var pessoaId = localStorage.getItem("pessoaId");

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "PedidoVendaRest",
    method: "ListarPedidos",
    pessoa_id: pessoaId,
    limit: 15,
    offset: offset
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success' e se há dados de pedidos
      if (
        responseJson.status === "success" &&
        responseJson.data &&
        responseJson.data.data &&
        responseJson.data.data.data
      ) {
        const pedidos = responseJson.data.data.data;
        const pagination = responseJson.data.data.pagination;
        const pedidosContainer = document.getElementById("container-pedidos");
        
        // Se não é loadMore, limpa o container
        if (!loadMore) {
          pedidosContainer.innerHTML = "";
        }

        // Se não há pedidos na primeira página
        if (pedidos.length === 0 && !loadMore) {
          pedidosContainer.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px 20px; color: #666;">
              <i class="mdi mdi-package-variant" style="font-size: 64px; margin-bottom: 20px; color: #ddd;"></i>
              <h3 style="margin-bottom: 10px;">Nenhum pedido encontrado</h3>
              <p>Você ainda não fez nenhum pedido.</p>
            </div>
          `;
          app.dialog.close();
          return;
        }

        // Remove o botão "Carregar mais" anterior se existir
        $("#loadMoreContainer").remove();

        pedidos.forEach((pedido) => {
          // Lógica condicional para exibir o status correto
          const statusExibir = pedido.status_compra == 3 ? pedido.status_pedido : pedido.mensagem_compra;
          
          const pedidosHTML = `                    
            <div class="card-list" data-id-pedido="${pedido.id}">
               <div class="card-principal">
                  <div class="card-header open header-pago">
                     <div class="date">${formatarData(pedido.data_emissao)}</div>
                     <div class="status">${statusExibir}</div>
                  </div>
                  <div class="card-body">
                     <div class="name">PEDIDO #${pedido.id}</div>
                     <div class="details">
                        <div class="detail">
                           <span>Nº</span>
                           <span>${pedido.id}</span>
                        </div>
                        <div class="detail">
                           <span class="mdi mdi-cash-multiple"></span>
                           <span>${pedido.forma_pagamento}</span>
                        </div>
                        <div class="detail">
                           <span>Total</span>
                           <span>${formatarMoeda(pedido.valor_total)}</span>
                        </div>
                        <div class="detail">
                           <span>A pagar</span>
                           <span>${formatarMoeda(pedido.valor_total)}</span>
                        </div>
                        <div class="items">${pedido.quantidade_itens} ${pedido.quantidade_itens === 1 ? 'item' : 'itens'}</div>
                     </div>
                  </div>
               </div>
            </div>
          `;
          pedidosContainer.innerHTML += pedidosHTML;
        });

        // Adiciona o botão "Carregar mais" se houver mais dados
        if (pagination.has_more) {
          const loadMoreHTML = `
            <div id="loadMoreContainer" style="text-align: center; margin: 30px 0; padding: 20px;">
              <button id="loadMoreButton" class="btn-large" data-next-offset="${pagination.next_offset}">
                <i class="mdi mdi-refresh"></i> Carregar mais pedidos
              </button>
              <div style="margin-top: 10px; font-size: 14px; color: #666;">
                Mostrando ${(pagination.current_page - 1) * pagination.per_page + pedidos.length} de ${pagination.total_records} pedidos
              </div>
            </div>
          `;
          pedidosContainer.innerHTML += loadMoreHTML;

          // Adiciona evento de clique ao botão "Carregar mais"
          $("#loadMoreButton").off('click').on('click', function() {
            const nextOffset = $(this).data('next-offset');
            listarPedidos(true, nextOffset);
          });
        } else if (pagination.current_page > 1) {
          // Se não há mais dados, mas já carregou algumas páginas, mostra mensagem
          const endMessageHTML = `
            <div id="loadMoreContainer" style="text-align: center; margin: 30px 0; padding: 20px;">
              <div style="color: #666; font-size: 14px;">
                <i class="mdi mdi-check-circle" style="color: #28a745;"></i>
                Todos os ${pagination.total_records} pedidos foram carregados
              </div>
            </div>
          `;
          pedidosContainer.innerHTML += endMessageHTML;
        }

        // Adiciona evento de clique aos pedidos (apenas aos novos)
        $(".card-list").off('click').on('click', function () {
          var pedidoId = $(this).data("id-pedido");
          localStorage.setItem("pedidoId", pedidoId);
          app.views.main.router.navigate("/resumo-pedido/");
        });

        app.dialog.close();
      } else {
        app.dialog.close();
        // Verifica se há uma mensagem de erro definida
        const errorMessage = responseJson.message || "Formato de dados inválido";
        
        if (!loadMore) {
          // Se é o primeiro carregamento e deu erro, mostra tela de erro
          const pedidosContainer = document.getElementById("container-pedidos");
          pedidosContainer.innerHTML = `
            <div class="error-state" style="text-align: center; padding: 40px 20px; color: #666;">
              <i class="mdi mdi-alert-circle" style="font-size: 64px; margin-bottom: 20px; color: #f44336;"></i>
              <h3 style="margin-bottom: 10px; color: #f44336;">Erro ao carregar pedidos</h3>
              <p>${errorMessage}</p>
              <button onclick="listarPedidos()" style="margin-top: 20px; padding: 10px 20px; background: var(--verde-escuro); color: white; border: none; border-radius: 5px;">
                <i class="mdi mdi-refresh"></i> Tentar novamente
              </button>
            </div>
          `;
        } else {
          // Se é carregamento de mais dados, restaura o botão
          $("#loadMoreButton").html('<i class="mdi mdi-refresh"></i> Carregar mais pedidos');
          $("#loadMoreButton").prop('disabled', false);
          app.dialog.alert("Erro ao carregar mais pedidos: " + errorMessage, "Erro");
        }
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      
      if (!loadMore) {
        // Se é o primeiro carregamento e deu erro, mostra tela de erro
        const pedidosContainer = document.getElementById("container-pedidos");
        pedidosContainer.innerHTML = `
          <div class="error-state" style="text-align: center; padding: 40px 20px; color: #666;">
            <i class="mdi mdi-wifi-off" style="font-size: 64px; margin-bottom: 20px; color: #f44336;"></i>
            <h3 style="margin-bottom: 10px; color: #f44336;">Erro de conexão</h3>
            <p>Verifique sua conexão com a internet e tente novamente.</p>
            <button onclick="listarPedidos()" style="margin-top: 20px; padding: 10px 20px; background: var(--verde-escuro); color: white; border: none; border-radius: 5px;">
              <i class="mdi mdi-refresh"></i> Tentar novamente
            </button>
          </div>
        `;
      } else {
        // Se é carregamento de mais dados, restaura o botão
        $("#loadMoreButton").html('<i class="mdi mdi-refresh"></i> Carregar mais pedidos');
        $("#loadMoreButton").prop('disabled', false);
        app.dialog.alert("Erro de conexão ao carregar mais pedidos", "Erro");
      }
    });
}
//Fim Função Lista tela Pedidos com Paginação

//Inicio Funçao listar Vendas
function listarVendas(loadMore = false, offset = 0) {
  if (!loadMore) {
    app.dialog.preloader("Carregando...");
  } else {
    // Mostrar loading no botão "Carregar mais"
    $("#loadMoreButton").html('<i class="mdi mdi-loading mdi-spin"></i> Carregando...');
    $("#loadMoreButton").prop('disabled', true);
  }

  var pessoaId = localStorage.getItem("pessoaId");

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  // Cabeçalhos da requisição - incluindo paginação
  const dados = {
    vendedor: pessoaId,
    limit: 15,
    offset: offset
  };

  const body = JSON.stringify({
    class: "PedidoDigitalRest",
    method: "MinhasVendasDigitais",
    dados: dados,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success' e se há dados de vendas
      if (
        responseJson.status === "success" &&
        responseJson.data.status === "success" &&
        responseJson.data.data.status === "success"
      ) {
        const vendas = responseJson.data.data.data;
        const pagination = responseJson.data.data.pagination;
        const vendasContainer = document.getElementById("container-vendas");
        
        // Se não é loadMore, limpa o container
        if (!loadMore) {
          vendasContainer.innerHTML = "";
        }

        // Se não há vendas na primeira página
        if (vendas.length === 0 && !loadMore) {
          vendasContainer.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px 20px; color: #666;">
              <i class="mdi mdi-cart-outline" style="font-size: 64px; margin-bottom: 20px; color: #ddd;"></i>
              <h3 style="margin-bottom: 10px;">Nenhuma venda encontrada</h3>
              <p>Você ainda não realizou nenhuma venda.</p>
            </div>
          `;
          app.dialog.close();
          return;
        }

        // Remove o botão "Carregar mais" anterior se existir
        $("#loadMoreContainer").remove();

        vendas.forEach((venda) => {
          const vendasHTML = `                    
            <div class="card-list" data-id-venda="${venda.venda_id}">
               <div class="card-principal">
                  <div class="card-header open header-pago">
                     <div class="date">${formatarData(venda.data_criacao)}</div>
                     <div class="status">${venda.status_compra}</div>
                  </div>
                  <div class="card-body">
                     <div class="name">VENDA #${venda.venda_id}</div>
                     <div class="details">
                        <div class="detail">
                           <span>Nº</span>
                           <span>${venda.venda_id}</span>
                        </div>
                        <div class="detail">
                           <span class="mdi mdi-cash-multiple"></span>
                           <span>${venda.forma_pagamento.forma}</span>
                        </div>
                        <div class="detail">
                           <span>Total</span>
                           <span>${formatarMoeda(venda.valor_total)}</span>
                        </div>
                        <div class="detail">
                           <span>Cliente</span>
                           <span>${truncarNome(venda.cliente.nome_completo, 15)}</span>
                        </div>
                        <div class="items">${venda.quantidade_itens} ${venda.quantidade_itens === 1 ? 'item' : 'itens'}</div>
                     </div>
                  </div>
               </div>
            </div>
          `;
          vendasContainer.innerHTML += vendasHTML;
        });

        // Adiciona o botão "Carregar mais" se houver mais dados
        if (pagination && pagination.has_more) {
          const loadMoreHTML = `
            <div id="loadMoreContainer" style="text-align: center; margin: 30px 0; padding: 20px;">
              <button id="loadMoreButton" class="btn-large" data-next-offset="${pagination.next_offset}">
                <i class="mdi mdi-refresh"></i> Carregar mais vendas
              </button>
              <div style="margin-top: 10px; font-size: 14px; color: #666;">
                Mostrando ${(pagination.current_page - 1) * pagination.per_page + vendas.length} de ${pagination.total_records} vendas
              </div>
            </div>
          `;
          vendasContainer.innerHTML += loadMoreHTML;

          // Adiciona evento de clique ao botão "Carregar mais"
          $("#loadMoreButton").off('click').on('click', function() {
            const nextOffset = $(this).data('next-offset');
            listarVendas(true, nextOffset);
          });
        } else if (pagination && pagination.current_page > 1) {
          // Se não há mais dados, mas já carregou algumas páginas, mostra mensagem
          const endMessageHTML = `
            <div id="loadMoreContainer" style="text-align: center; margin: 30px 0; padding: 20px;">
              <div style="color: #666; font-size: 14px;">
                <i class="mdi mdi-check-circle" style="color: #28a745;"></i>
                Todas as ${pagination.total_records} vendas foram carregadas
              </div>
            </div>
          `;
          vendasContainer.innerHTML += endMessageHTML;
        }

        // Adiciona evento de clique às vendas (apenas aos novos)
        $(".card-list").off('click').on('click', function () {
          var vendaId = $(this).data("id-venda");
          localStorage.setItem("vendaId", vendaId);
          app.views.main.router.navigate("/resumo-venda/");
        });

        app.dialog.close();
      } else {
        app.dialog.close();
        // Verifica se há uma mensagem de erro definida
        const errorMessage = responseJson.message || "Formato de dados inválido";
        
        if (!loadMore) {
          // Se é o primeiro carregamento e deu erro, mostra tela de erro
          const vendasContainer = document.getElementById("container-vendas");
          vendasContainer.innerHTML = `
            <div class="error-state" style="text-align: center; padding: 40px 20px; color: #666;">
              <i class="mdi mdi-alert-circle" style="font-size: 64px; margin-bottom: 20px; color: #f44336;"></i>
              <h3 style="margin-bottom: 10px; color: #f44336;">Erro ao carregar vendas</h3>
              <p>${errorMessage}</p>
              <button onclick="listarVendas()" style="margin-top: 20px; padding: 10px 20px; background: var(--verde-escuro); color: white; border: none; border-radius: 5px;">
                <i class="mdi mdi-refresh"></i> Tentar novamente
              </button>
            </div>
          `;
        } else {
          // Se é carregamento de mais dados, restaura o botão
          $("#loadMoreButton").html('<i class="mdi mdi-refresh"></i> Carregar mais vendas');
          $("#loadMoreButton").prop('disabled', false);
          app.dialog.alert("Erro ao carregar mais vendas: " + errorMessage, "Erro");
        }
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      
      if (!loadMore) {
        // Se é o primeiro carregamento e deu erro, mostra tela de erro
        const vendasContainer = document.getElementById("container-vendas");
        vendasContainer.innerHTML = `
          <div class="error-state" style="text-align: center; padding: 40px 20px; color: #666;">
            <i class="mdi mdi-wifi-off" style="font-size: 64px; margin-bottom: 20px; color: #f44336;"></i>
            <h3 style="margin-bottom: 10px; color: #f44336;">Erro de conexão</h3>
            <p>Verifique sua conexão com a internet e tente novamente.</p>
            <button onclick="listarVendas()" style="margin-top: 20px; padding: 10px 20px; background: var(--verde-escuro); color: white; border: none; border-radius: 5px;">
              <i class="mdi mdi-refresh"></i> Tentar novamente
            </button>
          </div>
        `;
      } else {
        // Se é carregamento de mais dados, restaura o botão
        $("#loadMoreButton").html('<i class="mdi mdi-refresh"></i> Carregar mais vendas');
        $("#loadMoreButton").prop('disabled', false);
        app.dialog.alert("Erro de conexão ao carregar mais vendas", "Erro");
      }
    });
}
//Fim Função Lista Vendas

// Início da função detalhesVendas
function detalhesVenda() {
  var vendaId = localStorage.getItem("vendaId");
  var pessoaId = localStorage.getItem("pessoaId");
  app.dialog.preloader("Carregando...");

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };
  const dados = {
    vendedor: pessoaId,
    venda_id: vendaId,
  };

  const body = JSON.stringify({
    class: "PedidoDigitalRest",
    method: "MinhasVendasDigitais",
    dados: dados,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success' e se há dados de pedidos
      if (
        responseJson.status === "success" &&
        responseJson.data &&
        responseJson.data.data
      ) {
        const detalhes = responseJson?.data?.data?.data?.[0];

        console.log(detalhes);
        const detalhesContainer = document.getElementById("detalhesVenda");
        detalhesContainer.innerHTML = "";

        // Formata a data e moeda
        const formatarData = (data) => new Date(data).toLocaleString();
        const formatarMoeda = (valor) =>
          `R$ ${parseFloat(valor).toFixed(2).replace(".", ",")}`;

        // Monta o HTML dos itens do pedido
        const itensHTML = detalhes.itens
          .map(
            (item) => `
                      <li>
                          <img src="https://vitatop.tecskill.com.br/${
                            item.foto
                          }" alt="${
              item.descricao
            }" style="width: 50px; height: 50px;"/>
                          <span class="item-name">${item.descricao}</span>
                          <span class="item-quantity">${item.qtde}x</span>
                          <span class="item-price">${formatarMoeda(
                            item.preco
                          )}</span>
                      </li>
                  `
          )
          .join("");

        // Monta o HTML completo
        const detalhesHTML = `
                      <div class="order-summary">
                          <div class="order-details">
                              <p><h3>Número do Pedido: #${
                                detalhes.venda_id
                              }</h3></p>
                              <p><strong>Data do Pedido:</strong> ${formatarData(
                                detalhes.data_criacao
                              )}</p>
                          </div>
                          <div class="order-items">
                              <h3>Itens do Pedido</h3>
                              <ul>${itensHTML}</ul>
                          </div>
                          <div class="order-payment">
                              <h3>Forma de Pagamento</h3>
                              <p><strong>Método:</strong> ${
                                detalhes.forma_pagamento.forma
                              }</p>
                              <p><strong>Status:</strong> ${
                                detalhes.forma_pagamento.transacao_mensagem
                              }</p>
                              <!-- Seção de pagamento -->
                              <div class="payment-method-a display-none" id="pagamentoPix">
                                  <div class="payment-center">
                                      <img src="https://vitatop.tecskill.com.br/${
                                        detalhes.forma_pagamento.pix_qrcode
                                      }" width="250px" alt="QR Code">
                                      <span class="pix-key" id="pixKey">${
                                        detalhes.forma_pagamento.pix_key
                                      }</span>
                                      <button class="copy-button" id="copiarPix">Copiar Código Pix</button>
                                  </div>
                              </div>
                              <!-- Seção de pagamento -->
                              <div class="payment-method-a display-none" id="pagamentoBoleto">
                                  <div class="payment-center">
                                      <span class="pix-key" id="linhaBoleto">${
                                        detalhes.forma_pagamento
                                          .boleto_linhadigitavel
                                      }</span>
                                      <button class="copy-button" id="copiarBoleto">Copiar Linha Digitável</button>
                                      <button class="copy-button" id="baixarBoleto">Baixar Boleto PDF</button>
                                  </div>
                              </div>
                              <!-- Seção de pagamento -->
                              <div class="payment-method-a display-none" id="pagamentoCartao">
                                  <div class="payment-center">
                                  </div>
                              </div>
                          </div>
                          <div class="order-total">
                              <h3>Resumo</h3>
                              <p><strong>Total dos Itens:</strong> ${formatarMoeda(
                                detalhes.valor_produto
                              )}</p>
                              <p><strong>Frete:</strong> ${formatarMoeda(
                                detalhes.frete
                              )}</p>
                              <p><strong>Total:</strong> ${formatarMoeda(
                                detalhes.valor_total
                              )}</p>
                          </div>
                      </div>
                  `;

        detalhesContainer.innerHTML = detalhesHTML;
        if (detalhes.status_compra != 3) {
          $(".pagamento-display").removeClass("display-none");
        }
        if (detalhes.forma_pagamento == "PIX") {
          $("#pagamentoPix").removeClass("display-none");
        } else if (detalhes.forma_pagamento == "BOLETO") {
          $("#pagamentoBoleto").removeClass("display-none");
        } else {
          $("#pagamentoCartao").removeClass("display-none");
        }

        $("#copiarPix").on("click", function () {
          copiarParaAreaDeTransferencia(detalhes.pix_key);
        });

        $("#copiarBoleto").on("click", function () {
          copiarParaAreaDeTransferencia(detalhes.boleto_linhadigitavel);
        });

        // Baixar boleto
        $("#baixarBoleto").on("click", function () {
          app.dialog.confirm(
            "Deseja baixar o boleto no navegador?",
            function () {
              var ref = cordova.InAppBrowser.open(
                detalhes.boleto_impressao,
                "_system",
                "location=no,zoom=no"
              );
              ref.show();
            }
          );
        });

        app.dialog.close();
      } else {
        app.dialog.close();
        // Verifica se há uma mensagem de erro definida
        const errorMessage =
          responseJson.message || "Formato de dados inválido";
        app.dialog.alert(
          "Erro ao carregar pedidos: " + errorMessage,
          "Falha na requisição!"
        );
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao carregar pedidos: " + error.message,
        "Falha na requisição!"
      );
    });

  localStorage.removeItem("pedidoId");
}
// Fim da função detalhesVendas

// Início da função detalhesPedido
function detalhesPedido() {
  var pedidoId = localStorage.getItem("pedidoId");
  app.dialog.preloader("Carregando...");

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "PedidoVendaRest",
    method: "ListarPedidos",
    id: pedidoId,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success' e se há dados de pedidos
      if (
        responseJson.status === "success" &&
        responseJson.data &&
        responseJson.data.data
      ) {
        const detalhes = responseJson.data.data.data[0];
        const detalhesContainer = document.getElementById("detalhesPedidos");
        detalhesContainer.innerHTML = "";

        // Formata a data e moeda
        const formatarData = (data) => new Date(data).toLocaleString();
        const formatarMoeda = (valor) =>
          `R$ ${parseFloat(valor).toFixed(2).replace(".", ",")}`;

        // Monta o HTML dos itens do pedido
        const itensHTML = detalhes.itens
          .map(
            (item) => `
                      <li>
                          <img src="https://vitatop.tecskill.com.br/${
                            item.foto
                          }" alt="${
              item.descricao
            }" style="width: 50px; height: 50px;"/>
                          <span class="item-name">${item.descricao}</span>
                          <span class="item-quantity">${item.quantidade}x</span>
                          <span class="item-price">${formatarMoeda(
                            item.preco_total
                          )}</span>
                      </li>
                  `
          )
          .join("");

        // Verifica se deve exibir as seções de pagamento (oculta se status_compra == 3)
        const exibirPagamento = detalhes.status_compra != 3;

        // Verifica se há dados de rastreamento válidos
        const temRastreamento = detalhes.rastreios && 
                               detalhes.rastreios.length > 0 && 
                               detalhes.rastreios[0].codigo_rastreio && 
                               detalhes.rastreios[0].data_envio;

        // Monta o HTML da seção de envio apenas se houver rastreamento
        const envioHTML = temRastreamento ? `
                          <div class="order-address" id="detalhesEnvio">
                              <h3>Envio</h3>
                              <p><strong>Código de Rastreio:</strong> ${
                                detalhes.rastreios[0].codigo_rastreio
                              }</p>
                              <p><strong>Data de envio:</strong> ${formatarData(
                                detalhes.rastreios[0].data_envio
                              )}</p>
                          </div>
                      ` : '';

        // Monta o HTML completo
        const detalhesHTML = `
                      <div class="order-summary">
                          <div class="order-details">
                              <p><h3>Número do Pedido: #${detalhes.id}</h3></p>
                              <p><strong>Data do Pedido:</strong> ${formatarData(
                                detalhes.data_emissao
                              )}</p>
                              <p><strong>Status do Pedido:</strong> ${
                                detalhes.status_pedido
                              }</p>
                          </div>
                          <div class="order-items">
                              <h3>Itens do Pedido</h3>
                              <ul>${itensHTML}</ul>
                          </div>
                          <div class="order-payment">
                              <h3>Forma de Pagamento</h3>
                              <p><strong>Método:</strong> ${
                                detalhes.forma_pagamento
                              } <a href="#" class="pagamento-display display-none">Alterar</a></p>
                              <p><strong>Pagamento:</strong> ${
                                detalhes.mensagem_compra
                              }</p>

                              <!-- Seção de pagamento PIX -->
                              <div class="payment-method-a display-none" id="pagamentoPix">
                                  <div class="payment-center">
                                      ${exibirPagamento ? `
                                      <img src="https://vitatop.tecskill.com.br/${
                                        detalhes.pix_qrcode
                                      }" width="250px" alt="QR Code">
                                      <span class="pix-key" id="pixKey">${
                                        detalhes.pix_key
                                      }</span>
                                      <button class="copy-button" id="copiarPix">Copiar Código Pix</button>
                                      <button class="copy-button" id="jaPagueiPix" style="background-color: #00591f;">Já Paguei</button>
                                      ` : '<p>Pagamento processado.</p>'}
                                  </div>
                              </div>
                              <!-- Seção de pagamento BOLETO -->
                              <div class="payment-method-a display-none" id="pagamentoBoleto">
                                  <div class="payment-center">
                                      ${exibirPagamento ? `
                                      <span class="pix-key" id="linhaBoleto">${
                                        detalhes.boleto_linhadigitavel
                                      }</span>
                                      <button class="copy-button" id="copiarBoleto">Copiar Linha Digitável</button>
                                      <button class="copy-button" id="baixarBoleto">Baixar Boleto PDF</button>
                                      <button class="copy-button" id="jaPagueiBoleto" style="background-color: #00591f;">Já Paguei</button>
                                      ` : '<p>Pagamento processado.</p>'}
                                  </div>
                              </div>
                              <!-- Seção de pagamento CARTÃO -->
                              <div class="payment-method-a display-none" id="pagamentoCartao">
                                  <div class="payment-center">
                                      ${exibirPagamento ? '' : '<p>Pagamento processado.</p>'}
                                  </div>
                              </div>
                          </div>
                          ${envioHTML}
                          <div class="order-address">
                              <h3>Endereço de Entrega</h3>
                              
                              <p>${detalhes.endereco_entrega.rua}, ${
          detalhes.endereco_entrega.numero
        }</p>
                              <p>${detalhes.endereco_entrega.bairro}, ${
          detalhes.endereco_entrega.cidade
        } - ${detalhes.endereco_entrega.estado}</p>
                              <p>${detalhes.endereco_entrega.cep}</p>
                          </div>
                          <div class="order-total">
                              <h3>Resumo</h3>
                              <p><strong>Total dos Itens:</strong> ${formatarMoeda(
                                detalhes.valor_total
                              )}</p>
                              <p><strong>Frete:</strong></p>
                              <p><strong>Total:</strong> ${formatarMoeda(
                                detalhes.valor_total
                              )}</p>
                          </div>
                      </div>
                  `;

        detalhesContainer.innerHTML = detalhesHTML;
        
        // Só exibe o link "Alterar" se o status_compra != 3
        if (detalhes.status_compra != 3) {
          $(".pagamento-display").removeClass("display-none");
        } 

        // Só exibe e configura os eventos das seções de pagamento se status_compra != 3
        if (exibirPagamento) {
          if (detalhes.forma_pagamento == "PIX") {
              $("#pagamentoPix").removeClass("display-none");
            } else if (detalhes.forma_pagamento == "BOLETO") {
              $("#pagamentoBoleto").removeClass("display-none");
            } else {
              $("#pagamentoCartao").removeClass("display-none");
          }

          // Configura os eventos dos botões apenas se os elementos existem
          $("#copiarPix").on("click", function () {
            copiarParaAreaDeTransferencia(detalhes.pix_key);
          });

          $("#jaPagueiPix").on("click", function () {
            confirmarPagamento(pedidoId);
          });

          $("#jaPagueiBoleto").on("click", function () {
            confirmarPagamento(pedidoId);
          });

          $("#copiarBoleto").on("click", function () {
            copiarParaAreaDeTransferencia(detalhes.boleto_linhadigitavel);
          });

          // Baixar boleto
          $("#baixarBoleto").on("click", function () {
            app.dialog.confirm(
              "Deseja baixar o boleto no navegador?",
              function () {
                var ref = cordova.InAppBrowser.open(
                  detalhes.boleto_impressao,
                  "_system",
                  "location=no,zoom=no"
                );
                ref.show();
              }
            );
          });
        }

        app.dialog.close();
      } else {
        app.dialog.close();
        // Verifica se há uma mensagem de erro definida
        const errorMessage =
          responseJson.message || "Formato de dados inválido";
        app.dialog.alert(
          "Erro ao carregar pedidos: " + errorMessage,
          "Falha na requisição!"
        );
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao carregar pedidos: " + error.message,
        "Falha na requisição!"
      );
    });

  localStorage.removeItem("pedidoId");
}
// Fim da função detalhesPedido


//Inicio Funçao Confirmar Pagamento
function confirmarPagamento(pedidoId) {
  app.dialog.preloader("Carregando...");
  if(!pedidoId){
    var pedidoId = localStorage.getItem("pedidoId");
  }
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };
  
  const body = JSON.stringify({
    class: "PagamentoSafe2payRest",
    method: "VerificaPix",
    pedido_id: pedidoId
  });
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      app.dialog.close();
      console.log(responseJson);
      if (responseJson.data.data.status_compra == 3) {               
        app.dialog.confirm(
              "Pagamento Confirmado com Sucesso!",
              "Sucesso!",
              function () {
                app.views.main.router.navigate("/pedidos/");
              }
            );     
      } else {
        app.dialog.alert('Ainda não compensou seu pagamento, aguarde alguns minutos e tente novamente!');
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao confirmar pagamento: " + error.message,
        "Falha na requisição!"
      );
    });
}
//Fim Função Confirmar Pagamento


//Inicio Funçao Listar Banners
function listarBanners() {
  app.dialog.preloader("Carregando...");
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };
  const dados = {
    local: 1,
  };
  const body = JSON.stringify({
    class: "BannerRest",
    method: "ListaBanner",
    dados: dados,
  });
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      app.dialog.close();
      if (responseJson.status === "success") {
        const banners = responseJson.data;
        // Seleciona o wrapper do Swiper
        const swiperWrapper = document.querySelector(".swiper-wrapper");
        // Limpa os slides existentes
        swiperWrapper.innerHTML = "";
        // Adiciona os novos slides
        banners.forEach((banner) => {
          const slide = document.createElement("div");
          slide.classList.add("swiper-slide");
          const img = document.createElement("img");
          img.classList.add("img-fluid");
          img.src = banner.url_arquivo;
          img.alt = banner.titulo;
          slide.appendChild(img);
          swiperWrapper.appendChild(slide);
        });
      } else {
        console.error("Erro ao obter banners:", responseJson.message);
        app.views.main.router.navigate("/login-view/");
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao carregar banners: " + error.message,
        "Falha na requisição!"
      );

      app.views.main.router.navigate("/login-view/");
    });
}
//Fim Função Listar Banners

//Inicio Funçao CEP
function cepEndereco(cep) {
  app.dialog.preloader("Carregando...");
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };
  const dados = {
    cep: cep,
  };
  const body = JSON.stringify({
    class: "PessoaRestService",
    method: "ConsultaCEP",
    dados: dados,
  });
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      app.dialog.close();
      if (responseJson.status === "success") {
        var dadosEndereco = responseJson.data;
        $("#logradouroEndCliente").val(dadosEndereco.rua);
        $("#bairroEndCliente").val(dadosEndereco.bairro);
        $("#cidadeEndCliente").val(dadosEndereco.cidade);
        $("#estadoEndCliente").val(dadosEndereco.uf);
      } else {
        console.error("Erro ao obter dados do endereço:", responseJson.message);
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao buscar endereço: " + error.message,
        "Falha na requisição!"
      );
    });
}
//Fim Função CEP

//Inicio Funçao CEP Editar
function cepEnderecoEdit(cep) {
  app.dialog.preloader("Carregando...");
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };
  const dados = {
    cep: cep,
  };
  const body = JSON.stringify({
    class: "PessoaRestService",
    method: "ConsultaCEP",
    dados: dados,
  });
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      app.dialog.close();
      if (responseJson.status === "success") {
        var dadosEndereco = responseJson.data;
        $("#logradouroEndEdit").val(dadosEndereco.rua);
        $("#bairroEndEdit").val(dadosEndereco.bairro);
        $("#cidadeEndEdit").val(dadosEndereco.cidade);
        $("#estadoEndEdit").val(dadosEndereco.uf);
      } else {
        console.error("Erro ao obter dados do endereço:", responseJson.message);
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao buscar endereço: " + error.message,
        "Falha na requisição!"
      );
    });
}
//Fim Função CEP Editar

//Inicio Funçao Listar Notificações
function listarNotificacoes() {
  var userId = localStorage.getItem("userId");
  app.dialog.preloader("Carregando...");

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "NotificacaoAppRest",
    method: "ListarNotificacoes",
    id_usuario: userId,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success' e se há dados de notificações
      if (
        responseJson.status === "success" &&
        responseJson.data.status === "success"
      ) {
        const notificacoes = responseJson.data.data; // Aqui acessa a lista de notificações
        // Verifica se a lista está vazia
        if (notificacoes.length === 0) {
          app.dialog.close();
          // Exibe mensagem "Nada por enquanto..."
          $("#container-notificacao").html(`
              <div class="text-align-center">
                <img width="150" src="img/bell.gif">
                <br><span class="color-gray">Nada por enquanto...</span>
              </div>
            `);
          return;
        }

        notificacoes.forEach((notificacao) => {
          const isVisto = notificacao.visto === "S"; // Verifica se a notificação foi vista

          const notificacaoHTML = `            
              <div class="notification-item swipeable ${
                isVisto ? "visto" : "nao-visto"
              }"
                  data-notification-id="${notificacao.id}">
                <div class="notification-icon">
                  ${
                    notificacao.icone
                      ? notificacao.icone
                      : '<i class="mdi mdi-bell"></i>'
                  }
                </div>
                <div class="notification-content">
                  <h3>${notificacao.titulo}</h3>
                  <p>${truncarNome(notificacao.mensagem, 25)}</p>
                </div>
                <div class="notification-actions">
                  <button class="action-btn" 
                    data-id="${notificacao.id}"
                    data-icone="${notificacao.icone}"
                    data-titulo="${notificacao.titulo}"
                    data-mensagem="${notificacao.mensagem}"
                    data-data="${formatarData(notificacao.data_criacao)}">
                    Detalhes
                  </button>
                </div>
                <div class="notification-time">${timeAgo(
                  notificacao.data_criacao
                )}</div>
              </div>`;

          // Adiciona o HTML da notificação ao container
          $("#container-notificacao").append(notificacaoHTML);
        });
        // Add swipe-to-delete functionality
        $(".swipeable").on("touchstart", function (e) {
          const startX = e.originalEvent.touches[0].pageX;
          let element = $(this);

          $(this).on("touchmove", function (e) {
            const moveX = e.originalEvent.touches[0].pageX;
            const deltaX = moveX - startX;

            // Only allow swiping right
            if (deltaX > 0) {
              element.css("transform", `translateX(${deltaX}px)`);
            }
          });

          $(this).on("touchend", function (e) {
            const moveX = e.originalEvent.changedTouches[0].pageX;
            const deltaX = moveX - startX;

            // If swiped more than 100 pixels, delete the notification
            if (deltaX > 100) {
              const notificacaoId = element.data("notification-id");

              // Call your delete function
              apagarNotificacao(notificacaoId);

              // Animate and remove the notification from DOM
              element.css("transform", "translateX(100%)");
              element.fadeOut(300, function () {
                $(this).remove();
              });
            } else {
              // Snap back if not swiped far enough
              element.css("transform", "translateX(0)");
            }

            // Remove event listeners
            $(this).off("touchmove touchend");
          });
        });
        // Adiciona o evento de clique ao botao detalhes notificação
        $(".action-btn").on("click", function () {
          const notificacaoId = $(this).data("id"); // Obtém o ID da notificação
          const iconeNot =
            $(this).data("icone") || '<i class="mdi mdi-bell"></i>';
          const tituloNot = $(this).data("titulo");
          const descricaoNot = $(this).data("mensagem");
          const dataNot = $(this).data("data");

          // Atualiza o conteúdo do popup
          $("#icone-pop").html(iconeNot); // Define o ícone
          $("#title-pop").text(tituloNot); // Define o título
          $("#descricao-pop").text(descricaoNot); // Define a descrição
          $("#data-pop").text(dataNot);
          app.popup.open(".popup-detalhes-notificacao");

          // Aqui você pode executar outra ação, como marcar a notificação como lida
          marcarComoLida(notificacaoId);
        });

        app.dialog.close(); // Fecha o dialog após sucesso
      } else {
        app.dialog.close();
        // Exibe mensagem de erro caso o status não seja 'success'
        console.error("Erro ao obter notificações:", responseJson.data.message);
        app.dialog.alert(responseJson.data.message, "Erro!");
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao carregar notificações: " + error.message,
        "Falha na requisição!"
      );
    });
}
//Fim Função Listar Notificações

//Inicio Função Marcar como Lida a Notificação
function marcarComoLida(notificacaoId) {
  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "NotificacaoAppRest",
    method: "NotificacaoLida",
    id_notificacao: notificacaoId,
  });

  // Fazendo a requisição
  fetch(apiServerUrl, {
    method: "POST",
    headers: headers,
    body: body,
  })
    .then((response) => response.json())
    .then((responseJson) => {
      if (responseJson.status !== "success") {
        app.dialog.alert(
          "Erro ao marcar como lida: " + responseJson.message,
          "Erro"
        );
      }
    })
    .catch((error) => {
      console.error("Erro:", error);
      app.dialog.alert("Erro ao marcar como lida: " + error.message, "Erro");
    });
}
//Fim Função Marcar como Lida a Notificação

// Inicio da Funçao que apaga a notificação
function apagarNotificacao(notificacaoId) {
  app.dialog.preloader("Apagando...");

  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "NotificacaoAppRest",
    method: "ApagarNotificacao",
    id_notificacao: notificacaoId,
  });

  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      if (responseJson.status === "success") {
        app.dialog.close();
      } else {
        app.dialog.close();
        app.dialog.alert(
          "Erro ao apagar notificação:",
          responseJson.data.message
        );
        console.error("Erro ao apagar notificação:", responseJson.data.message);
      }
    })
    .catch((error) => {
      console.error("Erro:", error);
    });
}
// Fim da Funçao que apaga a notificação

//Inicio Funçao Saldo da Carteira
function saldoCarteira() {
  app.dialog.preloader("Carregando...");

  var pessoaId = localStorage.getItem("pessoaId");

  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "BonusPremioService",
    method: "SaldoTotal",
    pessoa_id: pessoaId
  });

  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      app.dialog.close(); // Fechar o loader aqui já é mais seguro

      if (responseJson.status === "success") {
        const saldo = responseJson.data;

        // Inicializa os saldos com 0.00
        let valorDisponivel = 0.00;
        let valorBloqueado = 0.00;

        saldo.forEach((item) => {
          if (item.bloqueado === "0") {
            valorDisponivel = parseFloat(item.valor_comissao);
          } else if (item.bloqueado === "1") {
            valorBloqueado = parseFloat(item.valor_comissao);
          } else if (item.bloqueado === "total") {
            valorTotal = parseFloat(item.valor_comissao);
          }
        });

        $("#saldoTotal").html(formatarMoeda(valorTotal));
        $("#saldoDisponivel").html(formatarMoeda(valorDisponivel));
        $("#saldoBloqueado").html(formatarMoeda(valorBloqueado));
      } else {
        console.error("Erro ao obter dados da carteira:", responseJson.message);
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert("Erro ao obter dados da carteira Digital: " + error.message, "Falha na requisição!");
    });
}

//Fim Função Saldo da Carteira

//Inicio Funçao Listar Categorias
function listarCategoriasCurso() {
  app.dialog.preloader("Carregando...");
  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "CursoCategoriaRest",
    method: "loadAll",
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success' e se há dados de pedidos
      if (responseJson.status === "success") {
        const categorias = responseJson.data;
        const cores = ["red", "blue", "green", "yellow", "purple", "orange"];

        categorias.forEach((categoria, index) => {
          const cor = cores[index % cores.length];
          var categoriaHTML = `
                      <div class="categoria" data-color="${cor}">
                          <i class="${categoria.icone}"></i>
                          <div class="text">${categoria.nome}</div>
                      </div>
                      `;

          $("#categoriaList").append(categoriaHTML);
        });

        // Fechar o dialog ou outra ação necessária após preenchimento do select
        app.dialog.close();
      } else {
        app.dialog.close();
        // Tratar caso o status não seja "success"
        console.error(
          "Erro ao obter dados de faixas etárias:",
          responseJson.message
        );
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao carregar pedidos: " + error.message,
        "Falha na requisição!"
      );
    });
}
//Fim Função Listar Categorias

//Inicio da funçao contagem Notificações
function buscarQtdeNotif() {
  var userId = localStorage.getItem("userId");

  // Verifica se o userId existe
  if (!userId) {
    console.warn("userId não encontrado no localStorage");
    return;
  }

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "NotificacaoAppRest",
    method: "QtdeNotificacoes",
    id_usuario: userId,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      if (
        responseJson.status === "success" &&
        responseJson.data.status === "success"
      ) {
        const quantidadeNaoVistas = responseJson.data.data.quantidade || 0;

        // Aguardar um pouco antes de tentar atualizar
        setTimeout(() => {
          try {
            // Método 1: Atualizar badge no cabeçalho usando classe
            const btnNotificacao = document.querySelector(".btn-notificacao");
            if (btnNotificacao) {
              btnNotificacao.setAttribute("data-count", quantidadeNaoVistas);
            } else {
              console.warn("Elemento .btn-notificacao não encontrado");
            }

            // Método 2: Tentar também por todos os elementos com data-count (fallback)
            const allNotificationBadges =
              document.querySelectorAll("[data-count]");
            allNotificationBadges.forEach((badge) => {
              if (
                badge.classList.contains("btn-notificacao") ||
                badge.querySelector("i.mdi-bell-outline")
              ) {
                badge.setAttribute("data-count", quantidadeNaoVistas);
              }
            });

            // Método 3: Atualizar badge no menu lateral
            const badgeMenuLateral =
              document.getElementById("badge-notif-menu");
            if (badgeMenuLateral) {
              badgeMenuLateral.setAttribute("data-count", quantidadeNaoVistas);
              badgeMenuLateral.textContent = quantidadeNaoVistas;
            }

            // Método 4: Forçar refresh do CSS se necessário
            if (quantidadeNaoVistas > 0) {
              // Força uma pequena alteração para re-renderizar o CSS
              if (btnNotificacao) {
                btnNotificacao.style.position = "relative"; // Força re-render
                // Remove e readiciona o atributo para forçar atualização do CSS
                btnNotificacao.removeAttribute("data-count");
                setTimeout(() => {
                  btnNotificacao.setAttribute(
                    "data-count",
                    quantidadeNaoVistas
                  );
                }, 10);
              }
            }

            // Salvar no localStorage para referência
            localStorage.setItem("qtdeNotificacoes", quantidadeNaoVistas);
          } catch (error) {
            console.error("Erro ao atualizar badges de notificação:", error);
          }
        }, 200); // Aumentei o timeout para 200ms
      } else {
        console.error(
          "Erro ao contar notificações:",
          responseJson.message || "Resposta inválida"
        );
        atualizarBadgesNotificacao(0);
      }
    })
    .catch((error) => {
      console.error("Erro na requisição de notificações:", error);
      atualizarBadgesNotificacao(0);
    });
}

// Função auxiliar para atualizar badges de notificação
function atualizarBadgesNotificacao(quantidade) {
  const qtde = quantidade || 0;

  setTimeout(() => {
    // Atualizar badge no cabeçalho
    const btnNotificacao = document.querySelector(".btn-notificacao");
    if (btnNotificacao) {
      btnNotificacao.setAttribute("data-count", qtde);
      // Força re-render removendo e readicionando
      if (qtde > 0) {
        btnNotificacao.style.position = "relative";
      }
    }

    // Atualizar badge no menu lateral
    const badgeMenuLateral = document.getElementById("badge-notif-menu");
    if (badgeMenuLateral) {
      badgeMenuLateral.setAttribute("data-count", qtde);
      badgeMenuLateral.textContent = qtde;
    }

    // Salvar no localStorage
    localStorage.setItem("qtdeNotificacoes", qtde);
  }, 100);
}

// Função para debug - verificar se o CSS está funcionando
function debugNotificationBadge() {
  const btnNotificacao = document.querySelector(".btn-notificacao");
  if (btnNotificacao) {
    // Teste manual
    btnNotificacao.setAttribute("data-count", "5");
  }
}

//Fim da funçao contagem Notificações
//Fim da funçao contagem Notificações

//Inicio Funçao Selecionar Endereço
function selecionarEndereco(enderecoSelecionado) {
  app.dialog.preloader("Carregando...");

  const pessoaId = localStorage.getItem("pessoaId");

  const endereco = enderecoSelecionado;

  const dados = {
    pessoa_id: pessoaId,
    endereco_id: endereco.id,
  };

  // Armazena o endereço selecionado no localStorage
  localStorage.setItem("enderecoSelecionado", endereco.id);

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "PagamentoSafe2payRest",
    method: "AlterarEndereco",
    dados: dados,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      if (
        responseJson.status == "success" &&
        responseJson.data.status == "success"
      ) {
        app.dialog.close();
        var valorFrete = responseJson.data.data.frete;

        // Atualiza o valor do frete na interface
        $("#fretePedido").html(
          valorFrete.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })
        );

        // Destacar o endereço selecionado na interface
        $(".select-address").removeClass("text-blue-700 font-bold");
        $(`.select-address[data-id='${endereco.id}']`).addClass(
          "text-blue-700 font-bold"
        );

        if (endereco) {
          $("#selectedAddress").html(`
            <div class="flex items-start space-x-3">
              <svg class="w-5 h-5 text-gray-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <div>
                <div class="flex items-center space-x-2">
                  <h3 class="font-medium">${
                    endereco.nome_endereco || "Residencial"
                  }</h3>
                  ${
                    endereco.principal == "S"
                      ? `<span class="px-2 py-0.5 text-white text-xs rounded-full" style="background-color: #ff7b39">Principal</span>`
                      : ""
                  }
                </div>
                <p class="text-gray-600 text-sm mt-1">
                  ${endereco.rua}, ${endereco.numero} - ${endereco.bairro}
                </p>
                <p class="text-gray-600 text-sm">
                  ${endereco.municipio.nome}, ${endereco.estado.sigla} - CEP: ${
            endereco.cep
          }
                </p>
              </div>
            </div>
          `);
        }
      } else {
        app.dialog.close();
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
    });
}
//Fim Função Selecionar Endereço

// Início Função Listar Endereços
function listarEnderecos() {
  app.dialog.preloader("Carregando...");
  const pessoaId = localStorage.getItem("pessoaId");

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "PessoaRestService",
    method: "listarPessoa",
    pessoa_id: pessoaId,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      if (responseJson.data.status === "success") {
        const enderecos = responseJson.data.data.enderecos;
        $("#listaDeEnderecos").html(""); // Limpa a lista

        let enderecoPrincipal = null;
        let ultimoEndereco = null;

        enderecos.forEach((endereco, index) => {
          ultimoEndereco = endereco; // Atualiza o último endereço iterado

          var enderecoHTML = `
            <div class="border rounded-lg p-4">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-2">
                    <span class="font-medium">${
                      endereco.nome_endereco || "Residencial"
                    }</span>
                    ${
                      endereco.principal == "S"
                        ? `<span class="px-2 py-0.5 text-white text-xs rounded-full" style="background-color: #ff7b39">Principal</span>`
                        : ""
                    }
                  </div>
                  <p class="text-gray-600 text-sm">
                    ${endereco.rua}, ${endereco.numero} - ${endereco.bairro}
                  </p>
                  <p class="text-gray-600 text-sm">
                    ${endereco.municipio.nome}, ${
            endereco.estado.sigla
          } - CEP: ${endereco.cep}
                  </p>
                </div>
                <div class="flex items-center space-x-2">
                  <button class="text-gray-400 hover:text-gray-600 edit-address">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                    </svg>
                  </button>
                  <button class="text-blue-500 hover:text-blue-700 select-address">
                    Selecionar
                  </button>
                </div>
              </div>
            </div>
          `;

          if (endereco.principal == "S") {
            enderecoPrincipal = endereco;
          }

          $("#listaDeEnderecos").append(enderecoHTML);
          // Atribuindo o objeto endereco ao botão clicado
          $(".edit-address").last().data("editarEndereco", endereco);
          $(".select-address").last().data("endereco", endereco);
        });

        $(".edit-address").on("click", function () {
          let editarEndereco = $(this).data("editarEndereco");
          $("#idEnderecoEdit").val(editarEndereco.id);
          $("#nomeEnderecoEdit").val(editarEndereco.nome_endereco);
          $("#cepEdit").val(editarEndereco.cep);
          $("#logradouroEndEdit").val(editarEndereco.rua);
          $("#numeroEndEdit").val(editarEndereco.numero);
          $("#complementoEndEdit").val(editarEndereco.complemento);
          $("#bairroEndEdit").val(editarEndereco.bairro);
          $("#cidadeEndEdit").val(editarEndereco.cidade);
          $("#estadoEndEdit").val(editarEndereco.estado.sigla);
          // Definir o estado do checkbox baseado no valor de is_principal
          if (editarEndereco.principal == "S") {
            $("#defaultAddressEdit").prop("checked", true); // Marca o checkbox
          } else {
            $("#defaultAddressEdit").prop("checked", false); // Desmarca o checkbox
          }

          document.getElementById("addressModal").classList.add("hidden");
          document
            .getElementById("editAddressModal")
            .classList.remove("hidden");
        });

        $(".closeEditAddressModal").on("click", function () {
          document.getElementById("editAddressModal").classList.add("hidden");
          document.getElementById("addressModal").classList.remove("hidden");
        });

        // Define o endereço selecionado automaticamente
        let enderecoSelecionado = enderecoPrincipal || ultimoEndereco;
        if (enderecoSelecionado) {
          // Chama a função para selecionar o endereço e recalcular o frete
          selecionarEndereco(enderecoSelecionado);
        }

        // Adiciona evento para recalcular o frete ao trocar o endereço
        $(".select-address").click(function () {
          let endereco = $(this).data("endereco");
          selecionarEndereco(endereco);
          $("#addressModal").addClass("hidden");
        });

        app.dialog.close();
      } else {
        app.dialog.close();
        console.error(
          "Erro ao obter dados de endereços:",
          responseJson.message
        );
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao carregar endereços: " + error.message,
        "Falha na requisição!"
      );
    });
}
// Fim Função Listar Endereços

// Início Função  Preencher Perfil
function listarPerfil(rota) {
  app.dialog.close();
  app.dialog.preloader("Carregando...");
  const pessoaId = localStorage.getItem("pessoaId");

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "PessoaRestService",
    method: "listarPessoa",
    pessoa_id: pessoaId,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      if (responseJson.data.status === "success") {
        const pessoa = responseJson.data.data.pessoa;

        if(rota == "index"){
          $("#profileImageMenu").attr(
            "src",
            "https://vitatop.tecskill.com.br/" + pessoa.foto
          );
          app.dialog.close();
          return;
        }
        
          $("#profileImageMenu").attr(
            "src",
            "https://vitatop.tecskill.com.br/" + pessoa.foto
          );

        $("#profileImage").attr(
          "src",
          "https://vitatop.tecskill.com.br/" + pessoa.foto
        );
        $("#usuarioNome").html(pessoa.nome);
        $("#emailUsuario").html(pessoa.email);
        $("#editNome").val(pessoa.nome);
        $("#editEmail").val(pessoa.email);
        $("#editTelefone").val(pessoa.celular);
        $("#editDocumento").val(pessoa.documento);
        if (pessoa.tipo === "F") {
          $("#editDocumento").mask("000.000.000-00");
        } else {
          $("#editDocumento").mask("00.000.000/0000-00");
        }
        app.dialog.close();
      } else {
        app.dialog.close();
        console.error(
          "Erro ao obter dados do Distribuidor:",
          responseJson.message
        );
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao obter dados do Distribuidor: " + error.message,
        "Falha na requisição!"
      );
    });
}
// Fim Função Preencher Perfil

//Inicio da Funçao atualizar Foto
function enviarFotoPerfil(base64Foto) {
  app.dialog.preloader("Enviando foto...");
  const pessoaId = localStorage.getItem("pessoaId");

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + userAuthToken,
  };

  // Corpo da requisição, compatível com sua API
  const body = JSON.stringify({
    class: "PessoaRestService",
    method: "editarPessoa",
    id: pessoaId,
    foto_base64: base64Foto,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      app.dialog.close(); // Fecha o preloader

      if (responseJson.data.status === "success") {
        app.dialog.alert("Foto atualizada com sucesso!");

        // Atualiza a imagem na tela (se o backend retornar a nova URL)
        // Se não retornar, usa a própria base64:
        $("#profileAvatar").attr("src", base64Foto);

        // Ou recarrega o perfil para garantir que tudo esteja sincronizado:
        listarPerfil();
      } else {
        console.error("Erro:", responseJson.data.message);
        app.dialog.alert("Erro: " + responseJson.data.message);
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro ao enviar foto:", error);
      app.dialog.alert(
        "Erro ao enviar a foto: " + error.message,
        "Falha na requisição!"
      );
    })
    .finally(() => {
      // Limpa o input para permitir reenvio se necessário
      $('#inputFotoGaleria').val('');
    });
}
//Fim da Funçao atualizar Foto

//Inicio da Funçao atualizar Perfil
function salvarPerfil() {
            const pessoaId = localStorage.getItem("pessoaId");
            const nome = $('#editNome').val().trim();
            const celular = $('#editTelefone').val().trim();

            if (!nome || !celular) {
              return app.dialog.alert("Preencha todos os campos obrigatórios.");
            }

            app.dialog.preloader('Salvando...');

            fetch(apiServerUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + userAuthToken
              },
              body: JSON.stringify({
                class: "PessoaRestService",
                method: "editarPessoa",
                id: pessoaId,
                nome: nome,
                celular: celular
              })
            })
            .then(res => res.json())
            .then(data => {
              app.dialog.close();
              if (data.status === "success") {
                app.popup.close('.popup-editar');
                app.dialog.alert("Perfil atualizado com sucesso!");
                listarPerfil(); // Atualiza os dados na tela
              } else {
                app.dialog.alert("Erro: " + data.message);
              }
            })
            .catch(err => {
              app.dialog.close();
              console.error(err);
              app.dialog.alert("Erro ao atualizar perfil.");
            });
}
//Fim da Funçao atualizar Perfil

//Inicio da Funçao atualizar senha
function salvarSenha() {
            const pessoaId = localStorage.getItem("pessoaId");
            const senhaAtual = $('#senhaAtual').val().trim();
            const novaSenha = $('#novaSenha').val().trim();
            const reNovaSenha = $('#reNovaSenha').val().trim();

            if (!senhaAtual || !novaSenha || !reNovaSenha) {
              return app.dialog.alert("Preencha todos os campos.");
            }

            if (novaSenha !== reNovaSenha) {
              return app.dialog.alert("As senhas não coincidem.");
            }

            app.dialog.preloader('Salvando...');

            fetch(apiServerUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + userAuthToken
              },
              body: JSON.stringify({
                class: "PessoaRestService",
                method: "editarPessoa",
                id: pessoaId,
                senha_atual: senhaAtual,
                senha: novaSenha // Assumindo que a senha atual já foi validada no backend ou não é necessária aqui
              })
            })
            .then(res => res.json())
            .then(data => {
              app.dialog.close();
              if (data.data.status === "success") {
                app.popup.close('.popup-senha');
                app.dialog.alert("Senha atualizada com sucesso!");
                $('#senhaAtual').val('');
                $('#novaSenha').val('');
                $('#reNovaSenha').val('');
              } else {
                app.dialog.alert("Erro: " + data.message);
              }
            })
            .catch(err => {
              app.dialog.close();
              console.error(err);
              app.dialog.alert("Erro ao atualizar senha.");
            });
}
//Fim da Funçao atualizar senha


//Inicio Funçao Listar Categorias
function finalizarCompra(
  formaPagamento,
  titular,
  numero_cartao,
  data_expiracao,
  cvc
) {
  app.dialog.preloader("Carregando...");
  const pessoaId = localStorage.getItem("pessoaId");
  const enderecoEntregaId = localStorage.getItem("enderecoSelecionado");

  const data = {
    class: "PagamentoSafe2payRest",
    method: "IncluirVenda",
    dados: {
      pessoa_id: pessoaId,
      pagamento: {
        forma_pagamento: formaPagamento,
        titular: titular,
        numero_cartao: numero_cartao,
        data_expiracao: data_expiracao,
        cvc: cvc,
      },
      destinatario: {
        pessoa_id: pessoaId,
        endereco_id: enderecoEntregaId,
        frete: 0,
      },
    },
  };

  fetch(apiServerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + userAuthToken,
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success'
      if (
        responseJson.status == "success" &&
        responseJson.data.status == "success"
      ) {
        // Dados a serem armazenados
        var data = {
          formaSelecionada: formaPagamento,
          linhaDigitavel: responseJson.data.data.boleto_linhadigitavel,
          pixKey: responseJson.data.data.pix_key,
          qrCodePix: responseJson.data.data.pix_qrcode,
          linkBoleto: responseJson.data.data.boleto_impressao,
          dataVencimento: responseJson.data.data.data_vencimento,
          valorTotal: responseJson.data.data.valor_total,
          pedidoId: responseJson.data.data.pedido_id,
          status_compra: responseJson.data.data.status_compra,
          status_mensagem: responseJson.data.data.status_mensagem,
          bandeira: responseJson.data.data.bandeira,
          cartao_numero: responseJson.data.data.cartao_numero,
          nome_cartao: responseJson.data.data.nome_cartao,
        };

        // Armazenar no localStorage
        localStorage.setItem("pagamentoData", JSON.stringify(data));
        localStorage.setItem(
          "pedidoIdPagamento",
          responseJson.data.data.pedido_id
        );

        app.dialog.close();
        app.views.main.router.navigate("/pagamento/");

        /* Abrir navegador para baixar boleto
              var ref = cordova.InAppBrowser.open(linkBoleto, '_system', 'location=no,zoom=no');
              ref.show();*/
      } else {
        app.dialog.close();
        app.dialog.alert(
          "Erro ao finalizar compra: " + responseJson,
          "Falha na requisição!"
        );
      }
    })
    .catch((error) => {
      app.dialog.close();
      app.dialog.alert(
        "Erro ao finalizar compra: " + error,
        "Falha na requisição!"
      );
      console.error("Error:", error);
    });
}
//Fim Função Finalizar Compra

//Inicio Função Refazer Pagamento
function refazerPagamento(
  formaPagamento,
  titular,
  numero_cartao,
  data_expiracao,
  cvc
) {
  app.dialog.preloader("Carregando...");
  const pedidoId = localStorage.getItem("pedidoIdPagamento");

  const data = {
    class: "PagamentoSafe2payRest",
    method: "PagamentoPedido",
    dados: {
      pedido_id: pedidoId,
      pagamento: {
        forma_pagamento: formaPagamento,
        titular: titular,
        numero_cartao: numero_cartao,
        data_expiracao: data_expiracao,
        cvc: cvc,
      },
    },
  };

  fetch(apiServerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + userAuthToken,
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success'
      if (
        responseJson.status == "success" &&
        responseJson.data.status == "success"
      ) {
        // Dados a serem armazenados
        var data = {
          formaSelecionada: formaPagamento,
          linhaDigitavel: responseJson.data.data.boleto_linhadigitavel,
          pixKey: responseJson.data.data.pix_key,
          qrCodePix: responseJson.data.data.pix_qrcode,
          linkBoleto: responseJson.data.data.boleto_impressao,
          dataVencimento: responseJson.data.data.data_vencimento,
          valorTotal: responseJson.data.data.valor_total,
          pedidoId: responseJson.data.data.pedido_id,
          status_compra: responseJson.data.data.status_compra,
          status_mensagem: responseJson.data.data.status_mensagem,
          bandeira: responseJson.data.data.bandeira,
          cartao_numero: responseJson.data.data.cartao_numero,
          nome_cartao: responseJson.data.data.nome_cartao,
        };

        // Armazenar no localStorage
        localStorage.setItem("pagamentoData", JSON.stringify(data));

        app.dialog.close();
        app.views.main.router.navigate("/pagamento/");

        /* Abrir navegador para baixar boleto
              var ref = cordova.InAppBrowser.open(linkBoleto, '_system', 'location=no,zoom=no');
              ref.show();*/
      } else {
        app.dialog.close();
        app.dialog.alert(
          "Erro ao finalizar compra: " + responseJson,
          "Falha na requisição!"
        );
      }
    })
    .catch((error) => {
      app.dialog.close();
      app.dialog.alert(
        "Erro ao finalizar compra: " + error,
        "Falha na requisição!"
      );
      console.error("Error:", error);
    });
}
//Fim Função Refazer Pagamento

//Inicio Funçao Listar Carrinho
function listarCarrinho() {
  app.dialog.preloader("Carregando...");
  const pessoaId = localStorage.getItem("pessoaId");

  const dados = {
    pessoa_id: pessoaId,
  };

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "PagamentoSafe2payRest",
    method: "ListarCarrinho",
    dados: dados,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success'
      if (
        responseJson.status == "success" &&
        responseJson.data.status == "sucess"
      ) {
        const quantidadeItens = responseJson.data.data.itens.length;
        const total = responseJson.data.data.total;
        var pessoaIdCarrinho = responseJson.data.data.pessoa_id;

        if (quantidadeItens > 0) {
          $("#toolbar-carrinho").removeClass("display-none");
          $("#listaCarrinho").empty();

          responseJson.data.data.itens.forEach((item) => {
            var itemDiv = `
              
                  <div class="flex space-x-4" style="margin-bottom: 18px;">
                    <img
                      src="https://vitatop.tecskill.com.br/${item.foto}"
                      alt="${item.nome}"
                      class="w-20 h-20 rounded-lg object-cover"
                    />
                    <div class="flex-1">
                      <div class="flex justify-between">
                        <h3 class="font-medium">${item.nome}</h3>
                        <button class="text-red-500 delete-item" style="width: 30px;"
                        data-produto-id="${item.produto_id}">
                          <svg
                            class="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            ></path>
                          </svg>
                        </button>
                      </div>
                      <p class="text-gray-500 text-sm mb-2">Premium</p>
                      <div class="flex justify-between items-center">
                        <div class="flex items-center space-x-2">
                          <button
                            class="minus w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                            data-produto-id="${
                              item.produto_id
                            }" data-produto-qtde="${item.quantidade}"
                          >
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M20 12H4"
                              ></path>
                            </svg>
                          </button>
                          <span class="w-8 text-center">${
                            item.quantidade
                          }</span>
                          <button
                            class="plus w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                            data-produto-id="${
                              item.produto_id
                            }" data-produto-qtde="${item.quantidade}"
                          >
                            <svg
                              class="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 4v16m8-8H4"
                              ></path>
                            </svg>
                          </button>
                        </div>
                        <span class="font-semibold">${formatarMoeda(
                          item.preco_unitario
                        )}</span>
                      </div>
                    </div>
                  </div>
                          `;

            $("#listaCarrinho").append(itemDiv);
          });
          
          let debounceTimer;
          const DEBOUNCE_DELAY = 1800; 

          $(".delete-item").on("click", function () {
            var produtoId = $(this).data("produto-id");
            app.dialog.confirm(
              "Tem certeza que quer remover este item?",
              "Remover",
              function () {
                removerItemCarrinho(pessoaIdCarrinho, produtoId);
              }
            );
          });

          $(".minus").on("click", function () {
            const $button = $(this);
            const produtoId = $button.data("produto-id");
            let quantidade = parseInt($button.data("produto-qtde"));
            
            const $quantitySpan = $button.siblings("span.w-8");
            const $plusButton = $button.siblings(".plus");

            if (quantidade > 1) {
              quantidade--;
              
              $quantitySpan.text(quantidade);
              $button.data("produto-qtde", quantidade);
              $plusButton.data("produto-qtde", quantidade);
              
              // Cancela a requisição anterior e agenda uma nova
              clearTimeout(debounceTimer); 
              debounceTimer = setTimeout(() => {
                alterarCarrinho(pessoaIdCarrinho, produtoId, quantidade);
              }, DEBOUNCE_DELAY);

            } else {
              // Cancela qualquer requisição pendente
              clearTimeout(debounceTimer); 
              app.dialog.confirm(
                `Gostaria de remover este item?`,
                "REMOVER",
                function () {
                  removerItemCarrinho(pessoaIdCarrinho, produtoId);
                }
              );
            }
          });

          $(".plus").on("click", function () {
            const $button = $(this);
            const produtoId = $button.data("produto-id");
            let quantidade = parseInt($button.data("produto-qtde"));

            const $quantitySpan = $button.siblings("span.w-8");
            const $minusButton = $button.siblings(".minus");

            quantidade++;

            $quantitySpan.text(quantidade);
            $button.data("produto-qtde", quantidade);
            $minusButton.data("produto-qtde", quantidade);

            // Cancela a requisição anterior e agenda uma nova
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              alterarCarrinho(pessoaIdCarrinho, produtoId, quantidade);
            }, DEBOUNCE_DELAY);
          });

          $("#subtotal").html(
            total.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })
          );
          $("#totalCarrinho").html(
            total.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })
          );
        } else {
          $("#listaCarrinho").empty();
          $("#toolbar-carrinho").addClass("display-none");
          $("#containerCarrinho").html(`
              <div class="display-flex flex-direction-column align-items-center justify-content-center" style="height: 100%;">
                <img width="300" src="img/empty.gif">
                <br><span class="color-gray">Nada por enquanto...</span>
              </div>
            `);
        }

        listarEnderecos();
        app.dialog.close();
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao listar carrinho: " + error.message,
        "Falha na requisição!"
      );
    });
}
//Fim Função Listar Carrinho

//Inicio Funçao Alterar Carrinho
function alterarCarrinho(pessoaId, produtoId, quantidade) {
  app.dialog.preloader("Carregando...");

  const dados = {
    pessoa_id: pessoaId,
    produto_id: produtoId,
    quantidade: quantidade,
  };

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "PagamentoSafe2payRest",
    method: "AlterarCarrinho",
    dados: dados,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success'
      if (
        responseJson.status == "success" &&
        responseJson.data.status == "sucess"
      ) {
        app.views.main.router.refreshPage();
        app.dialog.close();
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao alterar carrinho: " + error.message,
        "Falha na requisição!"
      );
    });
}
//Fim Função Alterar Carrinho

//Inicio Adicionar Endereço
function adicionarEndereco() {
  app.dialog.preloader("Carregando...");

  const pessoaId = localStorage.getItem("pessoaId");
  // Captura os valores dos inputs
  var nomeEndereco = $("#nomeEndereco").val();
  var cep = $("#cepCliente").val();
  var logradouro = $("#logradouroEndCliente").val();
  var numero = $("#numeroEndCliente").val();
  var complemento = $("#complementoEndCliente").val();
  var bairro = $("#bairroEndCliente").val();
  var cidade = $("#cidadeEndCliente").val();
  var estado = $("#estadoEndCliente").val();
  var isPrincipal = $("#defaultAddress").prop("checked") ? "S" : "N";

  const dados = {
    pessoa_id: pessoaId,
    nome_endereco: nomeEndereco,
    cep: cep,
    endereco: logradouro,
    numero: numero,
    complemento: complemento,
    bairro: bairro,
    cidade: cidade,
    estado: estado,
    tipo: 1,
    is_principal: isPrincipal,
  };

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "EnderecoRest",
    method: "salvarEnderecoEntrega",
    dados: dados,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success'
      if (
        responseJson.status == "success" &&
        responseJson.data.status == "success"
      ) {
        // Sucesso na alteração
        var toastCenter = app.toast.create({
          text: `Endereço adicionado com sucesso`,
          position: "center",
          closeTimeout: 2000,
        });
        listarEnderecos();
        toastCenter.open();
        app.dialog.close();
        $("#newAddressModal").addClass("hidden");
        $("#addressModal").addClass("hidden");
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao alterar carrinho: " + error.message,
        "Falha na requisição!"
      );
      $("#newAddressModal").addClass("hidden");
      $("#addressModal").addClass("hidden");
    });
}
//Fim Função Adicionar Endereço

//Inicio Editar Endereço
function editarEndereco() {
  app.dialog.preloader("Carregando...");

  const pessoaId = localStorage.getItem("pessoaId");
  // Captura os valores dos inputs
  var enderecoId = $("#idEnderecoEdit").val();
  var nomeEndereco = $("#nomeEnderecoEdit").val();
  var cep = $("#cepEdit").val();
  var logradouro = $("#logradouroEndEdit").val();
  var numero = $("#numeroEndEdit").val();
  var complemento = $("#complementoEndEdit").val();
  var bairro = $("#bairroEndEdit").val();
  var cidade = $("#cidadeEndEdit").val();
  var estado = $("#estadoEndEdit").val();
  var isPrincipal = $("#defaultAddressEdit").prop("checked") ? "S" : "N";

  const dados = {
    endereco_id: enderecoId,
    pessoa_id: pessoaId,
    nome_endereco: nomeEndereco,
    cep: cep,
    endereco: logradouro,
    numero: numero,
    complemento: complemento,
    bairro: bairro,
    cidade: cidade,
    estado: estado,
    tipo: 1,
    is_principal: isPrincipal,
  };

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "EnderecoRest",
    method: "salvarEnderecoEntrega",
    dados: dados,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success'
      if (
        responseJson.status == "success" &&
        responseJson.data.status == "success"
      ) {
        app.dialog.close();
        // Sucesso na alteração
        var toastCenter = app.toast.create({
          text: `Endereço editado com sucesso`,
          position: "center",
          closeTimeout: 2000,
        });
        listarEnderecos();
        toastCenter.open();
        $("#editAddressModal").addClass("hidden");
        $("#addressModal").addClass("hidden");
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao alterar carrinho: " + error.message,
        "Falha na requisição!"
      );
      $("#editAddressModal").addClass("hidden");
      $("#addressModal").addClass("hidden");
    });
}
//Fim Função Editar Endereço

//Inicio Adicionar Item Carrinho
function adicionarItemCarrinho(produtoId) {
  const pessoaId = localStorage.getItem("pessoaId");
  app.dialog.preloader("Carregando...");

  const dados = {
    pessoa_id: pessoaId,
    produto_id: produtoId,
    quantidade: 1,
  };

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "PagamentoSafe2payRest",
    method: "IncluirCarrinho",
    dados: dados,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success'
      if (
        responseJson.status == "success" &&
        responseJson.data.status == "sucess"
      ) {
        // Sucesso na alteração
        var toastCenter = app.toast.create({
          text: `Produto adicionado ao carrinho`,
          position: "center",
          closeTimeout: 2000,
        });

        toastCenter.open();
        app.dialog.close();
        app.views.main.router.navigate("/home/");
      } else {
        app.dialog.close();
        app.dialog.alert(
          "Erro ao alterar carrinho: " + responseJson.data.message,
          responseJson.data.status
        );
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao alterar carrinho: " + error.message,
        "Falha na requisição!"
      );
    });
}
//Fim Função Adicionar Item Carrinho

//Inicio Remover Item do Carrinho
function removerItemCarrinho(pessoaId, produtoId) {
  app.dialog.preloader("Carregando...");
  const dados = {
    pessoa_id: pessoaId,
    produto_id: produtoId,
  };

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "PagamentoSafe2payRest",
    method: "ExcluirCarrinho",
    dados: dados,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success'
      app.dialog.close();
      if (
        responseJson.status == "success" &&
        responseJson.data.status == "sucess"
      ) {
        // Sucesso na alteração
        app.views.main.router.refreshPage();
      } else {
        app.dialog.alert(
          "Erro ao alterar carrinho: " + responseJson.data.message,
          responseJson.data.status
        );
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao alterar carrinho: " + error.message,
        "Falha na requisição!"
      );
    });
}
//Fim Função Remover Item do Carrinho

//Inicio Funçao Esvaziar Carrinho
function limparCarrinho() {
  const pessoaId = localStorage.getItem("pessoaId");
  app.dialog.preloader("Carregando...");

  const dados = {
    pessoa_id: pessoaId,
  };

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "PagamentoSafe2payRest",
    method: "LimparCarrinho",
    dados: dados,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success'
      if (
        responseJson.status == "success" &&
        responseJson.data.status == "sucess"
      ) {
        // Sucesso na alteração
        app.views.main.router.refreshPage();
        app.dialog.close();
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao alterar carrinho: " + error.message,
        "Falha na requisição!"
      );
    });
}
//Fim Função Esvaziar Carrinho

//Inicio Funçao contar Carrinho
function contarCarrinho() {
  const pessoaId = localStorage.getItem("pessoaId");

  const dados = {
    pessoa_id: pessoaId,
  };

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "PagamentoSafe2payRest",
    method: "ListarCarrinho",
    dados: dados,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success'
      if (
        responseJson.status == "success" &&
        responseJson.data.status == "sucess"
      ) {
        // Supondo que responseJson seja o objeto que você obteve no console.log
        const quantidadeItens = responseJson.data.data.itens.length;

        // Atualizar o contador no cabeçalho
        $(".btn-cart").attr("data-count", quantidadeItens);

        // Atualizar o contador na barra inferior
        $(".cart-badge").attr("data-count", quantidadeItens);
      }
    })
    .catch((error) => {
      console.error("Erro:", error);
    });
}
//Fim Função contar Carrinho

//Inicio Funçao Dados Dashboard
function onDashboard() {
  const pessoaId = localStorage.getItem("pessoaId");

  const dados = {
    pessoa_id: pessoaId,
  };

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "PessoaContadorRest",
    method: "RetornaDados",
    dados: dados,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success'
      if (
        responseJson.status == "success" &&
        responseJson.data.status == "success"
      ) {
        //Desenha o dashboard
        $("#valorComissao").text(
          formatarMoeda(responseJson.data.dados.bonus_total_geral)
        );
        //Desenha o dashboard
        $("#valorVenda").text(
          formatarMoeda(responseJson.data.dados.valor_venda_mes)
        );
        
        $("#qtdeGeral").text(responseJson.data.dados.rede_geral);
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao listar carrinho: " + error.message,
        "Falha na requisição!"
      );
    });
}
//Fim Função Dados Dashboard

//Inicio Funçao Listar Carrinho Checkout
function listarCarrinhoCheckout() {
  app.dialog.preloader("Carregando...");
  const pessoaId = localStorage.getItem("pessoaId");

  const dados = {
    pessoa_id: pessoaId,
  };

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "PagamentoSafe2payRest",
    method: "ListarCarrinho",
    dados: dados,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success'
      if (
        responseJson.status == "success" &&
        responseJson.data.status == "sucess"
      ) {
        // Supondo que responseJson seja o objeto que você obteve no console.log
        const quantidadeItens = responseJson.data.data.itens.length;
        const subtotal = responseJson.data.data.total;
        let valor_frete = responseJson.data.data.valor_frete;
        const total = parseFloat(subtotal) + parseFloat(valor_frete);

        var pessoaIdCarrinho = responseJson.data.data.pessoa_id;

        if (quantidadeItens > 0) {
          //TEM ITENS NO CARRINHO
          $("#listaItensConfirmation").empty();

          //PERCORRER O NOSSO CARRINHO E ALIMENTAR A ÁREA
          responseJson.data.data.itens.forEach((item) => {
            var itemLi = `
                          <!-- ITEM DO CARRINHO-->
                          <li class="item-carrinho">
                                  <img src="https://vitatop.tecskill.com.br/${
                                    item.foto
                                  }" width="40px">
                              <div class="area-details">
                                  <div class="sup">
                                      <span class="name-prod">
                                      ${item.nome}
                                      </span>
                                  </div>
                                  <div class="preco-quantidade">
                                      <span>${formatarMoeda(
                                        item.preco_unitario
                                      )}</span>
                                      <div class="count">
                                          <input readonly class="qtd-item" type="text" value="${
                                            item.quantidade
                                          }">
                                      </div>
                                  </div>
                              </div>
                          </li>
                          `;

            $("#listaItensConfirmation").append(itemLi);
          });

          //MOSTRAR O SUBTOTAL
          if (valor_frete == 0) {
            $("#freteCheckout").html("GRÁTIS");
          } else {
            $("#freteCheckout").html(formatarMoeda(valor_frete));
          }
          $("#subTotalCheckout").html(formatarMoeda(subtotal));
          $("#totalCheckout").html(formatarMoeda(total));
        }

        app.dialog.close();
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao listar carrinho: " + error.message,
        "Falha na requisição!"
      );
    });
}
//Fim Função Listar Carrinho Checkout

//Inicio Funçao Listar Equipe
//Inicio Funçao Listar Equipe Atualizada
function listarEquipe(filtro = "all") {
  app.dialog.preloader("Carregando...");
  const pessoaId = localStorage.getItem("pessoaId");

  const dados = {
    pessoa_id: pessoaId,
  };

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "PessoaRestService",
    method: "ListaRede",
    dados: dados,
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success'
      if (responseJson.status === "success") {
        const membros = responseJson.data;
        app.dialog.close();

        // Remove skeleton loading
        $(".team-skeleton").remove();

        // Limpa o container da equipe
        $("#teamContainer").empty();

        // Estatísticas da equipe
        let totalEquipe = membros.length;
        let indicadosDiretos = 0;
        let indicadosIndiretos = 0;

        // Separa membros por tipo
        const membrosFiltrados = membros.filter((membro) => {
          if (membro.pid === null) {
            // Este é o usuário principal, não conta nas estatísticas
            return false;
          }

          // Verifica se é indicado direto ou indireto
          const root = membros.find((m) => m.pid === null);
          const isDirecto = root && membro.pid === root.id;

          if (isDirecto) {
            indicadosDiretos++;
          } else {
            indicadosIndiretos++;
          }

          // Aplica filtro
          if (filtro === "direct") return isDirecto;
          if (filtro === "indirect") return !isDirecto;
          return true; // 'all'
        });

        // Atualiza contadores
        $("#totalEquipe").text(totalEquipe - 1); // -1 para não contar o usuário principal
        $("#indicadosDiretos").text(indicadosDiretos);
        $("#indicadosIndiretos").text(indicadosIndiretos);

        if (membrosFiltrados.length === 0) {
          // Mostra estado vazio
          $("#teamContainer").html(`
            <div class="empty-team">
              <i class="mdi mdi-account-group"></i>
              <h3>Nenhum membro encontrado</h3>
              <p>Compartilhe seu link de indicação para começar a construir sua equipe!</p>
            </div>
          `);
        } else {
          // Cria os cards dos membros
          membrosFiltrados.forEach((membro, index) => {
            const root = membros.find((m) => m.pid === null);
            const isDirecto = root && membro.pid === root.id;
            const tipoMembro = isDirecto ? "direct" : "indirect";
            const tipoTexto = isDirecto
              ? "Indicado Direto"
              : "Indicado Indireto";

            // Gera inicial do nome para avatar
            const inicial = membro.name
              ? membro.name.charAt(0).toUpperCase()
              : "U";

            // Define nível baseado no título
            let nivelClass = "distribuidor";
            let nivelTexto = "Distribuidor";
            if (
              membro.title &&
              membro.title.toLowerCase().includes("premium")
            ) {
              nivelClass = "gold";
              nivelTexto = "Premium";
            } else if (
              membro.title &&
              membro.title.toLowerCase().includes("silver")
            ) {
              nivelClass = "silver";
              nivelTexto = "Prata";
            }

            const membroHTML = `
              <div class="team-member" data-tipo="${tipoMembro}" style="animation-delay: ${
              index * 0.1
            }s">
                <div class="member-avatar default">
                  ${
                    membro.img && membro.img !== "default-avatar.png"
                      ? `<img src="${membro.img}" alt="${membro.name}">`
                      : inicial
                  }
                  <div class="member-type ${tipoMembro}">
                    ${isDirecto ? "D" : "I"}
                  </div>
                  <div class="level-indicator ${nivelClass}">
                    ${nivelTexto.charAt(0)}
                  </div>
                </div>
                <div class="member-info">
                  <div class="member-name">${
                    membro.name || "Nome não informado"
                  }</div>
                  <div class="member-title">${tipoTexto}</div>
                  <div class="member-details">
                    <div class="member-detail">
                      <i class="mdi mdi-calendar"></i>
                      <span>Membro desde ${formatarDataSimples(
                        new Date()
                      )}</span>
                    </div>
                  </div>
                  <!--
                  <div class="member-stats">
                    <div class="member-stat">
                      <i class="mdi mdi-account-group"></i>
                      <span>Indicados: 0</span>
                    </div>
                    <div class="member-stat">
                      <i class="mdi mdi-chart-line"></i>
                      <span>Vendas: 0</span>
                    </div>
                  </div>
                  -->
                </div>
              </div>
            `;

            $("#teamContainer").append(membroHTML);
          });
        }

        // Configura eventos dos filtros
        setupTeamFilters();
      } else {
        app.dialog.close();
        console.error("Erro ao carregar equipe:", responseJson.message);
        $("#teamContainer").html(`
          <div class="empty-team">
            <i class="mdi mdi-alert-circle"></i>
            <h3>Erro ao carregar equipe</h3>
            <p>Tente novamente mais tarde</p>
          </div>
        `);
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      $("#teamContainer").html(`
        <div class="empty-team">
          <i class="mdi mdi-wifi-off"></i>
          <h3>Erro de conexão</h3>
          <p>Verifique sua conexão e tente novamente</p>
        </div>
      `);
    });
}

// Função auxiliar para configurar os filtros
function setupTeamFilters() {
  $(".filter-btn-equipe").on("click", function () {
    const filtro = $(this).data("filter");

    // Atualiza botões ativos
    $(".filter-btn-equipe").removeClass("active");
    $(this).addClass("active");

    // Filtra membros visíveis
    if (filtro === "all") {
      $(".team-member").show();
    } else {
      $(".team-member").hide();
      $(
        `.team-member[data-tipo="${
          filtro === "direct" ? "direct" : "indirect"
        }"]`
      ).show();
    }

    // Anima os membros visíveis
    $(".team-member:visible").each(function (index) {
      $(this).css("animation-delay", index * 0.1 + "s");
      $(this).removeClass("fadeInUp").addClass("fadeInUp");
    });
  });
}

// Função auxiliar para formatar data simples
function formatarDataSimples(data) {
  const meses = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const dia = data.getDate();
  const mes = meses[data.getMonth()];
  const ano = data.getFullYear();

  return `${mes} ${ano}`;
}

// Função para atualizar dados da equipe
function atualizarDadosEquipe() {
  // Adiciona animação de loading ao botão
  const $updateBtn = $("#updateTeamData");
  const originalIcon = $updateBtn.find("i").attr("class");

  $updateBtn.find("i").attr("class", "mdi mdi-loading mdi-spin");
  $updateBtn.prop("disabled", true);

  // Recarrega os dados
  listarEquipe($(".filter-btn-equipe.active").data("filter") || "all");

  // Remove animação após 2 segundos
  setTimeout(() => {
    $updateBtn.find("i").attr("class", originalIcon);
    $updateBtn.prop("disabled", false);
  }, 2000);
}
//Fim Função Listar Equipe Atualizada
//Fim Função Listar Equipe

// Funções para a página de campanhas

// Listar campanhas
// Função para carregar as categorias de campanha do servidor
function carregarCategoriasCampanha() {
  app.dialog.preloader("Carregando...");

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  const body = JSON.stringify({
    class: "CampanhaRestService",
    method: "listarCategoriasCampanha",
  });

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success' e se há dados de categorias
      if (
        responseJson.status === "success" &&
        responseJson.data &&
        responseJson.data.status === "success"
      ) {
        const categorias = responseJson.data.data;

        // Limpa o container de categorias
        $(".campaign-categories").empty();

        // Adiciona a opção "Todas" ao início
        var opcaoTodasHTML = `
          <div class="category-pill active" data-category="all">Todas</div>
        `;
        $(".campaign-categories").append(opcaoTodasHTML);

        // Adiciona cada categoria
        categorias.forEach((categoria) => {
          var categoriaHTML = `
            <div class="category-pill" data-category="${categoria.id}">${categoria.nome}</div>
          `;
          $(".campaign-categories").append(categoriaHTML);
        });

        // Adiciona o evento de clique às categorias
        $(".category-pill").on("click", function () {
          $(".category-pill").removeClass("active");
          $(this).addClass("active");

          const categoriaId = $(this).data("category");
          listarCampanhas(categoriaId);
        });

        app.dialog.close();
      } else {
        app.dialog.close();
        // Verifica se há uma mensagem de erro definida
        const errorMessage =
          responseJson.message || "Formato de dados inválido";
        app.dialog.alert(
          "Erro ao carregar categorias: " + errorMessage,
          "Falha na requisição!"
        );
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      app.dialog.alert(
        "Erro ao carregar categorias: " + error.message,
        "Falha na requisição!"
      );
    });
}

// Função para listar campanhas, opcionalmente filtradas por categoria
function listarCampanhas(categoriaId = "all") {
  app.dialog.preloader("Carregando...");

  // Cabeçalhos da requisição
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };

  // Prepara o body da requisição, incluindo categoria_id se for necessário
  const bodyData = {
    class: "CampanhaRestService",
    method: "listarCampanhas",
  };

  // Adiciona o filtro por categoria se não for "all"
  if (categoriaId !== "all") {
    bodyData.categoria_id = categoriaId;
  }

  const body = JSON.stringify(bodyData);

  // Opções da requisição
  const options = {
    method: "POST",
    headers: headers,
    body: body,
  };

  // Fazendo a requisição
  fetch(apiServerUrl, options)
    .then((response) => response.json())
    .then((responseJson) => {
      // Verifica se o status é 'success' e se há dados de campanhas
      if (
        responseJson.status === "success" &&
        responseJson.data &&
        responseJson.data.status === "success"
      ) {
        const campanhas = responseJson.data.data;

        // Limpa o container das campanhas e remove os skeletons
        $("#container-campanhas").empty();
        $(".skeleton-card").remove();

        // Verifica se há campanhas para exibir
        if (campanhas.length === 0) {
          $("#container-campanhas").html(`
            <div class="no-campaigns">
              <i class="mdi mdi-calendar-blank"></i>
              <p>Nenhuma campanha encontrada nesta categoria</p>
            </div>
          `);
        } else {
          // Para cada campanha, cria um card
          campanhas.forEach((campanha) => {
            const dataInicio = new Date(campanha.data_inicio);
            const dataFim = campanha.data_fim
              ? new Date(campanha.data_fim)
              : null;

            // Formata as datas para exibição
            const dataInicioFormatada = formatarData(dataInicio);
            const dataFimFormatada = dataFim
              ? formatarData(dataFim)
              : "Sem data de término";

            // Define a tag da campanha ou usa a categoria como fallback
            let tagTexto =
              campanha.tag || getCategoriaLabel(campanha.categoria_id);

            // Define uma imagem padrão caso não tenha
            const imagemCampanha = campanha.imagem
              ? "https://vitatop.tecskill.com.br/" + campanha.imagem
              : "img/default-campaign.jpg";

            // HTML do card da campanha
            const campanhaHTML = `
              <div class="campaign-card" data-id="${campanha.id}" data-link="${
              campanha.link || "/produtos/?campanha=" + campanha.id
            }">
                <img src="${imagemCampanha}" alt="${
              campanha.titulo
            }" class="campaign-image">
                <div class="campaign-content">
                  <h3 class="campaign-title">${campanha.titulo}</h3>
                  <p class="campaign-subtitle">${campanha.subtitulo || ""}</p>
                  <div class="campaign-period">
                    <i class="mdi mdi-calendar"></i>
                    ${dataInicioFormatada} ${
              dataFim ? " até " + dataFimFormatada : ""
            }
                  </div>
                  <div class="campaign-tag ${getCategoriaClass(
                    campanha.categoria_id
                  )}">${tagTexto}</div>
                </div>
              </div>
            `;

            $("#container-campanhas").append(campanhaHTML);
          });

          // Adiciona evento de clique aos cards
          $(".campaign-card").on("click", function () {
            const link = $(this).attr("data-link");
            if (link) {
              app.views.main.router.navigate(link);
            }
          });
        }

        app.dialog.close();
      } else {
        app.dialog.close();

        // Exibe uma mensagem se não há campanhas ou ocorreu um erro
        $("#container-campanhas").html(`
          <div class="no-campaigns">
            <i class="mdi mdi-calendar-blank"></i>
            <p>Nenhuma campanha disponível no momento</p>
          </div>
        `);

        console.error(
          "Erro ao carregar campanhas ou nenhuma campanha disponível"
        );
      }
    })
    .catch((error) => {
      app.dialog.close();
      console.error("Erro:", error);
      $("#container-campanhas").html(`
        <div class="no-campaigns">
          <i class="mdi mdi-alert-circle-outline"></i>
          <p>Erro ao carregar campanhas. Tente novamente mais tarde.</p>
        </div>
      `);
    });
}

// Função auxiliar para obter a classe CSS baseada na categoria
function getCategoriaClass(categoriaId) {
  switch (categoriaId) {
    case "1":
      return "promocao";
    case "2":
      return "saude";
    case "3":
      return "data-especial";
    case "4":
      return "lancamento";
    default:
      return "";
  }
}

// Função auxiliar para obter o nome da categoria pelo ID
function getCategoriaLabel(categoriaId) {
  switch (categoriaId) {
    case "1":
      return "Promoção";
    case "2":
      return "Saúde";
    case "3":
      return "Data Especial";
    case "4":
      return "Lançamento";
    default:
      return "Campanha";
  }
}

//Inicio da Funçao formatar Moeda
function formatarMoeda(valor) {
  var precoFormatado = parseFloat(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  return precoFormatado;
}
//Fim da Funçao formatar Moeda

// Função para truncar o nome do produto
const truncarNome = (nome, limite) => {
  return nome.length > limite ? nome.substring(0, limite) + "..." : nome;
};
// Fim Função para truncar o nome do produto

// Função para limpar o local storage
function clearLocalStorage() {
  localStorage.removeItem("produtoId");
  localStorage.removeItem("enderecoSelecionado");
  localStorage.removeItem("produto");
  localStorage.removeItem("enderecoDetalhes");
  localStorage.removeItem("emailRecuperacao");
}
// Fim Função para limpar o local storage

// Função para limpar o local storage
function fazerLogout() {
  localStorage.removeItem("userAuthToken");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("pessoaId");
  localStorage.removeItem("codigo_indicador");
  localStorage.removeItem("validadeToken");
}
// Fim Função para limpar o local storage

// Início Função para formatar data e hora
function formatarData(data) {
  // Converte a string de data para objeto Date
  const dateObj = new Date(data);

  // Array com os nomes dos meses em português
  const meses = [
    "JAN",
    "FEV",
    "MAR",
    "ABR",
    "MAI",
    "JUN",
    "JUL",
    "AGO",
    "SET",
    "OUT",
    "NOV",
    "DEZ",
  ];

  // Extrai o dia, mês, ano, hora e minuto
  const dia = dateObj.getDate();
  const mes = meses[dateObj.getMonth()];
  const ano = dateObj.getFullYear();
  const horas = dateObj.getHours();
  const minutos = dateObj.getMinutes();

  // Formata a hora e minuto com dois dígitos
  const horasFormatadas = horas.toString().padStart(2, "0");
  const minutosFormatados = minutos.toString().padStart(2, "0");

  // Retorna a data e hora formatadas
  return `${dia} ${mes} ${ano} ${horasFormatadas}:${minutosFormatados}`;
}
// Fim da Função formatar data e hora

//Inicio da função para copiar
function copiarParaAreaDeTransferencia(texto) {
  // Cria um elemento de texto temporário
  var tempElement = document.createElement("textarea");
  tempElement.value = texto;
  document.body.appendChild(tempElement);

  // Seleciona o texto e copia para a área de transferência
  tempElement.select();
  tempElement.setSelectionRange(0, 99999); // Para dispositivos móveis
  document.execCommand("copy");

  // Remove o elemento temporário
  document.body.removeChild(tempElement);

  // Alerta para informar ao usuário que a linha digitável foi copiada
  app.dialog.alert(
    "Linha digitável copiada para a área de transferência!",
    "Cópia"
  );
}
//Fim da função para copiar

//Inicio função compartilhar
function onCompartilhar(titulo, texto, url) {
  if (navigator.share) {
    navigator
      .share({
        title: titulo,
        text: texto,
        url: url,
      })
      .then(() => {})
      .catch((error) => {
        console.error("Erro ao compartilhar:", error);
      });
  } else {
    alert("Compartilhamento não suportado neste navegador.");
  }
}
async function shareLink(shareTitle, shareText, link) {
  const shareData = {
    title: shareTitle,
    text: shareText,
    url: link,
  };
  try {
    await navigator.share(shareData);
  } catch (e) {
    console.error(e);
  }
}
//Fim função compartilhar

// Função para validar a data no formato MM/YYYY
function validarDataExpiracao(data) {
  const regex = /^(0[1-9]|1[0-2])\/\d{4}$/; // Aceita de 01 a 12 para MM e 4 dígitos para o ano
  return regex.test(data);
}

function timeAgo(date) {
  const now = new Date();
  const notificationDate = new Date(date);
  const seconds = Math.floor((now - notificationDate) / 1000);

  if (seconds < 60) return "Agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Há ${minutes} minuto${minutes > 1 ? "s" : ""}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Há ${hours} hora${hours > 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Há ${days} dia${days > 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Há ${months} mês${months > 1 ? "es" : ""}`;
  const years = Math.floor(days / 365);
  return `Há ${years} ano${years > 1 ? "s" : ""}`;
}

function oneSignalLogin(userId, oneSignalId) {
  if (userId != oneSignalId) {
    OneSignal.logout();
    OneSignal.Notifications.requestPermission();
    // Define o ID externo no OneSignal
    OneSignal.login(userId)
      .then(() => {})
      .catch((error) => {
        console.error(`Erro ao definir ID externo: ${error}`);
      });
  } else {
    OneSignal.Notifications.requestPermission();
    OneSignal.login(userId)
      .then(() => {})
      .catch((error) => {
        console.error(`Erro ao definir ID externo: ${error}`);
      });
  }
}

// Listar categorias da lojinha
function listarCategoriasLojinha(lojinhaId, callback) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };
  const body = JSON.stringify({
    class: "LojinhaRestService",
    method: "listarCategoriasLojinha",
    lojinha_vitatop_id: lojinhaId
  });
  fetch(apiServerUrl, {
    method: "POST",
    headers,
    body
  })
    .then((response) => response.json())
    .then((responseJson) => {
      if (typeof callback === 'function') callback(responseJson);
    })
    .catch((error) => {
      if (typeof callback === 'function') callback({ status: 'error', error });
    });
}

// Atualizar categorias da lojinha
function atualizarCategoriasLojinha(lojinhaId, arrayCategorias, callback) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userAuthToken,
  };
  const body = JSON.stringify({
    class: "LojinhaRestService",
    method: "atualizarCategoriasLojinha",
    lojinha_vitatop_id: lojinhaId,
    categorias: arrayCategorias
  });
  fetch(apiServerUrl, {
    method: "POST",
    headers,
    body
  })
    .then((response) => response.json())
    .then((responseJson) => {
      if (typeof callback === 'function') callback(responseJson);
    })
    .catch((error) => {
      if (typeof callback === 'function') callback({ status: 'error', error });
    });
}

