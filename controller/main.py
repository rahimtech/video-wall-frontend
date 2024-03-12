import cv2
from screeninfo import get_monitors

def play_video(video_path, window_name="سلام"):
    # Get screen size
    monitor = get_monitors()[0]
    screen_width = monitor.width
    screen_height = monitor.height

    # Create a named window
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.moveWindow(window_name, +screen_width, 10)

    # Set the window to fullscreen
    cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

    # Open the video file
    cap = cv2.VideoCapture(video_path)

    while True:
        # Read the next frame from the video
        ret, frame = cap.read()

        # If the frame was not read successfully, break the loop
        if not ret:
            break

        # Resize the frame
        frame = cv2.resize(frame, (screen_width, screen_height))

        # Display the frame
        cv2.imshow(window_name, frame)

        # Exit on 'q' key press
        if cv2.waitKey(33) & 0xFF == ord('q'):
            break

    # Release the capture and destroy all windows
    cap.release()
    cv2.destroyAllWindows()

print("-------------------- Full Screen Video --------------------")
play_video('./video.mp4')
