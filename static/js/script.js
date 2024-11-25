// вкладки
document.getElementById("defaultOpen").click();

function openTab(evt, Tab) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
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
    const select = document.getElementById('fruits');
    
    for (let i = 0; i < select.options.length; i++) {
        const option = select.options[i];
        const txtValue = option.getAttribute('data-txt');
        
        if (showAnnotated) {
            if (txtValue !== 'nan') {
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
};

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
        event.preventDefault(); // Prevent default form submission

        $.ajax({
            type: 'POST',
            url: $(this).attr('action'),
            data: $(this).serialize(),
            success: function(response) {
                if (response.exists) {
                    // Display the message in an alert box
                    alert(response.message);
                    // Ask the user to confirm
                    if (confirm("Продолжить?")) {
                        // If the user confirms, send the form again
                        $.ajax({
                            type: 'POST',
                            url: '/copy_photos', // Same handler
                            data: $(this).serialize(),
                            success: function() {
                                window.location.href = '/'; // Redirect to the main page
                            },
                            error: function(err) {
                                alert('Ошибка: ' + err.responseJSON.error);
                            }
                        });
                    }
                } else {
                    // If the folder doesn't exist, continue with the copy operation
                    window.location.href = '/'; // Redirect to the main page
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



let currentIndex = 0; // Индекс текущего файла
        const selectElement = document.getElementById("fruitsV");

        // Функция для обновления изображения
        function updateImage(selectId, imgId, textId) {
            var select = document.getElementById(selectId);
            var selectedFileName = select.options[select.selectedIndex].text; 
            var selectedFilePath = select.value; 
            document.getElementById(textId).innerText = selectedFileName;
            var img = document.getElementById(imgId);
            img.src = "/static/" + selectedFilePath;
            img.style.display = "block"; // Показываем изображение
        }

        // Функция для записи результата
        function recordResult(result) {
            const selectedOption = selectElement.options[selectElement.selectedIndex];
            const fileName = selectedOption.value; // Получаем имя файла
            const date = new Date().toISOString(); // Получаем текущую дату в формате ISO

            fetch('/record_result', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user: 'Я',
                    file: fileName,
                    date: date,
                    result: result
                })
            })
            .then(response => {
                if (response.ok) {
                    // Переходим к следующему файлу
                    currentIndex++;
                    if (currentIndex < selectElement.options.length) {
                        selectElement.selectedIndex = currentIndex; // Устанавливаем следующий файл
                        updateImage('fruitsV', 'fileImageV', 'selectedFileNameV'); // Обновляем изображение
                    } else {
                        alert('Обработка завершена!');
                        // Можно добавить логику для завершения
                    }
                } else {
                    alert('Ошибка при записи результата.');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
            });
        }

        // Функция для завершения процесса
        function endProcess() {
            alert('Процесс завершен!');
            // Здесь можно добавить логику для завершения, например, перенаправление или очистку данных
        }

        // Инициализация первой фотографии
        updateImage('fruitsV', 'fileImageV', 'selectedFileNameV');