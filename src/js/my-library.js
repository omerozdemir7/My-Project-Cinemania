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

  // Tüm filmleri hafızada tutmak için değişken
  let allMoviesData = [];

  // Boş mesaj elementi yoksa oluştur
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
    libraryGrid.parentNode.insertBefore(emptyMsg, libraryGrid);
  }

  if (!libraryGrid) return;

  // --- LİSTEYİ YÜKLEME FONKSİYONU ---
  async function loadLibraryMovies() {
    showLoader();
    libraryGrid.innerHTML = '';
    if (emptyMsg) emptyMsg.classList.add('is-hidden');
    
    // Filtreyi başlangıçta gizle (filmler yüklenene kadar)
    if (genreFilterContainer) genreFilterContainer.classList.add('is-hidden');

    try {
      const movieIds = await getUserLibrary();

      if (!movieIds || movieIds.length === 0) {
        hideLoader();
        if (emptyMsg) emptyMsg.classList.remove('is-hidden');
        if (heroSection) heroSection.style.backgroundImage = 'none';
        if (heroContent) heroContent.innerHTML = '<h1>Your Library is Empty</h1>';
        return;
      }

      const promises = movieIds.map(id => fetchMovieDetails(id));
      const movies = await Promise.all(promises);

      // 1. Geçerli filmleri al ve global değişkene kaydet
      allMoviesData = movies.filter(m => m !== null);
      
      // 2. Filmleri Render Et (Başlangıçta hepsi)
      renderMovies(allMoviesData);

      // 3. Genre Filtresini Hazırla
      setupGenreFilter(allMoviesData);

      // 4. Hero Alanını Güncelle
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
    if (movies.length === 0) {
        libraryGrid.innerHTML = '<p style="color:white; text-align:center; grid-column: 1/-1;">No movies found for this genre.</p>';
        return;
    }
    libraryGrid.innerHTML = movies.map(m => renderMovieCard(m)).join('');
  }

  // --- GENRE FILTER MANTIĞI ---
  function setupGenreFilter(movies) {
    if (!genreList || !genreHeader) return;

    // Filtre konteynerini görünür yap
    if (genreFilterContainer) genreFilterContainer.classList.remove('is-hidden');

    // 1. Filmlerden benzersiz türleri çıkar
    const genresMap = new Map();
    movies.forEach(movie => {
        if (movie.genres && Array.isArray(movie.genres)) {
            movie.genres.forEach(g => {
                genresMap.set(g.id, g.name);
            });
        }
    });

    // 2. Dropdown listesini oluştur
    // "All" seçeneğini en başa ekle
    let html = `<div class="genre-item active" data-id="all">All Genres</div>`;
    
    // Diğer türleri ekle
    genresMap.forEach((name, id) => {
        html += `<div class="genre-item" data-id="${id}">${name}</div>`;
    });

    genreList.innerHTML = html;

    // 3. Tıklama Olayları (Dropdown Açma/Kapama)
    genreHeader.onclick = (e) => {
        e.stopPropagation();
        genreList.classList.toggle('is-hidden');
        genreFilterContainer.classList.toggle('is-open');
    };

    // 4. Tür Seçme Olayı
    const genreItems = genreList.querySelectorAll('.genre-item');
    genreItems.forEach(item => {
        item.onclick = (e) => {
            e.stopPropagation();
            
            // Aktif sınıfını güncelle
            genreItems.forEach(el => el.classList.remove('active'));
            item.classList.add('active');

            const selectedId = item.dataset.id;
            const selectedName = item.textContent;

            // Başlığı güncelle
            if (selectedGenreText) selectedGenreText.textContent = selectedName;

            // Listeyi kapat
            genreList.classList.add('is-hidden');
            genreFilterContainer.classList.remove('is-open');

            // Filmleri Filtrele
            filterMovies(selectedId);
        };
    });

    // Sayfada boş bir yere tıklayınca menüyü kapat
    document.addEventListener('click', (e) => {
        if (!genreFilterContainer.contains(e.target)) {
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
          // Seçilen ID'ye sahip filmleri bul
          // Not: API'den gelen id sayıdır, dataset stringdir. Karşılaştırmada dikkat.
          filteredMovies = allMoviesData.filter(movie => 
              movie.genres.some(g => g.id.toString() === genreId.toString())
          );
      }

      renderMovies(filteredMovies);
      
      // Hero'yu da filtrelenen listenin ilk filmiyle güncelle (Opsiyonel)
      if (filteredMovies.length > 0 && heroSection) {
          updateHeroWithMovie(filteredMovies[0].id, heroSection, heroContent);
      }
  }

  // --- OTURUM DURUMUNU DİNLE ---
  onAuthStateChanged(auth, (user) => {
    loadLibraryMovies();
  });
  
  // Kartlara tıklayınca Hero güncelle
  libraryGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.movie-card');
    if (card && card.dataset.id && heroSection) {
      updateHeroWithMovie(card.dataset.id, heroSection, heroContent);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
};

initLibrary();