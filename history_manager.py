import os
from datetime import datetime


def save_history(user_message, bot_response):
    if not os.path.exists("history"):
        os.makedirs("history")

    current_date = datetime.now().strftime("%Y-%m-%d")
    file_path = f"history/conversation_{current_date}.txt"

    with open(file_path, "a", encoding="utf-8") as file:
        file.write(f"Usuario: {user_message}\n")
        file.write(f"Bot: {bot_response}\n")
        file.write("-" * 70)
        file.write("\n")


def format_recent_conversation(conversation):
    if not conversation:
        return "No hay conversación previa."

    text = ""

    for message in conversation[-6:]:
        role = message["role"]
        content = message["content"]

        if role == "user":
            text += f"Usuario: {content}\n"
        else:
            text += f"Bot: {content}\n"

    return text