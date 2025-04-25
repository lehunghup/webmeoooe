const csvFileURL = 'https://raw.githubusercontent.com/lehunghup/webmeoooe/main/data%20-%20Copy.csv';
let mediaData = [];
let viewedItems = new Set(JSON.parse(localStorage.getItem('viewedItems') || '[]'));

// Hàm này bây giờ tải CSV từ GitHub
function loadMediaData() {
  const errorMessage = document.getElementById('errorMessage');

  fetch(csvFileURL)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text(); // Lấy dữ liệu CSV dưới dạng text
    })
    .then(csvText => {
      // Sử dụng Papa.parse để xử lý dữ liệu CSV
      const results = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: function(results) { // Chuyển logic xử lý vào hàm complete
          if (results.errors.length > 0) {
            errorMessage.textContent = 'Error parsing CSV: ' + results.errors.map(e => e.message).join('; ');
            console.error('CSV parsing errors:', results.errors);
            return;
          }

          if (!results.data || results.data.length === 0) {
            errorMessage.textContent = 'CSV file is empty or invalid.';
            return;
          }

          // Check required columns
          const requiredColumns = ['id', 'url', 'title'];
          const firstRow = results.data[0];
          const missingColumns = requiredColumns.filter(col => !firstRow.hasOwnProperty(col));
          if (missingColumns.length > 0) {
            errorMessage.textContent = 'Missing required columns in CSV: ' + missingColumns.join(', ');
            return;
          }

          // Lọc các dòng hợp lệ (có đủ cột id, url, title)
          mediaData = results.data.filter(item => item.id && item.url && item.title);
          if (mediaData.length === 0) {
            errorMessage.textContent = 'No valid data found in CSV. Ensure each row has id, url, and title.';
            return;
          }
          renderMedia(); // Gọi renderMedia sau khi lấy và xử lý xong
        },
        error: function(error) {
          errorMessage.textContent = 'Error reading CSV file: ' + error.message;
          console.error('Error reading CSV:', error);
        }
      });
    })
    .catch(error => {
      errorMessage.textContent = 'Error fetching CSV file from GitHub: ' + error.message;
      console.error('Error fetching CSV from GitHub:', error);
    });
}

// Render media grid
function renderMedia() {
  const grid = document.getElementById('mediaGrid');
  const errorMessage = document.getElementById('errorMessage');
  grid.innerHTML = '';
  errorMessage.textContent = '';

  if (!mediaData || mediaData.length === 0) {
    errorMessage.textContent = 'No media data to display.';
    return;
  }

  mediaData.forEach(item => {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.onclick = () => playVideo(item.url, item.title, item.id);

    // Thumbnail
    const thumb = item.thumb || 'https://via.placeholder.com/150';
    const viewedMark = viewedItems.has(item.id) ? '<span class="viewed">Viewed</span>' : '';

    card.innerHTML = `
      <img src="${thumb}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/150'">
      ${viewedMark}
      <p><b>${item.title}</b></p>
      <p>Size: ${item.size_formatted}</p>
      <p>Uploaded: ${item.how_long_ago}</p>
      <button onclick="event.stopPropagation(); markAsViewed('${item.id}')">Mark as ${viewedItems.has(item.id) ? 'Unviewed' : 'Viewed'}</button>
    `;

    grid.appendChild(card);
  });
}

// Play video in modal
function playVideo(url, title, id) {
  const modal = document.getElementById('videoModal');
  const video = document.getElementById('modalVideo');
  const videoTitle = document.getElementById('videoTitle');

  // Reset video
  video.src = '';
  videoTitle.textContent = title;

  // Try loading video
  video.src = url;
  video.load();

  video.onerror = () => {
    console.error(`Failed to load video: ${url}`);
    closeModal();
  };

  video.onloadeddata = () => {
    modal.style.display = 'flex';
    video.play();
    // Auto-mark as viewed
    if (!viewedItems.has(id)) {
      markAsViewed(id);
    }
  };
}

// Close modal
function closeModal() {
  const modal = document.getElementById('videoModal');
  const video = document.getElementById('modalVideo');
  video.pause();
  video.src = '';
  video.load();
  document.getElementById('videoTitle').textContent = '';
  modal.style.display = 'none';
}

// Mark item as viewed/unviewed
function markAsViewed(id) {
  if (viewedItems.has(id)) {
    viewedItems.delete(id);
  } else {
    viewedItems.add(id);
  }
  localStorage.setItem('viewedItems', JSON.stringify([...viewedItems]));
  renderMedia();
}

// Sort media
function sortMedia() {
  const sortKey = document.getElementById('sort').value;
  mediaData.sort((a, b) => {
    if (sortKey === 'size_formatted') {
      const sizeA = parseFloat(a.size_formatted) || 0;
      const sizeB = parseFloat(b.size_formatted) || 0;
      return sizeB - sizeA;
    }
    return a[sortKey]?.localeCompare(b[sortKey]) || 0;
  });
  renderMedia();
}

// Close modal when clicking outside
document.getElementById('videoModal').onclick = function (e) {
  if (e.target === this) closeModal();
};

// Gọi hàm loadMediaData khi trang tải xong
window.onload = loadMediaData;

// Xóa hoặc comment phần này, vì mình không dùng input file nữa
// document.getElementById('csvFile').addEventListener('change', loadCSV);
