// src/js/my-library.js

import { getUserLibrary, auth } from './auth.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { fetchMovieDetails } from './movies-data.js';
import { renderMovieCard, updateHeroWithMovie } from './ui-helpers.js';
import { showLoader, hideLoader } from './loader.js';

const initLibrary = () => {
  const libraryGrid = document.getElementById('library-grid');
  const heroSection = document.getElementById('library-hero');
  const heroContent = document.getElementById('library-hero-content');
  
  // Filter Elementleri
  const genreFilterContainer = document.getElementById('genre-filter-container');
  const genreHeader = document.getElementById('genre-header');
  const genreList = document.getElementById('genre-list');
  const selectedGenreText = document.getElementById('selected-genre-text');

  let allMoviesData = [];

  // Boş mesaj elementi
  let emptyMsg = document.getElementById('empty-library-msg');
  if (!emptyMsg && libraryGrid) {
    emptyMsg = document.createElement('div');
    emptyMsg.id = 'empty-library-msg';
    emptyMsg.className = 'empty-library is-hidden';
    emptyMsg.innerHTML = `
      <p>OOPS...</p>
      <p>You haven't added any movies yet.</p>
      <a href="catalog.html" style="color:var(--primary-orange, orange); margin-top:15px; display:inline-block;">Go to Catalog</a>
    `;
    if(libraryGrid.parentNode) libraryGrid.parentNode.insertBefore(emptyMsg, libraryGrid);
  }

  if (!libraryGrid) return;

  // --- LİSTEYİ YÜKLEME FONKSİYONU ---
  async function loadLibraryMovies() {
    showLoader();
    libraryGrid.innerHTML = '';
    if (emptyMsg) emptyMsg.classList.add('is-hidden');
    if (genreFilterContainer) genreFilterContainer.classList.add('is-hidden'); // Yüklenirken gizle

    try {
      const movieIds = await getUserLibrary();

      // Kütüphane boşsa
      if (!movieIds || movieIds.length === 0) {
        hideLoader();
        if (emptyMsg) emptyMsg.classList.remove('is-hidden');
        if (heroSection) heroSection.style.backgroundImage = 'none';
        if (heroContent) heroContent.innerHTML = '<h1>Your Library is Empty</h1>';
        // Kütüphane boşsa filtreyi de gizle
        if (genreFilterContainer) genreFilterContainer.style.display = 'none'; 
        return;
      }

      // Doluysa filtreyi görünür yap (css class kontrolü)
      if (genreFilterContainer) {
        genreFilterContainer.style.display = 'block';
        genreFilterContainer.classList.remove('is-hidden'); 
      }

      const promises = movieIds.map(id => fetchMovieDetails(id));
      const movies = await Promise.all(promises);

      allMoviesData = movies.filter(m => m !== null);
      
      renderMovies(allMoviesData);
      setupGenreFilter(allMoviesData);

      if (allMoviesData.length > 0 && heroSection) {
        updateHeroWithMovie(allMoviesData[0].id, heroSection, heroContent);
      }

    } catch (error) {
      console.error("Kütüphane yüklenirken hata:", error);
      libraryGrid.innerHTML = '<p style="color:white; text-align:center;">Bir hata oluştu.</p>';
    } finally {
      hideLoader();
    }
  }

  // --- FİLMLERİ EKRA NA BASMA ---
  function renderMovies(movies) {
    if (!movies || movies.length === 0) {
        libraryGrid.innerHTML = '<p style="color:white; text-align:center; grid-column: 1/-1;">No movies found for this genre.</p>';
        return;
    }
    libraryGrid.innerHTML = movies.map(m => renderMovieCard(m)).join('');
  }

  // --- GENRE FILTER MANTIĞI (GÜÇLENDİRİLMİŞ) ---
  function setupGenreFilter(movies) {
    if (!genreList || !genreHeader) return;

    const genresMap = new Map();
    
    movies.forEach(movie => {
        // Güvenlik Kontrolü: movie.genres var mı ve dizi mi?
        if (movie && movie.genres && Array.isArray(movie.genres)) {
            movie.genres.forEach(g => {
                if(g && g.id && g.name) {
                    genresMap.set(g.id, g.name);
                }
            });
        }
    });

    // Eğer hiç tür bulunamadıysa filtreyi yine de oluştur (All Genres olarak)
    let html = `<div class="genre-item active" data-id="all">All Genres</div>`;
    
    genresMap.forEach((name, id) => {
        html += `<div class="genre-item" data-id="${id}">${name}</div>`;
    });

    genreList.innerHTML = html;

    // Tıklama Olayı: Header
    genreHeader.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        genreList.classList.toggle('is-hidden');
        genreFilterContainer.classList.toggle('is-open');
    };

    // Tıklama Olayı: Seçenekler
    const genreItems = genreList.querySelectorAll('.genre-item');
    genreItems.forEach(item => {
        item.onclick = (e) => {
            e.stopPropagation();
            
            genreItems.forEach(el => el.classList.remove('active'));
            item.classList.add('active');

            const selectedId = item.dataset.id;
            const selectedName = item.textContent;

            if (selectedGenreText) selectedGenreText.textContent = selectedName;

            genreList.classList.add('is-hidden');
            genreFilterContainer.classList.remove('is-open');

            filterMovies(selectedId);
        };
    });

    // Dışarı tıklama kapatma
    document.addEventListener('click', (e) => {
        if (genreFilterContainer && !genreFilterContainer.contains(e.target)) {
            genreList.classList.add('is-hidden');
            genreFilterContainer.classList.remove('is-open');
        }
    });
  }

  function filterMovies(genreId) {
      let filteredMovies = [];

      if (genreId === 'all') {
          filteredMovies = allMoviesData;
      } else {
          // Güvenli Filtreleme
          filteredMovies = allMoviesData.filter(movie => 
              movie.genres && 
              Array.isArray(movie.genres) &&
              movie.genres.some(g => g.id.toString() === genreId.toString())
          );
      }

      renderMovies(filteredMovies);
  }

  // Firebase Auth Dinleyici
  onAuthStateChanged(auth, (user) => {
    loadLibraryMovies();
  });
  
  libraryGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.movie-card');
    if (card && card.dataset.id && heroSection) {
      updateHeroWithMovie(card.dataset.id, heroSection, heroContent);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
};

// DOM Hazır olduğunda başlat
document.addEventListener('DOMContentLoaded', initLibrary);