"""Shared constants for the film test tools. No art lives here."""
import os

BAKE_ROOT = os.environ.get('FILMTEST_ROOT', '/home/user/bakeoff')
BLENDER = os.environ.get('FILMTEST_BLENDER', '/home/user/tools/blender-5.2.5-linux-x64/blender')
BLENDER_VERSION = '5.2.5'

RES = os.environ.get('FILMTEST_RES', '1280x720')
FPS = 24
FRAMES = 720

TEST_BUDGET_S = 9000        # 2 h 30 min of Blender time for test pictures
GATE_BUDGET_S = 2700        # 45 min of Blender time for speed checks
GATE_MAX_ATTEMPTS = 3
FINAL_CAP_S = 21600         # 6 h: the most the finished film may take to draw on this machine
GATE_PASS_S = 19440         # 5 h 24 min: the speed check passes at or under this prediction
DEFAULT_MAX_SECONDS = 1200  # one Blender call is stopped after this unless --max-seconds says otherwise

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
SHOTS_FILE = os.path.join(REPO, 'docs', 'film', 'bakeoff', 'shots.json')
ENTRY = os.path.join(REPO, 'src', 'studio3d', 'bakeoff', 'entry')
