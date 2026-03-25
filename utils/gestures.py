def fingers_up(hand_landmarks, width, height):
    """
    Return finger states as a dict:
    {thumb, index, middle, ring, pinky} -> True if finger is extended.

    This uses landmark geometry in pixel coordinates.
    """
    lm = hand_landmarks.landmark
    pts = [(int(p.x * width), int(p.y * height)) for p in lm]

    # Thumb detection is approximate and depends on camera orientation.
    thumb_up = pts[4][0] < pts[3][0]

    index_up = pts[8][1] < pts[6][1]
    middle_up = pts[12][1] < pts[10][1]
    ring_up = pts[16][1] < pts[14][1]
    pinky_up = pts[20][1] < pts[18][1]

    return {
        "thumb": thumb_up,
        "index": index_up,
        "middle": middle_up,
        "ring": ring_up,
        "pinky": pinky_up,
    }


def is_fist(finger_state):
    """
    Simple fist detection:
    fist if all non-thumb fingers are folded.
    """
    return (
        not finger_state["index"]
        and not finger_state["middle"]
        and not finger_state["ring"]
        and not finger_state["pinky"]
    )


def get_mode(finger_state):
    """
    Resolve drawing mode from finger state.

    Returns one of: clear, draw, erase, move
    """
    if is_fist(finger_state):
        return "clear"

    draw_mode = finger_state["index"] and not finger_state["middle"]
    erase_mode = finger_state["index"] and finger_state["middle"]

    if draw_mode:
        return "draw"
    if erase_mode:
        return "erase"
    return "move"
