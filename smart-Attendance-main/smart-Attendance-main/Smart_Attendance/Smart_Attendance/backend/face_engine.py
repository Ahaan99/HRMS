import face_recognition
import numpy as np
import cv2
import base64
import pickle
import os
from database import employees_col

ENCODINGS_FILE = "encodings_cache.pkl"

_HAAR = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


def _detect_locs(rgb):
    """
    Robust face detection. Tries progressively harder methods:
    1. HOG (fast)
    2. HOG with 2x upsampling (small/distant faces)
    3. CLAHE contrast-enhanced HOG (bad/uneven lighting)
    4. OpenCV Haar cascade fallback (tilted faces, low angles)
    Returns list of (top, right, bottom, left) boxes.
    """
    # 1. plain HOG
    locs = face_recognition.face_locations(rgb, model="hog")
    if locs:
        return locs, rgb

    # 2. upsample: helps when the face is small in the frame
    locs = face_recognition.face_locations(rgb, number_of_times_to_upsample=2, model="hog")
    if locs:
        return locs, rgb

    # 3. improve contrast (CLAHE) for poor / uneven lighting
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = cv2.cvtColor(cv2.merge((clahe.apply(l), a, b)), cv2.COLOR_LAB2RGB)
    locs = face_recognition.face_locations(enhanced, number_of_times_to_upsample=1, model="hog")
    if locs:
        return locs, enhanced

    # 4. Haar cascade — more tolerant of tilt/angle than HOG
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    gray = clahe.apply(gray)
    boxes = _HAAR.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4,
                                   minSize=(60, 60))
    if len(boxes) > 0:
        locs = [(int(y), int(x + w), int(y + h), int(x)) for (x, y, w, h) in boxes]
        return locs, rgb

    return [], rgb


def _load_known():
    """Load all face encodings from MongoDB."""
    docs = list(employees_col.find({}, {"emp_id": 1, "name": 1, "encoding": 1}))
    known_encs  = []
    known_names = []
    known_ids   = []
    for d in docs:
        enc = d.get("encoding")
        if enc:
            known_encs.append(np.array(enc))
            known_names.append(d["name"])
            known_ids.append(d["emp_id"])
    return known_encs, known_names, known_ids


def encode_face_from_b64(image_b64: str):
    """
    Accept base64 image from browser webcam.
    Returns (encoding_list, error_string)
    encoding_list is None on failure.
    """
    try:
        img_bytes = base64.b64decode(image_b64.split(",")[-1])
        np_arr    = np.frombuffer(img_bytes, np.uint8)
        frame     = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        rgb       = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        locs, rgb = _detect_locs(rgb)
        if not locs:
            return None, "Please see properly on camera"
        encs = face_recognition.face_encodings(rgb, locs)
        if not encs:
            return None, "Face encoding fail — Try again"
        return encs[0].tolist(), None
    except Exception as e:
        return None, str(e)


def recognize_face_from_b64(image_b64: str, tolerance: float = 0.5):
    """
    Match face from b64 image against all registered employees.
    Returns list of dicts: [{emp_id, name, distance}]
    """
    try:
        img_bytes = base64.b64decode(image_b64.split(",")[-1])
        np_arr    = np.frombuffer(img_bytes, np.uint8)
        frame     = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        rgb       = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        locs, rgb = _detect_locs(rgb)
        encs = face_recognition.face_encodings(rgb, locs)

        known_encs, known_names, known_ids = _load_known()
        results = []

        for enc in encs:
            if not known_encs:
                results.append({"emp_id": "Unknown", "name": "Unknown", "distance": 1.0})
                continue
            dists = face_recognition.face_distance(known_encs, enc)
            best  = int(np.argmin(dists))
            if dists[best] < tolerance:
                results.append({
                    "emp_id":   known_ids[best],
                    "name":     known_names[best],
                    "distance": float(dists[best])
                })
            else:
                results.append({"emp_id": "Unknown", "name": "Unknown", "distance": float(dists[best])})

        return results, None
    except Exception as e:
        return [], str(e)
