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

function updateImage(selectId, canvasId, fileNameId) {
    console.log("Функция updateImage вызвана");
    const selectElement = document.getElementById(selectId);
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const fileNameElement = document.getElementById(fileNameId);

    console.log("Выбранный файл:", selectedOption.value);
    console.log("Текстовый файл:", selectedOption.dataset.txt);

    fileNameElement.textContent = "/static/" + selectedOption.dataset.txt;

    const img = new Image();
    img.src = "/static/" + selectedOption.value; 
    img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        loadCoordinates(selectedOption.dataset.txt, ctx, canvas.width, canvas.height);
    };

    img.onerror = function() {
        console.error('Ошибка загрузки изображения:', img.src);
        fileNameElement.textContent = "Ошибка загрузки изображения.";
    };
}


function loadCoordinates(txtFileName, ctx, canvasWidth, canvasHeight) {
    console.log("Функция loadCoordinates вызвана с файлом:", txtFileName);
    fetch("/static/" + txtFileName) 
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
                    const [index, x, y, w, h] = values;

                    koeff = 1;

                    const X = x * canvasWidth;
                    const Y = y * canvasHeight;
                    const W = w * canvasWidth;
                    const H = h * canvasHeight; 

                    console.log(`Index: ${index}, X: ${X}, Y: ${Y}, W: ${W}, H: ${H}`);

                    ctx.strokeStyle = 'red'; 
                    ctx.lineWidth = 1;
                    ctx.strokeRect(koeff*0.969*X, koeff*0.92*Y, koeff*3*W, koeff*2*H); 
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
                    updateImage('fruitsV', 'fileImageV', 'selectedFileNameV'); 
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

