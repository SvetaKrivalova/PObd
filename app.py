import os
import pandas as pd
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, jsonify, flash
import shutil
import csv
from sklearn.model_selection import train_test_split
import uuid

app = Flask(__name__)
app.secret_key = os.urandom(24)

YOLKA_CSV = 'yolka_data.csv'
DATASETS_CSV = 'datasets_data.csv'
VAL_CSV = 'val_data.csv'
USER_CSV = 'users.csv'

if not os.path.exists(USER_CSV):
    pd.DataFrame(columns=['id', 'name']).to_csv(USER_CSV, index=False)

if not os.path.exists(YOLKA_CSV):
    pd.DataFrame(columns=['id', 'photo', 'txt', 'photo_date', 'val_result']).to_csv(YOLKA_CSV, index=False)

if not os.path.exists(DATASETS_CSV):
    pd.DataFrame(columns=['id', 'dataset_path']).to_csv(DATASETS_CSV, index=False)

if not os.path.exists(VAL_CSV):
    pd.DataFrame(columns=['id', 'user', 'photo', 'val_date', 'result']).to_csv(VAL_CSV, index=False)


def add_user(name):
    df = pd.read_csv(USER_CSV)
    new_id = df['id'].max() + 1 if not df.empty else 1 
    new_user = pd.DataFrame({'id': [new_id], 'name': [name]})
    new_user.to_csv(USER_CSV, mode='a', header=False, index=False) 


@app.route('/add_user', methods=['POST'])
def add_user_route():
    data = request.get_json()
    name = data.get('name')
    if name:
        add_user(name)
        return redirect(url_for('index'))
    return '', 400 

@app.route('/get_users', methods=['GET'])
def get_users():
    df = pd.read_csv(USER_CSV)
    users = df['name'].tolist() 
    return jsonify(users) 

@app.route('/')
def index():
    yolki = pd.read_csv(YOLKA_CSV)
    datasets = pd.read_csv(DATASETS_CSV)
    users = pd.read_csv(USER_CSV)
    vals = pd.read_csv(VAL_CSV)
    non_empty_count = yolki['txt'].notnull().sum()

    return render_template('index.html', yolki=yolki.to_dict(orient='records'), non_empty_count=non_empty_count, datasets=datasets.to_dict(orient='records'), users=users.to_dict(orient='records'), vals=vals.to_dict(orient='records'))

@app.route('/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return "No file part", 400
    
    files = request.files.getlist('files')
    images_dir = os.path.join(os.path.dirname(__file__), "static", "images")
    if not os.path.exists(images_dir):
        os.makedirs(images_dir)

    new_entries = []
    image_files = set() 

    for file in files:
        if file.filename == '':
            return "No selected file", 400
        
        filename = file.filename
        file_extension = os.path.splitext(filename)[1].lower()
        file_path = os.path.join(images_dir, filename)
        
        try:
            file.save(file_path)
            print(f"Файл сохранен: {file_path}")
            if file_extension != '.txt':
                image_files.add(filename)
        except Exception as e:
            print(f"Ошибка при сохранении файла {filename}: {e}")
            return "Error saving file", 500

    for file in files:
        filename = file.filename
        file_extension = os.path.splitext(filename)[1].lower()
        relative_path = os.path.relpath(os.path.join(images_dir, filename), start=os.path.join(os.path.dirname(__file__), "static"))
        relative_path = relative_path.replace("\\", "/")

        if file_extension != '.txt':
            txt_filename = os.path.splitext(filename)[0] + '.txt'
            txt_file_path = os.path.join(images_dir, txt_filename)

            if os.path.exists(txt_file_path):
                txt_path = os.path.relpath(txt_file_path, start=os.path.join(os.path.dirname(__file__), "static"))
                txt_path = txt_path.replace("\\", "/")
                new_entries.append({
                    'photo': relative_path,
                    'txt': txt_path,
                    'photo_date': datetime.now()
                })
            else:
                new_entries.append({
                    'photo': relative_path,
                    'txt': None, 
                    'photo_date': datetime.now()
                })
                print(f"Текстовый файл не найден для изображения: {txt_file_path}")

        elif file_extension == '.txt':
            image_filename = os.path.splitext(filename)[0] + '.jpg'
            if image_filename in image_files:
                corresponding_image_path = os.path.relpath(os.path.join(images_dir, image_filename), start=os.path.join(os.path.dirname(__file__), "static"))
                corresponding_image_path = corresponding_image_path.replace("\\", "/")
                new_entries.append({
                    'photo': corresponding_image_path,
                    'txt': relative_path, 
                    'photo_date': datetime.now()
                })
            else:
                print(f"Изображение для текстового файла не найдено: {image_filename}")

    try:
        if os.path.exists(YOLKA_CSV):
            yolki_df = pd.read_csv(YOLKA_CSV)
        else:
            yolki_df = pd.DataFrame(columns=['id', 'photo', 'txt', 'photo_date'])

        new_entries_df = pd.DataFrame(new_entries)
        yolki_df = pd.concat([yolki_df, new_entries_df], ignore_index=True)
        yolki_df.drop_duplicates(subset=['photo', 'txt'], keep='last', inplace=True)  # Удаляем дубликаты по photo и txt

        yolki_df.reset_index(drop=True, inplace=True)

        yolki_df['id'] = range(1, len(yolki_df) + 1) 

        yolki_df.to_csv(YOLKA_CSV, index=False) 
        print("Записи успешно добавлены в CSV.")
    except Exception as e:
        print(f"Ошибка при сохранении в CSV: {e}")
        return "Error saving to CSV", 500

    return redirect(url_for('index'))

@app.route('/copy_photos', methods=['POST'])
def copy_photos():
    num_photos = request.form.get('num_photos', type=int)
    dataset_name = request.form.get('dataset_name')
    train_size = request.form.get('train_size', type=float)
    val_size = request.form.get('val_size', type=float)

    if dataset_name is None:
        return jsonify({"error": "Необходимо указать название датасета."}), 400

    if train_size + val_size != 1.0:
        return jsonify({"error": "Сумма train_size и val_size должна быть равна 1."}), 400
    
    destination_folder = os.path.join(os.path.dirname(__file__), "static", "datasets")
    relative_path = os.path.relpath(destination_folder, start=os.path.join(os.path.dirname(__file__), "static"))

    datasets_df = pd.read_csv(DATASETS_CSV)
    new_dataset_id = len(datasets_df) + 1
    new_dataset = {
        'id': new_dataset_id,
        'dataset_path': os.path.join(relative_path, dataset_name).replace("\\", "/")
    }

    dataset_folder_a = os.path.join(destination_folder, dataset_name)
    dataset_folder = os.path.join(destination_folder, dataset_name, "dataset")
    os.makedirs(dataset_folder_a, exist_ok=True)
    os.makedirs(dataset_folder, exist_ok=True)

    yolki_df = pd.read_csv(YOLKA_CSV)

    yolki_df['txt_exists'] = yolki_df['photo'].apply(lambda x: os.path.exists(os.path.join(os.path.dirname(__file__), "static", os.path.splitext(x)[0] + '.txt')))
    yolki_df_filtered = yolki_df[yolki_df['txt_exists']]

    if num_photos is not None:
        selected_photos = yolki_df_filtered.sample(n=num_photos, random_state=1)
    else:
        selected_photos = yolki_df_filtered

    for _, row in selected_photos.iterrows():
        photo_path = os.path.join(os.path.dirname(__file__), "static", row['photo'])
        shutil.copy(photo_path, dataset_folder)

        txt_file = os.path.splitext(row['photo'])[0] + '.txt'
        if os.path.exists(os.path.join(os.path.dirname(__file__), "static", txt_file)):
            shutil.copy(os.path.join(os.path.dirname(__file__), "static", txt_file), dataset_folder)

    split_and_save_dataset(dataset_folder, dataset_folder_a, test_size=val_size)

    datasets_df = pd.read_csv(DATASETS_CSV)
    new_dataset_df = pd.DataFrame([new_dataset])
    datasets_df = pd.concat([datasets_df, new_dataset_df], ignore_index=True)
    datasets_df.to_csv(DATASETS_CSV, index=False)

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

    if selected_dataset and class_name:
        dataset_folder = os.path.join('static', selected_dataset)
        classes_file_path = os.path.join(dataset_folder, 'classes.txt').replace("\\", "/")
        data_yaml_path = os.path.join(dataset_folder, 'data.yaml').replace("\\", "/")

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
    
    return '', 204 

@app.route('/create_train_script', methods=['POST'])
def create_train_script():
    try:
        imgsz = int(request.form['imgsz'])
        epochs = int(request.form['epochs'])
        batch = int(request.form['batch'])
        save_period = int(request.form['save_period'])
        selected_dataset = request.form['selected_dataset']

        if not selected_dataset.endswith(os.path.sep):
            selected_dataset += os.path.sep

        script_path = os.path.join('static', selected_dataset, 'train.py')
        abs_selected_dataset = os.path.abspath(selected_dataset)

        script_content = f"""import torch
import os
os.environ["KMP_DUPLICATE_LIB_OK"]="TRUE"

from ultralytics import YOLO

if __name__ == "__main__":
    model = YOLO('yolo11n.pt')
    results = model.train( 
        data='{(os.path.join(abs_selected_dataset, 'data.yaml')).replace("\\", "\\\\")}',   
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

    return '', 204 


@app.route('/record_result', methods=['POST'])
def record_result():
    print(request.form)
    
    selected_photo = request.form.get('fruits')
    result = int(request.form.get('result'))
    username = request.form.get('username')
    val_date = pd.Timestamp.now()

    if selected_photo is None or result is None or username is None:
        print("Данные не получены.")
        return '', 400 

    print(f"Получено фото: {selected_photo}, результат: {result}, пользователь: {username}")

    yolka_data = pd.read_csv(YOLKA_CSV)
    if selected_photo in yolka_data['photo'].values:
        yolka_data.loc[yolka_data['photo'] == selected_photo, 'val_result'] = int(result)
        yolka_data.loc[yolka_data['photo'] == selected_photo, 'photo_date'] = val_date
    else:
        next_index = yolka_data['id'].max() + 1 if not yolka_data.empty else 1
        new_entry = pd.DataFrame([[next_index, selected_photo, '', val_date, int(result)]], 
                                 columns=['id', 'photo', 'txt', 'photo_date', 'val_result'])
        yolka_data = yolka_data.append(new_entry, ignore_index=True)

    yolka_data.to_csv(YOLKA_CSV, index=False)

    existing_data = None
    next_index = 1
    try:
        existing_data = pd.read_csv(VAL_CSV)
        if 'id' in existing_data.columns and not existing_data['id'].isnull().all():
            next_index = existing_data['id'].max() + 1 
    except (FileNotFoundError, ValueError):
        next_index = 1 

    new_entry = pd.DataFrame([[next_index, username, selected_photo, val_date, result]], 
                             columns=['id', 'user', 'photo', 'val_date', 'result'])

    new_entry.to_csv(VAL_CSV, mode='a', header=(existing_data is None), index=False)

    return '', 204 
    
if __name__ == '__main__':
    app.run(debug=True)