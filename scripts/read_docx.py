import zipfile
import xml.etree.ElementTree as ET

try:
    docx_path = r'D:\qq\荆楚歌#2.docx'
    result = []
    with zipfile.ZipFile(docx_path) as z:
        with z.open('word/document.xml') as f:
            tree = ET.parse(f)
            root = tree.getroot()
            texts = root.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t')
            result.append('\n'.join([t.text for t in texts if t.text]))
    
    with open(r'C:\Users\welkin\Desktop\ArkProject\rule_document.md', 'w', encoding='utf-8') as f:
        f.write('\n'.join(result))
    print("SUCCESS")
except Exception as e:
    with open(r'C:\Users\welkin\Desktop\ArkProject\rule_document.md', 'w', encoding='utf-8') as f:
        f.write(str(e))
    print(f"FAILED: {e}")
