// вкладки
document.getElementById("defaultOpen").click();

function openTab(evt, Tab) {
    var i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(Tab).style.display = "block";
    evt.currentTarget.className += " active";
}










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



function filterFiles() {
    const showAnnotated = document.getElementById('showAnnotated').checked;
    const showValidated = document.getElementById('showValidated').checked;
    const select = document.getElementById('fruits');
    
    for (let i = 0; i < select.options.length; i++) {
        const option = select.options[i];
        const txtValue = option.getAttribute('data-txt');
        const valValue = option.getAttribute('data-val');
        
        if (showAnnotated) {
            if (txtValue !== 'nan') {
                option.style.display = '';
            } else {
                option.style.display = 'none';
            }
        } else if (showValidated) {
            if (valValue !== 'nan') {
                option.style.display = '';
            } else {
                option.style.display = 'none';
            }
        } else {
            option.style.display = '';
        }
    }
}

function filterFilesV() {
    const showVal = document.getElementById('showVal').checked;
    const showValidatedPositive = document.getElementById('showValidatedPositive').checked;
    const showValidatedNegative = document.getElementById('showValidatedNegative').checked;
    const select = document.getElementById('fruitsV');
    
    for (let i = 0; i < select.options.length; i++) {
        const option = select.options[i];
        const valValue = option.getAttribute('data-val');
        
        if (showVal) {
            if (valValue === 'nan') {
                option.style.display = '';
            } else {
                option.style.display = 'none';
            }
        } else if (showValidatedPositive) {
            if (valValue === '1.0') {
                option.style.display = '';
            } else {
                option.style.display = 'none';
            }
        } else if (showValidatedNegative) {
            if (valValue === '0.0') {
                option.style.display = '';
            } else {
                option.style.display = 'none';
            }
        } else {
            option.style.display = '';
        }
    }
}

window.onload = function() {
    filterFiles();
    filterFilesV()
};


function updateFileLabel(files) {
    const fileLabel = document.getElementById('file-label');
    const fileCount = document.getElementById('fileCount2');
    
    if (files.length > 0) {
        const fileNames = Array.from(files).map(file => file.name).join('<br>');
        fileLabel.innerHTML = fileNames;
        fileCount.textContent = `Количество загружаемых файлов: ${files.length}`;
    } else {
        fileLabel.textContent = 'Нет загружаемых файлов';
        fileCount.textContent = `Количество загружаемых файлов: 0`;
    }
}

function validateForm1() {
    const fileInput = document.getElementById('showUploadForm');
    if (fileInput.files.length === 0) {
        alert('Пожалуйста, добавьте файлы для загрузки.');
        return false;
    } else if (fileInput.files.length > 1000) {
        alert("Вы можете загрузить разом не более 1000 файлов.");
        return false;
    }
    return true;
}

function validateForm() {
    const fileInput = document.getElementById('showUploadForm');
    if (fileInput.files.length === 0) {
        alert('Пожалуйста, добавьте файлы для загрузки.');
        return false;
    }
    return true;
}

function validateForm() {
    const trainSize = parseFloat(document.getElementById('trainSize').value);
    const valSize = parseFloat(document.getElementById('valSize').value);

    if (trainSize + valSize !== 1) {
        alert('Сумма train и val выборок должна быть равна 1.');
        return false; // Отменяем отправку формы
    }
    alert("Датасет успешно создан. Он находится в папке datasets");
    return true; // Разрешаем отправку формы
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

function showAlert1() {
    alert("Класс успешно создан. Он находится в папке выбранного датасета. Называется classes.txt");
    return true; // Возвращаем true, чтобы форма была отправлена
}

function showAlert2() {
    alert("train.py успешно создан. Он находится в папке выбранного датасета.");
    return true; // Возвращаем true, чтобы форма была отправлена
}

document.querySelector('form').addEventListener('submit', function(e) {
    const imgsz = document.getElementById('imgsz').value;
    const epochs = document.getElementById('epochs').value;
    const batch = document.getElementById('batch').value;
    const savePeriod = document.getElementById('save_period').value;

    if (imgsz < 1 || epochs < 1 || batch < 1 || savePeriod < 1) {
        e.preventDefault();
        alert('Все значения должны быть больше 0.');
    }
});

document.getElementById('numPhotos').addEventListener('input', function() {
    const min = parseInt(this.min);
    const max = parseInt(this.max);
    const value = parseInt(this.value);

    if (value < min || value > max) {
        this.setCustomValidity(`Пожалуйста, введите число от ${min} до ${max}.`);
    } else {
        this.setCustomValidity('');
    }
});

function handleFlashMessages(messages) {
    messages.forEach(function(msg) {
        let title = msg.category.charAt(0).toUpperCase() + msg.category.slice(1); 
        let icon = msg.category === 'success' ? 'success' : 'error'; 

        swal({
            title: title,
            text: msg.message,
            icon: icon,
            button: "ОК",
        });
    });
}

function openCreateDataSet() {
    var LoadingScreen = document.querySelector('.CreateDataSet');
    document.querySelector('.overlayForCD').classList.add('showForCD');
    document.querySelector('.CreateDataSet').classList.add('showForCD');
    LoadingScreen.style.display = 'block';
}
   
function closeCreateDataSet() {
    var LoadingScreen = document.querySelector('.CreateDataSet');
    document.querySelector('.overlayForCD').classList.remove('showForCD');
    document.querySelector('.CreateDataSet').classList.remove('showForCD');
    LoadingScreen.style.display = 'none';
}

function openScript() {
    var LoadingScreen = document.querySelector('.Script');
    document.querySelector('.overlayForScript').classList.add('showForScript');
    document.querySelector('.Script').classList.add('showForScript');
    LoadingScreen.style.display = 'block';
}
   
function closeScript() {
    var LoadingScreen = document.querySelector('.Script');
    document.querySelector('.overlayForScript').classList.remove('showForScript');
    document.querySelector('.Script').classList.remove('showForScript');
    LoadingScreen.style.display = 'none';
}


const trainInput = document.getElementById('trainSize');
    const valInput = document.getElementById('valSize');

    trainInput.addEventListener('input', function() {
        const trainValue = parseFloat(trainInput.value);
        if (!isNaN(trainValue)) {
            valInput.value = (1 - trainValue).toFixed(2);
        }
    });

    valInput.addEventListener('input', function() {
        const valValue = parseFloat(valInput.value);
        if (!isNaN(valValue)) {
            trainInput.value = (1 - valValue).toFixed(2);
        }
    });


$(document).ready(function() {
    $('#photoForm').on('submit', function(event) {
        event.preventDefault();

        $.ajax({
            type: 'POST',
            url: $(this).attr('action'),
            data: $(this).serialize(),
            success: function(response) {
                if (response.exists) {
                    alert(response.message);
                    if (confirm("Продолжить?")) {
                        $.ajax({
                            type: 'POST',
                            url: '/copy_photos', 
                            data: $(this).serialize(),
                            success: function() {
                                window.location.href = '/';
                            },
                            error: function(err) {
                                alert('Ошибка: ' + err.responseJSON.error);
                            }
                        });
                    }
                } else {
                    window.location.href = '/';
                }
            },
            error: function(err) {
                alert('Ошибка: ' + err.responseJSON.error);
            }
        });
    });
});

function updateFileCount() {
    const select = document.getElementById('datasets');
    const selectedOptions = Array.from(select.selectedOptions);
    const count = selectedOptions.length;

    console.log(`Количество выбранных файлов: ${count}`);
}


function updateImage() {
    var select = document.getElementById("fruits");
    var selectedFileName = select.options[select.selectedIndex].text;
    var selectedFilePath = select.value;
    document.getElementById("selectedFileName").innerText = selectedFileName;
    var img = document.getElementById("fileImage");
    img.src = '/static/images/' + selectedFilePath.split('images/')[1];
}







function updateImageV(selectId, canvasId, fileNameId) {
    console.log("Функция updateImageV вызвана");
    const selectElement = document.getElementById(selectId);
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const fileNameElement = document.getElementById(fileNameId);

    console.log("Выбранный файл:", selectedOption.value);
    console.log("Текстовый файл:", selectedOption.dataset.txt);

    fileNameElement.textContent = "/static/images/" + (selectedOption.dataset.txt).split('images/')[1];

    const img = new Image();
    img.src = "/static/images/" + (selectedOption.value).split('images/')[1]; 
    img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = img.width; // Устанавливаем ширину канваса
        canvas.height = img.height; // Устанавливаем высоту канваса
        ctx.drawImage(img, 0, 0);

        loadCoordinates(selectedOption.dataset.txt, ctx, img.width, img.height);
    };

    img.onerror = function() {
        console.error('Ошибка загрузки изображения:', img.src);
        fileNameElement.textContent = "Ошибка загрузки изображения.";
    };
}

function loadCoordinates(txtFileName, ctx, imgWidth, imgHeight) {
    console.log("Функция loadCoordinates вызвана с файлом:", txtFileName);
    fetch("/static/images/" + txtFileName.split('images/')[1]) 
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка загрузки текстового файла: ' + response.statusText);
            }
            return response.text();
        })
        .then(data => {
            const lines = data.split('\n');
            lines.forEach(line => {
                const values = line.split(' ').map(Number);
                if (values.length === 5) {
                    const [classId, x, y, width, height] = values;

                    const left = (x - width / 2) * imgWidth; // X-координата (центр)
                    const top = (y - height / 2) * imgHeight; // Y-координата (центр)
                    const frameWidth = width * imgWidth; // Ширина рамки
                    const frameHeight = height * imgHeight; // Высота рамки

                    console.log(`Class ID: ${classId}, Left: ${left}, Top: ${top}, Width: ${frameWidth}, Height: ${frameHeight}`);

                    ctx.strokeStyle = 'red'; 
                    ctx.lineWidth = 6;
                    ctx.strokeRect(left, top, frameWidth, frameHeight); 
                }
            });
        })
        .catch(error => {
            console.error('Ошибка:', error);
        });
}





function recordResult(result) {
    const userNameButton = document.getElementById('userName');
    const currentUserName = userNameButton.textContent;

    if (currentUserName === 'ИМЯ ПОЛЬЗОВАТЕЛЯ') {
        alert('Зайдите в аккаунт'); 
    } else {
        const selectElement = document.getElementById('fruitsV');
        const selectedPhoto = selectElement.value;

        if (!selectedPhoto) {
            alert('Пожалуйста, выберите фотографию.');
            return;
        }

        const formData = new FormData();
        formData.append('fruits', selectedPhoto);
        formData.append('result', result);
        formData.append('username', currentUserName);

        fetch('/record_result', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                if (selectElement.selectedIndex < selectElement.options.length - 1) {
                    selectElement.selectedIndex += 1;
                    updateImageV('fruitsV', 'fileImageV', 'selectedFileNameV');
                } else {
                    alert("Это последняя фотография.");
                }
            } else {
                console.error("Ошибка при отправке данных.");
            }
        })
        .catch(error => {
            console.error("Произошла ошибка:", error);
        });
    }
}

function endProcess() {
    const userNameButton = document.getElementById('userName');
    const currentUserName = userNameButton.textContent;

    if (currentUserName === 'ИМЯ ПОЛЬЗОВАТЕЛЯ') {
        alert('Зайдите в аккаунт'); 
    } else {
        document.getElementById('userName').textContent = 'ИМЯ ПОЛЬЗОВАТЕЛЯ';
        location.reload();
    }
}

window.onload = function() {
    updateImage('fruitsV', 'fileImageV', 'selectedFileNameV');
};

async function loadUsers() {
    const response = await fetch('/get_users');
    const users = await response.json();
    const userSelect = document.getElementById('userSelect');
    userSelect.innerHTML = '';
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.textContent = user;
        userSelect.appendChild(option);
    });
}

function updateUserName() {
    const userSelect = document.getElementById('userSelect');
    const selectedUser  = userSelect.value;
    document.getElementById('userName').textContent = selectedUser ;
}

async function addUser () {
    const newUserName = document.getElementById('newUserName').value;
    if (newUserName) {
        const response = await fetch('/add_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: newUserName })
        });
        if (response.ok) {
            loadUsers(); 
            document.getElementById('newUserName').value = '';
        } else {
            alert('Ошибка при добавлении пользователя.');
        }
    } else {
        alert('Введите имя пользователя.');
    }
}

document.getElementById('addUser').addEventListener('click', addUser );

document.addEventListener('DOMContentLoaded', loadUsers)

window.onload = loadUsers;

