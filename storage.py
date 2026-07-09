import json
from datetime import datetime


def load_knowledge_base(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


def save_history(user_message, bot_response):
    current_date = datetime.now().strftime("%Y-%m-%d")
    file_path = f"history/conversation_{current_date}.txt"

    with open(file_path, "a", encoding="utf-8") as file:
        file.write(f"Usuario: {user_message}\n")
        file.write(f"Bot: {bot_response}\n")
        file.write("-" * 40)
        file.write("\n")