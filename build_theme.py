import os
import shutil
import zipfile
import re

source_dir = "/Users/rajaryan/Desktop/drop final"
theme_dir = "/Users/rajaryan/Desktop/drop final/lumitop-theme"

if os.path.exists(theme_dir):
    shutil.rmtree(theme_dir)

os.makedirs(f"{theme_dir}/layout")
os.makedirs(f"{theme_dir}/templates")
os.makedirs(f"{theme_dir}/assets")
os.makedirs(f"{theme_dir}/config")

shutil.copy(f"{source_dir}/styles.css", f"{theme_dir}/assets/styles.css")

with open(f"{source_dir}/app.js", "r") as f:
    app_js = f.read()

with open(f"{theme_dir}/assets/app.js.liquid", "w") as f:
    # Very rudimentary liquid replacement for JS strings
    app_js = app_js.replace("'images/product-1.jpg'", '"{{ \'product-1.jpg\' | asset_url }}"')
    f.write(app_js)

if os.path.exists(f"{source_dir}/images"):
    for img in os.listdir(f"{source_dir}/images"):
        if img.endswith(('.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp')):
            shutil.copy(f"{source_dir}/images/{img}", f"{theme_dir}/assets/{img}")

with open(f"{theme_dir}/config/settings_schema.json", "w") as f:
    f.write('[{"name": "theme_info","theme_name": "Lumitop Dropship Theme", "theme_author": "Antigravity", "theme_version": "1.0.0"}]')

with open(f"{source_dir}/index.html", "r") as f:
    html = f.read()

body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL | re.IGNORECASE)
head_match = re.search(r'<head[^>]*>(.*?)</head>', html, re.DOTALL | re.IGNORECASE)

if body_match and head_match:
    head_content = head_match.group(1)
    body_content = body_match.group(1)
    
    # 1. Provide absolute Shopify asset links in Head
    head_content = head_content.replace('<link rel="stylesheet" href="styles.css">', "{{ 'styles.css' | asset_url | stylesheet_tag }}")
    
    # 2. Build Layout (theme.liquid)
    theme_liquid = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n"
    theme_liquid += head_content
    theme_liquid += "\n    {{ content_for_header }}\n</head>\n"
    theme_liquid += "<body class=\"mobile-first\">\n    {{ content_for_layout }}\n</body>\n</html>"
    
    with open(f"{theme_dir}/layout/theme.liquid", "w") as f:
        f.write(theme_liquid)
        
    # 3. Clean up Image + JS Script URLs in Body (templates/index.liquid)
    body_content = re.sub(r'src="images/([^"]+)"', r'src="{{ \'\1\' | asset_url }}"', body_content)
    # The actual app.js is now app.js.liquid, but when served it is just .js
    body_content = body_content.replace('<script src="app.js"></script>', "{{ 'app.js' | asset_url | script_tag }}")
    
    with open(f"{theme_dir}/templates/index.liquid", "w") as f:
        f.write(body_content)

shutil.make_archive(theme_dir, 'zip', theme_dir)
print(f"Zip created at {theme_dir}.zip")

