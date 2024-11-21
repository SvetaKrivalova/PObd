import torch
import os
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, jsonify, flash
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from ultralytics import YOLO
import random
import shutil
from sqlalchemy import func, text
from sklearn.model_selection import train_test_split

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

secret_key = os.urandom(24)
app.secret_key = secret_key

db = SQLAlchemy(app)

class Yolka(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    photo = db.Column(db.String(255), nullable=True)
    txt = db.Column(db.String(255), nullable=True)
    photo_date = db.Column(db.DateTime, nullable=True)

class Datasets(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    dataset_name = db.Column(db.String(255), nullable=False)
    dataset_path = db.Column(db.String(255), nullable=False)

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    yolki = Yolka.query.order_by(Yolka.id.desc()).all()
    filenames = [os.path.basename(yolka.photo) for yolka in yolki]
    non_empty_count = db.session.query(func.count(Yolka.txt)).filter(Yolka.txt.isnot(None), Yolka.txt != '').scalar()

    datasets = Datasets.query.all()

    return render_template('index.html', yolki=yolki, filenames=filenames, non_empty_count=non_empty_count, datasets=datasets)


@app.route('/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return "No file part", 400
    
    files = request.files.getlist('files')
    images_dir = os.path.join(os.path.dirname(__file__), "static", "images")
    if not os.path.exists(images_dir):
        os.makedirs(images_dir)

    new_entries = []
    for file in files:
        if file.filename == '':
            return "No selected file", 400
        
        filename = file.filename
        file_extension = os.path.splitext(filename)[1].lower()
        file_path = os.path.join(images_dir, filename)
        
        try:
            file.save(file_path)
            print(f"Файл сохранен: {file_path}")
        except Exception as e:
            print(f"Ошибка при сохранении файла {filename}: {e}")
            return "Error saving file", 500

    for file in files:
        filename = file.filename
        file_extension = os.path.splitext(filename)[1].lower()
        relative_image_path = os.path.relpath(os.path.join(images_dir, filename), start=os.path.join(os.path.dirname(__file__), "static"))
        relative_image_path = relative_image_path.replace("\\", "/")
        txt_path = None
        
        if file_extension != '.txt':
            txt_filename = os.path.splitext(filename)[0] + '.txt'
            txt_file_path = os.path.join(images_dir, txt_filename)
            
            if os.path.exists(txt_file_path):
                txt_path = os.path.relpath(txt_file_path, start=os.path.join(os.path.dirname(__file__), "static"))
                txt_path = txt_path.replace("\\", "/")
                print(f"Текстовый файл найден: {txt_path}")
            else:
                print(f"Текстовый файл не найден: {txt_file_path}")

            new_entries.append(Yolka(photo=relative_image_path, txt=txt_path, photo_date=datetime.now()))

    try:
        db.session.bulk_save_objects(new_entries)
        db.session.commit()
        print("Записи успешно добавлены в базу данных.")
    except Exception as e:
        db.session.rollback()
        print(f"Ошибка при сохранении в базу данных: {e}")
        return "Error saving to database", 500

    return redirect(url_for('index'))

@app.route('/copy_photos', methods=['POST'])
def copy_photos():
    num_photos = request.form.get('num_photos', type=int)
    dataset_name = request.form.get('dataset_name') 
    destination_folder = request.form.get('destination_folder') 
    train_size = request.form.get('train_size', type=float)
    val_size = request.form.get('val_size', type=float)

    if dataset_name is None:
        return jsonify({"error": "Необходимо указать название датасета."}), 400

    if destination_folder is None:
        return jsonify({"error": "Необходимо указать путь к папке назначения."}), 400

    if train_size + val_size != 1.0:
        return jsonify({"error": "Сумма train_size и val_size должна быть равна 1."}), 400

    new_dataset = Datasets(dataset_name=dataset_name)

    yolo_folder = os.path.join(destination_folder, dataset_name) 
    dataset_folder = os.path.join(yolo_folder, 'dataset')

    if os.path.exists(yolo_folder):
        return jsonify({"exists": True, "message": "Папка с таким именем уже существует. Продолжить?"}), 409

    try:
        os.makedirs(yolo_folder, exist_ok=True)
        os.makedirs(dataset_folder, exist_ok=True)
        os.makedirs(os.path.join(yolo_folder, 'train'), exist_ok=True)
        os.makedirs(os.path.join(yolo_folder, 'val'), exist_ok=True)
    except Exception as e:
        return jsonify({"error": f"Не удалось создать папку: {str(e)}"}), 500

    photos = Yolka.query.filter(Yolka.txt.isnot(None)).all()
    print(f"Количество фотографий с текстом в базе данных: {len(photos)}")
    
    if not photos:
        return jsonify({"error": "Нет фотографий с текстом в базе данных."}), 400

    if num_photos > len(photos):
        return jsonify({"error": "Недостаточно фотографий с текстом в базе данных."}), 400

    selected_photos = random.sample(photos, num_photos)

    for photo in selected_photos:
        photo_path = os.path.join('static', photo.photo)
        print(f"Исходный путь к изображению: {photo_path}")
        
        destination_photo_path = os.path.join(dataset_folder, os.path.basename(photo.photo))  # Сохраняем в dataset
        print(f"Путь к копируемому изображению: {destination_photo_path}")
        
        try:
            if os.path.exists(photo_path):
                shutil.copy(photo_path, destination_photo_path)
            else:
                print(f"Файл изображения не найден: {photo_path}")
                return jsonify({"error": f"Файл изображения не найден: {photo_path}"}), 404
        except Exception as e:
            print(f"Ошибка при копировании файла {photo.photo}: {str(e)}")
            return jsonify({"error": f"Ошибка при копировании файла {photo.photo}: {str(e)}"}), 500

        if photo.txt:
            txt_path = os.path.join('static', photo.txt)
            print(f"Исходный путь к текстовому файлу: {txt_path}")
            
            destination_txt_path = os.path.join(dataset_folder, os.path.basename(photo.txt))  # Сохраняем в dataset
            print(f"Путь к копируемому текстовому файлу: {destination_txt_path}")
            
            try:
                if os.path.exists(txt_path):
                    shutil.copy(txt_path, destination_txt_path)
                else:
                    print(f"Текстовый файл не найден: {txt_path}")
                    return jsonify({"error": f"Текстовый файл не найден: {txt_path}"}), 404
            except Exception as e:
                print(f"Ошибка при копировании текстового файла {photo.txt}: {str(e)}")
                return jsonify({"error": f"Ошибка при копировании текстового файла {photo.txt}: {str(e)}"}), 500

    split_and_save_dataset(dataset_folder, yolo_folder, test_size=val_size)
    
    new_dataset.dataset_path = yolo_folder
    try:
        db.session.add(new_dataset)
        db.session.commit()
    except Exception as e:
        db.session.rollback() 
        return jsonify({"error": f"Не удалось сохранить датасет в базе данных: {str(e)}"}), 500

    return redirect(url_for('index'))

def split_and_save_dataset(source_folder, destination_folder, test_size):
    all_files = os.listdir(source_folder)
    
    images = [f for f in all_files if f.endswith(('.jpg', '.jpeg', '.png'))]
    texts = [f for f in all_files if f.endswith('.txt')]

    images_with_texts = [img for img in images if os.path.splitext(img)[0] + '.txt' in texts]
    train_files, val_files = train_test_split(images_with_texts, test_size=test_size, random_state=42)

    train_folder = os.path.join(destination_folder, 'train')
    val_folder = os.path.join(destination_folder, 'val')

    os.makedirs(train_folder, exist_ok=True)
    os.makedirs(val_folder, exist_ok=True)

    for file in train_files:
        shutil.copy(os.path.join(source_folder, file), os.path.join(train_folder, file))
        txt_file = os.path.splitext(file)[0] + '.txt'
        if txt_file in texts:
            shutil.copy(os.path.join(source_folder, txt_file), os.path.join(train_folder, txt_file))

    for file in val_files:
        shutil.copy(os.path.join(source_folder, file), os.path.join(val_folder, file))
        txt_file = os.path.splitext(file)[0] + '.txt'
        if txt_file in texts:
            shutil.copy(os.path.join(source_folder, txt_file), os.path.join(val_folder, txt_file))

    print(f"Количество файлов в train: {len(train_files)}")
    print(f"Количество файлов в val: {len(val_files)}")

@app.route('/create_class', methods=['POST'])
def create_class():
    selected_dataset = request.form.get('selected_dataset')
    class_name = request.form.get('class_name')

    print(f"Выбранный датасет: {selected_dataset}")
    print(f"Имя класса: {class_name}") 

    if selected_dataset and class_name:
        dataset_folder = selected_dataset 
        print(f"Папка датасета: {dataset_folder}")

        classes_file_path = os.path.join(dataset_folder, 'classes.txt')
        data_yaml_path = os.path.join(dataset_folder, 'data.yaml')

        try:
            with open(classes_file_path, 'a') as f:
                f.write(class_name + '\n')
            print(f"Имя класса '{class_name}' добавлено в файл '{classes_file_path}'")
        except Exception as e:
            print(f"Ошибка при записи в {classes_file_path}: {e}")

        try:
            with open(classes_file_path, 'r') as f:
                class_names = [line.strip() for line in f.readlines()]
            print(f"Имена классов: {class_names}")
        except Exception as e:
            print(f"Ошибка при чтении из {classes_file_path}: {e}")
            class_names = []

        num_classes = len(class_names)

        try:
            with open(data_yaml_path, 'w') as f:
                f.write(f"train: ./train\n")
                f.write(f"val: ./val\n")
                f.write(f"nc: {num_classes}\n")
                f.write(f"names: {class_names}\n")
            print(f"Файл {data_yaml_path} успешно создан.")
        except Exception as e:
            print(f"Ошибка при записи в {data_yaml_path}: {e}")
    else:
        print("Не удалось получить выбранный датасет или имя класса.")
    
    return redirect(url_for('index'))

@app.route('/create_train_script', methods=['POST'])
def create_train_script():
    try:
        imgsz = int(request.form['imgsz'])
        epochs = int(request.form['epochs'])
        batch = int(request.form['batch'])
        save_period = int(request.form['save_period'])
        selected_dataset = request.form['selected_dataset']  # Получаем путь к выбранному датасету

        # Убедитесь, что путь к выбранному датасету корректный
        if not selected_dataset.endswith(os.path.sep):
            selected_dataset += os.path.sep

        # Путь к скрипту train.py в папке выбранного датасета
        script_path = os.path.join(selected_dataset, 'train.py')
        
        script_content = f"""import torch
import os
os.environ["KMP_DUPLICATE_LIB_OK"]="TRUE"

from ultralytics import YOLO

if __name__ == "__main__":
    model = YOLO('yolo11n.pt')
    results = model.train(
        data='{os.path.join(selected_dataset, 'data.yaml')}',
        imgsz={imgsz},
        epochs={epochs},
        batch={batch},
        save_period={save_period}
    )
"""

        with open(script_path, 'w') as f:
            f.write(script_content)

        flash('Файл train.py успешно создан!', 'success')
    except Exception as e:
        flash(f'Ошибка при создании файла: {e}', 'error')

    return redirect(url_for('index'))

@app.route('/train', methods=['POST'])
def train():
    os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
    data_yaml_path = os.path.abspath(os.path.join(os.getcwd(), 'yolo', 'data.yaml'))
    save_dir = os.path.abspath(os.path.join(os.getcwd(), 'yolo'))
    try:
        imgsz = int(request.form['imgsz'])
        epochs = int(request.form['epochs'])
        batch = int(request.form['batch'])
        save_period = int(request.form['save_period'])
        
        model = YOLO('yolo11n.pt')
        results = model.train(
            data=data_yaml_path,
            imgsz=imgsz,
            epochs=epochs,
            batch=batch,
            save_period=save_period,
            project=save_dir,
            name='runs'
        )
        flash('Обучение завершено успешно!', 'success')
    except Exception as e:
        flash(f'Ошибка при обучении: {e}', 'error')
    
    return redirect(url_for('index'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)