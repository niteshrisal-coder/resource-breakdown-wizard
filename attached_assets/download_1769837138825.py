import os
import re
import requests
import tkinter as tk
from tkinter import scrolledtext, ttk
import pdfplumber
from PyPDF2 import PdfMerger
import warnings
import threading
import time

warnings.filterwarnings("ignore", message="Unverified HTTPS request")


def clean_filename(name):
    name = name.strip()
    name = re.sub(r'[\\/:"*?<>|]+', '_', name)
    name = name.replace('\n', ' ').replace('\r', ' ').strip()
    return name


def extract_download_info(pdf_path):
    download_info = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if not table or len(table) < 2:
                    continue
                headers = table[0]
                headers_lower = [h.lower() if h else "" for h in headers]

                if "sl. no" in headers_lower and ("download link" in headers_lower or "click here" in headers_lower):
                    try:
                        name_idx = headers_lower.index("name")
                    except ValueError:
                        name_idx = 1
                    link_idx = headers_lower.index("download link") if "download link" in headers_lower else headers_lower.index("click here")
                    for row in table[1:]:
                        if len(row) <= max(name_idx, link_idx):
                            continue
                        name = row[name_idx] or "unnamed_file"
                        raw_link = (row[link_idx] or "").replace('\n', '').replace('\r', '').strip().replace(' ', '')
                        if raw_link.startswith("http"):
                            download_info.append((clean_filename(name), raw_link))
    return download_info


def download_files(download_info, save_folder, log_callback, progress_callback):
    if not os.path.exists(save_folder):
        os.makedirs(save_folder)

    session = requests.Session()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "application/pdf,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://bolpatra.gov.np/",
    }

    total = len(download_info)
    for i, (name, url) in enumerate(download_info, 1):
        try:
            filename = clean_filename(name)
            full_path = os.path.join(save_folder, f"{filename}.pdf")
            base, ext = os.path.splitext(full_path)
            count = 1
            while os.path.exists(full_path):
                full_path = f"{base}({count}){ext}"
                count += 1

            log_callback(f"📥 Downloading {i}/{total}: {filename}")
            resp = session.get(url, headers=headers, stream=True, verify=False, timeout=40, allow_redirects=True)
            resp.raise_for_status()

            content_type = resp.headers.get("Content-Type", "").lower()
            if "pdf" not in content_type:
                log_callback(f"⚠️ Skipping {name}: Content-Type is not PDF but {content_type}")
                progress_callback(i, total)
                continue

            with open(full_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            size_kb = os.path.getsize(full_path) // 1024
            log_callback(f"✅ {i}/{total} Downloaded: {os.path.basename(full_path)} ({size_kb} KB)")

        except Exception as e:
            log_callback(f"❌ {i}/{total} Failed: {name} — {e}")

        progress_callback(i, total)
        time.sleep(0.5)  # Optional


def merge_all_pdfs_in_folder(folder, merged_name, log_callback):
    merger = PdfMerger()
    pdf_files = sorted([f for f in os.listdir(folder) if f.lower().endswith(".pdf") and not f.startswith("0_")])
    if not pdf_files:
        log_callback("⚠️ No PDFs found to merge.")
        return

    for f in pdf_files:
        try:
            merger.append(os.path.join(folder, f))
        except Exception as e:
            log_callback(f"❌ Failed to merge: {f} — {e}")

    merged_path = os.path.join(folder, f"0_{merged_name}.pdf")
    merger.write(merged_path)
    merger.close()
    log_callback(f"📎 Merged as: 0_{merged_name}.pdf")


class PDFDownloaderGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("📥 Bidder Document Downloader + Merger")
        self.root.geometry("780x640")

        # Progress bar and elapsed time
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(root, maximum=100, variable=self.progress_var)
        self.progress_bar.pack(fill="x", padx=10, pady=(10, 2))
        self.progress_bar.config(length=600, mode='determinate')

        self.time_label = tk.Label(root, text="Elapsed Time: 00:00:00")
        self.time_label.pack(pady=(0, 10))

        tk.Label(root, text="Paste PDF paths (one per line):").pack(pady=5)

        self.text_input = scrolledtext.ScrolledText(root, height=6)
        self.text_input.pack(fill="x", padx=10, pady=5)

        tk.Button(root, text="Start Download", command=self.process_pdfs).pack(pady=10)

        self.log_output = scrolledtext.ScrolledText(root, height=25, state="disabled")
        self.log_output.pack(fill="both", expand=True, padx=10, pady=5)

        self._start_time = None
        self._stop_timer = False

    def log(self, message):
        self.log_output.configure(state="normal")
        self.log_output.insert(tk.END, message + "\n")
        self.log_output.yview(tk.END)
        self.log_output.configure(state="disabled")
        self.root.update_idletasks()

    def update_progress(self, current, total):
        percent = (current / total) * 100
        self.progress_var.set(percent)

    def _update_timer(self):
        if not self._stop_timer and self._start_time is not None:
            elapsed = int(time.time() - self._start_time)
            hrs, rem = divmod(elapsed, 3600)
            mins, secs = divmod(rem, 60)
            self.time_label.config(text=f"Elapsed Time: {hrs:02}:{mins:02}:{secs:02}")
            self.root.after(1000, self._update_timer)

    def process_pdfs(self):
        self.progress_var.set(0)
        self._stop_timer = False
        self._start_time = time.time()
        self._update_timer()
        threading.Thread(target=self._download_and_merge, daemon=True).start()

    def _download_and_merge(self):
        pdf_paths = self.text_input.get("1.0", tk.END).strip().splitlines()
        for pdf_path in pdf_paths:
            pdf_path = pdf_path.strip('" ')
            if not os.path.isfile(pdf_path):
                self.log(f"❌ File not found: {pdf_path}")
                continue

            self.log(f"\n📂 Processing: {pdf_path}")
            download_info = extract_download_info(pdf_path)
            self.log(f"🔍 Files to download: {len(download_info)}")

            if not download_info:
                self.log("⚠️ No valid download links. Skipping.")
                continue

            folder_name = clean_filename(os.path.splitext(os.path.basename(pdf_path))[0])
            save_folder = os.path.join(os.path.dirname(pdf_path), folder_name)
            self.log(f"📁 Saving to: {save_folder}")

            download_files(download_info, save_folder, self.log, self.update_progress)
            self.progress_var.set(0)  # Reset before merge

            merge_all_pdfs_in_folder(save_folder, folder_name, self.log)

        self.log("\n✅ All downloads and merges completed.")
        self._stop_timer = True


if __name__ == "__main__":
    root = tk.Tk()
    app = PDFDownloaderGUI(root)
    root.mainloop()
