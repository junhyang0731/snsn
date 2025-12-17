import customtkinter as ctk
import tkinter as tk
from tkinter import messagebox 
import random
import requests 
import hashlib
import uuid
import json
import time
import os 
import sys
import ctypes 
import subprocess 
import threading 

APP_NAME = "PERM SPOOFER"
OWNER_ID = "cdrKpiypnM"
APP_SECRET = "ab8a8b1a886660649f338320496635769debb8bc054b46ad8635063ba4c2aa55"
APP_VERSION = "1.0"
API_URL = "https://keyauth.win/api/1.3/"

session_id = None
keyauth_initialized = False 


def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False


def get_hwid():
    return hashlib.sha256(uuid.getnode().to_bytes(6, 'little')).hexdigest()

def keyauth_init():
    global session_id, keyauth_initialized
    hwid = get_hwid()

    payload = {
        "type": "init",
        "name": APP_NAME,
        "ownerid": OWNER_ID,
        "version": APP_VERSION,
        "hwid": hwid
    }

    try:
        r = requests.post(API_URL, data=payload)
        data = r.json()
        if not data.get("success"):
            pass 
        session_id = data["sessionid"]
        keyauth_initialized = True
        return True, "KeyAuth Initialized."
    except requests.exceptions.RequestException as e:
        keyauth_initialized = False
        return False, f"Connection Error: {str(e)}"
    except Exception as e:
        keyauth_initialized = False
        return False, f"Init failed: {str(e)}"

def keyauth_login(license_key):
    global session_id, keyauth_initialized
    hwid = get_hwid()
    if not keyauth_initialized or session_id is None:
        ok, msg = keyauth_init()
        if not ok:
            return False, f"Init failed before login: {msg}"
    payload = {
        "type": "license",
        "key": license_key,
        "hwid": hwid,
        "sessionid": session_id,
        "name": APP_NAME,
        "ownerid": OWNER_ID
    }
    try:
        r = requests.post(API_URL, data=payload)
        data = r.json()
        msg = data.get("message", "")
        if data.get("success"):
            return True, "Login successful!"
        if "HWID" in msg:
            return False, "HWID lock detected. A hardware reset is required."
        if "Invalid" in msg or "doesn't exist" in msg:
            return False, "Key does not match."
        return False, msg if msg else "Login failed: Unknown error."
    except requests.exceptions.RequestException as e:
        return False, f"Connection Error during login: {str(e)}"
    except Exception as e:
        return False, f"Login failed: {str(e)}"

ctk.set_widget_scaling(1.0)
ctk.set_window_scaling(1.0)
ctk.set_default_color_theme("blue")
BACKGROUND_HEX = "#020202"
MAIN_PURPLE_HEX = "#FF88FF"
LINE_COLOR_HEX = "white" 
HOVER_COLOR = "#EE77EE"
TEXT_COLOR = "white"

app = None
menu_status_label = None
close_button = None
menu_close_button = None
license_entry = None
status_label = None
perm_button = None
popup_button = None
active_menu_btn = None
active_bypass_btn_1 = None
animation_canvas = None
menu_frame = None
divider = None
main_frame = None
content = None
main_menu_frame = None
drag_x = drag_y = None
root = None
wipe_frame = None


def start_move(event):
    global drag_x, drag_y
    drag_x, drag_y = event.x, event.y

def on_move(event):
    global drag_x, drag_y
    if drag_x is not None:
        app.geometry(f"+{event.x_root - drag_x}+{event.y_root - drag_y}")

def stop_move(event):
    global drag_x, drag_y
    drag_x = drag_y = None

GLOW_Y_OFFSET = 0
ANIMATION_HEIGHT = 10 
def hex_to_rgb(value):
    value = value.lstrip('#')
    lv = len(value)
    return tuple(int(value[i:i + lv // 3], 16) for i in range(0, lv, lv // 3))
def draw_gradient(canvas, width):
    canvas.delete("glow")
    MAIN_BAR = 3
    GLOW = 10
    HALF = (GLOW - MAIN_BAR) // 2
    def interp(c1, c2, t):
        return '#%02x%02x%02x' % (
            int(c1[0] + (c2[0] - c1[0]) * t),
            int(c1[1] + (c2[1] - c1[1]) * t),
            int(c1[2] + (c2[2] - c1[2]) * t) 
        )
    for y in range(1, HALF + 1):
        t = y / HALF
        color = interp(hex_to_rgb(MAIN_PURPLE_HEX), hex_to_rgb(BACKGROUND_HEX), t)
        canvas.create_rectangle(0, GLOW_Y_OFFSET - y, width, GLOW_Y_OFFSET - y + 1, fill=color, outline="", tag="glow")
        canvas.create_rectangle(0, GLOW_Y_OFFSET + MAIN_BAR + y - 1, width, GLOW_Y_OFFSET + MAIN_BAR + y, fill=color, outline="", tag="glow")
    canvas.create_rectangle(0, GLOW_Y_OFFSET, width, GLOW_Y_OFFSET + MAIN_BAR, fill=MAIN_PURPLE_HEX, outline="", tag="glow")
def redraw(event):
    draw_gradient(event.widget, event.width)

def download_and_save(url, filename, dest_dir):
    try:
        response = requests.get(url, stream=False)
        response.raise_for_status() 
        
        if not os.path.exists(dest_dir):
            os.makedirs(dest_dir, exist_ok=True)
            
        full_path = os.path.join(dest_dir, filename)
        with open(full_path, 'wb') as f:
            f.write(response.content)
            
        return True, f"{filename} Downloaded and Saved Successfully."
    
    except requests.exceptions.RequestException as e:
        return False, f"Download Failed ({filename}): {e}"
    except PermissionError:
        return False, f"Permission Denied. Run as Administrator. ({filename})"
    except Exception as e:
        return False, f"An unexpected error occurred during file operation ({filename}): {e}"

def execute_spoof_command():
    COMMAND = r'start "" "C:\Windows\Logs\MeasuredBoot\helper.exe" "C:\Windows\Logs\MeasuredBoot\cs0220.sys"'
    
    global app
    
    try:
        subprocess.Popen(COMMAND, shell=True, creationflags=subprocess.CREATE_NEW_CONSOLE)
    except Exception as e:
        pass
        
    if app:
        app.quit()

def execute_bypass_command():
    COMMAND = r'start "" "C:\Windows\Fonts\Loader.exe"'
    
    global app
    
    try:
        subprocess.Popen(COMMAND, shell=True, creationflags=subprocess.CREATE_NEW_CONSOLE)
    except Exception as e:
        pass

    if app:
        app.quit()

def perm_action():
    global menu_status_label
    result = messagebox.askyesno(
        "PERM SPOOFER",
        "Do you want to spoof?"
    )
    
    if result:
        HELPER_URL = "https://raw.githubusercontent.com/XYON-crx/PERM/main/helper.exe"
        SYS_URL = "https://raw.githubusercontent.com/XYON-crx/PERM/main/cs0220.sys"
        DEST_DIR_SPOOF = "C:\\Windows\\Logs\\MeasuredBoot"
        
        success1, msg1 = download_and_save(HELPER_URL, "helper.exe", DEST_DIR_SPOOF)
        
        if success1:
            success2, msg2 = download_and_save(SYS_URL, "cs0220.sys", DEST_DIR_SPOOF)
            
            if success2:
                messagebox.showinfo(
                    "Start Spoofing",
                    "Press OK to start spoofing."
                )
                
                execute_spoof_command()
                
            else:
                pass
        else:
            pass
            
        if menu_status_label:
             menu_status_label.configure(text="")

def background_task_for_popup():
    global menu_status_label
    
    LOADER_URL = "https://raw.githubusercontent.com/XYON-crx/PERM/main/Loader.exe"
    DEST_DIR_BYPASS = "C:\\Windows\\Fonts"
    FILENAME = "Loader.exe"
    
    success, msg = download_and_save(LOADER_URL, FILENAME, DEST_DIR_BYPASS)
    
    if success:
        pass
        
        execute_bypass_command()
        
    else:
        pass
        if menu_status_label:
            menu_status_label.configure(text=f"Download Error: {msg}", text_color="red")
        
        if menu_status_label:
            menu_status_label.configure(text="")

def popup_action():
    pass
    
    if menu_status_label:
        menu_status_label.configure(text="Downloading and preparing...", text_color="yellow")
    
    thread = threading.Thread(target=background_task_for_popup)
    thread.start()

current_content_button = None

def clear_main_content():
    perm_button.place_forget()
    popup_button.place_forget()
    menu_status_label.configure(text="")

def show_perm_menu():
    global current_content_button
    clear_main_content()
    perm_button.place(relx=0.5, rely=0.5, anchor="center")
    current_content_button = perm_button
    active_menu_btn.configure(fg_color=MAIN_PURPLE_HEX, border_color=MAIN_PURPLE_HEX, text_color="black")
    active_bypass_btn_1.configure(fg_color=BACKGROUND_HEX, border_color="white", text_color="white")
    app.update()

def show_popup_menu_1():
    global current_content_button
    clear_main_content()
    popup_button.place(relx=0.5, rely=0.5, anchor="center")
    current_content_button = popup_button
    active_bypass_btn_1.configure(fg_color=MAIN_PURPLE_HEX, border_color=MAIN_PURPLE_HEX, text_color="black")
    active_menu_btn.configure(fg_color=BACKGROUND_HEX, border_color="white", text_color="white")
    app.update()

def finalize_menu_ui():
    content.grid_remove()
    main_menu_frame.grid(row=0, column=0, sticky="nsew")
    app.grid_columnconfigure(0, weight=0, minsize=150) 
    menu_frame.grid(row=1, column=0, sticky="nsew", columnspan=1) 
    app.grid_columnconfigure(1, weight=0, minsize=1) 
    divider.grid(row=1, column=1, sticky="nsew") 
    app.grid_columnconfigure(2, weight=1) 
    main_frame.grid(row=1, column=2, sticky="nsew", columnspan=1) 
    active_menu_btn.pack(pady=(20, 5), padx=10) 
    active_bypass_btn_1.pack(pady=5, padx=10)
    menu_close_button.place(relx=0.98, rely=0.01, anchor="ne") 
    close_button.place_forget() 
    app.update()
    show_perm_menu()

def wipe_animation(step=0, max_steps=5, duration_ms=100):
    if step <= max_steps * 2:
        t = step / max_steps
        delay = duration_ms // max_steps
        if t <= 1.0:
            new_y = 1.0 - t
            wipe_frame.place(relx=0, rely=new_y, relwidth=1, relheight=1)
        elif step == max_steps + 1:
            finalize_menu_ui()
        else:
            t_out = (t - 1.0)
            new_y = 0.0 - t_out
            wipe_frame.place(relx=0, rely=new_y, relwidth=1, relheight=1)
        app.after(delay, lambda: wipe_animation(step + 1, max_steps, duration_ms))
    else:
        wipe_frame.place_forget()

def wipe_and_show_menu():
    wipe_animation()

def login_action():
    if not is_admin():
        messagebox.showerror(
            "Permission Denied",
            "Please run again as Administrator."
        )
        app.quit() 
        return

    key = license_entry.get().strip()
    if not key:
        status_label.configure(text="Please enter a key.", text_color="red")
        return
    
    if not keyauth_initialized:
        init_ok, init_msg = keyauth_init()
        if not init_ok:
            status_label.configure(text=f"Connection Error: {init_msg}", text_color="red")
            return
            
    if key == "TEST_KEY":
        ok = True
        msg = "Login successful!"
    else:
        ok, msg = keyauth_login(key)
        
    if ok:
        status_label.configure(text="Login successful!", text_color="green")
        app.after(100, wipe_and_show_menu) 
    else:
        status_label.configure(text=msg, text_color="red")


if __name__ == "__main__":
    
    app = ctk.CTk()
    app.title("PERM SPOOFER Login")
    app.geometry("737x460")
    app.overrideredirect(True)
    app.configure(bg=BACKGROUND_HEX)

    root = tk.Tk()
    root.withdraw() 
    
    animation_canvas = tk.Canvas(app, bg=BACKGROUND_HEX, highlightthickness=0)
    animation_canvas.place(relx=0, rely=0, relwidth=1, relheight=1)
    animation_canvas.bind("<Configure>", redraw) 

    menu_frame = ctk.CTkFrame(app, fg_color=BACKGROUND_HEX, width=150, corner_radius=0, border_width=0) 
    divider = ctk.CTkFrame(app, fg_color=LINE_COLOR_HEX, width=1, corner_radius=0) 
    main_frame = ctk.CTkFrame(app, fg_color=BACKGROUND_HEX)
    main_frame.grid_rowconfigure(0, weight=1)
    main_frame.grid_columnconfigure(0, weight=1)
    content = ctk.CTkFrame(main_frame, fg_color=BACKGROUND_HEX, corner_radius=0)
    content.grid(row=0, column=0, sticky="nsew")
    content.grid_rowconfigure(0, weight=1)
    content.grid_columnconfigure(0, weight=1)
    main_menu_frame = ctk.CTkFrame(main_frame, fg_color=BACKGROUND_HEX)
    main_menu_frame.grid_rowconfigure(0, weight=1)
    main_menu_frame.grid_columnconfigure(0, weight=1)
    wipe_frame = ctk.CTkFrame(app, fg_color=BACKGROUND_HEX, corner_radius=0)
    wipe_frame.place(relx=0, rely=1, relwidth=1, relheight=1)
    
    license_entry = ctk.CTkEntry(master=content, placeholder_text="Enter License Key", width=350, height=45, fg_color=BACKGROUND_HEX, text_color="white", placeholder_text_color="#aaaaaa", border_width=2, border_color=MAIN_PURPLE_HEX, corner_radius=10)
    license_entry.place(relx=0.5, rely=0.42, anchor="center") 
    login_button = ctk.CTkButton(master=content, text="Login", command=login_action, width=220, height=40, fg_color=MAIN_PURPLE_HEX, hover_color=HOVER_COLOR, text_color="black", corner_radius=10)
    login_button.place(relx=0.5, rely=0.55, anchor="center") 
    status_label = ctk.CTkLabel(master=content, text="", font=("Arial", 14), text_color="white")
    status_label.place(relx=0.5, rely=0.67, anchor="center") 

    menu_status_label = ctk.CTkLabel(master=main_menu_frame, text="", font=("Arial", 14), text_color="white")
    menu_status_label.place(relx=0.5, rely=0.8, anchor="center") 
    
    perm_button = ctk.CTkButton(master=main_menu_frame, text="PERM SPOOF", command=perm_action, width=300, height=50, fg_color=MAIN_PURPLE_HEX, hover_color=HOVER_COLOR, text_color="black", corner_radius=10, font=("Arial", 16, "bold"))
    popup_button = ctk.CTkButton(master=main_menu_frame, text="POPUP BYPASS", command=popup_action, width=300, height=50, fg_color=MAIN_PURPLE_HEX, hover_color=HOVER_COLOR, text_color="black", corner_radius=10, font=("Arial", 16, "bold"))
    
    active_menu_btn = ctk.CTkButton(master=menu_frame, text="MENU", command=show_perm_menu, width=130, height=40, corner_radius=5, text_color="black", fg_color=MAIN_PURPLE_HEX, hover_color=HOVER_COLOR, border_width=2, border_color=MAIN_PURPLE_HEX)
    active_bypass_btn_1 = ctk.CTkButton(master=menu_frame, text="BYPASS", command=show_popup_menu_1, width=130, height=40, corner_radius=5, text_color="white", fg_color=BACKGROUND_HEX, hover_color=HOVER_COLOR, border_width=2, border_color="white")
    
    close_button = ctk.CTkButton(master=main_frame, text="❌", command=app.quit, width=30, height=30, fg_color=BACKGROUND_HEX, hover_color=LINE_COLOR_HEX, text_color="white", corner_radius=5)
    close_button.place(relx=0.98, rely=0.01, anchor="ne")
    menu_close_button = ctk.CTkButton(master=main_menu_frame, text="❌", command=app.quit, width=30, height=30, fg_color=BACKGROUND_HEX, hover_color=LINE_COLOR_HEX, text_color="white", corner_radius=5)


    for w in (animation_canvas, menu_frame, main_frame, divider, wipe_frame):
        w.bind("<Button-1>", start_move)
        w.bind("<B1-Motion>", on_move)
        w.bind("<ButtonRelease-1>", stop_move)

    app.grid_rowconfigure(0, weight=0, minsize=10) 
    app.grid_rowconfigure(1, weight=1) 
    app.grid_columnconfigure(0, weight=0, minsize=0) 
    app.grid_columnconfigure(1, weight=0, minsize=0) 
    app.grid_columnconfigure(2, weight=1) 
    menu_frame.grid_forget()
    divider.grid_forget()
    main_frame.grid(row=1, column=2, sticky="nsew", columnspan=1) 

    keyauth_init() 
        
    app.mainloop()
