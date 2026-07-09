import json
import os


MEMORY_FILE = "data/memory.json"


def ensure_memory_file():
    if not os.path.exists("data"):
        os.makedirs("data")

    if not os.path.exists(MEMORY_FILE):
        with open(MEMORY_FILE, "w", encoding="utf-8") as file:
            json.dump([], file, indent=4, ensure_ascii=False)


def load_memory():
    ensure_memory_file()

    with open(MEMORY_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def save_memory(memory_list):
    ensure_memory_file()

    with open(MEMORY_FILE, "w", encoding="utf-8") as file:
        json.dump(memory_list, file, indent=4, ensure_ascii=False)


def add_memory(fact):
    memory_list = load_memory()
    memory_list.append(fact)
    save_memory(memory_list)


def clear_memory():
    save_memory([])


def get_memory_text():
    memory_list = load_memory()

    if not memory_list:
        return "No hay memoria guardada."

    memory_text = ""

    for index, fact in enumerate(memory_list, start=1):
        memory_text += f"{index}. {fact}\n"

    return memory_text