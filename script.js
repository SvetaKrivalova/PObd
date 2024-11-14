
function openLoadingScreen() {
    var LoadingScreen = document.querySelector('.LoadingScreen');
    document.querySelector('.overlay').classList.add('show');
    document.querySelector('.LoadingScreen').classList.add('show');
    LoadingScreen.style.display = 'block';
   }
   
function closeLoadingScreen() {
       var LoadingScreen = document.querySelector('.LoadingScreen');
       document.querySelector('.overlay').classList.remove('show');
       document.querySelector('.LoadingScreen').classList.remove('show');
       LoadingScreen.style.display = 'none';
   
      
   }
   



function updateFileLabel(files) {
    const fileLabel = document.getElementById('file-label');
    if (files.length > 0) {
        fileLabel.textContent = Array.from(files).map(file => file.name).join(', ');
    } else {
        fileLabel.textContent = '';
    }
}

document.getElementById('uploadForm').addEventListener('submit', function(event) {
    const files = document.getElementById('fileInput').files;
    if (files.length === 0) {
        event.preventDefault(); // Отменяем отправку формы
        alert('Пожалуйста, выберите файлы для загрузки.'); // Показываем алерт
    }
});

// document.getElementById('showUploadForm').addEventListener('click', function() {
//        const uploadForm = document.getElementById('uploadForm');
//        uploadForm.style.display = uploadForm.style.display === 'none' ? 'block' : 'none';
//    })
   
// function updateFileLabel(files) {
//           const fileLabel = document.getElementById('file-label');
//           const fileNames = Array.from(files).map(file => file.name).join(', ');
//           fileLabel.textContent = fileNames;
//    }
   


