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

function updateFileLabel(files) {
       const fileLabel = document.getElementById('file-label');
       const fileNames = Array.from(files).map(file => file.name).join(', ');
       fileLabel.textContent = fileNames;
}

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