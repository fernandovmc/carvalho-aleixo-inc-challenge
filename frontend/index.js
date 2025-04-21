 // Gerar as estrelas (rating)
 const BASE_URL = import.meta.env.VITE_API_URL;
 console.log(BASE_URL);

 function generateStars(ratingString) {
   const match = ratingString?.match(/([\d.]+) out of 5/);
   const rating = match ? parseFloat(match[1]) : 0;
   const fullStars = Math.floor(rating);
   const halfStar = rating % 1 >= 0.5;
   let stars = '★'.repeat(fullStars);
   if (halfStar) stars += '½';
   stars = stars.padEnd(5, '☆');
   return `<div class="stars">${stars}</div>`;
 }

 // Função para buscar produtos
async function ScrapeProducts() {
   const keyword = document.querySelector("#keyword").value;
   const resultsContainer = document.querySelector("#results");
   resultsContainer.innerHTML = "<p>Carregando...</p>";


   try {
     const response = await fetch(`${BASE_URL}/api/scrape-product?keyword=${encodeURIComponent(keyword)}`);

     const contentType = response.headers.get("content-type");
     if (!contentType || !contentType.includes("application/json")) {
       throw new Error("A resposta não é JSON válida.");
     }

     const data = await response.json();


     // Verifica se a resposta contém produtos
     if (data.results && data.results.length > 0) {
       resultsContainer.innerHTML = data.results
         .map(product => `
           <div class="product">
             <img src="${product.image}" alt="Product Image" />
             <h3>${product.title}</h3>
             ${generateStars(product.rating)}
           </div>
         `).join("");
     } else {
       resultsContainer.innerHTML = "<p>Nenhum produto encontrado.</p>";
     }

   } catch (err) {
     console.error(err);
     resultsContainer.innerHTML = "<p> Erro ao buscar os produtos.</p>";
   }


 }
 
window.ScrapeProducts = ScrapeProducts;