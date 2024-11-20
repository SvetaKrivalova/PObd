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

db = SQLAlchemy(app)

class Yolka(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    photo = db.Column(db.String(255), nullable=True)
    txt = db.Column(db.String(255), nullable=True)
    photo_date = db.Column(db.DateTime, nullable=True)

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    yolki = Yolka.query.order_by(Yolka.id.desc()).all()
    filenames = [os.path.basename(yolka.photo) for yolka in yolki]
    non_empty_count = db.session.query(func.count(Yolka.txt)).filter(Yolka.txt.isnot(None), Yolka.txt != '').scalar()
    return render_template('index.html', yolki=yolki, filenames=filenames, non_empty_count=non_empty_count)

@app.route('/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return "No file part", 400
    
    files = request.files.getlist('files')
    images_dir = os.path.join(os.path.dirname(__file__), "static", "images")
    if not os.path.exists(images_dir):
        os.makedirs(images_dir)

    for file in files:
        if file.filename == '':
            return "No selected file", 400
        
        filename = file.filename
        file_extension = os.path.splitext(filename)[1].lower()
        file_path = os.path.join(images_dir, filename)
        file.save(file_path)
    
        relative_image_path = os.path.relpath(file_path, start=os.path.join(os.path.dirname(__file__), "static")) 
        relative_image_path = relative_image_path.replace("\\", "/")
        txt_path = None
        
        if file_extension != '.txt':
            txt_filename = os.path.splitext(filename)[0] + '.txt'
            txt_file_path = os.path.join(images_dir, txt_filename)
            
            if os.path.exists(txt_file_path):
                txt_path = os.path.relpath(txt_file_path, start=os.path.join(os.path.dirname(__file__), "static"))
                txt_path = txt_path.replace("\\", "/")

            new_entry = Yolka(photo=relative_image_path, txt=txt_path, photo_date=datetime.now())
            db.session.add(new_entry)

    db.session.commit()
    return redirect(url_for('index'))

@app.route('/copy_photos', methods=['POST'])
def copy_photos():
    num_photos = request.form.get('num_photos', type=int)

    project_root = os.path.dirname(os.path.abspath(__file__))  
    yolo_folder = os.path.join(project_root, 'yolo', 'dataset') 

    photos = Yolka.query.filter(Yolka.txt.isnot(None)).all()
    print(f"Количество фотографий с текстом в базе данных: {len(photos)}")
    
    if not photos:
        return jsonify({"error": "Нет фотографий с текстом в базе данных."}), 400

    if num_photos > len(photos):
        return jsonify({"error": "Недостаточно фотографий с текстом в базе данных."}), 400

    selected_photos = random.sample(photos, num_photos)
    
    try:
        os.makedirs(yolo_folder, exist_ok=True)
    except Exception as e:
        return jsonify({"error": f"Не удалось создать папку: {str(e)}"}), 500

    for photo in selected_photos:
        photo_path = os.path.join('static', photo.photo)
        print(f"Исходный путь к изображению: {photo_path}")
        
        destination_photo_path = os.path.join(yolo_folder, os.path.basename(photo.photo))
        print(f"Путь к копируемому изображению: {destination_photo_path}")
        
        try:
            if os.path.exists(photo_path):
                shutil.copy(photo_path, destination_photo_path)
            else:
                print(f"Файл изображения не найден: {photo_path}")
        except Exception as e:
            print(f"Ошибка при копировании файла {photo.photo}: {str(e)}")
            return jsonify({"error": f"Ошибка при копировании файла {photo.photo}: {str(e)}"}), 500

        if photo.txt:
            txt_path = os.path.join('static', photo.txt)
            print(f"Исходный путь к текстовому файлу: {txt_path}")
            
            destination_txt_path = os.path.join(yolo_folder, os.path.basename(photo.txt))
            print(f"Путь к копируемому текстовому файлу: {destination_txt_path}")
            
            try:
                if os.path.exists(txt_path):
                    shutil.copy(txt_path, destination_txt_path)
                else:
                    print(f"Текстовый файл не найден: {txt_path}")
            except Exception as e:
                print(f"Ошибка при копировании текстового файла {photo.txt}: {str(e)}")
                return jsonify({"error": f"Ошибка при копировании текстового файла {photo.txt}: {str(e)}"}), 500

    return redirect(url_for('index'))

def split_and_save_dataset(source_folder, destination_folder, test_size=0.2):
    all_files = os.listdir(source_folder)
    
    images = [f for f in all_files if f.endswith(('.jpg', '.jpeg', '.png'))]
    texts = [f for f in all_files if f.endswith('.txt')]

    images_with_texts = [img for img in images if os.path.splitext(img)[0] + '.txt' in texts]

    train_files, val_files = train_test_split(images_with_texts, test_size=test_size, random_state=42)

    yolo_folder = os.path.join('yolo')
    train_folder = os.path.join(yolo_folder, 'train')
    val_folder = os.path.join(yolo_folder, 'val')

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

@app.route('/split_dataset', methods=['POST'])
def split_dataset():
    source_folder = os.path.join('yolo', 'dataset')  
    destination_folder = os.path.join('yolo',)  
    split_and_save_dataset(source_folder, destination_folder)
    return redirect(url_for('index'))

@app.route('/create_class', methods=['POST'])
def create_class():
    classes_file_path = 'yolo/classes.txt'
    class_name = request.form.get('class_name')
    if class_name:
        with open(classes_file_path, 'a') as f:
            f.write(class_name + '\n')

    train_path = './train'
    val_path = './val'

    with open(classes_file_path, 'r') as f:
        class_names = [line.strip() for line in f.readlines()]

    num_classes = len(class_names)
    data_yaml_path = 'yolo/data.yaml'
    with open(data_yaml_path, 'w') as f:
        f.write(f"train: {train_path}\n")
        f.write(f"val: {val_path}\n")
        f.write(f"nc: {num_classes}\n")
        f.write(f"names: {class_names}\n")

    print(f"Файл {data_yaml_path} успешно создан.")
    
    return redirect(url_for('index'))

@app.route('/train', methods=['POST'])
def train():
    os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
    data_yaml_path = os.path.abspath(os.path.join(os.getcwd(), 'yolo', 'data.yaml'))
    try:
        model = YOLO('yolo11n.pt')
        results = model.train(
            data=data_yaml_path,
            imgsz=640,
            epochs=500,
            batch=2,
            save_period=50
        )
        flash('Обучение завершено успешно!', 'success')
    except Exception as e:
        flash(f'Ошибка при обучении: {e}', 'error')
    
    return redirect(url_for('index'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)