import sys
import os
import re
import requests
import pdfplumber
from PyPDF2 import PdfMerger
import warnings
import time

warnings.filterwarnings("ignore", message="Unverified HTTPS request")

print("=" * 60)
print("PYTHON SCRIPT STARTED")
print("=" * 60)

def clean_filename(name):
    name = name.strip()
    name = re.sub(r'[\\/:"*?<>|]+', '_', name)
    name = name.replace('\n', ' ').replace('\r', ' ').strip()
    return name

def extract_download_info(pdf_path):
    download_info = []
    print(f"   Extracting links from: {pdf_path}")
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                tables = page.extract_tables()
                print(f"      Page {page_num + 1}: found {len(tables)} tables")
                for table in tables:
                    if not table or len(table) < 2:
                        continue
                    headers = table[0]
                    headers_lower = [str(h).lower() if h else "" for h in headers]

                    if "sl. no" in str(headers_lower) and ("download link" in str(headers_lower) or "click here" in str(headers_lower)):
                        print(f"      Found download table on page {page_num + 1}")
                        try:
                            name_idx = headers_lower.index("name")
                        except ValueError:
                            name_idx = 1
                        try:
                            link_idx = headers_lower.index("download link")
                        except ValueError:
                            try:
                                link_idx = headers_lower.index("click here")
                            except ValueError:
                                continue
                        
                        for row in table[1:]:
                            if len(row) <= max(name_idx, link_idx):
                                continue
                            name = row[name_idx] or "unnamed_file"
                            raw_link = (row[link_idx] or "").replace('\n', '').replace('\r', '').strip().replace(' ', '')
                            if raw_link.startswith("http"):
                                download_info.append((clean_filename(name), raw_link))
                                print(f"         Found link: {name[:30]}...")
    except Exception as e:
        print(f"   Error extracting from {pdf_path}: {e}")
    return download_info

def download_files(download_info, save_folder):
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
    downloaded = []
    
    for i, (name, url) in enumerate(download_info, 1):
        try:
            filename = clean_filename(name)
            full_path = os.path.join(save_folder, f"{filename}.pdf")
            base, ext = os.path.splitext(full_path)
            count = 1
            while os.path.exists(full_path):
                full_path = f"{base}({count}){ext}"
                count += 1

            print(f"   Downloading {i}/{total}: {filename}")
            resp = session.get(url, headers=headers, stream=True, verify=False, timeout=40, allow_redirects=True)
            resp.raise_for_status()

            content_type = resp.headers.get("Content-Type", "").lower()
            if "pdf" not in content_type:
                print(f"   Skipping {name}: Not PDF (Content-Type: {content_type})")
                continue

            with open(full_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            size_kb = os.path.getsize(full_path) // 1024
            print(f"   Downloaded: {os.path.basename(full_path)} ({size_kb} KB)")
            downloaded.append(full_path)

        except Exception as e:
            print(f"   Failed: {name} — {e}")

        time.sleep(0.5)
    
    return downloaded

def merge_pdfs(pdf_files, output_path):
    if not pdf_files:
        print("   No PDF files to merge")
        return None
    
    print(f"   Merging {len(pdf_files)} PDF files...")
    merger = PdfMerger()
    for pdf in pdf_files:
        try:
            merger.append(pdf)
            print(f"      Added: {os.path.basename(pdf)}")
        except Exception as e:
            print(f"      Failed to merge {pdf}: {e}")
    
    merger.write(output_path)
    merger.close()
    print(f"   Merged PDF created: {output_path}")
    return output_path

def process_pdfs(pdf_paths):
    all_downloaded_files = []
    
    for pdf_path in pdf_paths:
        pdf_path = pdf_path.strip()
        if not os.path.isfile(pdf_path):
            print(f"File not found: {pdf_path}")
            continue

        print(f"\nProcessing: {pdf_path}")
        download_info = extract_download_info(pdf_path)
        print(f"   Found {len(download_info)} links")

        if not download_info:
            continue

        folder_name = clean_filename(os.path.splitext(os.path.basename(pdf_path))[0])
        save_folder = os.path.join(os.path.dirname(pdf_path), folder_name)
        print(f"   Saving to folder: {save_folder}")
        
        downloaded = download_files(download_info, save_folder)
        all_downloaded_files.extend(downloaded)

    # Merge all downloaded PDFs
    if all_downloaded_files:
        merged_name = f"0_merged_{int(time.time())}.pdf"
        merged_path = os.path.join(os.path.dirname(pdf_paths[0]), merged_name)
        merge_pdfs(all_downloaded_files, merged_path)
        print(f"\nSUCCESS: Merged PDF created at {merged_path}")
        return merged_path
    else:
        print("\nNo PDFs were downloaded")
        return None

if __name__ == "__main__":
    # Check command line arguments
    if len(sys.argv) != 3:
        print("Usage: python download_cli.py <input_file> <output_file>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    print(f"Input file: {input_file}")
    print(f"Output file: {output_file}")
    
    # Read PDF paths from input file
    with open(input_file, 'r') as f:
        pdf_paths = [line.strip() for line in f if line.strip()]
    
    print(f"Received {len(pdf_paths)} PDF paths:")
    for i, path in enumerate(pdf_paths, 1):
        print(f"   {i}. {path}")
    
    if not pdf_paths:
        print("No PDF paths provided")
        sys.exit(1)
    
    print(f"\nProcessing {len(pdf_paths)} PDF files...")
    merged_file = process_pdfs(pdf_paths)
    
    if merged_file:
        # Write result to output file
        with open(output_file, 'w') as f:
            f.write(merged_file)
        print(f"PROCESSING COMPLETE - Result written to {output_file}")
        sys.exit(0)
    else:
        print("PROCESSING FAILED")
        sys.exit(1)