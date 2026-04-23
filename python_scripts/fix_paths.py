import os
import re

ROOT_DIR = r"C:\Users\Michael\OneDrive - purdue.edu\Desktop\Personal Projects\personal-website\docs"


def fix_paths_in_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Match quoted strings that contain backslashes
    pattern = r'(["\'])([^"\']*\\[^"\']*)(["\'])'

    def replace_match(match):
        quote1, path, quote2 = match.groups()
        fixed_path = path.replace("\\", "/")
        return f"{quote1}{fixed_path}{quote2}"

    new_content = re.sub(pattern, replace_match, content)

    if new_content != content:
        print(f"Fixing: {filepath}")
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
    else:
        print(f"No change: {filepath}")


def process_directory(root_dir):
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.lower().endswith(".html"):
                full_path = os.path.join(dirpath, filename)
                fix_paths_in_file(full_path)


if __name__ == "__main__":
    process_directory(ROOT_DIR)
