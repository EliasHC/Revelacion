from datetime import datetime, timedelta
from flask import Flask, render_template
from flask_socketio import SocketIO
import threading

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='threading')

EVENT_TIME = datetime(2026, 7, 25, 16, 0, 0)
START_TIME = EVENT_TIME - timedelta(days=30)
REVEAL_GENDER = 'girl'

connected_clients = 0
background_thread = None
thread_lock = threading.Lock()
reveal_sent = False


def get_countdown_payload():
    now = datetime.now()
    remaining = int((EVENT_TIME - now).total_seconds())
    if remaining < 0:
        remaining = 0
    total_range = int((EVENT_TIME - START_TIME).total_seconds())
    elapsed = max(0, int((now - START_TIME).total_seconds()))
    progress = min(1.0, max(0.0, elapsed / total_range)) if total_range > 0 else 1.0
    return {
        'remaining_seconds': remaining,
        'days': remaining // 86400,
        'hours': (remaining % 86400) // 3600,
        'minutes': (remaining % 3600) // 60,
        'seconds': remaining % 60,
        'progress': progress,
        'is_final_window': remaining <= 600,
        'reveal_active': remaining == 0,
        'target_time': EVENT_TIME.isoformat(),
        'start_time': START_TIME.isoformat(),
        'server_time': now.isoformat()
    }


def countdown_loop():
    global reveal_sent
    while True:
        payload = get_countdown_payload()
        socketio.emit('countdown_update', payload, broadcast=True)
        if payload['remaining_seconds'] == 0 and not reveal_sent:
            reveal_sent = True
            socketio.emit('reveal_event', {'gender': REVEAL_GENDER}, broadcast=True)
        socketio.sleep(1)


@app.route('/')
def index():
    return render_template('invitacion.html', countdown=get_countdown_payload())


@socketio.on('connect')
def handle_connect():
    global connected_clients, background_thread
    with thread_lock:
        connected_clients += 1
        if background_thread is None:
            background_thread = socketio.start_background_task(countdown_loop)
    socketio.emit('presence_update', {'count': connected_clients}, broadcast=True)
    socketio.emit('countdown_update', get_countdown_payload())
    if reveal_sent:
        socketio.emit('reveal_event', {'gender': REVEAL_GENDER})


@socketio.on('disconnect')
def handle_disconnect():
    global connected_clients
    with thread_lock:
        connected_clients = max(0, connected_clients - 1)
    socketio.emit('presence_update', {'count': connected_clients}, broadcast=True)


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
