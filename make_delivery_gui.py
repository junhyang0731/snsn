import os
import zipfile
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import json

# ---------------------------------------------------------
# 설정: 데이터 저장 파일
# ---------------------------------------------------------
CONFIG_FILE = "delivery_config.json"

# ---------------------------------------------------------
# 설정: readme.txt 템플릿
# ---------------------------------------------------------
TEMPLATE = """안녕하십니까? snacksnake (구 XYON)입니다. 저희 상품을 구매해 주셔서 진심으로 감사드립니다.
2025년 12월 중순자로 디스코드에서 운영하던 XYON이 snacksnake (snsn.shop)로 전환되었음을 알려드립니다.

--상품 내역 안내--
귀하의 구매 상품: {product_name}
구매 상품의 총 가격: {price}
구매 상품 보유 가능 기간: {duration}
인증키: {license_key}
구매 인증: {purchase_id}
위 내역 중 알맞지 않은 내용이 있다면 즉시 support@snsn.shop로 연락 주시기 바랍니다.

--상품 사용방법--
동봉된 key_insert.exe에 위에 써있는 "인증키"를 입력하십시오. 인증키는 그 누구와도 공유해서는 안되며 이미 등록된 상태에서 또 다시 입력할 시 원래 계정에서도 사용할 수 없습니다.
인증키를 입력한 후 원하는 치트를 선택한 후 execute를 누르십시오. 이 과정에서 프로그램이 잠시 비활성화 될 수 있으나 정상 상태입니다.

--이 외 상품 안내사항--
- 상품을 2개 이상의 계정 또는 PC에서 등록하려고 시도하는 경우 인증키는 즉시 비활성화되며 다시 복구할 수 없습니다. 
- 상품을 영구제가 아닌 기간제로 구매하셨을 경우 연장은 불가하며 새로운 인증키를 구입하셔야 합니다.
- 인증키가 동작하지 않는 경우 support@snsn.shop로 연락 주시기 바랍니다.
- 구매 이후에 환불은 불가합니다.
"""

class DeliveryMakerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("SnackSnake 배포 생성기 v2.0")
        self.root.geometry("550x650")
        self.root.resizable(False, False)
        
        # 설정 로드
        self.load_config()

        # Style
        style = ttk.Style()
        style.configure("TLabel", font=("Malgun Gothic", 10))
        style.configure("TButton", font=("Malgun Gothic", 10, "bold"))
        style.configure("Header.TLabel", font=("Malgun Gothic", 16, "bold"), foreground="#4F46E5")

        # Header
        header = ttk.Label(root, text="📦 배포 파일 생성기", style="Header.TLabel")
        header.pack(pady=15)

        # Form Frame
        form_frame = ttk.Frame(root, padding=20)
        form_frame.pack(fill="both", expand=True)

        # 1. 저장 위치 설정
        dir_frame = ttk.LabelFrame(form_frame, text=" 저장 위치 ", padding=10)
        dir_frame.pack(fill="x", pady=5)
        
        self.dir_var = tk.StringVar(value=self.save_dir)
        ttk.Label(dir_frame, textvariable=self.dir_var, foreground="blue", wraplength=400).pack(side="left", fill="x", expand=True)
        ttk.Button(dir_frame, text="변경", width=6, command=self.change_save_dir).pack(side="right")

        # 2. 입력 필드
        input_frame = ttk.LabelFrame(form_frame, text=" 상품 정보 ", padding=10)
        input_frame.pack(fill="x", pady=10)

        self.entries = {}
        fields = [
            ("상품명", "product_name", "예: Valorant ESP"),
            ("가격", "price", "예: 15,000원"),
            ("기간", "duration", "예: 30일 / 영구제"),
            ("인증키", "license_key", "Key 값 입력"),
            ("구매 인증번호", "purchase_id", "Purchase ID (선택)")
        ]

        for i, (label_text, key, placeholder) in enumerate(fields):
            lbl = ttk.Label(input_frame, text=label_text)
            lbl.grid(row=i, column=0, sticky="w", pady=5)
            
            entry = ttk.Entry(input_frame, width=35)
            entry.grid(row=i, column=1, sticky="e", pady=5)
            # Bind text change to update filename
            entry.bind("<KeyRelease>", self.update_filename_preview)
            self.entries[key] = entry

        # 3. 파일 선택
        exe_frame = ttk.Frame(form_frame)
        exe_frame.pack(fill="x", pady=5)
        
        self.exe_path_var = tk.StringVar(value="key_insert.exe")
        ttk.Label(exe_frame, text="실행 파일:").pack(side="left")
        self.exe_lbl = ttk.Label(exe_frame, textvariable=self.exe_path_var, foreground="gray")
        self.exe_lbl.pack(side="left", padx=5)
        ttk.Button(exe_frame, text=" exe 선택 ", command=self.select_file).pack(side="right")

        # 4. 파일명 설정 (New)
        name_frame = ttk.LabelFrame(form_frame, text=" 생성될 파일 이름 ", padding=10)
        name_frame.pack(fill="x", pady=10)
        
        self.filename_entry = ttk.Entry(name_frame, width=50)
        self.filename_entry.pack(fill="x")
        self.filename_entry.insert(0, "Delivery_Product_Key.zip")

        # Generate Button
        btn_frame = ttk.Frame(root, padding=20)
        btn_frame.pack(fill="x", side="bottom")
        
        generate_btn = ttk.Button(btn_frame, text="✨ ZIP 파일 생성하기", command=self.generate)
        generate_btn.pack(fill="x", ipady=10)

    def load_config(self):
        self.save_dir = os.getcwd()
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.save_dir = data.get("save_dir", os.getcwd())
            except:
                pass

    def save_config(self):
        try:
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump({"save_dir": self.save_dir}, f, ensure_ascii=False)
        except Exception as e:
            print(f"Config Save Failed: {e}")

    def change_save_dir(self):
        path = filedialog.askdirectory(title="저장할 폴더 선택")
        if path:
            self.save_dir = path
            self.dir_var.set(path)
            self.save_config()

    def select_file(self):
        filename = filedialog.askopenfilename(
            title="배포할 실행 파일 선택",
            filetypes=[("Executable", "*.exe"), ("All Files", "*.*")]
        )
        if filename:
            self.exe_path_var.set(filename)

    def update_filename_preview(self, event=None):
        # Auto-update filename based on input
        p_name = self.entries["product_name"].get().strip()
        p_key = self.entries["license_key"].get().strip()
        
        safe_name = "".join([c for c in p_name if c.isalnum() or c in (' ', '-', '_')]).strip().replace(" ", "_")
        safe_key = "".join([c for c in p_key if c.isalnum()]).strip()
        
        if not safe_name: safe_name = "Product"
        if not safe_key: safe_key = "Key"
        
        new_name = f"Delivery_{safe_name}_{safe_key}.zip"
        
        self.filename_entry.delete(0, tk.END)
        self.filename_entry.insert(0, new_name)

    def generate(self):
        # Get Values
        data = {key: entry.get().strip() for key, entry in self.entries.items()}
        target_filename = self.filename_entry.get().strip()
        
        if not target_filename.lower().endswith(".zip"):
            target_filename += ".zip"

        # Validation
        if not data["product_name"] or not data["price"] or not data["license_key"]:
            messagebox.showwarning("입력 오류", "필수 항목(상품명, 가격, 인증키)을 모두 입력해주세요.")
            return

        if not data["purchase_id"]:
            data["purchase_id"] = "N/A"

        # Create Readme Content
        readme_content = TEMPLATE.format(**data)
        
        exe_source = self.exe_path_var.get()
        full_output_path = os.path.join(self.save_dir, target_filename)

        # Check EXE existence
        if not os.path.exists(exe_source):
             if exe_source == "key_insert.exe": # Auto create dummy
                with open("key_insert.exe", "wb") as f:
                    f.write(b"Dummy EXE Content")
             else:
                 messagebox.showerror("오류", f"실행 파일이 없습니다:\n{exe_source}")
                 return

        try:
            with zipfile.ZipFile(full_output_path, 'w') as zf:
                # 1. key_insert.exe (기본 권한)
                zf.write(exe_source, "key_insert.exe")
                
                # 2. readme.txt (읽기 전용 권한 설정)
                # ZIP 내부 파일 속성을 'Read-Only'로 강제 설정하여 수정을 방지합니다.
                zinfo = zipfile.ZipInfo("readme.txt")
                zinfo.date_time = datetime.datetime.now().timetuple()[:6]
                zinfo.compress_type = zipfile.ZIP_DEFLATED
                # 리눅스/유닉스 기준 0o444 (r--r--r--), 윈도우에서도 읽기 전용으로 풀림
                zinfo.external_attr = 0o444 << 16 
                zf.writestr(zinfo, readme_content)
            
            messagebox.showinfo("성공", f"파일이 생성되었습니다!\n(readme.txt는 수정 불가능하게 설정됨)\n\n📂 {full_output_path}")
            
            # Clear critical fields
            self.entries["license_key"].delete(0, tk.END)
            self.entries["purchase_id"].delete(0, tk.END)

        except Exception as e:
            messagebox.showerror("오류", f"생성 중 문제가 발생했습니다:\n{e}")

if __name__ == "__main__":
    root = tk.Tk()
    app = DeliveryMakerApp(root)
    root.mainloop()
