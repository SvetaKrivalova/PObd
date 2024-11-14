import os
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

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
    return render_template('index.html', yolki=yolki, filenames=filenames)

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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)