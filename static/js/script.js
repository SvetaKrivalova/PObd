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

document.getElementById('showUploadForm').addEventListener('click', function() {
    const uploadForm = document.getElementById('uploadForm');
    uploadForm.style.display = uploadForm.style.display === 'none' ? 'block' : 'none';
})

function updateImage() {
    var select = document.getElementById("fruits");
    var selectedFileName = select.options[select.selectedIndex].text;
    var selectedFilePath = select.value;
    document.getElementById("selectedFileName").innerText = selectedFileName;
    var img = document.getElementById("fileImage");
    img.src = '/static/' + selectedFilePath;
}

function filterFiles() {
    const showAnnotated = document.getElementById('showAnnotated').checked;
    const select = document.getElementById('fruits');
    
    for (let i = 0; i < select.options.length; i++) {
        const option = select.options[i];
        const txtValue = option.getAttribute('data-txt');
        
        if (showAnnotated) {
            if (txtValue !== 'None') {
                option.style.display = '';
            } else {
                option.style.display = 'none';
            }
        } else {
            option.style.display = '';
        }
    }
}

function updateFileLabel(files) {
    const fileNames = Array.from(files).map(file => file.name).join(', ');
    const label = document.querySelector('.selectFolderBtn-btn');
    label.textContent = fileNames.length > 0 ? `Выбрано файлов: ${fileNames}` : 'Выбрать папку';
}

document.getElementById('photoForm').onsubmit = function(event) {
    event.preventDefault();
    const numPhotos = document.getElementById('numPhotos').value;
    const destinationFolder = document.getElementById('destinationFolder').value;

    const formData = new FormData();
    formData.append('num_photos', numPhotos);
    formData.append('destination_folder', destinationFolder);
    console.log(`Количество фотографий: ${numPhotos}`);
    console.log(`Путь к папке назначения: ${destinationFolder}`);

    fetch('/copy_photos', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message || data.error);
    })
    .catch(error => {
        console.error('Ошибка:', error);
    });
};