// src/js/ui-helpers.js

import {
  fetchMovieDetails,
  fetchMovieVideos,
  getImageUrl,
  getOriginalImageUrl,
} from "./movies-data.js";
import { openTrailerModal, openTrailerErrorModal } from "./trailer-modal.js";

/* --- Yardımcılar --- */
export function getGenresText(genreData) {
  // 1. Veri yoksa veya dizi değilse
  if (!genreData || !Array.isArray(genreData) || genreData.length === 0) {
    return "N/A";
  }

  const firstItem = genreData[0];

  // 2. Detay sayfasından gelen veri (Obje dizisi: [{name: "Action"}, ...])
  // İlk eleman bir obje mi ve içinde 'name' özelliği var mı diye kontrol ediyoruz.
  if (typeof firstItem === "object" && firstItem !== null && firstItem.name) {
    return genreData.map((g) => g.name).slice(0, 2).join(", ");
  }

  // 3. Listeden gelen veri (ID dizisi: [28, 12, ...])
  // İlk eleman bir sayı ise ID haritasını kullanıyoruz.
  if (typeof firstItem === "number") {
    const genreMap = {
      28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
      80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
      14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
      9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
      53: "Thriller", 10752: "War", 37: "Western"
    };
    
    const genres = genreData.map((id) => genreMap[id]).filter(Boolean);
    // Eğer eşleşen tür bulunursa döndür, yoksa "Other" yaz
    return genres.length > 0 ? genres.slice(0, 2).join(", ") : "Other";
  }

  // 4. Hiçbiri değilse (Örn: String dizisi gelirse)
  return "N/A";
}

export function renderStars(vote) {
  const stars = Math.round((vote || 0) / 2);
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += `<i class="fa-star ${i <= stars ? "fas active" : "far"}"></i>`;
  }
  return html;
}

/* --- Kart Render --- */
export function renderMovieCard(movie) {
  // API'den bazen genres, bazen genre_ids gelebilir. İkisini de kontrol et.
  const genreList = movie.genres || movie.genre_ids;
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A";

  return `
    <div class="movie-card" data-id="${movie.id}">
        <img src="${getImageUrl(movie.poster_path)}" alt="${movie.title}" class="movie-card-poster" loading="lazy">
        <div class="movie-card-overlay">
            <h3 class="movie-title">${movie.title}</h3>
            <div class="movie-meta">
                <span class="movie-genre">${getGenresText(genreList)} | ${year}</span>
                <div class="movie-rating">${renderStars(movie.vote_average)}</div>
            </div>
        </div>
    </div>
  `;
}

/* --- Hero Güncelleme --- */
export async function updateHeroWithMovie(movieId, heroSection, heroContent) {
  if (!heroSection || !heroContent) return;

  try {
    const movie = await fetchMovieDetails(movieId);
    if (!movie) return;

    const bg = getOriginalImageUrl(movie.backdrop_path || movie.poster_path);

    heroSection.style.backgroundImage = `
      linear-gradient(to right, 
        #111 0%, 
        rgba(17, 17, 17, 1) 30%, 
        rgba(17, 17, 17, 0.5) 50%, 
        transparent 100%),
      url('${bg}')
    `;

    heroContent.innerHTML = `
      <h1 class="hero-title">${movie.title}</h1>
      <div class="star-rating hero-stars">
        ${renderStars(movie.vote_average)}
      </div>
      <p class="hero-description">${movie.overview || "No description available."}</p>
      <div class="hero-buttons">
        <button class="btn btn-primary" id="hero-watch-trailer" data-id="${movie.id}">Watch Trailer</button>
        <button class="btn btn-secondary" id="hero-details-btn" data-id="${movie.id}">More details</button>
      </div>
    `;

    // Event Listener'lar
    const trailerBtn = heroContent.querySelector("#hero-watch-trailer");
    if (trailerBtn) {
      trailerBtn.onclick = async (e) => {
        e.preventDefault();
        const id = e.target.dataset.id;
        try {
          const videos = await fetchMovieVideos(id);
          const trailer = videos?.results?.find(v => v.type === "Trailer" && v.site === "YouTube");
          if (trailer) openTrailerModal(trailer.key);
          else openTrailerErrorModal();
        } catch (err) {
          console.error(err);
          openTrailerErrorModal();
        }
      };
    }

    const detailBtn = heroContent.querySelector("#hero-details-btn");
    if (detailBtn) {
      detailBtn.onclick = (e) => {
        e.preventDefault();
        const id = e.target.dataset.id;
        if(window.openMovieModal) window.openMovieModal(id);
      };
    }

  } catch (error) {
    console.error("Hero update error:", error);
  }
}

/* --- Upcoming Section Render --- */
export function renderUpcomingSection(movie, container) {
  if (!movie || !container) return;

  const releaseDate = new Date(movie.release_date).toLocaleDateString("en-US");
  const voteAvg = movie.vote_average ? movie.vote_average.toFixed(1) : "N.A";
  const voteCount = movie.vote_count || 0;
  const popularity = movie.popularity ? movie.popularity.toFixed(1) : "N.A";
  const genres = getGenresText(movie.genres || movie.genre_ids); // Burada da her ikisini kontrol et
  const imageUrl = getOriginalImageUrl(movie.backdrop_path || movie.poster_path);
  const library = JSON.parse(localStorage.getItem("myLibrary")) || [];
  const isAdded = library.includes(Number(movie.id));
  const btnText = isAdded ? "Remove from my library" : "Add to my library";

  container.innerHTML = `
    <div class="upcoming-image">
      <img src="${imageUrl}" alt="${movie.title}" loading="lazy" />
    </div>
    <div class="upcoming-info">
      <h3>${movie.title}</h3>
      <div class="movie-details-list">
        <div class="detail-item">
          <span class="detail-key">Release date</span>
          <span class="detail-history">${releaseDate}</span>
        </div>
        <div class="detail-item">
          <span class="detail-key">Vote / Votes</span>
          <span class="detail-value">
            <span class="rating-badge">${voteAvg}</span> / ${voteCount}
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-key">Popularity</span>
          <span class="detail-value">${popularity}</span>
        </div>
        <div class="detail-item">
          <span class="detail-key">Genre</span>
          <span class="detail-value">${genres}</span>
        </div>
      </div>
      <h4>ABOUT</h4>
      <p class="about-text">${movie.overview || "No description available."}</p>
      <button class="btn btn-primary btn-add-library" id="upcoming-add-btn" data-id="${movie.id}">
        ${btnText}
      </button>
    </div>
  `;

  const btn = container.querySelector("#upcoming-add-btn");
  if (btn) {
    btn.onclick = () => {
      const currentLib = JSON.parse(localStorage.getItem("myLibrary")) || [];
      const movieId = Number(btn.dataset.id);
      const index = currentLib.indexOf(movieId);

      if (index > -1) {
        currentLib.splice(index, 1);
        btn.textContent = "Add to my library";
      } else {
        currentLib.push(movieId);
        btn.textContent = "Remove from my library";
      }
      localStorage.setItem("myLibrary", JSON.stringify(currentLib));
    };
  }
}